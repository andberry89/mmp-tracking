<template>
  <Popper class="author-picker" placement="left" offset-distance="8" arrow>
    <button
      v-if="author"
      type="button"
      :class="['team-badge author-trigger', getTeamColorClass(author.team.slug)]"
      :aria-label="`Change author. Currently assigned to ${author.label}`"
      :title="author.label"
      aria-haspopup="dialog"
    >
      {{ author.initials }}
    </button>

    <button
      v-else
      type="button"
      class="author-trigger author-trigger--empty"
      aria-label="Assign an author"
      title="Assign an author"
    >
      <AddCircleIcon />
    </button>

    <template #content="{ close }">
      <section class="author-picker__panel" aria-label="Choose an author">
        <h2 class="author-picker__title">{{ headerText }}</h2>
        <button
          v-if="author"
          type="button"
          class="author-picker__unassign"
          @click="handleAssign(null, close)"
        >
          Unassign author
        </button>
        <p v-if="!authorsByTeam.length" class="author-picker__empty">No active authors</p>
        <section v-for="group in authorsByTeam" :key="group.team" class="author-group">
          <h3 class="author-group__title">{{ group.team }}</h3>
          <div class="author-group__members">
            <button
              v-for="authorItem in group.members"
              :key="authorItem.id"
              type="button"
              class="author-option"
              :class="{ 'author-option--selected': selectedAuthorId === authorItem.id }"
              :aria-pressed="selectedAuthorId === authorItem.id"
              @click="handleAssign(authorItem, close)"
            >
              <span :class="['team-badge author-option__badge', getTeamColorClass(authorItem.team.slug)]">
                <span :class="['author-option__initials', selectedAuthorId === authorItem.id && 'author-option__initials--hidden']">{{ authorItem.initials }}</span>
                <svg v-if="selectedAuthorId === authorItem.id" class="author-option__check" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="m5 13 4 4L19 7" />
                </svg>
              </span>
              <span class="author-option__name">{{ authorItem.label }}</span>
            </button>
          </div>
        </section>
      </section>
    </template>
  </Popper>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { AddCircleIcon } from "@/assets/icons";
import { TEAM_COLOR_MAP } from "@/constants/task-style-maps";
import type { Author, AuthorsByTeamGroup, AssignState } from "@/types";

const FEEDBACK_DELAY_MS = 1000;
const props = defineProps<{ author: Author | null; authorsByTeam: AuthorsByTeamGroup[] }>();
const emit = defineEmits<{ (e: "assign", author: Author | null): void }>();

const selectedAuthorId = ref<string | null>(null);
const assignState = ref<AssignState>("unassigned");
const pendingAuthor = ref<string | null>(null);
const headerText = computed(() => {
  if (assignState.value === "assigned" && pendingAuthor.value) return `Assigned to ${pendingAuthor.value}`;
  if (assignState.value === "removed") return "Author removed";
  return "Choose an author";
});

function getTeamColorClass(team: Author["team"]["slug"]) {
  return `${TEAM_COLOR_MAP[team] ?? ""} text-white`;
}

type CloseFn = () => void;
function handleAssign(author: Author | null, close?: CloseFn) {
  if (author) {
    selectedAuthorId.value = author.id;
    pendingAuthor.value = author.firstName;
    assignState.value = "assigned";
    setTimeout(() => {
      emit("assign", author);
      selectedAuthorId.value = null;
      pendingAuthor.value = null;
      assignState.value = "unassigned";
      close?.();
    }, FEEDBACK_DELAY_MS);
    return;
  }

  assignState.value = "removed";
  setTimeout(() => {
    emit("assign", null);
    assignState.value = "unassigned";
    close?.();
  }, FEEDBACK_DELAY_MS);
}
</script>

<style scoped>
.author-trigger { display: inline-grid; width: 30px; height: 30px; place-items: center; padding: 0; border: 2px solid var(--white); border-radius: 50%; box-shadow: 0 1px 3px rgb(0 0 0 / 18%); cursor: pointer; font: 700 0.66rem/1 "Asap", sans-serif; transition: transform 140ms ease, box-shadow 140ms ease; }
.author-trigger:hover { transform: translateY(-1px) scale(1.04); box-shadow: 0 2px 5px rgb(0 0 0 / 22%); }
.author-trigger:focus-visible, .author-option:focus-visible, .author-picker__unassign:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }
.author-trigger--empty { border-color: transparent; background: transparent; color: var(--gray-light-3); }
.author-trigger--empty :deep(svg) { width: 22px; height: 22px; fill: currentColor; }
.author-picker :deep(.popper) { width: min(360px, calc(100vw - 32px)); max-width: calc(100vw - 32px); max-height: min(70vh, 560px); overflow: auto; padding: 15px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--white); color: var(--gray-dark-5); box-shadow: var(--color-surface-shadow-hover); }
.author-picker__panel { display: grid; gap: 12px; }
.author-picker__title { margin: 0; color: var(--gray-dark-5); font: 700 0.98rem "Monda", sans-serif; }
.author-picker__unassign { justify-self: start; padding: 6px 9px; border: 1px solid var(--color-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-3); cursor: pointer; font: 600 0.78rem "Asap", sans-serif; }
.author-picker__unassign:hover { border-color: color-mix(in srgb, var(--red) 55%, white); background: color-mix(in srgb, var(--red) 7%, white); color: var(--red-dark); }
.author-picker__empty { margin: 0; color: var(--gray-light-4); font-size: 0.84rem; }
.author-group { padding-top: 10px; border-top: 1px solid var(--color-divider); }
.author-group__title { margin: 0 0 8px; color: var(--gray-dark-3); font: 700 0.76rem "Asap", sans-serif; }
.author-group__members { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; }
.author-option { display: grid; min-width: 0; min-height: 72px; justify-items: center; align-content: center; gap: 5px; padding: 6px 3px; border: 1px solid transparent; border-radius: 6px; background: transparent; color: var(--gray-dark-4); cursor: pointer; }
.author-option:hover { border-color: var(--color-border); background: var(--white-soft); }
.author-option--selected { border-color: color-mix(in srgb, var(--green-2) 55%, white); background: color-mix(in srgb, var(--green-2) 10%, white); }
.author-option__badge { position: relative; display: grid; width: 28px; height: 28px; place-items: center; border: 2px solid var(--white); border-radius: 50%; box-shadow: 0 1px 3px rgb(0 0 0 / 16%); font-size: 0.64rem; }
.author-option__name { width: 100%; overflow: hidden; font-size: 0.7rem; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.author-option__initials--hidden { opacity: 0; }
.author-option__check { position: absolute; width: 15px; height: 15px; color: var(--white); }
</style>
