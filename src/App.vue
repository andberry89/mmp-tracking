<template>
  <div class="layout-grid">
    <div id="logo" class="logo"></div>
    <header>
      <TopNav />
    </header>
    <aside id="sidebar">
      <DashboardSidebar
        :documents="documents"
        :ranges="ranges"
        :authors="getActiveAuthors(authors)"
      />
    </aside>
    <main id="content">
      <MainContent :documents="documents" :ranges="ranges" :authors="authors" />
    </main>
  </div>
</template>
<script>
import DashboardSidebar from "@/components/layout/DashboardSidebar.vue";
import TopNav from "@/components/layout/TopNav.vue";
import MainContent from "@/components/layout/MainContent.vue";
import { sortDocuments, sortAuthors, getActiveAuthors } from "@/utils/sort-functions";
import { ranges } from "@/utils/constants";
import testDocuments from "./test-documents";
import authors from "./test-authors";

export default {
  name: "App",
  data() {
    return {
      ranges: ranges,
      authors: {
        bg: [],
        cd: [],
        freelance: [],
        all: [],
      },
      documents: {
        published: [],
        pending: [],
        rtp: [],
      },
    };
  },
  components: {
    DashboardSidebar,
    MainContent,
    TopNav,
  },
  methods: {
    getActiveAuthors: getActiveAuthors,
    sortDocuments: sortDocuments,
    sortAuthors: sortAuthors,
  },
  created() {
    this.documents = this.sortDocuments(testDocuments);
    this.authors = this.sortAuthors(authors);
  },
};
</script>

<style lang="scss" scoped>
.layout-grid {
  display: grid;
  grid-template-columns: 175px 1fr;
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
