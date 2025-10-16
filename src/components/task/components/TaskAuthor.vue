<template>
  <div>
    <span v-if="doc.author" :class="['team-badge', getTeamColorClass(doc.author.team)]">{{
      doc.author.initials
    }}</span>
    <span v-else-if="activeAuthorsByTeam" class="w-6 h-6 flex items-center justify-center-safe">
      <Popper placement="top" arrow>
        <AddCircleIcon
          class="zoomable"
          v-tooltip="{ theme: 'info-tooltip', content: 'Assign an author' }"
        />
        <template #content>
          <h3 class="font-bold mb-4 text-sm text-center">{{ assignedAuthorHeader }}</h3>
          <div v-for="group in activeAuthorsByTeam" :key="group.team" class="mb-4">
            <h3 class="text-xs font-bold text-gray-600 mb-1 border-b border-dotted border-gray-600">
              {{ group.team.toUpperCase() }}
            </h3>
            <div class="grid grid-cols-3 content-start">
              <div
                v-for="author in group.members"
                :key="author.id"
                @click="assignAuthor(author)"
                class="flex flex-col items-center justify-start w-20 h-20 p-2 cursor-pointer rounded-md hover:bg-gray-300 transition duration-200 ease-in-out"
              >
                <span
                  :class="[
                    'team-badge flex items-center justify-center relative',
                    getTeamColorClass(author.team.slug),
                    assignedAuthor === author.id && 'ring-2 ring-green-500 bg-white',
                  ]"
                >
                  <span
                    :class="[
                      'absolute transition-opacity duration-200',
                      assignedAuthor === author.id ? 'opacity-0' : 'opacity-100',
                    ]"
                  >
                    {{ author.initials }}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4 text-green-600 absolute transition-opacity duration-200"
                    :class="assignedAuthor === author.id ? 'opacity-100' : 'opacity-0'"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>

                <span class="text-xs text-center mt-1">{{ author.label }}</span>
              </div>
            </div>
          </div>
        </template>
      </Popper>
    </span>
  </div>
</template>
<script setup lang="ts">
//TODO: REFACTOR FROM TASKITEM.VUE
</script>
