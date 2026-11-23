import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const localOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function allowedOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;

  const configuredOrigins = Deno.env.get("APP_ALLOWED_ORIGINS")?.split(",") ?? [];
  const allowedOrigins = new Set([...localOrigins, ...configuredOrigins]
    .map((value) => normalizeOrigin(value.trim()))
    .filter(Boolean));
  return allowedOrigins.has(normalizeOrigin(origin)) ? origin : "";
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
  if (request.method !== "POST") return respond(request, 405, { error: "Use POST to generate a recovery code." });

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return respond(request, 401, { error: "Sign in as an Editor to generate a recovery code." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Recovery code function is missing Supabase environment settings.");
    return respond(request, 500, { error: "Recovery code service is not configured." });
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
    console.error("Could not verify recovery code sender role:", callerAccessError.message);
    return respond(request, 500, { error: "Could not verify Editor access." });
  }
  const { data: callerProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", callerData.user.id)
    .maybeSingle();
  if (profileError) {
    console.error("Could not verify recovery code sender profile:", profileError.message);
    return respond(request, 500, { error: "Could not verify Editor access." });
  }
  if (!callerAccess?.active || callerAccess.role !== "editor" || callerProfile?.role !== "editor") {
    return respond(request, 403, { error: "Only active Editors can generate recovery codes." });
  }

  let body: { email?: unknown };
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return respond(request, 400, { error: "Provide the approved account email address." });
    }
    body = parsed as { email?: unknown };
  } catch {
    return respond(request, 400, { error: "Provide the approved account email address." });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return respond(request, 400, { error: "Enter a valid email address." });

  const { data: approvedUser, error: approvalError } = await adminClient
    .from("allowed_users")
    .select("active")
    .eq("email", email)
    .maybeSingle();
  if (approvalError) {
    console.error("Could not verify recovery code recipient:", approvalError.message);
    return respond(request, 500, { error: "Could not verify that email's access." });
  }
  if (!approvedUser?.active) return respond(request, 403, { error: "Only active approved accounts can receive a recovery code." });

  const { data, error: generateError } = await adminClient.auth.admin.generateLink({ type: "recovery", email });
  if (generateError) {
    console.error("Supabase recovery code generation failed:", generateError.message);
    return respond(request, 400, { error: "Could not generate a recovery code for this account." });
  }

  return respond(request, 200, { code: data.properties.email_otp });
});
