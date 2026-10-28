<template>
  <ReferenceDataPanel
    title="Models"
    kind="model"
    description="Models belong to a make; each model year carries its own Segment."
    :can-edit="canEdit"
  />
</template>

<script setup lang="ts">
import ReferenceDataPanel from "@/components/pages/components/ReferenceDataPanel.vue";
defineProps<{ canEdit?: boolean }>();
</script>
