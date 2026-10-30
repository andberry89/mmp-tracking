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
      <header v-if="title" class="app-modal__header">
        <h2 class="app-modal__title">{{ title }}</h2>
      </header>

      <!-- Modal Content -->
      <div class="modal-body">
        <slot />
      </div>

      <!-- Option Footer -->
      <footer v-if="$slots.footer" class="app-modal__footer" :class="{ 'app-modal__footer--no-divider': !footerDivider }">
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
  size?: "sm" | "md" | "lg" | "xl" | "wide";
  clickToClose?: boolean;
  escToClose?: boolean;
  footerDivider?: boolean;
}>();

const emit = defineEmits(["update:modelValue", "close"]);

const localModel = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    emit("update:modelValue", val);
  },
});

const contentClasses = computed(() => {
  const base = "app-modal-panel";
  const sizeMap = {
    sm: "app-modal-panel--sm",
    md: "app-modal-panel--md",
    lg: "app-modal-panel--lg",
    xl: "app-modal-panel--xl",
    wide: "app-modal-panel--wide",
  };
  return `${base} ${sizeMap[props.size || "md"]}`;
});
</script>
