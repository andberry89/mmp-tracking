import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { applyTaskRules } from "@/utils/apply-task-rules";
import { testDocuments } from "@/test";

import type { TaskDocument, TaskStatus, TaskAsset, TaskAuthor, TaskVehicle } from "@/types";

export const useDocumentsStore = defineStore("documents", () => {
  // ------------------------------
  // STATE
  // ------------------------------
  const documents = ref<TaskDocument[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const hasLoaded = ref(false);

  // ------------------------------
  // GETTERS
  // ------------------------------
  const getDocumentById = (id: string) =>
    computed(() => documents.value.find((doc) => doc.id === id));

  const getDocumentsByStatus = (status: TaskStatus) =>
    computed(() => documents.value.filter((doc) => doc.status === status));

  const allStatuses: TaskStatus[] = ["pending", "rte", "rtp", "scheduled", "published", "updated"];

  const groupedDocuments = computed(
    () =>
      Object.fromEntries(
        allStatuses.map((status) => [
          status,
          documents.value.filter((doc) => doc.status === status),
        ])
      ) as Record<TaskStatus, TaskDocument[]>
  );

  const pendingCount = computed(
    () => documents.value.filter((doc) => doc.status === "pending").length
  );

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

  // ------------------------------
  // ACTIONS — Loading with Test Fallback
  // ------------------------------
  async function loadDocuments() {
    isLoading.value = true;
    error.value = null;

    try {
      // Simulated API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Placeholder for API response
      const response: TaskDocument[] = [];

      if (!response || response.length === 0) {
        setDocuments(structuredClone(testDocuments));
      } else {
        setDocuments(response);
      }
    } catch (e) {
      error.value = "Failed to load documents.";
      setDocuments(structuredClone(testDocuments)); // fallback
    } finally {
      isLoading.value = false;
    }
  }

  // ------------------------------
  // ACTIONS — Updates
  // ------------------------------
  function updateDocument(id: string, payload: Partial<TaskDocument>) {
    const idx = documents.value.findIndex((doc) => doc.id === id);
    if (idx === -1) return;

    const merged = {
      ...documents.value[idx],
      ...payload,
    };

    documents.value[idx] = applyTaskRules(merged);
  }

  function deleteDocument(id: string) {
    documents.value = documents.value.filter((doc) => doc.id !== id);
  }

  function duplicateDocument(id: string) {
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

    insertDocument(newDoc);
    return newDoc;
  }

  // ------------------------------
  // ACTIONS — Asset Management
  // ------------------------------
  function addAssetToDocument(id: string, asset: TaskAsset) {
    const doc = getDocumentById(id).value;
    if (!doc) return;

    updateDocument(id, { assets: [...doc.assets, asset] });
  }

  function deleteAssetFromDocument(id: string, index: number) {
    const doc = getDocumentById(id).value;
    if (!doc) return;

    const newAssets = [...doc.assets];
    if (index < 0 || index >= newAssets.length) return;

    newAssets.splice(index, 1);
    updateDocument(id, { assets: newAssets });
  }

  // ------------------------------
  // ACTIONS — Specialized Updates
  // ------------------------------
  function updateStatus(id: string, status: TaskStatus) {
    updateDocument(id, { status });
  }

  function updateAuthor(id: string, author: TaskAuthor | null) {
    updateDocument(id, { author });
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
    hasLoaded,
    error,

    // getters
    getDocumentById,
    getDocumentsByStatus,
    groupedDocuments,
    pendingCount,
    allStatuses,

    // core mutators
    setDocuments,
    insertDocument,

    // loading
    loadDocuments,

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
