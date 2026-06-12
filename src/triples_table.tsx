// triples_table.tsx - spreadsheet-like table for entering concept-map triples.
// Renders a header row ("This concept | verb phrase | points to this concept"),
// a TripleRow for each triple in the document, a live concept count, and an
// "Add row" button.
//
// Paste behavior: onPaste on the rows container intercepts when clipboard text
// contains a newline or tab (multi-cell paste). Rows of 3 columns are mapped to
// triples (from, verb, to). A first row that looks like a header (any cell
// matches known header tokens) is skipped. Single-cell paste passes through natively.

import { For } from "solid-js";
import type { JSX } from "solid-js";
import type { AppState } from "./app_state";
import { TripleRow } from "./triple_row";
import { parse_table_text } from "./csv_codec";

//============================================
// Header detection tokens (lowercase)
//============================================

// Tokens that indicate a header row in the from, verb, or to columns.
const HEADER_TOKENS = new Set([
  "from",
  "this concept",
  "concept",
  "source",
  "verb",
  "verb phrase",
  "relation",
  "label",
  "predicate",
  "to",
  "points to this concept",
  "points to",
  "target",
  "destination",
]);

// Returns true when the row looks like a header row.
// Heuristic: at least one cell (trimmed, lowercased) matches a known token.
function looks_like_header(row: string[]): boolean {
  for (const cell of row) {
    if (HEADER_TOKENS.has(cell.trim().toLowerCase())) {
      return true;
    }
  }
  return false;
}

//============================================
// TriplesTableProps
//============================================

export interface TriplesTableProps {
  state: AppState;
}

//============================================
// TriplesTable
//============================================

export function TriplesTable(props: TriplesTableProps): JSX.Element {
  // When Enter is pressed in a row, focus the first input of the next row; if
  // this is the last row, add a new row first.
  function handle_row_enter(row_index: number): void {
    const triples = props.state.doc.triples;
    const is_last = row_index === triples.length - 1;
    if (is_last) {
      // Add a blank row, then move focus there on the next frame.
      props.state.add_triple();
    }
    // Focus the first cell of row_index + 1.
    // Use requestAnimationFrame so the new row has been rendered.
    requestAnimationFrame(() => {
      const next_index = row_index + 1;
      // Find the first input in the next row by querying the row container.
      const rows = document.querySelectorAll(".triple-row");
      const next_row = rows[next_index] as HTMLElement | undefined;
      if (next_row !== undefined) {
        const first_input = next_row.querySelector<HTMLInputElement>("input");
        if (first_input !== null) {
          first_input.focus();
        }
      }
    });
  }

  // Handle paste on the rows container. Multi-cell paste (text containing a
  // tab or newline) is intercepted and parsed into bulk-inserted triples. A
  // single-cell paste (no tab or newline) falls through to the focused input.
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
    if (first_row !== undefined && looks_like_header(first_row)) {
      start = 1;
    }
    // build triples from data rows; require at least 3 columns (from, verb, to)
    const rows: Array<{ from: string; verb: string; to: string }> = [];
    for (let i = start; i < grid.length; i++) {
      const row = grid[i];
      if (row === undefined) continue;
      // pad to at least 3 columns with empty strings
      const from = (row[0] ?? "").trim();
      const verb = (row[1] ?? "").trim();
      const to = (row[2] ?? "").trim();
      // skip entirely blank rows
      if (from === "" && verb === "" && to === "") continue;
      rows.push({ from, verb, to });
    }
    if (rows.length > 0) {
      props.state.bulk_insert_triples(rows);
    }
  }

  return (
    <div class="triples-table" aria-label="Triples table">
      {/* Table header - sentence-shaped labels reinforce direction */}
      <div class="triples-header" aria-hidden="true">
        <span class="header-cell header-cell-from" style={{ background: "var(--from-tint)" }}>
          This concept
        </span>
        <span class="header-arrow">&#8594;</span>
        <span class="header-cell header-cell-verb">verb phrase</span>
        <span class="header-arrow">&#8594;</span>
        <span class="header-cell header-cell-to" style={{ background: "var(--to-tint)" }}>
          points to this concept
        </span>
        {/* Empty spacer aligns with the delete-button column */}
        <span class="header-cell header-cell-delete" aria-hidden="true"></span>
      </div>

      {/* Live concept count displayed near the header */}
      <div class="triples-meta" aria-live="polite">
        <span>Unique concepts: {props.state.concepts().length}</span>
      </div>

      {/* Rows - onPaste intercepts multi-cell spreadsheet paste */}
      <div class="triples-rows" onPaste={handle_paste}>
        <For each={props.state.doc.triples}>
          {(triple, index) => (
            <TripleRow
              triple={triple}
              row_index={index()}
              state={props.state}
              on_enter={handle_row_enter}
            />
          )}
        </For>
      </div>

      {/* Add row button */}
      <button class="triples-add-btn" type="button" onClick={() => props.state.add_triple()}>
        + Add row
      </button>
    </div>
  );
}
