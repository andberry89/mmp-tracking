<template>
  <div v-if="!doc.published" class="text-[var(--color-body-text-tertiary)] text-[11px]">
    <span>{{ truncatedNotes }}</span>
    <Popper placement="top" disableClickAway arrow>
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
  <div v-else class="text-[var(--color-body-text-tertiary)] text-[11px]"></div>
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
