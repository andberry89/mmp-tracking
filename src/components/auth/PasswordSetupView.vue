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
