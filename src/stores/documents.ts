import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { applyTaskRules } from "@/utils/apply-task-rules";
import { sortDocuments } from "@/utils/sort-functions";
import { testDocuments } from "@/test";
import { fetchTasks } from "@/lib/supabase-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

import type { NewTaskInput, TaskDocument, TaskStatus, TaskAsset, Author, TaskVehicle } from "@/types";

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

  async function createDocument(input: NewTaskInput): Promise<boolean> {
    isSaving.value = true;
    error.value = null;

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
      publishedDate: "",
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

    realtimeChannel = supabase
      .channel("mmp-tracking-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "mmp_tasks" }, () => {
        void loadDocuments();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "task_resources" }, () => {
        void loadDocuments();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "model_year_vehicles" }, () => {
        void loadDocuments();
      })
      .subscribe();
  }

  function stopRealtime() {
    if (!supabase || !realtimeChannel) return;
    void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  // ------------------------------
  // ACTIONS — Updates
  // ------------------------------
  async function updateDocument(id: string, payload: Partial<TaskDocument>) {
    const idx = documents.value.findIndex((doc) => doc.id === id);
    if (idx === -1) return;

    const current = documents.value[idx];
    if (!current) return;

    const merged: TaskDocument = {
      ...current,
      ...payload,
    };

    if (isSupabaseConfigured && supabase) {
      const databasePayload: Record<string, unknown> = {};
      if ("authorId" in payload) databasePayload.author_id = payload.authorId;
      if ("status" in payload) {
        databasePayload.status = payload.status === "rte" ? "pending_edits" : payload.status;
      }
      if ("highPriority" in payload) databasePayload.high_priority = payload.highPriority;
      if ("deadline" in payload) databasePayload.deadline = payload.deadline || null;
      if ("notes" in payload) databasePayload.notes = payload.notes ?? "";
      if ("embargoNotes" in payload) databasePayload.embargo_notes = payload.embargoNotes ?? "";
      if ("embargoDate" in payload) databasePayload.embargo_at = toTimestamp(payload.embargoDate);
      if ("publishedDate" in payload) databasePayload.published_at = toTimestamp(payload.publishedDate);
      if ("new" in payload) databasePayload.task_kind = payload.new ? "new_mmp" : "update";

      if (Object.keys(databasePayload).length) {
        const { error: updateError } = await supabase
          .from("mmp_tasks")
          .update(databasePayload)
          .eq("id", id);
        if (updateError) {
          error.value = updateError.message;
          return;
        }
      }
      error.value = null;
    }

    documents.value[idx] = applyTaskRules(merged);
  }

  async function deleteDocument(id: string) {
    if (isSupabaseConfigured && supabase) {
      const { error: deleteError } = await supabase.from("mmp_tasks").delete().eq("id", id);
      if (deleteError) {
        error.value = deleteError.message;
        return;
      }
    }
    documents.value = documents.value.filter((doc) => doc.id !== id);
    error.value = null;
  }

  async function duplicateDocument(id: string) {
    const original = documents.value.find((doc) => doc.id === id);
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
      if (!original.modelYearVehicleId) {
        error.value = "This task is missing its shared model-year vehicle record.";
        return null;
      }

      const { data, error: insertError } = await supabase
        .from("mmp_tasks")
        .insert({
          model_year_vehicle_id: original.modelYearVehicleId,
          author_id: original.authorId,
          status: "pending",
          task_kind: "new_mmp",
          high_priority: original.highPriority,
          deadline: original.deadline || null,
          notes: original.notes,
          embargo_at: toTimestamp(original.embargoDate),
          embargo_notes: original.embargoNotes,
        })
        .select("id")
        .single();

      if (insertError || !data) {
        error.value = insertError?.message ?? "Could not duplicate this task.";
        return null;
      }

      newDoc.id = data.id;
      newDoc.assets = [];
      const materials = original.assets.filter((asset) => asset.kind !== "imeet");
      if (materials.length) {
        const { error: resourceError } = await supabase.from("task_resources").insert(
          materials.map((asset) => ({
            task_id: newDoc.id,
            kind: "material" as const,
            label: asset.label || asset.notes,
            url: asset.url,
            notes: asset.notes,
          }))
        );
        if (resourceError) error.value = resourceError.message;
      }

      void loadDocuments();
      return newDoc;
    }

    insertDocument(newDoc);
    return newDoc;
  }

  // ------------------------------
  // ACTIONS — Asset Management
  // ------------------------------
  async function addAssetToDocument(id: string, asset: TaskAsset) {
    const doc = getDocumentById(id).value;
    if (!doc) return;

    if (isSupabaseConfigured && supabase) {
      const kind = asset.kind ?? (/imeet/i.test(asset.label ?? asset.notes) ? "imeet" : "material");
      const { data, error: insertError } = await supabase
        .from("task_resources")
        .insert({
          task_id: id,
          kind,
          label: asset.label || asset.notes,
          url: asset.url,
          notes: asset.notes,
        })
        .select("id, kind, label, url, notes")
        .single();
      if (insertError || !data) {
        error.value = insertError?.message ?? "Could not add this resource.";
        return;
      }
      await updateDocument(id, { assets: [...doc.assets, data as TaskAsset] });
      error.value = null;
      return;
    }

    await updateDocument(id, { assets: [...doc.assets, asset] });
  }

  async function deleteAssetFromDocument(id: string, index: number) {
    const doc = getDocumentById(id).value;
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
    await updateDocument(id, { assets: newAssets });
  }

  // ------------------------------
  // ACTIONS — Specialized Updates
  // ------------------------------
  function updateStatus(id: string, status: TaskStatus) {
    updateDocument(id, { status });
  }

  function updateAuthor(id: string, author: Author | null) {
    updateDocument(id, {
      authorId: author ? author.id : null,
    });
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
