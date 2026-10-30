<template>
  <nav ref="navElement" class="top-nav" aria-label="Main navigation">
    <button
      v-for="label in tabs"
      :key="label"
      :ref="(element) => setTabElement(label, element)"
      :class="['top-nav__link', label === activeTab && 'top-nav__link--active']"
      type="button"
      :aria-current="label === activeTab ? 'page' : undefined"
      @click="handleClick(label)"
    >
      {{ label }}
    </button>
    <span
      class="top-nav__indicator"
      :style="{ left: `${indicator.left}px`, width: `${indicator.width}px` }"
      aria-hidden="true"
    />
  </nav>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

// Tabs to render in the navigation
const tabs = ["MMPs", "Changeover", "Page Audit", "Catalog"];

const props = defineProps<{ activeTab: string }>();
const activeTab = computed(() => props.activeTab);
const navElement = ref<HTMLElement | null>(null);
const tabElements = new Map<string, HTMLButtonElement>();
const indicator = reactive({ left: 0, width: 0 });

// Define emit
const emit = defineEmits<{
  (e: "tab-change", label: string): void;
}>();

function handleClick(label: string) {
  emit("tab-change", label);
}

function setTabElement(label: string, element: unknown) {
  if (element instanceof HTMLButtonElement) tabElements.set(label, element);
  else tabElements.delete(label);
}

function updateIndicator() {
  const nav = navElement.value;
  const activeElement = tabElements.get(activeTab.value);
  if (!nav || !activeElement) return;

  const navRect = nav.getBoundingClientRect();
  const activeRect = activeElement.getBoundingClientRect();
  indicator.left = activeRect.left - navRect.left + nav.scrollLeft;
  indicator.width = activeRect.width;
}

function onResize() {
  updateIndicator();
}

watch(activeTab, async () => {
  await nextTick();
  updateIndicator();
});

onMounted(async () => {
  await nextTick();
  updateIndicator();
  window.addEventListener("resize", onResize);
  void document.fonts?.ready.then(updateIndicator);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
});
</script>

<style scoped>
.top-nav {
  position: relative;
  display: flex;
  align-items: stretch;
  align-self: stretch;
  gap: clamp(18px, 2.5vw, 38px);
  min-width: 0;
  padding: 0 clamp(18px, 2.2vw, 32px);
}

.top-nav__link {
  position: relative;
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  padding: 3px 0 0;
  color: var(--color-header-text);
  border: 0;
  background: transparent;
  font: 700 clamp(20px, 2.1vw, 28px)/1.15 "Monda", sans-serif;
  cursor: pointer;
  transition: color 160ms ease;
}

.top-nav__link:hover,
.top-nav__link--active {
  color: var(--color-header-text-active);
}

.top-nav__link:focus-visible {
  outline: 2px solid var(--green-2);
  outline-offset: -5px;
}

.top-nav__indicator {
  position: absolute;
  bottom: 0;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: var(--color-header-text-underline);
  pointer-events: none;
  transition: left 240ms cubic-bezier(0.22, 1, 0.36, 1),
    width 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: reduce) {
  .top-nav__indicator {
    transition: none;
  }
}
</style>
