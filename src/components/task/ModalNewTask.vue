<template>
  <BaseModal v-model="localModel" title="Add New Task" size="lg" @close="$emit('close')">
    <form id="new-task-form" class="new-task-form" @submit.prevent="handleSave">
      <div class="form-grid">
        <label>
          <span class="field-label">Make <span class="required">*</span></span>
          <select v-model="makeId" required @change="modelId = ''; modelYear = null">
            <option disabled value="">Select a make</option>
            <option v-for="make in makes" :key="make.id" :value="make.id">
              {{ make.name }}
            </option>
          </select>
        </label>

        <label>
          <span class="field-label">Model <span class="required">*</span></span>
          <select v-model="modelId" required :disabled="!makeId" @change="modelYear = null">
            <option disabled value="">Select a model</option>
            <option v-for="model in modelsForSelectedMake" :key="model.id" :value="model.id">
              {{ model.name }}
            </option>
          </select>
        </label>

        <label>
          <span class="field-label">Model Year <span class="required">*</span></span>
          <select v-model.number="modelYear" required>
            <option disabled :value="null">Select a year</option>
            <option v-for="year in modelYears" :key="year" :value="year">{{ year }}</option>
          </select>
        </label>

        <label>
          Segment
          <input :value="selectedModelYearVehicle?.segment || ''" readonly placeholder="Filled from model year" />
        </label>

        <label>
          Author
          <select v-model="authorId">
            <option value="">Unassigned</option>
            <optgroup v-for="group in authorsByTeam" :key="group.team" :label="group.team">
              <option v-for="author in group.members" :key="author.id" :value="author.id">
                {{ author.label }}
              </option>
            </optgroup>
          </select>
        </label>

        <label>
          Status
          <select v-model="status">
            <option v-for="option in taskStatuses" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label>
          Deadline
          <input v-model="deadline" type="date" />
        </label>

        <label>
          Embargo / scheduled time
          <input v-model="embargoDate" type="datetime-local" />
        </label>
      </div>

      <label class="update-option">
        <input v-model="isUpdate" type="checkbox" />
        This task is an update to an existing MMP
      </label>

      <label>
        Notes
        <textarea
          v-model="notes"
          rows="3"
          placeholder="Vehicle changes, no changes, or no changes expected"
        />
      </label>

      <section class="resource-section">
        <h2>Resources</h2>
        <label>
          iMeet folder URL
          <input v-model.trim="imeetUrl" type="url" placeholder="https://…" />
        </label>

        <div class="material-heading">
          <h3>Press materials and other links</h3>
          <button type="button" class="secondary-button" @click="addMaterial">Add link</button>
        </div>

        <div v-for="(material, index) in materials" :key="index" class="material-row">
          <label>
            Label
            <input v-model.trim="material.label" placeholder="Press release" />
          </label>
          <label>
            URL
            <input v-model.trim="material.url" type="url" placeholder="https://…" />
          </label>
          <label>
            Password (Editors only)
            <input v-model="material.password" type="password" autocomplete="new-password" />
          </label>
          <button type="button" class="remove-button" @click="removeMaterial(index)">
            Remove
          </button>
        </div>
      </section>

      <p v-if="formError || error" class="form-error" role="alert">{{ formError || error }}</p>
      <p v-if="selectedModel && modelYear !== null && !selectedModelYearVehicle" class="form-hint" role="status">
        Add this Make, Model, and Model Year in Catalog → Models before creating the task.
      </p>
      <p v-if="!makes.length || !modelYears.length" class="form-hint">
        Vehicle options are not loaded yet. An Editor needs to add the catalog data first.
      </p>
    </form>

    <template #footer>
      <div class="modal-footer">
        <button type="button" class="secondary-button" @click="$emit('close')">Cancel</button>
        <button
          type="submit"
          form="new-task-form"
          class="primary-button"
          :disabled="isSaving || !makes.length || !modelYears.length || !selectedModelYearVehicle"
        >
          {{ isSaving ? "Saving…" : "Add Task" }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BaseModal from "@/components/common/BaseModal.vue";
import { statuses as taskStatuses } from "@/constants";
import type { AuthorId, AuthorsByTeamGroup, NewTaskInput, TaskStatus, TaskResourceInput } from "@/types";
import type { MakeOption, ModelOption, ModelYearVehicleOption } from "@/stores/catalog";

const props = defineProps<{
  modelValue: boolean;
  makes: MakeOption[];
  models: ModelOption[];
  modelYearVehicles: ModelYearVehicleOption[];
  modelYears: number[];
  authorsByTeam: AuthorsByTeamGroup[];
  isSaving?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "save", input: NewTaskInput): void;
  (event: "close"): void;
}>();

const localModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const makeId = ref("");
const modelId = ref("");
const modelYear = ref<number | null>(null);
const authorId = ref<AuthorId | "">("");
const status = ref<TaskStatus>("pending");
const isUpdate = ref(false);
const deadline = ref("");
const embargoDate = ref("");
const notes = ref("");
const imeetUrl = ref("");
const materials = ref<TaskResourceInput[]>([]);
const formError = ref("");

const modelsForSelectedMake = computed(() => props.models.filter((model) => model.makeId === makeId.value));
const selectedMake = computed(() => props.makes.find((make) => make.id === makeId.value));
const selectedModel = computed(() => props.models.find((model) => model.id === modelId.value));
const selectedModelYearVehicle = computed(() => props.modelYearVehicles.find(
  (item) => item.modelId === modelId.value && item.modelYear === modelYear.value
));

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return;
    formError.value = "";
    makeId.value = "";
    modelId.value = "";
    modelYear.value = null;
    authorId.value = "";
    status.value = "pending";
    isUpdate.value = false;
    deadline.value = "";
    embargoDate.value = "";
    notes.value = "";
    imeetUrl.value = "";
    materials.value = [];
  }
);

function addMaterial() {
  materials.value.push({ label: "", url: "", notes: "", password: "" });
}

function removeMaterial(index: number) {
  materials.value.splice(index, 1);
}

function handleSave() {
  formError.value = "";
  const selected = selectedModel.value;
  const selectedYearRecord = selectedModelYearVehicle.value;
  if (!selectedMake.value || !selected || modelYear.value === null || !selectedYearRecord) {
    formError.value = "Choose a cataloged make, model, and model year.";
    return;
  }

  const submittedMaterials = materials.value.filter((item) => item.label || item.url || item.password);
  if (submittedMaterials.some((item) => !item.label || !item.url)) {
    formError.value = "Each material link needs both a label and a URL.";
    return;
  }

  const submittedStatus = isUpdate.value && status.value === "published" ? "updated" : status.value;
  emit("save", {
    modelId: selected.id,
    segmentId: selectedYearRecord.segmentId,
    make: selectedMake.value.name,
    model: selected.name,
    modelYear: modelYear.value,
    segment: selectedYearRecord.segment,
    authorId: authorId.value || null,
    deadline: deadline.value,
    status: submittedStatus,
    isUpdate: isUpdate.value,
    notes: notes.value.trim(),
    embargoDate: embargoDate.value,
    embargoNotes: "",
    imeetUrl: imeetUrl.value.trim(),
    materials: submittedMaterials,
  });
}
</script>

<style scoped>
.new-task-form {
  display: grid;
  gap: 16px;
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.new-task-form label {
  display: grid;
  gap: 5px;
  color: var(--gray-dark-3);
  font-size: 0.85rem;
  font-weight: 600;
}

.field-label {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
}

.new-task-form input,
.new-task-form select,
.new-task-form textarea {
  width: 100%;
  min-height: 38px;
  border: 1px solid var(--color-form-border);
  border-radius: 6px;
  padding: 8px 10px;
  background: var(--white);
  color: var(--gray-dark-5);
  font-weight: 400;
}

.new-task-form input[readonly] {
  background: var(--white-soft);
}

.new-task-form input:focus-visible,
.new-task-form select:focus-visible,
.new-task-form textarea:focus-visible {
  border-color: var(--color-focus-ring);
  outline: 2px solid color-mix(in srgb, var(--color-focus-ring) 30%, transparent);
  outline-offset: 1px;
}

.required,
.form-error {
  color: var(--red);
}

.update-option {
  display: flex !important;
  grid-template-columns: auto 1fr;
  align-items: center;
  width: fit-content;
}

.update-option input {
  width: 16px;
  min-height: 16px;
}

.resource-section {
  display: grid;
  gap: 12px;
  border-top: 1px solid var(--color-border);
  padding-top: 14px;
}

.resource-section h2,
.resource-section h3 {
  margin: 0;
  font-weight: 700;
}

.resource-section h2 {
  font-size: 1rem;
}

.resource-section h3 {
  font-size: 0.9rem;
}

.material-heading,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.material-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr auto;
  align-items: end;
  gap: 8px;
  padding: 10px;
  border-radius: 6px;
  background: var(--color-background);
}

.primary-button,
.secondary-button,
.remove-button {
  border-radius: 5px;
  padding: 7px 11px;
  font-weight: 600;
  cursor: pointer;
}

.primary-button {
  border: 1px solid transparent;
  background: var(--color-action-background);
  color: var(--color-action-text);
}

.primary-button:hover:not(:disabled) {
  background: var(--color-action-background-hover);
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.secondary-button {
  border: 1px solid var(--color-form-border);
  background: var(--white);
  color: var(--gray-dark-3);
}

.secondary-button:hover {
  border-color: var(--gray-light-4);
  background: var(--white-soft);
}

.remove-button {
  border: 0;
  background: transparent;
  color: var(--red);
}

.form-hint {
  margin: 0;
  color: var(--gray-light-4);
  font-size: 0.8rem;
}

@media (max-width: 700px) {
  .form-grid,
  .material-row {
    grid-template-columns: 1fr;
  }
}
</style>
