<template>
  <div>
    <h3>Authors</h3>
    <div class="sidebar-wrapper">
      <div class="team" v-for="(team, idx) in teams" :key="idx">
        <h4>{{ team.sidebarLabel }}</h4>
        <div
          class="author"
          v-for="(author, authorIdx) in authors[team.slug]"
          :key="'author-' + authorIdx"
        >
          <span class="author-name">{{ author.label }}</span>
          <span class="assigned" v-if="assigned(author) > 0">
            {{ assigned(author) }} Assigned
          </span>
        </div>
      </div>
    </div>

    <h3>Quick Stats</h3>
    <div class="sidebar-wrapper">
      <div class="stat-line" v-for="(stat, statIdx) in quickStats" :key="'quickstat-' + statIdx">
        <span :class="`dot ${stat.value}`"></span>
        <span class="stat">{{ stat.label }}: </span>
        <span class="stat-number">{{ stat.count }}</span>
      </div>
    </div>

    <h3>Published & Updates</h3>
    <DropdownMenu :options="ranges" :label="'Show'" />
    <div class="sidebar-wrapper">
      <div
        class="stat-line"
        v-for="(stat, statIdx) in updatedAndPublished"
        :key="'pubstat-' + statIdx"
      >
        <span :class="`dot ${stat.value}`"></span>
        <span class="stat">{{ stat.label }}: </span>
        <span class="stat-number">{{ stat.count }}</span>
        <div class="stats-subtext">
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
h3 {
  font-size: 12pt;
  font-weight: 700;
  color: var(--color-sidebar-text-header);
  text-transform: uppercase;
  margin-bottom: 15px;
}

.sidebar-wrapper {
  padding-left: 5px;
  font-family: "Asap", sans-serif;

  .team {
    margin-bottom: 16px;

    h4 {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--color-sidebar-text);
    }

    .author {
      font-size: 10pt;
      line-height: 1;
      color: var(--color-sidebar-text);
      padding: 8px 0;
      display: flex;
      flex-flow: column nowrap;
      border-bottom: var(--color-sidebar-divider) solid 1px;

      &:last-child {
        border-bottom: none;
      }

      .assigned {
        color: var(--color-sidebar-text-subtext);
      }
    }

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
  }

  .stat-line {
    font: 400 12px/1.2 "Monda", sans-serif;
    color: var(--color-sidebar-text);
    padding: 6px 0;

    .dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-right: 5px;

      &.pending {
        background: var(--color-body-pending);
      }
      &.rte {
        background: var(--color-body-rte);
      }
      &.rtp {
        background: var(--color-body-rtp);
      }
      &.scheduled {
        background: var(--color-body-scheduled);
      }
      &.published {
        background: var(--color-body-published);
      }
      &.updated {
        background: var(--color-body-updated);
      }
    }
    .stat {
      font-weight: 700;
    }

    .stats-subtext {
      font-size: 9pt;
      color: var(--color-sidebar-text-subtext);
      padding-left: 20px;
      display: flex;
      flex-flow: column nowrap;
      gap: 4px;
      margin-top: 4px;
    }

    &:last-child {
      margin-bottom: 30px;
    }
  }
}
</style>
