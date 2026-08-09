import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router/index.js";
import { vAriaFocus } from "./directives/v-aria-focus.js";
import "./assets/main.css";

import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  faBox,
  faBoxOpen,
  faUser,
  faTrash,
  faTriangleExclamation,
  faPen,
  faFolderOpen,
  faHand,
  faMagnifyingGlass,
  faChartBar,
  faPlus,
  faWrench,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

library.add(
  faBox,
  faBoxOpen,
  faUser,
  faTrash,
  faTriangleExclamation,
  faPen,
  faFolderOpen,
  faHand,
  faMagnifyingGlass,
  faChartBar,
  faPlus,
  faWrench,
  faCheck,
);

const app = createApp(App);
app.use(router);
app.directive("aria-focus", vAriaFocus);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(app as any).component("font-awesome-icon", FontAwesomeIcon);
app.mount("#app");
