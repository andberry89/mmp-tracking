import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { applyTaskRules } from "@/utils/apply-task-rules";
import { sortDocuments } from "@/utils/sort-functions";
import { testDocuments } from "@/test";
import { fetchTaskById, fetchTasks, fetchTasksForVehicle } from "@/lib/supabase-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

import type { NewTaskInput, TaskDocument, TaskStatus, TaskAsset, TaskResourceInput, Author, TaskVehicle } from "@/types";

export const useDocumentsStore = defineStore("documents", () => {
  // ------------------------------
  // STATE
  // ------------------------------
  const documents = ref<TaskDocument[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const hasLoaded = ref(false);
  const isSaving = ref(false);
  let realtimeChannel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
  let realtimeGeneration = 0;
  let realtimeRefreshQueue: Promise<void> = Promise.resolve();

  // ------------------------------
  // GETTERS
  // ------------------------------
  const getDocumentById = (id: string) =>
    computed(() => documents.value.find((doc) => doc.id === id));

  const getDocumentsByStatus = (status: TaskStatus) =>
    computed(() => documents.value.filter((doc) => doc.status === status));

  const pendingCount = computed(
    () => documents.value.filter((doc) => doc.status === "pending").length
  );

  const sortedBySection = computed(() => {
    return sortDocuments(documents.value);
  });

  // ------------------------------
  // ACTIONS — Core Mutators
  // ------------------------------
  function setDocuments(list: TaskDocument[]) {
    documents.value = list.map((doc) => applyTaskRules(doc));
    hasLoaded.value = true;
  }

  function insertDocument(doc: TaskDocument) {
    documents.value.unshift(applyTaskRules(doc));
  }

  function upsertDocument(doc: TaskDocument) {
    const index = documents.value.findIndex((current) => current.id === doc.id);
    const normalized = applyTaskRules(doc);
    if (index === -1) documents.value.unshift(normalized);
    else documents.value.splice(index, 1, normalized);
  }

  function removeDocument(id: string) {
    documents.value = documents.value.filter((doc) => doc.id !== id);
  }

  async function createDocument(input: NewTaskInput): Promise<boolean> {
    isSaving.value = true;
    error.value = null;

    if ((!isSupabaseConfigured || !supabase) && input.materials.some((material) => material.password)) {
      error.value = "Password storage requires the Supabase connection to be configured.";
      isSaving.value = false;
      return false;
    }

    const databaseStatus = input.status === "rte" ? "pending_edits" : input.status;

    if (isSupabaseConfigured && supabase) {
      let createdTaskId: string | null = null;
      try {
        const { data: vehicleRow, error: vehicleError } = await supabase
          .from("model_year_vehicles")
          .upsert(
            { model_id: input.modelId, model_year: input.modelYear, segment_id: input.segmentId },
            { onConflict: "model_id,model_year" }
          )
          .select("id")
          .single();
        if (vehicleError) throw vehicleError;

        const { data: taskRow, error: taskError } = await supabase
          .from("mmp_tasks")
          .insert({
            model_year_vehicle_id: vehicleRow.id,
            author_id: input.authorId,
            status: databaseStatus,
            task_kind: input.isUpdate ? "update" : "new_mmp",
            deadline: input.deadline || null,
            notes: input.notes,
            embargo_at: toTimestamp(input.embargoDate),
            embargo_notes: input.embargoNotes,
          })
          .select("id")
          .single();
        if (taskError) throw taskError;
        createdTaskId = taskRow.id;

        const resources = [
          ...(input.imeetUrl
            ? [{ kind: "imeet" as const, label: "iMeet", url: input.imeetUrl, notes: "" }]
            : []),
          ...input.materials.map((material) => ({
            kind: "material" as const,
            label: material.label,
            url: material.url,
            notes: material.notes,
            password: material.password,
          })),
        ];

        for (const resource of resources) {
          const { data: resourceRow, error: resourceError } = await supabase
            .from("task_resources")
            .insert({
              task_id: createdTaskId,
              kind: resource.kind,
              label: resource.label,
              url: resource.url,
              notes: resource.notes,
            })
            .select("id")
            .single();
          if (resourceError) throw resourceError;

          if ("password" in resource && resource.password) {
            const { error: secretError } = await supabase
              .from("task_resource_secrets")
              .insert({ resource_id: resourceRow.id, password: resource.password });
            if (secretError) throw secretError;
          }
        }

        await loadDocuments();
        return true;
      } catch (reason) {
        if (createdTaskId) {
          await supabase.from("mmp_tasks").delete().eq("id", createdTaskId);
        }
        error.value = reason instanceof Error ? reason.message : "Unable to create the task.";
        return false;
      } finally {
        isSaving.value = false;
      }
    }

    const demoTask: TaskDocument = {
      id: crypto.randomUUID?.() ?? `task-${Date.now()}`,
      modelYearVehicleId: `demo-vehicle:${input.modelId}:${input.modelYear}`,
      createdDate: new Date().toISOString(),
      updatedDate: [],
      highPriority: false,
      vehicle: {
        make: input.make,
        model: input.model,
        segment: input.segment,
        modelYear: input.modelYear,
      },
      authorId: input.authorId,
      deadline: input.deadline,
      status: input.status,
      notes: input.notes,
      assets: [
        ...(input.imeetUrl
          ? [{ kind: "imeet" as const, label: "iMeet", url: input.imeetUrl, notes: "" }]
          : []),
        ...input.materials.map((material) => ({
          kind: "material" as const,
          label: material.label,
          url: material.url,
          notes: material.notes,
        })),
      ],
      embargoDate: input.embargoDate,
      embargoNotes: input.embargoNotes,
      embargo: Boolean(input.embargoDate),
      published: input.status === "published" || input.status === "updated",
      new: !input.isUpdate,
      publishedDate:
        input.status === "published" || input.status === "updated"
          ? input.embargoDate || new Date().toISOString()
          : "",
    };

    insertDocument(demoTask);
    isSaving.value = false;
    return true;
  }

  // ------------------------------
  // ACTIONS — Loading with Test Fallback
  // ------------------------------
  async function loadDocuments() {
    isLoading.value = true;
    error.value = null;

    try {
      if (isSupabaseConfigured) {
        setDocuments(await fetchTasks());
        return;
      }

      // Simulated API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Placeholder for API response
      const response: TaskDocument[] = [];

      if (!response || response.length === 0) {
        setDocuments(structuredClone(testDocuments));
      } else {
        setDocuments(response);
      }
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "Failed to load documents.";
      if (isSupabaseConfigured) {
        documents.value = [];
        hasLoaded.value = true;
      } else {
        setDocuments(structuredClone(testDocuments));
      }
    } finally {
      isLoading.value = false;
    }
  }

  function clearDocuments() {
    documents.value = [];
    hasLoaded.value = false;
  }

  function subscribeToChanges() {
    if (!supabase || !isSupabaseConfigured) return;
    if (realtimeChannel) void supabase.removeChannel(realtimeChannel);
    const generation = ++realtimeGeneration;

    realtimeChannel = supabase
      .channel("mmp-tracking-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "mmp_tasks" }, (payload) => {
        const taskId = payload.eventType === "DELETE" ? payload.old.id : payload.new.id;
        if (typeof taskId !== "string") return;
        queueRealtimeRefresh(async () => {
          if (payload.eventType === "DELETE") {
            removeDocument(taskId);
            return;
          }
          const latest = await fetchTaskById(taskId);
          if (generation !== realtimeGeneration) return;
          if (latest && isActiveTask(latest)) upsertDocument(latest);
          else removeDocument(taskId);
        }, generation);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "task_resources" }, (payload) => {
        const taskId = payload.eventType === "DELETE" ? payload.old.task_id : payload.new.task_id;
        if (typeof taskId !== "string") return;
        queueRealtimeRefresh(async () => {
          const latest = await fetchTaskById(taskId);
          if (generation !== realtimeGeneration) return;
          if (latest && isActiveTask(latest)) upsertDocument(latest);
          else removeDocument(taskId);
        }, generation);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "model_year_vehicles" }, (payload) => {
        const vehicleId = payload.eventType === "DELETE" ? payload.old.id : payload.new.id;
        if (typeof vehicleId !== "string") return;
        queueRealtimeRefresh(async () => {
          const latest = await fetchTasksForVehicle(vehicleId);
          if (generation !== realtimeGeneration) return;
          const activeLatest = latest.filter(isActiveTask);
          const latestIds = new Set(activeLatest.map((doc) => doc.id));
          documents.value = documents.value.filter((doc) =>
            doc.modelYearVehicleId !== vehicleId || latestIds.has(doc.id)
          );
          activeLatest.forEach(upsertDocument);
        }, generation);
      })
      .subscribe();
  }

  function stopRealtime() {
    realtimeGeneration += 1;
    if (!supabase || !realtimeChannel) return;
    void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  function queueRealtimeRefresh(refresh: () => Promise<void>, generation: number) {
    realtimeRefreshQueue = realtimeRefreshQueue
      .then(async () => {
        if (generation === realtimeGeneration) await refresh();
      })
      .catch((reason: unknown) => {
        if (generation !== realtimeGeneration) return;
        error.value = reason instanceof Error ? reason.message : "Unable to refresh the changed task.";
      });
  }

  // ------------------------------
  // ACTIONS — Updates
  // ------------------------------
  async function updateDocument(id: string, payload: Partial<TaskDocument>, baseDocument?: TaskDocument) {
    error.value = null;
    const idx = documents.value.findIndex((doc) => doc.id === id);
    const current = idx === -1 ? baseDocument : documents.value[idx];
    if (!current) return;

    const merged: TaskDocument = {
      ...current,
      ...payload,
    };

    if (isSupabaseConfigured && supabase) {
      const databasePayload: Record<string, unknown> = {};
      if ("authorId" in payload) databasePayload.author_id = payload.authorId;
      const clearsPublicationDate =
        payload.status !== undefined &&
        payload.status !== "published" &&
        payload.status !== "updated" &&
        (current.status === "published" || current.status === "updated");
      if ("status" in payload) {
        databasePayload.status = payload.status === "rte" ? "pending_edits" : payload.status;
        if (clearsPublicationDate) databasePayload.published_at = null;
      }
      if ("highPriority" in payload) databasePayload.high_priority = payload.highPriority;
      if ("deadline" in payload) databasePayload.deadline = payload.deadline || null;
      if ("notes" in payload) databasePayload.notes = payload.notes ?? "";
      if ("embargoNotes" in payload) databasePayload.embargo_notes = payload.embargoNotes ?? "";
      if ("embargoDate" in payload) databasePayload.embargo_at = toTimestamp(payload.embargoDate);
      if ("publishedDate" in payload && !clearsPublicationDate) {
        databasePayload.published_at = toTimestamp(payload.publishedDate);
      }
      if ("new" in payload) databasePayload.task_kind = payload.new ? "new_mmp" : "update";

      if (Object.keys(databasePayload).length) {
        const { data: updatedTaskRow, error: updateError } = await supabase
          .from("mmp_tasks")
          .update(databasePayload)
          .eq("id", id)
          .select("published_at")
          .maybeSingle();
        if (updateError) {
          error.value = updateError.message;
          return;
        }
        if (updatedTaskRow) merged.publishedDate = updatedTaskRow.published_at ?? "";
      }
      error.value = null;
    } else if (
      payload.status &&
      (payload.status === "published" || payload.status === "updated") &&
      current.status !== "published" &&
      current.status !== "updated" &&
      !("publishedDate" in payload)
    ) {
      merged.publishedDate = merged.embargoDate || new Date().toISOString();
    }

    if (isActiveTask(merged)) upsertDocument(merged);
    else removeDocument(id);
  }

  async function deleteDocument(id: string) {
    if (isSupabaseConfigured && supabase) {
      const { error: deleteError } = await supabase.from("mmp_tasks").delete().eq("id", id);
      if (deleteError) {
        error.value = deleteError.message;
        return;
      }
    }
    removeDocument(id);
    error.value = null;
  }

  async function duplicateDocument(id: string, baseDocument?: TaskDocument) {
    const original = documents.value.find((doc) => doc.id === id) ?? baseDocument;
    if (!original) return null;

    const newDoc: TaskDocument = {
      ...structuredClone(original),
      id: crypto.randomUUID?.() ?? `dup-${Date.now()}`,
      status: "pending",
      new: true,
      published: false,
      publishedDate: "",
    };

    if (isSupabaseConfigured && supabase) {
      const { data: newTaskId, error: duplicateError } = await supabase.rpc("duplicate_mmp_task", {
        p_task_id: id,
      });
      if (duplicateError || !newTaskId) {
        error.value = duplicateError?.message ?? "Could not duplicate this task.";
        return null;
      }

      newDoc.id = newTaskId as string;
      newDoc.assets = original.assets
        .filter((asset) => asset.kind === "material")
        .map(({ kind, label, url, notes }) => ({ kind, label, url, notes }));
      await loadDocuments();
      return documents.value.find((document) => document.id === newDoc.id) ?? newDoc;
    }

    insertDocument(newDoc);
    return newDoc;
  }

  // ------------------------------
  // ACTIONS — Asset Management
  // ------------------------------
  async function addAssetToDocument(id: string, asset: TaskResourceInput, baseDocument?: TaskDocument): Promise<boolean> {
    const doc = getDocumentById(id).value ?? baseDocument;
    if (!doc) return false;
    if (asset.password && (!isSupabaseConfigured || !supabase)) {
      error.value = "Password storage requires the Supabase connection to be configured.";
      return false;
    }

    const kind = /imeet/i.test(asset.label) ? "imeet" : "material";
    const safeAsset: TaskAsset = {
      kind,
      label: asset.label.trim(),
      url: asset.url.trim(),
      notes: asset.notes.trim(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error: insertError } = await supabase
        .from("task_resources")
        .insert({
          task_id: id,
          kind,
          label: safeAsset.label,
          url: safeAsset.url,
          notes: asset.notes,
        })
        .select("id, kind, label, url, notes")
        .single();
      if (insertError || !data) {
        error.value = insertError?.message ?? "Could not add this resource.";
        return false;
      }

      if (asset.password) {
        const { error: secretError } = await supabase
          .from("task_resource_secrets")
          .insert({ resource_id: data.id, password: asset.password });
        if (secretError) {
          await supabase.from("task_resources").delete().eq("id", data.id);
          error.value = secretError.message;
          return false;
        }
      }
      await updateDocument(id, { assets: [...doc.assets, data as TaskAsset] }, doc);
      return !error.value;
    }

    await updateDocument(id, { assets: [...doc.assets, safeAsset] }, doc);
    return !error.value;
  }

  async function deleteAssetFromDocument(id: string, index: number, baseDocument?: TaskDocument) {
    const doc = getDocumentById(id).value ?? baseDocument;
    if (!doc) return;

    const newAssets = [...doc.assets];
    if (index < 0 || index >= newAssets.length) return;

    const [asset] = newAssets.splice(index, 1);
    if (isSupabaseConfigured && supabase && asset?.id) {
      const { error: deleteError } = await supabase
        .from("task_resources")
        .delete()
        .eq("id", asset.id);
      if (deleteError) {
        error.value = deleteError.message;
        return;
      }
    }
    await updateDocument(id, { assets: newAssets }, doc);
  }

  // ------------------------------
  // ACTIONS — Specialized Updates
  // ------------------------------
  function updateStatus(id: string, status: TaskStatus) {
    updateDocument(id, { status });
  }

  function updateAuthor(id: string, author: Author | null, baseDocument?: TaskDocument) {
    updateDocument(id, {
      authorId: author ? author.id : null,
    }, baseDocument);
  }

  function updateVehicle(id: string, vehicle: Partial<TaskVehicle>) {
    const doc = getDocumentById(id).value;
    if (!doc) return;

    updateDocument(id, {
      vehicle: { ...doc.vehicle, ...vehicle },
    });
  }

  function toggleHighPriority(id: string) {
    const doc = getDocumentById(id).value;
    if (!doc) return;

    updateDocument(id, { highPriority: !doc.highPriority });
  }

  // ------------------------------
  // RETURN
  // ------------------------------
  return {
    // state
    documents,
    isLoading,
    isSaving,
    hasLoaded,
    error,

    // getters
    getDocumentById,
    getDocumentsByStatus,
    pendingCount,
    sortedBySection,

    // core mutators
    setDocuments,
    insertDocument,
    createDocument,

    // loading
    loadDocuments,
    clearDocuments,
    subscribeToChanges,
    stopRealtime,

    // updates
    updateDocument,
    deleteDocument,
    duplicateDocument,

    // assets
    addAssetToDocument,
    deleteAssetFromDocument,

    // specialized updates
    updateStatus,
    updateAuthor,
    updateVehicle,
    toggleHighPriority,
  };
});

function toTimestamp(value: string | undefined) {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isActiveTask(document: TaskDocument) {
  return document.status !== "published" && document.status !== "updated";
}
