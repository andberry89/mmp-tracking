import "./styles/main.css";

import { createApp } from "vue";
import ClickOutside from "@/directives/ClickOutsideDirective";
import App from "./App.vue";

createApp(App).directive("click-outside", ClickOutside).mount("#app");
