<template>
  <BaseModal v-model="localOpen" title="Account settings" size="md" @close="$emit('close')">
    <section class="settings-content">
      <form class="settings-form" @submit.prevent="saveName">
        <p class="intro">Your name appears in the app instead of your email address.</p>
        <label>Email address
          <input :value="email" type="email" disabled />
        </label>
        <label>Display name
          <input v-model.trim="displayName" type="text" autocomplete="name" placeholder="First Last" />
        </label>
        <p v-if="error" class="message message--error" role="alert">{{ error }}</p>
        <p v-if="notice" class="message message--success" role="status">{{ notice }}</p>
        <button class="primary-button" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save name' }}</button>
      </form>

      <section class="password-section">
        <h3>Password</h3>
        <p>We’ll email you a secure link to reset your password.</p>
        <button class="secondary-button" type="button" :disabled="sendingReset" @click="sendReset">{{ sendingReset ? 'Sending…' : 'Email password reset link' }}</button>
      </section>
    </section>

    <template #footer>
      <div class="modal-footer"><button type="button" class="secondary-button" @click="$emit('close')">Close</button></div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BaseModal from "@/components/common/BaseModal.vue";
import { useAuthStore } from "@/stores/auth";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "close"): void;
}>();

const authStore = useAuthStore();
const localOpen = computed({ get: () => props.modelValue, set: (value: boolean) => emit("update:modelValue", value) });
const email = computed(() => authStore.session?.user.email ?? "");
const displayName = ref("");
const saving = ref(false);
const sendingReset = ref(false);
const error = ref("");
const notice = ref("");

watch(() => props.modelValue, (open) => {
  if (!open) return;
  displayName.value = authStore.profile?.display_name ?? "";
  error.value = "";
  notice.value = "";
});

async function saveName() {
  saving.value = true;
  error.value = "";
  notice.value = "";
  if (await authStore.updateDisplayName(displayName.value)) {
    notice.value = "Display name saved.";
  } else {
    error.value = authStore.error || "Unable to save your display name.";
  }
  saving.value = false;
}

async function sendReset() {
  if (!email.value) return;
  sendingReset.value = true;
  error.value = "";
  notice.value = "";
  if (await authStore.sendPasswordReset(email.value)) {
    notice.value = `Password reset link sent to ${email.value}.`;
  } else {
    error.value = authStore.error || "Unable to send a password reset link.";
  }
  sendingReset.value = false;
}
</script>

<style scoped>
.settings-content { display: grid; gap: 20px; }
.settings-form { display: grid; gap: 11px; }
.intro, .password-section p { margin: 0; color: var(--gray-light-4); font-size: .84rem; line-height: 1.45; }
label { display: grid; gap: 5px; color: var(--gray-dark-3); font-size: .78rem; font-weight: 600; }
input { min-height: 36px; padding: 7px 9px; border: 1px solid var(--color-form-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-5); font: 400 .84rem "Asap", sans-serif; }
input:disabled { background: var(--white-soft); color: var(--gray-light-4); }
.primary-button, .secondary-button { min-height: 36px; justify-self: start; padding: 0 11px; border-radius: 5px; font: 600 .8rem "Asap", sans-serif; cursor: pointer; }
.primary-button { border: 1px solid transparent; background: var(--green-2); color: var(--white); }
.secondary-button { border: 1px solid var(--color-form-border); background: var(--white); color: var(--gray-dark-3); }
button:disabled { opacity: .55; cursor: not-allowed; }
.password-section { display: grid; justify-items: start; gap: 8px; padding-top: 15px; border-top: 1px solid var(--color-border); }
.password-section h3 { margin: 0; color: var(--gray-dark-5); font-size: .95rem; }
.message { margin: 0; padding: 9px 11px; border-radius: 5px; font-size: .82rem; }
.message--error { background: #fff1ef; color: #8d3930; }
.message--success { background: #f2f8ef; color: #42663b; }
.modal-footer { display: flex; justify-content: flex-end; }
</style>
