<template>
  <div>
    <TaskPage :documents="documents" :ranges="ranges" :authors="authors" />
  </div>
</template>

<script setup lang="ts">
import TaskPage from "@/components/pages/TaskPage.vue";
import type { DocumentsByStatus, AuthorGroups } from "@/types";

// Define props with type safety
const props = defineProps<{
  documents: DocumentsByStatus;
  authors: AuthorGroups;
  ranges: Array<{ id: string; label: string }>;
}>();

// Destructure for template clarity (optional)
const { documents, authors, ranges } = props;
</script>
