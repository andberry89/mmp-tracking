<template>
  <BaseModal v-model="localModel" title="Edit Task" size="lg" @close="$emit('close')">
    <form @submit.prevent="handleSave" id="task-edit-form">
      <p v-if="error" class="edit-error" role="alert">{{ error }}</p>
      <!-- form content -->
      <div class="mb-4">
        <label class="form-field">Vehicle</label>
        <input
          type="text"
          v-model="vehicleName"
          readonly
          class="form-control mt-1"
        />
      </div>

      <div class="mb-4 flex items-center gap-3">
        <label for="highPriority" class="text-sm font-semibold text-gray-700">
          High Priority
        </label>

        <button
          type="button"
          id="highPriority"
          :aria-pressed="editableTask.highPriority"
          @click="editableTask.highPriority = !editableTask.highPriority"
          :class="[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
            editableTask.highPriority ? 'bg-red-600' : 'bg-gray-300',
          ]"
        >
          <span
            :class="[
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
              editableTask.highPriority ? 'translate-x-6' : 'translate-x-1',
            ]"
          />
        </button>
      </div>

      <div class="mb-4">
        <label class="form-field">
          Status
          <select v-model="editableTask.status" class="form-control">
          <option v-for="status in taskStatuses" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
          </select>
        </label>
      </div>

      <div v-if="isPublishedStatus" class="mb-4">
        <label class="form-field" for="publishedDateInput">Published / Updated date and time</label>
        <input
          id="publishedDateInput"
          v-model="publishedDateInput"
          type="datetime-local"
          class="form-control mt-1"
        />
        <p class="edit-field-hint">Leave blank to use the embargo time, or the current time if no embargo is set.</p>
      </div>

      <div class="mb-4">
        <label class="form-field">Deadline</label>
        <input
          type="date"
          v-model="editableTask.deadline"
          class="form-control mt-1"
        />
      </div>

      <div class="mb-4">
        <label class="form-field">Embargo Date</label>
        <div class="flex gap-2">
          <input
            type="date"
            v-model="embargoDatePart"
            class="form-control mt-1"
          />
          <input
            type="time"
            v-model="embargoTimePart"
            class="form-control mt-1"
          />
        </div>
      </div>

      <div class="mb-4">
        <label class="form-field">Notes</label>
        <textarea
          v-model="editableTask.notes"
          rows="4"
          class="form-control mt-1"
        ></textarea>
      </div>

      <section class="edit-resources">
        <div class="edit-resources__heading">
          <div>
            <h2>Resources</h2>
            <p>Passwords are stored separately and are visible only to Editors.</p>
          </div>
          <button type="button" class="app-button app-button--secondary" @click="addResource">Add resource</button>
        </div>

        <ul v-if="editableTask.assets.length" class="edit-resources__existing">
          <li v-for="(asset, index) in editableTask.assets" :key="asset.id || `${asset.url}-${index}`">
            <span class="edit-resources__existing-label">{{ resourceLabel(asset) }}</span>
            <a :href="asset.url" target="_blank" rel="noopener noreferrer">Open link</a>
          </li>
        </ul>
        <p v-else class="edit-resources__empty">No resources have been added yet.</p>

        <div v-for="(resource, index) in newResources" :key="index" class="edit-resources__draft">
          <label>
            Label
            <input v-model.trim="resource.label" required placeholder="e.g. Press release" />
          </label>
          <label>
            URL
            <input v-model.trim="resource.url" type="url" required placeholder="https://…" />
          </label>
          <label>
            Password (Editors only)
            <input v-model="resource.password" type="password" autocomplete="new-password" placeholder="Optional" />
          </label>
          <button type="button" class="edit-resources__remove" :aria-label="`Remove new resource ${index + 1}`" @click="removeResource(index)">Remove</button>
        </div>
      </section>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          @click="$emit('close')"
          class="app-button app-button--secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="task-edit-form"
          class="app-button app-button--primary"
        >
          Save
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
//todo: figure out how task data displays (editableTask)
import { ref, watch, computed } from "vue";
import BaseModal from "@/components/common/BaseModal.vue";
import type { TaskAsset, TaskDocument, TaskResourceInput } from "@/types";
import { statuses as taskStatuses } from "@/constants";

// Props and Emits ----------------------
const props = defineProps<{
  modelValue: boolean;
  task: TaskDocument;
  error?: string | null;
}>();
interface EditTaskSubmission {
  task: TaskDocument;
  resources: TaskResourceInput[];
}
const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "save", value: EditTaskSubmission): void;
  (event: "close"): void;
}>();

// Reactive State ----------------------
const editableTask = ref({ ...props.task });
const newResources = ref<TaskResourceInput[]>([]);
const embargoDatePart = ref("");
const embargoTimePart = ref("");
const publishedDateInput = ref(toLocalDateTimeInput(props.task.publishedDate));

// Computed --------------------------------
const localModel = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const vehicleName = computed(() =>
  props.task.vehicle
    ? `${props.task.vehicle.modelYear} ${props.task.vehicle.make} ${props.task.vehicle.model}`
    : ""
);
const isPublishedStatus = computed(
  () => editableTask.value.status === "published" || editableTask.value.status === "updated"
);

// Watchers --------------------------------
watch(
  () => props.task,
  (t) => {
    editableTask.value = { ...t };
    publishedDateInput.value = toLocalDateTimeInput(t.publishedDate);
    newResources.value = [];
  }
);

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    editableTask.value = { ...props.task };
    publishedDateInput.value = toLocalDateTimeInput(props.task.publishedDate);
    newResources.value = [];
  }
});

// Update embargoDatePart and embargoTimePart when task.embargoDate changes
watch(
  () => editableTask.value.embargoDate,
  (val) => {
    if (!val) {
      embargoDatePart.value = "";
      embargoTimePart.value = "";
      return;
    }

    // If it's just a date string (no time)
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      embargoDatePart.value = val;
      embargoTimePart.value = "";
      return;
    }

    // If it's an ISO datetime
    const [datePart, timePart] = val.split("T");
    embargoDatePart.value = datePart ?? "";
    embargoTimePart.value = timePart ? timePart.slice(0, 5) : "";
  },
  { immediate: true }
);

// Combine date and time when either part changes
watch([embargoDatePart, embargoTimePart], ([date, time]) => {
  if (!date) {
    editableTask.value.embargoDate = "";
    return;
  }

  // If there's no time, just keep the date string
  const combined = time ? `${date}T${time}` : date;

  if (editableTask.value.embargoDate !== combined) {
    editableTask.value.embargoDate = combined;
  }
});

// Methods --------------------------------
function handleSave() {
  const originalDateInput = toLocalDateTimeInput(editableTask.value.publishedDate);
  const publishedDate = publishedDateInput.value === originalDateInput
    ? editableTask.value.publishedDate
    : toIsoTimestamp(publishedDateInput.value);
  emit("save", {
    task: { ...editableTask.value, publishedDate },
    resources: newResources.value,
  });
}

function toLocalDateTimeInput(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function toIsoTimestamp(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function addResource() {
  newResources.value.push({ label: "", url: "", notes: "", password: "" });
}

function removeResource(index: number) {
  newResources.value.splice(index, 1);
}

function resourceLabel(asset: TaskAsset) {
  if (asset.kind === "imeet" || /^iMeet$/i.test(asset.label ?? asset.notes)) return "iMeet";
  return asset.label?.trim() || asset.notes?.trim() || "Resource";
}
</script>

<style scoped>
.edit-resources { display: grid; gap: 10px; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--color-divider); }
.edit-resources__heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.edit-resources__heading h2 { margin: 0 0 3px; color: var(--gray-dark-4); font: 700 1rem "Monda", sans-serif; }
.edit-resources__heading p, .edit-resources__empty { margin: 0; color: var(--gray-light-4); font-size: 0.8rem; }
.edit-resources__existing { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.edit-resources__existing li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 7px 9px; border-radius: 5px; background: var(--white-soft); font-size: 0.82rem; }
.edit-resources__existing-label { overflow: hidden; color: var(--gray-dark-4); text-overflow: ellipsis; white-space: nowrap; }
.edit-resources__existing a { flex: 0 0 auto; color: var(--color-body-link); text-decoration: none; }
.edit-resources__existing a:hover { color: var(--color-body-link-hover); text-decoration: underline; }
.edit-resources__draft { display: grid; grid-template-columns: 1fr 1.4fr 1fr auto; align-items: end; gap: 9px; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--white-soft); }
.edit-resources__draft label { display: grid; gap: 5px; color: var(--gray-dark-3); font-size: 0.78rem; font-weight: 600; }
.edit-resources__draft input { width: 100%; min-width: 0; min-height: 36px; padding: 7px 9px; border: 1px solid var(--color-form-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-5); font: 400 0.84rem "Asap", sans-serif; }
.edit-resources__remove { padding: 7px 5px; border: 0; background: transparent; color: var(--red-dark); cursor: pointer; font: 600 0.8rem "Asap", sans-serif; }
.edit-resources__remove:hover { text-decoration: underline; }
.edit-error { margin: 0 0 12px; color: var(--red-dark); font-size: 0.85rem; }
.edit-field-hint { margin: 5px 0 0; color: var(--gray-light-4); font-size: 0.78rem; }
@media (max-width: 700px) { .edit-resources__draft { grid-template-columns: 1fr; } .edit-resources__heading { align-items: flex-start; flex-direction: column; } }
</style>
