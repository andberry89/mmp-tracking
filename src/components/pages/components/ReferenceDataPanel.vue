<template>
  <section class="reference-panel" :aria-labelledby="`catalog-${kind}-title`">
    <header class="catalog-heading">
      <div class="catalog-heading__title">
        <h1 :id="`catalog-${kind}-title`">{{ title }}<span class="record-count">{{ filteredCount }} of {{ totalRecords }}</span></h1>
        <p>{{ description }}</p>
      </div>
      <div class="catalog-tools">
        <label class="search-field">
          <span class="sr-only">Search {{ title.toLowerCase() }}</span>
          <input v-model="searchQuery" type="search" :placeholder="`Search ${title.toLowerCase()}…`" />
        </label>
        <label class="filter-field">
          <span class="sr-only">Filter by status</span>
          <select v-model="statusFilter">
            <option value="active">Active</option>
            <option value="all">All statuses</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <button v-if="canEdit" type="button" class="button button--primary add-button" @click="openAddForm">
          <span aria-hidden="true">+</span> Add {{ singularTitle }}
        </button>
      </div>
    </header>

    <p v-if="visibleError" class="message message--error" role="alert">{{ visibleError }}</p>
    <p v-else-if="isLoading" class="message">Loading catalog…</p>

    <form v-if="canEdit && formOpen" class="editor-form" @submit.prevent="saveRecord">
      <div class="editor-form__heading">
        <h2>{{ editingId ? `Edit ${singularTitle}` : `Add ${singularTitle}` }}</h2>
        <button type="button" class="icon-button" aria-label="Close form" @click="closeForm">×</button>
      </div>
      <div class="editor-form__fields">
        <template v-if="kind === 'author'">
          <label>First name<input v-model.trim="firstName" required autocomplete="given-name" /></label>
          <label>Last name<input v-model.trim="lastName" required autocomplete="family-name" /></label>
          <label>Team<select v-model="team"><option value="bg">Buyer’s Guide (BG)</option><option value="cd">Car and Driver (C/D)</option><option value="freelance">Freelancers (FL)</option></select></label>
        </template>
        <template v-else-if="kind === 'model'">
          <label>Make<select v-model="makeId" required><option disabled value="">Select a make</option><option v-for="make in modelMakeOptions" :key="make.id" :value="make.id">{{ make.name }}{{ make.active ? '' : ' (Archived)' }}</option></select></label>
          <label>Model<input v-model.trim="name" required placeholder="Model name" /></label>
        </template>
        <label v-else>{{ kind === 'make' ? 'Make' : 'Segment' }} name<input v-model.trim="name" required :placeholder="`Enter ${title.toLowerCase()} name`" /></label>
      </div>
      <div class="form-actions">
        <button type="button" class="button button--quiet" @click="closeForm">Cancel</button>
        <button type="submit" class="button button--primary" :disabled="saving">{{ saving ? 'Saving…' : editingId ? 'Save changes' : `Add ${singularTitle}` }}</button>
      </div>
    </form>

    <div v-if="kind === 'make'" class="record-list">
      <article v-for="item in filteredMakes" :key="item.id" class="record-row">
        <button type="button" class="record-main" @click="selectedMake = item">
          <span class="status-dot" :class="item.active ? 'status-dot--active' : 'status-dot--inactive'" role="img" :aria-label="item.active ? 'Active' : 'Archived'" />
          <strong :class="{ inactive: !item.active }">{{ item.name }}</strong>
          <span class="record-meta">{{ modelsForMake(item.id).length }} models</span>
        </button>
        <div class="row-actions">
          <button v-if="canEdit" class="button button--quiet" @click="editMake(item)">Edit</button>
          <button v-if="canEdit" class="button button--quiet" @click="toggleMake(item)">{{ item.active ? 'Archive' : 'Restore' }}</button>
        </div>
      </article>
      <p v-if="!filteredMakes.length && !isLoading" class="empty-state">{{ emptyMessage }}</p>
    </div>

    <template v-else-if="kind === 'model'">
      <details v-if="canEdit" class="model-admin">
        <summary>Model-year settings <span>Manage available years and Segment assignments</span></summary>
        <div class="model-admin__content">
          <section class="model-year-section">
            <div class="model-year-heading">
              <div><h2>Available model years</h2><p>Years available when creating an MMP task.</p></div>
              <form class="year-form" @submit.prevent="saveYear">
                <input v-model.number="newYear" aria-label="New model year" type="number" min="1900" max="2200" placeholder="2027" required />
                <button class="button button--primary" :disabled="savingYear">{{ savingYear ? 'Adding…' : 'Add year' }}</button>
              </form>
            </div>
            <div class="year-list"><span v-for="year in catalogStore.modelYearRecords" :key="year.year" class="year-chip">{{ year.year }} <small>{{ year.isDefault ? 'Current' : year.state }}</small></span><span v-if="!catalogStore.modelYearRecords.length" class="empty-state">No model years yet.</span></div>
          </section>

          <section class="model-year-section">
            <div class="model-year-heading"><div><h2>Add a vehicle year</h2><p>Set the Segment for a Make, Model, and Model Year combination.</p></div></div>
            <form class="editor-form vehicle-year-form" @submit.prevent="saveVehicleYear">
              <label>Make<select v-model="vehicleMakeId" required @change="vehicleModelId = ''"><option disabled value="">Select a make</option><option v-for="make in vehicleMakeOptions" :key="make.id" :value="make.id">{{ make.name }}{{ make.active ? '' : ' (Archived)' }}</option></select></label>
              <label>Model<select v-model="vehicleModelId" required :disabled="!vehicleMakeId"><option disabled value="">Select a model</option><option v-for="model in modelsForVehicleMake" :key="model.id" :value="model.id">{{ model.name }}{{ model.active ? '' : ' (Archived)' }}</option></select></label>
              <label>Model Year<select v-model.number="vehicleYear" required><option disabled :value="null">Select a year</option><option v-for="year in catalogStore.modelYears" :key="year" :value="year">{{ year }}</option></select></label>
              <label>Segment<select v-model="vehicleSegmentId"><option value="">No segment selected</option><option v-for="segment in vehicleSegmentOptions" :key="segment.id" :value="segment.id">{{ segment.name }}{{ segment.active ? '' : ' (Archived)' }}</option></select></label>
              <div class="form-actions"><button type="submit" class="button button--primary" :disabled="savingVehicleYear || !catalogStore.modelYears.length">{{ savingVehicleYear ? 'Saving…' : 'Add vehicle year' }}</button></div>
            </form>
          </section>
        </div>
      </details>

      <div class="record-list">
        <article v-for="item in filteredModels" :key="item.id" class="record-row">
          <button type="button" class="record-main" @click="selectedModel = item">
            <span class="status-dot" :class="item.active ? 'status-dot--active' : 'status-dot--inactive'" role="img" :aria-label="item.active ? 'Active' : 'Archived'" />
            <strong :class="{ inactive: !item.active }">{{ item.name }} <span class="make-context">({{ item.make }})</span></strong>
            <span class="record-meta">{{ vehicleYearsForModel(item.id).length }} model years</span>
          </button>
          <div class="row-actions">
            <button v-if="canEdit" class="button button--quiet" @click="editModel(item)">Edit</button>
            <button v-if="canEdit" class="button button--quiet" @click="toggleModel(item)">{{ item.active ? 'Archive' : 'Restore' }}</button>
          </div>
        </article>
        <p v-if="!filteredModels.length && !isLoading" class="empty-state">{{ emptyMessage }}</p>
      </div>
    </template>

    <div v-else-if="kind === 'segment'" class="record-list">
      <article v-for="item in filteredSegments" :key="item.id" class="record-row">
        <button type="button" class="record-main" @click="selectedSegment = item">
          <span class="status-dot" :class="item.active ? 'status-dot--active' : 'status-dot--inactive'" role="img" :aria-label="item.active ? 'Active' : 'Archived'" />
          <strong :class="{ inactive: !item.active }">{{ item.name }}</strong>
          <span class="record-meta">{{ vehiclesForSegment(item.id).length }} vehicle years</span>
        </button>
        <div class="row-actions">
          <button v-if="canEdit" class="button button--quiet" @click="editSegment(item)">Edit</button>
          <button v-if="canEdit" class="button button--quiet" @click="toggleSegment(item)">{{ item.active ? 'Archive' : 'Restore' }}</button>
        </div>
      </article>
      <p v-if="!filteredSegments.length && !isLoading" class="empty-state">{{ emptyMessage }}</p>
    </div>

    <div v-else class="author-columns">
      <section v-for="group in authorGroups" :key="group.slug" class="author-team" :class="`author-team--${group.slug}`">
        <header class="author-team__heading"><span class="team-mark" aria-hidden="true">{{ group.short }}</span><h2>{{ group.label }}</h2><span class="record-count">{{ group.members.length }}</span></header>
        <article v-for="author in group.members" :key="author.id" class="record-row author-row">
          <div class="author-name"><span class="status-dot" :class="author.active ? 'status-dot--active' : 'status-dot--inactive'" role="img" :aria-label="author.active ? 'Active' : 'Archived'" /><strong :class="{ inactive: !author.active }">{{ author.label }}</strong></div>
          <div class="row-actions">
            <button v-if="canEdit" class="button button--quiet" @click="editAuthor(author)">Edit</button>
            <button v-if="canEdit" class="button button--quiet" @click="toggleAuthor(author)">{{ author.active ? 'Archive' : 'Restore' }}</button>
          </div>
        </article>
        <p v-if="!group.members.length" class="empty-state">No matching authors.</p>
      </section>
    </div>

    <Transition name="detail" :duration="320">
      <div v-if="detailOpen" class="detail-backdrop" @click.self="closeDetails" @keydown.esc="closeDetails">
      <aside class="detail-panel" role="dialog" aria-modal="true" :aria-labelledby="'catalog-detail-title'">
        <header class="detail-panel__header">
          <div>
            <p class="detail-kicker">{{ detailType }}</p>
            <h2 id="catalog-detail-title">{{ detailTitle }}</h2>
            <span v-if="detailActive !== null" class="detail-state"><span class="status-dot" :class="detailActive ? 'status-dot--active' : 'status-dot--inactive'" />{{ detailActive ? 'Active' : 'Archived' }}</span>
          </div>
          <button type="button" class="icon-button" aria-label="Close details" @click="closeDetails">×</button>
        </header>

        <div v-if="selectedMake" class="detail-content">
          <h3>Models</h3>
          <button v-for="model in modelsForMake(selectedMake.id)" :key="model.id" type="button" class="detail-record" @click="selectedMake = null; selectedModel = model">
            <span><strong>{{ model.name }}</strong><small>{{ vehicleYearsForModel(model.id).length }} model years</small></span><span aria-hidden="true">›</span>
          </button>
          <p v-if="!modelsForMake(selectedMake.id).length" class="empty-state">No models are associated with this make yet.</p>
        </div>

        <div v-else-if="selectedModel" class="detail-content">
          <h3>Model years and Segments</h3>
          <article v-for="vehicle in vehicleYearsForModel(selectedModel.id)" :key="vehicle.id" class="detail-year-row">
            <div><strong>{{ vehicle.modelYear }}</strong><span>{{ vehicle.segment || 'No Segment assigned' }}</span></div>
            <button v-if="canEdit" type="button" class="button button--quiet" @click="startSegmentEdit(vehicle)">{{ editingVehicleYearId === vehicle.id ? 'Editing' : 'Edit Segment' }}</button>
            <form v-if="canEdit && editingVehicleYearId === vehicle.id" class="detail-edit-form" @submit.prevent="saveVehicleYear">
              <label>Segment<select v-model="vehicleSegmentId"><option value="">No segment selected</option><option v-for="segment in vehicleSegmentOptions" :key="segment.id" :value="segment.id">{{ segment.name }}{{ segment.active ? '' : ' (Archived)' }}</option></select></label>
              <div class="form-actions"><button type="button" class="button button--quiet" @click="editingVehicleYearId = null">Cancel</button><button type="submit" class="button button--primary" :disabled="savingVehicleYear">Save Segment</button></div>
            </form>
          </article>
          <p v-if="!vehicleYearsForModel(selectedModel.id).length" class="empty-state">No model years have been assigned yet.</p>
        </div>

        <div v-else-if="selectedSegment" class="detail-content">
          <h3>Vehicle years using this Segment</h3>
          <button v-for="vehicle in vehiclesForSegment(selectedSegment.id)" :key="vehicle.id" type="button" class="detail-record" @click="openVehicleModel(vehicle.modelId)">
            <span><strong>{{ vehicle.model }} <small>({{ vehicle.make }})</small></strong><small>{{ vehicle.modelYear }}</small></span><span aria-hidden="true">›</span>
          </button>
          <p v-if="!vehiclesForSegment(selectedSegment.id).length" class="empty-state">No vehicle years are assigned to this Segment yet.</p>
        </div>
      </aside>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useCatalogStore, type MakeOption, type ModelOption, type ModelYearVehicleOption, type SegmentOption } from "@/stores/catalog";
import { useAuthorsStore } from "@/stores/authors";
import type { Author, AuthorTeamSlug } from "@/types";

const props = defineProps<{ kind: "make" | "model" | "segment" | "author"; title: string; description: string; canEdit?: boolean }>();
const catalogStore = useCatalogStore();
const authorsStore = useAuthorsStore();

const name = ref("");
const firstName = ref("");
const lastName = ref("");
const team = ref<AuthorTeamSlug>("bg");
const makeId = ref("");
const vehicleMakeId = ref("");
const vehicleModelId = ref("");
const vehicleYear = ref<number | null>(null);
const vehicleSegmentId = ref("");
const editingId = ref<string | null>(null);
const editingVehicleYearId = ref<string | null>(null);
const saving = ref(false);
const savingYear = ref(false);
const savingVehicleYear = ref(false);
const newYear = ref<number | null>(null);
const pageError = ref("");
const formOpen = ref(false);
const searchQuery = ref("");
const statusFilter = ref<"active" | "all" | "archived">(props.kind === "make" ? "active" : "all");
const selectedMake = ref<MakeOption | null>(null);
const selectedModel = ref<ModelOption | null>(null);
const selectedSegment = ref<SegmentOption | null>(null);

function onWindowKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && detailOpen.value) closeDetails();
}

onMounted(() => window.addEventListener("keydown", onWindowKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onWindowKeydown));

const canEdit = computed(() => props.canEdit ?? false);
const isLoading = computed(() => catalogStore.isLoading);
const singularTitle = computed(() => props.title.replace(/s$/, ""));
const visibleError = computed(() => pageError.value || catalogStore.error || (props.kind === "author" ? authorsStore.error : ""));
const allRecords = computed(() => props.kind === "make" ? catalogStore.makes : props.kind === "model" ? catalogStore.models : props.kind === "segment" ? catalogStore.segments : authorsStore.allAuthors);
const totalRecords = computed(() => allRecords.value.length);
const filteredCount = computed(() => props.kind === "make" ? filteredMakes.value.length : props.kind === "model" ? filteredModels.value.length : props.kind === "segment" ? filteredSegments.value.length : authorsStore.allAuthors.filter((author) => matchesAuthor(author)).length);
const detailOpen = computed(() => Boolean(selectedMake.value || selectedModel.value || selectedSegment.value));
const detailType = computed(() => selectedMake.value ? "Make" : selectedModel.value ? "Model" : "Segment");
const detailTitle = computed(() => selectedMake.value?.name ?? (selectedModel.value ? `${selectedModel.value.name} (${selectedModel.value.make})` : selectedSegment.value?.name ?? ""));
const detailActive = computed(() => selectedMake.value?.active ?? selectedModel.value?.active ?? selectedSegment.value?.active ?? null);

function statusMatches(active: boolean) {
  return statusFilter.value === "all" || (statusFilter.value === "active" ? active : !active);
}
function queryMatches(...values: string[]) {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  return !query || values.some((value) => value.toLocaleLowerCase().includes(query));
}
function matchesAuthor(author: Author) {
  return statusMatches(author.active) && queryMatches(author.label, author.team.label);
}

const filteredMakes = computed(() => catalogStore.makes.filter((item) => statusMatches(item.active) && queryMatches(item.name)));
const filteredModels = computed(() => catalogStore.models.filter((item) => statusMatches(item.active) && queryMatches(item.name, item.make)).sort((a, b) => a.name.localeCompare(b.name) || a.make.localeCompare(b.make)));
const filteredSegments = computed(() => catalogStore.segments.filter((item) => statusMatches(item.active) && queryMatches(item.name)));
const emptyMessage = computed(() => searchQuery.value.trim() ? "No records match your search." : statusFilter.value === "archived" ? "No archived records." : "No active records in the catalog yet.");

const teamDefinitions = [
  { slug: "bg" as const, label: "Buyer’s Guide", short: "BG" },
  { slug: "cd" as const, label: "Car and Driver", short: "C/D" },
  { slug: "freelance" as const, label: "Freelancers", short: "FL" },
];
const authorGroups = computed(() => teamDefinitions.map((definition) => ({
  ...definition,
  members: authorsStore.allAuthors.filter((author) => author.team.slug === definition.slug && matchesAuthor(author)).sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)),
})));

const modelMakeOptions = computed(() => {
  const active = catalogStore.activeMakes;
  const selected = catalogStore.makes.find((item) => item.id === makeId.value);
  return selected && !selected.active ? [selected, ...active] : active;
});
const vehicleMakeOptions = computed(() => {
  const active = catalogStore.activeMakes;
  const selected = catalogStore.makes.find((item) => item.id === vehicleMakeId.value);
  return selected && !selected.active ? [selected, ...active] : active;
});
const modelsForVehicleMake = computed(() => catalogStore.models.filter((item) => item.makeId === vehicleMakeId.value && item.active));
const vehicleSegmentOptions = computed(() => {
  const active = catalogStore.activeSegments;
  const selected = catalogStore.segments.find((item) => item.id === vehicleSegmentId.value);
  return selected && !selected.active ? [selected, ...active] : active;
});

function modelsForMake(makeId: string) {
  return catalogStore.models.filter((model) => model.makeId === makeId).sort((a, b) => a.name.localeCompare(b.name));
}
function vehicleYearsForModel(modelId: string) {
  return catalogStore.modelYearVehicles.filter((item) => item.modelId === modelId).sort((a, b) => b.modelYear - a.modelYear);
}
function vehiclesForSegment(segmentId: string) {
  return catalogStore.modelYearVehicles.filter((item) => item.segmentId === segmentId).sort((a, b) => b.modelYear - a.modelYear || a.make.localeCompare(b.make) || a.model.localeCompare(b.model));
}

function resetForm() {
  editingId.value = null; name.value = ""; firstName.value = ""; lastName.value = ""; team.value = "bg"; makeId.value = ""; pageError.value = "";
}
function openAddForm() { resetForm(); formOpen.value = true; }
function closeForm() { formOpen.value = false; resetForm(); }
function closeDetails() { selectedMake.value = null; selectedModel.value = null; selectedSegment.value = null; editingVehicleYearId.value = null; }
function editMake(item: MakeOption) { editingId.value = item.id; name.value = item.name; formOpen.value = true; }
function editSegment(item: SegmentOption) { editingId.value = item.id; name.value = item.name; formOpen.value = true; }
function editModel(item: ModelOption) { editingId.value = item.id; name.value = item.name; makeId.value = item.makeId; formOpen.value = true; }
function editAuthor(author: Author) { editingId.value = author.id; firstName.value = author.firstName; lastName.value = author.lastName; team.value = author.team.slug; formOpen.value = true; }
function openVehicleModel(modelId: string) { selectedSegment.value = null; selectedModel.value = catalogStore.models.find((item) => item.id === modelId) ?? null; }
function startSegmentEdit(item: ModelYearVehicleOption) { editingVehicleYearId.value = item.id; vehicleModelId.value = item.modelId; vehicleYear.value = item.modelYear; vehicleSegmentId.value = item.segmentId ?? ""; }

async function saveRecord() {
  saving.value = true; pageError.value = "";
  try {
    if (props.kind === "make") await catalogStore.saveMake({ id: editingId.value ?? undefined, name: name.value });
    else if (props.kind === "segment") await catalogStore.saveSegment({ id: editingId.value ?? undefined, name: name.value });
    else if (props.kind === "model") await catalogStore.saveModel({ id: editingId.value ?? undefined, name: name.value, makeId: makeId.value });
    else await authorsStore.saveAuthor({ id: editingId.value ?? undefined, firstName: firstName.value, lastName: lastName.value, team: team.value });
    closeForm();
  } catch (reason) { pageError.value = reason instanceof Error ? reason.message : "Could not save this catalog record."; }
  finally { saving.value = false; }
}
async function toggleMake(item: MakeOption) { await runAction(() => catalogStore.saveMake({ ...item, active: !item.active })); }
async function toggleSegment(item: SegmentOption) { await runAction(() => catalogStore.saveSegment({ ...item, active: !item.active })); }
async function toggleModel(item: ModelOption) { await runAction(() => catalogStore.saveModel({ ...item, active: !item.active })); }
async function toggleAuthor(author: Author) { await runAction(() => authorsStore.setAuthorActive(author, !author.active)); }
async function saveYear() {
  if (newYear.value === null) return;
  savingYear.value = true; pageError.value = "";
  try { await catalogStore.saveModelYear(newYear.value); newYear.value = null; }
  catch (reason) { pageError.value = reason instanceof Error ? reason.message : "Could not add this model year."; }
  finally { savingYear.value = false; }
}
async function saveVehicleYear() {
  if (vehicleYear.value === null) return;
  savingVehicleYear.value = true; pageError.value = "";
  try {
    await catalogStore.saveModelYearVehicle({ id: editingVehicleYearId.value ?? undefined, modelId: vehicleModelId.value, modelYear: vehicleYear.value, segmentId: vehicleSegmentId.value || null });
    editingVehicleYearId.value = null; vehicleMakeId.value = ""; vehicleModelId.value = ""; vehicleYear.value = null; vehicleSegmentId.value = "";
  } catch (reason) { pageError.value = reason instanceof Error ? reason.message : "Could not save this vehicle year."; }
  finally { savingVehicleYear.value = false; }
}
async function runAction(action: () => Promise<void>) {
  pageError.value = "";
  try { await action(); }
  catch (reason) { pageError.value = reason instanceof Error ? reason.message : "Could not update this catalog record."; }
}
</script>

<style scoped>
.reference-panel { max-width: 1200px; padding: 0 0 30px; }
.catalog-heading { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 16px 24px; padding: 0 0 18px; border-bottom: 1px solid var(--color-divider); }
.catalog-heading h1 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 12px; margin: 0 0 5px; color: var(--gray-dark-5); font: 700 1.4rem/1.25 "Monda", sans-serif; }
.catalog-heading p { margin: 0; color: var(--gray-dark-3); font-size: 0.9rem; line-height: 1.45; }
.catalog-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.search-field input, .filter-field select { height: 36px; padding: 0 10px; border: 1px solid var(--color-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-5); font: 400 0.88rem "Asap", sans-serif; }
.search-field input { width: min(240px, 30vw); }
.filter-field select { min-width: 118px; }
.record-count { color: var(--gray-light-4); font: 500 0.76rem "Asap", sans-serif; white-space: nowrap; }
.button { min-height: 34px; padding: 0 10px; border: 1px solid transparent; border-radius: 5px; cursor: pointer; font: 600 0.82rem "Asap", sans-serif; white-space: nowrap; }
.button:disabled { opacity: 0.6; cursor: wait; }
.button--primary { background: var(--green-2); color: var(--white); }
.button--primary:hover { filter: brightness(0.96); }
.button--quiet { background: transparent; color: var(--gray-dark-3); }
.button--quiet:hover { background: var(--gray-light-1); }
.add-button { min-height: 36px; }
.add-button span { margin-right: 3px; font-size: 1.1rem; line-height: 0; }
.editor-form { display: grid; gap: 14px; margin: 16px 0 8px; padding: 16px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--white); box-shadow: 0 5px 18px rgb(25 35 25 / 5%); }
.editor-form__heading, .editor-form__fields, .form-actions, .row-actions, .year-form { display: flex; align-items: center; gap: 8px; }
.editor-form__heading { justify-content: space-between; }
.editor-form__heading h2 { margin: 0; color: var(--gray-dark-5); font: 700 1rem "Monda", sans-serif; }
.editor-form__fields { align-items: end; flex-wrap: wrap; }
.editor-form label, .detail-edit-form label { display: grid; flex: 1 1 180px; gap: 6px; color: var(--gray-dark-4); font-size: 0.8rem; font-weight: 600; }
.editor-form input, .editor-form select, .detail-edit-form select, .year-form input { min-width: 0; height: 38px; padding: 0 10px; border: 1px solid var(--color-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-5); font: 400 0.9rem "Asap", sans-serif; }
.editor-form__fields input, .editor-form__fields select { width: 100%; }
.form-actions { justify-content: flex-end; }
.icon-button { display: grid; width: 34px; height: 34px; place-items: center; border: 0; border-radius: 5px; background: transparent; color: var(--gray-dark-3); cursor: pointer; font-size: 1.5rem; line-height: 1; }
.icon-button:hover { background: var(--gray-light-1); }
.record-list { margin-top: 8px; }
.record-row { display: flex; min-height: 52px; align-items: center; justify-content: space-between; gap: 16px; padding: 7px 10px; border-bottom: 1px solid var(--color-divider); color: var(--gray-dark-5); }
.record-main { display: flex; min-width: 0; flex: 1; align-items: center; gap: 10px; padding: 5px 0; border: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.record-main strong { font-weight: 600; }
.record-main:hover strong { color: var(--green-2); }
.record-meta { margin-left: auto; color: var(--gray-light-4); font-size: 0.78rem; white-space: nowrap; }
.make-context { color: var(--gray-light-4); font-size: 0.9em; font-weight: 400; }
.row-actions { flex-shrink: 0; }
.status-dot { display: inline-block; width: 9px; height: 9px; flex: 0 0 9px; border-radius: 50%; }
.status-dot--active { background: #39834e; box-shadow: 0 0 0 2px rgb(57 131 78 / 13%); }
.status-dot--inactive { background: #bd5148; box-shadow: 0 0 0 2px rgb(189 81 72 / 12%); }
.inactive { color: var(--gray-light-4); }
.message, .empty-state { margin: 16px 0; color: var(--gray-light-4); font-size: 0.9rem; }
.message--error { color: #9d2f2f; }
.author-columns { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 14px; align-items: start; }
.author-team { min-width: 0; overflow: hidden; border: 1px solid var(--color-border); border-top: 3px solid var(--team-accent); border-radius: 8px; background: var(--white); }
.author-team--bg { --team-accent: var(--color-team-bg); }
.author-team--cd { --team-accent: var(--color-team-cd); }
.author-team--freelance { --team-accent: var(--color-team-fl); }
.author-team__heading { display: flex; min-height: 58px; align-items: center; gap: 9px; padding: 10px 12px; border-bottom: 1px solid var(--color-divider); }
.author-team__heading h2 { margin: 0; color: var(--gray-dark-5); font: 700 0.94rem "Monda", sans-serif; }
.team-mark { display: grid; width: 30px; height: 26px; place-items: center; border-radius: 4px; background: var(--team-accent); color: var(--color-team-text); font: 700 0.65rem "Asap", sans-serif; }
.author-team__heading .record-count { margin-left: auto; }
.author-row { min-height: 46px; padding-inline: 12px; }
.author-name { display: flex; min-width: 0; align-items: center; gap: 9px; }
.author-name strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.88rem; }
.model-admin { margin-top: 18px; border: 1px solid var(--color-border); border-radius: 8px; background: rgb(255 255 255 / 78%); }
.model-admin > summary { padding: 13px 16px; color: var(--gray-dark-4); cursor: pointer; font-weight: 600; }
.model-admin > summary span { margin-left: 8px; color: var(--gray-light-4); font-size: 0.8rem; font-weight: 400; }
.model-admin__content { display: grid; gap: 4px; padding: 0 14px 14px; }
.model-year-section { padding: 16px; border: 1px solid var(--color-border); border-radius: 7px; background: var(--white); }
.model-year-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.model-year-heading h2 { margin: 0 0 4px; color: var(--gray-dark-5); font: 700 0.95rem "Monda", sans-serif; }
.model-year-heading p { margin: 0; color: var(--gray-light-4); font-size: 0.82rem; }
.year-form input { width: 100px; }
.year-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.year-chip { display: inline-flex; align-items: center; gap: 8px; padding: 6px 9px; border: 1px solid var(--color-divider); border-radius: 5px; color: var(--gray-dark-5); font-size: 0.84rem; }
.year-chip small { color: var(--gray-light-4); font-size: 0.72rem; text-transform: capitalize; }
.vehicle-year-form { margin: 14px 0 0; padding: 0; border: 0; box-shadow: none; }
.vehicle-year-form .form-actions { flex: 0 0 auto; }
.detail-backdrop { position: fixed; z-index: 1000; inset: 0; display: flex; justify-content: flex-end; background: rgb(20 27 22 / 32%); }
.detail-panel { display: flex; width: min(480px, 100vw); height: 100%; flex-direction: column; overflow: auto; background: var(--white); box-shadow: -12px 0 40px rgb(0 0 0 / 12%); }
.detail-enter-active, .detail-leave-active { transition: opacity 240ms ease; }
.detail-enter-active .detail-panel, .detail-leave-active .detail-panel { transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1); }
.detail-enter-from, .detail-leave-to { opacity: 0; }
.detail-enter-from .detail-panel, .detail-leave-to .detail-panel { transform: translateX(100%); }
.detail-panel__header { display: flex; justify-content: space-between; gap: 16px; padding: 26px 24px 20px; border-bottom: 1px solid var(--color-divider); }
.detail-panel__header h2 { margin: 1px 0 8px; color: var(--gray-dark-5); font: 700 1.35rem "Monda", sans-serif; }
.detail-kicker { margin: 0; color: var(--gray-light-4); font-size: 0.75rem; letter-spacing: 0.04em; text-transform: uppercase; }
.detail-state { display: inline-flex; align-items: center; gap: 7px; color: var(--gray-dark-3); font-size: 0.82rem; }
.detail-content { padding: 20px 24px; }
.detail-content h3 { margin: 0 0 12px; color: var(--gray-dark-5); font: 700 0.95rem "Monda", sans-serif; }
.detail-record { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 10px; border: 0; border-bottom: 1px solid var(--color-divider); background: transparent; color: var(--gray-dark-5); text-align: left; cursor: pointer; }
.detail-record:hover { background: var(--gray-light-1); }
.detail-record > span:first-child { display: grid; gap: 3px; }
.detail-record small, .detail-year-row span { color: var(--gray-light-4); font-size: 0.8rem; font-weight: 400; }
.detail-year-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 0; border-bottom: 1px solid var(--color-divider); }
.detail-year-row > div { display: grid; gap: 3px; }
.detail-edit-form { display: grid; width: 100%; gap: 10px; padding: 8px 0 4px; }
.detail-edit-form select { width: 100%; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; clip-path: inset(50%); }
@media (max-width: 900px) { .author-columns { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 680px) {
  .catalog-heading { align-items: stretch; }
  .catalog-tools { display: grid; grid-template-columns: minmax(0, 1fr) auto; }
  .search-field { grid-column: 1 / -1; }
  .search-field input { width: 100%; }
  .add-button { grid-column: 1 / -1; justify-self: start; }
  .author-columns { grid-template-columns: 1fr; }
  .record-row { align-items: flex-start; }
  .record-main { flex-wrap: wrap; }
  .record-meta { margin-left: 19px; }
  .row-actions { flex-wrap: wrap; justify-content: flex-end; }
  .editor-form__fields { align-items: stretch; flex-direction: column; }
  .editor-form__fields label { width: 100%; flex-basis: auto; }
  .model-year-heading { align-items: flex-start; flex-direction: column; }
  .year-form { width: 100%; }
  .year-form input { flex: 1; }
  .vehicle-year-form { align-items: stretch; }
  .model-admin > summary span { display: block; margin: 5px 0 0; }
}
@media (prefers-reduced-motion: reduce) { .detail-enter-active, .detail-leave-active, .detail-enter-active .detail-panel, .detail-leave-active .detail-panel { transition: none; } }
</style>
