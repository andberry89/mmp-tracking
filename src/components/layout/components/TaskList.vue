<template>
  <div>
    <section class="mt-5 grid">
      <div class="content-column-header">
        <span class="column-header-text"></span>
      </div>
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

    <section
      class="flex items-center gap-[10px] px-[5px] py-[8px] text-[var(--color-add-new-item-text)] font-bold text-[14px] leading-[1.2] font-[Asap,sans-serif] border-2 border-dashed border-[var(--color-add-new-item-border)] cursor-pointer mb-[5px] hover:border-[var(--color-add-new-item-border-hover)] transition-colors duration-200 ease-in-out hover:bg-[var(--white)]"
    >
      <PlusIcon class="fill-[var(--color-add-new)] p-0 m-0 cursor-pointer" />
      <span>Add New Task</span>
    </section>

    <section class="font-[400] text-[12px] leading-[1.2] font-[Asap,sans-serif]">
      <h3
        class="mt-[20px] mb-[5px] font-bold text-[16px] leading-[1.2] font-[Asap,sans-serif] text-[var(--color-body-header-text)]"
      >
        Pending
      </h3>
      <TaskItem
        v-for="doc in documents.pending"
        :key="doc.id"
        :doc="doc"
        class="grid"
        :activeAuthorsByTeam="activeAuthorsByTeam"
      />

      <h3
        class="mt-[20px] mb-[5px] font-bold text-[16px] leading-[1.2] font-[Asap,sans-serif] text-[var(--color-body-header-text)]"
      >
        Ready to Publish
      </h3>
      <TaskItem v-for="doc in documents.rtp" :key="doc.id" :doc="doc" class="grid" />

      <h3
        class="mt-[20px] mb-[5px] font-bold text-[16px] leading-[1.2] font-[Asap,sans-serif] text-[var(--color-body-header-text)]"
      >
        Published
      </h3>
      <TaskItem v-for="doc in documents.published" :key="doc.id" :doc="doc" class="grid" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { authors } from "@/test";
import { PlusIcon } from "@/assets/icons";
import TaskItem from "@/components/layout/components/TaskItem.vue";
import type { DocumentsByStatus } from "@/types";

// Props ------------------------------------
const props = defineProps<{
  documents: DocumentsByStatus;
}>();

// Computed --------------------------------
// filter active authors then sort by team
const activeAuthorsByTeam = computed(() => {
  const active = authors.filter((a) => a.active);

  active.sort((a, b) => {
    const teamCompare = a.team.label.localeCompare(b.team.label);
    if (teamCompare !== 0) return teamCompare;
    return a.lastName.localeCompare(b.lastName);
  });

  const groups: Record<string, typeof active> = {};
  active.forEach((author) => {
    if (!groups[author.team.label]) groups[author.team.label] = [];
    groups[author.team.label].push(author);
  });

  return Object.entries(groups).map(([team, members]) => ({ team, members }));
});
</script>
<style lang="scss" scoped>
@mixin column-layout() {
  display: grid;
  justify-items: start;
  align-items: center;
  grid-template-columns: 20px 1fr 100px 120px 175px 1fr 50px 50px 8px;
  // TODO: WORK ON SPACING FOR RESPONSIVE PURPOSES
  padding: 8px 20px 8px 4px;
}

.grid {
  @include column-layout();
}
</style>
