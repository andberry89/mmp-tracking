<template>
  <TaskList
    :documents="documents"
    :authors="authors"
    :activeAuthorsByTeam="activeAuthorsByTeam"
    @updateTask="emit('updateTask', $event)"
    @deleteTask="emit('deleteTask', $event)"
    @duplicateTask="emit('duplicateTask', $event)"
  />
</template>

<script setup lang="ts">
import TaskList from "@/components/task/TaskList.vue";
import type { DocumentsByStatus, AuthorGroups } from "@/types";

// ─── Props ───────────────────────────────────────────────────────────────────

// Define props with type safety
const props = defineProps<{
  documents: DocumentsByStatus;
  authors: AuthorGroups;
  activeAuthorsByTeam?: Array<{ team: string; members: any[] }>;
}>();

const emit = defineEmits<{
  (e: "updateTask", updatedTask: TaskDocument): void;
  (e: "deleteTask", id: string): void;
  (e: "duplicateTask", task: TaskDocument): void;
}>();

// ─── Methods ─────────────────────────────────────────────────────────────────
function updateAuthor(authorId: string) {
  console.log("Author ID selected:", authorId);
  filters.value.author = authorId;
}

function updateRange(rangeId: string) {
  console.log("Range ID selected:", rangeId);
  filters.value.range = rangeId;
}
</script>
