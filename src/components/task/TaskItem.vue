<template>
  <div
    class="bg-[var(--color-body-background)] border-2 border-solid border-[var(--color-body-border)] rounded-lg transition-all duration-100 ease-in-out hover:border-black"
  >
    <TaskHeader :doc="doc" />
    <TaskStatus
      :status="doc.status"
      :statusClass="getStatusClass(doc.status)"
      :dateClass="getDateFormatClass(doc)"
      :dateText="getDateText(doc)"
    />
    <TaskNotes :docNotes="docNotes" :notes="doc.notes" />
    <TaskAssets :assets="doc.assets" />

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

      <ModalEdit v-model="showModal" title="Edit Task" :task="doc" @close="showModal = false">
        <template #default>
          <form @submit.prevent="saveTask" id="task-edit-form">
            <!-- Vehicle Info (readonly)-->
            <div class="mb-4">
              <label class="blck text-sm font-semibold text-gray-700 mb-1">Vehicle</label>
              <input
                type="text"
                v-model="editableTask.vehicleDisplay"
                readonly
                class="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700"
              />
            </div>

            <!-- Status -->
            <div class="mb-4">
              <label class="block text-sm font-semibold text-gray-700 mb-1">Status</label>
              <select
                v-model="editableTask.status"
                class="w-full border broder-gray-300 rounded p-2"
              >
                <option v-for="status in statuses" :key="status" :value="status">
                  {{ status }}
                </option>
              </select>
            </div>

            <!-- Deadline -->
            <div class="mb-4">
              <label class="block text-sm font-semibold text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                v-model="editableTask.deadline"
                class="w-full border border-gray-300 rounded p-2"
              />
            </div>

            <!-- Notes -->
            <div class="mb-4">
              <label class="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
              <textarea
                v-model="editableTask.notes"
                rows="4"
                class="w-full border border-gray-300 rounded p-2"
              ></textarea>
            </div>
          </form>
        </template>
        <!-- Footer -->
        <template #footer>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              @click="showModal = false"
              class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="task-edit-form"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </template>
      </ModalEdit>
    </div>
  </div>
</template>

<script setup lang="ts">
//TODO: Refactor to reduce overhead
import { AddCircleIcon, HighPriorityIcon, MoreIcon } from "@/assets/icons";

import { getDateFormat, getDateText, getStatus, isHighPriority } from "@/utils/task-item-utils";
import { computed, ref, watch } from "vue";
import { ModalsContainer } from "vue-final-modal";
import TaskHeader from "@/components/task/components/TaskHeader.vue";
import TaskStatus from "@/components/task/components/TaskStatus.vue";
import TaskNotes from "@/components/task/components/TaskNotes.vue";
import TaskAssets from "@/components/task/components/TaskAssets.vue";
import ModalEdit from "@/components/common/ModalEdit.vue";
import type { TaskDocument } from "@/types";
import { authors } from "@/test";
import { dateFormatMap, statusClassMap, teamColorMap } from "@/constants/task-style-maps";

// Props & Emits
const props = defineProps<{
  doc: TaskDocument;
  activeAuthorsByTeam?: Array<{ team: string; members: any[] }>;
}>();

const emit = defineEmits<{
  (e: "assign-author", payload: { doc: TaskDocument; author: any }): void;
}>();

// Reactive state
const showModal = ref(false);
const editableTask = ref({
  ...props.doc,
  vehicleDisplay: `${props.doc.vehicle.modelYear} ${props.doc.vehicle.make} ${props.doc.vehicle.model}`,
});
const assignedAuthor = ref<string | null>(null);
const assignedAuthorHeader = ref("Assign Author");

// Status options
const statuses = ["pending", "rte", "rtp", "scheduled", "published", "updated"];

// Computed
const docNotes = computed(() => {
  if (props.doc.notes.length <= 50) {
    return props.doc.notes;
  } else {
    return props.doc.notes.slice(0, 35) + "...";
  }
});

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

function saveTask() {
  // Emit save event with updated task data
  console.log("Saving task:", editableTask.value);
  // emit("save", { ...editableTask.value });
  showModal.value = false;
}

watch(showModal, (val) => {
  if (val) {
    editableTask.value = {
      ...props.doc,
      vehicleDisplay: `${props.doc.vehicle.modelYear} ${props.doc.vehicle.make} ${props.doc.vehicle.model}`,
    };
  }
});
</script>
<style lang="scss" scoped>
:deep(.popper) {
  width: auto;
  max-width: 25%;
}
</style>
