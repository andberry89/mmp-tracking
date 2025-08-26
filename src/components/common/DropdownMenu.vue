<template>
  <div class="dropdown-menu" v-click-outside="closeDropdown">
    <div class="menu-header" @click="isOpen = !isOpen">
      <div>
        <span class="label">{{ label }}:</span
        ><span class="active-label">{{ active === "" ? "Select" : active }}</span>
      </div>
      <svg
        fill="#b9b9b9"
        width="8px"
        height="8px"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        stroke="#b9b9b9"
      >
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
          <path
            d="M11.178 19.569a.998.998 0 0 0 1.644 0l9-13A.999.999 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569l9 13z"
          ></path>
        </g>
      </svg>
    </div>
    <transition name="fade" appear>
      <div class="sub-menu" v-if="isOpen">
        <div class="menu-item clear" v-if="active !== ''" @click="setActive({ id: '', label: '' })">
          Clear Selection
        </div>
        <div
          class="menu-item"
          v-for="(item, i) in options"
          :key="i + '-' + label"
          @click="setActive(item)"
        >
          {{ item.label }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: "DropdownMenu",
  data() {
    return {
      isOpen: false,
      active: "",
    };
  },
  props: {
    label: {
      type: String,
      default: "Select Range",
    },
    options: {
      type: Array,
      required: true,
    },
  },
  methods: {
    closeDropdown() {
      this.isOpen = false;
    },
    setActive(item) {
      this.active = item.label;
      this.isOpen = false;
      this.$emit("update:selected", item.id);
    },
  },
};
</script>
<style lang="scss" scoped>
.dropdown-menu {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-content: center;
  position: relative;
  width: auto;
  min-width: 110px;
  height: 22px;
  font: 400 12px/1.2 "Asap", sans-serif;
  color: var(--color-dropdown-text);
  background-color: var(--color-input-background);
  border: 1px solid var(--color-input-border);
  border-radius: 4px 4px 0px 0px;
  cursor: pointer;

  .menu-header {
    color: var(--color-search-text);
    padding: 4px;
    display: flex;
    justify-content: space-between;
    gap: 5px;
    align-items: center;

    .active-label {
      color: var(--color-dropdown-text);
      margin-left: 4px;
    }

    svg {
      margin-left: 8px;
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: all 0.4s ease-out;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .sub-menu {
    position: absolute;
    top: 100%;
    width: 100%;
    border-radius: 0px 0px 8px 8px;
    background-color: var(--color-input-background);
    border: 1px solid var(--color-dropdown-border);
    border-top: none;
    overflow: hidden;

    .menu-item {
      color: var(--color-dropdown-text);
      padding: 4px;
      transition: 0.3s;

      &.clear {
        font-weight: 700;
        color: var(--color-dropdown-clear-text);
      }

      .active,
      &:hover {
        background-color: var(--color-input-hover);
      }
    }
  }
}
</style>
