<template>
  <div class="task-row-leading">
    <button
      v-if="canDrag"
      type="button"
      class="task-drag-handle"
      draggable="true"
      :aria-label="`Drag ${doc.vehicle.make} ${doc.vehicle.model} to another status`"
      title="Drag to change status"
      @dragstart="emit('drag-start', $event)"
    >
      <span aria-hidden="true">⠿</span>
    </button>
    <HighPriorityIcon
      v-if="isHighPriority(doc)"
      v-tooltip="{ theme: 'info-tooltip', content: 'High Priority MMP' }"
    />
  </div>

  <div class="task-vehicle flex flex-col items-start pl-2 font-bold">
    <div class="task-vehicle__topline">
      <span class="task-vehicle__name text-[var(--color-body-text)]">{{
        `${doc.vehicle.modelYear} ${doc.vehicle.make} ${doc.vehicle.model}`
      }}</span>
      <div v-if="!doc.published && doc.tags?.length" class="task-event-tags" aria-label="Event tags">
        <span
          v-for="tag in doc.tags"
          :key="tag"
          class="task-event-tag"
          :style="getEventTagStyle(tag)"
        >{{ tag }}</span>
      </div>
    </div>
    <span class="text-[var(--color-body-text-secondary)]">{{ doc.vehicle.segment }}</span>
  </div>

  <div
    class="task-deadline"
    :class="{ 'task-deadline--empty': doc.published || !doc.deadline }"
  >
    <span class="task-mobile-label" aria-hidden="true">Deadline</span>
    <span :class="[
      'font-bold',
      isHighPriority(doc)
        ? 'text-[var(--color-body-text-priority)]'
        : 'text-[var(--color-body-text-secondary)]',
    ]">{{ doc.published ? "" : doc.deadline }}</span>
  </div>
</template>
<script setup lang="ts">
import { HighPriorityIcon } from "@/assets/icons";
import { isHighPriority } from "@/utils/task-item-utils";
import { getEventTagStyle } from "@/utils/event-tag-style";
import type { TaskDocument } from "@/types";

// ----------------------------------
// Props
// ----------------------------------
defineProps<{
  doc: TaskDocument;
  canDrag?: boolean;
}>();
const emit = defineEmits<{ (event: "drag-start", dragEvent: DragEvent): void }>();
</script>

<style scoped>
.task-row-leading { display: flex; align-items: center; justify-content: flex-start; gap: 3px; min-width: 0; }
.task-vehicle { width: 100%; min-width: 0; }
.task-vehicle__topline { display: flex; width: 100%; min-width: 0; align-items: flex-start; justify-content: space-between; gap: 8px; }
.task-vehicle__name { min-width: 0; }
.task-event-tags { display: flex; flex: 0 1 auto; flex-wrap: wrap; justify-content: flex-end; gap: 3px; min-width: 0; max-width: 50%; }
.task-event-tag { max-width: 100%; overflow: hidden; padding: 2px 6px; border: 1px solid var(--event-tag-border); border-radius: 999px; background: var(--event-tag-background); color: var(--event-tag-text); font-size: 0.65rem; font-weight: 600; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
.task-drag-handle { display: grid; width: 18px; height: 26px; place-items: center; padding: 0; border: 0; border-radius: 4px; background: transparent; color: var(--gray-light-3); cursor: grab; font-size: 17px; line-height: 1; }
.task-drag-handle:hover { background: var(--white-soft); color: var(--gray-dark-3); }
.task-drag-handle:active { cursor: grabbing; }
.task-drag-handle:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }
</style>
