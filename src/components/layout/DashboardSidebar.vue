<template>
  <h3>Authors</h3>
  <div class="sidebar-wrapper">
    <div class="team">
      <h4>Buyer's Guide</h4>
      <div class="author">
        <span class="author-name">Joey Capparella</span>
      </div>
      <div class="author">
        <span class="author-name">Drew Dorian</span>
      </div>
      <div class="author">
        <span class="author-name">Austin Parsons</span>
        <span class="assigned">1 Assigned</span>
      </div>
      <div class="author">
        <span class="author-name">Andrew Wendler</span>
        <span class="assigned">1 Assigned</span>
      </div>
    </div>
    <div class="team">
      <h4>C/D Staff</h4>
      <div class="non-bg-team">
        <span class="view-text">View All</span>
        <span class="none-assigned">None Assigned</span>
      </div>
    </div>
    <div class="team">
      <h4>Freelancers</h4>
      <div class="non-bg-team">
        <span class="view-text">View Less</span>
      </div>
      <div class="author">
        <span class="author-name">David Gluckman</span>
        <span class="assigned">2 Assigned</span>
      </div>
      <div class="author">
        <span class="author-name">Beth Nichols</span>
      </div>
    </div>
  </div>
  <h3>Quick Stats</h3>
  <div class="sidebar-wrapper">
    <div class="stat-line">
      <span class="dot"></span>
      <span class="stat">Pending: </span><span class="stat-number">6</span>
    </div>
    <div class="stat-line">
      <span class="dot"></span>
      <span class="stat">Pending: </span><span class="stat-number">6</span>
    </div>
    <div class="stat-line">
      <span class="dot"></span>
      <span class="stat">Pending: </span><span class="stat-number">6</span>
    </div>
    <div class="stat-line">
      <span class="dot"></span>
      <span class="stat">Pending: </span><span class="stat-number">6</span>
    </div>
  </div>
  <h3>Published & Updates</h3>
  <DropdownMenu :options="ranges" :label="'Show'" />
  <div class="sidebar-wrapper">
    <div class="stat-line">
      <span class="dot"></span>
      <span class="stat">Published: </span><span class="stat-number">14</span>
      <div class="stats-subtext">
        <span>2027: 1</span>
        <span>2026: 13</span>
      </div>
    </div>
    <div class="stat-line">
      <span class="dot"></span>
      <span class="stat">Updated: </span><span class="stat-number">5</span>
      <div class="stats-subtext">
        <span>2026: 2</span>
        <span>2025: 3</span>
      </div>
    </div>
  </div>
</template>

<script>
import DropdownMenu from "@/components/common/DropdownMenu.vue";

export default {
  name: "DashboardSidebar",
  components: {
    DropdownMenu,
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
    font: 400 10pt/1.2 "Monda", sans-serif;
    color: var(--color-sidebar-text);
    padding: 6px 0;

    .dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-body-pending);
      margin-right: 5px;
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
