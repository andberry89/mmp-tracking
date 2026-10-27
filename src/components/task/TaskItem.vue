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
    <TaskNotes :doc="doc" />
    <TaskAssets
      :assets="doc.assets"
      :can-edit="canEdit"
      @delete-asset="(idx) => emit('delete-asset', { doc, idx })"
      @add-asset="(asset) => emit('add-asset', { doc, asset })"
    />
    <TaskAuthor
      v-if="canEdit"
      :author="author"
      :authorsByTeam="activeAuthorsByTeam ?? []"
      @assign="(author) => emit('assign-author', { doc, author })"
    />
    <div v-else class="text-center text-xs text-gray-700">{{ author?.initials || "—" }}</div>
    <TaskActions
      v-if="canEdit"
      @edit="emit('edit', doc)"
      @duplicate="emit('duplicate', doc)"
      @delete="emit('delete', doc)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getDateFormat, getDateText, getDocumentAuthor } from "@/utils";
import { DATE_FORMAT_MAP } from "@/constants";

import {
  TaskHeader,
  TaskStatus,
  TaskNotes,
  TaskAssets,
  TaskAuthor,
  TaskActions,
} from "@/components/task/components";

import type { Author, TaskDocument } from "@/types";

// ----------------------------------
// Props
// ----------------------------------
const props = defineProps<{
  doc: TaskDocument;
  activeAuthorsByTeam?: Array<{ team: string; members: Author[] }>;
  canEdit?: boolean;
}>();

// ----------------------------------
// Emits
// ----------------------------------
const emit = defineEmits<{
  (e: "assign-author", payload: { doc: TaskDocument; author: Author | null }): void;
  (e: "edit", doc: TaskDocument): void;
  (e: "duplicate", doc: TaskDocument): void;
  (e: "delete", doc: TaskDocument): void;
  (e: "delete-asset", payload: { doc: TaskDocument; idx: number }): void;
  (e: "add-asset", payload: { doc: TaskDocument; asset: { url: string; notes: string } }): void;
}>();

// ----------------------------------
// Computed
// ----------------------------------
const author = computed(() => getDocumentAuthor(props.doc));

// ----------------------------------
// Methods
// ----------------------------------
function getDateFormatClass(doc: TaskDocument): string {
  const format = getDateFormat(doc);
  return DATE_FORMAT_MAP[format] || "";
}
</script>
<style lang="scss" scoped>
:deep(.popper) {
  width: auto;
  max-width: 25%;
}
</style>
