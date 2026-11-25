import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { mapTask } from "@/lib/supabase-data";
import { useAuthStore } from "@/stores/auth";
import { mapChangeoverRow, useChangeoverStore } from "@/stores/changeover";
import { useCatalogStore, type ModelYearVehicleOption } from "@/stores/catalog";
import { usePageAuditStore, mapPageAuditRow } from "@/stores/pageAudit";
import { mapRankingRow, useRankingsStore } from "@/stores/rankings";

vi.mock("@/lib/supabase", () => ({ supabase: null, isSupabaseConfigured: false }));

const vehicle = (id: string, model: string, year = 2027, segmentId = "cars"): ModelYearVehicleOption => ({
  id,
  modelId: `${id}-model`,
  makeId: "acme",
  make: "Acme",
  model,
  modelYear: year,
  segmentId,
  segment: "Family Cars",
  segments: [{ id: segmentId, name: "Family Cars", active: true, bodyStyle: "cars" }],
  rating: 8.5,
  awards: { ten_best: [], editors_choice: [], ev_of_the_year: [] },
});

describe("Changeover workflows", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("keeps published URLs separate from resource URLs and saves the year deadline", async () => {
    const catalog = useCatalogStore();
    catalog.modelYearRecords = [{ year: 2027, state: "active", isDefault: true }];
    catalog.modelYears = [2027];
    const store = useChangeoverStore();
    await store.load(2027);

    await store.addEntry(vehicle("vehicle-1", "Sedan"), {
      status: "published",
      assignedAuthorId: null,
      notes: "  published page  ",
      publicUrl: " https://example.com/acme-sedan ",
      resourceUrl: "https://example.com/press-kit",
    });
    await store.addEntry(vehicle("vehicle-2", "SUV"), {
      status: "info_available",
      assignedAuthorId: null,
      notes: "press materials",
      publicUrl: "https://example.com/not-published",
      resourceUrl: " https://example.com/press-kit ",
    });

    expect(store.entries.find((entry) => entry.model === "Sedan")).toMatchObject({
      publicUrl: "https://example.com/acme-sedan",
      resourceUrl: "",
      notes: "published page",
    });
    expect(store.entries.find((entry) => entry.model === "SUV")).toMatchObject({
      publicUrl: "",
      resourceUrl: "https://example.com/press-kit",
    });

    await store.updateDeadline(2027, "2027-06-30");
    await store.load(2027);
    expect(store.years[0]?.deadline).toBe("2027-06-30");
  });

  it("rejects adding the same vehicle twice to one model-year list", async () => {
    const catalog = useCatalogStore();
    catalog.modelYearRecords = [{ year: 2027, state: "active", isDefault: true }];
    const store = useChangeoverStore();
    await store.load(2027);
    const item = vehicle("duplicate-vehicle", "Crossover");
    const input = { status: "awaiting_info" as const, assignedAuthorId: null, notes: "", publicUrl: "", resourceUrl: "" };
    await store.addEntry(item, input);
    await expect(store.addEntry(item, input)).rejects.toThrow("already on the 2027 Changeover list");
  });
});

describe("Page Audit workflow", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("loads the selected year and refuses to pretend an offline audit was saved", async () => {
    const catalog = useCatalogStore();
    catalog.modelYearRecords = [{ year: 2026, state: "prior", isDefault: false }, { year: 2027, state: "active", isDefault: true }];
    const store = usePageAuditStore();
    await store.load(2026);
    expect(store.selectedYear).toBe(2026);
    expect(store.entries).toEqual([]);

    await expect(store.addVehicle(vehicle("audit-vehicle", "Coupe", 2026)))
      .rejects.toThrow("Page Audit changes require the configured Supabase database");
    expect(store.error).toContain("require the configured Supabase database");
  });
});

describe("Rankings workflows", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("ranks, reorders, changes state, and removes placements without leaving rank gaps", async () => {
    const catalog = useCatalogStore();
    const first = vehicle("rank-1", "Alpha");
    const second = vehicle("rank-2", "Bravo");
    const future = vehicle("rank-3", "Charlie", 2028);
    catalog.modelYearVehicles = [first, second, future];
    const store = useRankingsStore();
    await store.load(2027);

    await store.saveRankOrder("cars", [first.id, second.id]);
    expect(store.entries.filter((entry) => entry.segmentId === "cars").map((entry) => entry.rankPosition))
      .toEqual([1, 2]);

    await store.saveRankOrder("cars", [second.id, first.id]);
    expect(store.entries.find((entry) => entry.vehicleId === second.id)?.rankPosition).toBe(1);
    await store.setEntryState(first.id, "cars", "future");
    expect(store.entries.find((entry) => entry.vehicleId === first.id)).toMatchObject({ state: "future", rankPosition: null });

    await store.addPlacement(future.id, "cars", "future");
    expect(store.entries.find((entry) => entry.vehicleId === future.id)).toMatchObject({ modelYear: 2028, state: "future" });
    await store.removePlacement(second.id, "cars");
    expect(store.entries.some((entry) => entry.vehicleId === second.id)).toBe(false);
    expect(store.entries.find((entry) => entry.vehicleId === first.id)?.rankPosition).toBeNull();
  });

  it("uses Catalog as the shared rating and award source", async () => {
    const catalog = useCatalogStore();
    const rankedVehicle = vehicle("rated-vehicle", "Rated");
    catalog.modelYearVehicles = [rankedVehicle];
    const store = useRankingsStore();
    await store.load(2027);

    await expect(catalog.saveModelYearRating(rankedVehicle.id, 8.35)).rejects.toThrow("half-point steps");
    await store.saveRating(rankedVehicle.id, 9);
    await store.setAward(rankedVehicle.id, 2026, "ten_best", true);

    expect(store.entries[0]).toMatchObject({ rating: 9, awards: { ten_best: [2026] } });
    expect(catalog.modelYearVehicles[0]?.rating).toBe(9);
  });
});

describe("role access", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubGlobal("window", {
      location: { hash: "", search: "" },
      localStorage: { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() },
      clearTimeout: vi.fn(),
      setTimeout: vi.fn(() => 1),
    });
  });

  it("grants edit access only to Editors", () => {
    const store = useAuthStore();
    expect(store.isEditor).toBe(false);
    store.profile = { id: "editor", display_name: "Editor", role: "editor" };
    expect(store.isEditor).toBe(true);
    store.profile = { id: "viewer", display_name: "Viewer", role: "viewer" };
    expect(store.isEditor).toBe(false);
    store.profile = null;
    expect(store.isEditor).toBe(false);
  });
});

describe("database row mappings", () => {
  it("maps Changeover joins and preserves the original author for review", () => {
    const row = {
      id: "changeover-1",
      model_year_vehicle_id: "vehicle-1",
      status: "awaiting_info",
      assigned_author_id: null,
      notes: "No changes expected",
      source_provenance: [{ raw_author: "Open", author_reviewed: true }],
      resource_url: "https://example.com/source",
      authors: null,
      model_year_vehicles: {
        id: "vehicle-1", model_id: "model-1", model_year: 2027, public_url: null,
        models: { id: "model-1", name: "0-Series Saloon", make_id: "honda", makes: { name: "Honda" } },
        model_year_vehicle_segments: [{ segments: { name: "Family Cars" } }, { segments: { name: "Electric Cars" } }],
      },
    } as unknown as Parameters<typeof mapChangeoverRow>[0];

    expect(mapChangeoverRow(row)).toMatchObject({
      model: "0-Series Saloon",
      segment: "Family Cars, Electric Cars",
      isOpen: true,
      resourceUrl: "https://example.com/source",
    });
  });

  it("maps Page Audit shared rating, awards, checklist, and multiple segments", () => {
    const row = {
      id: "audit-1",
      model_year_vehicle_id: "vehicle-1",
      author_id: "author-1",
      author_names: "Andrew Wendler",
      authors: { label: "Andrew Wendler" },
      page_status: "RPS-IT/CT",
      checklist: { pricing_under_lead_image: "Yes" },
      awards: { tenBest: true, editorsChoice: false, evOfTheYear: true },
      auditor_initials: "AB",
      audited_at: "2026-10-05",
      double_check_info: true,
      audit_notes: "Review after press release",
      model_year_vehicles: {
        model_year: 2027, public_url: "https://example.com/page", rating: "9.5",
        models: { name: "Model S", makes: { name: "Tesla" } },
        model_year_vehicle_segments: [{ segments: { name: "Electric Cars" } }, { segments: { name: "Luxury Cars" } }],
      },
    } as unknown as Parameters<typeof mapPageAuditRow>[0];

    expect(mapPageAuditRow(row)).toMatchObject({
      rating: 9.5,
      segment: "Electric Cars, Luxury Cars",
      publicUrl: "https://example.com/page",
      awards: { tenBest: true, editorsChoice: false, evOfTheYear: true },
      doubleCheckInfo: true,
    });
  });

  it("maps Rankings placement state, shared rating, and award history", () => {
    const row = {
      model_year_vehicle_id: "vehicle-1",
      ranking_year: 2027,
      segment_id: "segment-1",
      rank_position: 3,
      entry_state: "ranked",
      segments: { id: "segment-1", name: "Electric Cars", body_style: "cars" },
      model_year_vehicles: {
        model_year: 2028, rating: "8.5", public_url: null,
        models: { name: "EV Sedan", makes: { name: "Acme" } },
      },
    } as unknown as Parameters<typeof mapRankingRow>[0];

    expect(mapRankingRow(row, { ten_best: [2026], editors_choice: [], ev_of_the_year: [2027] })).toMatchObject({
      modelYear: 2028,
      state: "ranked",
      rankPosition: 3,
      rating: 8.5,
      awards: { ten_best: [2026], ev_of_the_year: [2027] },
    });
  });

  it("maps persisted task status, event tags, segments, and resources", () => {
    const row = {
      id: "task-1", model_year_vehicle_id: "vehicle-1", author_id: null, status: "pending_edits",
      task_kind: "new_mmp", high_priority: false, deadline: null, notes: "Ready in iMeet",
      tags: ["Auto Show"], embargo_at: null, embargo_notes: "", published_at: null,
      created_at: "2026-11-24T10:00:00Z", updated_at: "2026-11-24T11:00:00Z",
      model_year_vehicles: {
        id: "vehicle-1", model_year: 2027,
        model_year_vehicle_segments: [{ segments: [{ name: "Cars" }, { name: "Electric Cars" }] }],
        models: { name: "E-Sedan", makes: { name: "Acme" } },
      },
      task_resources: [{ id: "asset-1", kind: "imeet", label: "iMeet", url: "https://example.com", notes: "" }],
    } as unknown as Parameters<typeof mapTask>[0];

    expect(mapTask(row)).toMatchObject({
      status: "rte",
      tags: ["Auto Show"],
      vehicle: { segment: "Cars, Electric Cars", modelYear: 2027 },
      assets: [{ id: "asset-1", kind: "imeet" }],
    });
  });
});
