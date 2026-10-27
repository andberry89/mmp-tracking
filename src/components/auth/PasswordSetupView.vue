<template>
  <main class="login-shell">
    <form class="login-card" @submit.prevent="handleSubmit">
      <h1>Set your password</h1>
      <p>Choose a password for your MMP Tracking account.</p>

      <label for="new-password">New password</label>
      <input
        id="new-password"
        v-model="password"
        type="password"
        autocomplete="new-password"
        minlength="8"
        required
      />

      <label for="confirm-password">Confirm password</label>
      <input
        id="confirm-password"
        v-model="confirmation"
        type="password"
        autocomplete="new-password"
        minlength="8"
        required
      />

      <p v-if="formError || auth.error" class="login-error" role="alert">
        {{ formError || auth.error }}
      </p>

      <button type="submit" :disabled="auth.isLoading">
        {{ auth.isLoading ? "Saving…" : "Save password" }}
      </button>
      <small>Use at least 8 characters. Keep your password private.</small>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";

const emit = defineEmits<{ (event: "completed"): void }>();
const auth = useAuthStore();
const password = ref("");
const confirmation = ref("");
const formError = ref("");

async function handleSubmit() {
  formError.value = "";
  if (password.value !== confirmation.value) {
    formError.value = "The passwords do not match.";
    return;
  }

  if (await auth.setInitialPassword(password.value)) emit("completed");
}
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--color-background-sidebar);
}

.login-card {
  width: min(100%, 400px);
  display: grid;
  gap: 12px;
  padding: 28px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--white);
  box-shadow: 0 12px 36px rgb(0 0 0 / 8%);
}

.login-card h1,
.login-card p {
  margin: 0;
}

.login-card h1 {
  font-size: 1.6rem;
  font-weight: 700;
}

.login-card label {
  margin-top: 8px;
  font-weight: 600;
}

.login-card input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.login-card button {
  margin-top: 8px;
  padding: 10px 14px;
  border: 0;
  border-radius: 6px;
  background: #245a8d;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.login-card button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.login-card small {
  color: #64748b;
}

.login-error {
  color: #b42318;
}
</style>
