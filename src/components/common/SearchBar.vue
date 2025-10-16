<template>
  <div
    class="flex items-center w-[220px] h-[24px] bg-[var(--color-input-background)] border border-[var(--color-input-border)] px-[4px] rounded-[8px]"
  >
    <SearchIcon class="text-[var(--color-search-text-placeholder)]" />
    <input
      type="search"
      class="ml-[4px] flex-1 outline-none border-none bg-transparent text-[12px] font-[400] leading-[1] font-[Monda,sans-serif] text-[var(--color-search-text)] placeholder:text-[var(--color-search-text-placeholder)]"
      :placeholder="placeholder"
      :value="modelValue"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { SearchIcon } from "@/assets/icons";

// Props & Emits ------------------------------------
const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    delay?: number; // debounce delay in ms
  }>(),
  {
    placeholder: "Search...",
    delay: 300,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

// Local State ------------------------------------
const localValue = ref(props.modelValue);
let timeoutId: ReturnType<typeof setTimeout> | null = null;

// Watch for external modelValue changes --------------------
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== localValue.value) {
      localValue.value = newValue;
    }
  }
);

// Input handler with debounce --------------------
function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  localValue.value = value;

  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    emit("update:modelValue", value);
  }, props.delay);
}
</script>
