import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { TaskDocument, TaskStatus, TaskAsset, TaskAuthor, TaskVehicle } from "@/types";

export const useDocumentsStore = defineStore("documents", () => {
  // -------------
  // STATE
  // -------------
  const documents = ref<TaskDocument[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const hasLoaded = ref(false);

  // -------------
  // GETTERS
  // -------------
  const getDocumentById = (id: string) =>
    computed(() => documents.value.find((doc) => doc.id === id));

  const getDocumentsByStatus = (status: TaskStatus) =>
    computed(() => documents.value.filter((doc) => doc.status === status));

  const allStatuses = [
    "Pending",
    "Ready to Edit",
    "Ready to Publish",
    "Scheduled",
    "Published",
    "Updated",
  ] as TaskStatus[];

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
    () => documents.value.filter((doc) => doc.status === "Pending").length
  );

  // -------------
  // ACTIONS - Loading
  // -------------
  async function loadDocuments() {
    isLoading.value = true;
    error.value = null;

    try {
      // Simulate API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Mock Data
      const mock: TaskDocument[] = [
        {
          id: "1",
          highPriority: true,
          vehicle: {
            make: "Toyota",
            model: "Camry",
            segment: "Sedan",
            modelYear: 2025,
          },
          author: {
            id: "a1",
            firstName: "Alice",
            lastName: "Writer",
            initials: "AW",
            team: "bg",
            active: true,
          },
          deadline: "2025-12-01",
          status: "Pending",
          notes: "Working on updates.",
          assets: [
            {
              url: "https://example.com/img1.jpg",
              notes: "Front angle",
            },
          ],
          embargoDate: "",
          embargoNotes: "",
          embargo: false,
          published: false,
          new: true,
          publishedDate: "",
        },
      ];

      documents.value = mock;
      hasLoaded.value = true;
    } catch (e) {
      error.value = "Failed to load documents.";
    } finally {
      isLoading.value = false;
    }
  }

  // -------------
  // ACTIONS - Updates
  // -------------
  function updateDocument(id: string, payload: Partial<TaskDocument>) {
    const idx = documents.value.findIndex((doc) => doc.id === id);
    if (idx === -1) return;

    documents.value[idx] = {
      ...documents.value[idx],
      ...payload,
    };
  }

  function deleteDocument(id: string) {
    documents.value = documents.value.filter((doc) => doc.id !== id);
  }

  function duplicateDocument(id: string) {
    const original = documents.value.find((doc) => doc.id === id);
    if (!original) return null;

    const newId = crypto.randomUUID?.() ?? `dup-${Date.now()}`;

    const newDoc: TaskDocument = {
      ...structuredClone(original),
      id: newId,
      status: "Pending",
      new: true,
      published: false,
      publishedDate: "",
    };

    documents.value.unshift(newDoc);
    return newDoc;
  }

  // ------------------------------
  // ACTIONS — Asset Management
  // ------------------------------
  function addAssetToDocument(id: string, asset: TaskAsset) {
    updateDocument(id, {
      assets: [...getDocumentById(id).value!.assets, asset],
    });
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

    updateDocument(id, {
      highPriority: !doc.highPriority,
    });
  }

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

    // actions
    loadDocuments,
    updateDocument,
    deleteDocument,
    duplicateDocument,

    addAssetToDocument,
    deleteAssetFromDocument,

    updateStatus,
    updateAuthor,
    updateVehicle,
    toggleHighPriority,
  };
});
