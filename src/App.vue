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
      <p>Main content goes here</p>
    </main>
  </div>
</template>
<script>
import DashboardSidebar from "@/components/layout/DashboardSidebar.vue";
import TopNav from "@/components/layout/TopNav.vue";

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
    TopNav,
  },
};
</script>

<style lang="scss" scoped>
.layout-grid {
  display: grid;
  grid-template-columns: 140px 1fr;
  grid-template-rows: auto 1fr;
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
    padding: 1rem;
    background: url("@/assets/bg-pattern.jpeg") repeat;
    background-size: auto;
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
