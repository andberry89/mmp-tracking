import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import type { TaskDocument } from "@/types";
import { useDocumentsStore } from "@/stores/documents";
import { fetchTaskById, fetchTasksForVehicle } from "@/lib/supabase-data";

const realtime = vi.hoisted(() => {
  const handlers: Array<{ filter: { table: string }; callback: (payload: Record<string, unknown>) => void }> = [];
  const channel = {
    on(_event: string, filter: { table: string }, callback: (payload: Record<string, unknown>) => void) {
      handlers.push({ filter, callback });
      return channel;
    },
    subscribe() { return channel; },
  };
  return {
    handlers,
    client: {
      channel: () => channel,
      removeChannel: vi.fn(async () => undefined),
    },
  };
});

vi.mock("@/lib/supabase", () => ({ supabase: realtime.client, isSupabaseConfigured: true }));
vi.mock("@/lib/supabase-data", () => ({
  fetchTaskById: vi.fn(),
  fetchTasksForVehicle: vi.fn(),
  fetchTasks: vi.fn(),
}));

const task = (id: string, vehicleId: string, overrides: Partial<TaskDocument> = {}): TaskDocument => ({
  id,
  modelYearVehicleId: vehicleId,
  highPriority: false,
  vehicle: { make: "Acme", model: id, segment: "Cars", modelYear: 2027 },
  authorId: null,
  deadline: "",
  status: "pending",
  notes: "",
  assets: [],
  embargoDate: "",
  embargoNotes: "",
  embargo: false,
  published: false,
  new: true,
  publishedDate: "",
  ...overrides,
});

const waitForRealtimeQueue = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("task realtime collaboration", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    realtime.handlers.splice(0);
    vi.mocked(fetchTaskById).mockReset();
    vi.mocked(fetchTasksForVehicle).mockReset();
  });

  afterEach(() => {
    useDocumentsStore().stopRealtime();
  });

  it("refreshes only the changed task and applies the latest shared version", async () => {
    const store = useDocumentsStore();
    store.setDocuments([task("task-1", "vehicle-1"), task("task-2", "vehicle-2")]);
    vi.mocked(fetchTaskById).mockResolvedValue(task("task-1", "vehicle-1", { notes: "updated by teammate" }));
    store.subscribeToChanges();

    const taskHandler = realtime.handlers.find((handler) => handler.filter.table === "mmp_tasks");
    expect(taskHandler).toBeDefined();
    taskHandler?.callback({ eventType: "UPDATE", new: { id: "task-1" }, old: {} });
    await waitForRealtimeQueue();

    expect(fetchTaskById).toHaveBeenCalledExactlyOnceWith("task-1");
    expect(store.documents.find((item) => item.id === "task-1")?.notes).toBe("updated by teammate");
    expect(store.documents.map((item) => item.id)).toEqual(["task-1", "task-2"]);
  });

  it("removes a deleted task without reloading the rest of the task list", async () => {
    const store = useDocumentsStore();
    store.setDocuments([task("task-1", "vehicle-1"), task("task-2", "vehicle-2")]);
    store.subscribeToChanges();

    realtime.handlers.find((handler) => handler.filter.table === "mmp_tasks")?.callback({
      eventType: "DELETE", old: { id: "task-1" }, new: {},
    });
    await waitForRealtimeQueue();

    expect(fetchTaskById).not.toHaveBeenCalled();
    expect(store.documents.map((item) => item.id)).toEqual(["task-2"]);
  });

  it("refreshes records for the affected vehicle and preserves other vehicles", async () => {
    const store = useDocumentsStore();
    store.setDocuments([
      task("keep", "vehicle-2"),
      task("old-vehicle-task", "vehicle-1"),
    ]);
    vi.mocked(fetchTasksForVehicle).mockResolvedValue([task("latest-vehicle-task", "vehicle-1", { notes: "new task on same vehicle" })]);
    store.subscribeToChanges();

    realtime.handlers.find((handler) => handler.filter.table === "model_year_vehicles")?.callback({
      eventType: "UPDATE", old: {}, new: { id: "vehicle-1" },
    });
    await waitForRealtimeQueue();

    expect(fetchTasksForVehicle).toHaveBeenCalledExactlyOnceWith("vehicle-1");
    expect(store.documents.map((item) => item.id).sort()).toEqual(["keep", "latest-vehicle-task"]);
  });

  it("ignores an already queued event after realtime is stopped", async () => {
    const store = useDocumentsStore();
    store.setDocuments([task("task-1", "vehicle-1")]);
    store.subscribeToChanges();
    const taskHandler = realtime.handlers.find((handler) => handler.filter.table === "mmp_tasks");
    store.stopRealtime();

    taskHandler?.callback({ eventType: "UPDATE", new: { id: "task-1" }, old: {} });
    await waitForRealtimeQueue();

    expect(fetchTaskById).not.toHaveBeenCalled();
    expect(realtime.client.removeChannel).toHaveBeenCalled();
  });
});
