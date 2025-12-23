<template>
  <div class="task-author">
    <Popper placement="left" arrow>
      <span
        v-if="author"
        :class="['team-badge cursor-pointer', getTeamColorClass(author.team.slug)]"
        role="button"
        tabindex="0"
      >
        {{ author.initials }}
      </span>

      <AddCircleIcon
        v-else
        class="zoomable cursor-pointer"
        v-tooltip="{ theme: 'info-tooltip', content: 'Assign an author' }"
      />

      <template #content="{ close }">
        <div @click.stop>
          <h3 class="font-bold mb-4 text-sm text-center">{{ headerText }}</h3>
          <button
            v-if="author"
            class="block mx-auto mb-4 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm transition cursor-pointer"
            @click="handleAssign(null, close)"
          >
            Unassign Author
          </button>
          <div v-if="authorsByTeam.length === 0" class="text-xs text-gray-500">
            No active authors
          </div>
          <div
            v-for="group in authorsByTeam"
            :key="group.team"
            class="mb-4"
            v-if="authorsByTeam.length"
          >
            <h3 class="text-xs font-bold text-gray-600 mb-1 border-b border-dotted border-gray-600">
              {{ group.team.toUpperCase() }}
            </h3>
            <div class="grid grid-cols-3 content-start">
              <div
                v-for="authorItem in group.members"
                :key="authorItem.id"
                @click="handleAssign(authorItem, close)"
                class="flex flex-col items-center justify-start w-20 h-20 p-2 cursor-pointer rounded-md hover:bg-gray-300 transition duration-200 ease-in-out"
              >
                <span
                  :class="[
                    'team-badge flex items-center justify-center relative',
                    getTeamColorClass(authorItem.team.slug),
                    selectedAuthorId === authorItem.id && 'ring-2 ring-green-500 bg-white',
                  ]"
                >
                  <span
                    :class="[
                      'absolute transition-opacity duration-200',
                      selectedAuthorId === authorItem.id ? 'opacity-0' : 'opacity-100',
                    ]"
                  >
                    {{ authorItem.initials }}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4 text-green-600 absolute transition-opacity duration-200"
                    :class="selectedAuthorId === authorItem.id ? 'opacity-100' : 'opacity-0'"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>

                <span class="text-xs text-center mt-1">{{ authorItem.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Popper>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { AddCircleIcon } from "@/assets/icons";
import { TEAM_COLOR_MAP } from "@/constants/task-style-maps";

import type { Author, AuthorsByTeamGroup, AssignState } from "@/types";

const FEEDBACK_DELAY_MS = 1000;

// ----------------------------------
// Props
// ----------------------------------
const { author } = defineProps<{
  author: Author | null;
  authorsByTeam: AuthorsByTeamGroup[];
}>();

// ----------------------------------
// Emits
// ----------------------------------

const emit = defineEmits<{
  (e: "assign", author: Author | null): void;
}>();

// ----------------------------------
// State
// ----------------------------------

const selectedAuthorId = ref<string | null>(null);
const assignState = ref<AssignState>("unassigned");
const pendingAuthor = ref<string | null>(null);

// ----------------------------------
// Computed
// ----------------------------------
const headerText = computed(() => {
  if (assignState.value === "assigned" && pendingAuthor.value) {
    return `Assigned to ${pendingAuthor.value}`;
  }
  if (assignState.value === "removed") {
    return "Author removed";
  }
  return "Assign Author";
});

// ----------------------------------
// Methods
// ----------------------------------
function getTeamColorClass(team: Author["team"]["slug"]): string {
  return `${TEAM_COLOR_MAP[team] ?? ""} text-white`;
}

type CloseFn = () => void;

function handleAssign(author: Author | null, close?: () => CloseFn) {
  if (author) {
    // assign the author
    selectedAuthorId.value = author.id;
    pendingAuthor.value = author.firstName;
    assignState.value = "assigned";

    setTimeout(() => {
      emit("assign", author);
      selectedAuthorId.value = null;
      pendingAuthor.value = null;
      assignState.value = "idle";
      close?.();
    }, FEEDBACK_DELAY_MS);
  } else {
    assignState.value = "removed";

    // unassign the author
    setTimeout(() => {
      emit("assign", null);
      assignState.value = "idle";
      close?.();
    }, FEEDBACK_DELAY_MS);
  }
}
</script>
