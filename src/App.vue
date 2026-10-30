<template>
  <main v-if="isSupabaseConfigured && !authStore.isReady" class="auth-message">
    <LoadingSpinner />
    <p>Connecting to your team account…</p>
  </main>

  <PasswordSetupView
    v-else-if="isSupabaseConfigured && authStore.session && authStore.needsPasswordSetup"
    @completed="loadWorkspaceData"
  />

  <LoginView v-else-if="isSupabaseConfigured && !authStore.session" @signed-in="loadWorkspaceData" />

  <main v-else-if="isSupabaseConfigured && !authStore.profile" class="auth-message">
    <h1>Account access isn’t set up</h1>
    <p>{{ authStore.error || "An Editor needs to assign your app role." }}</p>
    <button @click="handleSignOut">Sign out</button>
  </main>

  <div v-else class="layout-grid">
    <div id="logo" class="logo"></div>

    <header>
      <TopNav :active-tab="activeTopLevel" @tab-change="onTabChange" />
      <div v-if="isSupabaseConfigured" class="account-bar">
        <span>{{ authStore.profile?.display_name || authStore.session?.user.email }}</span>
        <span class="role-label">{{ authStore.profile?.role }}</span>
        <button @click="handleSignOut">Sign out</button>
      </div>
    </header>

    <aside id="sidebar">
      <DashboardSidebar :ranges="ranges" :authors="activeAuthors" />
    </aside>

    <main id="content">
      <MainContent
        :ranges="ranges"
        :authors="sortedAuthors"
        :activeLabel="activeLabel"
        :can-edit="canEdit"
        @catalog-tab-change="onCatalogTabChange"
      />
    </main>

    <ModalsContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ModalsContainer } from "vue-final-modal";

import DashboardSidebar from "@/components/layout/DashboardSidebar.vue";
import MainContent from "@/components/layout/MainContent.vue";
import TopNav from "@/components/layout/TopNav.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import LoginView from "@/components/auth/LoginView.vue";
import PasswordSetupView from "@/components/auth/PasswordSetupView.vue";
import { useAuthStore } from "@/stores/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

import { ranges as defaultRanges } from "@/constants";

import { useDocumentsStore } from "@/stores/documents";
import { useAuthorsStore } from "@/stores/authors";
import { useCatalogStore } from "@/stores/catalog";
import { useChangeoverStore } from "@/stores/changeover";

// ----------------------------------
// STORE
// ----------------------------------
const authorsStore = useAuthorsStore();
const documentsStore = useDocumentsStore();
const authStore = useAuthStore();
const catalogStore = useCatalogStore();
const changeoverStore = useChangeoverStore();

const canEdit = computed(() => !isSupabaseConfigured || authStore.isEditor);

onMounted(async () => {
  if (!isSupabaseConfigured) {
    authorsStore.initializeAuthors();
    await Promise.all([documentsStore.loadDocuments(), catalogStore.loadCatalog()]);
    await changeoverStore.load();
    return;
  }

  await authStore.initializeAuth();
  if (authStore.session && authStore.profile) await loadWorkspaceData();
});

async function loadWorkspaceData() {
  if (!authStore.session || !authStore.profile) return;
  await Promise.all([
    authorsStore.loadAuthors(),
    documentsStore.loadDocuments(),
    catalogStore.loadCatalog(),
  ]);
  await changeoverStore.load();
  documentsStore.subscribeToChanges();
  catalogStore.subscribeToChanges();
  changeoverStore.subscribeToChanges();
}

async function handleSignOut() {
  documentsStore.stopRealtime();
  catalogStore.stopRealtime();
  changeoverStore.stopRealtime();
  documentsStore.clearDocuments();
  await authStore.signOut();
}

// ----------------------------------
// STATE
// ----------------------------------
const activeLabel = ref("MMPs");
const activeCatalogLabel = ref("Makes");
const ranges = ref(defaultRanges);

// ----------------------------------
// COMPUTED
// ----------------------------------
const sortedAuthors = computed(() => authorsStore.groupedAuthors);
const activeAuthors = computed(() => authorsStore.activeGroupedAuthors);
const activeTopLevel = computed(() => {
  if (activeLabel.value === "MMPs" || activeLabel.value === "Changeover") return activeLabel.value;
  return "Catalog";
});

// ----------------------------------
// METHODS
// ----------------------------------

function onTabChange(label: string) {
  activeLabel.value = label === "Catalog" ? activeCatalogLabel.value : label;
}

function onCatalogTabChange(label: string) {
  activeCatalogLabel.value = label;
  activeLabel.value = label;
}
</script>

<style lang="scss" scoped>
.layout-grid {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  grid-template-rows: 82px minmax(0, 1fr);
  grid-template-areas:
    "logo header"
    "sidebar content";
  min-height: min(760px, calc(100vh - 48px));
  height: calc(100vh - 48px);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background-header);
  box-shadow: var(--color-shell-shadow);

  #logo {
    grid-area: logo;
    position: relative;
    background-color: var(--color-background-logo);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white);
    font: 700 1.4rem/1 "Monda", sans-serif;
    letter-spacing: 0.12em;
  }

  #logo::before {
    content: "MMP";
  }

  #logo::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 24px;
    right: 24px;
    height: 3px;
    background: var(--green-2);
  }

  header {
    grid-area: header;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--color-background-header);
    border-bottom: 1px solid var(--color-border);
    min-width: 0;
  }

  #sidebar {
    grid-area: sidebar;
    background-color: var(--color-background-sidebar);
    color: var(--color-sidebar-text);
    padding: 24px 16px;
    overflow-y: auto;
  }

  #content {
    grid-area: content;
    min-width: 0;
    overflow: auto;
    padding: clamp(20px, 2.2vw, 32px);
    background-color: var(--color-background);
    background-image: url("@/assets/bg-pattern.jpeg");
    background-repeat: repeat;
  }
}

.account-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 24px;
  font-size: 0.85rem;
  color: var(--gray-dark-3);
  white-space: nowrap;
}

.account-bar button,
.auth-message button {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 6px 10px;
  background: var(--white);
  color: var(--gray-dark-3);
  cursor: pointer;
}

.account-bar button:hover,
.auth-message button:hover {
  border-color: var(--green-2);
  background: var(--color-green-soft);
}

.role-label {
  color: var(--gray-light-4);
  text-transform: capitalize;
}

.auth-message {
  min-height: 100vh;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
}

@media (max-width: 900px) {
  .layout-grid {
    grid-template-columns: 180px minmax(0, 1fr);
    grid-template-rows: 72px minmax(0, 1fr);
    min-height: 620px;
  }

  .account-bar {
    margin-right: 12px;
    gap: 6px;
    font-size: 0.75rem;
  }
}

@media (max-width: 620px) {
  #app {
    padding: 0;
  }

  .layout-grid {
    grid-template-columns: 1fr;
    grid-template-rows: 64px auto minmax(0, 1fr);
    grid-template-areas:
      "header"
      "sidebar"
      "content";
    height: auto;
    min-height: 100vh;
    overflow: visible;
    border: 0;
    border-radius: 0;
    box-shadow: none;

    #logo {
      display: none;
    }

    header {
      grid-area: header;
      overflow-x: auto;
    }

    #sidebar {
      grid-area: sidebar;
      padding: 14px 16px;
      max-height: 230px;
      overflow: auto;
    }

    #content {
      grid-area: content;
      overflow: visible;
      padding: 18px 14px;
    }
  }
}
</style>
