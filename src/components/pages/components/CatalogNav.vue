<template>
  <nav ref="navElement" class="catalog-nav" aria-label="Catalog sections">
    <button
      v-for="section in sections"
      :key="section"
      :ref="(element) => setTabElement(section, element)"
      type="button"
      :class="['catalog-nav__link', section === activeLabel && 'catalog-nav__link--active']"
      :aria-current="section === activeLabel ? 'page' : undefined"
      @click="$emit('select', section)"
    >
      {{ section }}
    </button>
    <span
      class="catalog-nav__indicator"
      :style="{ left: `${indicator.left}px`, width: `${indicator.width}px` }"
      aria-hidden="true"
    />
  </nav>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

const props = defineProps<{ activeLabel: string }>();
defineEmits<{ (event: "select", label: string): void }>();

const sections = ["Makes", "Models", "Segments", "Authors"];
const navElement = ref<HTMLElement | null>(null);
const tabElements = new Map<string, HTMLButtonElement>();
const indicator = reactive({ left: 0, width: 0 });

function setTabElement(label: string, element: unknown) {
  if (element instanceof HTMLButtonElement) tabElements.set(label, element);
  else tabElements.delete(label);
}

function updateIndicator() {
  const nav = navElement.value;
  const activeElement = tabElements.get(props.activeLabel);
  if (!nav || !activeElement) return;

  const navRect = nav.getBoundingClientRect();
  const activeRect = activeElement.getBoundingClientRect();
  indicator.left = activeRect.left - navRect.left + nav.scrollLeft;
  indicator.width = activeRect.width;
}

function onResize() {
  updateIndicator();
}

watch(() => props.activeLabel, async () => {
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
.catalog-nav {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  margin: -4px 0 22px;
  border-bottom: 1px solid var(--color-divider);
}

.catalog-nav__link {
  position: relative;
  min-height: 38px;
  padding: 0 14px;
  border: 0;
  background: transparent;
  color: var(--gray-light-4);
  font: 600 0.92rem/1.2 "Asap", sans-serif;
  cursor: pointer;
  transition: color 140ms ease;
}

.catalog-nav__link:hover,
.catalog-nav__link--active {
  color: var(--gray-dark-5);
}

.catalog-nav__indicator {
  position: absolute;
  bottom: -1px;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: var(--green-2);
  pointer-events: none;
  transition: left 240ms cubic-bezier(0.22, 1, 0.36, 1),
    width 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

.catalog-nav__link:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: -3px;
}

@media (max-width: 620px) {
  .catalog-nav {
    gap: 0;
    overflow-x: auto;
  }

  .catalog-nav__link {
    flex: 0 0 auto;
    padding: 0 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .catalog-nav__indicator {
    transition: none;
  }
}
</style>
