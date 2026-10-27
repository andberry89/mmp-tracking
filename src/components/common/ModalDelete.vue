<template>
  <BaseModal v-model="localModel" title="Delete Task" size="sm" @close="$emit('close')">
    <p class="text-sm text-gray-700 mb-6">
      {{ message || "Are you sure you want to delete this task?" }}
    </p>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button @click="$emit('close')" class="app-button app-button--secondary">
          Cancel
        </button>
        <button
          @click="$emit('delete')"
          class="app-button app-button--danger"
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
