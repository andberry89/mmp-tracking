<template>
  <div>
    <CatalogNav
      v-if="['Makes', 'Models', 'Segments', 'Authors'].includes(activeLabel)"
      :active-label="activeLabel"
      @select="emit('catalog-tab-change', $event)"
    />
    <Transition
      mode="out-in"
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div :key="activeLabel">
        <PageHeader v-if="activeLabel === 'MMPs'" v-bind="headerProps" @update:search="onSearchUpdate" />
        <component
          :is="activeComponent"
          :documents="filteredDocuments"
          :authors="authors"
          :activeAuthorsByTeam="activeAuthorsByTeam"
          :can-edit="canEdit"
          :search-query="activeLabel === 'MMPs' ? searchQuery : ''"
          :author-id="activeLabel === 'MMPs' ? selectedAuthorId : null"
        />
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

import { TaskPage, MakePage, ModelPage, SegmentPage, AuthorPage, ChangeoverPage, PageAuditPage, RankingsPage } from "@/components/pages";
import PageHeader from "@/components/pages/components/PageHeader.vue";
import CatalogNav from "@/components/pages/components/CatalogNav.vue";

import { getDocumentAuthor } from "@/utils/";
import { getHeaderConfig } from "@/config/headerConfigs";

import type { GroupedAuthors, TaskDocument, AuthorsByTeamGroup } from "@/types";

// Props ------------------------------------
const props = defineProps<{
  authors: GroupedAuthors;
  activeLabel: string;
  canEdit?: boolean;
}>();

const emit = defineEmits<{
  (event: "catalog-tab-change", label: string): void;
}>();

// Store ------------------------------------
const documentsStore = useDocumentsStore();

// UI State --------------------------------
const searchQuery = ref("");

const selectedAuthorId = ref<string | null>(null);

// Computed --------------------------------

// Filter documents based on selected author
const filteredDocuments = computed(() => {
  let docs: TaskDocument[] = documentsStore.documents;

  // Author filtering applies to both Active Work and Published & Updated.
  if (selectedAuthorId.value) {
    docs = docs.filter((doc) => {
      const docAuthor = getDocumentAuthor(doc);
      return docAuthor?.id === selectedAuthorId.value;
    });
  }

  // Search applies to both Publication Tracking views.
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

  }

  return docs;
});
/**
 * Compute Publication Tracking header props and connect its dropdowns to view filters.
 */
const headerProps = computed(() =>
  getHeaderConfig({
    authors: props.authors,
    setAuthor: (id: string) => (selectedAuthorId.value = id),
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
    case "Changeover":
      return ChangeoverPage;
    case "Page Audit":
      return PageAuditPage;
    case "Rankings":
      return RankingsPage;
    default:
      return TaskPage;
  }
});

// Active Authors By Team
const activeAuthorsByTeam = computed<AuthorsByTeamGroup[]>(() => {
  if (!props.authors?.all?.length) return [];

  const allAuthors = props.authors.all;
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
  }
);

</script>
