<template>
  <nav class="wrapper">
    <span class="active">MMPs</span>
    <span>Makes</span>
    <span>Models</span>
    <span>Segments</span>
    <span>Authors</span>
  </nav>
</template>

<script setup lang="ts"></script>
<style lang="scss" scoped>
nav.wrapper {
  display: flex;
  flex-flow: row nowrap;
  margin: 0;
  padding: 0 0 0 20px;
  width: 100%;

  span {
    font: 700 2rem/1.2 "Monda", sans-serif;
    color: var(--color-header-text);
    margin-right: 2.5rem;
    cursor: pointer;
    display: inline-block;
    padding-bottom: 10px;

    &.active {
      border-bottom: 4px solid var(--color-header-text-underline);
    }

    &:hover {
      color: var(--color-header-text-hover);
    }
  }
}
</style>
