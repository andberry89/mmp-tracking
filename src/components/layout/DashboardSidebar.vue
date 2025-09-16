<template>
  <div>
    <h3>Authors</h3>
    <div class="sidebar-wrapper">
      <div class="team" v-for="(team, idx) in teams" :key="idx">
        <h4>{{ team.sidebarLabel }}</h4>
        <div class="author" v-for="(author, authorIdx) in authors[team.slug]" :key="authorIdx">
          <span class="author-name">{{ author.label }}</span>
          <span class="assigned" v-if="assigned(author) > 0">{{ assigned(author) }} Assigned</span>
        </div>
      </div>
    </div>
    <h3>Quick Stats</h3>
    <div class="sidebar-wrapper">
      <div class="stat-line" v-for="stat in quickStats" :key="stat">
        <span :class="`dot ${stat.value}`"></span>
        <span class="stat">{{ stat.label }}: </span
        ><span class="stat-number">{{ stat.count }}</span>
      </div>
    </div>
    <h3>Published & Updates</h3>
    <DropdownMenu :options="ranges" :label="'Show'" />
    <div class="sidebar-wrapper">
      <div class="stat-line" v-for="stat in updatedAndPublished" :key="stat">
        <span :class="`dot ${stat.value}`"></span>
        <span class="stat">{{ stat.label }}: </span
        ><span class="stat-number">{{ stat.count }}</span>
        <div class="stats-subtext">
          <span v-for="[year, count] in stat.countByYear" :key="year">{{ year }}: {{ count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { teams, statuses } from "@/constants/constants";

export default {
  name: "DashboardSidebar",
  data() {
    return {
      quickStatValues: ["pending", "rte", "rtp", "scheduled"],
      publishUpdateValues: ["published", "updated"],
      statuses: statuses,
      teams: {},
    };
  },
  props: {
    authors: {
      type: Object,
      required: true,
    },
    documents: {
      type: Object,
      required: true,
    },
    ranges: {
      type: Array,
      required: true,
    },
  },
  computed: {
    quickStats() {
      // Filter the statuses to only include those in quickStatValues
      let quickStatsArr = this.statuses.filter((status) =>
        this.quickStatValues.includes(status.value)
      );
      // Order the array based on the order in quickStatValues
      quickStatsArr.sort((a, b) => {
        return this.quickStatValues.indexOf(a.value) - this.quickStatValues.indexOf(b.value);
      });
      // Filter the documents to only include those with status in quickStatValues
      let allRelevantDocs = [...this.documents.pending, ...this.documents.rtp];

      // Find the number of documents for each status
      quickStatsArr.forEach((stat) => {
        stat.count = allRelevantDocs.filter((doc) => doc.status === stat.label).length;
      });

      return quickStatsArr;
    },
    updatedAndPublished() {
      let publishUpdatesArr = this.statuses.filter((status) =>
        this.publishUpdateValues.includes(status.value)
      );
      // Find the number of documents for each status
      publishUpdatesArr.forEach((stat) => {
        const docs = this.documents.published.filter((doc) => doc.status === stat.label);
        // Find the count by model year
        let countByYear = {};
        docs.forEach((doc) => {
          if (countByYear[doc.vehicle.modelYear]) {
            countByYear[doc.vehicle.modelYear]++;
          } else {
            countByYear[doc.vehicle.modelYear] = 1;
          }
        });
        // Sort the countByYear object by year descending
        let arr = Object.entries(countByYear).sort((a, b) => b[0] - a[0]);
        // arr is now a sorted array of [year, count] pairs

        stat.count = docs.length;
        stat.countByYear = arr;
      });

      return publishUpdatesArr;
    },
  },
  methods: {
    assigned(author) {
      return this.documents.pending.filter((doc) => doc.author && doc.author.id === author.id)
        .length;
    },
  },
  created() {
    let actualTeams = teams;
    delete actualTeams.all;
    this.teams = teams;
  },
};
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
