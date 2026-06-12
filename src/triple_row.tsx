// triple_row.tsx - one editable row in the triples table.
// Renders: from-cell (ConceptAutocomplete), arrow glyph, verb input, arrow glyph,
// to-cell (ConceptAutocomplete), delete button, and (when focused) a proposition
// preview line.

import { createSignal } from "solid-js";
import type { JSX } from "solid-js";
import type { Triple } from "./types";
import type { AppState } from "./app_state";
import { ConceptAutocomplete } from "./concept_autocomplete";

//============================================
// TripleRowProps
//============================================

export interface TripleRowProps {
  triple: Triple;
  row_index: number;
  state: AppState;
  // Callback: the Enter key pressed in this row (to move focus down / add row)
  on_enter: (row_index: number) => void;
}

//============================================
// TripleRow
//============================================

export function TripleRow(props: TripleRowProps): JSX.Element {
  const [focused, setFocused] = createSignal(false);

  // Build proposition preview text reactively from the current triple fields.
  function preview_text(): string {
    const f = props.triple.from.trim();
    const v = props.triple.verb.trim();
    const t = props.triple.to.trim();
    // Show preview only when at least one field has content.
    if (f === "" && v === "" && t === "") {
      return "";
    }
    // sentence shape: from - verb -> to
    return `${f || "..."} - ${v || "..."} -> ${t || "..."}`;
  }

  // Handle keydown for Tab (native) and Enter (custom: move down / add row).
  function handle_keydown(e: KeyboardEvent): void {
    if (e.key === "Enter") {
      e.preventDefault();
      props.on_enter(props.row_index);
    }
    // Tab is handled natively by the browser; no override needed.
  }

  // Hover handlers wire into app_state cross-highlight signal.
  function handle_mouse_enter(): void {
    props.state.set_hover({ source: "row", tripleId: props.triple.id, conceptKey: null });
  }

  function handle_mouse_leave(): void {
    props.state.set_hover({ source: null, tripleId: null, conceptKey: null });
  }

  // Verb input change handler: commits a field update immediately (fine-grained).
  function on_verb_input(e: InputEvent): void {
    const value = (e.currentTarget as HTMLInputElement).value;
    props.state.update_triple(props.triple.id, { verb: value });
  }

  // on_commit handlers for ConceptAutocomplete from/to cells.
  function on_from_commit(value: string): void {
    props.state.update_triple(props.triple.id, { from: value });
  }

  function on_to_commit(value: string): void {
    props.state.update_triple(props.triple.id, { to: value });
  }

  const row_num = (): number => props.row_index + 1;

  // Cross-highlight: this row is emphasized when the hover-derived triple set
  // contains its id. This is the node/edge -> row direction (hovering a bubble
  // or an edge lights up every row that references it).
  const is_highlighted = (): boolean => props.state.highlighted_triples().has(props.triple.id);

  return (
    <div
      class="triple-row"
      classList={{ highlighted: is_highlighted() }}
      onMouseEnter={handle_mouse_enter}
      onMouseLeave={handle_mouse_leave}
      onFocusIn={() => setFocused(true)}
      onFocusOut={() => setFocused(false)}
    >
      {/* From cell - ConceptAutocomplete with from tint */}
      <span class="triple-cell triple-cell-from">
        <ConceptAutocomplete
          value={props.triple.from}
          concepts={props.state.concepts}
          on_commit={on_from_commit}
          aria_label={`Row ${row_num()} from concept`}
          tint_var="var(--from-tint)"
        />
      </span>

      {/* Arrow glyph between from and verb */}
      <span class="triple-arrow" aria-hidden="true">
        &#8594;
      </span>

      {/* Verb phrase cell */}
      <input
        class="triple-cell triple-cell-verb"
        type="text"
        aria-label={`Row ${row_num()} verb phrase`}
        value={props.triple.verb}
        onInput={on_verb_input}
        onKeyDown={handle_keydown}
      />

      {/* Arrow glyph between verb and to */}
      <span class="triple-arrow" aria-hidden="true">
        &#8594;
      </span>

      {/* To cell - ConceptAutocomplete with to tint */}
      <span class="triple-cell triple-cell-to">
        <ConceptAutocomplete
          value={props.triple.to}
          concepts={props.state.concepts}
          on_commit={on_to_commit}
          aria_label={`Row ${row_num()} to concept`}
          tint_var="var(--to-tint)"
        />
      </span>

      {/* Delete row button */}
      <button
        class="triple-delete-btn"
        type="button"
        aria-label={`Delete row ${row_num()}`}
        onClick={() => props.state.remove_triple(props.triple.id)}
      >
        &#10005;
      </button>

      {/* Proposition preview - shown only when this row has focus */}
      {focused() && preview_text() !== "" && (
        <div class="triple-preview" aria-live="polite">
          {preview_text()}
        </div>
      )}
    </div>
  );
}
