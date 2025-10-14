<template>
  <VueFinalModal
    v-model="internalModelValue"
    class="flex items-center justify-center p-4"
    content-class="bg-white p-8 rounded-lg min-w-[400px] max-w-[600px] flex flex-col shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
    overlay-transition="vfm-fade"
    content-transition="vfm-fade"
  >
    <h2 class="text-xl font-semibold mb-4">{{ title || "Edit Task" }}</h2>
    <slot />
    <slot name="footer">
      <button
        @click="$emit('close')"
        class="mt-6 self-end px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition"
      >
        Close
      </button>
    </slot>
  </VueFinalModal>
</template>

<script setup lang="ts">
/**
 * Generic modal wrapper component.
 * Uses Vue Final Modal under the hood and exposes
 * a slot for arbitrary content plus `close`/`save` events.
 */

import { VueFinalModal } from "vue-final-modal";
import { computed } from "vue";
import type { TaskDocument } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
  (e: "save", payload: any): void;
}>();

const internalModelValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>
