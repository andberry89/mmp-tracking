<template>
  <section class="rankings-page">
    <header class="page-heading">
      <div>
        <h1>Rankings</h1>
        <p class="page-description">Order vehicles within each segment and keep ratings and award history connected to the Catalog.</p>
      </div>
      <label class="year-picker">Model year
        <select :value="store.selectedYear ?? ''" @change="selectYear">
          <option v-for="year in store.years" :key="year" :value="year">{{ year }}{{ catalog.modelYearRecords.find((row) => row.year === year)?.isDefault ? ' · Active' : '' }}</option>
        </select>
      </label>
    </header>

    <p v-if="store.error" class="error-banner" role="alert">{{ store.error }}</p>

    <section class="rankings-toolbar" aria-label="Ranking filters">
      <label class="rankings-search"><span class="sr-only">Search rankings</span><input v-model="searchQuery" type="search" placeholder="Search make, model, or segment" /></label>
      <label>Body style<select v-model="bodyStyleFilter"><option value="all">All body styles</option><option v-for="style in bodyStyleOptions" :key="style.id" :value="style.id">{{ style.label }}</option></select></label>
      <button v-if="availableSegments.length" class="compare-trigger" type="button" @click="openComparePicker">Compare segments <span>{{ selectedSegments.length ? `${selectedSegments.length} selected` : 'Choose 2 or more' }}</span></button>
      <button class="filter-reset" type="button" :disabled="filtersClear" @click="clearFilters">Clear filters</button>
    </section>

    <BaseModal v-model="compareModalOpen" title="Compare segments" size="lg" @close="compareModalOpen = false">
      <div class="compare-modal">
        <p>Select two or more lists to view them side by side.</p>
        <label class="compare-search"><span class="sr-only">Search segments</span><input v-model="compareQuery" type="search" placeholder="Find a segment…" /></label>
        <div class="compare-options">
          <label v-for="segment in filteredSegments" :key="segment.id" class="compare-option">
            <input v-model="draftSelectedSegments" type="checkbox" :value="segment.id" />
            <span>{{ segment.name }}</span><small>{{ bodyStyleLabel(segment.bodyStyle) }}</small>
          </label>
          <p v-if="!filteredSegments.length" class="compare-empty">No segments match that search.</p>
        </div>
        <p v-if="draftSelectedSegments.length < 2" class="compare-hint">Choose at least two segments to compare.</p>
      </div>
      <template #footer>
        <div class="compare-modal__actions"><button type="button" class="filter-reset" @click="compareModalOpen = false">Cancel</button><button type="button" class="compare-apply" :disabled="draftSelectedSegments.length < 2" @click="applySegmentComparison">Compare {{ draftSelectedSegments.length }} segments</button></div>
      </template>
    </BaseModal>

    <div v-if="store.isLoading" class="rankings-loading" role="status" aria-live="polite">
      <span class="rankings-spinner" aria-hidden="true"></span>Loading Rankings…
    </div>
    <div v-else-if="!visibleGroups.length" class="rankings-empty">
      <strong>No segment entries for {{ store.selectedYear ?? 'this year' }}.</strong>
      <span>Add or assign Segments in Catalog → Models. Rankings for the selected year can then be ordered here.</span>
    </div>

    <div v-else class="segment-grid" :class="{ 'segment-grid--compare': selectedSegments.length > 1 }">
      <section v-for="group in visibleGroups" :key="group.id" class="segment-panel">
        <header class="segment-panel__heading">
          <div><span v-if="group.bodyStyle" class="body-style-label">{{ bodyStyleLabel(group.bodyStyle) }}</span><h2>{{ group.name }}</h2></div>
          <span class="segment-count">{{ group.ranked.length }} ranked<span v-if="group.unranked.length"> · {{ group.unranked.length }} unranked</span></span>
        </header>

        <ol class="ranked-list" :aria-label="`${group.name} ranking order`" @dragover.prevent="previewDropEnd($event, group)" @drop.prevent="dropAtEnd($event, group.id)">
          <li
            v-for="entry in visibleRanked(group)"
            :key="entry.vehicleId"
            class="ranked-row"
            :class="{
              'ranked-row--dragging': draggedVehicleId === entry.vehicleId,
              'ranked-row--drop-before': dropTarget?.vehicleId === entry.vehicleId && dropTarget.position === 'before',
              'ranked-row--drop-after': dropTarget?.vehicleId === entry.vehicleId && dropTarget.position === 'after',
            }"
            @dragend="clearDrag"
            @dragover.stop.prevent="previewDropPosition($event, group, entry)"
            @dragleave.self="clearDropTarget"
            @drop.stop.prevent="dropOnEntry($event, group, entry)"
          >
            <button v-if="canEdit" class="drag-grip" type="button" draggable="true" :aria-label="`Drag to change rank for ${entry.make} ${entry.model}`" title="Drag to change rank" @dragstart="startDrag($event, entry)">⠿</button>
            <div class="ranked-row__vehicle"><div class="vehicle-line"><label v-if="canEdit" class="rank-position-control"><span class="sr-only">Rank position for {{ entry.make }} {{ entry.model }}</span><input :value="entry.rankPosition" type="number" min="1" :max="group.ranked.length" :disabled="store.isSaving" @change="changeRankPosition(group, entry, $event)" /></label><span v-else class="rank-number">{{ entry.rankPosition }}</span><strong>{{ entry.make }} {{ entry.model }}</strong><label v-if="canEdit" class="rating-control"><span class="sr-only">Rating for {{ entry.make }} {{ entry.model }}</span><select :value="entry.rating ?? ''" :disabled="store.isSaving" @change="saveRating(entry, $event)"><option value="">Rate</option><option v-for="rating in ratingOptions" :key="rating" :value="rating">{{ rating.toFixed(1) }}</option></select></label><span v-else class="rating-readonly">{{ entry.rating ?? '—' }}</span></div></div>
            <div class="ranking-awards" :aria-label="awardSummary(entry)">
              <span v-if="latestAwardYear(entry.awards.ten_best)" class="latest-award" :title="`Most recent 10 Best: ${latestAwardYear(entry.awards.ten_best)}`"><img :src="tenBestLogo" alt="10 Best" /><small>Last won</small><strong>{{ latestAwardYear(entry.awards.ten_best) }}</strong></span>
              <span v-if="latestAwardYear(entry.awards.editors_choice)" class="latest-award" :title="`Most recent Editors’ Choice: ${latestAwardYear(entry.awards.editors_choice)}`"><img :src="editorsChoiceLogo" alt="Editors’ Choice" /><small>Last won</small><strong>{{ latestAwardYear(entry.awards.editors_choice) }}</strong></span>
            </div>
            <details v-if="canEdit" class="award-editor" v-click-outside="closePopover">
              <summary :aria-label="`Edit award history for ${entry.make} ${entry.model}`">Awards</summary>
              <div class="award-editor__panel">
                <div class="award-history-row"><img :src="tenBestLogo" alt="" /><strong>10 Best</strong><span>{{ formatAwardYears(entry.awards.ten_best) }}</span></div>
                <div class="award-history-row"><img :src="editorsChoiceLogo" alt="" /><strong>Editors’ Choice</strong><span>{{ formatAwardYears(entry.awards.editors_choice) }}</span></div>
                <div class="award-editor__divider"></div>
                <label>Award year<select v-model.number="awardYear"><option v-for="year in awardYears" :key="year" :value="year">{{ year }}</option></select></label>
                <label><input type="checkbox" :checked="entry.awards.ten_best.includes(awardYear)" @change="toggleAward(entry, 'ten_best', $event)" />10 Best</label>
                <label><input type="checkbox" :checked="entry.awards.editors_choice.includes(awardYear)" @change="toggleAward(entry, 'editors_choice', $event)" />Editors’ Choice</label>
              </div>
            </details>
            <button v-if="canEdit" class="unrank-button" type="button" :disabled="store.isSaving" @click="removeRank(group, entry)">Unrank</button>
          </li>
          <li v-if="canEdit && draggedVehicleId && draggedSegmentId === group.id" class="rank-drop-end" :class="{ 'rank-drop-end--active': dropTarget?.position === 'end' }">Drop here to place last</li>
          <li v-if="!visibleRanked(group).length" class="ranked-empty">No ranked vehicles yet. Choose Rank below or drag a model here.</li>
        </ol>

        <details v-if="group.unranked.length" class="unranked-section">
          <summary>Unranked and future models <span>{{ group.unranked.length }}</span><small> · expand to place or drag</small></summary>
          <ul>
            <li v-for="entry in visibleUnranked(group)" :key="entry.vehicleId" class="unranked-row" :class="{ 'ranked-row--dragging': draggedVehicleId === entry.vehicleId }" @dragend="clearDrag">
              <button v-if="canEdit" class="drag-grip" type="button" draggable="true" :aria-label="`Drag ${entry.make} ${entry.model} into ranked vehicles`" title="Drag into the ranked list" @dragstart="startDrag($event, entry)">⠿</button>
              <div class="ranked-row__vehicle"><div class="vehicle-line"><strong>{{ entry.make }} {{ entry.model }}</strong><label v-if="canEdit" class="rating-control"><span class="sr-only">Rating for {{ entry.make }} {{ entry.model }}</span><select :value="entry.rating ?? ''" :disabled="store.isSaving" @change="saveRating(entry, $event)"><option value="">Rate</option><option v-for="rating in ratingOptions" :key="rating" :value="rating">{{ rating.toFixed(1) }}</option></select></label><span v-else class="rating-readonly">{{ entry.rating ?? '—' }}</span></div><small>{{ entry.state === 'future' ? 'Future model' : 'Unranked' }}</small></div>
              <label v-if="canEdit" class="entry-state-control"><span class="sr-only">Status for {{ entry.make }} {{ entry.model }} in {{ group.name }}</span><select :value="entry.state" :disabled="store.isSaving" @change="changeEntryState(entry, $event)"><option value="unranked">Unranked</option><option value="future">Future model</option></select></label>
              <button v-if="canEdit" class="rank-entry-button" type="button" :disabled="store.isSaving" @click="addToRanking(group, entry)">Rank</button>
            </li>
            <li v-if="!visibleUnranked(group).length" class="ranked-empty">No unranked vehicles match this search.</li>
          </ul>
        </details>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import BaseModal from "@/components/common/BaseModal.vue";
import { bodyStyleOptions, useCatalogStore, type BodyStyle } from "@/stores/catalog";
import { useRankingsStore, type RankingAward, type RankingEntry } from "@/stores/rankings";
import tenBestLogo from "@/assets/awards/10-best-logo.svg?url";
import editorsChoiceLogo from "@/assets/awards/ec-logo.svg?url";

const props = withDefaults(defineProps<{ canEdit?: boolean }>(), { canEdit: false });
const catalog = useCatalogStore();
const store = useRankingsStore();
const canEdit = computed(() => props.canEdit);
const searchQuery = ref("");
const bodyStyleFilter = ref<BodyStyle | "all">("all");
const selectedSegments = ref<string[]>([]);
const draftSelectedSegments = ref<string[]>([]);
const compareModalOpen = ref(false);
const compareQuery = ref("");
const awardYear = ref(2027);
const draggedVehicleId = ref<string | null>(null);
const draggedSegmentId = ref<string | null>(null);
const dropTarget = ref<{ vehicleId?: string; position: "before" | "after" | "end" } | null>(null);
const ratingOptions = Array.from({ length: 19 }, (_, index) => 1 + index * 0.5);
const awardYears = computed(() => {
  const latest = store.selectedYear ?? 2027;
  return Array.from({ length: Math.max(1, latest - 1999) }, (_, index) => latest - index);
});
const queryValue = computed(() => searchQuery.value.trim().toLowerCase());
const filtersClear = computed(() => !queryValue.value && bodyStyleFilter.value === "all" && !selectedSegments.value.length);

const availableSegments = computed(() => {
  const map = new Map<string, { id: string; name: string; bodyStyle: BodyStyle | null }>();
  store.entries.forEach((entry) => map.set(entry.segmentId, { id: entry.segmentId, name: entry.segment, bodyStyle: entry.bodyStyle }));
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
});

const allGroups = computed(() => {
  const grouped = new Map<string, { id: string; name: string; bodyStyle: BodyStyle | null; ranked: RankingEntry[]; unranked: RankingEntry[] }>();
  store.entries.forEach((entry) => {
    const group = grouped.get(entry.segmentId) ?? { id: entry.segmentId, name: entry.segment, bodyStyle: entry.bodyStyle, ranked: [], unranked: [] };
    if (entry.rankPosition === null) group.unranked.push(entry);
    else group.ranked.push(entry);
    grouped.set(entry.segmentId, group);
  });
  return [...grouped.values()].map((group) => ({
    ...group,
    ranked: group.ranked.sort((a, b) => (a.rankPosition ?? Number.MAX_SAFE_INTEGER) - (b.rankPosition ?? Number.MAX_SAFE_INTEGER)),
    unranked: group.unranked.sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model)),
  })).sort((a, b) => (a.bodyStyle ?? "").localeCompare(b.bodyStyle ?? "") || a.name.localeCompare(b.name));
});

const visibleGroups = computed(() => allGroups.value.filter((group) => {
  if (bodyStyleFilter.value !== "all" && group.bodyStyle !== bodyStyleFilter.value) return false;
  if (selectedSegments.value.length && !selectedSegments.value.includes(group.id)) return false;
  if (!queryValue.value) return true;
  return group.name.toLowerCase().includes(queryValue.value)
    || [...group.ranked, ...group.unranked].some((entry) => `${entry.make} ${entry.model} ${entry.modelYear}`.toLowerCase().includes(queryValue.value));
}));

const filteredSegments = computed(() => {
  const query = compareQuery.value.trim().toLowerCase();
  return availableSegments.value.filter((segment) => !query || segment.name.toLowerCase().includes(query) || bodyStyleLabel(segment.bodyStyle).toLowerCase().includes(query));
});

onMounted(async () => {
  if (!catalog.modelYears.length) await catalog.loadCatalog();
  await store.load();
  store.subscribeToChanges();
});
onBeforeUnmount(() => store.stopRealtime());
watch(() => catalog.modelYears, (years) => {
  if (store.selectedYear === null && years.length) void store.load(years.includes(2027) ? 2027 : years[0]);
});
watch(() => store.selectedYear, (year) => { if (year) awardYear.value = year; });

function selectYear(event: Event) {
  const year = Number((event.target as HTMLSelectElement).value);
  if (Number.isInteger(year)) {
    selectedSegments.value = [];
    void store.load(year);
  }
}
function clearFilters() { searchQuery.value = ""; bodyStyleFilter.value = "all"; selectedSegments.value = []; }
function bodyStyleLabel(style: BodyStyle | null) { return bodyStyleOptions.find((item) => item.id === style)?.label ?? "Uncategorized"; }
function openComparePicker() { draftSelectedSegments.value = [...selectedSegments.value]; compareQuery.value = ""; compareModalOpen.value = true; }
function applySegmentComparison() { selectedSegments.value = [...draftSelectedSegments.value]; compareModalOpen.value = false; }
function closePopover(_event: Event, element?: HTMLElement) { if (element instanceof HTMLDetailsElement) element.open = false; }
function latestAwardYear(years: number[]) { return years.length ? Math.max(...years) : null; }
function formatAwardYears(years: number[]) { return years.length ? years.slice().sort(descendingNumbers).join(", ") : "No wins recorded"; }
function descendingNumbers(a: number, b: number) { return b - a; }
function visibleRanked(group: (typeof allGroups.value)[number]) {
  if (!queryValue.value) return group.ranked;
  return group.ranked.filter((entry) => `${entry.make} ${entry.model} ${entry.modelYear}`.toLowerCase().includes(queryValue.value));
}
function visibleUnranked(group: (typeof allGroups.value)[number]) {
  if (!queryValue.value) return group.unranked;
  return group.unranked.filter((entry) => `${entry.make} ${entry.model} ${entry.modelYear}`.toLowerCase().includes(queryValue.value));
}
function awardSummary(entry: RankingEntry) {
  const awards = [...entry.awards.ten_best.map((year) => `10 Best ${year}`), ...entry.awards.editors_choice.map((year) => `Editors’ Choice ${year}`)];
  return awards.length ? awards.join(", ") : "No awards recorded";
}
function startDrag(event: DragEvent, entry: RankingEntry) {
  if (!canEdit.value || !event.dataTransfer) return;
  draggedVehicleId.value = entry.vehicleId;
  draggedSegmentId.value = entry.segmentId;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", entry.vehicleId);
  const row = (event.currentTarget as HTMLElement).closest(".ranked-row, .unranked-row");
  if (row) {
    const preview = row.cloneNode(true) as HTMLElement;
    const bounds = row.getBoundingClientRect();
    Object.assign(preview.style, { position: "fixed", top: "-1000px", left: "-1000px", width: `${bounds.width}px`, opacity: "0.96", pointerEvents: "none" });
    document.body.append(preview);
    event.dataTransfer.setDragImage(preview, 24, Math.max(12, bounds.height / 2));
    window.setTimeout(() => preview.remove(), 0);
  }
}
function clearDropTarget() { dropTarget.value = null; }
function clearDrag() { draggedVehicleId.value = null; draggedSegmentId.value = null; clearDropTarget(); }
function previewDropPosition(event: DragEvent, group: (typeof allGroups.value)[number], target: RankingEntry) {
  if (!draggedVehicleId.value || draggedVehicleId.value === target.vehicleId || draggedSegmentId.value !== group.id) {
    clearDropTarget();
    return;
  }
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
  dropTarget.value = { vehicleId: target.vehicleId, position: event.clientY > bounds.top + bounds.height / 2 ? "after" : "before" };
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
}
function previewDropEnd(_event: DragEvent, group: (typeof allGroups.value)[number]) {
  if (draggedVehicleId.value && draggedSegmentId.value === group.id) dropTarget.value = { position: "end" };
}
function dropOnEntry(event: DragEvent, group: (typeof allGroups.value)[number], target: RankingEntry) {
  const vehicleId = event.dataTransfer?.getData("text/plain") || draggedVehicleId.value;
  if (!vehicleId || vehicleId === target.vehicleId || draggedSegmentId.value !== group.id) return;
  const ordered = group.ranked.map((entry) => entry.vehicleId).filter((id) => id !== vehicleId);
  const targetIndex = ordered.indexOf(target.vehicleId);
  if (targetIndex < 0) return;
  const targetBounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const insertAfterTarget = dropTarget.value?.vehicleId === target.vehicleId
    ? dropTarget.value.position === "after"
    : event.clientY > targetBounds.top + targetBounds.height / 2;
  ordered.splice(targetIndex + Number(insertAfterTarget), 0, vehicleId);
  void store.saveRankOrder(group.id, ordered);
  clearDrag();
}
function changeRankPosition(group: (typeof allGroups.value)[number], entry: RankingEntry, event: Event) {
  const input = event.target as HTMLInputElement;
  const requestedPosition = Number(input.value);
  if (!Number.isInteger(requestedPosition)) {
    input.value = String(entry.rankPosition ?? "");
    return;
  }
  const ordered = group.ranked.map((item) => item.vehicleId).filter((id) => id !== entry.vehicleId);
  const newPosition = Math.max(1, Math.min(requestedPosition, group.ranked.length));
  ordered.splice(newPosition - 1, 0, entry.vehicleId);
  input.value = String(newPosition);
  void store.saveRankOrder(group.id, ordered);
}
function dropAtEnd(event: DragEvent, segmentId: string) {
  const vehicleId = event.dataTransfer?.getData("text/plain") || draggedVehicleId.value;
  const group = allGroups.value.find((item) => item.id === segmentId);
  if (!vehicleId || draggedSegmentId.value !== segmentId || !group) return;
  const ordered = group.ranked.map((entry) => entry.vehicleId).filter((id) => id !== vehicleId);
  ordered.push(vehicleId);
  void store.saveRankOrder(segmentId, ordered);
  clearDrag();
}
function removeRank(group: (typeof allGroups.value)[number], entry: RankingEntry) {
  void store.saveRankOrder(group.id, group.ranked.filter((item) => item.vehicleId !== entry.vehicleId).map((item) => item.vehicleId));
}
function addToRanking(group: (typeof allGroups.value)[number], entry: RankingEntry) {
  const ordered = group.ranked.map((item) => item.vehicleId);
  if (!ordered.includes(entry.vehicleId)) ordered.push(entry.vehicleId);
  void store.saveRankOrder(group.id, ordered);
}
async function saveRating(entry: RankingEntry, event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  await store.saveRating(entry.vehicleId, value ? Number(value) : null);
}
async function changeEntryState(entry: RankingEntry, event: Event) {
  const state = (event.target as HTMLSelectElement).value as "unranked" | "future";
  try { await store.setEntryState(entry.vehicleId, entry.segmentId, state); }
  catch { /* The store exposes the write error in the page banner. */ }
}
async function toggleAward(entry: RankingEntry, type: RankingAward, event: Event) {
  const awarded = (event.target as HTMLInputElement).checked;
  try { await store.setAward(entry.vehicleId, awardYear.value, type, awarded); }
  catch { /* The store exposes the write error in the page banner. */ }
}
</script>

<style scoped>
.rankings-page { display: grid; gap: 16px; min-width: 0; color: var(--gray-dark-5); }
.page-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
h1 { margin: 0; font: 700 1.65rem/1.2 "Monda", sans-serif; }
.page-description { margin: 5px 0 0; color: var(--gray-light-4); font-size: .9rem; }
.year-picker, .rankings-toolbar > label { display: grid; gap: 5px; color: var(--gray-dark-3); font-size: .76rem; font-weight: 600; }
.year-picker select, .rankings-toolbar select, .rankings-toolbar input { min-height: 36px; padding: 7px 10px; border: 1px solid var(--color-form-border); border-radius: 6px; background: var(--white); color: var(--gray-dark-5); font: 400 .86rem "Asap", sans-serif; }
.rankings-toolbar { display: flex; align-items: end; flex-wrap: wrap; gap: 10px; }
.rankings-search { flex: 1 1 230px; max-width: 430px; }
.rankings-search input { width: 100%; }
.filter-reset { min-height: 36px; padding: 0 11px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--white); color: var(--gray-dark-3); font: 600 .8rem "Asap", sans-serif; }
.compare-trigger { display: grid; min-height: 36px; justify-items: start; gap: 1px; padding: 4px 10px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--white); color: var(--gray-dark-3); font: 600 .78rem "Asap", sans-serif; cursor: pointer; }
.compare-trigger span { color: var(--gray-light-4); font-size: .66rem; font-weight: 400; }
.compare-trigger:hover { border-color: var(--green-2); }
.filter-reset:disabled { opacity: .5; cursor: default; }
.compare-modal { display: grid; gap: 10px; }
.compare-modal > p { margin: 0; color: var(--gray-light-4); font-size: .82rem; }
.compare-search input { width: 100%; min-height: 38px; padding: 8px 10px; border: 1px solid var(--color-form-border); border-radius: 6px; background: var(--white); color: var(--gray-dark-4); font: .86rem "Asap", sans-serif; }
.compare-options { display: grid; max-height: min(48vh, 420px); grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); gap: 6px; overflow: auto; padding: 2px; }
.compare-option { display: grid; min-height: 45px; grid-template-columns: 18px minmax(0, 1fr); align-content: center; align-items: center; column-gap: 7px; padding: 6px 8px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--white); color: var(--gray-dark-3); font-size: .78rem; cursor: pointer; }
.compare-option:has(input:checked) { border-color: var(--green-2); background: color-mix(in srgb, var(--green-1) 12%, white); }
.compare-option input { grid-row: span 2; }
.compare-option span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.compare-option small { color: var(--gray-light-4); font-size: .65rem; }
.compare-hint, .compare-empty { margin: 0; color: var(--gray-light-4); font-size: .75rem; }
.compare-modal__actions { display: flex; justify-content: flex-end; gap: 8px; }
.compare-apply { min-height: 36px; padding: 0 13px; border: 1px solid var(--green-2); border-radius: 6px; background: var(--green-2); color: var(--white); font: 600 .8rem "Asap", sans-serif; cursor: pointer; }
.compare-apply:disabled { opacity: .5; cursor: default; }
.segment-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 13px; align-items: start; }
.segment-grid--compare { grid-template-columns: repeat(auto-fit, minmax(min(100%, 460px), 1fr)); }
.segment-panel { min-width: 0; overflow: visible; border: 1px solid var(--color-border); border-radius: 8px; background: color-mix(in srgb, var(--white) 94%, transparent); box-shadow: var(--color-surface-shadow); }
.segment-panel__heading { display: flex; align-items: end; justify-content: space-between; gap: 12px; padding: 13px 15px; border-bottom: 1px solid var(--color-border); }
.segment-panel__heading h2 { margin: 3px 0 0; font: 700 1rem/1.2 "Monda", sans-serif; }
.body-style-label { color: var(--green-dark); font-size: .67rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.segment-count { flex: 0 0 auto; color: var(--gray-light-4); font-size: .72rem; }
.ranked-list, .unranked-section ul { display: grid; gap: 5px; margin: 0; padding: 9px; list-style: none; }
.ranked-row { display: grid; grid-template-columns: 22px minmax(220px, 1fr) 116px minmax(0, auto) auto; align-items: center; gap: 8px; min-height: 49px; padding: 6px 8px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--white); transition: border-color .12s ease, box-shadow .12s ease, background-color .12s ease; }
.ranked-row--drop-before { border-top: 3px solid var(--green-2); box-shadow: 0 -3px 0 color-mix(in srgb, var(--green-2) 18%, transparent); }
.ranked-row--drop-after { border-bottom: 3px solid var(--green-2); box-shadow: 0 3px 0 color-mix(in srgb, var(--green-2) 18%, transparent); }
.unranked-row { display: grid; grid-template-columns: 22px minmax(120px, 1fr) 105px auto; align-items: center; gap: 7px; min-height: 45px; padding: 6px 8px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--white); }
.ranked-row[draggable="true"], .unranked-row[draggable="true"] { cursor: grab; }
.ranked-row--dragging { opacity: .5; }
.drag-grip { display: grid; width: 22px; height: 28px; place-items: center; padding: 0; border: 0; border-radius: 4px; background: transparent; color: var(--gray-light-3); font: 700 1rem "Asap", sans-serif; cursor: grab; user-select: none; touch-action: none; }
.drag-grip:hover { background: var(--gray-light-1); color: var(--gray-dark-3); }
.drag-grip:active { cursor: grabbing; }
.rank-number, .rank-position-control input { display: grid; width: 31px; height: 29px; place-items: center; padding: 0; border: 1px solid transparent; border-radius: 6px; background: var(--color-green-soft); color: var(--green-dark); font: 700 .76rem "Monda", sans-serif; text-align: center; }
.rank-position-control input { border-color: var(--color-border); background: var(--white); }
.rank-position-control input:focus { border-color: var(--green-2); outline: 2px solid color-mix(in srgb, var(--green-2) 22%, transparent); }
.ranked-row__vehicle { display: grid; gap: 2px; min-width: 0; }
.vehicle-line { display: grid; min-width: 0; grid-template-columns: 31px minmax(0, 49ch) 76px; align-items: center; gap: 7px; }
.ranked-row__vehicle strong { min-width: 0; overflow: hidden; color: var(--gray-dark-4); font-size: .78rem; text-overflow: ellipsis; white-space: nowrap; }
.ranked-row__vehicle small { color: var(--gray-light-4); font-size: .69rem; }
.rating-control { justify-self: end; width: 76px; }
.rating-control select, .award-editor select { width: 68px; min-height: 30px; padding: 4px 5px; border: 1px solid var(--color-form-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-4); font: 600 .74rem "Asap", sans-serif; }
.entry-state-control select { width: 105px; min-height: 30px; padding: 4px 5px; border: 1px solid var(--color-form-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-4); font: 500 .7rem "Asap", sans-serif; }
.rating-readonly { color: var(--gray-dark-3); font-size: .77rem; font-weight: 700; text-align: center; }
.ranking-awards { display: flex; min-height: 40px; flex-wrap: wrap; align-items: center; gap: 7px; min-width: 116px; }
.ranking-awards > .latest-award { display: grid; grid-template-rows: 23px auto auto; justify-items: center; align-items: center; gap: 0; min-width: 42px; color: var(--gray-light-4); line-height: 1; }
.ranking-awards .latest-award img { width: 23px; height: 23px; object-fit: contain; }
.ranking-awards .latest-award small { margin-top: 2px; color: var(--gray-light-4); font-size: .53rem; }
.ranking-awards .latest-award strong { margin-top: 2px; color: var(--gray-dark-3); font-size: .77rem; font-weight: 700; }
.no-award { color: var(--gray-light-3); font-size: .72rem; }
.award-editor { position: relative; }
.award-editor summary { padding: 5px 7px; border: 1px solid var(--color-border); border-radius: 5px; color: var(--gray-dark-3); font-size: .67rem; cursor: pointer; list-style: none; }
.award-editor summary::-webkit-details-marker { display: none; }
.award-editor__panel { position: absolute; z-index: 8; top: calc(100% + 5px); right: 0; display: grid; gap: 9px; width: min(320px, calc(100vw - 30px)); max-height: min(70vh, 520px); overflow: auto; padding: 12px; border: 1px solid var(--color-border); border-radius: 7px; background: var(--white); box-shadow: 0 8px 24px rgb(28 35 28 / 16%); }
.award-editor__panel label { display: flex; align-items: center; gap: 6px; color: var(--gray-dark-3); font-size: .72rem; }
.award-editor__panel > label:first-of-type { display: grid; gap: 5px; }
.award-editor__panel > label:first-of-type select { width: 100%; }
.award-history-row { display: grid; grid-template-columns: 22px 94px minmax(0, 1fr); align-items: start; gap: 7px; color: var(--gray-dark-3); font-size: .74rem; }
.award-history-row img { width: 20px; height: 20px; object-fit: contain; }
.award-history-row strong { padding-top: 2px; }
.award-history-row span { padding-top: 2px; color: var(--gray-light-4); line-height: 1.35; overflow-wrap: anywhere; }
.award-editor__divider { height: 1px; background: var(--color-divider); }
.unrank-button { padding: 4px 6px; border: 0; background: transparent; color: var(--gray-light-4); font: 600 .65rem "Asap", sans-serif; cursor: pointer; }
.unrank-button:hover { color: var(--red-dark, #a43c35); }
.rank-entry-button { min-height: 28px; padding: 0 8px; border: 1px solid var(--green-2); border-radius: 5px; background: var(--white); color: var(--green-dark); font: 700 .7rem "Asap", sans-serif; cursor: pointer; }
.rank-entry-button:hover { background: var(--color-green-soft); }
.rank-entry-button:disabled { opacity: .5; cursor: wait; }
.rank-drop-end { padding: 8px; border: 1px dashed var(--color-border); border-radius: 5px; color: var(--gray-light-4); font-size: .72rem; text-align: center; transition: background-color .12s ease, border-color .12s ease; }
.rank-drop-end--active { border: 2px dashed var(--green-2); background: var(--color-green-soft); color: var(--green-dark); font-weight: 700; }
.ranked-empty, .rankings-empty, .rankings-loading { display: grid; justify-items: center; gap: 6px; padding: 20px; color: var(--gray-light-4); font-size: .82rem; text-align: center; }
.rankings-empty strong { color: var(--gray-dark-3); }
.rankings-loading { display: flex; justify-content: center; min-height: 100px; }
.rankings-spinner { width: 17px; height: 17px; border: 2px solid #dce8d8; border-top-color: var(--green-2); border-radius: 50%; animation: spin .75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.unranked-section { margin: 0 9px 9px; border-top: 1px solid var(--color-border); }
.unranked-section summary { padding: 9px 2px 2px; color: var(--gray-light-4); font-size: .73rem; font-weight: 700; cursor: pointer; }
.unranked-section summary span { margin-left: 5px; font-weight: 400; }
.unranked-section ul { padding: 8px 0 0; }
.unranked-row { min-height: 39px; background: #fafbf9; }
.unranked-row .drag-grip { grid-column: 1; }
.unranked-row .ranked-row__vehicle { grid-column: 2; }
.unranked-row .vehicle-line { grid-template-columns: minmax(0, 49ch) 76px; }
.unranked-row .rating-readonly { grid-column: 2; }
.unranked-row .entry-state-control { grid-column: 3; }
.unranked-row .rank-entry-button { grid-column: 4; }
.filter-reset:focus-visible, .award-editor summary:focus-visible, .unrank-button:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }
@media (max-width: 900px) { .page-heading { align-items: flex-start; flex-direction: column; } .ranked-row { grid-template-columns: 22px minmax(170px, 1fr) 100px auto auto; } }
@media (max-width: 600px) { .ranked-row { grid-template-columns: 16px minmax(90px, 1fr) auto; } .ranking-awards { grid-column: 2; grid-row: 2; } .award-editor { grid-column: 3; grid-row: 1; } .unrank-button { grid-column: 3; grid-row: 2; justify-self: end; } .unranked-row { grid-template-columns: 16px minmax(75px, 1fr) auto; } .unranked-row .entry-state-control { grid-column: 3; } .unranked-row .rank-entry-button { grid-column: 2 / 4; justify-self: end; } .segment-panel__heading { align-items: flex-start; flex-direction: column; } }
@media (prefers-reduced-motion: reduce) { .rankings-spinner { animation: none; } }
</style>
