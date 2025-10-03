<template>
  <nav class="flex flex-nowrap w-full pl-5">
    <span
      v-for="label in tabs"
      :key="label"
      :class="[
        'inline-block font-bold text-[32px] leading-[1.2] font-[Monda,sans-serif] text-[var(--color-header-text)] mr-10 cursor-pointer pb-[10px] hover:text-[var(--color-header-text-hover)]',
        label === activeTab && 'border-b-[4px] border-[var(--color-header-text-underline)]',
      ]"
      @click="handleClick(label)"
    >
      {{ label }}
    </span>
  </nav>
</template>

<script setup lang="ts">
import { ref } from "vue";

// Tabs to render in the navigation
const tabs = ["MMPs", "Makes", "Models", "Segments", "Authors"];

// Local State
const activeTab = ref("MMPs");

// Define emit
const emit = defineEmits<{
  (e: "tab-change", label: string): void;
}>();

function handleClick(label: string) {
  activeTab.value = label;
  emit("tab-change", label);
}
</script>
