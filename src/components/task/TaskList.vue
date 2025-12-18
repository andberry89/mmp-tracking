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
        v-for="doc in sortedBySection.pending"
        :key="doc.id"
        :doc="doc"
        class="grid"
        :activeAuthorsByTeam="computedActiveAuthorsByTeam"
        @assign-author="handleAssignAuthor"
        @edit="handleEdit"
        @duplicate="handleDuplicate"
        @delete="handleDelete"
        @add-asset="handleAddAsset"
        @delete-asset="handleDeleteAsset"
      />

      <h3
        class="mt-[20px] mb-[5px] font-bold text-[16px] leading-[1.2] font-[Asap,sans-serif] text-[var(--color-body-header-text)]"
      >
        Ready to Publish
      </h3>
      <TaskItem
        v-for="doc in sortedBySection.rtp"
        :key="doc.id"
        :doc="doc"
        class="grid"
        @assign-author="handleAssignAuthor"
        @edit="handleEdit"
        @duplicate="handleDuplicate"
        @delete="handleDelete"
        @add-asset="handleAddAsset"
        @delete-asset="handleDeleteAsset"
      />

      <h3
        class="mt-[20px] mb-[5px] font-bold text-[16px] leading-[1.2] font-[Asap,sans-serif] text-[var(--color-body-header-text)]"
      >
        Published
      </h3>
      <TaskItem
        v-for="doc in sortedBySection.published"
        :key="doc.id"
        :doc="doc"
        class="grid"
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
      @save="saveTask"
      @close="closeModal"
      @delete="confirmDelete"
      @duplicate="confirmDuplicate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useDocumentsStore } from "@/stores/documents";
import { storeToRefs } from "pinia";

import { PlusIcon } from "@/assets/icons";
import TaskItem from "@/components/task/TaskItem.vue";
import ModalEdit from "@/components/common/ModalEdit.vue";
import ModalDelete from "@/components/common/ModalDelete.vue";
import ModalDuplicate from "@/components/common/ModalDuplicate.vue";

import type { DocumentsByStatus, TaskDocument } from "@/types";

// ----------------------------------
// Props
// ----------------------------------
const props = defineProps<{
  activeAuthorsByTeam?: Array<{ team: string; members: any[] }>;
}>();

const emit = defineEmits<{
  (e: "updateTask", updatedTask: TaskDocument): void;
  (e: "deleteTask", id: string): void;
  (e: "duplicateTask", task: TaskDocument): void;
}>();

// ----------------------------------
// Store
// ----------------------------------
const documentsStore = useDocumentsStore();

// ----------------------------------
// Modal and Task Handlers
// ----------------------------------

// Modal State
const showModal = ref(false);
const modalType = ref<"edit" | "duplicate" | "delete" | null>(null);
const modalPayload = ref<any | null>(null);

// Modal Helpers
function openModal(type: "edit" | "duplicate" | "delete", payload: TaskDocument) {
  modalType.value = type;
  modalPayload.value = payload;
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
function handleAssignAuthor({ doc, author }: { doc: TaskDocument; author: any }) {
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
const { sortedBySection } = storeToRefs(documentsStore);

// Active Authors By Team (from props)
const computedActiveAuthorsByTeam = computed(() => props.activeAuthorsByTeam ?? []);

// Modal component
const modalComponents = {
  edit: ModalEdit,
  delete: ModalDelete,
  duplicate: ModalDuplicate,
};

const currentModal = computed(() => (modalType.value ? modalComponents[modalType.value] : null));

const modalProps = computed(() => {
  switch (modalType.value) {
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
</style>
