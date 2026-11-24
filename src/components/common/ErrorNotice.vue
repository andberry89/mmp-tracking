<template>
  <div class="error-notice" :class="{ 'error-notice--compact': compact }" role="alert" aria-atomic="true">
    <span class="error-notice__icon" aria-hidden="true">!</span>
    <div class="error-notice__message"><slot /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ compact?: boolean }>();
</script>

<style scoped>
.error-notice {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 10px;
  margin: 0 0 14px;
  padding: 11px 13px;
  border: 1px solid #e5b8b3;
  border-left: 4px solid #ad3931;
  border-radius: 6px;
  background: #fff3f1;
  color: #742d28;
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.4;
}

.error-notice__icon {
  display: grid;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  place-items: center;
  border-radius: 50%;
  background: #ad3931;
  color: white;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
}

.error-notice__message { min-width: 0; overflow-wrap: anywhere; }
.error-notice--compact { gap: 8px; margin: 0; padding: 8px 10px; border-left-width: 3px; font-size: 0.79rem; }
.error-notice--compact .error-notice__icon { width: 17px; height: 17px; flex-basis: 17px; font-size: 0.7rem; }
</style>
