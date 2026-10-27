<template>
  <TaskList
    :documents="documents"
    :active-authors-by-team="activeAuthorsByTeam"
    :can-edit="canEdit"
  />
</template>

<script setup lang="ts">
import TaskList from "@/components/task/TaskList.vue";
import type { AuthorsByTeamGroup, GroupedAuthors, TaskDocument } from "@/types";

// ─── Props ───────────────────────────────────────────────────────────────────

// Define props with type safety
defineProps<{
  documents?: TaskDocument[];
  authors: GroupedAuthors;
  activeAuthorsByTeam?: AuthorsByTeamGroup[];
  canEdit?: boolean;
}>();
</script>
