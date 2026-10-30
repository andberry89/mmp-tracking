<template>
  <section class="changeover-page">
    <header class="page-heading">
      <div>
        <h1>Changeover</h1>
        <p class="page-description">Track the vehicles that need a Make-Model Page for each model year.</p>
      </div>
      <div class="heading-actions">
        <label class="year-picker">Model year
          <select :value="store.selectedYear ?? ''" @change="selectYear">
            <option v-for="year in store.years" :key="year.year" :value="year.year">{{ year.year }}{{ year.isDefault ? ' · Active' : year.state === 'draft' ? ' · Draft' : '' }}</option>
          </select>
        </label>
        <button v-if="canEdit && store.selectedYear" class="primary-button" type="button" @click="openAdd">＋ Add Vehicle</button>
      </div>
    </header>

    <div v-if="store.error" class="error-banner" role="alert">{{ store.error }}</div>
    <div v-if="!store.years.length && !store.isLoading" class="empty-year">
      <strong>No model years are set up yet.</strong>
      <span>Add a model year from Catalog → Models before starting a Changeover list.</span>
    </div>

    <template v-else-if="store.selectedYear">
      <section class="overview" aria-label="Changeover overview">
        <article class="summary-card open-card"><span>Total Open</span><strong>{{ openCount }}</strong><small>vehicles marked OPEN / Unassigned</small></article>
        <article v-for="status in statusSummary" :key="status.value" class="summary-card" :style="{ borderTop: `3px solid ${statusColor(status.value)}` }">
          <span>{{ status.label }}</span><strong>{{ status.count }}</strong><small>{{ status.percent }}% {{ status.shareLabel }}</small>
        </article>
        <article class="summary-card deadline-card">
          <span>Deadline pacing</span>
          <strong>{{ pacingLabel }}</strong>
          <small>{{ pacingDetail }}</small>
          <div v-if="canEdit" class="deadline-control">
            <label>Deadline <input v-model="deadlineDraft" type="date" @change="saveDeadline" /></label>
            <span v-if="deadlineSaved" class="saved-label">Saved</span>
          </div>
        </article>
      </section>

      <section class="list-panel">
        <div class="list-toolbar">
          <div><h2>{{ store.selectedYear }} Changeover list</h2><p>{{ filteredEntries.length }} of {{ store.entries.length }} vehicles</p></div>
          <div class="filters">
            <label class="search-field"><span class="sr-only">Search vehicles</span><input v-model="query" type="search" placeholder="Search make or model" /></label>
            <label><span class="sr-only">Filter by status</span><select v-model="statusFilter"><option value="all">All statuses</option><option v-for="status in statusOptions" :key="status.value" :value="status.value">{{ status.label }}</option></select></label>
            <label><span class="sr-only">Filter by author</span><select v-model="authorFilter"><option value="all">All authors</option><option value="open">OPEN / Unassigned</option><option v-for="author in assignedAuthors" :key="author" :value="author">{{ author }}</option></select></label>
            <label>Group by<select v-model="groupingMode"><option value="none">None</option><option value="status">Status</option></select></label>
            <button class="clear-filters-button" type="button" :disabled="filtersAreClear" @click="clearFilters">Clear filters</button>
          </div>
        </div>

        <div v-if="store.isLoading" class="loading-state">Loading Changeover…</div>
        <div v-else-if="!filteredEntries.length" class="empty-state">
          <strong>{{ store.entries.length ? 'No vehicles match these filters.' : 'This Changeover list is empty.' }}</strong>
          <span v-if="!store.entries.length && canEdit">Add vehicles from the shared Catalog to start the list.</span>
          <button v-if="!store.entries.length && canEdit" class="primary-button" type="button" @click="openAdd">＋ Add Vehicle</button>
        </div>
        <div v-else class="table-scroll">
          <table :class="{ 'table--editable': canEdit }">
            <thead><tr>
              <th :aria-sort="sortAria('vehicle')"><button class="sort-button" type="button" @click="sortBy('vehicle')">Vehicle / Segment{{ sortGlyph('vehicle') }}</button></th>
              <th :aria-sort="sortAria('status')"><button class="sort-button" type="button" @click="sortBy('status')">Status{{ sortGlyph('status') }}</button></th>
              <th :aria-sort="sortAria('author')"><button class="sort-button" type="button" @click="sortBy('author')">Author{{ sortGlyph('author') }}</button></th>
              <th :aria-sort="sortAria('notes')"><button class="sort-button" type="button" @click="sortBy('notes')">Notes{{ sortGlyph('notes') }}</button></th>
              <th :aria-sort="sortAria('url')"><button class="sort-button" type="button" @click="sortBy('url')">URL / Resource{{ sortGlyph('url') }}</button></th>
              <th v-if="canEdit" aria-label="Actions"></th>
            </tr></thead>
            <tbody>
              <template v-for="(entry, index) in filteredEntries" :key="entry.id">
                <tr v-if="groupingMode === 'status' && (index === 0 || filteredEntries[index - 1]?.status !== entry.status)" class="status-group-row">
                  <td :colspan="canEdit ? 6 : 5">{{ statusLabel(entry.status) }} <span>{{ filteredEntries.filter((item) => item.status === entry.status).length }}</span></td>
                </tr>
                <tr :class="['changeover-row', `changeover-row--${entry.status}`]">
                  <td><strong>{{ entry.make }} {{ entry.model }}</strong><span class="segment">{{ entry.segment || 'Segment not set' }}</span></td>
                  <td><span class="status-pill" :class="`status-pill--${entry.status}`">{{ statusLabel(entry.status) }}</span></td>
                  <td><span v-if="entry.author" class="author-name">{{ entry.author }}</span><span v-else-if="entry.isOpen" class="open-author">OPEN</span><span v-else class="muted">—</span></td>
                  <td class="notes-cell"><span :class="['notes-preview', { 'notes-preview--expandable': entry.notes.length > NOTE_PREVIEW_LIMIT } ]">{{ notePreview(entry.notes) }}</span><button v-if="entry.notes.length > NOTE_PREVIEW_LIMIT" class="notes-more" type="button" @click="showNotes(entry)">See more</button></td>
                  <td><a v-if="entry.status === 'published' && entry.publicUrl" class="public-link" :href="entry.publicUrl" target="_blank" rel="noopener noreferrer">{{ entry.publicUrl }}<span aria-hidden="true"> ↗</span></a><a v-else-if="entry.resourceUrl" class="public-link" :href="entry.resourceUrl" target="_blank" rel="noopener noreferrer">Open resource<span aria-hidden="true"> ↗</span></a><span v-else class="muted">—</span></td>
                  <td v-if="canEdit" class="action-cell"><button class="edit-button" type="button" :aria-label="`Edit ${entry.make} ${entry.model}`" @click="openEdit(entry)">Edit</button></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <ChangeoverEntryModal
      v-model="modalOpen"
      :mode="modalMode"
      :year="store.selectedYear ?? 0"
      :entry="editingEntry"
      :makes="catalog.activeMakes"
      :models="catalog.models"
      :vehicles="modalVehicles"
      :published-vehicle-ids="publishedVehicleIds"
      :authors="authorsStore.allAuthors"
      :initial-status="initialStatus"
      :is-saving="store.isSaving"
      @save="saveEntry"
      @close="modalOpen = false"
    />
    <BaseModal v-model="notesModalOpen" :title="notesTitle" size="md" :click-to-close="true" :esc-to-close="true" :footer-divider="false" @close="notesModalOpen = false">
      <p class="full-notes">{{ expandedNotes }}</p>
      <template #footer>
        <div class="flex justify-end">
          <button type="button" class="app-button app-button--secondary" @click="notesModalOpen = false">Close</button>
        </div>
      </template>
    </BaseModal>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useAuthorsStore } from "@/stores/authors";
import { useCatalogStore } from "@/stores/catalog";
import { useChangeoverStore, type ChangeoverEntry, type ChangeoverStatus } from "@/stores/changeover";
import { useDocumentsStore } from "@/stores/documents";
import type { AuthorId, AuthorsByTeamGroup, GroupedAuthors, TaskDocument } from "@/types";
import ChangeoverEntryModal from "@/components/changeover/ChangeoverEntryModal.vue";
import BaseModal from "@/components/common/BaseModal.vue";

withDefaults(defineProps<{
  canEdit?: boolean;
  documents?: TaskDocument[];
  authors?: GroupedAuthors;
  activeAuthorsByTeam?: AuthorsByTeamGroup[];
}>(), { canEdit: false });
const store = useChangeoverStore();
const catalog = useCatalogStore();
const authorsStore = useAuthorsStore();
const documentsStore = useDocumentsStore();
const query = ref("");
const statusFilter = ref<ChangeoverStatus | "all">("all");
const authorFilter = ref<string>("all");
const groupingMode = ref<"none" | "status">("none");
const filtersAreClear = computed(() => !query.value.trim() && statusFilter.value === "all" && authorFilter.value === "all" && groupingMode.value === "none");
const deadlineDraft = ref("");
const deadlineSaved = ref(false);
const modalOpen = ref(false);
const modalMode = ref<"add" | "edit">("add");
const editingEntry = ref<ChangeoverEntry | null>(null);
const initialStatus = ref<ChangeoverStatus>("awaiting_info");
const NOTE_PREVIEW_LIMIT = 28;
const statusColors: Record<ChangeoverStatus, string> = {
  awaiting_info: "#9aa4aa",
  info_available: "#45b8d3",
  embargoed: "#eab02f",
  published: "#6eaa5d",
  skipped: "#e9a49b",
  dead: "#c9483f",
  vaporware: "#9a68b5",
};
const notesModalOpen = ref(false);
const notesTitle = ref("Notes");
const expandedNotes = ref("");
type SortKey = "vehicle" | "status" | "author" | "notes" | "url";
const sortKey = ref<SortKey>("vehicle");
const sortDirection = ref<"asc" | "desc">("asc");

const statusOptions: Array<{ value: ChangeoverStatus; label: string }> = [
  { value: "awaiting_info", label: "Awaiting Info" }, { value: "info_available", label: "Info Available" },
  { value: "embargoed", label: "Embargoed" }, { value: "published", label: "Published" },
  { value: "skipped", label: "Skipped" }, { value: "dead", label: "Dead" }, { value: "vaporware", label: "Vaporware" },
];
const publishedStatuses = new Set<ChangeoverStatus>(["published", "awaiting_info", "info_available", "embargoed"]);
const openCount = computed(() => store.entries.filter((entry) => entry.isOpen).length);
const statusSummary = computed(() => statusOptions.map((status) => {
  const count = store.entries.filter((entry) => entry.status === status.value).length;
  const isProductionStatus = publishedStatuses.has(status.value);
  const denominator = isProductionStatus ? store.entries.filter((entry) => publishedStatuses.has(entry.status)).length : store.entries.length;
  return { ...status, count, percent: denominator ? Math.round(count * 100 / denominator) : 0, shareLabel: isProductionStatus ? "of production statuses" : "of list" };
}));
const yearVehicles = computed(() => catalog.modelYearVehicles.filter((vehicle) => vehicle.modelYear === store.selectedYear));
const modalVehicles = computed(() => modalMode.value === "edit"
  ? yearVehicles.value
  : yearVehicles.value.filter((vehicle) => !store.entries.some((entry) => entry.modelYearVehicleId === vehicle.id)));
const publishedVehicleIds = computed(() => documentsStore.documents
  .filter((document) => ["published", "updated"].includes(document.status) && document.modelYearVehicleId)
  .map((document) => document.modelYearVehicleId as string));
const assignedAuthors = computed(() => [...new Set(store.entries.map((entry) => entry.author).filter(Boolean))].sort((a, b) => a.localeCompare(b)));
const filteredEntries = computed(() => {
  const normalized = query.value.trim().toLowerCase();
  return store.entries.filter((entry) => {
    const textMatches = !normalized || `${entry.make} ${entry.model} ${entry.segment}`.toLowerCase().includes(normalized);
    const statusMatches = statusFilter.value === "all" || entry.status === statusFilter.value;
    const authorMatches = authorFilter.value === "all" || (authorFilter.value === "open" ? entry.isOpen : entry.author === authorFilter.value);
    return textMatches && statusMatches && authorMatches;
  }).sort((a, b) => {
    if (groupingMode.value === "status") {
      const statusOrder = statusOptions.findIndex((item) => item.value === a.status) - statusOptions.findIndex((item) => item.value === b.status);
      if (statusOrder !== 0) return sortKey.value === "status" && sortDirection.value === "desc" ? -statusOrder : statusOrder;
    }
    let comparison = 0;
    if (sortKey.value === "status") comparison = statusOptions.findIndex((item) => item.value === a.status) - statusOptions.findIndex((item) => item.value === b.status);
    else if (sortKey.value === "vehicle") comparison = a.make.localeCompare(b.make) || a.model.localeCompare(b.model);
    else if (sortKey.value === "author") comparison = (a.author || "OPEN").localeCompare(b.author || "OPEN");
    else if (sortKey.value === "notes") comparison = a.notes.localeCompare(b.notes);
    else comparison = (a.status === "published" ? a.publicUrl : a.resourceUrl).localeCompare(b.status === "published" ? b.publicUrl : b.resourceUrl);
    if (comparison === 0) comparison = a.make.localeCompare(b.make) || a.model.localeCompare(b.model);
    return sortDirection.value === "asc" ? comparison : -comparison;
  });
});
const remainingDays = computed(() => {
  if (!deadlineDraft.value) return null;
  const [year, month, day] = deadlineDraft.value.split("-").map(Number);
  const today = new Date();
  const deadlineUtc = Date.UTC(year, month - 1, day);
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((deadlineUtc - todayUtc) / 86400000);
});
const unresolvedCount = computed(() => store.entries.filter((entry) => ["awaiting_info", "info_available", "embargoed"].includes(entry.status)).length);
const pacingLabel = computed(() => {
  if (!deadlineDraft.value) return "Deadline not set";
  if ((remainingDays.value ?? -1) < 0) return "Deadline passed";
  if (unresolvedCount.value === 0) return "On track";
  const days = remainingDays.value ?? 0;
  return days === 0 ? `Complete ${unresolvedCount.value} today` : `${Math.ceil(unresolvedCount.value / (days / 7))} / week`;
});
const pacingDetail = computed(() => {
  if (!deadlineDraft.value) return "Set a year deadline to calculate pace";
  const days = remainingDays.value ?? 0;
  if (days < 0) return `${unresolvedCount.value} vehicles still in progress`;
  if (days === 0) return `${unresolvedCount.value} awaiting completion · deadline is today`;
  const weeks = Math.floor(days / 7);
  const remainder = days % 7;
  const timeLeft = [weeks ? `${weeks} week${weeks === 1 ? "" : "s"}` : "", remainder ? `${remainder} day${remainder === 1 ? "" : "s"}` : ""].filter(Boolean).join(", ");
  return `${unresolvedCount.value} awaiting completion · ${timeLeft} remaining`;
});

onMounted(() => { if (!store.years.length) void store.load(); });
watch(() => store.selectedYear, (year) => {
  deadlineDraft.value = store.years.find((item) => item.year === year)?.deadline ?? "";
});
watch(() => store.years, (years) => {
  deadlineDraft.value = years.find((item) => item.year === store.selectedYear)?.deadline ?? "";
}, { deep: true });

function selectYear(event: Event) { const year = Number((event.target as HTMLSelectElement).value); void store.load(year); }
function openAdd() {
  modalMode.value = "add";
  editingEntry.value = null;
  initialStatus.value = "awaiting_info";
  modalOpen.value = true;
}
function openEdit(entry: ChangeoverEntry) { modalMode.value = "edit"; editingEntry.value = entry; modalOpen.value = true; }
function statusLabel(value: ChangeoverStatus) { return statusOptions.find((status) => status.value === value)?.label ?? value; }
function clearFilters() {
  query.value = "";
  statusFilter.value = "all";
  authorFilter.value = "all";
  groupingMode.value = "none";
}
function notePreview(value: string) { return value.length > NOTE_PREVIEW_LIMIT ? `${value.slice(0, NOTE_PREVIEW_LIMIT - 2).trimEnd()}…` : value || "—"; }
function statusColor(status: ChangeoverStatus) { return statusColors[status]; }
function showNotes(entry: ChangeoverEntry) {
  notesTitle.value = `Notes: ${entry.make} ${entry.model}`;
  expandedNotes.value = entry.notes;
  notesModalOpen.value = true;
}
function sortBy(key: SortKey) {
  if (sortKey.value === key) sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  else { sortKey.value = key; sortDirection.value = "asc"; }
}
function sortGlyph(key: SortKey) { return sortKey.value === key ? (sortDirection.value === "asc" ? " ↑" : " ↓") : ""; }
function sortAria(key: SortKey): "ascending" | "descending" | "none" {
  if (sortKey.value !== key) return "none";
  return sortDirection.value === "asc" ? "ascending" : "descending";
}
async function saveDeadline() {
  if (store.selectedYear === null) return;
  deadlineSaved.value = false;
  try { await store.updateDeadline(store.selectedYear, deadlineDraft.value); deadlineSaved.value = true; window.setTimeout(() => { deadlineSaved.value = false; }, 1600); }
  catch { /* The store presents its error inline. */ }
}
async function saveEntry(input: { vehicle: import("@/stores/catalog").ModelYearVehicleOption; status: ChangeoverStatus; assignedAuthorId: AuthorId | null; notes: string; publicUrl: string; resourceUrl: string }) {
  try {
    if (modalMode.value === "add") await store.addEntry(input.vehicle, input);
    else if (editingEntry.value) await store.updateEntry(editingEntry.value, input);
    modalOpen.value = false;
  } catch (reason) { window.alert(reason instanceof Error ? reason.message : "Could not save this Changeover entry."); }
}
</script>

<style scoped>
.changeover-page { display: grid; gap: 20px; color: var(--gray-dark-5); }
.page-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
h1 { margin: 0; font: 700 1.65rem/1.2 "Monda", sans-serif; }
.page-description { margin: 5px 0 0; color: var(--gray-light-4); font-size: .9rem; }
.heading-actions, .filters { display: flex; align-items: end; gap: 10px; }
.year-picker, .filters label { display: grid; gap: 5px; color: var(--gray-dark-3); font-size: .76rem; font-weight: 600; }
select, input { min-height: 36px; padding: 7px 10px; border: 1px solid var(--color-form-border); border-radius: 6px; background: var(--white); color: var(--gray-dark-5); font: 400 .86rem "Asap", sans-serif; }
.primary-button { min-height: 36px; padding: 0 13px; border: 1px solid transparent; border-radius: 5px; background: var(--green-2); color: var(--white); font: 600 .84rem "Asap", sans-serif; cursor: pointer; white-space: nowrap; }
.overview { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)) minmax(220px, 1.5fr); gap: 10px; }
.summary-card { display: grid; align-content: start; gap: 5px; min-height: 100px; padding: 13px 14px; border: 1px solid var(--color-border); border-radius: 8px; background: color-mix(in srgb, var(--white) 92%, transparent); }
.summary-card > span { color: var(--gray-light-4); font-size: .75rem; font-weight: 600; }
.summary-card strong { font: 700 1.35rem/1.1 "Monda", sans-serif; }
.summary-card small { color: var(--gray-light-4); font-size: .73rem; }
.open-card { border-top: 3px solid var(--orange); }
.deadline-card { grid-template-columns: 1fr; }
.deadline-control { display: flex; align-items: end; gap: 9px; margin-top: 2px; }
.deadline-control label { display: grid; gap: 4px; color: var(--gray-dark-3); font-size: .73rem; font-weight: 600; }
.deadline-control input { min-height: 30px; padding: 5px 8px; }
.saved-label { padding-bottom: 6px; color: var(--green-dark); font-size: .74rem; }
.list-panel { overflow: hidden; border: 1px solid var(--color-border); border-radius: 8px; background: color-mix(in srgb, var(--white) 94%, transparent); }
.list-toolbar { display: flex; justify-content: space-between; align-items: end; gap: 16px; padding: 16px 17px; border-bottom: 1px solid var(--color-border); }
.list-toolbar h2 { margin: 0; font: 700 1rem "Monda", sans-serif; }
.list-toolbar p { margin: 3px 0 0; color: var(--gray-light-4); font-size: .76rem; }
.filters { align-items: end; }
.clear-filters-button { min-height: 36px; padding: 0 10px; border: 1px solid var(--color-form-border); border-radius: 6px; background: var(--white); color: var(--gray-dark-3); font: 600 .8rem "Asap", sans-serif; cursor: pointer; white-space: nowrap; }
.clear-filters-button:hover:not(:disabled) { border-color: var(--green-2); color: var(--green-dark); }
.clear-filters-button:disabled { opacity: .5; cursor: default; }
.search-field input { width: 190px; }
.table-scroll { overflow-x: auto; }
table { width: 100%; min-width: 1000px; border-collapse: collapse; table-layout: fixed; text-align: left; font-size: .82rem; }
table.table--editable { min-width: 1090px; }
th { padding: 10px 13px; color: var(--gray-light-4); font-size: .72rem; font-weight: 700; white-space: nowrap; }
th:nth-child(1), td:nth-child(1) { width: 190px; }
th:nth-child(2), td:nth-child(2) { width: 130px; }
th:nth-child(3), td:nth-child(3) { width: 130px; }
th:nth-child(4), td:nth-child(4) { width: 180px; }
th:nth-child(5), td:nth-child(5) { width: 350px; }
table.table--editable th:nth-child(6), table.table--editable td:nth-child(6) { width: 110px; }
.sort-button { padding: 0; border: 0; background: transparent; color: inherit; font: inherit; font-weight: inherit; text-align: left; cursor: pointer; }
.sort-button:hover { color: var(--gray-dark-5); }
td { padding: 11px 13px; border-top: 1px solid var(--color-border); vertical-align: middle; }
td:first-child { position: relative; isolation: isolate; overflow: hidden; }
td:first-child::before { position: absolute; z-index: 0; top: 0; bottom: 0; left: 0; width: 43px; background: linear-gradient(135deg, var(--row-status-color) 0%, color-mix(in srgb, var(--row-status-color) 32%, transparent) 48%, transparent 78%); content: ""; pointer-events: none; }
td:first-child strong, td:first-child .segment { position: relative; z-index: 1; display: block; overflow-wrap: anywhere; }
.changeover-row--awaiting_info { --row-status-color: #9aa4aa; }
.changeover-row--info_available { --row-status-color: #45b8d3; }
.changeover-row--embargoed { --row-status-color: #eab02f; }
.changeover-row--published { --row-status-color: #6eaa5d; }
.changeover-row--skipped { --row-status-color: #e9a49b; }
.changeover-row--dead { --row-status-color: #c9483f; }
.changeover-row--vaporware { --row-status-color: #9a68b5; }
.segment { margin-top: 2px; color: var(--gray-light-4); font-size: .75rem; }
.status-pill { display: inline-flex; padding: 4px 8px; border-radius: 5px; background: #eef2f4; color: #58646b; font-size: .73rem; font-weight: 700; white-space: nowrap; }
.status-pill--published { background: #e6f3e3; color: #3c7734; }
.status-pill--awaiting_info { background: #edf0f2; color: #59656c; }
.status-pill--info_available { background: #e8f1fb; color: #376f9e; }
.status-pill--embargoed { background: #fff2d9; color: #94620a; }
.status-pill--skipped { background: #faeeec; color: #a46b63; }
.status-pill--dead { background: #f4d8d5; color: #8c332c; }
.status-pill--vaporware { background: #f1e9f7; color: #76528d; }
.open-author { color: var(--gray-light-4); font-size: .75rem; font-weight: 700; }
.notes-cell { overflow: hidden; color: var(--gray-dark-3); white-space: nowrap; }
.notes-preview { display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; white-space: nowrap; }
.notes-preview--expandable { max-width: calc(100% - 62px); }
.notes-more { margin-left: 5px; padding: 0; border: 0; background: transparent; color: var(--green-dark); cursor: pointer; font: 600 .72rem "Asap", sans-serif; vertical-align: middle; white-space: nowrap; }
.notes-more:hover { text-decoration: underline; }
.full-notes { margin: 0; color: var(--gray-dark-3); font-size: .9rem; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
.public-link { display: inline-block; max-width: 100%; color: var(--blue-3, #277da1); overflow-wrap: anywhere; text-decoration: none; }
.public-link:hover { text-decoration: underline; }
.muted { color: var(--gray-light-4); }
.action-cell { white-space: nowrap; }
.status-group-row td { padding-top: 10px; padding-bottom: 7px; background: rgba(255, 255, 255, .72); color: var(--gray-dark-3); font: 700 .8rem "Monda", sans-serif; }
.status-group-row span { margin-left: 6px; color: var(--gray-light-4); font: 500 .73rem "Asap", sans-serif; }
.edit-button { padding: 5px 9px; border: 1px solid var(--color-form-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-3); font: 600 .75rem "Asap", sans-serif; cursor: pointer; }
.empty-state, .empty-year, .loading-state { display: grid; justify-items: center; gap: 8px; padding: 42px 16px; color: var(--gray-light-4); text-align: center; font-size: .85rem; }
.empty-state strong, .empty-year strong { color: var(--gray-dark-3); }
.empty-year { border: 1px dashed var(--color-border); border-radius: 8px; }
.error-banner { padding: 10px 12px; border: 1px solid #e5b7b2; border-radius: 6px; background: #fff1ef; color: #8d3930; font-size: .84rem; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
@media (max-width: 1050px) { .overview { grid-template-columns: repeat(3, minmax(120px, 1fr)); } .deadline-card { grid-column: span 2; } }
@media (max-width: 760px) { .page-heading, .list-toolbar { align-items: stretch; flex-direction: column; } .heading-actions, .filters { flex-wrap: wrap; } .overview { grid-template-columns: repeat(2, minmax(120px, 1fr)); } .deadline-card { grid-column: auto; } .search-field input { width: 100%; } }
</style>
