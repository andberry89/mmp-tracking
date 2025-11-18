<template>
  <div class="task-author">
    <!-- If author assigned -->
    <span v-if="author" :class="['team-badge', getTeamColorClass(author.team)]">{{
      author.initials
    }}</span>

    <!-- If no author assigned, show assign popup -->
    <span v-else class="w-6 h-6 flex items-center justify-center-safe">
      <Popper placement="top" arrow>
        <AddCircleIcon
          class="zoomable"
          v-tooltip="{ theme: 'info-tooltip', content: 'Assign an author' }"
        />
        <template #content>
          <h3 class="font-bold mb-4 text-sm text-center">{{ headerText }}</h3>

          <div v-for="group in authorsByTeam" :key="group.team" class="mb-4">
            <h3 class="text-xs font-bold text-gray-600 mb-1 border-b border-dotted border-gray-600">
              {{ group.team.toUpperCase() }}
            </h3>
            <div class="grid grid-cols-3 content-start">
              <div
                v-for="authorItem in group.members"
                :key="authorItem.id"
                @click="handleAssign(authorItem)"
                class="flex flex-col items-center justify-start w-20 h-20 p-2 cursor-pointer rounded-md hover:bg-gray-300 transition duration-200 ease-in-out"
              >
                <span
                  :class="[
                    'team-badge flex items-center justify-center relative',
                    getTeamColorClass(authorItem.team.slug),
                    selectedAuthor === authorItem.id && 'ring-2 ring-green-500 bg-white',
                  ]"
                >
                  <span
                    :class="[
                      'absolute transition-opacity duration-200',
                      selectedAuthor === authorItem.id ? 'opacity-0' : 'opacity-100',
                    ]"
                  >
                    {{ authorItem.initials }}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4 text-green-600 absolute transition-opacity duration-200"
                    :class="selectedAuthor === authorItem.id ? 'opacity-100' : 'opacity-0'"
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
        </template>
      </Popper>
    </span>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { AddCircleIcon } from "@/assets/icons";
import { TEAM_COLOR_MAP } from "@/constants/task-style-maps";

defineProps<{
  author?: { initials: string; team; string };
  authorsByTeam?: Array<{ team: string; members: any[] }>;
}>();

const emit = defineEmits<{
  (e: "assign", author: any): void;
}>();

const selectedAuthor = ref<string | null>(null);
const headerText = ref("Assign Author");

const getTeamColorClass = (team: string) => {
  const normalized = TEAM_COLOR_MAP[team];
  return normalized + " text-white";
};

function handleAssign(author) {
  selectedAuthor.value = author.id;
  headerText.value = `Assigned to ${author.firstName}`;
  setTimeout(() => {
    selectedAuthor.value = null;
    headerText.value = "Assign Author";
    emit("assign", author);
  }, 2000);
}
</script>
