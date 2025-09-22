<template>
  <nav class="flex flex-nowrap w-full pl-5">
    <span
      v-for="label in tabs"
      :key="label"
      :class="[
        'inline-block font-bold text-[32px] leading-[1.2] font-[Monda,sans-serif] text-[var(--color-header-text)] mr-10 cursor-pointer pb-[10px] hover:text-[var(--color-header-text-hover)]',
        label === activeTab && 'border-b-[4px] border-[var(--color-header-text-underline)]',
      ]"
      @click="activeTab = label"
    >
      {{ label }}
    </span>
  </nav>
</template>

<script setup lang="ts">
import { ref } from "vue";

const tabs = ["MMPs", "Makes", "Models", "Segments", "Authors"];
const activeTab = ref("MMPs");
</script>
