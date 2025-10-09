<template>
  <div class="flex items-center justify-center py-20">
    <div
      class="h-8 w-8 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin"
    ></div>
  </div>
</template>

<style scoped>
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.animate-spin {
  animation: spin 0.8s linear infinite;
}
</style>
