<template>
  <div class="layout-grid">
    <div id="logo" class="logo"></div>
    <header>
      <TopNav />
    </header>
    <aside id="sidebar">
      <DashboardSidebar :ranges="ranges" />
    </aside>
    <main id="content">
      <section class="content-header">
        <div>
          <h1>MMPs</h1>
        </div>
        <div class="header-actions">
          <form>
            <div class="search-bar">
              <SearchIcon class="search-icon" />
              <input
                type="search"
                class="search-input"
                placeholder="Search by vehicle or segment"
              />
            </div>
          </form>
          <DropdownMenu :options="ranges" :label="'Author'" />
          <DropdownMenu :options="ranges" :label="'Status'" />
          <SortIcon class="sort-icon header-icon" />
          <FilterIcon class="filter-icon header-icon" />
        </div>
      </section>
      <TaskList :documents="documents" />
    </main>
  </div>
</template>
<script>
import DashboardSidebar from "@/components/layout/DashboardSidebar.vue";
import TopNav from "@/components/layout/TopNav.vue";
import TaskList from "@/components/layout/TaskList.vue";
import {
  FilterIcon,
  // FolderOpenIcon,
  SearchIcon,
  SortIcon,
} from "@/assets/icons";
import testDocuments from "./test-documents";

export default {
  name: "App",
  data() {
    return {
      ranges: [
        { label: "Last Week", value: "last_week" },
        { label: "Last Month", value: "last_month" },
        { label: "This Week", value: "this_week" },
        { label: "This Month", value: "this_month" },
      ],
      documents: testDocuments,
    };
  },
  components: {
    DashboardSidebar,
    FilterIcon,
    // FolderOpenIcon,
    SearchIcon,
    SortIcon,
    TaskList,
    TopNav,
  },
};
</script>

<style lang="scss" scoped>
.layout-grid {
  display: grid;
  grid-template-columns: 140px 1fr;
  grid-template-rows: 100px 1fr;
  grid-template-areas:
    "logo header"
    "sidebar content";
  height: 100vh;

  #logo {
    grid-area: logo;
    background-color: var(--color-background-logo);
    border-top-left-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 2rem;
  }

  header {
    grid-area: header;
    border-top-right-radius: 8px;
    display: flex;
    align-items: center;
    background-color: var(--color-background-header);
    border-bottom: var(--color-border) solid 2px;
  }

  #sidebar {
    grid-area: sidebar;
    background-color: var(--color-background-sidebar);
    color: var(--color-sidebar-text);
    padding: 20px 10px;
  }

  #content {
    grid-area: content;
    padding: 20px;
    background: url("@/assets/bg-pattern.jpeg") repeat;
    background-size: auto;

    .content-header {
      display: flex;
      flex-flow: row nowrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;

      h1 {
        font: 700 24px/1.2 "Monda", sans-serif;
        color: var(--color-body-header-text);
        margin: 0;
      }

      .header-actions {
        display: flex;
        align-items: flex-start;
        gap: 10px;

        .search-bar {
          --padding: 4px;

          width: max-content;
          display: flex;
          align-items: center;
          background-color: var(--color-input-background);
          border: 1px solid var(--color-input-border);
          padding: var(--padding);
          border-radius: 8px;
          width: 220px;
          height: 24px;

          .search-input {
            font: 400 12px/1 "Monda", sans-serif;
            color: var(--color-search-text);
            margin-left: var(--padding);
            outline: none;
            border: none;
            background: transparent;
            flex: 1;
          }

          .search-input::placeholder,
          .search-icon {
            color: var(--color-search-text-placeholder);
          }
        }
        .header-icon {
          --sides: 22px;

          width: var(--sides);
          height: var(--sides);
          fill: var(--color-icon);
          background-color: var(--color-input-background);
          border: 1px solid var(--color-input-border);
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s ease-in-out;

          &:hover {
            background-color: var(--color-input-background-hover);
            fill: var(--color-icon-hover);
          }
        }
      }
    }
  }
}

// @media (min-width: 1024px) {
//   header {
//     display: flex;
//     place-items: center;
//     padding-right: calc(var(--section-gap) / 2);
//   }

//   .logo {
//     margin: 0 2rem 0 0;
//   }

//   header .wrapper {
//     display: flex;
//     place-items: flex-start;
//     flex-wrap: wrap;
//   }
// }
</style>
