<template>
  <Popper
    v-if="hasAssets"
    class="assets-popper"
    placement="auto"
    offset-distance="8"
    locked
    arrow
    @open:popper="assetsVisible = true"
    @close:popper="assetsVisible = false"
  >
    <button
      type="button"
      class="asset-trigger"
      :aria-label="`${assets.length} task resources`"
      :aria-expanded="assetsVisible"
      aria-haspopup="dialog"
      :title="`${assets.length} task resources`"
    >
      <FolderOpenIcon v-if="assetsVisible" class="asset-trigger__icon" />
      <FolderIcon v-else class="asset-trigger__icon" />
    </button>

    <template #content>
      <section class="assets-panel" role="dialog" aria-label="Task resources">
        <h2 class="assets-panel__title">Resources <span>{{ assets.length }}</span></h2>
        <ul class="assets-list">
          <li v-for="(asset, idx) in assets" :key="asset.id || `${asset.url}-${idx}`" class="assets-list__item">
            <a class="asset-link" :href="asset.url" target="_blank" rel="noopener noreferrer">
              <span class="asset-link__label">{{ assetLabel(asset) }}</span>
              <span class="material-symbols-outlined asset-link__external" aria-label="Opens in a new tab">open_in_new</span>
            </a>
            <button
              v-if="canEdit"
              type="button"
              class="asset-remove"
              :aria-label="`Remove ${assetLabel(asset)}`"
              :title="`Remove ${assetLabel(asset)}`"
              @click="removeAsset(idx)"
            >
              ×
            </button>
          </li>
        </ul>

        <button
          v-if="canEdit"
          type="button"
          class="asset-add-toggle"
          :aria-expanded="showAddForm"
          :aria-controls="addFormId"
          @click="showAddForm = !showAddForm"
        >
          {{ showAddForm ? 'Cancel' : 'Add resource' }}
        </button>
        <form v-if="canEdit && showAddForm" :id="addFormId" class="asset-form" @submit.prevent="addAsset">
          <h3>New resource</h3>
          <label>
            Label
            <input v-model.trim="newNotes" placeholder="e.g. Press release" required />
          </label>
          <label>
            URL
            <input v-model.trim="newUrl" type="url" placeholder="https://…" required />
          </label>
          <label>
            Password (Editors only)
            <input v-model="newPassword" type="password" autocomplete="new-password" placeholder="Optional" />
          </label>
          <p v-if="assetError" class="asset-form__error" role="alert">{{ assetError }}</p>
          <button type="submit" class="asset-form__submit">Add resource</button>
        </form>
      </section>
    </template>
  </Popper>

  <span v-else class="asset-empty" role="img" aria-label="No resources" title="No resources">
    <FolderIcon class="asset-empty__icon" />
  </span>
</template>

<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { FolderIcon, FolderOpenIcon } from "@/assets/icons";
import type { TaskAsset, TaskResourceInput } from "@/types";

const props = defineProps<{
  assets: TaskAsset[];
  canEdit?: boolean;
}>();

const emit = defineEmits<{
  (e: "delete-asset", index: number): void;
  (e: "add-asset", asset: TaskResourceInput): void;
}>();

const assetsVisible = ref(false);
const addFormId = useId();
const newNotes = ref("");
const newUrl = ref("");
const newPassword = ref("");
const assetError = ref("");
const showAddForm = ref(false);
const hasAssets = computed(() => props.assets.length > 0);
const canEdit = computed(() => props.canEdit ?? true);

function assetLabel(asset: TaskAsset) {
  const label = asset.label?.trim() || asset.notes?.trim() || "";
  return asset.kind === "imeet" || /^iMeet$/i.test(label) ? "iMeet" : label || "Resource";
}

function removeAsset(index: number) {
  emit("delete-asset", index);
}

function addAsset() {
  const label = newNotes.value.trim();
  const url = newUrl.value.trim();
  if (!label) {
    assetError.value = "Add a label for this resource.";
    return;
  }
  if (!isValidUrl(url)) {
    assetError.value = "Enter a valid URL beginning with http:// or https://.";
    return;
  }

  const resource: TaskResourceInput = { label, url, notes: "", password: newPassword.value };
  emit("add-asset", resource);
  newNotes.value = "";
  newUrl.value = "";
  newPassword.value = "";
  assetError.value = "";
  showAddForm.value = false;
}

function isValidUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
</script>

<style scoped>
.asset-trigger,
.asset-empty {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
}
.asset-trigger { color: var(--black); cursor: pointer; transition: background-color 140ms ease, border-color 140ms ease, transform 140ms ease; }
.asset-trigger:hover, .asset-trigger:focus-visible { border-color: var(--color-border); background: var(--white); }
.asset-trigger:hover { transform: translateY(-1px); }
.asset-trigger:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }
.asset-trigger__icon { width: 20px; height: 20px; fill: currentColor; }
.asset-empty { color: var(--gray-light-2); cursor: not-allowed; }
.asset-empty__icon { width: 20px; height: 20px; fill: currentColor; }
.assets-popper :deep(.popper) {
  width: min(360px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  max-height: min(68vh, 560px);
  overflow-y: auto;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--white);
  color: var(--gray-dark-5);
  box-shadow: var(--color-surface-shadow-hover);
}
.assets-panel__title { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; color: var(--gray-dark-5); font: 700 0.95rem "Monda", sans-serif; }
.assets-panel__title span { color: var(--gray-light-4); font: 500 0.75rem "Asap", sans-serif; }
.assets-list { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.assets-list__item { display: flex; align-items: center; gap: 6px; min-height: 36px; padding: 2px 4px 2px 8px; border-radius: 5px; }
.assets-list__item:hover { background: var(--white-soft); }
.asset-link { display: flex; min-width: 0; flex: 1; align-items: center; justify-content: space-between; gap: 12px; color: var(--color-body-link); text-decoration: none; }
.asset-link:hover { color: var(--color-body-link-hover); text-decoration: underline; }
.asset-link__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.88rem; }
.asset-link__external { flex: 0 0 auto; color: var(--gray-light-4); font-size: 16px; }
.asset-remove { display: grid; width: 26px; height: 26px; flex: 0 0 26px; place-items: center; border: 0; border-radius: 5px; background: transparent; color: var(--gray-light-4); cursor: pointer; font-size: 1.2rem; line-height: 1; }
.asset-remove:hover { background: color-mix(in srgb, var(--red) 9%, white); color: var(--red-dark); }
.asset-form { display: grid; gap: 9px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--color-divider); }
.asset-add-toggle { justify-self: start; margin-top: 8px; padding: 6px 9px; border: 1px solid var(--color-form-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-3); cursor: pointer; font: 600 0.8rem "Asap", sans-serif; }
.asset-add-toggle:hover { border-color: var(--color-focus-ring); color: var(--gray-dark-5); }
.asset-form h3 { margin: 0; color: var(--gray-dark-4); font: 700 0.86rem "Asap", sans-serif; }
.asset-form label { display: grid; gap: 4px; color: var(--gray-dark-3); font-size: 0.75rem; font-weight: 600; }
.asset-form input { width: 100%; min-width: 0; height: 34px; padding: 0 9px; border: 1px solid var(--color-form-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-5); font: 400 0.84rem "Asap", sans-serif; }
.asset-form input:focus-visible { border-color: var(--color-focus-ring); outline: 2px solid color-mix(in srgb, var(--color-focus-ring) 25%, transparent); outline-offset: 1px; }
.asset-form__error { margin: 0; color: #a63c32; font-size: 0.78rem; }
.asset-form__submit { min-height: 34px; padding: 0 12px; border: 0; border-radius: 5px; background: var(--green-2); color: var(--white); cursor: pointer; font: 700 0.84rem "Asap", sans-serif; }
.asset-form__submit:hover { filter: brightness(0.96); }
</style>
