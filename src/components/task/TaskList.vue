<template>
  <div>
    <section class="mt-5 grid">
      <div class="content-column-header" v-for="header in headers" :key="header">
        <span class="column-header-text">{{ header }}</span>
      </div>
    </section>

    <section
      class="flex items-center gap-[10px] px-[5px] py-[8px] text-[var(--color-add-new-item-text)] font-bold text-[14px] leading-[1.2] font-[Asap,sans-serif] border-2 border-dashed border-[var(--color-add-new-item-border)] cursor-pointer mb-[5px] hover:border-[var(--color-add-new-item-border-hover)] transition-colors duration-200 ease-in-out hover:bg-[var(--white)]"
    >
      <PlusIcon class="fill-[var(--color-add-new)] p-0 m-0 cursor-pointer" />
      <span>Add New Task</span>
    </section>

    <section class="font-[400] text-[12px] leading-[1.2] font-[Asap,sans-serif]">
      <h3
        class="mt-[20px] mb-[5px] font-bold text-[16px] leading-[1.2] font-[Asap,sans-serif] text-[var(--color-body-header-text)]"
      >
        Pending
      </h3>
      <TaskItem
        v-for="doc in documents.pending"
        :key="doc.id"
        :doc="doc"
        class="grid"
        :activeAuthorsByTeam="activeAuthorsByTeam"
        @open-edit="openModal"
        @duplicate="duplicateTask"
        @delete="deleteTask"
      />

      <h3
        class="mt-[20px] mb-[5px] font-bold text-[16px] leading-[1.2] font-[Asap,sans-serif] text-[var(--color-body-header-text)]"
      >
        Ready to Publish
      </h3>
      <TaskItem
        v-for="doc in documents.rtp"
        :key="doc.id"
        :doc="doc"
        class="grid"
        @open-edit="openModal"
        @duplicate="duplicateTask"
        @delete="deleteTask"
      />

      <h3
        class="mt-[20px] mb-[5px] font-bold text-[16px] leading-[1.2] font-[Asap,sans-serif] text-[var(--color-body-header-text)]"
      >
        Published
      </h3>
      <TaskItem
        v-for="doc in documents.published"
        :key="doc.id"
        :doc="doc"
        class="grid"
        @open-edit="openModal"
        @duplicate="duplicateTask"
        @delete="deleteTask"
      />
    </section>
    <ModalEdit
      v-if="selectedTask"
      v-model="showModal"
      title="Edit Task"
      :task="selectedTask"
      @close="closeModal"
      @save="saveTask"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { authors } from "@/test";
import { PlusIcon } from "@/assets/icons";
import TaskItem from "@/components/task/TaskItem.vue";
import ModalEdit from "@/components/common/ModalEdit.vue";
import type { DocumentsByStatus } from "@/types";

// Props ------------------------------------
const props = defineProps<{
  documents: DocumentsByStatus;
  activeAuthorsByTeam?: Array<{ team: string; members: any[] }>;
}>();

// State ------------------------------------
const showModal = ref(false);
const selectedTask = ref<any | null>(null);

// Handlers --------------------------------
function openModal(task) {
  selectedTask.value = task;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedTask.value = null;
}

function saveTask(updatedTask) {
  console.log("Saved task:", updatedTask);
  closeModal();
}

function duplicateTask(task) {
  console.log("Duplicated task:", task);
}

function deleteTask(task) {
  console.log("Deleted task with ID:", task);
}

// Computed --------------------------------
// filter active authors then sort by team
const activeAuthorsByTeam = computed(() => {
  const active = authors.filter((a) => a.active);

  active.sort((a, b) => {
    const teamCompare = a.team.label.localeCompare(b.team.label);
    if (teamCompare !== 0) return teamCompare;
    return a.lastName.localeCompare(b.lastName);
  });

  const groups: Record<string, typeof active> = {};
  active.forEach((author) => {
    if (!groups[author.team.label]) groups[author.team.label] = [];
    groups[author.team.label].push(author);
  });

  return Object.entries(groups).map(([team, members]) => ({ team, members }));
});

const headers = [
  "",
  "Vehicle/Segment",
  "Deadline",
  "Status",
  "Embargo/Publish Date",
  "Notes",
  "Assets",
  "Author",
];
</script>

<style lang="scss" scoped>
@mixin column-layout() {
  display: grid;
  justify-items: start;
  align-items: center;
  grid-template-columns: 20px 1fr 100px 120px 175px 1fr 50px 50px 8px;
  // TODO: WORK ON SPACING FOR RESPONSIVE PURPOSES
  padding: 8px 20px 8px 4px;
}

.grid {
  @include column-layout();
}
</style>
