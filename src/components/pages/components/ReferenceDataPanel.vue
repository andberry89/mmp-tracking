<template>
  <section class="reference-panel" aria-labelledby="reference-panel-title">
    <div class="reference-panel__accent" aria-hidden="true"></div>
    <div class="reference-panel__content">
      <h2 id="reference-panel-title">{{ title }} records</h2>
      <p>{{ description }}</p>
      <span class="reference-panel__note">Catalog editing is the next step for this screen.</span>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
}>();
</script>

<style scoped>
.reference-panel {
  display: grid;
  grid-template-columns: 4px minmax(0, 1fr);
  gap: 22px;
  max-width: 820px;
  padding: 28px 30px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--white);
  box-shadow: var(--color-surface-shadow);
}

.reference-panel__accent {
  border-radius: 4px;
  background: var(--green-2);
}

.reference-panel h2 {
  margin: 0 0 8px;
  color: var(--gray-dark-5);
  font: 700 1.35rem/1.25 "Monda", sans-serif;
}

.reference-panel__content > p {
  max-width: 60ch;
  margin: 0;
  color: var(--gray-dark-3);
  line-height: 1.55;
}

.reference-panel__note {
  display: inline-block;
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px solid var(--color-divider);
  color: var(--gray-light-4);
  font-size: 0.8rem;
}

@media (max-width: 620px) {
  .reference-panel {
    padding: 22px 18px;
  }
}
</style>
