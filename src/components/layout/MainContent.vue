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
            :documents="documents"
            :authors="authors"
            :activeAuthorsByTeam="activeAuthorsByTeam"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { TaskPage, MakePage, ModelPage, SegmentPage, AuthorPage } from "@/components/pages";
import PageHeader from "@/components/pages/components/PageHeader.vue";
import type { DocumentsByStatus, AuthorGroups } from "@/types";

const isLoading = ref(false);

const props = defineProps<{
  documents: DocumentsByStatus;
  authors: AuthorGroups;
  ranges: Array<{ id: string; label: string }>;
  activeLabel: string;
}>();

const headerProps = computed(() => {
  switch (props.activeLabel) {
    case "MMPs":
      return {
        title: "MMPs",
        searchPlaceholder: "Search by make or segment...",
        authors: props.authors.all.filter((a) => a.active),
        ranges: props.ranges,
        showRanges: true,
        showStatus: false,
      };
    case "Makes":
      return {
        title: "Makes",
        searchPlaceholder: "Search by make...",
        showAuthor: false,
        statuses: [
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" },
        ],
        authors: props.authors.all.filter((a) => a.active),
        ranges: props.ranges,
      };
    case "Models":
      return {
        title: "Models",
        searchPlaceholder: "Search by make or model...",
        authorLabel: "Make",
        statusLabel: "Status",
        authors: props.authors.all.filter((a) => a.active),
        showFilter: false,
      };
    case "Segments":
      return {
        title: "Segments",
        searchPlaceholder: "Search by segment...",
        showAuthor: false,
        showStatus: false,
      };
    case "Authors":
      return {
        title: "Authors",
        showAuthor: false,
        statusLabel: "Status",
        statuses: [
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" },
        ],
      };
    default:
      return {
        title: "MMPs",
        searchPlaceholder: "Search by name...",
        authorLabel: "Author",
        statusLabel: "Status",
        authors: props.authors.all.filter((a) => a.active),
        ranges: props.ranges,
      };
  }
});

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

// Destructure for template clarity (optional)
const { documents, authors, ranges } = props;
</script>
