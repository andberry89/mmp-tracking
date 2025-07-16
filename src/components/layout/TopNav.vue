<template>
  <nav class="wrapper">
    <ul>
      <li>MMPs</li>
      <li>Makes</li>
      <li>Models</li>
      <li>Segments</li>
      <li>Authors</li>
    </ul>
  </nav>
</template>
<script>
export default {
  name: "TopNav",
};
</script>
<style lang="scss" scoped>
nav.wrapper {
  width: 100%;
  border-bottom: var(--color-border) solid 2px;
  padding: 3.5rem 20px;

  ul {
    display: flex;
    flex-flow: row nowrap;
    list-style-type: none;
    margin: 0;
    padding: 0;

    li {
      font: 700 2rem/1.2 "Monda", sans-serif;
      color: var(--color-header-text);
      margin-right: 2.5rem;
      cursor: pointer;

      &:hover {
        color: var(--color-header-text-hover);
      }
    }
  }
}
</style>
