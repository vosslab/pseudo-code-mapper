// main.tsx - app entry point; mounts the App component into #app.

import { render } from "solid-js/web";
import { App } from "./app";

const root = document.getElementById("app");
if (root === null) {
  throw new Error("Root element #app not found in index.html.");
}
render(() => <App />, root);
