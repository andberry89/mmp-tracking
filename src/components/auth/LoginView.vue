<template>
  <main class="login-shell">
    <form class="login-card" @submit.prevent="handleSignIn">
      <h1>MMP Tracking</h1>
      <p>Sign in with your team account.</p>

      <label for="email">Email</label>
      <input id="email" v-model.trim="email" type="email" autocomplete="username" required />

      <label for="password">Password</label>
      <input
        id="password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        required
      />

      <p v-if="auth.error" class="login-error" role="alert">{{ auth.error }}</p>
      <p v-if="resetSent" class="login-success" role="status">
        If there is an account for that email, a password setup link will arrive shortly.
      </p>
      <p v-if="resetHint" class="login-hint" role="status">{{ resetHint }}</p>

      <button type="submit" :disabled="auth.isLoading">
        {{ auth.isLoading ? "Signing in…" : "Sign in" }}
      </button>
      <button
        type="button"
        class="reset-button"
        :disabled="auth.isLoading"
        @click="handlePasswordReset"
      >
        {{ isSendingReset ? "Sending link…" : "Forgot or need to set your password?" }}
      </button>
      <small>Accounts are provisioned by an Editor. There is no public sign-up.</small>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";

const emit = defineEmits<{ (event: "signed-in"): void }>();
const auth = useAuthStore();
const email = ref("");
const password = ref("");
const resetSent = ref(false);
const resetHint = ref("");
const isSendingReset = ref(false);

watch(email, () => {
  resetSent.value = false;
  resetHint.value = "";
});

async function handleSignIn() {
  if (await auth.signIn(email.value, password.value)) emit("signed-in");
}

async function handlePasswordReset() {
  resetHint.value = "";
  if (!email.value) {
    resetHint.value = "Enter the email address you were invited at first.";
    return;
  }

  isSendingReset.value = true;
  try {
    resetSent.value = await auth.sendPasswordReset(email.value);
  } finally {
    isSendingReset.value = false;
  }
}
</script>
