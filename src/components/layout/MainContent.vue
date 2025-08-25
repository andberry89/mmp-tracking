<template>
  <div>
    <TaskPage :documents="documents" :ranges="ranges" :authors="authors" />
  </div>
</template>
<script>
import TaskPage from "@/components/pages/TaskPage.vue";
export default {
  name: "MainContent",
  props: {
    documents: {
      type: Object,
      required: true,
    },
    authors: {
      type: Object,
      required: true,
    },
    ranges: {
      type: Array,
      required: true,
    },
  },
  components: {
    TaskPage,
  },
};
</script>
<style lang="scss" scoped></style>
