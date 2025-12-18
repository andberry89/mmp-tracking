<template>
  <div :class="['status-badge', statusClass]" :style="{ backgroundColor: statusColor }">
    {{ statusLabel }}
  </div>

  <div :class="dateClass">{{ dateText }}</div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { statuses, STATUS_CLASS_MAP } from "@/constants";

import type { TaskStatus } from "@/types";

// ----------------------------------
// Props
// ----------------------------------
const props = defineProps<{
  status: TaskStatus;
  dateClass: string;
  dateText: string;
}>();

// ----------------------------------
// Computed
// ----------------------------------
const statusInfo = computed(
  () =>
    statuses.find((s) => s.value === props.status) ?? {
      label: props.status,
      color: "inherit",
    }
);

// Normalize status and then find corresponding status info
const normalizedStatus = computed(() => {
  return (
    STATUS_VALUE_MAP[props.status as keyof typeof STATUS_VALUE_MAP] ?? props.status.toLowerCase()
  );
});

// Reactive label and color
const statusLabel = computed(() => statusInfo.value.label);
const statusColor = computed(() => statusInfo.value.color);

// Class mapping
const statusClass = computed(() => STATUS_CLASS_MAP[props.status] || "bg-gray-200 text-gray-800");
</script>
