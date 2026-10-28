<template>
  <ReferenceDataPanel
    title="Segments"
    kind="segment"
    description="Standardized vehicle categories that populate from the selected model."
    :can-edit="canEdit"
  />
</template>

<script setup lang="ts">
import ReferenceDataPanel from "@/components/pages/components/ReferenceDataPanel.vue";
defineProps<{ canEdit?: boolean }>();
</script>
