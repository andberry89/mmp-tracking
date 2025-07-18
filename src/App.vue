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
              <span class="search-icon material-symbols-outlined"> search </span>
              <input
                type="search"
                class="search-input"
                placeholder="Search by vehicle or segment"
              />
            </div>
          </form>
          <DropdownMenu :options="ranges" :label="'Author'" />
          <DropdownMenu :options="ranges" :label="'Status'" />
          <!-- GOOGLE FONT ICONS SVGS ALLOW FOR MORE CUSTOMIZATION-->
          <span class="icon-wrapper"
            ><img
              src="/assets/icons/sort.png"
              height="12"
              width="14"
              alt="Sort Icon"
              class="sort-icon"
          /></span>
          <span class="icon-wrapper"
            ><img
              src="/assets/icons/filter.png"
              height="16"
              width="16"
              alt="Filter Icon"
              class="filter-icon"
          /></span>
        </div>
      </section>
      <section class="content-column-headers">
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
    </main>
  </div>
</template>
<script>
import DashboardSidebar from "@/components/layout/DashboardSidebar.vue";
import TopNav from "@/components/layout/TopNav.vue";
import DropdownMenu from "@/components/common/DropdownMenu.vue";

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
    DropdownMenu,
    TopNav,
  },
};
</script>

<style lang="scss" scoped>
@mixin column-layout() {
  display: grid;
  justify-items: start;
  grid-template-columns: 1fr 100px 120px 175px 1fr 50px 50px 8px; // WORK ON SPACING FOR RESPONSIBE PURPOSES
  margin-top: 30px;
  padding: 0 10px 0 20px;
  //TODO: WORK ON GRID LAYOUT
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
    color: var(--color-text);
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
        .icon-wrapper {
          --sides: 22px;

          width: var(--sides);
          height: var(--sides);
          background-color: var(--color-input-background);
          border: 1px solid var(--color-input-border);
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }

    .content-column-headers {
      @include column-layout();
      margin-top: 20px;

      .content-column-header {
        text-align: center;
        padding: 10px;
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
