// drag.spec.ts - drag persistence across unrelated edits.
//
// Verifies that a dragged bubble retains its overridden position after an
// unrelated edit is made to another row. This guards the design invariant:
// layout re-runs from triples only; drag overrides survive any edit that does
// not rename the dragged concept.
//
// Steps:
//   1. Enter three triples (four concepts).
//   2. Record the initial bounding box of the first bubble.
//   3. Drag the first bubble a known distance.
//   4. Record the post-drag bounding box.
//   5. Edit an unrelated row (change the verb in row 3).
//   6. Assert the first bubble's bounding box is unchanged (same as post-drag).

import { test, expect } from "@playwright/test";
import { enter_triple } from "./helpers";

test("dragged bubble position persists after unrelated edit", async ({ page }) => {
  await page.goto("/");

  // Enter three triples that yield four distinct concepts.
  await page.getByRole("button", { name: "+ Add row" }).click();
  await page.waitForTimeout(100);

  await enter_triple(page, 1, "Rain", "fills", "Rivers");
  await enter_triple(page, 2, "Rivers", "flow to", "Sea");
  await enter_triple(page, 3, "Sun", "heats", "Sea");

  // Wait for the SVG nodes to appear.
  const nodes = page.locator("g.concept-node");
  await expect(nodes.first()).toBeVisible({ timeout: 5000 });
  expect(await nodes.count()).toBeGreaterThanOrEqual(3);

  // Read the bounding box of the first bubble before dragging.
  const target_node = nodes.first();
  const before_drag = await target_node.boundingBox();
  expect(before_drag).not.toBeNull();

  // Drag the first bubble by (80, 60) screen pixels.
  const cx = before_drag!.x + before_drag!.width / 2;
  const cy = before_drag!.y + before_drag!.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 80, cy + 60, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(100);

  // Record the bounding box after the drag (the override position).
  const after_drag = await target_node.boundingBox();
  expect(after_drag).not.toBeNull();

  // The node should have moved from its original position.
  const drag_delta =
    Math.abs(after_drag!.x - before_drag!.x) + Math.abs(after_drag!.y - before_drag!.y);
  expect(drag_delta).toBeGreaterThan(5);

  // Now make an unrelated edit: change the verb in row 3.
  const verb3 = page.getByLabel("Row 3 verb phrase");
  await verb3.click();
  // Select all text in the field then type the replacement.
  await verb3.press("Control+a");
  await verb3.pressSequentially("warms");
  await verb3.press("Tab");
  await page.waitForTimeout(300);

  // The dragged bubble's position should be unchanged from after_drag.
  const after_edit = await target_node.boundingBox();
  expect(after_edit).not.toBeNull();

  const drift = Math.abs(after_edit!.x - after_drag!.x) + Math.abs(after_edit!.y - after_drag!.y);
  // Allow a tiny rounding difference (< 2px) but the position must not reset.
  expect(drift).toBeLessThan(2);
});
