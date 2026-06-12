// definitions_table.tsx - 10-row glossary editor for the Definitions tab panel.
//
// Renders a two-column grid (Word | Definition) with keyboard nav matching the
// triples table: Enter on the last row adds a new row, Tab/Shift-Tab moves
// between cells. Each row has a delete button. A live count badge shows how
// many non-empty definitions exist out of the 10-entry target.
//
// Paste behavior: onPaste on the table container intercepts multi-cell paste
// (clipboard text containing a tab or newline). Rows of 2 columns map to
// (word, definition). A header row (first row containing "word" or "definition"
// tokens) is skipped. Single-cell paste passes through natively.

import { For } from "solid-js";
import type { JSX } from "solid-js";

import type { AppState } from "./app_state";
import type { Definition } from "./types";
import { parse_table_text } from "./csv_codec";

// ============================================
// Header detection tokens (lowercase)
// ============================================

// Tokens that indicate a header row in the word or definition columns.
const DEF_HEADER_TOKENS = new Set([
  "word",
  "term",
  "concept",
  "definition",
  "description",
  "meaning",
  "gloss",
]);

// Returns true when the row looks like a header row for definitions.
function looks_like_def_header(row: string[]): boolean {
  for (const cell of row) {
    if (DEF_HEADER_TOKENS.has(cell.trim().toLowerCase())) {
      return true;
    }
  }
  return false;
}

// ============================================
// props
// ============================================

interface DefinitionsTableProps {
  state: AppState;
}

// ============================================
// DefinitionsTable
// ============================================

export function DefinitionsTable(props: DefinitionsTableProps): JSX.Element {
  const { doc, add_definition, remove_definition, update_definition } = props.state;

  // Count definitions where either word or definition is non-empty.
  function non_empty_count(): number {
    let count = 0;
    for (const def of doc.definitions) {
      if (def.word.trim() !== "" || def.definition.trim() !== "") {
        count += 1;
      }
    }
    return count;
  }

  // Handle Enter key on the last row to append a new row.
  function handle_key_down(event: KeyboardEvent, def: Definition): void {
    if (event.key !== "Enter") {
      return;
    }
    const definitions = doc.definitions;
    const last_def = definitions[definitions.length - 1];
    // Only add a new row when Enter is pressed in the last row.
    if (last_def !== undefined && def.id === last_def.id) {
      event.preventDefault();
      const new_id = add_definition();
      // Focus the word input of the new row after Solid re-renders.
      requestAnimationFrame(() => {
        const selector = `[data-def-id="${new_id}"][data-field="word"]`;
        const el = document.querySelector<HTMLInputElement>(selector);
        el?.focus();
      });
    }
  }

  // Handle changes to word or definition fields.
  function handle_change(id: string, field: "word" | "definition", value: string): void {
    update_definition(id, { [field]: value });
  }

  // Handle paste on the table container. Multi-cell paste (text containing a
  // tab or newline) is intercepted and parsed into bulk-inserted definitions.
  // Rows of 2+ columns map to (word, definition). Single-cell paste passes
  // through natively to the focused input.
  function handle_paste(e: ClipboardEvent): void {
    const text = e.clipboardData?.getData("text") ?? "";
    // single-cell paste: let the focused input receive it natively
    if (!text.includes("\t") && !text.includes("\n")) {
      return;
    }
    // multi-cell paste: consume the event and parse
    e.preventDefault();
    const grid = parse_table_text(text);
    if (grid.length === 0) {
      return;
    }
    // determine start index: skip header row if detected
    let start = 0;
    const first_row = grid[0];
    if (first_row !== undefined && looks_like_def_header(first_row)) {
      start = 1;
    }
    // build definitions from data rows; require at least 2 columns (word, definition)
    const rows: Array<{ word: string; definition: string }> = [];
    for (let i = start; i < grid.length; i++) {
      const row = grid[i];
      if (row === undefined) continue;
      const word = (row[0] ?? "").trim();
      const definition = (row[1] ?? "").trim();
      // skip entirely blank rows
      if (word === "" && definition === "") continue;
      rows.push({ word, definition });
    }
    if (rows.length > 0) {
      props.state.bulk_insert_definitions(rows);
    }
  }

  return (
    <div
      class="definitions-table"
      role="table"
      aria-label="Definitions table"
      onPaste={handle_paste}
    >
      {/* Table header */}
      <div class="def-row def-header" role="row">
        <span class="def-cell def-cell-word" role="columnheader">
          Word
        </span>
        <span class="def-cell def-cell-definition" role="columnheader">
          Definition
        </span>
        <span class="def-cell def-cell-delete" role="columnheader" aria-label="Delete" />
      </div>

      {/* Data rows */}
      <For each={doc.definitions}>
        {(def) => (
          <div class="def-row" role="row">
            <div class="def-cell def-cell-word" role="cell">
              <input
                type="text"
                class="def-input"
                value={def.word}
                aria-label="Word"
                data-def-id={def.id}
                data-field="word"
                onInput={(e) => handle_change(def.id, "word", e.currentTarget.value)}
                onKeyDown={(e) => handle_key_down(e, def)}
              />
            </div>
            <div class="def-cell def-cell-definition" role="cell">
              <input
                type="text"
                class="def-input"
                value={def.definition}
                aria-label="Definition"
                data-def-id={def.id}
                data-field="definition"
                onInput={(e) => handle_change(def.id, "definition", e.currentTarget.value)}
                onKeyDown={(e) => handle_key_down(e, def)}
              />
            </div>
            <div class="def-cell def-cell-delete" role="cell">
              <button
                class="def-delete-btn"
                aria-label={`Delete definition: ${def.word || "(empty)"}`}
                onClick={() => remove_definition(def.id)}
              >
                &#215;
              </button>
            </div>
          </div>
        )}
      </For>

      {/* Live count badge */}
      <div class="def-count" aria-live="polite">
        {non_empty_count()} / 10 definitions
      </div>
    </div>
  );
}
