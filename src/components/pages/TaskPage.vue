<template>
  <div>
    <section class="flex flex-nowrap items-start justify-between gap-[10px]">
      <div>
        <h1
          class="font-bold text-2xl leading-[1.2] font-[Monda,sans-serif] text-[var(--color-body-header-text)] m-0"
        >
          MMPs
        </h1>
      </div>
      <div class="flex items-start gap-[10px]">
        <form>
          <div
            class="flex items-center w-[220px] h-[24px] bg-[var(--color-input-background)] border border-[var(--color-input-border)] px-[4px] rounded-[8px]"
          >
            <SearchIcon class="text-[var(--color-search-text-placeholder)]" />
            <input
              type="search"
              class="ml-[4px] flex-1 outline-none border-none bg-transparent text-[12px] font-[400] leading-[1] font-[Monda,sans-serif] text-[var(--color-search-text)] placeholder:text-[var(--color-search-text-placeholder)]"
              placeholder="Search by vehicle or segment"
            />
          </div>
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

    <TaskList :documents="filteredDocuments" />
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
