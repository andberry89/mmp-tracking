<template>
  <div>
    <TaskPage
      v-if="activeLabel === 'MMPs'"
      :documents="documents"
      :ranges="ranges"
      :authors="authors"
    />
    <MakePage v-if="activeLabel === 'Makes'" />
  </div>
</template>

<script setup lang="ts">
import TaskPage from "@/components/pages/TaskPage.vue";
import MakePage from "@/components/pages/MakePage.vue";
import type { DocumentsByStatus, AuthorGroups } from "@/types";

// Define props with type safety
const props = defineProps<{
  documents: DocumentsByStatus;
  authors: AuthorGroups;
  ranges: Array<{ id: string; label: string }>;
  activeLabel: string;
}>();

// Destructure for template clarity (optional)
const { documents, authors, ranges } = props;
</script>
