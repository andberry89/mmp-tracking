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
    <span class="text-[var(--color-body-text)]">{{
      `${doc.vehicle.modelYear} ${doc.vehicle.make} ${doc.vehicle.model}`
    }}</span>
    <span class="text-[var(--color-body-text-secondary)]">{{ doc.vehicle.segment }}</span>
  </div>

  <div
    :class="[
      'font-bold',
      isHighPriority(doc)
        ? 'text-[var(--color-body-text-priority)]'
        : 'text-[var(--color-body-text-secondary)]',
    ]"
  >
    {{ doc.published ? "" : doc.deadline }}
  </div>
</template>
<script setup lang="ts">
import { HighPriorityIcon } from "@/assets/icons";
import { isHighPriority } from "@/utils/task-item-utils";
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
.task-drag-handle { display: grid; width: 18px; height: 26px; place-items: center; padding: 0; border: 0; border-radius: 4px; background: transparent; color: var(--gray-light-3); cursor: grab; font-size: 17px; line-height: 1; }
.task-drag-handle:hover { background: var(--white-soft); color: var(--gray-dark-3); }
.task-drag-handle:active { cursor: grabbing; }
.task-drag-handle:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }
</style>
