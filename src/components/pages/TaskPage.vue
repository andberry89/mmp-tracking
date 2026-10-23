<template>
  <TaskList
    :documents="documents"
    :active-authors-by-team="activeAuthorsByTeam"
  />
</template>

<script setup lang="ts">
import TaskList from "@/components/task/TaskList.vue";
import type { AuthorsByTeamGroup, DocumentsByStatus, GroupedAuthors } from "@/types";

// ─── Props ───────────────────────────────────────────────────────────────────

// Define props with type safety
defineProps<{
  documents?: DocumentsByStatus;
  authors: GroupedAuthors;
  activeAuthorsByTeam?: AuthorsByTeamGroup[];
}>();
</script>
