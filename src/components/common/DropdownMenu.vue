<template>
  <div
    class="relative flex flex-col min-w-[110px] h-[22px] font-asap font-normal text-xs leading-[1.2] text-[var(--color-dropdown-text)] bg-[var(--color-input-background)] border border-[var(--color-input-border)] rounded-t cursor-pointer"
    v-click-outside="closeDropdown"
  >
    <div
      class="flex justify-between items-center gap-[5px] p-1 text-[var(--color-search-text)]"
      @click="isOpen = !isOpen"
    >
      <div>
        <span>{{ label }}:</span>
        <span class="ml-1 text-[var(--color-dropdown-text)]">{{ activeLabel }}</span>
      </div>
      <svg
        fill="#b9b9b9"
        width="8px"
        height="8px"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        stroke="#b9b9b9"
        class="ml-2"
      >
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
          <path
            d="M11.178 19.569a.998.998 0 0 0 1.644 0l9-13A.999.999 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569l9 13z"
          ></path>
        </g>
      </svg>
    </div>
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
        class="absolute top-full w-full border border-[var(--color-dropdown-border)] border-t-0 rounded-b bg-[var(--color-input-background)] overflow-hidden"
        v-if="isOpen"
      >
        <div
          v-if="activeLabel !== ''"
          @click="setActive({ id: '', label: '' })"
          class="px-2 py-1 font-bold text-[var(--color-dropdown-clear-text)] hover:bg-[var(--color-input-hover)] transition duration-200 cursor-pointer"
        >
          Clear Selection
        </div>
        <div
          class="px-2 py-1 text-[var(--color-dropdown-text)] hover:bg-[var(--color-input-hover)] transition duration-200 cursor-pointer"
          v-for="(item, i) in options"
          :key="i + '-' + label"
          @click="setActive(item)"
        >
          {{ item.label }}
        </div>
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

const props = defineProps<{
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
