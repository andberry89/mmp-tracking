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
    <h1>Account access isn’t available</h1>
    <p>{{ authStore.error || "Ask an Editor to approve this email address for MMP Tracking." }}</p>
    <button @click="handleSignOut">Sign out</button>
  </main>

  <div v-else class="layout-grid">
    <div id="logo" class="logo"></div>

    <header class="app-header">
      <TopNav :active-tab="activeTopLevel" @tab-change="onTabChange" />
      <div class="account-bar">
        <span v-if="isSupabaseConfigured" class="account-bar__identity">{{ authStore.profile?.display_name || authStore.session?.user.email }}</span>
        <button class="refresh-button" type="button" :disabled="isRefreshing" :aria-label="isRefreshing ? 'Refreshing data' : 'Refresh data'" :title="isRefreshing ? 'Refreshing data…' : 'Refresh data'" @click="refreshWorkspaceData">
          <svg :class="{ 'refresh-button__icon--spinning': isRefreshing }" viewBox="0 0 20 20" aria-hidden="true"><path d="M16.2 8A6.4 6.4 0 0 0 5.5 4.6L3.8 6.2"/><path d="M3.8 2.9v3.5h3.5"/><path d="M3.8 12a6.4 6.4 0 0 0 10.7 3.4l1.7-1.6"/><path d="M16.2 17.1v-3.5h-3.5"/></svg>
        </button>
        <span v-if="refreshMessage" class="refresh-status" :class="{ 'refresh-status--error': refreshFailed }" role="status">{{ refreshMessage }}</span>
        <details v-if="isSupabaseConfigured" ref="accountMenu" class="account-menu" v-click-outside="closeAccountMenu">
          <summary class="account-menu__trigger" aria-label="Account menu" title="Account menu">
            <span class="sr-only">Account menu</span>
            <span class="account-menu__icon" aria-hidden="true"><i></i><i></i><i></i></span>
          </summary>
          <div class="account-menu__panel">
            <span class="role-label">{{ authStore.profile?.role }}</span>
            <button @click="openAccountSettings">Account settings</button>
            <button v-if="authStore.isEditor" @click="openUserAccess">Manage users</button>
            <button @click="signOutFromMenu">Sign out</button>
          </div>
        </details>
      </div>
    </header>

    <aside id="sidebar">
      <DashboardSidebar :authors="activeAuthors" />
    </aside>

    <main id="content">
      <MainContent
        :authors="sortedAuthors"
        :activeLabel="activeLabel"
        :can-edit="canEdit"
        @catalog-tab-change="onCatalogTabChange"
      />
    </main>

    <ModalsContainer />
    <UserAccessModal v-model="userAccessOpen" @close="userAccessOpen = false" />
    <UserSettingsModal v-model="userSettingsOpen" @close="userSettingsOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { ModalsContainer } from "vue-final-modal";

import DashboardSidebar from "@/components/layout/DashboardSidebar.vue";
import MainContent from "@/components/layout/MainContent.vue";
import TopNav from "@/components/layout/TopNav.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import LoginView from "@/components/auth/LoginView.vue";
import PasswordSetupView from "@/components/auth/PasswordSetupView.vue";
import UserAccessModal from "@/components/admin/UserAccessModal.vue";
import UserSettingsModal from "@/components/admin/UserSettingsModal.vue";
import { useAuthStore } from "@/stores/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

import { useDocumentsStore } from "@/stores/documents";
import { useAuthorsStore } from "@/stores/authors";
import { useCatalogStore } from "@/stores/catalog";
import { useChangeoverStore } from "@/stores/changeover";
import { usePublicationHistoryStore } from "@/stores/publicationHistory";
import { usePageAuditStore } from "@/stores/pageAudit";
import { useRankingsStore } from "@/stores/rankings";

// ----------------------------------
// STORE
// ----------------------------------
const authorsStore = useAuthorsStore();
const documentsStore = useDocumentsStore();
const authStore = useAuthStore();
const catalogStore = useCatalogStore();
const changeoverStore = useChangeoverStore();
const publicationHistoryStore = usePublicationHistoryStore();
const pageAuditStore = usePageAuditStore();
const rankingsStore = useRankingsStore();

const canEdit = computed(() => !isSupabaseConfigured || authStore.isEditor);
const userAccessOpen = ref(false);
const userSettingsOpen = ref(false);
const isRefreshing = ref(false);
const refreshMessage = ref("");
const refreshFailed = ref(false);
const accountMenu = ref<HTMLDetailsElement | null>(null);
let loadedWorkspaceUserId: string | null = null;
let workspaceLoadPromise: Promise<void> | null = null;
let refreshMessageTimer: number | undefined;

function closeAccountMenu() {
  if (accountMenu.value) accountMenu.value.open = false;
}

function openAccountSettings() {
  closeAccountMenu();
  userSettingsOpen.value = true;
}

function openUserAccess() {
  closeAccountMenu();
  userAccessOpen.value = true;
}

function signOutFromMenu() {
  closeAccountMenu();
  handleSignOut();
}

onMounted(async () => {
  if (!isSupabaseConfigured) {
    authorsStore.initializeAuthors();
    await Promise.all([documentsStore.loadDocuments(), catalogStore.loadCatalog()]);
    await changeoverStore.load();
    return;
  }

  await authStore.initializeAuth();
});

watch(
  () => [
    authStore.session?.user.id ?? null,
    authStore.profile?.id ?? null,
    authStore.needsPasswordSetup,
  ] as const,
  ([sessionUserId, profileUserId, needsPasswordSetup]) => {
    if (sessionUserId && sessionUserId === profileUserId && !needsPasswordSetup) {
      void loadWorkspaceData();
    }
  },
  { immediate: true },
);

async function loadWorkspaceData() {
  const userId = authStore.session?.user.id;
  if (!userId || authStore.profile?.id !== userId || authStore.needsPasswordSetup) return;
  if (loadedWorkspaceUserId === userId) return;
  if (workspaceLoadPromise) return workspaceLoadPromise;

  workspaceLoadPromise = (async () => {
    await Promise.all([
      authorsStore.loadAuthors(),
      documentsStore.loadDocuments(),
      catalogStore.loadCatalog(),
    ]);
    await changeoverStore.load();
    documentsStore.subscribeToChanges();
    publicationHistoryStore.subscribeToChanges();
    catalogStore.subscribeToChanges();
    changeoverStore.subscribeToChanges();
    loadedWorkspaceUserId = userId;
  })();

  try {
    await workspaceLoadPromise;
  } finally {
    workspaceLoadPromise = null;
  }
}

async function refreshWorkspaceData() {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  refreshFailed.value = false;
  refreshMessage.value = "Refreshing…";
  if (refreshMessageTimer) window.clearTimeout(refreshMessageTimer);

  try {
    if (workspaceLoadPromise) await workspaceLoadPromise;
    await Promise.all([
      authorsStore.loadAuthors(),
      documentsStore.loadDocuments(),
      catalogStore.loadCatalog(),
    ]);
    await Promise.all([
      changeoverStore.load(),
      pageAuditStore.load(),
      rankingsStore.load(),
      publicationHistoryStore.refresh(),
    ]);

    const hasError = [
      authorsStore.error,
      documentsStore.error,
      catalogStore.error,
      changeoverStore.error,
      pageAuditStore.error,
      rankingsStore.error,
      publicationHistoryStore.error,
    ].some(Boolean);
    refreshFailed.value = hasError;
    refreshMessage.value = hasError ? "Some data could not refresh. Try again." : "Data refreshed";
  } catch {
    refreshFailed.value = true;
    refreshMessage.value = "Could not refresh data. Try again.";
  } finally {
    isRefreshing.value = false;
    refreshMessageTimer = window.setTimeout(() => { refreshMessage.value = ""; }, refreshFailed.value ? 6000 : 2500);
  }
}

async function handleSignOut() {
  loadedWorkspaceUserId = null;
  documentsStore.stopRealtime();
  publicationHistoryStore.clear();
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

// ----------------------------------
// COMPUTED
// ----------------------------------
const sortedAuthors = computed(() => authorsStore.groupedAuthors);
const activeAuthors = computed(() => authorsStore.activeGroupedAuthors);
const activeTopLevel = computed(() => {
  if (activeLabel.value === "MMPs" || activeLabel.value === "Changeover" || activeLabel.value === "Page Audit" || activeLabel.value === "Rankings") return activeLabel.value;
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
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 24px;
  font-size: 0.85rem;
  color: var(--gray-dark-3);
  white-space: nowrap;
}

.account-bar__identity { max-width: min(34vw, 340px); overflow: hidden; text-overflow: ellipsis; }
.account-menu { position: relative; }
.refresh-button { display: grid; width: 36px; height: 36px; place-items: center; padding: 0 !important; }
.refresh-button svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
.refresh-button__icon--spinning { animation: refresh-spin .8s linear infinite; }
.refresh-status { position: absolute; z-index: 60; top: calc(100% + 8px); right: 44px; max-width: min(260px, 70vw); overflow: hidden; padding: 6px 9px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--white); box-shadow: var(--color-surface-shadow-hover); color: #3d7442; font-size: .72rem; text-overflow: ellipsis; white-space: nowrap; }
.refresh-status--error { border-color: #d9a4a0; color: #9d2f2f; }
@keyframes refresh-spin { to { transform: rotate(360deg); } }
.account-menu__trigger { display: grid; width: 36px; height: 36px; place-items: center; border: 1px solid var(--color-border); border-radius: 6px; background: var(--white); color: var(--gray-dark-3); cursor: pointer; list-style: none; }
.account-menu__trigger::-webkit-details-marker { display: none; }
.account-menu__trigger:hover, .account-menu__trigger:focus-visible { border-color: var(--green-2); background: var(--color-green-soft); }
.account-menu__trigger:focus-visible, .account-menu__panel button:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }
.account-menu__icon { display: grid; gap: 4px; }
.account-menu__icon i { display: block; width: 17px; height: 2px; border-radius: 2px; background: currentColor; }
.account-menu__panel { position: absolute; z-index: 50; top: calc(100% + 8px); right: 0; display: grid; min-width: 176px; gap: 3px; padding: 7px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--white); box-shadow: var(--color-surface-shadow-hover); }
.account-menu__panel .role-label { padding: 7px 8px; border-bottom: 1px solid var(--color-divider); }
.account-menu__panel button { width: 100%; border: 0; text-align: left; }

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

.account-bar .account-menu__panel button { border: 0; padding: 7px 8px; background: transparent; text-align: left; }
.account-bar .account-menu__panel button:hover { border: 0; background: var(--white-soft); }

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
    grid-template-columns: 160px minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    min-height: 620px;
  }

  .layout-grid header.app-header {
    flex-wrap: wrap;
    align-content: center;
    row-gap: 4px;
    padding-right: 8px;
  }

  .account-bar {
    min-width: 0;
    margin: 0 8px 0 16px;
    gap: 6px;
    font-size: 0.75rem;
  }

  .account-bar__identity { max-width: 38vw; }
}

@media (max-width: 620px) {
  #app {
    padding: 0;
  }

  .layout-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr) auto;
    grid-template-areas:
      "header"
      "content"
      "sidebar";
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
      display: block;
      padding: 0;
      overflow: hidden;
    }

    .account-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      margin: 0;
      padding: 8px 12px;
      border-top: 1px solid var(--color-border);
    }

    .account-bar__identity { max-width: 58vw; }

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
@media (prefers-reduced-motion: reduce) { .refresh-button__icon--spinning { animation: none; } }
</style>
