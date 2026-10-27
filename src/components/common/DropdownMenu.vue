<template>
  <div class="filter-dropdown" v-click-outside="closeDropdown">
    <button
      type="button"
      class="filter-dropdown__trigger"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span class="filter-dropdown__text">
        <span>{{ label }}:</span>
        <span class="filter-dropdown__value">{{ activeLabel }}</span>
      </span>
      <svg
        fill="currentColor"
        width="10px"
        height="10px"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        class="filter-dropdown__chevron"
        aria-hidden="true"
      >
        <path d="M11.178 19.569a.998.998 0 0 0 1.644 0l9-13A.999.999 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569l9 13z" />
      </svg>
    </button>
    <transition
      appear
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        class="filter-dropdown__menu"
        v-if="isOpen"
      >
        <button
          type="button"
          v-if="activeLabel !== ''"
          @click="setActive({ id: '', label: '' })"
          class="filter-dropdown__option filter-dropdown__option--clear"
        >
          Clear Selection
        </button>
        <button
          type="button"
          class="filter-dropdown__option"
          v-for="(item, i) in options"
          :key="i + '-' + label"
          @click="setActive(item)"
        >
          {{ item.label }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
//TODO: Cleanup Dropdown Menu
import { ref, computed } from "vue";

interface OptionItem {
  id: string;
  label: string;
}

defineProps<{
  label?: string;
  options: OptionItem[];
}>();

const emit = defineEmits<{
  (e: "update:selected", id: string): void;
}>();

const isOpen = ref(false);
const active = ref<OptionItem>({ id: "", label: "" });
const activeLabel = computed(() => {
  return active.value.label || "Select";
});

const closeDropdown = () => {
  isOpen.value = false;
};

const setActive = (item: OptionItem) => {
  active.value = item;
  isOpen.value = false;
  emit("update:selected", item.id);
};
</script>

<style scoped>
.filter-dropdown {
  position: relative;
  display: flex;
  min-width: 120px;
  min-height: 38px;
  color: var(--color-dropdown-text);
  font: 400 0.8rem/1.2 "Asap", sans-serif;
}

.filter-dropdown__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 0 10px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-input-background);
  color: var(--color-search-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.filter-dropdown__trigger:hover,
.filter-dropdown__trigger[aria-expanded="true"] {
  border-color: var(--gray-light-3);
}

.filter-dropdown__trigger:focus-visible,
.filter-dropdown__option:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
}

.filter-dropdown__text {
  display: flex;
  gap: 5px;
  min-width: 0;
  white-space: nowrap;
}

.filter-dropdown__value {
  overflow: hidden;
  color: var(--color-dropdown-text);
  text-overflow: ellipsis;
}

.filter-dropdown__chevron {
  flex: 0 0 auto;
  color: var(--gray-light-3);
  transition: transform 140ms ease;
}

.filter-dropdown__trigger[aria-expanded="true"] .filter-dropdown__chevron {
  transform: rotate(180deg);
}

.filter-dropdown__menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 0;
  width: max(100%, 180px);
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--color-dropdown-border);
  border-radius: 6px;
  background: var(--white);
  box-shadow: var(--color-surface-shadow-hover);
}

.filter-dropdown__option {
  display: block;
  width: 100%;
  padding: 9px 11px;
  border: 0;
  background: transparent;
  color: var(--color-dropdown-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.filter-dropdown__option:hover {
  background: var(--white-soft);
}

.filter-dropdown__option--clear {
  border-bottom: 1px solid var(--color-border);
  color: var(--color-dropdown-clear-text);
  font-weight: 700;
}
</style>
