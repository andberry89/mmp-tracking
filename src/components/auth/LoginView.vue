<template>
  <main class="login-shell">
    <form class="login-card" @submit.prevent="recoveryMode ? handleVerifyCode() : handleSignIn()">
      <h1>{{ recoveryMode ? "Enter your recovery code" : "MMP Tracking" }}</h1>
      <p>{{ recoveryMode ? "Enter the 6–10 digit code from your password reset email or Editor." : "Sign in with your team account." }}</p>

      <template v-if="recoveryMode">
        <label for="email">Email</label>
        <input id="email" v-model.trim="email" type="email" autocomplete="username" required />

        <label for="recovery-code">Recovery code</label>
        <input
          id="recovery-code"
          v-model.trim="recoveryCode"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          pattern="[0-9]{6,10}"
          minlength="6"
          maxlength="10"
          required
        />
      </template>

      <template v-else>
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
      </template>

      <ErrorNotice v-if="auth.error" compact>{{ auth.error }}</ErrorNotice>
      <p v-if="resetRequestSent" class="login-success" role="status">
        If there is an account for that email, a recovery code will arrive shortly.
      </p>
      <p v-if="resetHint" class="login-hint" role="status">{{ resetHint }}</p>

      <button type="submit" :disabled="auth.isLoading">
        {{ auth.isLoading ? (recoveryMode ? "Checking code…" : "Signing in…") : (recoveryMode ? "Continue" : "Sign in") }}
      </button>
      <button
        v-if="!recoveryMode"
        type="button"
        class="reset-button"
        :disabled="auth.isLoading"
        @click="handlePasswordReset"
      >
        {{ isSendingReset ? "Sending code…" : "Forgot or need to set your password?" }}
      </button>
      <button
        v-if="!recoveryMode"
        type="button"
        class="reset-button"
        @click="startRecoveryCodeEntry"
      >
        I already have a recovery code
      </button>
      <button v-else type="button" class="reset-button" @click="returnToSignIn">Back to sign in</button>
      <small>Accounts are provisioned by an Editor. There is no public sign-up.</small>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import ErrorNotice from "@/components/common/ErrorNotice.vue";

const emit = defineEmits<{ (event: "signed-in"): void }>();
const auth = useAuthStore();
const email = ref("");
const password = ref("");
const recoveryCode = ref("");
const recoveryMode = ref(false);
const resetRequestSent = ref(false);
const resetHint = ref("");
const isSendingReset = ref(false);

watch(email, () => {
  resetRequestSent.value = false;
  resetHint.value = "";
});

async function handleSignIn() {
  if (await auth.signIn(email.value, password.value)) emit("signed-in");
}

async function handleVerifyCode() {
  await auth.verifyPasswordResetCode(email.value, recoveryCode.value);
}

function returnToSignIn() {
  recoveryMode.value = false;
  resetRequestSent.value = false;
  recoveryCode.value = "";
  resetHint.value = "";
  auth.error = null;
}

function startRecoveryCodeEntry() {
  recoveryMode.value = true;
  recoveryCode.value = "";
  resetRequestSent.value = false;
  resetHint.value = "";
}

async function handlePasswordReset() {
  resetHint.value = "";
  if (!email.value) {
    resetHint.value = "Enter the email address you were invited at first.";
    return;
  }

  isSendingReset.value = true;
  try {
    resetRequestSent.value = await auth.sendPasswordReset(email.value);
    recoveryMode.value = resetRequestSent.value;
  } finally {
    isSendingReset.value = false;
  }
}
</script>
