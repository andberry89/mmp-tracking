<template>
  <div v-if="!doc.published" class="text-[var(--color-body-text-tertiary)] text-[11px]">
    <span>{{ docNotes }}</span>
    <Popper placement="top" disableClickAway arrow>
      <div class="inline" @click="notesExpanded = !notesExpanded">
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

// Props ------------------------------------
const props = defineProps<{
  doc: TaskDocument;
}>();

// Reactive state ----------------------------
const notesExpanded = ref(false);

// Computed
const docNotes = computed(() => {
  if (props.doc.notes.length <= 50) {
    return props.doc.notes;
  } else {
    return props.doc.notes.slice(0, 30) + "...";
  }
});
</script>
