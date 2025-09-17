<template>
  <VueFinalModal
    class="modal-edit-task"
    content-class="modal-edit-task-content"
    overlay-transition="vfm-fade"
    content-transition="vfm-fade"
  >
    <h2>{{ title }}</h2>
    <slot />
    <button @click="emit('close')">Close</button>
  </VueFinalModal>
</template>
<script setup lang="ts">
import { VueFinalModal } from "vue-final-modal";

defineProps<{
  title?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();
</script>
<style lang="scss" scoped>
.modal-edit-task {
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-edit-task-content {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: #fff;
  border-radius: 0.5rem;
}
.modal-edit-task-content > * + * {
  margin: 0.5rem 0;
}
.modal-edit-task-content h1 {
  font-size: 1.375rem;
}
.modal-edit-task-content button {
  margin: 0.25rem 0 0 auto;
  padding: 0 8px;
  border: 1px solid;
  border-radius: 0.5rem;
}
.dark .modal-edit-task-content {
  background: #000;
}
</style>
