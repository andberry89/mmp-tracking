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
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { TaskPage, MakePage, ModelPage, SegmentPage, AuthorPage } from "@/components/pages";
import PageHeader from "@/components/pages/components/PageHeader.vue";
import type { DocumentsByStatus, AuthorGroups } from "@/types";

const isLoading = ref(false);
const selectedAuthorId = ref<string | null>(null);

const props = defineProps<{
  documents: DocumentsByStatus;
  authors: AuthorGroups;
  ranges: Array<{ id: string; label: string }>;
  activeLabel: string;
}>();

// Computed --------------------------------

const filteredDocuments = computed(() => {
  if (!selectedAuthorId.value) return props.documents;

  return {
    pending: props.documents.pending.filter((doc) => doc.author?.id === selectedAuthorId.value),
    rtp: props.documents.rtp.filter((doc) => doc.author?.id === selectedAuthorId.value),
    published: props.documents.published.filter((doc) => doc.author?.id === selectedAuthorId.value),
  };
});

const headerProps = computed(() => {
  const activeAuthorsByLastName = props.authors.all
    .filter((a) => a.active)
    .sort((a, b) => a.lastName.localeCompare(b.lastName));
  switch (props.activeLabel) {
    case "MMPs":
      return {
        title: "MMPs",
        searchPlaceholder: "Search by make or segment...",
        dropdowns: [
          {
            id: "author",
            label: "Author",
            options: activeAuthorsByLastName.map((a) => ({ id: a.id, label: a.label })),
            onSelect: (id: string) => (selectedAuthorId.value = id),
            class: "min-w-[175px]",
          },
          {
            id: "range",
            label: "Status",
            options: props.ranges,
            onSelect: (id: string) => console.log("Range selected:", id),
            class: "min-w-[130px]",
          },
        ],
      };
    case "Makes":
      return {
        title: "Makes",
        searchPlaceholder: "Search by make...",
        dropdowns: [
          {
            id: "status",
            label: "Status",
            options: [
              { id: "active", label: "Active" },
              { id: "inactive", label: "Inactive" },
            ],
            onSelect: (id: string) => console.log("Status selected:", id),
            class: "min-w-[130px]",
          },
          {
            id: "range",
            label: "Range",
            options: props.ranges,
            onSelect: (id: string) => console.log("Range selected:", id),
            class: "min-w-[130px]",
          },
        ],
      };
    case "Models":
      return {
        title: "Models",
        searchPlaceholder: "Search by make or model...",
        dropdowns: [
          {
            id: "make",
            label: "Make",
            options: [
              { id: "toyota", label: "Toyota" },
              { id: "ford", label: "Ford" },
            ],
            onSelect: (id: string) => console.log("Make selected:", id),
            class: "min-w-[175px]",
          },
          {
            id: "status",
            label: "Status",
            options: [
              { id: "active", label: "Active" },
              { id: "inactive", label: "Inactive" },
            ],
            onSelect: (id: string) => console.log("Status selected:", id),
            class: "min-w-[130px]",
          },
        ], //TODO: Dynamic makes
      };
    case "Segments":
      return {
        title: "Segments",
        searchPlaceholder: "Search by segment...",
      };
    case "Authors":
      return {
        title: "Authors",
        searchPlaceholder: "Search by name...",
        dropdowns: [
          {
            id: "status",
            label: "Status",
            options: [
              { id: "active", label: "Active" },
              { id: "inactive", label: "Inactive" },
            ],
            onSelect: (id: string) => console.log("Status selected:", id),
            class: "min-w-[130px]",
          },
        ],
      };
    default:
      return {
        title: "MMPs",
        searchPlaceholder: "Search by make or segment...",
        dropdowns: [
          {
            id: "author",
            label: "Author",
            options: activeAuthorsByLastName.map((a) => ({ id: a.id, label: a.label })),
            onSelect: (id: string) => console.log("Author selected:", id),
            class: "min-w-[175px]",
          },
          {
            id: "range",
            label: "Status",
            options: props.ranges,
            onSelect: (id: string) => console.log("Range selected:", id),
            class: "min-w-[130px]",
          },
        ],
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

// Watchers --------------------------------
watch(
  () => props.activeLabel,
  () => {
    selectedAuthorId.value = null; // Reset author filter when active label changes
  }
);

// Destructure for template clarity (optional)
const { documents, authors, ranges } = props;
</script>
