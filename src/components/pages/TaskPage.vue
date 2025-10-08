<template>
  <div>
    <section class="flex flex-nowrap items-start justify-between gap-[10px]">
      <div>
        <h1 class="page-header">MMPs</h1>
      </div>
      <div class="flex items-start gap-[10px]">
        <form>
          <SearchBar v-model="searchQuery" placeholder="Search by vehicle or segment" />
        </form>

        <DropdownMenu
          class="min-w-[175px]"
          :options="authors.all.filter((author) => author.active)"
          label="Author"
          @update:selected="updateAuthor"
        />

        <DropdownMenu
          class="min-w-[130px]"
          :options="ranges"
          label="Status"
          @update:selected="updateRange"
        />

        <SortIcon class="header-icon" />
        <FilterIcon class="header-icon" />
      </div>
    </section>

    <TaskList :documents="filteredDocuments" :authors="authors" />
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
const searchQuery = ref("");

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

  return filters.value.author
    ? {
        published: props.documents.published.filter(
          (doc) => doc.author?.id === filters.value.author
        ),
        pending: props.documents.pending.filter((doc) => doc.author?.id === filters.value.author),
        rtp: props.documents.rtp.filter((doc) => doc.author?.id === filters.value.author),
      }
    : props.documents;
});
</script>
