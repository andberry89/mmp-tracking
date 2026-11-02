import "./styles/main.css";
import "vue-final-modal/style.css";

import { createApp } from "vue";
import { createVfm } from "vue-final-modal";
import { createPinia } from "pinia";
import ClickOutside from "@/directives/ClickOutsideDirective";
import App from "./App.vue";
import DropdownMenu from "./components/common/DropdownMenu.vue";
import LoadingSpinner from "./components/common/LoadingSpinner.vue";
import SearchBar from "./components/common/SearchBar.vue";
import FloatingVue from "floating-vue";
import Popper from "vue3-popper";

const vfm = createVfm();

createApp(App)
  .use(FloatingVue, {
    themes: {
      "info-tooltip": {
        $extend: "tooltip",
        triggers: ["hover"],
        autoHide: true,
        placement: "left",
      },
    },
  })
  .use(vfm)
  .use(createPinia())
  .directive("click-outside", ClickOutside)
  .component("DropdownMenu", DropdownMenu)
  .component("LoadingSpinner", LoadingSpinner)
  .component("SearchBar", SearchBar)
  .component("Popper", Popper)
  .mount("#app");
