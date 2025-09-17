import "./styles/main.css";
import "vue-final-modal/style.css";

import { createApp } from "vue";
import { createVfm } from "vue-final-modal";
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
  .use(createVfm())
  .directive("click-outside", ClickOutside)
  .component("DropdownMenu", DropdownMenu)
  .component("Popper", Popper)
  .mount("#app");

/** TODO
 * Create a "More Options" Popper menu for each task item
 * Add ability to edit task items (maybe in a popper)
 * Add assign author functionality (maybe in a popper)
 * Add ability to mark task items as high priority
 * Add Vue Router for different views (MMPs, Makes, Models, Segments, Authors)
 * Add ability to add new task items
 * Add ability to delete task items
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
