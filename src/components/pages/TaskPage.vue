<template>
  <TaskList
    :documents="filteredDocuments"
    :authors="authors"
    :activeAuthorsByTeam="activeAuthorsByTeam"
    @updateTask="handleTaskUpdate"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import TaskList from "@/components/task/TaskList.vue";
import type { DocumentsByStatus, AuthorGroups } from "@/types";

// ─── Props ───────────────────────────────────────────────────────────────────

// Define props with type safety
const props = defineProps<{
  documents: DocumentsByStatus;
  authors: AuthorGroups;
  activeAuthorsByTeam?: Array<{ team: string; members: any[] }>;
}>();

const localDocuments = ref<DocumentsByStatus>(structuredClone(props.documents));

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
  let docs = localDocuments.value;

  // TODO: Implement range filter if needed

  console.log("Filtered recomputed.");

  return filters.value.author
    ? {
        published: docs.published.filter((doc) => doc.author?.id === filters.value.author),
        pending: docs.pending.filter((doc) => doc.author?.id === filters.value.author),
        rtp: docs.rtp.filter((doc) => doc.author?.id === filters.value.author),
      }
    : docs;
});

//TODO: MOVE THIS TO PARENT

function handleTaskUpdate(updatedTask: TaskDocument) {
  const docs = { ...localDocuments.value };

  // Remove the task from all groups
  for (const status in docs) {
    docs[status] = docs[status].filter((task) => task.id !== updatedTask.id);
  }

  // Add the task back to the correct group
  if (updatedTask.status && docs[updatedTask.status]) {
    docs[updatedTask.status].push(updatedTask);
  }

  //TODO: OPTIONAL -- SORT?

  localDocuments.value = docs;

  console.log("Task updated and regrouped:", updatedTask);
}

// --- Watchers ────────────────────────────────────────────────────────────────
watch(
  () => props.documents,
  (newDocs) => {
    localDocuments.value = structuredClone(newDocs);
  }
);
</script>
