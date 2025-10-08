<template>
  <div class="segment-page p-8">
    <h1 class="text-3xl font-bold mb-4">segment Page</h1>
    <p class="text-lg text-gray-700">Welcome to the segment Page!</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const message = ref("Hello from segmentPage!");

onMounted(() => {
  console.log("segmentPage mounted");
});
</script>

<style scoped>
/* No custom styles needed with Tailwind */
</style>
