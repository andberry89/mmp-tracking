<template>
  <VueFinalModal
    v-model="localModel"
    :click-to-close="clickToClose"
    :esc-to-close="escToClose"
    :lock-scroll="true"
    overlay-transition="vfm-fade"
    content-transition="vfm-slide-down"
    class="flex justify-center items-center"
    :content-class="contentClasses"
    @click-outside="$emit('close')"
  >
    <div>
      <!-- Header -->
      <header v-if="title" class="mb-4">
        <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
      </header>

      <!-- Modal Content -->
      <div class="modal-body">
        <slot />
      </div>

      <!-- Option Footer -->
      <footer v-if="$slots.footer" class="mt-6">
        <slot name="footer" />
      </footer>
    </div>
  </VueFinalModal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { VueFinalModal } from "vue-final-modal";

const props = defineProps<{
  modelValue: boolean;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  clickToClose?: boolean;
  escToClose?: boolean;
}>();

const emit = defineEmits(["update:modelValue", "close"]);

const localModel = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    emit("update:modelValue", val);
  },
});

const contentClasses = computed(() => {
  const base =
    "bg-white p-8 rounded-lg min-w-[400px] max-w-[600px] flex flex-col shadow-[0_20px_40px_rgba(0,0,0,0.2)]";
  const sizeMap = {
    sm: "w-[320px]",
    md: "w-[480px]",
    lg: "w-[640px]",
    xl: "w-[800px]",
  };
  return `${base} ${sizeMap[props.size || "md"]}`;
});
</script>
