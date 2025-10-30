<template>
  <BaseModal v-model="localModel" title="Edit Task" size="lg" @close="$emit('close')">
    <form @submit.prevent="handleSave" id="task-edit-form">
      <!-- form content -->
      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-700 mb-1">Vehicle</label>
        <input
          type="text"
          v-model="vehicleName"
          readonly
          class="w-full border border-gray-300 rounded p-2 bg-gray-100"
        />
      </div>

      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-700 mb-1">Status</label>
        <select v-model="editableTask.status" class="w-full border border-gray-300 rounded p-2">
          <option v-for="status in taskStatuses" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-700 mb-1">Deadline</label>
        <input
          type="date"
          v-model="editableTask.deadline"
          class="w-full border border-gray-300 rounded p-2"
        />
      </div>

      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-700 mb-1">Embargo Date</label>
        <div class="flex gap-2">
          <input
            type="date"
            v-model="embargoDatePart"
            class="w-1/2 border border-gray-300 rounded p-2"
          />
          <input
            type="time"
            v-model="embargoTimePart"
            class="w-1/2 border border-gray-300 rounded p-2"
          />
        </div>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
        <textarea
          v-model="editableTask.notes"
          rows="4"
          class="w-full border border-gray-300 rounded p-2"
        ></textarea>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="task-edit-form"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
import { statuses as taskStatuses } from "@/constants/constants";

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
    embargoDatePart.value = datePart;
    embargoTimePart.value = timePart ? timePart.slice(0, 5) : "";
  },
  { immediate: true }
);

// Combine date and time when either part changes
watch([embargoDatePart, embargoTimePart], ([date, time]) => {
  if (!date) {
    editableTask.value.embargoDate = null;
    return;
  }

  // If there's no time, just keep the date string
  const combined = time ? `${date}T${time}` : date;

  if (editableTask.value.embargoDate !== combined) {
    editableTask.value.embargoDate = combined;
  }
});

// Methods --------------------------------
function getStatusLabel(value: string): string {
  const match = taskStatuses.find((status) => status.value === value);
  return match ? match.label : value;
}

function handleSave() {
  emit("save", editableTask.value);
  emit("update:modelValue", false);
}
</script>
