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
      <section class="content-column-headers grid">
        <div class="content-column-header">
          <span class="column-header-text">Vehicle/Segment</span>
        </div>
        <div class="content-column-header">
          <span class="column-header-text">Deadline</span>
        </div>
        <div class="content-column-header">
          <span class="column-header-text">Status</span>
        </div>
        <div class="content-column-header">
          <span class="column-header-text">Embargo/Publish Date</span>
        </div>
        <div class="content-column-header">
          <span class="column-header-text">Notes</span>
        </div>
        <div class="content-column-header">
          <span class="column-header-text">Assets</span>
        </div>
        <div class="content-column-header">
          <span class="column-header-text">Author</span>
        </div>
      </section>
      <section class="add-new">
        <PlusIcon class="add-new-btn" />
        <span>Add New Task</span>
      </section>
      <section class="task-list">
        <div class="task-item grid">
          <div class="task-vehicle">
            <span class="vehicle">2026 Audi A3</span
            ><span class="segment">Subcompact Luxury Cars</span>
          </div>
          <div class="task-deadline"></div>
          <div class="task-status">Pending</div>
          <div class="task-date"></div>
          <div class="task-notes">no changes expected</div>
          <div class="task-assets"><FolderOpenIcon /></div>
          <div class="task-author"><span class="initials">DG</span></div>
          <div class="task-actions"><MoreIcon class="more-icon" /></div>
        </div>
      </section>
    </main>
  </div>
</template>
<script>
import DashboardSidebar from "@/components/layout/DashboardSidebar.vue";
import TopNav from "@/components/layout/TopNav.vue";
import SearchIcon from "@/assets/icons/search.svg";
import FilterIcon from "@/assets/icons/filter.svg";
import PlusIcon from "@/assets/icons/plus.svg";
import SortIcon from "@/assets/icons/sort.svg";
import FolderOpenIcon from "@/assets/icons/folder-open.svg";
import MoreIcon from "@/assets/icons/more.svg";

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
    };
  },
  components: {
    DashboardSidebar,
    FilterIcon,
    FolderOpenIcon,
    MoreIcon,
    PlusIcon,
    SearchIcon,
    SortIcon,
    TopNav,
  },
};
</script>

<style lang="scss" scoped>
@mixin column-layout() {
  display: grid;
  justify-items: start;
  align-items: center;
  grid-template-columns: 1fr 100px 120px 175px 1fr 50px 50px 8px; // WORK ON SPACING FOR RESPONSIBE PURPOSES
  margin-top: 30px;
  padding: 0 10px 0 20px;
}

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

    .grid {
      @include column-layout();
    }

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

    .content-column-headers {
      margin-top: 20px;

      .content-column-header {
        text-align: center;
        padding: 10px 0;
        background-color: var(--color-header-background);
        border-radius: 4px;

        .column-header-text {
          font: 700 14px/1.2 "Asap", sans-serif;
          color: var(--color-body-column-header-text);
          display: block;
          width: 100%;
        }
      }
    }

    .add-new {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 5px;
      color: var(--color-add-new-item-text);
      font: 700 14px/1.2 "Asap", sans-serif;
      border: 1px dashed var(--color-add-new-item-border);
      cursor: pointer;

      .add-new-btn {
        fill: var(--color-add-new);
        padding: 0;
        margin: 0;
        cursor: pointer;
      }
    }

    .task-list {
      font: 400 12px/1.2 "Asap", sans-serif;

      .task-item {
        background-color: var(--color-body-background);
        border: 1px solid (var--color-body-border);
        border-radius: 4px;
        padding-top: 8px;
        padding-bottom: 8px;

        .task-vehicle {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding-left: 10px;
          font-weight: bold;

          .vehicle {
            color: var(--color-body-text);
          }

          .segment {
            color: var(--color-body-text-secondary);
          }
        }

        .task-status {
          background-color: var(--color-body-pending);
          border-radius: 8px;
          padding: 5px 20px;
          color: var(--color-body-text-status);
          font-weight: bold;
          font-size: 11px;
        }

        .task-notes {
          color: var(--color-body-text-tertiary);
          font-size: 11px;
        }

        .task-author {
          .initials {
            background-color: var(--color-team-fl);
            border-radius: 50%;
            color: var(--color-team-text);
            height: 24px;
            width: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font: 700 14px/1.2 "Asap", sans-serif;
          }
        }

        .task-actions {
          .more-icon {
            fill: var(--color-body-more-icon);
            cursor: pointer;
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
