<template>
  <div class="layout-grid">
    <div id="logo" class="logo"></div>

    <header>
      <TopNav @tab-change="onTabChange" />
    </header>

    <aside id="sidebar">
      <DashboardSidebar
        :documents="sortedDocuments"
        :ranges="ranges"
        :authors="getActiveAuthors(sortedAuthors)"
      />
    </aside>

    <main id="content">
      <MainContent
        :documents="sortedDocuments"
        :ranges="ranges"
        :authors="sortedAuthors"
        :activeLabel="activeLabel"
        @updateTask="handleTaskUpdate"
      />
    </main>

    <ModalsContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ModalsContainer } from "vue-final-modal";

import DashboardSidebar from "@/components/layout/DashboardSidebar.vue";
import MainContent from "@/components/layout/MainContent.vue";
import TopNav from "@/components/layout/TopNav.vue";

import { sortDocuments, sortAuthors, getActiveAuthors } from "@/utils/sort-functions";
import { applyTaskRules } from "@/utils/apply-task-rules";
import { ranges as defaultRanges } from "@/constants/constants";
import { testDocuments, authors as testAuthors } from "@/test";

import type { DocumentsByStatus, AuthorGroups, TaskDocument } from "@/types";

// ─── Reactive State ──────────────────────────────────────────────────────────
const activeLabel = ref("MMPs");
const ranges = ref(defaultRanges);
const documents = ref<TaskDocument[]>(structuredClone(testDocuments));

// ─── Computed ──────────────────────────────────────────────
const sortedDocuments = computed(() => sortDocuments(documents.value));
const sortedAuthors = computed(() => sortAuthors(testAuthors));

// ─── Methods ────────────────────────────────────────────────────────────────
function handleTaskUpdate(updatedTask: TaskDocument) {
  const normalized = applyTaskRules(updatedTask);

  // Check to see that the task exists and update it
  const taskExists = documents.value.some((t) => t.id === normalized.id);

  // If task exists, map to documents.value a new array
  // For each task check to see if its the updated task, if so return the updated task, else return t
  // If task does not exist, spread documents.value and add the updated task to the end
  documents.value = taskExists
    ? documents.value.map((t) => (t.id === normalized.id ? normalized : t))
    : [...documents.value, normalized];

  console.log("✅ Task updated and regrouped:", normalized);
}

function onTabChange(label: string) {
  activeLabel.value = label;
}
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
