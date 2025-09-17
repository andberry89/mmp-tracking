<template>
  <div>
    <section class="content-header">
      <div>
        <h1>MMPs</h1>
      </div>
      <div class="header-actions">
        <form>
          <div class="search-bar">
            <SearchIcon class="search-icon" />
            <input type="search" class="search-input" placeholder="Search by vehicle or segment" />
          </div>
        </form>

        <DropdownMenu
          class="author-dropdown"
          :options="authors.all.filter((author) => author.active)"
          label="Author"
          @update:selected="updateAuthor"
        />

        <DropdownMenu
          class="range-dropdown"
          :options="ranges"
          label="Status"
          @update:selected="updateRange"
        />

        <SortIcon class="sort-icon header-icon" />
        <FilterIcon class="filter-icon header-icon" />
      </div>
    </section>

    <TaskList :documents="filteredDocuments.value" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

import { FilterIcon, SearchIcon, SortIcon } from "@/assets/icons";
import TaskList from "@/components/layout/components/TaskList.vue";
import type { DocumentsByStatus, AuthorGroups } from "@/types";

// ─── Props ───────────────────────────────────────────────────────────────────

// Define props with type safety
const props = defineProps<{
  documents: DocumentsByStatus;
  authors: AuthorGroups;
  ranges: Array<{ id: string; label: string }>;
}>();

// ─── State ───────────────────────────────────────────────────────────────────
const filters = ref({
  author: "",
  range: "",
});

// ─── Methods ─────────────────────────────────────────────────────────────────
function updateAuthor(authorId: string) {
  console.log("Author ID selected:", authorId);
  filters.value.author = authorId;
}

function updateRange(rangeId: string) {
  console.log("Range ID selected:", rangeId);
  filters.value.range = rangeId;
}

// ─── Computed: Filtered Documents ────────────────────────────────────────────
const filteredDocuments = computed(() => {
  let docs = props.documents;

  // TODO: Implement range filter if needed

  if (filters.value.author !== "") {
    docs = {
      published: props.documents.published.filter((doc) => doc.author?.id === filters.value.author),
      pending: props.documents.pending.filter((doc) => doc.author?.id === filters.value.author),
      rtp: props.documents.rtp.filter((doc) => doc.author?.id === filters.value.author),
    };
  }

  return docs;
});
</script>
<style lang="scss" scoped>
.content-header {
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;

  h1 {
    font: 700 24px/1.2 "Monda", sans-serif;
    color: var(--color-body-header-text);
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: flex-start;
    gap: 10px;

    .author-dropdown {
      min-width: 175px;
    }
    .range-dropdown {
      min-width: 130px;
    }

    .search-bar {
      --padding: 4px;

      width: max-content;
      display: flex;
      align-items: center;
      background-color: var(--color-input-background);
      border: 1px solid var(--color-input-border);
      padding: var(--padding);
      border-radius: 8px;
      width: 220px;
      height: 24px;

      .search-input {
        font: 400 12px/1 "Monda", sans-serif;
        color: var(--color-search-text);
        margin-left: var(--padding);
        outline: none;
        border: none;
        background: transparent;
        flex: 1;
      }

      .search-input::placeholder,
      .search-icon {
        color: var(--color-search-text-placeholder);
      }
    }
    .header-icon {
      --sides: 22px;

      width: var(--sides);
      height: var(--sides);
      fill: var(--color-icon);
      background-color: var(--color-input-background);
      border: 1px solid var(--color-input-border);
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.4s ease-in-out;

      &:hover {
        background-color: var(--color-input-background-hover);
        fill: var(--color-icon-hover);
      }
    }
  }
}
</style>
