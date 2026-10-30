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

    <section class="task-workflow font-[400] text-[12px] leading-[1.2] font-[Asap,sans-serif]">
      <section
        v-for="group in activeStatusGroups"
        :key="group.status"
        class="task-status-group"
        :class="{ 'task-status-group--drag-over': dragOverTarget === group.status }"
        @dragover.prevent="allowDrop($event, group.status)"
        @drop="dropOnTarget($event, group.status)"
      >
        <h3 class="task-group-heading mt-[24px] mb-[8px] font-bold text-[16px] leading-[1.2] font-[Asap,sans-serif] text-[var(--color-body-header-text)]">
          {{ group.label }} <span class="task-count">{{ sortedByStatus[group.status].length }}</span>
        </h3>
        <p v-if="dragOverTarget === group.status" class="drop-hint">Drop to move to {{ group.label }}</p>
        <TaskItem
          v-for="doc in sortedByStatus[group.status]"
          :key="doc.id"
          :doc="doc"
          class="grid"
          :can-edit="canEdit"
          :activeAuthorsByTeam="computedActiveAuthorsByTeam"
          @drag-start="handleDragStart($event, doc)"
          @dragend="clearDrag"
          @assign-author="handleAssignAuthor"
          @edit="handleEdit"
          @duplicate="handleDuplicate"
          @delete="handleDelete"
          @add-asset="handleAddAsset"
          @delete-asset="handleDeleteAsset"
        />
        <p v-if="draggedTaskId && !sortedByStatus[group.status].length" class="empty-drop-hint">Drop here to move to {{ group.label }}</p>
      </section>

      <section
        class="task-status-group task-history-group"
        :class="{ 'task-status-group--drag-over': dragOverTarget === 'published-history' }"
        @dragover.prevent="allowDrop($event, 'published-history')"
        @drop="dropOnTarget($event, 'published-history')"
      >
        <h3 class="task-group-heading mt-[24px] mb-[8px] font-bold text-[16px] leading-[1.2] font-[Asap,sans-serif] text-[var(--color-body-header-text)]">
          Published &amp; Updated <span class="task-count">{{ sortedByStatus.published.length }}</span>
        </h3>
        <div v-if="sortedByStatus.published.length > pageSize" class="history-pagination" aria-label="Published and updated task pages">
          <span>Showing {{ pageRangeStart }}–{{ pageRangeEnd }} of {{ sortedByStatus.published.length }}</span>
          <div class="history-pagination__controls">
            <button type="button" :disabled="currentPublishedPage === 1" @click="currentPublishedPage--">Previous</button>
            <span>Page {{ currentPublishedPage }} of {{ publishedPageCount }}</span>
            <button type="button" :disabled="currentPublishedPage === publishedPageCount" @click="currentPublishedPage++">Next</button>
          </div>
        </div>
        <p v-if="dragOverTarget === 'published-history'" class="drop-hint">Drop to publish as {{ draggedTask?.new ? 'Published' : 'Updated' }}</p>
        <p v-if="draggedTaskId && !sortedByStatus.published.length" class="empty-drop-hint">Drop here to add to Published &amp; Updated</p>
        <p v-if="!sortedByStatus.published.length && !draggedTaskId" class="history-empty">No published or updated tasks yet.</p>
        <TaskItem
          v-for="doc in pagedPublishedTasks"
          :key="doc.id"
          :doc="doc"
          class="grid"
          :can-edit="canEdit"
          :activeAuthorsByTeam="computedActiveAuthorsByTeam"
          @drag-start="handleDragStart($event, doc)"
          @dragend="clearDrag"
          @assign-author="handleAssignAuthor"
          @edit="handleEdit"
          @duplicate="handleDuplicate"
          @delete="handleDelete"
          @add-asset="handleAddAsset"
          @delete-asset="handleDeleteAsset"
        />
      </section>
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
import { ref, computed, watch } from "vue";
import { useDocumentsStore } from "@/stores/documents";
import { sortDocuments } from "@/utils/sort-functions";

import { PlusIcon } from "@/assets/icons";
import TaskItem from "@/components/task/TaskItem.vue";
import ModalEdit from "@/components/common/ModalEdit.vue";
import ModalDelete from "@/components/common/ModalDelete.vue";
import ModalDuplicate from "@/components/common/ModalDuplicate.vue";
import ModalNewTask from "@/components/task/ModalNewTask.vue";
import { useCatalogStore } from "@/stores/catalog";

import type { Author, AuthorsByTeamGroup, NewTaskInput, TaskDocument, TaskResourceInput, TaskStatus } from "@/types";

interface EditTaskSubmission {
  task: TaskDocument;
  resources: TaskResourceInput[];
}

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
const draggedTaskId = ref<string | null>(null);
const dragOverTarget = ref<TaskStatus | "published-history" | null>(null);
const currentPublishedPage = ref(1);
const pageSize = 25;
const activeStatusGroups: { status: TaskStatus; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "rte", label: "Pending Edits" },
  { status: "rtp", label: "Ready to Publish" },
  { status: "scheduled", label: "Scheduled" },
];

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

async function handleModalSave(payload: TaskDocument | NewTaskInput | EditTaskSubmission) {
  if (modalType.value === "new") {
    if (await documentsStore.createDocument(payload as NewTaskInput)) closeModal();
    return;
  }
  if ("task" in payload && "resources" in payload) {
    await documentsStore.updateDocument(payload.task.id, payload.task);
    if (documentsStore.error) return;
    for (const resource of payload.resources) {
      const saved = await documentsStore.addAssetToDocument(payload.task.id, resource);
      if (!saved) return;
    }
    closeModal();
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
  asset: TaskResourceInput;
}) {
  documentsStore.addAssetToDocument(doc.id, asset);
}

// ----------------------------------
// Computed
// ----------------------------------

// Documents by status
const sortedByStatus = computed(() => {
  const sorted = sortDocuments(props.documents ?? documentsStore.documents);
  return {
    pending: sorted.pending.filter((doc) => doc.status === "pending"),
    rte: sorted.pending.filter((doc) => doc.status === "rte"),
    rtp: sorted.rtp.filter((doc) => doc.status === "rtp"),
    scheduled: sorted.rtp.filter((doc) => doc.status === "scheduled"),
    published: sorted.published,
  };
});
const publishedPageCount = computed(() => Math.max(1, Math.ceil(sortedByStatus.value.published.length / pageSize)));
const pagedPublishedTasks = computed(() => {
  const firstIndex = (currentPublishedPage.value - 1) * pageSize;
  return sortedByStatus.value.published.slice(firstIndex, firstIndex + pageSize);
});
const pageRangeStart = computed(() => (currentPublishedPage.value - 1) * pageSize + 1);
const pageRangeEnd = computed(() => Math.min(currentPublishedPage.value * pageSize, sortedByStatus.value.published.length));
const draggedTask = computed(() => (props.documents ?? documentsStore.documents).find((doc) => doc.id === draggedTaskId.value) ?? null);

watch(() => props.documents, () => { currentPublishedPage.value = 1; });
watch(publishedPageCount, (pageCount) => {
  if (currentPublishedPage.value > pageCount) currentPublishedPage.value = pageCount;
});

function handleDragStart(event: DragEvent, doc: TaskDocument) {
  if (!canEdit.value || !event.dataTransfer) return;
  draggedTaskId.value = doc.id;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", doc.id);
}

function allowDrop(event: DragEvent, target: TaskStatus | "published-history") {
  if (!canEdit.value || !draggedTaskId.value) return;
  dragOverTarget.value = target;
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
}

async function dropOnTarget(event: DragEvent, target: TaskStatus | "published-history") {
  event.preventDefault();
  const taskId = event.dataTransfer?.getData("text/plain") || draggedTaskId.value;
  dragOverTarget.value = null;
  draggedTaskId.value = null;
  if (!canEdit.value || !taskId) return;

  const task = (props.documents ?? documentsStore.documents).find((doc) => doc.id === taskId);
  if (!task) return;
  const nextStatus: TaskStatus = target === "published-history"
    ? task.new ? "published" : "updated"
    : target;
  if (task.status !== nextStatus) await documentsStore.updateDocument(task.id, { status: nextStatus });
}

function clearDrag() {
  draggedTaskId.value = null;
  dragOverTarget.value = null;
}

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
      return { title: "Edit Task", task: modalPayload.value, error: documentsStore.error };
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
  grid-template-columns: 36px 1fr 100px 120px 175px 1fr 50px 50px 32px;
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

.task-status-group { min-height: 58px; margin-bottom: 7px; border-radius: 8px; transition: background-color 120ms ease, box-shadow 120ms ease; }
.task-status-group--drag-over { background: color-mix(in srgb, var(--green-2) 10%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--green-2) 55%, transparent); }
.task-count { color: var(--gray-light-4); font-size: 0.78rem; font-weight: 500; }
.drop-hint, .empty-drop-hint { margin: 0 0 6px; padding: 8px 12px; border: 1px dashed var(--green-2); border-radius: 6px; color: var(--gray-dark-3); background: var(--color-green-soft); font-size: 0.8rem; }
.history-pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 0 8px; color: var(--gray-light-4); font-size: 0.78rem; }
.history-pagination__controls { display: flex; align-items: center; gap: 8px; }
.history-pagination button { min-height: 30px; padding: 0 9px; border: 1px solid var(--color-form-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-3); font: 600 0.75rem "Asap", sans-serif; cursor: pointer; }
.history-pagination button:disabled { opacity: 0.45; cursor: not-allowed; }
.history-empty { margin: 0; padding: 12px; color: var(--gray-light-4); font-size: 0.84rem; }

@media (max-width: 900px) {
  .history-pagination { align-items: flex-start; flex-direction: column; }
}
</style>
