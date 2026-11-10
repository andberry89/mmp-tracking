import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { Session } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const SESSION_STARTED_AT_KEY = "mmp-tracking.session-started-at";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_TIMEOUT_MS = 2_147_483_647;

export type AppRole = "editor" | "viewer";

interface UserProfile {
  id: string;
  display_name: string | null;
  role: AppRole;
}

export const useAuthStore = defineStore("auth", () => {
  const initialAuthType = new URLSearchParams(window.location.hash.slice(1)).get("type")
    ?? new URLSearchParams(window.location.search).get("type");
  const session = ref<Session | null>(null);
  const profile = ref<UserProfile | null>(null);
  const needsPasswordSetup = ref(initialAuthType === "invite" || initialAuthType === "recovery");
  const isReady = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isEditor = computed(() => profile.value?.role === "editor");

  let authSubscription: { unsubscribe: () => void } | null = null;
  let sessionExpiryTimer: number | null = null;

  function clearSessionExpiryTimer() {
    if (sessionExpiryTimer !== null) window.clearTimeout(sessionExpiryTimer);
    sessionExpiryTimer = null;
  }

  function sessionStartedAt() {
    const savedValue = Number(window.localStorage.getItem(SESSION_STARTED_AT_KEY));
    if (Number.isFinite(savedValue) && savedValue > 0 && savedValue <= Date.now()) return savedValue;

    const startedAt = Date.now();
    window.localStorage.setItem(SESSION_STARTED_AT_KEY, String(startedAt));
    return startedAt;
  }

  async function expireSession() {
    clearSessionExpiryTimer();
    if (!supabase) return;

    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    if (signOutError) {
      error.value = `Your sign-in period has ended, but sign-out failed: ${signOutError.message}`;
      return;
    }

    window.localStorage.removeItem(SESSION_STARTED_AT_KEY);
    session.value = null;
    profile.value = null;
    error.value = "Your 30-day sign-in period ended. Please sign in again.";
  }

  function enforceSessionAge(nextSession: Session | null, resetAge = false) {
    clearSessionExpiryTimer();
    if (!nextSession) {
      window.localStorage.removeItem(SESSION_STARTED_AT_KEY);
      return false;
    }

    if (resetAge) window.localStorage.setItem(SESSION_STARTED_AT_KEY, String(Date.now()));
    const remainingMs = SESSION_MAX_AGE_MS - (Date.now() - sessionStartedAt());
    if (remainingMs <= 0) {
      void expireSession();
      return false;
    }

    sessionExpiryTimer = window.setTimeout(
      () => enforceSessionAge(session.value),
      Math.min(remainingMs, MAX_TIMEOUT_MS),
    );
    return true;
  }

  async function loadProfile(userId: string) {
    if (!supabase) return;

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;
    profile.value = (data as UserProfile | null) ?? null;
  }

  async function initializeAuth() {
    if (!isSupabaseConfigured || !supabase) {
      isReady.value = true;
      return;
    }

    isLoading.value = true;
    error.value = null;
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      session.value = data.session;
      const sessionIsValid = enforceSessionAge(data.session);
      if (data.session && sessionIsValid) await loadProfile(data.session.user.id);

      if (!authSubscription) {
        const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
          const sessionIsValid = enforceSessionAge(nextSession, event === "SIGNED_IN");
          session.value = sessionIsValid ? nextSession : null;
          if (!nextSession || !sessionIsValid) {
            profile.value = null;
            return;
          }

          // Defer the profile query until Supabase finishes its auth callback.
          window.setTimeout(() => {
            void loadProfile(nextSession.user.id).catch((reason: unknown) => {
              error.value = reason instanceof Error ? reason.message : "Unable to load account role.";
            });
          }, 0);
        });
        authSubscription = listener.subscription;
      }
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "Unable to initialize sign-in.";
    } finally {
      isLoading.value = false;
      isReady.value = true;
    }
  }

  async function signIn(email: string, password: string) {
    if (!supabase) {
      error.value = "Supabase is not configured.";
      return false;
    }

    isLoading.value = true;
    error.value = null;
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      session.value = data.session;
      enforceSessionAge(data.session, true);
      if (data.session) await loadProfile(data.session.user.id);
      if (!profile.value) throw new Error("This account has no app role. Ask an Editor to provision it.");
      return true;
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "Unable to sign in.";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function signOut() {
    if (supabase) {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        error.value = signOutError.message;
        return;
      }
    }
    clearSessionExpiryTimer();
    window.localStorage.removeItem(SESSION_STARTED_AT_KEY);
    session.value = null;
    profile.value = null;
  }

  async function setInitialPassword(password: string) {
    if (!supabase) {
      error.value = "Supabase is not configured.";
      return false;
    }

    isLoading.value = true;
    error.value = null;
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      needsPasswordSetup.value = false;
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "Unable to set your password.";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function sendPasswordReset(email: string) {
    if (!supabase) {
      error.value = "Supabase is not configured.";
      return false;
    }

    isLoading.value = true;
    error.value = null;
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (resetError) throw resetError;
      return true;
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "Unable to request a password reset.";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateDisplayName(displayName: string) {
    if (!supabase || !profile.value) {
      error.value = "Unable to update your account settings.";
      return false;
    }

    isLoading.value = true;
    error.value = null;
    const normalizedName = displayName.trim() || null;
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ display_name: normalizedName })
        .eq("id", profile.value.id);
      if (updateError) throw updateError;
      profile.value = { ...profile.value, display_name: normalizedName };
      return true;
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "Unable to update your display name.";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    session,
    profile,
    needsPasswordSetup,
    isReady,
    isLoading,
    error,
    isEditor,
    initializeAuth,
    signIn,
    setInitialPassword,
    sendPasswordReset,
    updateDisplayName,
    signOut,
  };
});
