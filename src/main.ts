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

const vfm = createVfm({ componentPlugin: true });

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

/** TODO

 * Add Vue Router for different views (MMPs, Makes, Models, Segments, Authors)
 * Add ability to add new task items
 * Add ability to filter task items by various criteria (author, status, make, model, model year, segment, high priority, new, published, etc.)
 * Add ability to sort task items by various criteria (author, status, make, model, model year, segment, high priority, new, published, etc.)
 * Add ability to search task items by various criteria (author, status, make, model, model year, segment, high priority, new, published, etc.)
 * Add pagination to task items list
 * Add user authentication and authorization
 * Add backend integration (MongoDB)
 * Add unit tests and end-to-end tests
 * Improve styling and responsiveness
 * Add dark mode
 * Add drag and drop functionality to reorder task items
 * Add calendar view for deadlines
 * Add notifications for upcoming deadlines and status changes
 *
 */
