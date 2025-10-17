<template>
  <div id="task-actions">
    <Popper placement="left" arrow>
      <MoreIcon class="fill-[var(--color-body-more-icon)] cursor-pointer" />
      <template #content>
        <div>
          <button
            @click="emit('open-edit')"
            class="px-3 py-1 bg-gray-100 border rounded hover:bg-gray-200"
          >
            Edit Task
          </button>
          <button
            @click="emit('duplicate')"
            class="px-3 py-1 text-left rounded hover:bg-gray-100 transition"
          >
            Duplicate Task
          </button>
          <button
            @click="emit('delete')"
            class="px-3 py-1 text-left text-red-600 rounded hover:bg-red-100 transition"
          >
            Delete Task
          </button>
        </div>
      </template>
    </Popper>
  </div>
</template>
<script setup lang="ts">
import { MoreIcon } from "@/assets/icons";

const emit = defineEmits<{
  (e: "open-edit"): void;
  (e: "duplicate"): void;
  (e: "delete"): void;
}>();
</script>
