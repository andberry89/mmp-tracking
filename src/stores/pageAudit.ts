import { defineStore } from "pinia";
import { ref } from "vue";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useCatalogStore, type ModelYearVehicleOption } from "@/stores/catalog";
import { formatModelName } from "@/utils/format-model-name";

export type AuditChecklist = Record<string, string>;
export interface AuditAwards { tenBest: boolean; editorsChoice: boolean }

export interface PageAuditEntry {
  id: string;
  modelYearVehicleId: string;
  authorId: string | null;
  authorName: string;
  modelYear: number;
  make: string;
  model: string;
  segment: string;
  rating: number | null;
  publicUrl: string;
  pageStatus: string;
  checklist: AuditChecklist;
  awards: AuditAwards;
  auditorInitials: string;
  auditedAt: string;
  doubleCheckInfo: boolean;
  auditNotes: string;
}

export interface PageAuditInput {
  vehicle: ModelYearVehicleOption;
  pageStatus: string;
  checklist: AuditChecklist;
  awards: AuditAwards;
  rating: number | null;
  authorId: string | null;
  authorName: string;
  auditorInitials: string;
  auditedAt: string;
  doubleCheckInfo: boolean;
  auditNotes: string;
}

type DbPageAuditEntry = {
  id: string;
  model_year_vehicle_id: string;
  author_id: string | null;
  author_names: string;
  authors: { label: string } | { label: string }[] | null;
  page_status: string;
  checklist: AuditChecklist | null;
  awards: AuditAwards | null;
  auditor_initials: string;
  audited_at: string | null;
  double_check_info: boolean;
  audit_notes: string;
  model_year_vehicles: {
    model_year: number;
    public_url: string | null;
    rating: number | string | null;
    models: { name: string; makes: { name: string } | { name: string }[] | null } | { name: string; makes: { name: string } | { name: string }[] | null }[];
    model_year_vehicle_segments: Array<{ segments: { name: string } | { name: string }[] | null }>;
  } | {
    model_year: number;
    public_url: string | null;
    rating: number | string | null;
    models: { name: string; makes: { name: string } | { name: string }[] | null } | { name: string; makes: { name: string } | { name: string }[] | null }[];
    model_year_vehicle_segments: Array<{ segments: { name: string } | { name: string }[] | null }>;
  }[];
};

export const usePageAuditStore = defineStore("pageAudit", () => {
  const catalog = useCatalogStore();
  const entries = ref<PageAuditEntry[]>([]);
  const deadModelYearVehicleIds = ref<string[]>([]);
  const selectedYear = ref<number | null>(null);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);
  let realtimeChannel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;

  async function load(year = selectedYear.value ?? undefined) {
    isLoading.value = true;
    error.value = null;
    try {
      if (!supabase || !isSupabaseConfigured) {
        selectedYear.value = year ?? catalog.modelYearRecords.find((item) => item.isDefault)?.year ?? catalog.modelYears[0] ?? null;
        entries.value = [];
        deadModelYearVehicleIds.value = [];
        return;
      }
      selectedYear.value = year ?? catalog.modelYearRecords.find((item) => item.isDefault)?.year ?? catalog.modelYears[0] ?? null;
      if (selectedYear.value === null) { entries.value = []; deadModelYearVehicleIds.value = []; return; }
      const client = supabase;
      const modelYear = selectedYear.value;
      const [rows, deadRows] = await Promise.all([
        fetchAllPages((from, to) => client
          .from("page_audit_entries")
          .select("id, model_year_vehicle_id, author_id, author_names, authors(label), page_status, checklist, awards, auditor_initials, audited_at, double_check_info, audit_notes, model_year_vehicles!inner(model_year, public_url, rating, models!inner(name, makes!inner(name)), model_year_vehicle_segments(segments(name)))")
          .eq("model_year_vehicles.model_year", modelYear)
          .order("id")
          .range(from, to)),
        fetchAllPages((from, to) => client
          .from("changeover_entries")
          .select("model_year_vehicle_id, model_year_vehicles!inner(model_year)")
          .eq("status", "dead")
          .eq("model_year_vehicles.model_year", modelYear)
          .order("model_year_vehicle_id")
          .range(from, to)),
      ]);
      const deadIds = new Set((deadRows as unknown as Array<{ model_year_vehicle_id: string }>).map((row) => row.model_year_vehicle_id));
      deadModelYearVehicleIds.value = [...deadIds];
      entries.value = (rows as unknown as DbPageAuditEntry[])
        .filter((row) => !deadIds.has(row.model_year_vehicle_id))
        .map(mapRow);
    } catch (reason) {
      entries.value = [];
      deadModelYearVehicleIds.value = [];
      error.value = reason instanceof Error ? reason.message : "Unable to load Page Audit data.";
    } finally {
      isLoading.value = false;
    }
  }

  async function save(input: PageAuditInput, entry?: PageAuditEntry) {
    isSaving.value = true;
    error.value = null;
    const payload = {
      model_year_vehicle_id: input.vehicle.id,
      author_id: input.authorId,
      author_names: input.authorName.trim(),
      page_status: input.pageStatus.trim(),
      checklist: input.checklist,
      awards: input.awards,
      auditor_initials: input.auditorInitials.trim(),
      audited_at: input.auditedAt || null,
      double_check_info: input.doubleCheckInfo,
      audit_notes: input.auditNotes.trim(),
    };
    try {
      if (!supabase || !isSupabaseConfigured) {
        throw new Error("Page Audit changes require the configured Supabase database.");
      }
      if (deadModelYearVehicleIds.value.includes(input.vehicle.id)) {
        throw new Error("A vehicle marked Dead in Changeover cannot be added to Page Audit.");
      }
      await catalog.saveModelYearRating(input.vehicle.id, input.rating);
      const result = entry
        ? await supabase.from("page_audit_entries").update(payload).eq("id", entry.id)
        : await supabase.from("page_audit_entries").insert(payload);
      if (result.error) throw result.error;
      await load(selectedYear.value ?? undefined);
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "Unable to save this Page Audit entry.";
      throw reason;
    } finally {
      isSaving.value = false;
    }
  }

  async function addVehicle(vehicle: ModelYearVehicleOption) {
    const empty: PageAuditInput = {
      vehicle,
      pageStatus: "",
      checklist: {},
      awards: { tenBest: false, editorsChoice: false },
      rating: vehicle.rating,
      authorId: null,
      authorName: "",
      auditorInitials: "",
      auditedAt: "",
      doubleCheckInfo: false,
      auditNotes: "",
    };
    await save(empty);
  }

  function subscribeToChanges() {
    if (!supabase || !isSupabaseConfigured || realtimeChannel) return;
    realtimeChannel = supabase.channel("page-audit-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "page_audit_entries" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "model_year_vehicle_awards" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "model_year_vehicles" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "changeover_entries" }, () => void load())
      .subscribe();
  }

  function stopRealtime() {
    if (supabase && realtimeChannel) void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  return { entries, deadModelYearVehicleIds, selectedYear, isLoading, isSaving, error, load, save, addVehicle, subscribeToChanges, stopRealtime };
});

function mapRow(row: DbPageAuditEntry): PageAuditEntry {
  const vehicle = one(row.model_year_vehicles);
  const model = vehicle ? one(vehicle.models) : null;
  const make = model ? one(model.makes) : null;
  const segmentNames = vehicle?.model_year_vehicle_segments
    .flatMap((assignment) => one(assignment.segments)?.name ?? []) ?? [];
  return {
    id: row.id,
    modelYearVehicleId: row.model_year_vehicle_id,
    authorId: row.author_id,
    authorName: one(row.authors)?.label ?? row.author_names ?? "",
    modelYear: vehicle?.model_year ?? 0,
    make: make?.name ?? "",
    model: model ? formatModelName(model.name) : "",
    segment: segmentNames.join(", "),
    rating: vehicle?.rating === null || vehicle?.rating === undefined ? null : Number(vehicle.rating),
    publicUrl: vehicle?.public_url ?? "",
    pageStatus: row.page_status ?? "",
    checklist: row.checklist ?? {},
    awards: { tenBest: Boolean(row.awards?.tenBest), editorsChoice: Boolean(row.awards?.editorsChoice) },
    auditorInitials: row.auditor_initials ?? "",
    auditedAt: row.audited_at ?? "",
    doubleCheckInfo: row.double_check_info,
    auditNotes: row.audit_notes ?? "",
  };
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value as T;
}

async function fetchAllPages<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
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
