import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const localOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

function allowedOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;

  const configuredOrigins = Deno.env.get("APP_ALLOWED_ORIGINS")?.split(",") ?? [];
  const allowedOrigins = new Set([...localOrigins, ...configuredOrigins]
    .map((value) => normalizeOrigin(value.trim()))
    .filter(Boolean));
  return allowedOrigins.has(normalizeOrigin(origin)) ? origin : "";
}

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function corsHeaders(request: Request) {
  const origin = allowedOrigin(request);
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function respond(request: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.headers.has("Origin") && !allowedOrigin(request)) {
    return new Response("Origin is not allowed.", { status: 403, headers: { Vary: "Origin" } });
  }
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return respond(request, 405, { error: "Use POST to send an invitation." });

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return respond(request, 401, { error: "Sign in as an Editor to send invitations." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Invitation function is missing Supabase environment settings.");
    return respond(request, 500, { error: "Invitation service is not configured." });
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerData.user?.email) return respond(request, 401, { error: "Your session could not be verified. Sign in again." });

  const callerEmail = callerData.user.email.trim().toLowerCase();
  const { data: callerAccess, error: callerAccessError } = await adminClient
    .from("allowed_users")
    .select("role, active")
    .eq("email", callerEmail)
    .maybeSingle();
  if (callerAccessError) {
    console.error("Could not verify invitation sender role:", callerAccessError.message);
    return respond(request, 500, { error: "Could not verify Editor access." });
  }
  if (!callerAccess?.active || callerAccess.role !== "editor") {
    return respond(request, 403, { error: "Only active Editors can send invitations." });
  }
  const { data: callerProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", callerData.user.id)
    .maybeSingle();
  if (profileError) {
    console.error("Could not verify invitation sender profile:", profileError.message);
    return respond(request, 500, { error: "Could not verify Editor access." });
  }
  if (callerProfile?.role !== "editor") return respond(request, 403, { error: "Only active Editors can send invitations." });

  let body: { email?: unknown };
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return respond(request, 400, { error: "Provide the approved email address to invite." });
    }
    body = parsed as { email?: unknown };
  } catch {
    return respond(request, 400, { error: "Provide the approved email address to invite." });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return respond(request, 400, { error: "Enter a valid email address." });

  const { data: approvedUser, error: approvalError } = await adminClient
    .from("allowed_users")
    .select("active, display_name")
    .eq("email", email)
    .maybeSingle();
  if (approvalError) {
    console.error("Could not verify invitation recipient:", approvalError.message);
    return respond(request, 500, { error: "Could not verify that email's approval." });
  }
  if (!approvedUser?.active) return respond(request, 403, { error: "Approve this active email in Manage Users before inviting it." });

  const suggestedName = email.match(/^([a-z][a-z'-]*)\.([a-z][a-z'-]*)@hearst\.com$/i);
  const capitalizeNamePart = (part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  const displayName = approvedUser.display_name || (suggestedName
    ? `${capitalizeNamePart(suggestedName[1])} ${capitalizeNamePart(suggestedName[2])}`
    : undefined);
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: displayName ? { display_name: displayName } : {},
  });
  if (inviteError) {
    console.error("Supabase Auth invitation failed:", inviteError.message);
    return respond(request, 400, { error: inviteError.message });
  }

  return respond(request, 200, { sent: true });
});
