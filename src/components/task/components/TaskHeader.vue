<template>
  <div>
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
}>();
</script>
