import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useRankingsStore, type RankingEntry } from "@/stores/rankings";

const database = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: database, isSupabaseConfigured: true }));

const entry = (vehicleId: string, rankPosition: number | null): RankingEntry => ({
  vehicleId,
  modelYear: 2027,
  make: "Acme",
  model: vehicleId,
  segmentId: "cars",
  segment: "Cars",
  bodyStyle: "cars",
  rankPosition,
  state: rankPosition === null ? "unranked" : "ranked",
  rating: 8,
  publicUrl: "",
  awards: { ten_best: [], editors_choice: [], ev_of_the_year: [] },
});

describe("persisted Rankings edits", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    database.rpc.mockReset();
    database.rpc.mockResolvedValue({ error: null });
  });

  it("persists a new order and reflects it in the visible list", async () => {
    const store = useRankingsStore();
    store.selectedYear = 2027;
    store.entries = [entry("first", 1), entry("second", 2)];

    await store.saveRankOrder("cars", ["second", "first"]);

    expect(database.rpc).toHaveBeenCalledExactlyOnceWith("save_rankings_placement_order", {
      p_ranking_year: 2027,
      p_segment_id: "cars",
      p_vehicle_ids: ["second", "first"],
    });
    expect(store.entries.map((item) => [item.vehicleId, item.rankPosition])).toEqual([
      ["first", 2],
      ["second", 1],
    ]);
  });

  it("restores the previous order when the database rejects a save", async () => {
    const store = useRankingsStore();
    store.selectedYear = 2027;
    store.entries = [entry("first", 1), entry("second", 2)];
    database.rpc.mockResolvedValue({ error: new Error("write rejected") });

    await expect(store.saveRankOrder("cars", ["second", "first"])).rejects.toThrow("write rejected");
    expect(store.entries.map((item) => [item.vehicleId, item.rankPosition])).toEqual([
      ["first", 1],
      ["second", 2],
    ]);
    expect(store.error).toBe("write rejected");
  });
});
