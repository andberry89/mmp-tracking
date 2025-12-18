<template>
  <TaskList :authors="authors" :activeAuthorsByTeam="activeAuthorsByTeam" />
</template>

<script setup lang="ts">
import TaskList from "@/components/task/TaskList.vue";
import type { AuthorGroups } from "@/types";

// ─── Props ───────────────────────────────────────────────────────────────────

// Define props with type safety
const props = defineProps<{
  authors: AuthorGroups;
  activeAuthorsByTeam?: Array<{ team: string; members: any[] }>;
}>();
</script>
