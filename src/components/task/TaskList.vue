<template>
  <div>
    <p v-if="documentsStore.error" class="mb-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
      Could not load or save shared data: {{ documentsStore.error }}
    </p>
    <section class="task-column-header mt-5 grid">
      <div class="content-column-header" v-for="header in headers" :key="header">
        <span class="column-header-text">{{ header }}</span>
      </div>
    </section>

    <section
      v-if="canEdit"
      @click="openNewTask"
      class="add-task-row flex items-center gap-[10px] px-[10px] py-[10px] text-[var(--color-add-new-item-text)] font-bold text-[14px] leading-[1.2] font-[Asap,sans-serif] border border-dashed border-[var(--color-add-new-item-border)] cursor-pointer mb-[5px] transition-colors duration-200 ease-in-out"
    >
      <PlusIcon class="fill-[var(--color-add-new)] p-0 m-0 cursor-pointer" />
      <span>Add New Task</span>
    </section>

    <section class="font-[400] text-[12px] leading-[1.2] font-[Asap,sans-serif]">
      <h3
        class="task-group-heading mt-[24px] mb-[8px] font-bold text-[16px] leading-[1.2] font-[Asap,sans-serif] text-[var(--color-body-header-text)]"
      >
        Pending
      </h3>
      <TaskItem
        v-for="doc in sortedBySection.pending"
        :key="doc.id"
        :doc="doc"
        class="grid"
        :can-edit="canEdit"
        :activeAuthorsByTeam="computedActiveAuthorsByTeam"
        @assign-author="handleAssignAuthor"
        @edit="handleEdit"
        @duplicate="handleDuplicate"
        @delete="handleDelete"
        @add-asset="handleAddAsset"
        @delete-asset="handleDeleteAsset"
      />

      <h3
        class="task-group-heading mt-[24px] mb-[8px] font-bold text-[16px] leading-[1.2] font-[Asap,sans-serif] text-[var(--color-body-header-text)]"
      >
        Ready to Publish
      </h3>
      <TaskItem
        v-for="doc in sortedBySection.rtp"
        :key="doc.id"
        :doc="doc"
        class="grid"
        :can-edit="canEdit"
        @assign-author="handleAssignAuthor"
        @edit="handleEdit"
        @duplicate="handleDuplicate"
        @delete="handleDelete"
        @add-asset="handleAddAsset"
        @delete-asset="handleDeleteAsset"
      />

      <h3
        class="task-group-heading mt-[24px] mb-[8px] font-bold text-[16px] leading-[1.2] font-[Asap,sans-serif] text-[var(--color-body-header-text)]"
      >
        Published
      </h3>
      <TaskItem
        v-for="doc in sortedBySection.published"
        :key="doc.id"
        :doc="doc"
        class="grid"
        :can-edit="canEdit"
        @assign-author="handleAssignAuthor"
        @edit="handleEdit"
        @duplicate="handleDuplicate"
        @delete="handleDelete"
        @add-asset="handleAddAsset"
        @delete-asset="handleDeleteAsset"
      />
    </section>

    <!-- Modals -->
    <component
      :is="currentModal"
      v-if="modalType"
      v-model="showModal"
      v-bind="modalProps"
      @save="handleModalSave"
      @close="closeModal"
      @delete="confirmDelete"
      @duplicate="confirmDuplicate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useDocumentsStore } from "@/stores/documents";
import { sortDocuments } from "@/utils/sort-functions";

import { PlusIcon } from "@/assets/icons";
import TaskItem from "@/components/task/TaskItem.vue";
import ModalEdit from "@/components/common/ModalEdit.vue";
import ModalDelete from "@/components/common/ModalDelete.vue";
import ModalDuplicate from "@/components/common/ModalDuplicate.vue";
import ModalNewTask from "@/components/task/ModalNewTask.vue";
import { useCatalogStore } from "@/stores/catalog";

import type { Author, AuthorsByTeamGroup, NewTaskInput, TaskDocument } from "@/types";

// ----------------------------------
// Props
// ----------------------------------
const props = defineProps<{
  documents?: TaskDocument[];
  activeAuthorsByTeam?: AuthorsByTeamGroup[];
  canEdit?: boolean;
}>();

// ----------------------------------
// Store
// ----------------------------------
const documentsStore = useDocumentsStore();
const catalogStore = useCatalogStore();

// ----------------------------------
// Modal and Task Handlers
// ----------------------------------

// Modal State
const showModal = ref(false);
const modalType = ref<"new" | "edit" | "duplicate" | "delete" | null>(null);
const modalPayload = ref<TaskDocument | null>(null);

// Modal Helpers
function openModal(type: "edit" | "duplicate" | "delete", payload: TaskDocument) {
  modalType.value = type;
  modalPayload.value = payload;
  showModal.value = true;
}

function openNewTask() {
  modalType.value = "new";
  modalPayload.value = null;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  modalType.value = null;
  modalPayload.value = null;
}

// Save from Edit modal - full TaskDocument
function saveTask(
  updatedTask: TaskDocument,
  options: { closeModal?: boolean } = { closeModal: true }
) {
  documentsStore.updateDocument(updatedTask.id, updatedTask);
  if (options.closeModal) closeModal();
}

async function handleModalSave(payload: TaskDocument | NewTaskInput) {
  if (modalType.value === "new") {
    if (await documentsStore.createDocument(payload as NewTaskInput)) closeModal();
    return;
  }
  saveTask(payload as TaskDocument);
}

function confirmDuplicate(task: TaskDocument) {
  documentsStore.duplicateDocument(task.id);
  closeModal();
}

function confirmDelete() {
  if (!modalPayload.value) return;
  documentsStore.deleteDocument(modalPayload.value.id);
  closeModal();
}
// ----------------------------------
// Task Item Handlers
// ----------------------------------

// Assign author (no modal)
function handleAssignAuthor({ doc, author }: { doc: TaskDocument; author: Author | null }) {
  documentsStore.updateAuthor(doc.id, author);
}

// Edit / Duplicate / Delete open modals
function handleEdit(task: TaskDocument) {
  openModal("edit", task);
}

function handleDuplicate(task: TaskDocument) {
  openModal("duplicate", task);
}

function handleDelete(task: TaskDocument) {
  openModal("delete", task);
}

// Assets handled via store
function handleDeleteAsset({ doc, idx }: { doc: TaskDocument; idx: number }) {
  documentsStore.deleteAssetFromDocument(doc.id, idx);
}

function handleAddAsset({
  doc,
  asset,
}: {
  doc: TaskDocument;
  asset: { url: string; notes: string };
}) {
  documentsStore.addAssetToDocument(doc.id, asset);
}

// ----------------------------------
// Computed
// ----------------------------------

// Documents by status
const sortedBySection = computed(() =>
  sortDocuments(props.documents ?? documentsStore.documents)
);

// Active Authors By Team (from props)
const computedActiveAuthorsByTeam = computed(() => props.activeAuthorsByTeam ?? []);
const canEdit = computed(() => props.canEdit ?? true);

// Modal component
const modalComponents = {
  new: ModalNewTask,
  edit: ModalEdit,
  delete: ModalDelete,
  duplicate: ModalDuplicate,
};

const currentModal = computed(() => (modalType.value ? modalComponents[modalType.value] : null));

const modalProps = computed(() => {
  switch (modalType.value) {
    case "new":
      return {
        makes: catalogStore.activeMakes,
        models: catalogStore.activeModels,
        modelYearVehicles: catalogStore.activeModelYearVehicles,
        modelYears: catalogStore.modelYears,
        authorsByTeam: computedActiveAuthorsByTeam.value,
        isSaving: documentsStore.isSaving,
        error: documentsStore.error,
      };
    case "edit":
      return { title: "Edit Task", task: modalPayload.value };
    case "delete":
      return { title: "Delete Task", message: "Are you sure you want to delete this task?" };
    case "duplicate":
      return { title: "Duplicate Task", task: modalPayload.value };
    default:
      return {};
  }
});

// ----------------------------------
// Static column headers
// ----------------------------------
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
  padding: 8px 20px 8px 4px;
}

.grid {
  @include column-layout();
}

.task-row {
  min-height: 50px;
  box-shadow: var(--color-surface-shadow);
}

.task-row:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--color-surface-shadow-hover);
  transform: translateY(-1px);
}

.task-column-header {
  margin-bottom: 6px;
}

.add-task-row {
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.5);
}

.add-task-row:hover {
  border-color: var(--color-add-new-item-border-hover);
  background: var(--white);
}

.task-group-heading {
  display: flex;
  align-items: center;
  gap: 9px;
  letter-spacing: 0.01em;
}

.task-group-heading::before {
  content: "";
  width: 3px;
  height: 16px;
  border-radius: 3px;
  background: var(--green-2);
}
</style>
