<template>
  <div :class="['status-badge', statusClass]">
    {{ status }}
  </div>

  <div :class="dateClass">{{ dateText }}</div>
</template>
<script setup lang="ts">
// Props =------------------------------------
const props = defineProps<{
  status: string;
  statusClass: string;
  dateClass: string;
  dateText: string;
}>();
</script>
