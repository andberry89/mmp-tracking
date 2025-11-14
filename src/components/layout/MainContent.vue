<template>
  <div>
    <Transition
      mode="out-in"
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
      @before-leave="isLoading = true"
      @after-enter="isLoading = false"
    >
      <div :key="activeLabel">
        <div v-if="isLoading" class="flex justify-center py-10">
          <LoadingSpinner />
        </div>
        <div v-else>
          <PageHeader v-bind="headerProps" />
          <component
            :is="activeComponent"
            :documents="filteredDocuments"
            :authors="authors"
            :activeAuthorsByTeam="activeAuthorsByTeam"
            @updateTask="handleTaskUpdate"
            @deleteTask="emit('deleteTask', $event)"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * MainContent.vue
 * ---------------------------
 * This component serves as the main content area of the application.
 * It dynamically renders different pages based on the active label
 * selected from the TopNav (e.g., MMPs, Makes, Models, Segments)
 */

import { computed, ref, watch } from "vue";
import { TaskPage, MakePage, ModelPage, SegmentPage, AuthorPage } from "@/components/pages";
import PageHeader from "@/components/pages/components/PageHeader.vue";
import type { DocumentsByStatus, AuthorGroups, TaskDocument } from "@/types";
import { getHeaderConfig } from "@/config/headerConfigs";

// Reactive State --------------------------------

// UI state for loading spinner during transitions
const isLoading = ref(false);

// Filter states
const selectedAuthorId = ref<string | null>(null);
const selectedRangeId = ref<string | null>(null);
const selectedStatusId = ref<string | null>(null);
const selectedMakeId = ref<string | null>(null);

// Props ------------------------------------
const props = defineProps<{
  documents: DocumentsByStatus;
  authors: AuthorGroups;
  ranges: Array<{ id: string; label: string }>;
  activeLabel: string;
}>();

const emit = defineEmits<{
  (e: "updateTask", updatedTask: TaskDocument): void;
  (e: "deleteTask", id: string): void;
}>();

// Computed --------------------------------

// Filter documents based on selected author
const filteredDocuments = computed(() => {
  if (!selectedAuthorId.value) return props.documents;

  return {
    pending: props.documents.pending.filter((doc) => doc.author?.id === selectedAuthorId.value),
    rtp: props.documents.rtp.filter((doc) => doc.author?.id === selectedAuthorId.value),
    published: props.documents.published.filter((doc) => doc.author?.id === selectedAuthorId.value),
  };
});

/**
 * Compute PageHeader props based on the current activeLabel.
 * Delegates layout and dropdown setup to getHeaderConfig(),
 * passing reactive filter setters for authors, ranges, status, and makes.
 */
const headerProps = computed(() =>
  getHeaderConfig(props.activeLabel, {
    authors: props.authors,
    ranges: props.ranges,
    setAuthor: (id: string) => (selectedAuthorId.value = id),
    setRange: (id: string) => (selectedRangeId.value = id),
    setStatus: (id: string) => (selectedStatusId.value = id),
    setMake: (id: string) => (selectedMakeId.value = id),
  })
);

// Determine which component to render based on the active label
const activeComponent = computed(() => {
  switch (props.activeLabel) {
    case "MMPs":
      return TaskPage;
    case "Makes":
      return MakePage;
    case "Models":
      return ModelPage;
    case "Segments":
      return SegmentPage;
    case "Authors":
      return AuthorPage;
    default:
      return TaskPage;
  }
});

// Compute active authors grouped by team
const activeAuthorsByTeam = computed(() => {
  const allAuthors = props.authors.all || [];
  const active = allAuthors.filter((a) => a.active);

  // sort alphabetically by team, then by last name
  active.sort((a, b) => {
    const teamCompare = a.team.label.localeCompare(b.team.label);
    if (teamCompare !== 0) return teamCompare;
    return a.lastName.localeCompare(b.lastName);
  });

  // group by team
  const groups: Record<string, typeof active> = {};
  active.forEach((author) => {
    const teamLabel = author.team.label;
    if (!groups[teamLabel]) groups[teamLabel] = [];
    groups[teamLabel].push(author);
  });

  // return as array of { team, members }
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([team, members]) => ({ team, members }));
});

// Methods --------------------------------
function handleTaskUpdate(updatedTask: TaskDocument) {
  emit("updateTask", updatedTask);
}

// Watchers --------------------------------

// Clear filters when activeLabel changes
watch(
  () => props.activeLabel,
  () => {
    selectedAuthorId.value = null;
    selectedRangeId.value = null;
    selectedStatusId.value = null;
    selectedMakeId.value = null;
  }
);

// Destructure for template clarity
const { documents, authors, ranges } = props;
</script>
