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
      @delete-asset="(idx) => emit('delete-asset', { doc, idx })"
      @add-asset="(asset) => emit('add-asset', { doc, asset })"
    />
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
import { getDateFormat, getDateText } from "@/utils/task-item-utils";
import { DATE_FORMAT_MAP } from "@/constants";

import {
  TaskHeader,
  TaskStatus,
  TaskNotes,
  TaskAssets,
  TaskAuthor,
  TaskActions,
} from "@/components/task/components";

import type { TaskDocument } from "@/types";

// ----------------------------------
// Props
// ----------------------------------
const props = defineProps<{
  doc: TaskDocument;
  activeAuthorsByTeam?: Array<{ team: string; members: any[] }>;
}>();

// ----------------------------------
// Emits
// ----------------------------------
const emit = defineEmits<{
  (e: "assign-author", payload: { doc: TaskDocument; author: any }): void;
  (e: "edit", doc: TaskDocument): void;
  (e: "duplicate", doc: TaskDocument): void;
  (e: "delete", doc: TaskDocument): void;
  (e: "delete-asset", payload: { doc: TaskDocument; idx: number }): void;
  (e: "add-asset", payload: { doc: TaskDocument; asset: { url: string; notes: string } }): void;
}>();

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
