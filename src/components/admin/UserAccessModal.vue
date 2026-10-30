<template>
  <BaseModal v-model="localOpen" title="Manage user access" size="wide" @close="$emit('close')">
    <section class="user-access">
      <p class="intro">Approve team email addresses, choose app roles, and send sign-in invitations.</p>

      <form class="add-user" @submit.prevent="addUser">
        <label>Email address
          <input v-model.trim="newEmail" type="email" autocomplete="off" required placeholder="name@company.com" @input="suggestNewDisplayName" />
        </label>
        <label>Display name
          <input v-model.trim="newDisplayName" type="text" autocomplete="off" placeholder="Optional" @input="newDisplayNameEdited = true" />
        </label>
        <label>Author link
          <select v-model="newAuthorId"><option :value="null">No author link</option><option v-for="author in authors" :key="author.id" :value="author.id">{{ author.label }}{{ author.active ? '' : ' · inactive' }}</option></select>
        </label>
        <label>Role
          <select v-model="newRole">
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
        </label>
        <button class="primary-button" type="submit" :disabled="saving || loading">{{ adding ? 'Adding…' : '＋ Add approved email' }}</button>
      </form>

      <p v-if="error" class="message message--error" role="alert">{{ error }}</p>
      <p v-if="notice" class="message message--success" role="status">{{ notice }}</p>

      <div v-if="loading" class="loading-state"><span class="spinner" aria-hidden="true"></span>Loading approved users…</div>
      <div v-else-if="!users.length" class="empty-state">No approved users yet.</div>
      <div v-else class="user-table-wrap">
        <table class="user-table">
          <thead><tr><th>Name / Email</th><th>Author link</th><th>Role</th><th>Access</th><th></th></tr></thead>
          <tbody>
            <tr v-for="user in users" :key="user.email">
              <td data-label="Name / Email">
                <input v-model.trim="user.display_name" class="display-name-input" type="text" aria-label="User display name" placeholder="Add a display name" />
                <span class="account-email">{{ user.email }}</span>
                <span class="account-state">{{ user.invitation_sent || user.invitation_pending ? 'Invitation sent · awaiting setup' : user.has_account ? 'Account exists' : 'Approved · invitation not sent' }}</span>
              </td>
              <td data-label="Author link"><select v-model="user.author_id" :disabled="savingEmail === user.email || invitingEmail === user.email" aria-label="Linked author"><option :value="null">No author link</option><option v-for="author in authors" :key="author.id" :value="author.id">{{ author.label }}{{ author.active ? '' : ' · inactive' }}</option></select></td>
              <td data-label="Role"><select v-model="user.role" :disabled="savingEmail === user.email || invitingEmail === user.email"><option value="viewer">Viewer</option><option value="editor">Editor</option></select></td>
              <td data-label="Access"><select v-model="user.active" :disabled="savingEmail === user.email"><option :value="true">Active</option><option :value="false">Inactive</option></select></td>
              <td class="actions-cell" data-label="Actions">
                <button v-if="!user.has_account && user.active" class="save-button" type="button" :disabled="savingEmail === user.email || invitingEmail === user.email" @click="sendInvitation(user)">{{ invitingEmail === user.email ? 'Sending…' : 'Send invite' }}</button>
                <button class="save-button" type="button" :disabled="savingEmail === user.email || invitingEmail === user.email" @click="saveUser(user)">{{ savingEmail === user.email ? 'Saving…' : 'Save' }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <template #footer>
      <div class="modal-footer"><button type="button" class="secondary-button" @click="$emit('close')">Close</button></div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BaseModal from "@/components/common/BaseModal.vue";
import { supabase } from "@/lib/supabase";
import type { AppRole } from "@/stores/auth";

interface ManagedUser {
  email: string;
  role: AppRole;
  active: boolean;
  has_account: boolean;
  invitation_pending: boolean;
  display_name: string | null;
  author_id: string | null;
  invitation_sent?: boolean;
}

interface AuthorOption {
  id: string;
  label: string;
  active: boolean;
}

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "close"): void;
}>();

const localOpen = computed({ get: () => props.modelValue, set: (value: boolean) => emit("update:modelValue", value) });
const users = ref<ManagedUser[]>([]);
const authors = ref<AuthorOption[]>([]);
const newEmail = ref("");
const newDisplayName = ref("");
const newAuthorId = ref<string | null>(null);
const newDisplayNameEdited = ref(false);
const newRole = ref<AppRole>("viewer");
const loading = ref(false);
const saving = ref(false);
const adding = ref(false);
const savingEmail = ref("");
const invitingEmail = ref("");
const error = ref("");
const notice = ref("");

watch(() => props.modelValue, (open) => {
  if (!open) return;
  notice.value = "";
  void loadUsers();
});

async function loadUsers() {
  if (!supabase) return;
  loading.value = true;
  error.value = "";
  try {
    const [userResult, authorResult] = await Promise.all([
      supabase.rpc("list_allowed_users"),
      supabase.from("authors").select("id, label, active").order("label"),
    ]);
    const { data, error: loadError } = userResult;
    if (loadError) throw loadError;
    if (authorResult.error) throw authorResult.error;
    authors.value = authorResult.data ?? [];
    users.value = (data ?? []).map((user) => ({
      email: user.email,
      role: user.assigned_role as AppRole,
      active: user.active,
      has_account: user.has_account,
      invitation_pending: user.invitation_pending,
      display_name: user.display_name || suggestDisplayName(user.email),
      author_id: user.author_id,
      invitation_sent: false,
    })) as ManagedUser[];
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "Could not load approved users.";
  } finally {
    loading.value = false;
  }
}

async function addUser() {
  if (!supabase) return;
  adding.value = true;
  saving.value = true;
  error.value = "";
  notice.value = "";
  try {
    const { error: saveError } = await supabase.rpc("save_allowed_user", {
      p_email: newEmail.value,
      p_role: newRole.value,
      p_active: true,
      p_display_name: newDisplayName.value || null,
      p_author_id: newAuthorId.value,
    });
    if (saveError) throw saveError;
    notice.value = `${newDisplayName.value || newEmail.value} is approved. Use Send invite in the list to email them.`;
    newEmail.value = "";
    newDisplayName.value = "";
    newAuthorId.value = null;
    newDisplayNameEdited.value = false;
    newRole.value = "viewer";
    await loadUsers();
  } catch (reason) {
    error.value = await errorMessage(reason, "Could not approve this email.");
  } finally {
    adding.value = false;
    saving.value = false;
  }
}

async function saveUser(user: ManagedUser) {
  if (!supabase) return;
  savingEmail.value = user.email;
  error.value = "";
  notice.value = "";
  try {
    const { error: saveError } = await supabase.rpc("save_allowed_user", {
      p_email: user.email,
      p_role: user.role,
      p_active: user.active,
      p_display_name: user.display_name || null,
      p_author_id: user.author_id,
    });
    if (saveError) throw saveError;
    notice.value = `Access updated for ${user.email}.`;
    await loadUsers();
  } catch (reason) {
    error.value = await errorMessage(reason, "Could not update this user.");
  } finally {
    savingEmail.value = "";
  }
}

async function sendInvitation(user: ManagedUser) {
  if (!supabase) return;
  invitingEmail.value = user.email;
  error.value = "";
  notice.value = "";
  try {
    const { error: saveError } = await supabase.rpc("save_allowed_user", {
      p_email: user.email,
      p_role: user.role,
      p_active: user.active,
      p_display_name: user.display_name || null,
      p_author_id: user.author_id,
    });
    if (saveError) throw saveError;
    const { error: inviteError } = await supabase.functions.invoke("send-user-invitation", {
      body: { email: user.email },
    });
    if (inviteError) throw inviteError;
    user.has_account = true;
    user.invitation_sent = true;
    notice.value = `Invitation sent to ${user.email}.`;
  } catch (reason) {
    error.value = await errorMessage(reason, `Could not send an invitation to ${user.email}.`);
  } finally {
    invitingEmail.value = "";
  }
}

function suggestDisplayName(email: string) {
  const match = email.trim().match(/^([a-z][a-z'-]*)\.([a-z][a-z'-]*)@hearst\.com$/i);
  if (!match) return "";
  const titleCase = (part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  return `${titleCase(match[1])} ${titleCase(match[2])}`;
}

function suggestNewDisplayName() {
  if (newDisplayNameEdited.value) return;
  newDisplayName.value = suggestDisplayName(newEmail.value);
}
async function errorMessage(reason: unknown, fallback: string) {
  if (reason && typeof reason === "object" && "context" in reason) {
    const context = (reason as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        const payload = await context.clone().json() as { error?: unknown; message?: unknown };
        if (typeof payload.error === "string" && payload.error.trim()) return payload.error;
        if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
      } catch {
        // Fall through to the error object's own message.
      }
    }
  }
  if (reason instanceof Error) return reason.message;
  if (reason && typeof reason === "object" && "message" in reason) {
    const message = (reason as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (typeof reason === "string" && reason.trim()) return reason;
  return fallback;
}
</script>

<style scoped>
.user-access { display: grid; gap: 14px; }
.intro { margin: 0; color: var(--gray-light-4); font-size: .85rem; line-height: 1.45; }
.add-user { display: grid; grid-template-columns: minmax(175px, 1fr) minmax(140px, .8fr) minmax(140px, .8fr) 125px auto; align-items: end; gap: 10px; padding: 13px; border: 1px solid var(--color-border); border-radius: 7px; background: var(--white-soft); }
label { display: grid; gap: 5px; color: var(--gray-dark-3); font-size: .78rem; font-weight: 600; }
input, select { min-width: 0; min-height: 36px; padding: 7px 9px; border: 1px solid var(--color-form-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-5); font: 400 .84rem "Asap", sans-serif; }
.primary-button, .secondary-button, .save-button { min-height: 36px; padding: 0 11px; border-radius: 5px; font: 600 .8rem "Asap", sans-serif; cursor: pointer; white-space: nowrap; }
.primary-button { border: 1px solid transparent; background: var(--green-2); color: var(--white); }
.secondary-button, .save-button { border: 1px solid var(--color-form-border); background: var(--white); color: var(--gray-dark-3); }
button:disabled { opacity: .55; cursor: not-allowed; }
.user-table-wrap { overflow: visible; border: 1px solid var(--color-border); border-radius: 7px; background: var(--white); }
.user-table { width: 100%; min-width: 0; table-layout: fixed; border-collapse: collapse; text-align: left; font-size: .82rem; }
.user-table th, .user-table td { padding: 9px 11px; border-bottom: 1px solid var(--color-border); }
.user-table td { vertical-align: top; }
.user-table th { position: sticky; top: 0; background: var(--white-soft); color: var(--gray-light-4); font-size: .72rem; }
.user-table tbody tr:last-child td { border-bottom: 0; }
.user-table th:nth-child(1) { width: 27%; }
.user-table th:nth-child(2) { width: 22%; }
.user-table th:nth-child(3), .user-table th:nth-child(4) { width: 13%; }
.user-table th:nth-child(5) { width: 25%; }
.user-table td:first-child { min-width: 0; overflow-wrap: anywhere; }
.user-table td select { width: 100%; max-width: 100%; padding-inline: 5px; }
.display-name-input { width: 100%; min-width: 0; min-height: 36px; font-weight: 600; }
.account-email { display: block; margin-top: 3px; color: var(--gray-dark-3); font-size: .76rem; }
.actions-cell { white-space: normal; }
.actions-cell .save-button { padding-inline: 7px; }
.actions-cell .save-button + .save-button { margin-left: 5px; }
.user-table td:first-child strong, .account-state { display: block; }
.account-state { margin-top: 3px; color: var(--gray-light-4); font-size: .72rem; }
.loading-state, .empty-state { display: flex; justify-content: center; align-items: center; gap: 9px; min-height: 72px; color: var(--gray-light-4); font-size: .84rem; }
.spinner { width: 16px; height: 16px; border: 2px solid #dce8d8; border-top-color: var(--green-2); border-radius: 50%; animation: spin .75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.message { margin: 0; padding: 9px 11px; border-radius: 5px; font-size: .82rem; }
.message--error { background: #fff1ef; color: #8d3930; }
.message--success { background: #f2f8ef; color: #42663b; }
.modal-footer { display: flex; justify-content: flex-end; }
@media (max-width: 950px) { .add-user { grid-template-columns: repeat(2, minmax(0, 1fr)); } .add-user .primary-button { justify-self: start; } }
@media (max-width: 700px) {
  .add-user { grid-template-columns: 1fr; }
  .user-table thead { display: none; }
  .user-table, .user-table tbody, .user-table tr, .user-table td { display: block; width: 100%; }
  .user-table tr { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; padding: 10px; border-bottom: 1px solid var(--color-border); }
  .user-table td { padding: 2px; border: 0; }
  .user-table td.actions-cell { display: block; }
  .user-table td:first-child { grid-column: 1 / -1; }
  .user-table td::before { content: attr(data-label); display: block; margin-bottom: 4px; color: var(--gray-light-4); font-size: .68rem; font-weight: 600; }
  .user-table td:first-child::before { display: none; }
  .user-table .actions-cell { grid-column: 1 / -1; }
}
</style>
