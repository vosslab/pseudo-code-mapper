// app.tsx - top-level app shell: toolbar strip, editor pane (Triples / Definitions tabs),
// map pane, and rubric panel.

import { createSignal } from "solid-js";
import type { JSX } from "solid-js";

import { create_app_state, browser_storage } from "./app_state";
import type { AppState } from "./app_state";
import { TriplesTable } from "./triples_table";
import { DefinitionsTable } from "./definitions_table";
import { MapCanvas } from "./map_canvas";
import { ConceptNode } from "./concept_node";
import { ThemePicker } from "./theme_picker";
import { RubricPanel } from "./rubric_panel";
import { Toolbar } from "./toolbar";

// Tab options for the editor pane.
type EditorTab = "triples" | "definitions";

// ============================================
// App shell
// ============================================

export function App(): JSX.Element {
  // Construct the single reactive state root for the entire app.
  // browser_storage() resolves window.localStorage safely for non-browser envs.
  const state: AppState = create_app_state(browser_storage());

  const [active_tab, set_active_tab] = createSignal<EditorTab>("triples");

  // svg_el: capture the live <svg> element from MapCanvas so Toolbar can pass
  // it to export_svg functions. Null until MapCanvas mounts.
  const [svg_el, set_svg_el] = createSignal<SVGSVGElement | null>(null);

  return (
    <div class="app-shell">
      {/* Top toolbar strip */}
      <header class="toolbar" id="toolbar" role="banner">
        <Toolbar state={state} svg={svg_el} />
      </header>

      {/* Main content area: editor pane (left) + map pane (right) */}
      <main class="main-area" role="main">
        {/* Left: editor pane with tab switcher */}
        <section class="editor-pane" aria-label="Editor pane">
          <div class="tab-bar" role="tablist" aria-label="Editor tabs">
            <button
              role="tab"
              class={active_tab() === "triples" ? "tab tab-active" : "tab"}
              aria-selected={active_tab() === "triples"}
              aria-controls="panel-triples"
              id="tab-triples"
              onClick={() => set_active_tab("triples")}
            >
              Triples
            </button>
            <button
              role="tab"
              class={active_tab() === "definitions" ? "tab tab-active" : "tab"}
              aria-selected={active_tab() === "definitions"}
              aria-controls="panel-definitions"
              id="tab-definitions"
              onClick={() => set_active_tab("definitions")}
            >
              Definitions
            </button>
          </div>

          <div
            id="panel-triples"
            role="tabpanel"
            aria-labelledby="tab-triples"
            hidden={active_tab() !== "triples"}
          >
            <h2 class="pane-heading">Triples</h2>
            <TriplesTable state={state} />
          </div>

          <div
            id="panel-definitions"
            role="tabpanel"
            aria-labelledby="tab-definitions"
            hidden={active_tab() !== "definitions"}
          >
            <h2 class="pane-heading">Definitions</h2>
            <DefinitionsTable state={state} />
          </div>
        </section>

        {/* Right: concept map canvas */}
        <section class="map-pane" aria-label="Concept map">
          <div class="map-pane-header">
            <h2 class="pane-heading">Concept Map</h2>
            {/* Theme picker in the map pane corner; restyles every bubble. */}
            <ThemePicker state={state} />
          </div>
          {/* Inject the themed, draggable ConceptNode into the canvas node slot. */}
          <MapCanvas
            state={state}
            node_slot={(key, box) => <ConceptNode conceptKey={key} box={box} state={state} />}
            svg_ref={(el) => set_svg_el(el)}
          />
        </section>
      </main>

      {/* Bottom: rubric panel */}
      <aside class="rubric-panel" aria-label="Rubric">
        <h2 class="pane-heading">Rubric</h2>
        <RubricPanel state={state} />
      </aside>
    </div>
  );
}
