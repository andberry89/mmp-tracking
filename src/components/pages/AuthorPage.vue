<template>
  <ReferenceDataPanel
    title="Authors"
    kind="author"
    description="Writers are grouped by Buyer’s Guide, Car and Driver, and Freelancers for assignment."
    :can-edit="canEdit"
  />
</template>

<script setup lang="ts">
import ReferenceDataPanel from "@/components/pages/components/ReferenceDataPanel.vue";
defineProps<{ canEdit?: boolean }>();
</script>
