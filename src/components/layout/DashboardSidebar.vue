<template>
  <div>
    <h3 class="text-base font-bold color-[var(--color-sidebar-text-header)] uppercase mb-[15px]">
      Authors
    </h3>
    <div class="pl-[5px] font-[Asap,sans-serif] mb-7">
      <div class="mb-4" v-for="(team, idx) in teams" :key="idx">
        <h4 class="text-sm font-bold uppercase color-[var(--color-sidebar-text)]">
          {{ team.sidebarLabel }}
        </h4>
        <div
          class="text-[13.3px] leading-none text-[var(--color-sidebar-text)] py-2 flex flex-col border-b border-[var(--color-sidebar-divider) last:border-b-0]"
          v-for="(author, authorIdx) in authors[team.slug]"
          :key="'author-' + authorIdx"
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
          :class="[
            'inline-block w-[6px] h-[6px] rounded-full mr-[5px]',
            `bg-[var(--color-body-${stat.value})]`,
          ]"
        ></span>
        <span class="font-bold">{{ stat.label }}: </span>
        <span>{{ stat.count }}</span>
      </div>
    </div>

    <h3 class="text-base font-bold color-[var(--color-sidebar-text-header)] uppercase mb-[15px]">
      Published & Updates
    </h3>
    <DropdownMenu :options="ranges" :label="'Show'" />
    <div class="pl-[5px] font-[Asap,sans-serif]">
      <div
        class="font-[400] text-[12px] leading-[1.2] font-[Monda,sans-serif] text-[var(--color-sidebar-text)] py-[6px]"
        v-for="(stat, statIdx) in updatedAndPublished"
        :key="'pubstat-' + statIdx"
      >
        <span
          :class="[
            'inline-block w-[6px] h-[6px] rounded-full mr-[5px]',
            `bg-[var(--color-body-${stat.value})]`,
          ]"
        ></span>
        <span class="font-bold">{{ stat.label }}: </span>
        <span>{{ stat.count }}</span>
        <div
          class="text-[12px] text-[var(--color-sidebar-text-subtext)] pl-5 flex flex-col gap-1 mt-1"
        >
          <span v-for="[year, count] in stat.countByYear" :key="year">
            {{ year }}: {{ count }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { teams, statuses } from "@/constants/constants";

// Type definitions
interface Author {
  id: string;
  label: string;
}

interface Vehicle {
  modelYear: string;
}

interface Document {
  id: string;
  status: string;
  author?: Author;
  vehicle: Vehicle;
}

interface Status {
  label: string;
  value: string;
  count?: number;
  countByYear?: [string, number][];
}

interface Props {
  authors: Record<string, Author[]>;
  documents: {
    pending: Document[];
    rtp: Document[];
    published: Document[];
  };
  ranges: { id: string; label: string }[];
}

// Props
const props = defineProps<Props>();

// Color Maps
const statusBgMap: Record<string, string> = {
  pending: "bg-[var(--color-body-pending)]",
  rte: "bg-[var(--color-body-rte)]",
  rtp: "bg-[var(--color-body-rtp)]",
  scheduled: "bg-[var(--color-body-scheduled)]",
  published: "bg-[var(--color-body-published)]",
  updated: "bg-[var(--color-body-updated)]",
};

// Static values
const quickStatValues = ["pending", "rte", "rtp", "scheduled"];
const publishUpdateValues = ["published", "updated"];

// Computed: Quick Stats
const quickStats = computed(() => {
  const allRelevantDocs = [...props.documents.pending, ...props.documents.rtp];

  return statuses
    .filter((status) => quickStatValues.includes(status.value))
    .sort((a, b) => quickStatValues.indexOf(a.value) - quickStatValues.indexOf(b.value))
    .map((status) => {
      const count = allRelevantDocs.filter((doc) => doc.status === status.label).length;
      return { ...status, count };
    });
});

// Computed: Updated & Published
const updatedAndPublished = computed(() => {
  const allDocs = props.documents.published;

  return statuses
    .filter((status) => publishUpdateValues.includes(status.value))
    .map((status) => {
      const docs = allDocs.filter((doc) => doc.status === status.label);

      const countByYearMap: Record<string, number> = {};
      for (const doc of docs) {
        const year = doc.vehicle.modelYear; // or use publishedDate if available
        countByYearMap[year] = (countByYearMap[year] || 0) + 1;
      }

      const countByYear: [string, number][] = Object.entries(countByYearMap).sort(
        ([a], [b]) => Number(b) - Number(a)
      );

      return {
        ...status, // clone existing status
        count: docs.length,
        countByYear,
      };
    });
});

// Method: Count assigned tasks for an author
function assigned(author: Author): number {
  return props.documents.pending.filter((doc) => doc.author?.id === author.id).length;
}

// Available to template
const { authors, ranges } = props;
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
