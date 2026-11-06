<template>
  <div>
    <h3 class="text-base font-bold color-[var(--color-sidebar-text-header)] uppercase mb-[15px]">
      Authors
    </h3>
    <div class="pl-[5px] font-[Asap,sans-serif] mb-7">
      <div class="mb-4" v-for="team in visibleTeams" :key="team.slug">
        <h4 class="text-sm font-bold uppercase color-[var(--color-sidebar-text)]">
          {{ team.sidebarLabel }}
        </h4>
        <div
          class="text-[13.3px] leading-none text-[var(--color-sidebar-text)] py-2 flex flex-col border-b border-[var(--color-sidebar-divider) last:border-b-0]"
          v-for="author in authorsForSidebar(team)"
          :key="author.id"
        >
          <span>{{ author.label }}</span>
          <span class="text-[var(--color-sidebar-text-subtext)]" v-if="assigned(author) > 0">
            {{ assigned(author) }} Assigned
          </span>
        </div>
      </div>
    </div>

    <h3 class="text-base font-bold color-[var(--color-sidebar-text-header)] uppercase mb-[15px]">
      Quick Stats
    </h3>
    <div class="pl-[5px] font-[Asap,sans-serif] mb-7">
      <div
        class="font-[400] text-[12px] leading-[1.2] font-[Monda,sans-serif] text-[var(--color-sidebar-text)] py-[6px]"
        v-for="(stat, statIdx) in quickStats"
        :key="'quickstat-' + statIdx"
      >
        <span
          :class="['inline-block w-[6px] h-[6px] rounded-full mr-[5px]', statusBgMap[stat.value]]"
        ></span>
        <span class="font-bold">{{ stat.label }}: </span>
        <span>{{ stat.count }}</span>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useDocumentsStore } from "@/stores/documents";
import { teams, statuses } from "@/constants/constants";
import { getDocumentAuthor } from "@/utils/";

import type { TaskStatus } from "@/types";

// Type definitions
interface Author {
  id: string;
  label: string;
}

interface Props {
  authors: Record<string, Author[]>;
}

// Props
const props = defineProps<Props>();

// Store
const documentsStore = useDocumentsStore();

// Color Maps
// Must match lowercase TaskStatus values
const statusBgMap: Record<string, string> = {
  pending: "bg-[var(--color-body-pending)]",
  rte: "bg-[var(--color-body-rte)]",
  rtp: "bg-[var(--color-body-rtp)]",
  scheduled: "bg-[var(--color-body-scheduled)]",
  published: "bg-[var(--color-body-published)]",
  updated: "bg-[var(--color-body-updated)]",
};

// Quick Stats
const quickStatKeys: TaskStatus[] = ["pending", "rte", "rtp", "scheduled"];
const activeWorkStatuses = new Set<TaskStatus>(["pending", "rte", "rtp", "scheduled"]);

const assignedCounts = computed(() => {
  const counts: Record<string, number> = {};
  documentsStore.documents.forEach((doc) => {
    if (!activeWorkStatuses.has(doc.status)) return;
    const author = getDocumentAuthor(doc);
    if (author) counts[author.id] = (counts[author.id] ?? 0) + 1;
  });
  return counts;
});

const visibleTeams = computed(() => teams.filter((team) => {
  const members = props.authors[team.slug] ?? [];
  return team.slug === "bg" || members.some((author) => assigned(author) > 0);
}));

const quickStats = computed(() => {
  return statuses
    .filter((status) => quickStatKeys.includes(status.value as TaskStatus))
    .map((status) => {
      const count = documentsStore.documents.filter((doc) => doc.status === status.value).length;

      return { ...status, count };
    });
});

// Tasks assigned per author
function assigned(author: Author) {
  return assignedCounts.value[author.id] ?? 0;
}

function authorsForSidebar(team: (typeof teams)[number]) {
  const members = props.authors[team.slug] ?? [];
  return team.slug === "bg" ? members : members.filter((author) => assigned(author) > 0);
}

</script>

<style lang="scss" scoped>
.non-bg-team {
  font-size: 10pt;
  line-height: 1;
  color: var(--color-sidebar-text);
  display: flex;
  flex-flow: column nowrap;

  .view-text {
    cursor: pointer;
  }

  .none-assigned {
    margin-top: 10px;
    color: var(--color-sidebar-text-subtext);
  }
}
</style>
