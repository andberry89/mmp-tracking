<template>
  <div class="model-page p-8">
    <h1 class="page-header">Model Page</h1>
    <p class="text-lg text-gray-700">Welcome to the Model Page!</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const message = ref("Hello from ModelPage!");

onMounted(() => {
  console.log("ModelPage mounted");
});
</script>

<style scoped>
/* No custom styles needed with Tailwind */
</style>
