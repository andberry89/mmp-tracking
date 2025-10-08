<template>
  <div class="author-page p-8">
    <h1 class="text-3xl font-bold mb-4">author Page</h1>
    <p class="text-lg text-gray-700">Welcome to the author Page!</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const message = ref("Hello from authorPage!");

onMounted(() => {
  console.log("authorPage mounted");
});
</script>

<style scoped>
/* No custom styles needed with Tailwind */
</style>
