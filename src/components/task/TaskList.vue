<template>
  <div>
    <p v-if="documentsStore.error" class="mb-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
      Could not load or save shared data: {{ documentsStore.error }}
    </p>
    <div v-if="documentsStore.hasLoaded" class="task-view-tabs" role="tablist" aria-label="Publication Tracking views">
      <button
        id="active-work-tab"
        type="button"
        role="tab"
        :aria-selected="taskView === 'active'"
        aria-controls="active-work-panel"
        :class="['task-view-tab', taskView === 'active' && 'task-view-tab--active']"
        @click="taskView = 'active'"
      >
        Active Work
      </button>
      <button
        id="published-history-tab"
        type="button"
        role="tab"
        :aria-selected="taskView === 'history'"
        aria-controls="published-history-panel"
        :class="['task-view-tab', taskView === 'history' && 'task-view-tab--active', dragOverTarget === 'published-history' && 'task-view-tab--drop-target']"
        @click="taskView = 'history'"
        @dragover.prevent="allowDrop($event, 'published-history')"
        @drop="dropOnTarget($event, 'published-history')"
      >
        Published &amp; Updated <span class="task-count">{{ sortedByStatus.published.length }}</span>
      </button>
    </div>

    <div v-if="!documentsStore.hasLoaded" class="task-loading-state" role="status" aria-live="polite">
      <span class="task-loading-spinner" aria-hidden="true"></span>
      <span>Loading MMP workbook…</span>
    </div>

    <section
      v-else-if="taskView === 'active'"
      id="active-work-panel"
      role="tabpanel"
      aria-labelledby="active-work-tab"
      class="task-workboard-scroll"
      tabindex="0"
      aria-label="Active Work"
    >
      <div class="task-workboard">
        <section class="task-column-header mt-5 grid" aria-label="Task columns">
          <div class="content-column-header" v-for="header in headers" :key="header" :aria-hidden="!header || undefined">
            <span class="column-header-text">{{ header }}</span>
          </div>
          <div class="content-column-header" aria-hidden="true"></div>
        </section>

        <button
          v-if="canEdit"
          type="button"
          @click="openNewTask"
          class="add-task-row flex w-full items-center gap-[10px] px-[10px] py-[10px] text-left text-[var(--color-add-new-item-text)] font-bold text-[14px] leading-[1.2] font-[Asap,sans-serif] border border-dashed border-[var(--color-add-new-item-border)] bg-transparent cursor-pointer mb-[5px] transition-colors duration-200 ease-in-out"
        >
          <PlusIcon class="fill-[var(--color-add-new)] p-0 m-0 cursor-pointer" />
          <span>Add New Task</span>
        </button>

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
        </section>
      </div>
    </section>

    <section
      v-else
      id="published-history-panel"
      role="tabpanel"
      aria-labelledby="published-history-tab"
      class="published-history-view"
    >
      <div class="history-toolbar">
        <label class="history-range-select">
          <span>Date range</span>
          <select v-model="selectedHistoryRange">
            <option value="all">All dates</option>
            <option v-for="range in publishedDateRanges" :key="range.id" :value="range.id">{{ range.label }}</option>
            <option value="custom">Custom range</option>
          </select>
        </label>
        <div v-if="selectedHistoryRange === 'custom'" class="history-custom-range">
          <label>From <input v-model="customDateStart" type="date" /></label>
          <label>To <input v-model="customDateEnd" type="date" /></label>
        </div>
        <span class="history-results-count">{{ filteredPublishedTasks.length }} tasks</span>
      </div>

      <div v-if="canEdit" class="history-return-dropzones" aria-label="Move a task back to Active Work">
        <span>Move back to Active Work:</span>
        <button
          v-for="group in activeStatusGroups"
          :key="group.status"
          type="button"
          :class="{ 'history-return-dropzone--active': dragOverTarget === group.status }"
          @dragover.prevent="allowDrop($event, group.status)"
          @drop="dropOnTarget($event, group.status)"
        >Drop to {{ group.label }}</button>
      </div>

      <div v-if="filteredPublishedTasks.length > pageSize" class="history-pagination" aria-label="Published and updated task pages">
        <span>Showing {{ pageRangeStart }}–{{ pageRangeEnd }} of {{ filteredPublishedTasks.length }}</span>
        <div class="history-pagination__controls">
          <button type="button" :disabled="currentPublishedPage === 1" @click="currentPublishedPage--">Previous</button>
          <span>Page {{ currentPublishedPage }} of {{ publishedPageCount }}</span>
          <button type="button" :disabled="currentPublishedPage === publishedPageCount" @click="currentPublishedPage++">Next</button>
        </div>
      </div>
      <p v-if="draggedTaskId && dragOverTarget === 'published-history'" class="drop-hint">Drop to publish as {{ draggedTask?.new ? 'Published' : 'Updated' }}</p>
      <p v-if="!filteredPublishedTasks.length && !draggedTaskId" class="history-empty">No published or updated tasks in this date range.</p>
      <div class="task-workboard-scroll" role="region" tabindex="0" aria-label="Published and updated tasks">
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
      </div>
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
import { endOfDay, isWithinInterval, parseISO, startOfDay } from "date-fns";
import { useDocumentsStore } from "@/stores/documents";
import { sortDocuments } from "@/utils/sort-functions";
import { getRangeDates } from "@/utils/helpers";
import { ranges as publishedDateRanges } from "@/constants";

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
const taskView = ref<"active" | "history">("active");
const currentPublishedPage = ref(1);
const selectedHistoryRange = ref("all");
const customDateStart = ref("");
const customDateEnd = ref("");
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
const filteredPublishedTasks = computed(() => sortedByStatus.value.published.filter((doc) => {
  if (!doc.publishedDate) return selectedHistoryRange.value === "all";
  const publishedAt = new Date(doc.publishedDate);
  if (Number.isNaN(publishedAt.getTime())) return false;

  if (selectedHistoryRange.value === "custom") {
    const start = customDateStart.value ? startOfDay(parseISO(customDateStart.value)) : null;
    const end = customDateEnd.value ? endOfDay(parseISO(customDateEnd.value)) : null;
    if (start && Number.isNaN(start.getTime())) return false;
    if (end && Number.isNaN(end.getTime())) return false;
    if (start && end && start > end) return false;
    if (start && publishedAt < start) return false;
    if (end && publishedAt > end) return false;
    return true;
  }

  if (selectedHistoryRange.value === "all") return true;
  const range = getRangeDates(selectedHistoryRange.value);
  return range ? isWithinInterval(publishedAt, range) : true;
}));
const publishedPageCount = computed(() => Math.max(1, Math.ceil(filteredPublishedTasks.value.length / pageSize)));
const pagedPublishedTasks = computed(() => {
  const firstIndex = (currentPublishedPage.value - 1) * pageSize;
  return filteredPublishedTasks.value.slice(firstIndex, firstIndex + pageSize);
});
const pageRangeStart = computed(() => (currentPublishedPage.value - 1) * pageSize + 1);
const pageRangeEnd = computed(() => Math.min(currentPublishedPage.value * pageSize, filteredPublishedTasks.value.length));
const draggedTask = computed(() => (props.documents ?? documentsStore.documents).find((doc) => doc.id === draggedTaskId.value) ?? null);

watch([() => props.documents, selectedHistoryRange, customDateStart, customDateEnd], () => { currentPublishedPage.value = 1; });
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
  if (task.status !== nextStatus) {
    await documentsStore.updateDocument(task.id, { status: nextStatus });
    taskView.value = target === "published-history" ? "history" : "active";
  }
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
  grid-template-columns: 36px minmax(180px, 1.15fr) 100px 120px 175px minmax(140px, 1fr) 50px 50px 32px;
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
  grid-template-columns: 36px minmax(180px, 1.15fr) 100px 120px 175px minmax(140px, 1fr) 50px 50px 32px;
}

.task-loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 150px;
  margin-top: 8px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--white) 72%, transparent);
  color: var(--gray-light-4);
  font-size: 0.9rem;
}

.task-loading-spinner {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  border: 2px solid #dce8d8;
  border-top-color: var(--green-2);
  border-radius: 50%;
  animation: task-loading-spin 0.75s linear infinite;
}

@keyframes task-loading-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .task-loading-spinner { animation: none; }
}

.task-workboard-scroll {
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
}

.task-workboard-scroll:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.add-task-row {
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.5);
}

.add-task-row:hover {
  border-color: var(--color-add-new-item-border-hover);
  background: var(--white);
}

.add-task-row:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
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
.task-view-tabs { display: flex; flex-wrap: wrap; gap: 4px; margin: 4px 0 14px; border-bottom: 1px solid var(--color-divider); }
.task-view-tab { display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 0 13px; border: 0; border-bottom: 3px solid transparent; background: transparent; color: var(--gray-light-4); cursor: pointer; font: 700 0.96rem "Monda", sans-serif; }
.task-view-tab:hover, .task-view-tab--active { color: var(--gray-dark-4); }
.task-view-tab--active { border-bottom-color: var(--green-2); }
.task-view-tab--drop-target { background: color-mix(in srgb, var(--green-2) 12%, transparent); }
.task-view-tab:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: -3px; }
.published-history-view { min-width: 0; }
.history-toolbar { display: flex; flex-wrap: wrap; align-items: end; gap: 10px 14px; margin: 12px 0; }
.history-range-select, .history-custom-range label { display: grid; gap: 4px; color: var(--gray-dark-3); font-size: 0.75rem; font-weight: 600; }
.history-range-select select, .history-custom-range input { min-width: 155px; height: 36px; padding: 0 9px; border: 1px solid var(--color-form-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-4); font: 400 0.84rem "Asap", sans-serif; }
.history-custom-range { display: flex; flex-wrap: wrap; gap: 10px; }
.history-custom-range input { min-width: 140px; }
.history-results-count { margin-left: auto; padding-bottom: 9px; color: var(--gray-light-4); font-size: 0.8rem; }
.history-return-dropzones { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0 0 12px; padding: 9px 10px; border: 1px dashed var(--color-border); border-radius: 6px; color: var(--gray-light-4); font-size: 0.78rem; }
.history-return-dropzones button { min-height: 30px; padding: 0 9px; border: 1px solid var(--color-form-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-3); font: 600 0.74rem "Asap", sans-serif; }
.history-return-dropzones button.history-return-dropzone--active { border-color: var(--green-2); background: var(--color-green-soft); }
.history-pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 0 8px; color: var(--gray-light-4); font-size: 0.78rem; }
.history-pagination__controls { display: flex; align-items: center; gap: 8px; }
.history-pagination button { min-height: 30px; padding: 0 9px; border: 1px solid var(--color-form-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-3); font: 600 0.75rem "Asap", sans-serif; cursor: pointer; }
.history-pagination button:disabled { opacity: 0.45; cursor: not-allowed; }
.history-empty { margin: 0; padding: 12px; color: var(--gray-light-4); font-size: 0.84rem; }

@media (max-width: 1100px) {
  .task-workboard-scroll { overflow: visible; }
  .task-workboard { min-width: 0; }
  .task-column-header { display: none; }
  :deep(.task-row) {
    grid-template-columns: 24px minmax(0, 1fr) auto;
    grid-template-areas:
      "leading vehicle status"
      "leading deadline date"
      "notes notes notes"
      "assets author actions";
    gap: 7px 10px;
    align-items: center;
    padding: 10px 12px;
  }
  :deep(.task-row > .task-row-leading) { grid-area: leading; align-self: stretch; }
  :deep(.task-row > .task-vehicle) { grid-area: vehicle; min-width: 0; padding-left: 0; overflow-wrap: anywhere; }
  :deep(.task-row > .task-deadline) { grid-area: deadline; min-width: 0; }
  :deep(.task-row > .status-badge) { grid-area: status; justify-self: end; width: auto; white-space: nowrap; }
  :deep(.task-row > .task-status-date) { grid-area: date; justify-self: end; min-width: 0; text-align: right; white-space: normal; }
  :deep(.task-row > .task-notes) { grid-area: notes; min-width: 0; padding-top: 7px; border-top: 1px solid var(--color-divider); }
  :deep(.task-row > .task-notes--empty) { display: none; }
  :deep(.task-row > .assets-popper),
  :deep(.task-row > .asset-empty) { grid-area: assets; justify-self: start; }
  :deep(.task-row > .author-picker),
  :deep(.task-row > .task-author-static) { grid-area: author; justify-self: center; }
  :deep(.task-row > .task-actions) { grid-area: actions; justify-self: end; }
  :deep(.task-mobile-label) { display: block; margin-bottom: 2px; color: var(--gray-light-4); font-size: 10px; font-weight: 600; line-height: 1.2; }
  :deep(.task-deadline--empty),
  :deep(.task-status-date--empty) { display: none; }

  .history-pagination { align-items: flex-start; flex-direction: column; }
  .history-results-count { width: 100%; margin-left: 0; padding-bottom: 0; }
}

:deep(.task-mobile-label) { display: none; }
</style>
