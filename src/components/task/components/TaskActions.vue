<template>
  <div id="task-actions">
    <Popper placement="left" arrow>
      <MoreIcon
        class="fill-[var(--color-body-more-icon)] cursor-pointer hover:opacity-80 transition"
      />

      <template #content="{ close }">
        <div class="flex flex-col text-sm min-w-[8rem] select-none">
          <button
            @click="handleAction('edit', close)"
            class="px-3 py-1.5 text-left cursor-pointer rounded font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            Edit Task
          </button>

          <button
            @click="handleAction('duplicate', close)"
            class="px-3 py-1.5 text-left cursor-pointer rounded text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Duplicate Task
          </button>

          <button
            @click="handleAction('delete', close)"
            class="px-3 py-1.5 text-left cursor-pointer rounded text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            Delete Task
          </button>
        </div>
      </template>
    </Popper>
  </div>
</template>

<script setup lang="ts">
// TODO: ADD SOME QUICK ACTIONS
// SUCH AS
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
