<template>
  <BaseModal v-model="localModel" title="Edit Task" size="lg" @close="$emit('close')">
    <form @submit.prevent="handleSave" id="task-edit-form">
      <!-- form content -->
      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-700 mb-1">Vehicle</label>
        <input
          type="text"
          v-model="editableTask.vehicle.make"
          readonly
          class="w-full border border-gray-300 rounded p-2 bg-gray-100"
        />
      </div>

      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-700 mb-1">Status</label>
        <select v-model="editableTask.status" class="w-full border border-gray-300 rounded p-2">
          <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
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

const props = defineProps<{
  modelValue: boolean;
  task: TaskDocument;
}>();
const emit = defineEmits(["update:modelValue", "save", "close"]);

const localModel = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const editableTask = ref({ ...props.task });
const statuses = ["pending", "rte", "rtp", "scheduled", "published", "updated"];

watch(
  () => props.task,
  (t) => (editableTask.value = { ...t })
);

function handleSave() {
  emit("save", editableTask.value);
  emit("update:modelValue", false);
}
</script>
