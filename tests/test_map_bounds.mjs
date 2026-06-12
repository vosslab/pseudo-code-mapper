// Unit tests for the map-bounds helper (src/map_bounds.ts).
// Run: node --import tsx --test tests/test_map_bounds.mjs

import test from "node:test";
import assert from "node:assert/strict";

import { effective_extent } from "../src/map_bounds.ts";

// Build a Map of NodeBox entries from plain pairs for readable test setup.
function make_nodes(entries) {
  return new Map(entries);
}

test("single node extent wraps the box plus padding on all sides", () => {
  const nodes = make_nodes([["a", { x: 100, y: 100, w: 80, h: 40 }]]);
  const extent = effective_extent(nodes, {}, 10);
  // box spans x [60,140], y [80,120]; padding 10 expands each side
  assert.equal(extent.min_x, 50);
  assert.equal(extent.min_y, 70);
  assert.equal(extent.width, 100);
  assert.equal(extent.height, 60);
});

test("two nodes bound the union of both boxes", () => {
  const nodes = make_nodes([
    ["a", { x: 0, y: 0, w: 40, h: 40 }],
    ["b", { x: 200, y: 100, w: 40, h: 40 }],
  ]);
  const extent = effective_extent(nodes, {}, 0);
  // a spans x [-20,20]; b spans x [180,220]; union x [-20,220] width 240
  assert.equal(extent.min_x, -20);
  assert.equal(extent.min_y, -20);
  assert.equal(extent.width, 240);
  assert.equal(extent.height, 140);
});

test("an override replaces the layout center before bounding", () => {
  const nodes = make_nodes([
    ["a", { x: 0, y: 0, w: 40, h: 40 }],
    ["b", { x: 50, y: 0, w: 40, h: 40 }],
  ]);
  // without overrides b sits near a; drag b far to the right
  const without = effective_extent(nodes, {}, 0);
  const withOverride = effective_extent(nodes, { b: { x: 1000, y: 0 } }, 0);
  // the far-dragged override must expand the bounds to include it
  assert.ok(withOverride.width > without.width);
  // b now spans x [980,1020], so the extent reaches 1020 on the right
  assert.equal(withOverride.min_x, -20);
  assert.equal(withOverride.width, 1040);
});

test("override on a far-up-left bubble moves min_x and min_y", () => {
  const nodes = make_nodes([["a", { x: 0, y: 0, w: 40, h: 40 }]]);
  const extent = effective_extent(nodes, { a: { x: -500, y: -300 } }, 5);
  // a now centered at (-500,-300), spans x [-520,-480], y [-320,-280]
  assert.equal(extent.min_x, -525);
  assert.equal(extent.min_y, -325);
});

test("empty node map yields a finite padded zero box", () => {
  const extent = effective_extent(new Map(), {}, 12);
  assert.equal(extent.min_x, 0);
  assert.equal(extent.min_y, 0);
  assert.equal(extent.width, 24);
  assert.equal(extent.height, 24);
});

test("an override for a key with no node is ignored", () => {
  const nodes = make_nodes([["a", { x: 0, y: 0, w: 40, h: 40 }]]);
  const extent = effective_extent(nodes, { ghost: { x: 9999, y: 9999 } }, 0);
  // only real nodes contribute to the bounds; ghost override does not
  assert.equal(extent.width, 40);
  assert.equal(extent.height, 40);
});
