<template>
  <div class="search-field">
    <SearchIcon class="search-field__icon text-[var(--color-search-text-placeholder)]" />
    <input
      type="search"
      class="search-field__input"
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
      localValue.value = newVal;
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

<style scoped>
.search-field {
  display: flex;
  align-items: center;
  width: clamp(220px, 26vw, 340px);
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-input-background);
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.search-field:focus-within {
  border-color: var(--color-focus-ring);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-focus-ring) 24%, transparent);
}

.search-field__icon {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
}

.search-field__input {
  width: 100%;
  min-width: 0;
  margin-left: 8px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-search-text);
  font: 400 0.82rem/1.2 "Asap", sans-serif;
}

.search-field__input::placeholder {
  color: var(--color-body-text-secondary);
}

@media (max-width: 620px) {
  .search-field {
    width: min(100%, 280px);
  }
}
</style>
