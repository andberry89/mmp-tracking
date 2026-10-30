import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuthorsStore } from "@/stores/authors";
import { useCatalogStore, type ModelYearVehicleOption } from "@/stores/catalog";
import type { AuthorId } from "@/types";

export type ChangeoverStatus =
  | "awaiting_info"
  | "info_available"
  | "skipped"
  | "dead"
  | "vaporware"
  | "published"
  | "embargoed";

export interface ChangeoverYearOption {
  year: number;
  state: "draft" | "active" | "prior";
  isDefault: boolean;
  deadline: string;
}

export interface ChangeoverEntry {
  id: string;
  modelYearVehicleId: string;
  modelId: string;
  makeId: string;
  modelYear: number;
  make: string;
  model: string;
  segment: string;
  publicUrl: string;
  resourceUrl: string;
  status: ChangeoverStatus;
  assignedAuthorId: AuthorId | null;
  author: string;
  isOpen: boolean;
  notes: string;
  sourceProvenance: ChangeoverProvenance[];
}

type ChangeoverProvenance = {
  source_sheet?: string;
  source_row?: number;
  raw_status?: string | null;
  source_author_original?: string | null;
  review_flag?: boolean;
  raw_author?: string | null;
  author_reviewed?: boolean;
};

type DbChangeoverYear = {
  year: number;
  state: ChangeoverYearOption["state"];
  is_default: boolean;
  changeover_deadline: string | null;
};

type DbChangeoverRow = {
  id: string;
  model_year_vehicle_id: string;
  status: ChangeoverStatus;
  assigned_author_id: string | null;
  notes: string;
  source_provenance: ChangeoverProvenance[] | null;
  resource_url: string | null;
  model_year_vehicles: {
    id: string;
    model_id: string;
    model_year: number;
    public_url: string | null;
    models: {
      id: string;
      name: string;
      make_id: string;
      makes: { name: string } | { name: string }[] | null;
    } | {
      id: string;
      name: string;
      make_id: string;
      makes: { name: string } | { name: string }[] | null;
    }[];
    segments: { name: string } | { name: string }[] | null;
  } | {
    id: string;
    model_id: string;
    model_year: number;
    public_url: string | null;
    models: {
      id: string;
      name: string;
      make_id: string;
      makes: { name: string } | { name: string }[] | null;
    } | {
      id: string;
      name: string;
      make_id: string;
      makes: { name: string } | { name: string }[] | null;
    }[];
    segments: { name: string } | { name: string }[] | null;
  }[];
  authors: { label: string } | { label: string }[] | null;
};

const localEntries = ref<ChangeoverEntry[]>([]);
const localDeadlines = ref<Record<number, string>>({});

export const useChangeoverStore = defineStore("changeover", () => {
  const catalogStore = useCatalogStore();
  const authorsStore = useAuthorsStore();
  const years = ref<ChangeoverYearOption[]>([]);
  const entries = ref<ChangeoverEntry[]>([]);
  const selectedYear = ref<number | null>(null);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);
  let realtimeChannel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;

  const defaultYear = computed(() => years.value.find((year) => year.isDefault)?.year ?? years.value[0]?.year ?? null);

  async function load(year = selectedYear.value ?? undefined) {
    isLoading.value = true;
    error.value = null;
    try {
      if (!supabase || !isSupabaseConfigured) {
        years.value = catalogStore.modelYearRecords.map((item) => ({
          year: item.year,
          state: item.state,
          isDefault: item.isDefault,
          deadline: localDeadlines.value[item.year] ?? "",
        }));
        selectedYear.value = year ?? defaultYear.value;
        entries.value = selectedYear.value === null
          ? []
          : localEntries.value.filter((entry) => entry.modelYear === selectedYear.value);
        return;
      }

      const yearResult = await supabase
        .from("model_years")
        .select("year, state, is_default, changeover_deadline")
        .order("year", { ascending: false });
      if (yearResult.error) throw yearResult.error;

      years.value = ((yearResult.data ?? []) as DbChangeoverYear[]).map((row) => ({
        year: row.year,
        state: row.state,
        isDefault: row.is_default,
        deadline: row.changeover_deadline ?? "",
      }));
      selectedYear.value = year ?? defaultYear.value;
      if (selectedYear.value === null) {
        entries.value = [];
        return;
      }

      const rows = await fetchAllPages((from, to) => supabase
        .from("changeover_entries")
        .select("id, model_year_vehicle_id, status, assigned_author_id, notes, source_provenance, resource_url, authors(label), model_year_vehicles!inner(id, model_id, model_year, public_url, models!inner(id, name, make_id, makes!inner(name)), segments(name))")
        .eq("model_year_vehicles.model_year", selectedYear.value)
        .order("id")
        .range(from, to));

      entries.value = (rows as unknown as DbChangeoverRow[]).map(mapChangeoverRow);
    } catch (reason) {
      error.value = messageFor(reason, "Unable to load Changeover data.");
    } finally {
      isLoading.value = false;
    }
  }

  async function addEntry(vehicle: ModelYearVehicleOption, input: {
    status: ChangeoverStatus;
    assignedAuthorId: AuthorId | null;
    notes: string;
    publicUrl: string;
    resourceUrl: string;
  }) {
    error.value = null;
    if (entries.value.some((entry) => entry.modelYearVehicleId === vehicle.id)) {
      throw new Error(`${vehicle.make} ${vehicle.model} is already on the ${vehicle.modelYear} Changeover list.`);
    }
    isSaving.value = true;
    try {
      if (supabase && isSupabaseConfigured) {
        const { error: insertError } = await supabase.from("changeover_entries").insert({
          model_year_vehicle_id: vehicle.id,
          status: input.status,
          assigned_author_id: input.assignedAuthorId,
          notes: input.notes.trim(),
          resource_url: input.status === "published" ? null : input.resourceUrl.trim() || null,
        });
        if (insertError?.code === "23505") {
          throw new Error(`${vehicle.make} ${vehicle.model} is already on this Changeover list.`);
        }
        if (insertError) throw insertError;
        const { error: urlError } = await supabase.from("model_year_vehicles")
          .update({ public_url: input.status === "published" ? input.publicUrl.trim() || null : null })
          .eq("id", vehicle.id);
        if (urlError) throw urlError;
        await load(selectedYear.value ?? undefined);
        return;
      }

      localEntries.value.push({
        id: `demo-changeover:${vehicle.id}`,
        modelYearVehicleId: vehicle.id,
        modelId: vehicle.modelId,
        makeId: vehicle.makeId,
        modelYear: vehicle.modelYear,
        make: vehicle.make,
        model: vehicle.model,
        segment: vehicle.segment,
        status: input.status,
        assignedAuthorId: input.assignedAuthorId,
        author: authorsStore.getAuthorById(input.assignedAuthorId).value?.label ?? "",
        isOpen: !input.assignedAuthorId,
        notes: input.notes.trim(),
        publicUrl: input.status === "published" ? input.publicUrl.trim() : "",
        resourceUrl: input.status === "published" ? "" : input.resourceUrl.trim(),
        sourceProvenance: [],
      });
      await load(selectedYear.value ?? undefined);
    } finally {
      isSaving.value = false;
    }
  }

  async function updateEntry(entry: ChangeoverEntry, input: {
    status: ChangeoverStatus;
    assignedAuthorId: AuthorId | null;
    notes: string;
    publicUrl: string;
    resourceUrl: string;
  }) {
    error.value = null;
    isSaving.value = true;
    try {
      const assignmentChanged = entry.assignedAuthorId !== input.assignedAuthorId;
      const sourceProvenance = assignmentChanged
        ? (entry.sourceProvenance.length ? entry.sourceProvenance : [{}]).map((item) => {
          const { raw_author: rawAuthor, ...rest } = item;
          return {
            ...rest,
            ...(rawAuthor ? { source_author_original: rawAuthor } : {}),
            raw_author: null,
            author_reviewed: true,
          };
        })
        : entry.sourceProvenance;
      if (supabase && isSupabaseConfigured) {
        const { error: entryError } = await supabase
          .from("changeover_entries")
          .update({
            status: input.status,
            assigned_author_id: input.assignedAuthorId,
            notes: input.notes.trim(),
            resource_url: input.status === "published" ? null : input.resourceUrl.trim() || null,
            source_provenance: sourceProvenance,
          })
          .eq("id", entry.id);
        if (entryError) throw entryError;

        const { error: urlError } = await supabase
          .from("model_year_vehicles")
          .update({ public_url: input.status === "published" ? input.publicUrl.trim() || null : null })
          .eq("id", entry.modelYearVehicleId);
        if (urlError) throw urlError;
        await load(selectedYear.value ?? undefined);
        return;
      }

      const index = localEntries.value.findIndex((item) => item.id === entry.id);
      if (index >= 0) {
        localEntries.value[index] = {
          ...entry,
          status: input.status,
          assignedAuthorId: input.assignedAuthorId,
          author: authorsStore.getAuthorById(input.assignedAuthorId).value?.label ?? "",
          isOpen: !input.assignedAuthorId,
          notes: input.notes.trim(),
          publicUrl: input.status === "published" ? input.publicUrl.trim() : "",
          resourceUrl: input.status === "published" ? "" : input.resourceUrl.trim(),
          sourceProvenance,
        };
      }
      await load(selectedYear.value ?? undefined);
    } finally {
      isSaving.value = false;
    }
  }

  async function updateDeadline(year: number, deadline: string) {
    error.value = null;
    isSaving.value = true;
    try {
      if (supabase && isSupabaseConfigured) {
        const { error: updateError } = await supabase
          .from("model_years")
          .update({ changeover_deadline: deadline || null })
          .eq("year", year);
        if (updateError) throw updateError;
      } else {
        localDeadlines.value[year] = deadline;
        years.value = years.value.map((item) => item.year === year ? { ...item, deadline } : item);
        selectedYear.value = year;
        return;
      }
      await load(year);
    } catch (reason) {
      error.value = messageFor(reason, "Could not save the Changeover deadline.");
      throw reason;
    } finally {
      isSaving.value = false;
    }
  }

  function subscribeToChanges() {
    if (!supabase || !isSupabaseConfigured) return;
    if (realtimeChannel) void supabase.removeChannel(realtimeChannel);
    realtimeChannel = supabase
      .channel("changeover-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "changeover_entries" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "model_years" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "model_year_vehicles" }, () => void load())
      .subscribe();
  }

  function stopRealtime() {
    if (supabase && realtimeChannel) void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  return {
    years,
    entries,
    selectedYear,
    defaultYear,
    isLoading,
    isSaving,
    error,
    load,
    addEntry,
    updateEntry,
    updateDeadline,
    subscribeToChanges,
    stopRealtime,
  };
});

function mapChangeoverRow(row: DbChangeoverRow): ChangeoverEntry {
  const vehicle = one(row.model_year_vehicles);
  const model = vehicle ? one(vehicle.models) : null;
  const make = model ? one(model.makes) : null;
  const segment = vehicle ? one(vehicle.segments) : null;
  const author = one(row.authors);
  const sourceProvenance = row.source_provenance ?? [];
  const rawAuthor = sourceProvenance[0]?.raw_author?.trim() ?? "";
  const hasSourceProvenance = Boolean(sourceProvenance.length);
  const authorReviewed = sourceProvenance[0]?.author_reviewed === true;
  return {
    id: row.id,
    modelYearVehicleId: row.model_year_vehicle_id,
    modelId: vehicle?.model_id ?? model?.id ?? "",
    makeId: model?.make_id ?? "",
    modelYear: vehicle?.model_year ?? 0,
    make: make?.name ?? "",
    model: model?.name ?? "",
    segment: segment?.name ?? "",
    publicUrl: vehicle?.public_url ?? "",
    resourceUrl: row.resource_url ?? "",
    status: row.status,
    assignedAuthorId: row.assigned_author_id as AuthorId | null,
    author: author?.label ?? (rawAuthor.toLowerCase() === "open" ? "" : rawAuthor),
    isOpen: !row.assigned_author_id && (authorReviewed || rawAuthor.toLowerCase() === "open" || !hasSourceProvenance),
    notes: row.notes,
    sourceProvenance,
  };
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value as T;
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

function messageFor(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}
