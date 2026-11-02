<template>
  <div v-if="!doc.published" class="task-notes text-[var(--color-body-text-tertiary)] text-[11px]" :class="{ 'task-notes--empty': !doc.notes }">
    <span v-if="doc.notes" class="task-mobile-label" aria-hidden="true">Notes</span>
    <span>{{ truncatedNotes }}</span>
    <Popper class="notes-popper" placement="top" offset-distance="8" locked disableClickAway arrow>
      <div class="inline" @click="toggleNotes">
        <span
          v-if="doc.notes.length > 50"
          class="text-[var(--color-body-text-see-more)] cursor-pointer font-bold"
        >
          see {{ notesExpanded ? "less" : "more" }}
        </span>
      </div>
      <template #content>
        <div>
          <p>{{ doc.notes }}</p>
        </div>
      </template>
    </Popper>
  </div>
  <div v-else class="task-notes task-notes--empty text-[var(--color-body-text-tertiary)] text-[11px]"></div>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import type { TaskDocument } from "@/types";

// ----------------------------------
// Props
// ----------------------------------
const props = defineProps<{
  doc: TaskDocument;
}>();

// ----------------------------------
// State
// ----------------------------------
const notesExpanded = ref(false);

// ----------------------------------
// Computed
// ----------------------------------
const truncatedNotes = computed(() => {
  const notes = props.doc.notes;
  if (notes.length <= 50) return notes;
  return notes.slice(0, 30) + "...";
});

// ----------------------------------
// Methods
// ----------------------------------
function toggleNotes() {
  notesExpanded.value = !notesExpanded.value;
}
</script>
<style scoped>
.notes-popper :deep(.popper) {
  width: min(320px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--white);
  color: var(--gray-dark-4);
  box-shadow: var(--color-surface-shadow-hover);
  font: 400 0.86rem/1.45 "Asap", sans-serif;
  overflow-wrap: anywhere;
}

.notes-popper :deep(.popper p) { margin: 0; }
</style>
