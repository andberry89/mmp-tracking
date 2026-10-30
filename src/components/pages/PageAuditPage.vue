<template>
  <section class="audit-page">
    <header class="page-heading">
      <div>
        <h1>Page Audit</h1>
        <p class="page-description">Review page content and presentation against the model-year checklist.</p>
      </div>
      <div class="heading-actions">
        <label>Model year
          <select v-model.number="selectedYear">
            <option v-for="year in catalog.modelYears" :key="year" :value="year">{{ year }}{{ catalog.modelYearRecords.find((item) => item.year === year)?.isDefault ? ' · Active' : '' }}</option>
          </select>
        </label>
        <button v-if="canEdit" class="primary-button" type="button" @click="openAdd">＋ Add to Audit</button>
      </div>
    </header>

    <div v-if="auditStore.error" class="error-banner" role="alert">{{ auditStore.error }}</div>

    <section class="summary-grid" aria-label="Page Audit summary">
      <article class="summary-card total-card"><span>{{ selectedYear }} vehicles</span><strong>{{ auditStore.entries.length }}</strong></article>
      <article class="summary-card double-check-card"><span>Double-check info</span><strong>{{ doubleCheckCount }}</strong></article>
    </section>

    <section class="list-panel">
      <div class="list-toolbar">
        <div><h2>{{ selectedYear }} Page Audit</h2><p>{{ filteredEntries.length }} of {{ auditStore.entries.length }} vehicles</p></div>
        <div class="filters">
          <label class="search-field"><span class="sr-only">Search audit vehicles</span><input v-model="query" type="search" placeholder="Search make or model" /></label>
          <label><span class="sr-only">Filter by workbook status</span><select v-model="statusFilter"><option value="all">All statuses</option><option v-for="status in workbookStatuses" :key="status" :value="status">{{ status }}</option><option v-if="hasBlankStatus" value="__blank__">No status</option></select></label>
          <button class="clear-filters-button" type="button" :disabled="filtersAreClear" @click="clearFilters">Clear filters</button>
        </div>
      </div>

      <div v-if="auditStore.isLoading" class="loading-state">Loading Page Audit…</div>
      <div v-else-if="!filteredEntries.length" class="empty-state">
        <strong>{{ auditStore.entries.length ? 'No vehicles match these filters.' : 'No Page Audit vehicles are loaded for this year.' }}</strong>
        <span v-if="!auditStore.entries.length && canEdit">Use Add to Audit to start with a vehicle from the shared Catalog.</span>
        <button v-if="!auditStore.entries.length && canEdit" class="primary-button" type="button" @click="openAdd">＋ Add to Audit</button>
      </div>
      <div v-else class="table-scroll">
        <table class="audit-table" :class="{ 'table--editable': canEdit }">
          <thead><tr>
            <th class="vehicle-column">Vehicle / Segment</th><th class="people-column">Author / Auditor</th><th class="checklist-summary-column">Checklist</th><th class="awards-column">Awards</th><th class="status-column">Status</th>
            <th v-for="check in checksForYear(selectedYear)" :key="check.key" class="check-heading"><span>{{ check.label }}</span></th>
            <th class="notes-column">Audit notes</th>
          </tr></thead>
          <tbody>
            <tr v-for="entry in filteredEntries" :key="entry.id">
              <td class="vehicle-cell"><div class="vehicle-cell-content"><div class="vehicle-cell-text"><strong>{{ entry.make }} {{ entry.model }}</strong><span>{{ entry.segment || 'Segment not set' }}</span><a v-if="entry.publicUrl" class="vehicle-public-link" :href="entry.publicUrl" target="_blank" rel="noopener noreferrer">{{ entry.publicUrl }} ↗</a></div><button v-if="canEdit" class="edit-icon-button" type="button" :aria-label="`Edit audit for ${entry.make} ${entry.model}`" :title="`Edit audit for ${entry.make} ${entry.model}`" @click="openEdit(entry)"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13.8 3.2a1.8 1.8 0 0 1 2.5 2.5l-8.9 8.9-3.2.7.7-3.2 8.9-8.9Z"/><path d="m12.6 4.4 3 3"/></svg></button></div></td>
              <td class="people-cell"><strong>{{ entry.authorNames || '—' }}</strong><span>{{ entry.auditorInitials ? `Auditor ${entry.auditorInitials}` : '—' }}</span><span v-if="entry.auditedAt">Audited {{ formatDate(entry.auditedAt) }}</span></td>
              <td class="checklist-summary-cell">
                <strong>{{ checklistCounts(entry).passed }}/{{ checklistCounts(entry).total }} pass</strong>
                <span><i class="summary-dot summary-dot--exception"></i>{{ checklistCounts(entry).exception }} review</span>
                <span><i class="summary-dot summary-dot--attention"></i>{{ checklistCounts(entry).attention }} needs work</span>
              </td>
              <td class="awards-cell"><div class="award-list"><img v-if="entry.awards.tenBest" class="award-icon" :src="tenBestLogo" alt="10 Best" /><img v-if="entry.awards.editorsChoice" class="award-icon" :src="editorsChoiceLogo" alt="Editors’ Choice" /><span v-if="!entry.awards.tenBest && !entry.awards.editorsChoice" class="muted">—</span></div></td>
              <td class="status-cell"><span>{{ entry.pageStatus || '—' }}</span><strong v-if="entry.doubleCheckInfo" class="status-review">Needs Review</strong></td>
              <td v-for="check in checksForYear(selectedYear)" :key="check.key" class="check-cell" :class="`check-cell--${checkResult(check, entry.checklist[check.key])}`">{{ entry.checklist[check.key] || '—' }}</td>
              <td class="audit-notes-cell">{{ entry.auditNotes || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <BaseModal v-model="modalOpen" :title="modalTitle" size="xl" :click-to-close="false" :esc-to-close="false" @close="closeModal">
      <form class="audit-form" @submit.prevent="saveEntry">
        <div v-if="modalMode === 'add'" class="form-section">
          <label class="field-label">Vehicle <span class="required-mark">*</span>
            <select v-model="draftVehicleId" required>
              <option value="">Choose a Make / Model / Year</option>
              <option v-for="vehicle in availableVehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.make }} {{ vehicle.model }} · {{ vehicle.modelYear }}</option>
            </select>
          </label>
        </div>
        <div v-else-if="editingEntry" class="modal-vehicle-heading"><strong>{{ editingEntry.make }} {{ editingEntry.model }}</strong><span>{{ selectedYear }} · {{ editingEntry.segment || 'Segment not set' }}</span></div>

        <div class="form-grid form-grid--meta">
          <label class="field-label">Status
            <input v-model="draft.pageStatus" type="text" list="page-audit-status-options" placeholder="Choose or enter a status" />
            <datalist id="page-audit-status-options"><option v-for="status in workbookStatuses" :key="status" :value="status" /></datalist>
          </label>
          <label class="field-label">Author(s)
            <input v-model="draft.authorNames" type="text" placeholder="Author name(s)" />
          </label>
          <label class="field-label">Auditor initials
            <input v-model="draft.auditorInitials" type="text" placeholder="Initials" />
          </label>
          <label class="field-label">Audit date
            <input v-model="draft.auditedAt" type="date" />
          </label>
        </div>

        <label class="double-check-control">
          <input v-model="draft.doubleCheckInfo" type="checkbox" />
          <span><strong>Double-check info later</strong><small>Use when the page was published before official information was available.</small></span>
        </label>

        <section class="awards-form-section" aria-label="Awards">
          <div class="section-heading"><h3>Awards</h3><span>Tracked separately from checklist scoring.</span></div>
          <div class="award-options">
            <label><input v-model="draft.awards.tenBest" type="checkbox" /> 10 Best</label>
            <label><input v-model="draft.awards.editorsChoice" type="checkbox" /> Editors’ Choice</label>
          </div>
        </section>

        <section class="checklist-section">
          <div class="section-heading"><h3>{{ selectedYear }} page checks</h3><span>Keep the source wording and notes in each answer.</span></div>
          <div class="checklist-grid">
            <label v-for="check in checksForYear(selectedYear)" :key="check.key" class="field-label checklist-field">
              {{ check.label }}
              <small v-if="check.guidance" class="field-hint">{{ check.guidance }}</small>
              <input v-model="draft.checklist[check.key]" type="text" :placeholder="check.placeholder || 'Enter result or note'" />
            </label>
          </div>
        </section>

        <label class="field-label">Audit notes
          <textarea v-model="draft.auditNotes" rows="3" placeholder="Additional findings or context"></textarea>
        </label>

      </form>
      <template #footer>
        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeModal">Cancel</button>
          <button type="button" class="primary-button" :disabled="!canSave || auditStore.isSaving" @click="saveEntry">{{ auditStore.isSaving ? 'Saving…' : 'Save audit' }}</button>
        </div>
      </template>
    </BaseModal>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import BaseModal from "@/components/common/BaseModal.vue";
import tenBestLogo from "@/assets/awards/10-best-logo.svg?url";
import editorsChoiceLogo from "@/assets/awards/ec-logo.svg?url";
import { useCatalogStore, type ModelYearVehicleOption } from "@/stores/catalog";
import { usePageAuditStore, type AuditChecklist, type PageAuditEntry, type PageAuditInput } from "@/stores/pageAudit";

withDefaults(defineProps<{ canEdit?: boolean }>(), { canEdit: false });
type CheckField = {
  key: string;
  label: string;
  placeholder?: string;
  guidance?: string;
  criterion: "yes" | "dual" | "actual" | "model_year" | "rating";
};

const checks2026: CheckField[] = [
  { key: "pricing_lead", label: "Pricing under lead image?", placeholder: "Yes / No; note if estimated", guidance: "Yes/No; note if estimated", criterion: "yes" },
  { key: "photos_button", label: "View Photos Button", guidance: "Yes/No", criterion: "yes" },
  { key: "gallery_model_year", label: "Gallery Model Year", placeholder: "Model year or N/A", guidance: "Current model year", criterion: "model_year" },
  { key: "gallery_count", label: "How Many Galleries?", placeholder: "Single / Dual", guidance: "Dual", criterion: "dual" },
  { key: "cd_rating", label: "C/D Rating?", placeholder: "Rating from 0 to 10", guidance: "Any number from 0 to 10, inclusive", criterion: "rating" },
  { key: "hlv", label: "H/L/V", guidance: "Yes/No", criterion: "yes" },
  { key: "specs_glance", label: "Specs At a Glance box visible?", guidance: "Yes/No", criterion: "yes" },
  { key: "video", label: "Video", guidance: "Yes/No", criterion: "yes" },
  { key: "competitor_picture", label: "Competitor module - correct picture", guidance: "Yes/No/N/A", criterion: "yes" },
  { key: "pricing_module", label: "Pricing module displayed?", guidance: "Yes/No", criterion: "yes" },
  { key: "price_type", label: "Estimated price or actual price?", guidance: "Actual", criterion: "actual" },
  { key: "recommended_trim", label: "Recommended trim icon?", guidance: "Yes/No", criterion: "yes" },
  { key: "zero_to_sixty", label: "Includes 0-60 Times?", guidance: "Yes/No", criterion: "yes" },
  { key: "zero_to_sixty_photo", label: "Exterior photo under 0-60 times?", guidance: "Yes/No", criterion: "yes" },
  { key: "research_module", label: "More on the Make/Model module displayed?", guidance: "Yes/No", criterion: "yes" },
  { key: "range_test", label: "C/D Range Test included?", guidance: "Yes/No/N/A", criterion: "yes" },
  { key: "epa_estimates", label: "Includes EPA estimates for subject model year?", guidance: "Yes/No", criterion: "yes" },
  { key: "hfe_numbers", label: "Includes HFE Numbers?", guidance: "Yes/No", criterion: "yes" },
  { key: "carry_on_figures", label: "Interior Section includes carry-on figures", guidance: "Yes/No", criterion: "yes" },
  { key: "interior_photo", label: "Interior photo under interior section?", guidance: "Yes/No", criterion: "yes" },
  { key: "spec_panel", label: "Spec Panel", guidance: "Yes/No/N/A", criterion: "yes" },
  { key: "features_specs_button", label: "More Features and Specs button?", guidance: "Yes/No", criterion: "yes" },
];

const checks2027: CheckField[] = [
  checks2026[0], checks2026[1], checks2026[2], checks2026[3], checks2026[4],
  { key: "hlv", label: "H/L/V", guidance: "Yes/No", criterion: "yes" },
  { key: "specs_glance", label: "Specs at a Glance?", guidance: "Yes/No", criterion: "yes" },
  { key: "video", label: "Video", guidance: "Yes/No", criterion: "yes" },
  { key: "competitor_picture", label: "Competitor module - correct picture", guidance: "Yes/No/N/A", criterion: "yes" },
  { key: "pricing_module", label: "Pricing module displayed?", guidance: "Yes/No", criterion: "yes" },
  { key: "price_type", label: "Estimated price or actual price?", guidance: "Actual", criterion: "actual" },
  { key: "recommended_trim", label: "Recommended trim icon?", guidance: "Yes/No", criterion: "yes" },
  { key: "key_features", label: "Key Features", guidance: "Yes/No", criterion: "yes" },
  { key: "zero_to_sixty", label: "Includes 0-60 Times?", guidance: "Yes/No", criterion: "yes" },
  { key: "zero_to_sixty_photo", label: "Exterior photo under 0-60 times?", guidance: "Yes/No", criterion: "yes" },
  { key: "research_module", label: "Additional Research module displayed?", guidance: "Yes/No", criterion: "yes" },
  { key: "range_test", label: "C/D Range Test included?", guidance: "Yes/No/N/A", criterion: "yes" },
  { key: "epa_estimates", label: "Includes EPA estimates for subject model year?", guidance: "Yes/No", criterion: "yes" },
  { key: "hfe_numbers", label: "Includes HFE numbers?", guidance: "Yes/No", criterion: "yes" },
  { key: "carry_on_figures", label: "Interior Section includes carry-on figures", guidance: "Yes/No", criterion: "yes" },
  { key: "interior_photo", label: "Interior photo under interior section?", guidance: "Yes/No", criterion: "yes" },
  { key: "spec_panel", label: "Spec Panel", guidance: "Yes/No/N/A", criterion: "yes" },
  { key: "features_specs_button", label: "More Features and Specs button?", guidance: "Yes/No", criterion: "yes" },
];

const catalog = useCatalogStore();
const auditStore = usePageAuditStore();
const query = ref("");
const statusFilter = ref("all");
const selectedYear = ref(catalog.modelYearRecords.find((year) => year.isDefault)?.year ?? catalog.modelYears[0] ?? 2027);
const modalOpen = ref(false);
const modalMode = ref<"add" | "edit">("add");
const editingEntry = ref<PageAuditEntry | null>(null);
const draftVehicleId = ref("");
const draft = reactive({
  pageStatus: "",
  checklist: {} as AuditChecklist,
  awards: { tenBest: false, editorsChoice: false },
  authorNames: "",
  auditorInitials: "",
  auditedAt: "",
  doubleCheckInfo: false,
  auditNotes: "",
});
const modalTitle = computed(() => modalMode.value === "add" ? "Add Vehicle to Page Audit" : "Edit Page Audit");
const queryValue = computed(() => query.value.trim().toLowerCase());
const filtersAreClear = computed(() => !queryValue.value && statusFilter.value === "all");
const doubleCheckCount = computed(() => auditStore.entries.filter((entry) => entry.doubleCheckInfo).length);
const workbookStatuses = computed(() => [...new Set(auditStore.entries.map((entry) => entry.pageStatus.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)));
const hasBlankStatus = computed(() => auditStore.entries.some((entry) => !entry.pageStatus.trim()));
const filteredEntries = computed(() => auditStore.entries.filter((entry) => {
  const matchesQuery = !queryValue.value || `${entry.make} ${entry.model} ${entry.segment} ${entry.pageStatus}`.toLowerCase().includes(queryValue.value);
  const matchesStatus = statusFilter.value === "all"
    || (statusFilter.value === "__blank__" ? !entry.pageStatus.trim() : entry.pageStatus.trim() === statusFilter.value);
  return matchesQuery && matchesStatus;
}).sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model)));
const availableVehicles = computed(() => catalog.modelYearVehicles
  .filter((vehicle) => vehicle.modelYear === selectedYear.value && !auditStore.entries.some((entry) => entry.modelYearVehicleId === vehicle.id))
  .sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model)));
const activeModalVehicle = computed(() => modalMode.value === "edit"
  ? catalog.modelYearVehicles.find((vehicle) => vehicle.id === editingEntry.value?.modelYearVehicleId) ?? null
  : availableVehicles.value.find((vehicle) => vehicle.id === draftVehicleId.value) ?? null);
const canSave = computed(() => modalMode.value === "edit" || Boolean(draftVehicleId.value));

onMounted(() => {
  if (!catalog.modelYearRecords.length) void catalog.loadCatalog();
  void auditStore.load(selectedYear.value);
  auditStore.subscribeToChanges();
});
onBeforeUnmount(() => auditStore.stopRealtime());
watch(selectedYear, (year) => { query.value = ""; statusFilter.value = "all"; void auditStore.load(year); });
watch(() => catalog.modelYears, (years) => {
  if (!years.includes(selectedYear.value) && years.length) selectedYear.value = years.includes(2027) ? 2027 : years[0];
});

function checksForYear(year: number): CheckField[] { return year === 2026 ? checks2026 : checks2027; }
function checkResult(check: CheckField, value: string | undefined): "passed" | "exception" | "attention" {
  const answer = value?.trim() ?? "";
  if (!answer) return "attention";
  if (/\bn\s*\/\s*a\b/i.test(answer)) return "exception";
  if (check.criterion === "model_year") {
    const answerYear = answer.match(/(?:19|20|21)\d{2}/)?.[0];
    return answerYear === String(selectedYear.value) ? "passed" : "exception";
  }
  if (check.criterion === "rating") {
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(answer)) return "attention";
    const rating = Number(answer);
    return rating >= 0 && rating <= 10 ? "passed" : "attention";
  }
  const expected = { yes: "yes", dual: "dual", actual: "actual" }[check.criterion];
  return answer.toLowerCase() === expected ? "passed" : "attention";
}
function checklistCounts(entry: PageAuditEntry) {
  return checksForYear(selectedYear.value).reduce((counts, check) => {
    counts[checkResult(check, entry.checklist[check.key])] += 1;
    return counts;
  }, { passed: 0, exception: 0, attention: 0, total: checksForYear(selectedYear.value).length });
}
function clearFilters() { query.value = ""; statusFilter.value = "all"; }
function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
function openAdd() {
  modalMode.value = "add";
  editingEntry.value = null;
  draftVehicleId.value = availableVehicles.value[0]?.id ?? "";
  resetDraft();
  modalOpen.value = true;
}
function openEdit(entry: PageAuditEntry) {
  modalMode.value = "edit";
  editingEntry.value = entry;
  draftVehicleId.value = entry.modelYearVehicleId;
  Object.assign(draft, {
    pageStatus: entry.pageStatus,
    checklist: { ...entry.checklist },
    awards: { ...entry.awards },
    authorNames: entry.authorNames,
    auditorInitials: entry.auditorInitials,
    auditedAt: entry.auditedAt,
    doubleCheckInfo: entry.doubleCheckInfo,
    auditNotes: entry.auditNotes,
  });
  modalOpen.value = true;
}
function resetDraft() {
  Object.assign(draft, { pageStatus: "", checklist: {}, awards: { tenBest: false, editorsChoice: false }, authorNames: "", auditorInitials: "", auditedAt: "", doubleCheckInfo: false, auditNotes: "" });
}
function closeModal() { modalOpen.value = false; }
async function saveEntry() {
  const vehicle = activeModalVehicle.value;
  if (!vehicle) return;
  const input: PageAuditInput = { vehicle, ...draft, checklist: { ...draft.checklist } };
  try {
    await auditStore.save(input, editingEntry.value ?? undefined);
    closeModal();
  } catch { /* The store keeps the save error visible above the list. */ }
}
</script>

<style scoped>
.audit-page { display: grid; gap: 20px; color: var(--gray-dark-5); }
.page-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
h1 { margin: 0; font: 700 1.65rem/1.2 "Monda", sans-serif; }
.page-description { margin: 5px 0 0; color: var(--gray-light-4); font-size: .9rem; }
.heading-actions, .filters { display: flex; align-items: end; gap: 10px; }
.heading-actions label, .filters label { display: grid; gap: 5px; color: var(--gray-dark-3); font-size: .76rem; font-weight: 600; }
select, input, textarea { min-height: 36px; padding: 7px 10px; border: 1px solid var(--color-form-border); border-radius: 6px; background: var(--white); color: var(--gray-dark-5); font: 400 .86rem "Asap", sans-serif; }
.primary-button, .secondary-button { min-height: 36px; padding: 0 13px; border: 1px solid transparent; border-radius: 5px; font: 600 .84rem "Asap", sans-serif; cursor: pointer; white-space: nowrap; }
.primary-button { background: var(--green-2); color: var(--white); }
.primary-button:hover:not(:disabled) { background: var(--green-dark); }
.primary-button:disabled { opacity: .55; cursor: default; }
.secondary-button { border-color: var(--color-border); background: var(--white); color: var(--gray-dark-3); }
.summary-grid { display: grid; grid-template-columns: repeat(2, minmax(150px, 220px)); gap: 10px; }
.summary-card { display: grid; align-content: start; gap: 5px; min-height: 82px; padding: 13px 14px; border: 1px solid var(--color-border); border-top: 3px solid #bbc2c4; border-radius: 8px; background: color-mix(in srgb, var(--white) 92%, transparent); }
.summary-card span { color: var(--gray-light-4); font-size: .75rem; font-weight: 600; }
.summary-card strong { font: 700 1.35rem/1.1 "Monda", sans-serif; }
.total-card { border-top-color: var(--orange); }
.double-check-card { border-top-color: #eab02f; }
.list-panel { overflow: hidden; border: 1px solid var(--color-border); border-radius: 8px; background: color-mix(in srgb, var(--white) 94%, transparent); }
.list-toolbar { display: flex; justify-content: space-between; align-items: end; gap: 16px; padding: 16px 17px; border-bottom: 1px solid var(--color-border); }
.list-toolbar h2 { margin: 0; font: 700 1rem "Monda", sans-serif; }
.list-toolbar p { margin: 3px 0 0; color: var(--gray-light-4); font-size: .76rem; }
.search-field input { width: 190px; }
.clear-filters-button { min-height: 36px; padding: 0 10px; border: 1px solid var(--color-form-border); border-radius: 6px; background: var(--white); color: var(--gray-dark-3); font: 600 .8rem "Asap", sans-serif; cursor: pointer; white-space: nowrap; }
.clear-filters-button:hover:not(:disabled) { border-color: var(--green-2); color: var(--green-dark); }
.clear-filters-button:disabled { opacity: .5; cursor: default; }
.table-scroll { max-height: min(72vh, 780px); overflow: auto; overscroll-behavior: contain; }
.audit-table { width: max-content; min-width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed; text-align: left; font-size: .8rem; }
.audit-table th { position: sticky; z-index: 2; top: 0; padding: 11px 7px; border-bottom: 1px solid var(--color-border); background: #f7f8f6; color: var(--gray-light-4); font-size: .7rem; font-weight: 700; line-height: 1.25; vertical-align: bottom; white-space: normal; overflow-wrap: anywhere; }
.audit-table td { padding: 9px 7px; border-bottom: 1px solid var(--color-border); vertical-align: top; }
.audit-table tbody tr:nth-child(even) td { background: color-mix(in srgb, var(--white) 80%, #f4f6f3); }
.audit-table .vehicle-column { position: sticky; z-index: 3; left: 0; width: 330px; min-width: 330px; box-shadow: 5px 0 8px -8px rgb(30 40 32 / 35%); }
.audit-table td.vehicle-cell { position: sticky; z-index: 1; left: 0; width: 330px; min-width: 330px; background: var(--white); box-shadow: 5px 0 8px -8px rgb(30 40 32 / 35%); }
.audit-table tbody tr:nth-child(even) td.vehicle-cell { background: #f7f8f6; }
.audit-table .people-column, .audit-table td.people-cell { width: 130px; min-width: 130px; }
.audit-table .checklist-summary-column, .audit-table td.checklist-summary-cell { width: 115px; min-width: 115px; }
.audit-table .awards-column, .audit-table td.awards-cell { width: 90px; min-width: 90px; }
.audit-table .status-column, .audit-table td.status-cell { width: 115px; min-width: 115px; }
.audit-table .check-heading, .audit-table .check-cell { width: 90px; min-width: 90px; }
.audit-table .notes-column, .audit-table td.audit-notes-cell { width: 190px; min-width: 190px; }
.audit-table .check-heading { white-space: normal; }
.check-heading span, .check-heading small { display: block; }
.audit-table td.check-cell, .audit-table td.audit-notes-cell, .audit-table td.status-cell { overflow-wrap: anywhere; white-space: pre-wrap; }
.audit-table td.check-cell { font-size: .75rem; }
.audit-table tbody tr td.check-cell--passed { background: #e5f1e2; box-shadow: inset 3px 0 #78aa6b; color: #345e2d; }
.audit-table tbody tr td.check-cell--exception { background: #fff1d2; box-shadow: inset 3px 0 #e0b04b; color: #74530b; }
.audit-table tbody tr td.check-cell--attention { background: #f8e3e1; box-shadow: inset 3px 0 #c9483f; color: #7d302b; }
.vehicle-cell-content { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.vehicle-cell-text { min-width: 0; }
.vehicle-cell strong, .vehicle-cell span, .people-cell strong, .people-cell span { display: block; }
.vehicle-cell span, .people-cell span { margin-top: 4px; color: var(--gray-light-4); font-size: .72rem; }
.status-cell { color: var(--gray-dark-3); font-size: .74rem; font-weight: 600; }
.checklist-summary-cell { color: var(--gray-dark-3); font-size: .71rem; }
.checklist-summary-cell > strong { display: block; margin-bottom: 5px; color: #345e2d; font-weight: 700; }
.checklist-summary-cell > span { display: block; margin-top: 3px; white-space: nowrap; }
.award-list { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
.award-icon { display: block; width: 27px; height: 27px; object-fit: contain; }
.awards-form-section { display: grid; gap: 10px; }
.award-options { display: flex; flex-wrap: wrap; gap: 16px; }
.award-options label { display: inline-flex; align-items: center; gap: 7px; color: var(--gray-dark-3); font-size: .8rem; }
.summary-dot { display: inline-block; width: 7px; height: 7px; margin-right: 5px; border-radius: 50%; }
.summary-dot--exception { background: #e0b04b; }
.summary-dot--attention { background: #c9483f; }
.status-review { display: block; margin-top: 4px; color: #94620a; font-size: .68rem; font-weight: 700; }
.vehicle-public-link { display: block; max-width: 100%; margin-top: 4px; color: var(--blue-3, #277da1); font-size: .65rem; line-height: 1.25; overflow-wrap: anywhere; text-decoration: none; }
.vehicle-public-link:hover { text-decoration: underline; }
.muted { color: var(--gray-light-4); }
.edit-icon-button { display: grid; flex: 0 0 27px; width: 27px; height: 27px; place-items: center; padding: 5px; border: 1px solid var(--color-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-3); cursor: pointer; }
.edit-icon-button svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
.edit-icon-button:hover, .edit-icon-button:focus-visible { border-color: var(--green-2); color: var(--green-dark-2); }
.loading-state, .empty-state { display: grid; justify-items: center; gap: 8px; padding: 44px 20px; color: var(--gray-light-4); text-align: center; }
.empty-state strong { color: var(--gray-dark-3); font: 700 1rem "Monda", sans-serif; }
.error-banner { padding: 10px 12px; border: 1px solid #f1c2bf; border-radius: 6px; background: #fff0ef; color: #8c332c; font-size: .85rem; }
.audit-form { display: grid; gap: 18px; }
.form-grid { display: grid; gap: 12px; }
.form-grid--meta { grid-template-columns: repeat(4, minmax(130px, 1fr)); }
.field-label { display: grid; min-width: 0; gap: 6px; color: var(--gray-dark-3); font-size: .76rem; font-weight: 600; }
.field-label input, .field-label select, .field-label textarea { width: 100%; }
.field-label textarea { min-height: 76px; resize: vertical; }
.field-hint { color: var(--gray-light-4); font-size: .72rem; font-weight: 400; }
.required-mark { color: #c9483f; }
.modal-vehicle-heading { display: grid; gap: 3px; padding-bottom: 12px; border-bottom: 1px solid var(--color-divider); }
.modal-vehicle-heading strong { font: 700 1rem "Monda", sans-serif; }
.modal-vehicle-heading span { color: var(--gray-light-4); font-size: .78rem; }
.double-check-control { display: flex; align-items: flex-start; gap: 10px; padding: 12px; border: 1px solid #ead6a7; border-radius: 7px; background: #fff9eb; cursor: pointer; }
.double-check-control input { width: 16px; min-height: 16px; margin: 2px 0 0; accent-color: var(--orange); }
.double-check-control span { display: grid; gap: 3px; }
.double-check-control strong { color: var(--gray-dark-3); font-size: .82rem; }
.double-check-control small { color: var(--gray-light-4); font-size: .75rem; }
.checklist-section { display: grid; gap: 12px; }
.section-heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 5px 14px; }
.section-heading h3 { margin: 0; font: 700 .98rem "Monda", sans-serif; }
.section-heading span { color: var(--gray-light-4); font-size: .75rem; }
.checklist-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.shared-link-note { display: grid; gap: 4px; color: var(--gray-light-4); font-size: .75rem; overflow-wrap: anywhere; }
.shared-link-note a { color: var(--blue-3, #277da1); }
.modal-actions { display: flex; justify-content: flex-end; gap: 9px; }
@media (max-width: 1100px) { .list-toolbar { align-items: flex-start; flex-direction: column; } .filters { flex-wrap: wrap; } .form-grid--meta { grid-template-columns: repeat(3, minmax(120px, 1fr)); } .checklist-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 700px) { .page-heading { align-items: flex-start; flex-direction: column; } .heading-actions { width: 100%; } .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .form-grid--meta, .checklist-grid { grid-template-columns: 1fr; } }
</style>
