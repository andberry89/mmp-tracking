import { defineStore } from "pinia";
import { ref } from "vue";
import { fetchPublishedTaskPage, fetchPublishedTaskStats } from "@/lib/supabase-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useDocumentsStore } from "@/stores/documents";
import type { TaskDocument } from "@/types";

export interface PublicationHistoryQuery {
  page: number;
  pageSize: number;
  startAt: string | null;
  endAt: string | null;
  authorId: string | null;
  query: string;
}

export const usePublicationHistoryStore = defineStore("publicationHistory", () => {
  const entries = ref<TaskDocument[]>([]);
  const totalCount = ref(0);
  const isLoading = ref(false);
  const isLoadingStats = ref(false);
  const error = ref<string | null>(null);
  const stats = ref<Array<{ status: "published" | "updated"; modelYear: number; count: number }>>([]);
  let realtimeChannel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
  let realtimeGeneration = 0;
  let pageRequestId = 0;
  let statsRequestId = 0;
  let latestQuery: PublicationHistoryQuery | null = null;
  let statsRange: { startAt: string | null; endAt: string | null } = { startAt: null, endAt: null };

  async function loadPage(query: PublicationHistoryQuery) {
    latestQuery = query;
    const requestId = ++pageRequestId;
    if (!isSupabaseConfigured) {
      const documentsStore = useDocumentsStore();
      const filtered = documentsStore.documents
        .filter((doc) => doc.status === "published" || doc.status === "updated")
        .filter((doc) => !query.authorId || doc.authorId === query.authorId)
        .filter((doc) => {
          const search = query.query.trim().toLowerCase();
          return !search || [doc.vehicle.make, doc.vehicle.model, doc.vehicle.modelYear, doc.vehicle.segment]
            .some((value) => String(value ?? "").toLowerCase().includes(search));
        })
        .filter((doc) => !query.startAt || (doc.publishedDate && doc.publishedDate >= query.startAt))
        .filter((doc) => !query.endAt || (doc.publishedDate && doc.publishedDate <= query.endAt))
        .sort((a, b) => (b.publishedDate || b.createdDate || "").localeCompare(a.publishedDate || a.createdDate || ""));
      totalCount.value = filtered.length;
      const from = (query.page - 1) * query.pageSize;
      entries.value = filtered.slice(from, from + query.pageSize);
      error.value = null;
      return;
    }

    isLoading.value = true;
    error.value = null;
    try {
      const result = await fetchPublishedTaskPage(query);
      if (requestId !== pageRequestId) return;
      entries.value = result.items;
      totalCount.value = result.totalCount;
    } catch (reason) {
      if (requestId !== pageRequestId) return;
      error.value = reason instanceof Error ? reason.message : "Unable to load published tasks.";
      entries.value = [];
      totalCount.value = 0;
    } finally {
      if (requestId === pageRequestId) isLoading.value = false;
    }
  }

  async function loadStats(startAt: string | null, endAt: string | null) {
    statsRange = { startAt, endAt };
    const requestId = ++statsRequestId;
    isLoadingStats.value = true;
    if (!isSupabaseConfigured) {
      const documentsStore = useDocumentsStore();
      const matching = documentsStore.documents
        .filter((doc) => (doc.status === "published" || doc.status === "updated")
          && (!startAt || doc.publishedDate >= startAt)
          && (!endAt || doc.publishedDate <= endAt));
      const counts = new Map<string, { status: "published" | "updated"; modelYear: number; count: number }>();
      matching.forEach((doc) => {
        const status = doc.status as "published" | "updated";
        const modelYear = doc.vehicle.modelYear;
        const key = `${status}:${modelYear}`;
        const existing = counts.get(key);
        if (existing) existing.count += 1;
        else counts.set(key, { status, modelYear, count: 1 });
      });
      stats.value = [...counts.values()];
      isLoadingStats.value = false;
      return;
    }
    try {
      const result = await fetchPublishedTaskStats(startAt, endAt);
      if (requestId === statsRequestId) stats.value = result;
    } catch (reason) {
      if (requestId === statsRequestId) error.value = reason instanceof Error ? reason.message : "Unable to load publication totals.";
    } finally {
      if (requestId === statsRequestId) isLoadingStats.value = false;
    }
  }

  function subscribeToChanges() {
    if (!supabase || !isSupabaseConfigured) return;
    if (realtimeChannel) void supabase.removeChannel(realtimeChannel);
    const generation = ++realtimeGeneration;
    realtimeChannel = supabase
      .channel("published-history-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "mmp_tasks" }, () => {
        if (generation !== realtimeGeneration) return;
        if (latestQuery) void loadPage(latestQuery);
        void loadStats(statsRange.startAt, statsRange.endAt);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "task_resources" }, () => {
        if (generation !== realtimeGeneration) return;
        if (latestQuery) void loadPage(latestQuery);
      })
      .subscribe();
  }

  function stopRealtime() {
    realtimeGeneration += 1;
    if (!supabase || !realtimeChannel) return;
    void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  function clear() {
    stopRealtime();
    entries.value = [];
    totalCount.value = 0;
    stats.value = [];
    isLoadingStats.value = false;
    error.value = null;
    latestQuery = null;
    pageRequestId += 1;
    statsRequestId += 1;
    isLoading.value = false;
  }

  return { entries, totalCount, isLoading, isLoadingStats, error, stats, loadPage, loadStats, subscribeToChanges, stopRealtime, clear };
});
