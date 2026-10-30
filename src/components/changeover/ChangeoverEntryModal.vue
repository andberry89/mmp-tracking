<template>
  <BaseModal v-model="localModel" :title="mode === 'add' ? `Add ${year} vehicle` : 'Edit Changeover entry'" size="lg" @close="$emit('close')">
    <form id="changeover-entry-form" class="entry-form" @submit.prevent="save">
      <div class="year-note"><span>Model year</span><strong>{{ year }}</strong></div>

      <template v-if="mode === 'add'">
        <div class="entry-grid">
          <label>Make
            <select v-model="makeId" required @change="modelId = ''">
              <option disabled value="">Select a make</option>
              <option v-for="make in makes" :key="make.id" :value="make.id">{{ make.name }}</option>
            </select>
          </label>
          <label>Model
            <select v-model="modelId" required :disabled="!makeId">
              <option disabled value="">Select a model</option>
              <option v-for="model in modelsForMake" :key="model.id" :value="model.id">{{ model.name }}</option>
            </select>
          </label>
          <label>Segment
            <input :value="selectedVehicle?.segment || ''" readonly placeholder="From Catalog" />
          </label>
        </div>
        <p v-if="modelId && !selectedVehicle" class="form-hint">Add this Make, Model, and Model Year in Catalog → Models first.</p>
      </template>
      <div v-else class="vehicle-summary">
        <strong>{{ entry?.make }} {{ entry?.model }}</strong>
        <span>{{ entry?.segment || 'No Segment assigned' }}</span>
      </div>

      <div class="entry-grid">
        <label>Status
          <select v-model="status">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label>Author
          <select v-model="authorId">
            <option value="">OPEN / Unassigned</option>
            <optgroup v-for="group in authorGroups" :key="group.label" :label="group.label">
              <option v-for="author in group.authors" :key="author.id" :value="author.id">{{ author.label }}</option>
            </optgroup>
          </select>
        </label>
      </div>

      <label v-if="status === 'published'" class="entry-label">Published page URL
        <input v-model.trim="publicUrl" type="url" placeholder="https://…" />
      </label>
      <label v-else class="entry-label">Resource URL
        <input v-model.trim="resourceUrl" type="url" placeholder="https://…" />
      </label>
      <label class="entry-label">Notes
        <textarea v-model.trim="notes" rows="4" placeholder="Research notes, changes, or follow-up context" />
      </label>
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
    </form>

    <template #footer>
      <div class="modal-footer">
        <button type="button" class="secondary-button" @click="$emit('close')">Cancel</button>
        <button type="submit" form="changeover-entry-form" class="primary-button" :disabled="isSaving || (mode === 'add' && !selectedVehicle)">
          {{ isSaving ? 'Saving…' : mode === 'add' ? 'Add to Changeover' : 'Save changes' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BaseModal from "@/components/common/BaseModal.vue";
import type { Author, AuthorId } from "@/types";
import type { MakeOption, ModelOption, ModelYearVehicleOption } from "@/stores/catalog";
import type { ChangeoverEntry, ChangeoverStatus } from "@/stores/changeover";

const props = defineProps<{
  modelValue: boolean;
  mode: "add" | "edit";
  year: number;
  entry?: ChangeoverEntry | null;
  makes: MakeOption[];
  models: ModelOption[];
  vehicles: ModelYearVehicleOption[];
  publishedVehicleIds?: string[];
  authors: Author[];
  initialStatus?: ChangeoverStatus;
  isSaving?: boolean;
}>();

interface ChangeoverEntryInput {
  vehicle: ModelYearVehicleOption;
  status: ChangeoverStatus;
  assignedAuthorId: AuthorId | null;
  notes: string;
  publicUrl: string;
  resourceUrl: string;
}

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "save", value: ChangeoverEntryInput): void;
  (event: "close"): void;
}>();

const statusOptions: Array<{ value: ChangeoverStatus; label: string }> = [
  { value: "awaiting_info", label: "Awaiting Info" },
  { value: "info_available", label: "Info Available" },
  { value: "embargoed", label: "Embargoed" },
  { value: "published", label: "Published" },
  { value: "skipped", label: "Skipped" },
  { value: "dead", label: "Dead" },
  { value: "vaporware", label: "Vaporware" },
];

const localModel = computed({ get: () => props.modelValue, set: (value: boolean) => emit("update:modelValue", value) });
const makeId = ref("");
const modelId = ref("");
const status = ref<ChangeoverStatus>("awaiting_info");
const authorId = ref<AuthorId | "">("");
const notes = ref("");
const publicUrl = ref("");
const resourceUrl = ref("");
const formError = ref("");

const modelsForMake = computed(() => props.models.filter((model) => model.makeId === makeId.value && model.active));
const selectedVehicle = computed(() => props.vehicles.find((vehicle) => vehicle.modelId === modelId.value && vehicle.modelYear === props.year));
const authorGroups = computed(() => {
  const definitions = [
    { slug: "bg", label: "Buyer’s Guide" },
    { slug: "cd", label: "Car and Driver" },
    { slug: "freelance", label: "Freelancers" },
  ];
  return definitions.map((team) => ({
    label: team.label,
    authors: props.authors.filter((author) => author.active && author.team.slug === team.slug)
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)),
  }));
});

watch(() => [props.modelValue, props.entry, props.initialStatus] as const, ([isOpen, entry, initialStatus]) => {
  if (!isOpen) return;
  makeId.value = entry?.makeId ?? "";
  modelId.value = entry?.modelId ?? "";
  status.value = entry?.status ?? initialStatus ?? "awaiting_info";
  authorId.value = entry?.assignedAuthorId ?? "";
  notes.value = entry?.notes ?? "";
  publicUrl.value = entry?.publicUrl ?? "";
  resourceUrl.value = entry?.resourceUrl ?? "";
  formError.value = "";
});
watch([modelId, () => props.publishedVehicleIds], () => {
  if (props.mode !== "add" || !selectedVehicle.value) return;
  status.value = props.publishedVehicleIds?.includes(selectedVehicle.value.id) ? "published" : props.initialStatus ?? "awaiting_info";
  publicUrl.value = status.value === "published" ? selectedVehicle.value.publicUrl ?? "" : "";
  resourceUrl.value = "";
});

function save() {
  const vehicle = props.mode === "edit"
    ? props.vehicles.find((item) => item.id === props.entry?.modelYearVehicleId)
    : selectedVehicle.value;
  if (!vehicle) {
    formError.value = "Choose a vehicle year from the Catalog before adding it to Changeover.";
    return;
  }
  emit("save", {
    vehicle,
    status: status.value,
    assignedAuthorId: authorId.value || null,
    notes: notes.value,
    publicUrl: status.value === "published" ? publicUrl.value : "",
    resourceUrl: status.value === "published" ? "" : resourceUrl.value,
  });
}
</script>

<style scoped>
.entry-form { display: grid; gap: 14px; max-height: 70vh; overflow-y: auto; padding: 2px 4px 4px 0; }
.year-note { display: flex; align-items: center; gap: 10px; padding: 9px 11px; border-radius: 6px; background: var(--white-soft); color: var(--gray-dark-3); font-size: 0.84rem; }
.year-note strong { color: var(--gray-dark-5); font: 700 0.92rem "Monda", sans-serif; }
.entry-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.entry-form label { display: grid; gap: 5px; color: var(--gray-dark-3); font-size: 0.82rem; font-weight: 600; }
.entry-form input, .entry-form select, .entry-form textarea { width: 100%; min-width: 0; min-height: 38px; padding: 8px 10px; border: 1px solid var(--color-form-border); border-radius: 6px; background: var(--white); color: var(--gray-dark-5); font: 400 0.88rem "Asap", sans-serif; }
.entry-form input[readonly] { background: var(--white-soft); }
.entry-form textarea { resize: vertical; }
.entry-form input:focus-visible, .entry-form select:focus-visible, .entry-form textarea:focus-visible { border-color: var(--color-focus-ring); outline: 2px solid color-mix(in srgb, var(--color-focus-ring) 28%, transparent); outline-offset: 1px; }
.entry-label { display: grid; gap: 5px; }
.vehicle-summary { display: grid; gap: 4px; padding: 11px 12px; border-left: 3px solid var(--green-2); background: var(--white-soft); color: var(--gray-dark-5); }
.vehicle-summary span, .form-hint { color: var(--gray-light-4); font-size: 0.8rem; }
.form-hint, .form-error { margin: 0; }
.form-error { color: var(--red-dark); font-size: 0.84rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 9px; }
.primary-button, .secondary-button { min-height: 36px; padding: 0 12px; border-radius: 5px; cursor: pointer; font: 600 0.84rem "Asap", sans-serif; }
.primary-button { border: 1px solid transparent; background: var(--green-2); color: var(--white); }
.primary-button:disabled { cursor: wait; opacity: 0.6; }
.secondary-button { border: 1px solid var(--color-form-border); background: var(--white); color: var(--gray-dark-3); }
@media (max-width: 620px) { .entry-grid { grid-template-columns: 1fr; } }
</style>
