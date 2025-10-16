<template>
  <div class="text-[var(--color-body-text-tertiary)] text-[11px]">
    <span>{{ docNotes }}</span>
    <Popper placement="top" disableClickAway arrow>
      <div class="inline" @click="notesExpanded = !notesExpanded">
        <span
          v-if="notes.length > 50"
          class="text-[var(--color-body-text-see-more)] cursor-pointer font-bold"
        >
          see {{ notesExpanded ? "less" : "more" }}
        </span>
      </div>
      <template #content>
        <div>
          <p>{{ notes }}</p>
        </div>
      </template>
    </Popper>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

// Props ------------------------------------
const props = defineProps<{
  docNotes: string;
  notes: string;
}>();

// Reactive state ----------------------------
const notesExpanded = ref(false);
</script>
