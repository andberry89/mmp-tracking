<template>
  <div :class="['status-badge', statusClass]" :style="{ backgroundColor: statusColor }">
    {{ statusLabel }}
  </div>

  <div :class="dateClass">{{ dateText }}</div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { STATUS_VALUE_MAP, statuses, statusClassMap } from "@/constants";

// Props =------------------------------------
const props = defineProps<{
  status: string;
  dateClass: string;
  dateText: string;
}>();

// Map status text to internal key
const statusValueMap: Record<string, string> = {
  Pending: "pending",
  "Ready to Edit": "rte",
  "Ready to Publish": "rtp",
  Scheduled: "scheduled",
  Updated: "updated",
  Published: "published",
};

// Computed ------------------------------------

// Normalize status and then find corresponding status info
const normalizedStatus = computed(() => {
  return (
    STATUS_VALUE_MAP[props.status as keyof typeof STATUS_VALUE_MAP] ?? props.status.toLowerCase()
  );
});
const statusInfo = computed(
  () =>
    statuses.find((s) => s.value === normalizedStatus.value) ?? {
      label: props.status,
      color: "inherit",
    }
);

// Reactive label and color
const statusLabel = computed(() => statusInfo.value.label);
const statusColor = computed(() => statusInfo.value.color);

// Class mapping
const statusClass = computed(
  () => statusClassMap[normalizedStatus.value] || "bg-gray-200 text-gray-800"
);
</script>
