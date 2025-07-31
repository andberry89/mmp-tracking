<template>
  <div>
    <section class="content-column-headers grid">
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
    <section class="add-new">
      <PlusIcon class="add-new-btn" />
      <span>Add New Task</span>
    </section>
    <section class="task-list">
      <TaskItem v-for="doc in documents" :key="doc.id" :doc="doc" class="grid" />
    </section>
  </div>
</template>
<script>
import { PlusIcon } from "@/assets/icons";
import TaskItem from "@/components/layout/components/TaskItem.vue";

export default {
  name: "TaskList",
  components: {
    PlusIcon,
    TaskItem,
  },
  props: {
    documents: {
      type: Array,
      required: true,
    },
  },
};
</script>
<style lang="scss" scoped>
@mixin column-layout() {
  display: grid;
  justify-items: start;
  align-items: center;
  grid-template-columns: 20px 1fr 100px 120px 175px 1fr 50px 50px 8px;
  // TODO: WORK ON SPACING FOR RESPONSIBE PURPOSES
  padding: 0 20px 0 4px;
}

.grid {
  @include column-layout();
}

.content-column-headers {
  margin-top: 20px;

  .content-column-header {
    text-align: center;
    padding: 10px 0;
    background-color: var(--color-header-background);
    border-radius: 4px;

    .column-header-text {
      font: 700 14px/1.2 "Asap", sans-serif;
      color: var(--color-body-column-header-text);
      display: block;
      width: 100%;
    }
  }
}

.add-new {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 5px;
  color: var(--color-add-new-item-text);
  font: 700 14px/1.2 "Asap", sans-serif;
  border: 2px dashed var(--color-add-new-item-border);
  cursor: pointer;
  margin-bottom: 5px;

  .add-new-btn {
    fill: var(--color-add-new);
    padding: 0;
    margin: 0;
    cursor: pointer;
  }
}

.task-list {
  font: 400 12px/1.2 "Asap", sans-serif;
}
</style>
