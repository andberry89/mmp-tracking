<template>
  <VueFinalModal
    v-model="internalModelValue"
    class="flex items-center justify-center p-4"
    content-class="bg-white p-8 rounded-lg min-w-[400px] max-w-[600px] flex flex-col shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
    overlay-transition="vfm-fade"
    content-transition="vfm-fade"
  >
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <slot />
    <button
      @click="$emit('close')"
      class="mt-6 self-end px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition"
    >
      Close
    </button>
  </VueFinalModal>
</template>

<script setup lang="ts">
import { VueFinalModal } from "vue-final-modal";
import { computed } from "vue";

const props = defineProps<{
  modelValue: boolean;
  title?: string;
}>();

const emit = defineEmits(["update:modelValue", "close"]);

const internalModelValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>
