<template>
  <ReferenceDataPanel
    title="Makes"
    kind="make"
    description="Vehicle manufacturers shared across the MMP catalog and task forms."
    :can-edit="canEdit"
  />
</template>

<script setup lang="ts">
import ReferenceDataPanel from "@/components/pages/components/ReferenceDataPanel.vue";
defineProps<{ canEdit?: boolean }>();
</script>
