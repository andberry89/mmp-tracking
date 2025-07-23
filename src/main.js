import "./styles/main.css";

import { createApp } from "vue";
import ClickOutside from "@/directives/ClickOutsideDirective";
import App from "./App.vue";
import DropdownMenu from "./components/common/DropdownMenu.vue";

createApp(App)
  .directive("click-outside", ClickOutside)
  .component("DropdownMenu", DropdownMenu)
  .mount("#app");
