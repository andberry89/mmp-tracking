<template>
  <div
    class="task-row bg-[var(--color-body-background)] border border-solid border-[var(--color-body-border)] rounded-lg transition-all duration-150 ease-in-out"
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
    <div v-else class="task-author-static">
      <span
        v-if="author"
        :class="['team-badge', TEAM_COLOR_MAP[author.team.slug], 'text-white']"
        :title="author.label"
        :aria-label="author.label"
      >
        {{ author.initials }}
      </span>
      <span v-else class="task-author-static__empty" aria-label="No author assigned">—</span>
    </div>
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
import { TEAM_COLOR_MAP } from "@/constants/task-style-maps";

import {
  TaskHeader,
  TaskStatus,
  TaskNotes,
  TaskAssets,
  TaskAuthor,
  TaskActions,
} from "@/components/task/components";

import type { Author, TaskDocument, TaskResourceInput } from "@/types";

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
  (e: "add-asset", payload: { doc: TaskDocument; asset: TaskResourceInput }): void;
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
<style scoped>
.task-author-static { display: flex; align-items: center; justify-content: center; min-width: 30px; }
.task-author-static .team-badge { width: 30px; height: 30px; border: 2px solid var(--white); box-shadow: 0 1px 3px rgb(0 0 0 / 18%); font-size: 0.66rem; }
.task-author-static__empty { color: var(--gray-light-3); font-size: 0.88rem; }
</style>
