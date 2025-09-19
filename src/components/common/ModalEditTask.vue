<template>
  <VueFinalModal
    v-model="internalModelValue"
    class="modal-edit-task"
    content-class="modal-edit-task-content"
    overlay-transition="vfm-fade"
    content-transition="vfm-fade"
  >
    <h2>{{ title }}</h2>
    <slot />
    <button @click="$emit('close')">Close</button>
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
<style lang="scss">
.modal-edit-task-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  min-width: 400px;
  max-width: 600px;
  margin: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}
</style>
