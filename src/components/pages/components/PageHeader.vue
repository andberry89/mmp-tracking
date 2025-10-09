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
        v-if="showAuthor"
        class="min-w-[175px]"
        :options="authors"
        :label="authorLabel"
        @update:selected="emitAuthor"
      />

      <DropdownMenu
        v-if="showRanges"
        class="min-w-[175px]"
        :options="ranges"
        :label="rangeLabel"
        @update:selected="emitRange"
      />

      <DropdownMenu
        v-if="showStatus"
        class="min-w-[130px]"
        :options="statuses"
        :label="statusLabel"
        @update:selected="emitRange"
      />

      <SortIcon v-if="showSort" class="header-icon" @click="$emit('sort-click')" />
      <FilterIcon v-if="showFilter" class="header-icon" @click="$emit('filter-click')" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { FilterIcon, SortIcon } from "@/assets/icons";

interface Props {
  title: string;
  searchPlaceholder?: string;
  authors?: Array<{ id: string; label: string }>;
  ranges?: Array<{ id: string; label: string }>;
  statuses?: Array<{ id: string; label: string }>;
  authorLabel?: string;
  rangeLabel?: string;
  statusLabel?: string;
  showAuthor?: boolean;
  showRanges?: boolean;
  showStatus?: boolean;
  showSort?: boolean;
  showFilter?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  authorLabel: "Author",
  rangeLabel: "Date Range",
  statusLabel: "Status",
  searchPlaceholder: "Search...",
  showSort: true,
  showFilter: true,
  showAuthor: true,
  showRanges: false,
  showStatus: true,
});

const emit = defineEmits([
  "update:author",
  "update:range",
  "update:search",
  "sort-click",
  "filter-click",
]);

const localSearch = ref("");

watch(localSearch, (val) => emit("update:search", val));

function emitAuthor(authorId: string) {
  emit("update:author", authorId);
}

function emitRange(rangeId: string) {
  emit("update:range", rangeId);
}
</script>
