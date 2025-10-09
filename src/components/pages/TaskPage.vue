<template>
  <TaskList
    :documents="filteredDocuments"
    :authors="authors"
    :activeAuthorsByTeam="activeAuthorsByTeam"
  />
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import TaskList from "@/components/layout/components/TaskList.vue";
import type { DocumentsByStatus, AuthorGroups } from "@/types";

// ─── Props ───────────────────────────────────────────────────────────────────

// Define props with type safety
const props = defineProps<{
  documents: DocumentsByStatus;
  authors: AuthorGroups;
  activeAuthorsByTeam?: Array<{ team: string; members: any[] }>;
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

//TODO: MOVE THIS TO PARENT
</script>
