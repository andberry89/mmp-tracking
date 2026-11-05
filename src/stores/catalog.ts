import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuthorsStore } from "@/stores/authors";
import { testDocuments } from "@/test";
import { formatModelName } from "@/utils/format-model-name";

export interface MakeOption {
  id: string;
  name: string;
  active: boolean;
}

export interface SegmentOption {
  id: string;
  name: string;
  active: boolean;
  bodyStyle: BodyStyle | null;
}

export type BodyStyle = "cars" | "suvs" | "vans" | "pickup_trucks";

export const bodyStyleOptions: Array<{ id: BodyStyle; label: string }> = [
  { id: "cars", label: "Cars" },
  { id: "suvs", label: "SUVs" },
  { id: "vans", label: "Vans" },
  { id: "pickup_trucks", label: "Pickup Trucks" },
];

export interface ModelOption {
  id: string;
  makeId: string;
  make: string;
  name: string;
  active: boolean;
}

export interface ModelYearVehicleOption {
  id: string;
  modelId: string;
  makeId: string;
  make: string;
  model: string;
  modelYear: number;
  segmentId: string | null;
  segment: string;
  segments: SegmentOption[];
  rating: number | null;
  awards: { ten_best: number[]; editors_choice: number[] };
  publicUrl?: string;
}

export interface ModelYearOption {
  year: number;
  state: "draft" | "active" | "prior";
  isDefault: boolean;
}

type CatalogRow = { id: string; name: string; active: boolean };
type SegmentRow = CatalogRow & { body_style: BodyStyle | null };
type ModelRow = {
  id: string;
  make_id: string;
  name: string;
  active: boolean;
  makes: { name: string } | { name: string }[] | null;
};
type ModelYearVehicleRow = {
  id: string;
  model_id: string;
  model_year: number;
  public_url: string | null;
  rating: number | string | null;
  models: {
    name: string;
    make_id: string;
    active: boolean;
    makes: { name: string; active: boolean } | { name: string; active: boolean }[] | null;
  } | {
    name: string;
    make_id: string;
    active: boolean;
    makes: { name: string; active: boolean } | { name: string; active: boolean }[] | null;
  }[];
  model_year_vehicle_segments: Array<{ segments: SegmentRow | SegmentRow[] | null }>;
  model_year_vehicle_awards: Array<{ award_year: number; award_type: "ten_best" | "editors_choice" }>;
};

export const useCatalogStore = defineStore("catalog", () => {
  const makes = ref<MakeOption[]>([]);
  const models = ref<ModelOption[]>([]);
  const modelYearVehicles = ref<ModelYearVehicleOption[]>([]);
  const segments = ref<SegmentOption[]>([]);
  const modelYears = ref<number[]>([]);
  const modelYearRecords = ref<ModelYearOption[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  let realtimeChannel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;

  const activeMakes = computed(() => makes.value.filter((item) => item.active));
  const activeModels = computed(() => models.value.filter((item) => item.active));
  const activeSegments = computed(() => segments.value.filter((item) => item.active));
  const activeModelYearVehicles = computed(() => modelYearVehicles.value.filter((item) => {
    const model = models.value.find((row) => row.id === item.modelId);
    const make = makes.value.find((row) => row.id === item.makeId);
    return model?.active && make?.active;
  }));
  const modelsForMake = (makeId: string) => computed(() => activeModels.value.filter((model) => model.makeId === makeId));

  async function loadCatalog() {
    isLoading.value = true;
    error.value = null;

    if (!isSupabaseConfigured || !supabase) {
      loadDemoCatalog();
      isLoading.value = false;
      return;
    }
    const client = supabase;

    try {
      const [makeResult, segmentResult, yearResult, modelRows, vehicleYearRows] = await Promise.all([
        client.from("makes").select("id, name, active").order("name"),
        client.from("segments").select("id, name, active, body_style").order("name"),
        client.from("model_years").select("year, state, is_default").order("year", { ascending: false }),
        fetchAllPages((from, to) => client
          .from("models")
          .select("id, make_id, name, active, makes!inner(name)")
          .order("name")
          .order("make_id")
          .order("id")
          .range(from, to)),
        fetchAllPages((from, to) => client
          .from("model_year_vehicles")
          .select("id, model_id, model_year, public_url, rating, models!inner(name, make_id, active, makes!inner(name, active)), model_year_vehicle_segments(segments(id, name, active, body_style)), model_year_vehicle_awards(award_year, award_type)")
          .order("model_year", { ascending: false })
          .order("model_id")
          .order("id")
          .range(from, to)),
      ]);
      if (makeResult.error) throw makeResult.error;
      if (segmentResult.error) throw segmentResult.error;
      if (yearResult.error) throw yearResult.error;

      makes.value = ((makeResult.data ?? []) as CatalogRow[]).map((row) => ({ ...row }));
      segments.value = ((segmentResult.data ?? []) as SegmentRow[]).map((row) => ({
        id: row.id, name: row.name, active: row.active, bodyStyle: row.body_style,
      }));
      models.value = (modelRows as unknown as ModelRow[]).map((model) => {
        const make = Array.isArray(model.makes) ? model.makes[0] : model.makes;
        return {
          id: model.id,
          makeId: model.make_id,
          make: make?.name ?? "",
          name: formatModelName(model.name),
          active: model.active,
        };
      });
      modelYearRecords.value = (yearResult.data ?? []).map((row) => ({
        year: row.year,
        state: row.state,
        isDefault: row.is_default,
      }));
      modelYears.value = modelYearRecords.value.map((row) => row.year);
      modelYearVehicles.value = (vehicleYearRows as unknown as ModelYearVehicleRow[]).map((row) => {
        const model = Array.isArray(row.models) ? row.models[0] : row.models;
        const make = model ? (Array.isArray(model.makes) ? model.makes[0] : model.makes) : null;
        const vehicleSegments = row.model_year_vehicle_segments
          .flatMap((assignment) => Array.isArray(assignment.segments) ? assignment.segments : assignment.segments ? [assignment.segments] : [])
          .map((segment) => ({ id: segment.id, name: segment.name, active: segment.active, bodyStyle: segment.body_style }));
        const awards = { ten_best: [] as number[], editors_choice: [] as number[] };
        row.model_year_vehicle_awards.forEach((award) => awards[award.award_type].push(award.award_year));
        return {
          id: row.id,
          modelId: row.model_id,
          makeId: model?.make_id ?? "",
          make: make?.name ?? "",
          model: model ? formatModelName(model.name) : "",
          modelYear: row.model_year,
          segmentId: vehicleSegments[0]?.id ?? null,
          segment: vehicleSegments.map((segment) => segment.name).join(", "),
          segments: vehicleSegments,
          rating: row.rating === null ? null : Number(row.rating),
          awards,
          publicUrl: row.public_url ?? "",
        };
      });
    } catch (reason) {
      error.value = messageFor(reason, "Unable to load catalog data.");
    } finally {
      isLoading.value = false;
    }
  }

  async function saveMake(input: { id?: string; name: string; active?: boolean }) {
    const name = input.name.trim();
    if (!name) throw new Error("Enter a make name.");
    if (!supabase || !isSupabaseConfigured) {
      saveLocal(makes, { id: input.id ?? localId("make"), name, active: input.active ?? true });
      return;
    }
    const query = supabase.from("makes");
    const result = input.id
      ? await query.update({ name, active: input.active ?? true }).eq("id", input.id)
      : await query.insert({ name });
    if (result.error) throw result.error;
    await loadCatalog();
  }

  async function saveSegment(input: { id?: string; name: string; active?: boolean; bodyStyle?: BodyStyle | null }) {
    const name = input.name.trim();
    if (!name) throw new Error("Enter a segment name.");
    if (!supabase || !isSupabaseConfigured) {
      saveLocal(segments, { id: input.id ?? localId("segment"), name, active: input.active ?? true, bodyStyle: input.bodyStyle ?? null });
      return;
    }
    const query = supabase.from("segments");
    const payload = { name, active: input.active ?? true, body_style: input.bodyStyle ?? null };
    const result = input.id
      ? await query.update(payload).eq("id", input.id)
      : await query.insert(payload);
    if (result.error) throw result.error;
    await loadCatalog();
  }

  async function saveModel(input: { id?: string; name: string; makeId: string; active?: boolean }) {
    const name = input.name.trim();
    if (!name || !input.makeId) throw new Error("Choose a make and enter a model name.");
    const duplicate = models.value.find((model) =>
      model.id !== input.id &&
      model.makeId === input.makeId &&
      model.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase()
    );
    if (duplicate) {
      const makeName = makes.value.find((make) => make.id === input.makeId)?.name ?? "This make";
      throw new Error(`${makeName} ${duplicate.name} is already in the catalog. Search for the existing model instead of adding it again.`);
    }
    if (!supabase || !isSupabaseConfigured) {
      const make = makes.value.find((item) => item.id === input.makeId);
      if (!make) throw new Error("Choose a valid make.");
      saveLocal(models, {
        id: input.id ?? localId("model"), makeId: make.id, make: make.name, name,
        active: input.active ?? true,
      });
      return;
    }
    const payload = { name, make_id: input.makeId, active: input.active ?? true };
    const query = supabase.from("models");
    const result = input.id
      ? await query.update(payload).eq("id", input.id)
      : await query.insert(payload);
    if (result.error?.code === "23505") {
      const makeName = makes.value.find((make) => make.id === input.makeId)?.name ?? "This make";
      throw new Error(`${makeName} ${name} is already in the catalog. Search for the existing model instead of adding it again.`);
    }
    if (result.error) throw result.error;
    await loadCatalog();
  }

  async function saveModelYearVehicle(input: { id?: string; modelId: string; modelYear: number; segmentIds?: string[]; segmentId?: string | null }) {
    if (!input.modelId || !modelYears.value.includes(input.modelYear)) {
      throw new Error("Choose a catalog model and model year first.");
    }
    if (!supabase || !isSupabaseConfigured) {
      const model = models.value.find((item) => item.id === input.modelId);
      if (!model) throw new Error("Choose a valid model.");
      const selectedIds = input.segmentIds ?? (input.segmentId ? [input.segmentId] : []);
      const selectedSegments = selectedIds.map((segmentId) => segments.value.find((item) => item.id === segmentId))
        .filter((item): item is SegmentOption => Boolean(item));
      const existing = modelYearVehicles.value.find((item) => item.modelId === input.modelId && item.modelYear === input.modelYear);
      const row: ModelYearVehicleOption = {
        id: existing?.id ?? input.id ?? localId("vehicle-year"),
        modelId: model.id,
        makeId: model.makeId,
        make: model.make,
        model: model.name,
        modelYear: input.modelYear,
        segmentId: selectedSegments[0]?.id ?? null,
        segment: selectedSegments.map((segment) => segment.name).join(", "),
        segments: selectedSegments,
        rating: existing?.rating ?? null,
        awards: existing?.awards ?? { ten_best: [], editors_choice: [] },
      };
      const index = modelYearVehicles.value.findIndex((item) => item.id === row.id);
      if (index === -1) modelYearVehicles.value.push(row);
      else modelYearVehicles.value.splice(index, 1, row);
      return;
    }
    const selectedIds = [...new Set(input.segmentIds ?? (input.segmentId ? [input.segmentId] : []))];
    const { data: vehicle, error: vehicleError } = await supabase
      .from("model_year_vehicles")
      .upsert({ model_id: input.modelId, model_year: input.modelYear, segment_id: selectedIds[0] ?? null }, { onConflict: "model_id,model_year" })
      .select("id")
      .single();
    if (vehicleError) throw vehicleError;

    const existingResult = await supabase.from("model_year_vehicle_segments")
      .select("segment_id").eq("model_year_vehicle_id", vehicle.id);
    if (existingResult.error) throw existingResult.error;
    const existingIds = ((existingResult.data ?? []) as Array<{ segment_id: string }>).map((row) => row.segment_id);
    const removeIds = existingIds.filter((segmentId) => !selectedIds.includes(segmentId));
    if (removeIds.length) {
      const { error: removeError } = await supabase.from("model_year_vehicle_segments")
        .delete().eq("model_year_vehicle_id", vehicle.id).in("segment_id", removeIds);
      if (removeError) throw removeError;
    }
    const addIds = selectedIds.filter((segmentId) => !existingIds.includes(segmentId));
    if (addIds.length) {
      const { error: addError } = await supabase.from("model_year_vehicle_segments").insert(addIds.map((segmentId) => ({
        model_year_vehicle_id: vehicle.id,
        model_year: input.modelYear,
        segment_id: segmentId,
        entry_state: "unranked" as const,
      })));
      if (addError) throw addError;
    }
    await loadCatalog();
  }

  async function saveModelYearRating(vehicleId: string, rating: number | null) {
    if (rating !== null && (!Number.isFinite(rating) || rating < 1 || rating > 10 || rating * 2 !== Math.round(rating * 2))) {
      throw new Error("Rating must be from 1 to 10 in half-point steps.");
    }
    const vehicle = modelYearVehicles.value.find((item) => item.id === vehicleId);
    if (!vehicle) throw new Error("Choose a valid model year vehicle.");
    if (!supabase || !isSupabaseConfigured) {
      vehicle.rating = rating;
      return;
    }
    const { error: ratingError } = await supabase.from("model_year_vehicles").update({ rating }).eq("id", vehicleId);
    if (ratingError) throw ratingError;
    vehicle.rating = rating;
  }

  async function saveModelYearAward(vehicleId: string, awardYear: number, awardType: "ten_best" | "editors_choice", awarded: boolean) {
    if (!Number.isInteger(awardYear) || awardYear < 1900 || awardYear > 2200) throw new Error("Enter a valid award year.");
    const vehicle = modelYearVehicles.value.find((item) => item.id === vehicleId);
    if (!vehicle) throw new Error("Choose a valid model year vehicle.");
    if (supabase && isSupabaseConfigured) {
      const query = supabase.from("model_year_vehicle_awards");
      const result = awarded
        ? await query.upsert({ model_year_vehicle_id: vehicleId, award_year: awardYear, award_type: awardType }, { onConflict: "model_year_vehicle_id,award_year,award_type", ignoreDuplicates: true })
        : await query.delete().eq("model_year_vehicle_id", vehicleId).eq("award_year", awardYear).eq("award_type", awardType);
      if (result.error) throw result.error;
    }
    const years = vehicle.awards[awardType];
    vehicle.awards[awardType] = awarded
      ? [...new Set([...years, awardYear])].sort((a, b) => b - a)
      : years.filter((year) => year !== awardYear);
  }

  async function saveModelYear(year: number) {
    if (!Number.isInteger(year) || year < 1900 || year > 2200) throw new Error("Enter a model year from 1900 to 2200.");
    if (modelYears.value.includes(year)) throw new Error("That model year is already in the catalog.");
    if (!supabase || !isSupabaseConfigured) {
      modelYearRecords.value = [...modelYearRecords.value, { year, state: "draft" as const, isDefault: false }].sort((a, b) => b.year - a.year);
      modelYears.value = modelYearRecords.value.map((row) => row.year);
      return;
    }
    const { error: insertError } = await supabase.from("model_years").insert({ year });
    if (insertError) throw insertError;
    await loadCatalog();
  }

  function subscribeToChanges() {
    if (!supabase || !isSupabaseConfigured || realtimeChannel) return;
    realtimeChannel = supabase
      .channel("catalog-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "makes" }, () => void loadCatalog())
      .on("postgres_changes", { event: "*", schema: "public", table: "models" }, () => void loadCatalog())
      .on("postgres_changes", { event: "*", schema: "public", table: "segments" }, () => void loadCatalog())
      .on("postgres_changes", { event: "*", schema: "public", table: "model_year_vehicle_segments" }, () => void loadCatalog())
      .on("postgres_changes", { event: "*", schema: "public", table: "model_year_vehicle_awards" }, () => void loadCatalog())
      .on("postgres_changes", { event: "*", schema: "public", table: "model_years" }, () => void loadCatalog())
      .on("postgres_changes", { event: "*", schema: "public", table: "model_year_vehicles" }, () => void loadCatalog())
      .on("postgres_changes", { event: "*", schema: "public", table: "authors" }, () => void useAuthorsStore().loadAuthors())
      .subscribe();
  }

  function stopRealtime() {
    if (supabase && realtimeChannel) void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  function loadDemoCatalog() {
    const makeMap = new Map<string, MakeOption>();
    const segmentMap = new Map<string, SegmentOption>();
    const modelMap = new Map<string, ModelOption>();
    const years = new Set<number>();
    for (const task of testDocuments) {
      const makeKey = task.vehicle.make.toLocaleLowerCase();
      const make = makeMap.get(makeKey) ?? { id: `demo-make:${makeKey}`, name: task.vehicle.make, active: true };
      makeMap.set(makeKey, make);
      const segmentKey = task.vehicle.segment.toLocaleLowerCase();
      const segment = segmentMap.get(segmentKey) ?? { id: `demo-segment:${segmentKey}`, name: task.vehicle.segment, active: true, bodyStyle: null };
      segmentMap.set(segmentKey, segment);
      const modelKey = `${makeKey}:${task.vehicle.model.toLocaleLowerCase()}`;
      modelMap.set(modelKey, {
        id: `demo-model:${modelKey}`, makeId: make.id, make: make.name,
        name: task.vehicle.model, active: true,
      });
      years.add(task.vehicle.modelYear);
      const vehicleYearKey = `${modelKey}:${task.vehicle.modelYear}`;
      if (!modelYearVehicles.value.some((row) => row.id === `demo-vehicle-year:${vehicleYearKey}`)) {
        modelYearVehicles.value.push({
          id: `demo-vehicle-year:${vehicleYearKey}`,
          modelId: `demo-model:${modelKey}`,
          makeId: make.id,
          make: make.name,
          model: task.vehicle.model,
          modelYear: task.vehicle.modelYear,
          segmentId: segment.id,
          segment: segment.name,
          segments: [segment],
          rating: null,
          awards: { ten_best: [], editors_choice: [] },
        });
      }
    }
    makes.value = [...makeMap.values()].sort(byName);
    segments.value = [...segmentMap.values()].sort(byName);
    models.value = [...modelMap.values()].sort(byName);
    modelYears.value = [...years].sort((a, b) => b - a);
    modelYearRecords.value = modelYears.value.map((year, index) => ({
      year, state: index === 0 ? "active" : "prior", isDefault: index === 0,
    }));
    modelYearVehicles.value = [...modelYearVehicles.value];
  }

  return {
    makes, models, segments, modelYears, modelYearRecords, modelYearVehicles,
    activeMakes, activeModels, activeSegments, activeModelYearVehicles, modelsForMake,
    isLoading, error, loadCatalog, saveMake, saveModel, saveSegment, saveModelYear, saveModelYearVehicle, saveModelYearRating, saveModelYearAward,
    subscribeToChanges, stopRealtime,
  };
});

function saveLocal<T extends { id: string; name: string; active: boolean }>(items: { value: T[] }, next: T) {
  const index = items.value.findIndex((item) => item.id === next.id);
  if (index === -1) items.value.push(next);
  else items.value.splice(index, 1, next);
  items.value.sort(byName);
}

function byName<T extends { name: string }>(a: T, b: T) {
  return a.name.localeCompare(b.name);
}

function localId(kind: string) {
  return `demo-${kind}:${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`;
}

function messageFor(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
