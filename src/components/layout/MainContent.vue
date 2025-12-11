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
          <PageHeader v-bind="headerProps" @update:search="onSearchUpdate" />
          <component
            :is="activeComponent"
            :documents="filteredDocuments"
            :authors="authors"
            :activeAuthorsByTeam="activeAuthorsByTeam"
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
import { useDocumentsStore } from "@/stores/documents";

import { TaskPage, MakePage, ModelPage, SegmentPage, AuthorPage } from "@/components/pages";
import PageHeader from "@/components/pages/components/PageHeader.vue";

import { getRangeDates } from "@/utils/";
import { getHeaderConfig } from "@/config/headerConfigs";
import { isWithinInterval } from "date-fns";

import type { AuthorGroups, TaskDocument } from "@/types";

// Props ------------------------------------
const props = defineProps<{
  authors: AuthorGroups;
  ranges: Array<{ id: string; label: string }>;
  activeLabel: string;
}>();

// Store ------------------------------------
const documentsStore = useDocumentsStore();

// UI State --------------------------------
const isLoading = ref(false);
const searchQuery = ref("");

const selectedAuthorId = ref<string | null>(null);
const selectedRangeId = ref<string | null>(null);
const selectedStatusId = ref<string | null>(null);
const selectedMakeId = ref<string | null>(null);

// Computed --------------------------------

// Filter documents based on selected author
const filteredDocuments = computed(() => {
  let docs: TaskDocument[] = documentsStore.documents;

  // 1. Range Filtering
  const range = getRangeDates(selectedRangeId.value);
  if (range) {
    const { start, end } = range;
    docs = docs.filter((doc) => {
      if (!doc.publishedDate) return false;
      return isWithinInterval(new Date(doc.publishedDate), { start, end });
    });
  }

  // 2. Author Filtering
  if (selectedAuthorId.value) {
    docs = docs.filter((doc) => doc.author?.id === selectedAuthorId.value);
  }

  // 3. Search Filtering (MMPs only)
  if (props.activeLabel === "MMPs" && searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase();
    docs = docs.filter((doc) => {
      const makeMatch = doc.vehicle?.make?.toLowerCase() ?? "";
      const segmentMatch = doc.vehicle?.segment?.toLowerCase() ?? "";
      const modelMatch = doc.vehicle?.model?.toLowerCase() ?? "";
      const yearMatch = doc.vehicle?.modelYear?.toString() ?? "";
      return (
        makeMatch.includes(query) ||
        segmentMatch.includes(query) ||
        modelMatch.includes(query) ||
        yearMatch.includes(query)
      );
    });

    // 4. Return grouped structure for TaskPage compatibility
    return {
      pending: docs.filter((doc) => doc.status === "pending"),
      rtp: docs.filter((doc) => doc.status === "rtp"),
      published: docs.filter((doc) => doc.status === "published"),
    };
  }
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

// Active Page Component
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

// Active Authors By Team
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

function onSearchUpdate(query: string) {
  searchQuery.value = query;
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
