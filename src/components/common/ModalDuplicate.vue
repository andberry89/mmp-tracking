<template>
  <BaseModal v-model="localModel" title="Duplicate Task" size="sm" @close="$emit('close')">
    <p class="text-sm text-gray-700 mb-4">You are about to duplicate this task:</p>
    <p class="text-gray-800 font-medium mb-6">
      {{ task.vehicle.modelYear }} {{ task.vehicle.make }} {{ task.vehicle.model }}
    </p>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button @click="$emit('close')" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
          Cancel
        </button>
        <button
          @click="$emit('duplicate', task)"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Duplicate
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from "@/components/common/BaseModal.vue";
import type { TaskDocument } from "@/types";

defineProps<{ modelValue: boolean; task: TaskDocument }>();
defineEmits(["update:modelValue", "duplicate", "close"]);

const localModel = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>
