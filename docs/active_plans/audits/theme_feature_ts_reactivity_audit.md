# theme_feature_ts_reactivity_audit.md

Audit of the light/dark theme feature against type safety, Solid reactivity,
export/print semantics, storage guards, repo style, and dead-code scope.

Scope: src/ui_theme.ts, src/ui_theme_toggle.tsx, src/concept_edge.tsx,
src/concept_node.tsx, src/map_canvas.tsx, src/export_svg.ts, src/app.tsx,
src/palettes.ts, src/themes.ts. Reviewed against docs/REPO_STYLE.md and
docs/TYPESCRIPT_STYLE.md. Read-only audit; no source edits.

---

## Summary counts

| Severity | Count |
| --- | --- |
| blocker | 1 |
| major | 2 |
| minor | 2 |
| nit | 3 |

---

## Findings

### Blocker

**B1** src/ui_theme.ts:229 -- createMemo is called at module scope (top-level,
outside any Solid component or createRoot). Solid requires an owner for
createMemo; a module-level call has no owner and the computation is unowned-reactive.
In development Solid prints a warning and the memo still functions, but in
production it is an unsupported pattern: the computation will never be cleaned up,
and Solid may drop or warn on it. The correct fix is to initialize map_is_dark
inside a createRoot(...) call (for module-level app-singleton signals) or to change
the architecture so components call a factory function rather than reading a module-level memo.

Note: createSignal on lines 182 and 186 is safe at module level (signals do not
require an owner). Only createMemo at line 229 is the blocker.

---

### Major

**M1** src/app.tsx:87-90 -- stale comment says setup_map_theme wires a
data-ui-theme MutationObserver AND the OS prefers-color-scheme matchMedia listener.
The matchMedia live listener was intentionally removed when auto was dropped.
The comment still mentions it, creating a false expectation that a second cleanup
listener exists. A future maintainer may look for a matchMedia cleanup path that
does not exist.

**M2** src/css/print.css:66 -- [data-ui-theme=auto] selector is present in the
print media query even though auto was removed from the UiTheme union and from
the runtime. UI_THEME_VALUES = [light, dark] excludes auto; the HTML early-set
script rejects any stored value outside that set. This selector is dead CSS that
signals an incomplete drop-auto sweep.

---

### Minor

**m1** src/ui_theme.ts:252 -- set_exporting_light comment reads Force map_is_dark()
to resolve light (true) or release the override (false). The (true) refers to the
value parameter, but map_is_dark() returns false when light. The mixed meaning of
true in the same sentence (parameter value vs. map_is_dark return) is confusing.
Suggested rewrite: Pass true to force map_is_dark() to return false (light) for
the snapshot duration; pass false to release the override.

**m2** pipeline/build.mjs -- copy_dir and the src/css/ copy block are unstaged.
They are required because src/style.css now uses @import for seven CSS subfiles
in src/css/. Without this change the built dist/style.css has broken @import refs.
The change is correct and necessary; it was not staged alongside the theme files.

---

### Nit

**n1** src/ui_theme.ts:25-26 -- Re-exporting browser_storage from app_state through
ui_theme creates a barrel-style re-export. docs/TYPESCRIPT_STYLE.md prefers named
exports from the defining module. Low risk; can stay until a refactor pass.

**n2** src/ui_theme.ts:191 -- resolved_theme_wired is a module-level boolean that
is never reset by unmount. If the App component hot-reloads (HMR), the observer
would not re-attach because the flag stays true. Worth noting for HMR dev.

**n3** src/palettes.ts:48 -- ramp[idx] as string is a valid boundary cast required
by noUncheckedIndexedAccess. The clamp on lines 46-47 guarantees the index is in
bounds. No action needed; recorded as a nit for completeness.

---

## Explicit confirmations (items 2, 3, 6)

### Item 2 - Cleanup

- MutationObserver is disconnected via onCleanup at src/ui_theme.ts:219-221.
  Runs on App unmount because setup_map_theme is called from the App component
  body, which provides the owner context.
- beforeprint/afterprint listeners are removed in the onCleanup block at
  src/app.tsx:237-243. Registration and removal are guarded by
  typeof window !== undefined. The pair is symmetric.
- NO leftover live matchMedia listener. os_default_theme reads .matches once and
  never calls .addEventListener. Confirmed by grep across src/ui_theme.ts.

### Item 3 - No stuck-dark on throw

- set_exporting_light(true) is at src/export_svg.ts:108, BEFORE the try block.
- try/finally at src/export_svg.ts:113-125 puts set_exporting_light(false) in
  finally. Runs regardless of whether await or cloneNode throws.
- download_svg and download_png only await export_svg_text; they do not set the
  flag. Cannot get stuck dark on any throw path inside export_svg_text.
- Print listeners are symmetric and browser-managed: afterprint always follows
  beforeprint, even when printing is cancelled.

### Item 6 - Leftover auto refs and build.mjs

- Leftover [data-ui-theme=auto] in CSS: YES -- src/css/print.css:66 has a dead
  selector inside @media print. This is finding M2 and requires cleanup.
- Other auto refs in TS/TSX: comments only (src/ui_theme.ts:75 and :92).
  is_valid_ui_theme at lines 52-55 correctly rejects auto at runtime.
  No live auto handling exists.
- build.mjs edit: copy_dir and css subdir copy are necessary and correct.
  The change is unstaged and should be staged with the theme files it supports.

---

## Top 3 findings

1. src/ui_theme.ts:229 (blocker B1) -- createMemo at module scope has no Solid owner.
2. src/css/print.css:66 (major M2) -- dead [data-ui-theme=auto] from drop-auto sweep.
3. src/app.tsx:87-90 (major M1) -- comment incorrectly claims matchMedia listener is wired.
