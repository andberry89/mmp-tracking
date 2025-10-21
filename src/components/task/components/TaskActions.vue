<template>
  <div id="task-actions">
    <Popper placement="left" arrow>
      <MoreIcon class="fill-[var(--color-body-more-icon)] cursor-pointer" />
      <!-- 👇 use close(), not hide() -->
      <template #content="{ close }">
        <div class="flex flex-col gap-1 p-2 min-w-[8rem]">
          <button
            @click="handleAction('edit', close)"
            class="px-3 py-1 bg-gray-100 border rounded hover:bg-gray-200"
          >
            Edit Task
          </button>

          <button
            @click="handleAction('duplicate', close)"
            class="px-3 py-1 text-left rounded hover:bg-gray-100 transition"
          >
            Duplicate Task
          </button>

          <button
            @click="handleAction('delete', close)"
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
  (e: "edit"): void;
  (e: "duplicate"): void;
  (e: "delete"): void;
}>();

function handleAction(type: "edit" | "duplicate" | "delete", close: () => void) {
  emit(type);
  close();
}
</script>
