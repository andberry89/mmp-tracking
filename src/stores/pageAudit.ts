import { defineStore } from "pinia";
import { ref } from "vue";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useCatalogStore, type ModelYearVehicleOption } from "@/stores/catalog";

export type AuditChecklist = Record<string, string>;
export interface AuditAwards { tenBest: boolean; editorsChoice: boolean }

export interface PageAuditEntry {
  id: string;
  modelYearVehicleId: string;
  modelYear: number;
  make: string;
  model: string;
  segment: string;
  publicUrl: string;
  pageStatus: string;
  checklist: AuditChecklist;
  awards: AuditAwards;
  authorNames: string;
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
  authorNames: string;
  auditorInitials: string;
  auditedAt: string;
  doubleCheckInfo: boolean;
  auditNotes: string;
}

type DbPageAuditEntry = {
  id: string;
  model_year_vehicle_id: string;
  page_status: string;
  checklist: AuditChecklist | null;
  awards: AuditAwards | null;
  author_names: string;
  auditor_initials: string;
  audited_at: string | null;
  double_check_info: boolean;
  audit_notes: string;
  model_year_vehicles: {
    model_year: number;
    public_url: string | null;
    models: { name: string; makes: { name: string } | { name: string }[] | null } | { name: string; makes: { name: string } | { name: string }[] | null }[];
    segments: { name: string } | { name: string }[] | null;
  } | {
    model_year: number;
    public_url: string | null;
    models: { name: string; makes: { name: string } | { name: string }[] | null } | { name: string; makes: { name: string } | { name: string }[] | null }[];
    segments: { name: string } | { name: string }[] | null;
  }[];
};

export const usePageAuditStore = defineStore("pageAudit", () => {
  const catalog = useCatalogStore();
  const entries = ref<PageAuditEntry[]>([]);
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
        return;
      }
      selectedYear.value = year ?? catalog.modelYearRecords.find((item) => item.isDefault)?.year ?? catalog.modelYears[0] ?? null;
      if (selectedYear.value === null) { entries.value = []; return; }
      const rows = await fetchAllPages((from, to) => supabase
        .from("page_audit_entries")
        .select("id, model_year_vehicle_id, page_status, checklist, awards, author_names, auditor_initials, audited_at, double_check_info, audit_notes, model_year_vehicles!inner(model_year, public_url, models!inner(name, makes!inner(name)), segments(name))")
        .eq("model_year_vehicles.model_year", selectedYear.value)
        .order("id")
        .range(from, to));
      entries.value = (rows as unknown as DbPageAuditEntry[]).map(mapRow);
    } catch (reason) {
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
      page_status: input.pageStatus.trim(),
      checklist: input.checklist,
      awards: input.awards,
      author_names: input.authorNames.trim(),
      auditor_initials: input.auditorInitials.trim(),
      audited_at: input.auditedAt || null,
      double_check_info: input.doubleCheckInfo,
      audit_notes: input.auditNotes.trim(),
    };
    try {
      if (!supabase || !isSupabaseConfigured) {
        throw new Error("Page Audit changes require the configured Supabase database.");
      }
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
      authorNames: "",
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
      .on("postgres_changes", { event: "*", schema: "public", table: "model_year_vehicles" }, () => void load())
      .subscribe();
  }

  function stopRealtime() {
    if (supabase && realtimeChannel) void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  return { entries, selectedYear, isLoading, isSaving, error, load, save, addVehicle, subscribeToChanges, stopRealtime };
});

function mapRow(row: DbPageAuditEntry): PageAuditEntry {
  const vehicle = one(row.model_year_vehicles);
  const model = vehicle ? one(vehicle.models) : null;
  const make = model ? one(model.makes) : null;
  const segment = vehicle ? one(vehicle.segments) : null;
  return {
    id: row.id,
    modelYearVehicleId: row.model_year_vehicle_id,
    modelYear: vehicle?.model_year ?? 0,
    make: make?.name ?? "",
    model: model?.name ?? "",
    segment: segment?.name ?? "",
    publicUrl: vehicle?.public_url ?? "",
    pageStatus: row.page_status ?? "",
    checklist: row.checklist ?? {},
    awards: { tenBest: Boolean(row.awards?.tenBest), editorsChoice: Boolean(row.awards?.editorsChoice) },
    authorNames: row.author_names ?? "",
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
