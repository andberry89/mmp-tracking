<template>
  <div class="make-page p-8">
    <h1 class="text-3xl font-bold mb-4">Make Page</h1>
    <p class="text-lg text-gray-700">Welcome to the Make Page!</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const message = ref("Hello from MakePage!");

onMounted(() => {
  console.log("MakePage mounted");
});
</script>

<style scoped>
/* No custom styles needed with Tailwind */
</style>
