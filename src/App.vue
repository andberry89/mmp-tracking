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
      <TopNav @tab-change="onTabChange" />
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

// ----------------------------------
// STORE
// ----------------------------------
const authorsStore = useAuthorsStore();
const documentsStore = useDocumentsStore();
const authStore = useAuthStore();
const catalogStore = useCatalogStore();

const canEdit = computed(() => !isSupabaseConfigured || authStore.isEditor);

onMounted(async () => {
  if (!isSupabaseConfigured) {
    authorsStore.initializeAuthors();
    await Promise.all([documentsStore.loadDocuments(), catalogStore.loadCatalog()]);
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
  documentsStore.subscribeToChanges();
}

async function handleSignOut() {
  documentsStore.stopRealtime();
  documentsStore.clearDocuments();
  await authStore.signOut();
}

// ----------------------------------
// STATE
// ----------------------------------
const activeLabel = ref("MMPs");
const ranges = ref(defaultRanges);

// ----------------------------------
// COMPUTED
// ----------------------------------
const sortedAuthors = computed(() => authorsStore.groupedAuthors);
const activeAuthors = computed(() => authorsStore.activeGroupedAuthors);

// ----------------------------------
// METHODS
// ----------------------------------

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
    justify-content: space-between;
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

.account-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 20px;
  font-size: 0.85rem;
}

.account-bar button,
.auth-message button {
  border: 1px solid var(--color-border);
  border-radius: 5px;
  padding: 6px 10px;
  background: white;
  cursor: pointer;
}

.role-label {
  color: #64748b;
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
</style>
