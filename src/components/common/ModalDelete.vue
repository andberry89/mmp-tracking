<template>
  <BaseModal v-model="localModel" title="Delete Task" size="sm" @close="$emit('close')">
    <p class="text-sm text-gray-700 mb-6">
      {{ message || "Are you sure you want to delete this task?" }}
    </p>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button @click="$emit('close')" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
          Cancel
        </button>
        <button
          @click="$emit('delete')"
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BaseModal from "@/components/common/BaseModal.vue";

const props = defineProps<{
  modelValue: boolean;
  message?: string;
}>();
const emit = defineEmits(["update:modelValue", "delete", "close"]);

const localModel = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>
