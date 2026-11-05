import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { formatModelName } from "@/utils/format-model-name";
import { useCatalogStore, type BodyStyle, type ModelYearVehicleOption } from "@/stores/catalog";

export type RankingAward = "ten_best" | "editors_choice";

export interface RankingEntry {
  vehicleId: string;
  modelYear: number;
  make: string;
  model: string;
  segmentId: string;
  segment: string;
  bodyStyle: BodyStyle | null;
  rankPosition: number | null;
  state: "ranked" | "unranked" | "future";
  rating: number | null;
  publicUrl: string;
  awards: { ten_best: number[]; editors_choice: number[] };
}

interface RankingRow {
  model_year_vehicle_id: string;
  model_year: number;
  segment_id: string;
  rank_position: number | null;
  entry_state: RankingEntry["state"];
  segments: { id: string; name: string; body_style: BodyStyle | null } | { id: string; name: string; body_style: BodyStyle | null }[] | null;
  model_year_vehicles: {
    rating: number | string | null;
    public_url: string | null;
    models: { name: string; makes: { name: string } | { name: string }[] | null } | { name: string; makes: { name: string } | { name: string }[] | null }[];
  } | {
    rating: number | string | null;
    public_url: string | null;
    models: { name: string; makes: { name: string } | { name: string }[] | null } | { name: string; makes: { name: string } | { name: string }[] | null }[];
  }[];
}

interface AwardRow {
  model_year_vehicle_id: string;
  award_year: number;
  award_type: RankingAward;
}

export const useRankingsStore = defineStore("rankings", () => {
  const catalog = useCatalogStore();
  const entries = ref<RankingEntry[]>([]);
  const selectedYear = ref<number | null>(null);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);
  let realtimeChannel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
  let requestId = 0;

  const years = computed(() => catalog.modelYears);
  const bodyStyles = computed(() => [...new Set(entries.value.map((entry) => entry.bodyStyle).filter((style): style is BodyStyle => Boolean(style)))]);

  async function load(year = selectedYear.value ?? catalog.modelYearRecords.find((item) => item.isDefault)?.year ?? 2027) {
    const currentRequest = ++requestId;
    selectedYear.value = year;
    isLoading.value = true;
    error.value = null;
    try {
      if (!supabase || !isSupabaseConfigured) {
        entries.value = catalog.modelYearVehicles
          .filter((vehicle) => vehicle.modelYear === year)
          .flatMap((vehicle) => vehicle.segments.map((segment) => mapDemoEntry(vehicle, segment.id, segment.name, segment.bodyStyle)));
        return;
      }

      const [rankingResult, awardResult] = await Promise.all([
        supabase.from("model_year_vehicle_segments")
          .select("model_year_vehicle_id, model_year, segment_id, rank_position, entry_state, segments!inner(id, name, body_style), model_year_vehicles!inner(rating, public_url, models!inner(name, makes!inner(name)))")
          .eq("model_year", year)
          .order("segment_id")
          .order("rank_position", { ascending: true, nullsFirst: false }),
        supabase.from("model_year_vehicle_awards")
          .select("model_year_vehicle_id, award_year, award_type, model_year_vehicles!inner(model_year)")
          .eq("model_year_vehicles.model_year", year),
      ]);
      if (rankingResult.error) throw rankingResult.error;
      if (awardResult.error) throw awardResult.error;
      if (currentRequest !== requestId) return;

      const awardRows = (awardResult.data ?? []) as unknown as AwardRow[];
      const awardsByVehicle = new Map<string, { ten_best: number[]; editors_choice: number[] }>();
      for (const award of awardRows) {
        const awards = awardsByVehicle.get(award.model_year_vehicle_id) ?? { ten_best: [], editors_choice: [] };
        awards[award.award_type].push(award.award_year);
        awardsByVehicle.set(award.model_year_vehicle_id, awards);
      }
      entries.value = ((rankingResult.data ?? []) as unknown as RankingRow[]).map((row) => mapRow(row, awardsByVehicle.get(row.model_year_vehicle_id)));
    } catch (reason) {
      if (currentRequest === requestId) {
        error.value = reason instanceof Error ? reason.message : "Unable to load Rankings.";
        entries.value = [];
      }
    } finally {
      if (currentRequest === requestId) isLoading.value = false;
    }
  }

  async function saveRating(vehicleId: string, rating: number | null) {
    isSaving.value = true;
    error.value = null;
    try {
      await catalog.saveModelYearRating(vehicleId, rating);
      entries.value.forEach((entry) => { if (entry.vehicleId === vehicleId) entry.rating = rating; });
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "Could not save the rating.";
      throw reason;
    } finally {
      isSaving.value = false;
    }
  }

  async function saveRankOrder(segmentId: string, vehicleIds: string[]) {
    const affected = entries.value.filter((entry) => entry.segmentId === segmentId);
    const previous = affected.map((entry) => ({ entry, rankPosition: entry.rankPosition, state: entry.state }));
    affected.forEach((entry) => {
      const position = vehicleIds.indexOf(entry.vehicleId);
      if (position >= 0) {
        entry.rankPosition = position + 1;
        entry.state = "ranked";
      } else if (entry.state === "ranked") {
        entry.rankPosition = null;
        entry.state = "unranked";
      }
    });
    if (!selectedYear.value || !supabase || !isSupabaseConfigured) return;

    isSaving.value = true;
    error.value = null;
    try {
      const { error: saveError } = await supabase.rpc("save_model_year_segment_order", {
        p_model_year: selectedYear.value,
        p_segment_id: segmentId,
        p_vehicle_ids: vehicleIds,
      });
      if (saveError) throw saveError;
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "Could not save this segment order.";
      previous.forEach((snapshot) => {
        snapshot.entry.rankPosition = snapshot.rankPosition;
        snapshot.entry.state = snapshot.state;
      });
      throw reason;
    } finally {
      isSaving.value = false;
    }
  }

  async function setEntryState(vehicleId: string, segmentId: string, state: "unranked" | "future") {
    const entry = entries.value.find((item) => item.vehicleId === vehicleId && item.segmentId === segmentId);
    if (!entry) return;
    isSaving.value = true;
    error.value = null;
    try {
      if (supabase && isSupabaseConfigured) {
        const { error: saveError } = await supabase.from("model_year_vehicle_segments")
          .update({ entry_state: state, rank_position: null })
          .eq("model_year_vehicle_id", vehicleId)
          .eq("segment_id", segmentId);
        if (saveError) throw saveError;
      }
      entry.state = state;
      entry.rankPosition = null;
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "Could not update the ranking state.";
      throw reason;
    } finally {
      isSaving.value = false;
    }
  }

  async function setAward(vehicleId: string, awardYear: number, awardType: RankingAward, awarded: boolean) {
    try {
      await catalog.saveModelYearAward(vehicleId, awardYear, awardType, awarded);
      updateLocalAward(vehicleId, awardYear, awardType, awarded);
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "Could not save the award.";
      throw reason;
    }
  }

  function updateLocalAward(vehicleId: string, awardYear: number, awardType: RankingAward, awarded: boolean) {
    entries.value.filter((entry) => entry.vehicleId === vehicleId).forEach((entry) => {
      const years = entry.awards[awardType];
      if (awarded && !years.includes(awardYear)) years.push(awardYear);
      if (!awarded) entry.awards[awardType] = years.filter((year) => year !== awardYear);
    });
  }

  function subscribeToChanges() {
    if (!supabase || !isSupabaseConfigured || realtimeChannel) return;
    realtimeChannel = supabase.channel("rankings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "model_year_vehicle_segments" }, (payload) => {
        const row = (payload.eventType === "DELETE" ? payload.old : payload.new) as { model_year_vehicle_id?: string; model_year?: number; segment_id?: string; rank_position?: number | null; entry_state?: RankingEntry["state"] };
        if (payload.eventType === "DELETE") {
          entries.value = entries.value.filter((item) => !(item.vehicleId === row.model_year_vehicle_id && item.segmentId === row.segment_id));
          return;
        }
        if (row.model_year !== selectedYear.value) return;
        if (payload.eventType === "INSERT") {
          void load(selectedYear.value ?? undefined);
          return;
        }
        const entry = entries.value.find((item) => item.vehicleId === row.model_year_vehicle_id && item.segmentId === row.segment_id);
        if (entry) {
          entry.rankPosition = row.rank_position ?? null;
          entry.state = row.entry_state ?? "unranked";
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "model_year_vehicle_awards" }, (payload) => {
        const row = (payload.eventType === "DELETE" ? payload.old : payload.new) as { model_year_vehicle_id?: string; award_year?: number; award_type?: RankingAward };
        if (!row.model_year_vehicle_id || !row.award_year || !row.award_type) return;
        updateLocalAward(row.model_year_vehicle_id, row.award_year, row.award_type, payload.eventType !== "DELETE");
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "model_year_vehicles" }, (payload) => {
        const row = payload.new as { id?: string; rating?: number | null; public_url?: string | null };
        if (!row.id) return;
        entries.value.filter((entry) => entry.vehicleId === row.id).forEach((entry) => {
          entry.rating = row.rating === null || row.rating === undefined ? null : Number(row.rating);
          entry.publicUrl = row.public_url ?? "";
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "segments" }, () => void load())
      .subscribe();
  }

  function stopRealtime() {
    requestId += 1;
    if (supabase && realtimeChannel) void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  return { entries, years, bodyStyles, selectedYear, isLoading, isSaving, error, load, saveRating, saveRankOrder, setEntryState, setAward, subscribeToChanges, stopRealtime };
});

function mapRow(row: RankingRow, awards?: { ten_best: number[]; editors_choice: number[] }): RankingEntry {
  const segment = one(row.segments);
  const vehicle = one(row.model_year_vehicles);
  const model = vehicle ? one(vehicle.models) : null;
  const make = model ? one(model.makes) : null;
  return {
    vehicleId: row.model_year_vehicle_id,
    modelYear: row.model_year,
    make: make?.name ?? "",
    model: model ? formatModelName(model.name) : "",
    segmentId: row.segment_id,
    segment: segment?.name ?? "",
    bodyStyle: segment?.body_style ?? null,
    rankPosition: row.rank_position,
    state: row.entry_state,
    rating: vehicle?.rating === null || vehicle?.rating === undefined ? null : Number(vehicle.rating),
    publicUrl: vehicle?.public_url ?? "",
    awards: awards ?? { ten_best: [], editors_choice: [] },
  };
}

function mapDemoEntry(vehicle: ModelYearVehicleOption, segmentId: string, segment: string, bodyStyle: BodyStyle | null): RankingEntry {
  return {
    vehicleId: vehicle.id,
    modelYear: vehicle.modelYear,
    make: vehicle.make,
    model: vehicle.model,
    segmentId,
    segment,
    bodyStyle,
    rankPosition: null,
    state: "unranked",
    rating: vehicle.rating,
    publicUrl: vehicle.publicUrl ?? "",
    awards: { ten_best: [], editors_choice: [] },
  };
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value as T;
}
