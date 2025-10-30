<template>
  <div :class="['status-badge', statusClass]">
    {{ statusLabel }}
  </div>

  <div :class="dateClass">{{ dateText }}</div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { statuses } from "@/constants";

// Props =------------------------------------
const props = defineProps<{
  status: string;
  statusClass: string;
  dateClass: string;
  dateText: string;
}>();

//TODO: ChatGPT helping to fix the status label mapping

// Computed ------------------------------------
const statusLabel = computed(() => {
  const match = statuses.find((s) => s.value === props.status);
  return match ? match.label : props.status;
});
</script>
