// ui_theme_toggle.tsx - toolbar button that toggles the UI appearance theme.
//
// Renders a single <button class="toolbar-btn"> that flips between light and
// dark. Uses the two-state contract from ui_theme.ts. Initializes the signal
// synchronously so the first render shows the correct icon and label with no
// flicker.

import { createSignal, Show, type JSX } from "solid-js";

import { browser_storage } from "./app_state";
import {
  load_ui_theme,
  save_ui_theme,
  apply_ui_theme,
  next_ui_theme,
  type UiTheme,
} from "./ui_theme";

//============================================
// aria_label_for_theme
//============================================
// Build the dynamic aria-label describing current state and the next state
// that will be activated on click.
function aria_label_for_theme(theme: UiTheme): string {
  // describe current state and what click will switch to
  const next_name = next_ui_theme(theme);
  return `Appearance: ${theme}, click for ${next_name}`;
}

//============================================
// UiThemeToggle
//============================================
// Self-contained toolbar toggle button. No props needed: reads and writes
// browser_storage() internally. Drop into any toolbar group span.
export function UiThemeToggle(): JSX.Element {
  // Initialize synchronously so the first render is already correct.
  // browser_storage() is safe to call at component setup time.
  const storage = browser_storage();
  const [theme, set_theme] = createSignal<UiTheme>(load_ui_theme(storage));

  //--------------------------------------------
  // handle_click
  //--------------------------------------------
  // Flip the toggle, persist, apply the attribute, update the signal.
  function handle_click(): void {
    const next = next_ui_theme(theme());
    // update signal first so the icon and label re-render immediately
    set_theme(next);
    // persist to storage (silent no-op when storage is unavailable)
    save_ui_theme(storage, next);
    // apply the data-ui-theme attribute on <html> so CSS picks it up
    apply_ui_theme(next);
  }

  return (
    <button class="toolbar-btn" aria-label={aria_label_for_theme(theme())} onClick={handle_click}>
      {/* fa-sun + "Light": current mode is light, click switches to dark */}
      <Show when={theme() === "light"}>
        <i class="fa-solid fa-sun" aria-hidden="true" />
        Light
      </Show>
      {/* fa-moon + "Dark": current mode is dark, click switches to light */}
      <Show when={theme() === "dark"}>
        <i class="fa-solid fa-moon" aria-hidden="true" />
        Dark
      </Show>
    </button>
  );
}
