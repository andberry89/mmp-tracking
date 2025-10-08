<template>
  <div>
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
      mode="out-in"
    >
      <component
        :is="activeComponent"
        :key="activeLabel"
        :documents="documents"
        :ranges="ranges"
        :authors="authors"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import TaskPage from "@/components/pages/TaskPage.vue";
import MakePage from "@/components/pages/MakePage.vue";
import ModelPage from "@/components/pages/ModelPage.vue";
import SegmentPage from "@/components/pages/SegmentPage.vue";
import AuthorPage from "@/components/pages/AuthorPage.vue";
import type { DocumentsByStatus, AuthorGroups } from "@/types";

const props = defineProps<{
  documents: DocumentsByStatus;
  authors: AuthorGroups;
  ranges: Array<{ id: string; label: string }>;
  activeLabel: string;
}>();

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
      return TaskPage; // Fallback component
  }
});

// Destructure for template clarity (optional)
const { documents, authors, ranges } = props;
</script>
