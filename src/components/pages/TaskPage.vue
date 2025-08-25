<template>
  <div>
    <section class="content-header">
      <div>
        <h1>MMPs</h1>
      </div>
      <div class="header-actions">
        <form>
          <div class="search-bar">
            <SearchIcon class="search-icon" />
            <input type="search" class="search-input" placeholder="Search by vehicle or segment" />
          </div>
        </form>
        <DropdownMenu
          class="author-dropdown"
          :options="authors.all.filter((author) => author.active)"
          :label="'Author'"
        />
        <DropdownMenu class="range-dropdown" :options="ranges" :label="'Status'" />
        <SortIcon class="sort-icon header-icon" />
        <FilterIcon class="filter-icon header-icon" />
      </div>
    </section>
    <TaskList :documents="documents" />
  </div>
</template>
<script>
import { FilterIcon, SearchIcon, SortIcon } from "@/assets/icons";
import TaskList from "@/components/layout/components/TaskList.vue";

export default {
  name: "TaskPage",
  props: {
    documents: {
      type: Object,
      required: true,
    },
    authors: {
      type: Object,
      required: true,
    },
    ranges: {
      type: Array,
      required: true,
    },
  },
  components: {
    FilterIcon,
    SearchIcon,
    SortIcon,
    TaskList,
  },
};
</script>
<style lang="scss" scoped>
.content-header {
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;

  h1 {
    font: 700 24px/1.2 "Monda", sans-serif;
    color: var(--color-body-header-text);
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: flex-start;
    gap: 10px;

    .author-dropdown {
      min-width: 175px;
    }
    .range-dropdown {
      min-width: 130px;
    }

    .search-bar {
      --padding: 4px;

      width: max-content;
      display: flex;
      align-items: center;
      background-color: var(--color-input-background);
      border: 1px solid var(--color-input-border);
      padding: var(--padding);
      border-radius: 8px;
      width: 220px;
      height: 24px;

      .search-input {
        font: 400 12px/1 "Monda", sans-serif;
        color: var(--color-search-text);
        margin-left: var(--padding);
        outline: none;
        border: none;
        background: transparent;
        flex: 1;
      }

      .search-input::placeholder,
      .search-icon {
        color: var(--color-search-text-placeholder);
      }
    }
    .header-icon {
      --sides: 22px;

      width: var(--sides);
      height: var(--sides);
      fill: var(--color-icon);
      background-color: var(--color-input-background);
      border: 1px solid var(--color-input-border);
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.4s ease-in-out;

      &:hover {
        background-color: var(--color-input-background-hover);
        fill: var(--color-icon-hover);
      }
    }
  }
}
</style>
