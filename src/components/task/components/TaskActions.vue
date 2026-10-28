<template>
  <Popper class="task-actions" placement="left" offset-distance="8" arrow>
    <button
      type="button"
      class="task-actions__trigger"
      aria-label="Task actions"
      aria-haspopup="menu"
      title="Task actions"
    >
      <MoreIcon />
    </button>

    <template #content="{ close }">
      <div class="task-actions__menu" role="menu" aria-label="Task actions">
        <button type="button" role="menuitem" @click="handleAction('edit', close)">Edit task</button>
        <button type="button" role="menuitem" @click="handleAction('duplicate', close)">Duplicate task</button>
        <button type="button" role="menuitem" class="task-actions__delete" @click="handleAction('delete', close)">Delete task</button>
      </div>
    </template>
  </Popper>
</template>

<script setup lang="ts">
import { MoreIcon } from "@/assets/icons";

const emit = defineEmits<{ (e: "edit"): void; (e: "duplicate"): void; (e: "delete"): void }>();

function handleAction(type: "edit" | "duplicate" | "delete", close: () => void) {
  switch (type) {
    case "edit": emit("edit"); break;
    case "duplicate": emit("duplicate"); break;
    case "delete": emit("delete"); break;
  }
  close();
}
</script>

<style scoped>
.task-actions__trigger { display: grid; width: 30px; height: 30px; place-items: center; padding: 0; border: 1px solid transparent; border-radius: 6px; background: transparent; color: var(--gray-light-4); cursor: pointer; transition: color 140ms ease, border-color 140ms ease, background-color 140ms ease; }
.task-actions__trigger:hover, .task-actions__trigger:focus-visible { border-color: var(--color-border); background: var(--white); color: var(--gray-dark-4); }
.task-actions__trigger:focus-visible, .task-actions__menu button:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }
.task-actions__trigger :deep(svg) { width: 18px; height: 18px; fill: currentColor; }
.task-actions :deep(.popper) { width: 176px; max-width: calc(100vw - 24px); padding: 5px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--white); color: var(--gray-dark-4); box-shadow: var(--color-surface-shadow-hover); }
.task-actions__menu { display: grid; gap: 2px; }
.task-actions__menu button { min-height: 34px; padding: 0 9px; border: 0; border-radius: 5px; background: transparent; color: var(--gray-dark-4); cursor: pointer; font: 500 0.82rem "Asap", sans-serif; text-align: left; }
.task-actions__menu button:hover { background: var(--white-soft); color: var(--gray-dark-5); }
.task-actions__menu .task-actions__delete { margin-top: 3px; border-top: 1px solid var(--color-divider); border-radius: 0 0 5px 5px; color: var(--red-dark); }
.task-actions__menu .task-actions__delete:hover { background: color-mix(in srgb, var(--red) 8%, white); color: var(--red-dark); }
</style>
