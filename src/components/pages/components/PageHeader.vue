<template>
  <section class="page-toolbar">
    <div>
      <h1 class="page-header">{{ title }}</h1>
    </div>
    <div class="page-toolbar__controls">
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

<style scoped>
.page-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px 20px;
  margin-bottom: 22px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--color-divider);
}

.page-toolbar__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
