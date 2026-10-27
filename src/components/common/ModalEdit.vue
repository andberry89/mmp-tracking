<template>
  <BaseModal v-model="localModel" title="Edit Task" size="lg" @close="$emit('close')">
    <form @submit.prevent="handleSave" id="task-edit-form">
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
import type { TaskDocument } from "@/types";
import { statuses as taskStatuses } from "@/constants";

// Props and Emits ----------------------
const props = defineProps<{
  modelValue: boolean;
  task: TaskDocument;
}>();
const emit = defineEmits(["update:modelValue", "save", "close"]);

// Reactive State ----------------------
const editableTask = ref({ ...props.task });
const embargoDatePart = ref("");
const embargoTimePart = ref("");

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

// Watchers --------------------------------
watch(
  () => props.task,
  (t) => (editableTask.value = { ...t })
);

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
  emit("save", editableTask.value);
  emit("update:modelValue", false);
}
</script>
