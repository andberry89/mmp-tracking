<template>
  <div
    class="bg-[var(--color-body-background)] border-2 border-solid border-[var(--color-body-border)] rounded-lg transition-all duration-300 ease-in-out hover:border-black"
  >
    <div>
      <HighPriorityIcon
        v-if="isHighPriority(doc)"
        v-tooltip="{ theme: 'info-tooltip', content: 'High Priority MMP' }"
      />
    </div>

    <div class="task-vehicle flex flex-col items-start pl-2 font-bold">
      <span class="text-[var(--color-body-text)]">{{
        `${doc.vehicle.modelYear} ${doc.vehicle.make} ${doc.vehicle.model}`
      }}</span>
      <span class="text-[var(--color-body-text-secondary)]">{{ doc.vehicle.segment }}</span>
    </div>

    <div
      :class="[
        'font-bold',
        isHighPriority(doc)
          ? 'text-[var(--color-body-text-priority)]'
          : 'text-[var(--color-body-text-secondary)]',
      ]"
    >
      {{ doc.deadline }}
    </div>

    <div :class="['status-badge', getStatusClass(doc.status)]">
      {{ doc.status }}
    </div>

    <div :class="getDateFormatClass(doc)">{{ getDateText(doc) }}</div>

    <div class="text-[var(--color-body-text-tertiary)] text-[11px]">
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

    <div v-if="doc.assets.length > 0">
      <Popper placement="top" disableClickAway arrow>
        <div>
          <FolderIcon
            class="zoomable fill-[var(--color-body-active-assets)]"
            v-if="!assetsVisible"
            @click="toggleAssets"
          />
          <FolderOpenIcon
            class="zoomable fill-[var(--color-body-active-assets)]"
            v-else
            @click="toggleAssets"
          />
        </div>
        <template #content>
          <div>
            <ul class="popper-list">
              <li class="mb-3 text-base" v-for="(asset, idx) in doc.assets" :key="idx">
                <a
                  class="text-[var(--color-body-link)] no-underline transition-colors duration-200 ease-in-out hover:underline hover:text-[var(--color-body-link-hover)]"
                  :href="asset.url"
                  target="_blank"
                >
                  <span
                    class="material-symbols-outlined mr-[2px] text-[var(--gray-dark-2)] align-middle leading-none"
                    style="font-size: 16px"
                  >
                    open_in_new
                  </span>
                  <span>{{ asset.notes }}</span>
                </a>
              </li>
            </ul>
          </div>
        </template>
      </Popper>
    </div>
    <div v-else class="task-assets"><FolderIcon /></div>

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
              <h3
                class="text-xs font-bold text-gray-600 mb-1 border-b border-dotted border-gray-600"
              >
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

    <div id="task-actions">
      <Popper placement="left" arrow>
        <MoreIcon class="fill-[var(--color-body-more-icon)] cursor-pointer" />
        <template #content>
          <div>
            <button
              @click="showModal = true"
              class="px-3 py-1 bg-gray-100 border rounded hover:bg-gray-200"
            >
              Open Modal
            </button>
            <div class="menu-item">Duplicate Task</div>
            <div class="menu-item">Delete Task</div>
          </div>
        </template>
      </Popper>

      <ModalEditTask v-model="showModal" title="Edit Task" @close="showModal = false">
        <p>This is the modal content.</p>
      </ModalEditTask>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AddCircleIcon,
  FolderIcon,
  FolderOpenIcon,
  HighPriorityIcon,
  MoreIcon,
} from "@/assets/icons";

import { getDateFormat, getDateText, getStatus, isHighPriority } from "@/utils/task-item-utils";
import { computed, ref, defineProps, defineEmits } from "vue";
import { ModalsContainer } from "vue-final-modal";
import ModalEditTask from "@/components/common/ModalEditTask.vue";
import type { TaskDocument } from "@/types";
import { authors } from "@/test";

// Props & Emits
const props = defineProps<{
  doc: TaskDocument;
  activeAuthorsByTeam?: Array<{ team: string; members: any[] }>;
}>();

const emit = defineEmits<{
  (e: "assign-author", payload: { doc: TaskDocument; author: any }): void;
}>();

// Reactive state
const targetElement = ref<null | EventTarget>(null);
const assetsVisible = ref(false);
const notesExpanded = ref(false);
const showModal = ref(false);
const assignedAuthor = ref<string | null>(null);
const assignedAuthorHeader = ref("Assign Author");

// Computed
const docNotes = computed(() => {
  if (props.doc.notes.length <= 50) {
    return props.doc.notes;
  } else {
    return props.doc.notes.slice(0, 35) + "...";
  }
});

const dateFormatMap = {
  embargo: "text-orange-400 font-bold",
  published: "text-gray-900",
};

const statusClassMap = {
  pending: "bg-yellow-200 text-yellow-900",
  rte: "bg-blue-100 text-blue-900",
  rtp: "bg-purple-200 text-purple-900",
  scheduled: "bg-orange-200 text-orange-900",
  updated: "bg-indigo-200 text-indigo-900",
  published: "bg-green-200 text-green-900",
};

const teamColorMap = {
  freelance: " bg-pink-500",
  bg: "bg-indigo-600",
  cd: "bg-teal-400",
};

const getDateFormatClass = (doc: TaskDocument) => {
  const dateFormat = getDateFormat(doc);
  const normalized = dateFormatMap[dateFormat];
  return normalized || "";
};

const getStatusClass = (status: string) => {
  const normalized = getStatus(status);
  return statusClassMap[normalized] || "bg-gray-200 text-gray-800";
};

const getTeamColorClass = (team: string) => {
  const normalized = teamColorMap[team];
  return normalized + " text-white";
};

// Methods
function toggleAssets(evt: MouseEvent) {
  targetElement.value = evt.target;
  assetsVisible.value = !assetsVisible.value;
}

function assignAuthor(author) {
  // props.doc.author = author;
  emit("assign-author", { doc: props.doc, author });

  assignedAuthor.value = author.id;
  assignedAuthorHeader.value = `Assigned to ${author.firstName}`;
  setTimeout(() => {
    assignedAuthor.value = null;
    assignedAuthorHeader.value = "Assign Author";
  }, 2000);
  console.log("Assigned author:", author);
}
</script>
<style lang="scss" scoped>
:deep(.popper) {
  width: auto;
  max-width: 25%;
}
</style>
