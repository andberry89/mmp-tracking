<template>
  <div
    class="bg-[var(--color-body-background)] border-2 border-solid border-[var(--color-body-border)] rounded-lg transition-all duration-100 ease-in-out hover:border-black"
  >
    <TaskHeader :doc="doc" />
    <TaskStatus
      :status="doc.status"
      :dateClass="getDateFormatClass(doc)"
      :dateText="getDateText(doc)"
    />
    <TaskNotes :docNotes="docNotes" :notes="doc.notes" />
    <TaskAssets :assets="doc.assets" />
    <TaskAuthor
      :author="doc.author"
      :authorsByTeam="activeAuthorsByTeam"
      @assign="(author) => emit('assign-author', { doc, author })"
    />
    <TaskActions
      @edit="emit('edit', doc)"
      @duplicate="emit('duplicate', doc)"
      @delete="emit('delete', doc)"
    />
  </div>
</template>

<script setup lang="ts">
//TODO: Refactor to reduce overhead
import { AddCircleIcon, HighPriorityIcon, MoreIcon } from "@/assets/icons";

import { getDateFormat, getDateText, getStatus, isHighPriority } from "@/utils/task-item-utils";
import { computed, ref, watch } from "vue";
import { ModalsContainer } from "vue-final-modal";
import TaskHeader from "@/components/task/components/TaskHeader.vue";
import TaskStatus from "@/components/task/components/TaskStatus.vue";
import TaskNotes from "@/components/task/components/TaskNotes.vue";
import TaskAssets from "@/components/task/components/TaskAssets.vue";
import TaskAuthor from "@/components/task/components/TaskAuthor.vue";
import TaskActions from "@/components/task/components/TaskActions.vue";
import type { TaskDocument } from "@/types";
import { authors } from "@/test";
import { dateFormatMap, statusClassMap, teamColorMap } from "@/constants";

// Props & Emits
const props = defineProps<{
  doc: TaskDocument;
  activeAuthorsByTeam?: Array<{ team: string; members: any[] }>;
}>();

const emit = defineEmits<{
  (e: "assign-author", payload: { doc: TaskDocument; author: any }): void;
  (e: "edit", doc: TaskDocument): void;
  (e: "duplicate", doc: TaskDocument): void;
  (e: "delete", doc: TaskDocument): void;
}>();

// Reactive state
const assignedAuthor = ref<string | null>(null);
const assignedAuthorHeader = ref("Assign Author");

// Computed
const docNotes = computed(() => {
  if (props.doc.notes.length <= 50) {
    return props.doc.notes;
  } else {
    return props.doc.notes.slice(0, 35) + "...";
  }
});

const getDateFormatClass = (doc: TaskDocument) => {
  const dateFormat = getDateFormat(doc);
  const normalized = dateFormatMap[dateFormat];
  return normalized || "";
};

// Methods
function assignAuthor(author) {
  emit("assign-author", { doc: props.doc, author });
}
</script>
<style lang="scss" scoped>
:deep(.popper) {
  width: auto;
  max-width: 25%;
}
</style>
