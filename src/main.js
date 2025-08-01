import "./styles/main.css";

import { createApp } from "vue";
import ClickOutside from "@/directives/ClickOutsideDirective";
import App from "./App.vue";
import DropdownMenu from "./components/common/DropdownMenu.vue";
import FloatingVue from "floating-vue";

createApp(App)
  .directive("click-outside", ClickOutside)
  .component("DropdownMenu", DropdownMenu)
  .use(FloatingVue, {
    themes: {
      "info-tooltip": {
        $extend: "tooltip",
        triggers: ["hover"],
        autoHide: true,
        placement: "top-end",
      },
    },
  })
  .mount("#app");
