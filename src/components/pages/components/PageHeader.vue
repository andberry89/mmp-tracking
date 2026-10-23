<template>
  <section class="flex flex-nowrap items-start justify-between gap-[10px]">
    <div>
      <h1 class="page-header">{{ title }}</h1>
    </div>
    <div class="flex items-start gap-[10px]">
      <form @submit.prevent>
        <SearchBar v-model="localSearch" :placeholder="searchPlaceholder" />
      </form>

      <DropdownMenu
        v-for="dropdown in dropdowns"
        :key="dropdown.id"
        :options="dropdown.options"
        :label="dropdown.label"
        :class="dropdown.class"
        @update:selected="dropdown.onSelect"
      />

      <SortIcon v-if="showSort" class="header-icon" @click="$emit('sort-click')" />
      <FilterIcon v-if="showFilter" class="header-icon" @click="$emit('filter-click')" />
    </div>
  </section>
</template>

<script setup lang="ts">
//TODO: Cleanup Dropdown Menu
import { ref, watch } from "vue";
import { FilterIcon, SortIcon } from "@/assets/icons";
import type { DropdownConfig } from "@/types";

interface PageHeaderProps {
  title: string;
  searchPlaceholder?: string;
  dropdowns?: DropdownConfig[];
  showSort?: boolean;
  showFilter?: boolean;
}

withDefaults(defineProps<PageHeaderProps>(), {
  searchPlaceholder: "Search...",
  showSort: true,
  showFilter: true,
});

const emit = defineEmits<{
  (e: "update:search", value: string): void;
  (e: "sort-click"): void;
  (e: "filter-click"): void;
}>();

const localSearch = ref("");

watch(localSearch, (value) => emit("update:search", value));
</script>
