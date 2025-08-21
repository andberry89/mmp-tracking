import "./styles/main.css";

import { createApp } from "vue";
import ClickOutside from "@/directives/ClickOutsideDirective";
import App from "./App.vue";
import DropdownMenu from "./components/common/DropdownMenu.vue";
import FloatingVue from "floating-vue";
import Popper from "vue3-popper";

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
  .directive("click-outside", ClickOutside)
  .component("DropdownMenu", DropdownMenu)
  .component("Popper", Popper)
  .mount("#app");
