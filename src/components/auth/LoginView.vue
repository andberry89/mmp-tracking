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

      <button type="submit" :disabled="auth.isLoading">
        {{ auth.isLoading ? "Signing in…" : "Sign in" }}
      </button>
      <small>Accounts are provisioned by an Editor. There is no public sign-up.</small>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";

const emit = defineEmits<{ (event: "signed-in"): void }>();
const auth = useAuthStore();
const email = ref("");
const password = ref("");

async function handleSignIn() {
  if (await auth.signIn(email.value, password.value)) emit("signed-in");
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
