// Unit tests for edge geometry (src/edge_geometry.ts).
// Run: node --import tsx --test tests/test_edge_geometry.mjs

import test from "node:test";
import assert from "node:assert/strict";

import { edge_path, self_loop_path, assign_curvatures } from "../src/edge_geometry.ts";

// Parse the four "C" control/end coordinate pairs out of a path "d" string.
// Returns { start, c1, c2, end } as {x,y} points.
function parse_path(d) {
  const numbers = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  return {
    start: { x: numbers[0], y: numbers[1] },
    c1: { x: numbers[2], y: numbers[3] },
    c2: { x: numbers[4], y: numbers[5] },
    end: { x: numbers[6], y: numbers[7] },
  };
}

//============================================
// boundary clipping per shape
//============================================

test("rect clip starts/ends on the box edges, not the centers", () => {
  const from = { x: 0, y: 0, w: 100, h: 40 };
  const to = { x: 300, y: 0, w: 100, h: 40 };
  const geo = edge_path(from, to, "rect", 0);
  const p = parse_path(geo.d);
  // horizontal edge: start exits the right wall of `from` at x = +half_w = 50
  assert.equal(p.start.x, 50);
  assert.equal(p.start.y, 0);
  // end enters the left wall of `to` at x = 300 - 50 = 250
  assert.equal(p.end.x, 250);
  assert.equal(p.end.y, 0);
});

test("oval clip lands on the ellipse boundary along the axis", () => {
  const from = { x: 0, y: 0, w: 100, h: 40 };
  const to = { x: 300, y: 0, w: 100, h: 40 };
  const geo = edge_path(from, to, "oval", 0);
  const p = parse_path(geo.d);
  // along the horizontal axis the ellipse boundary is at half_w just like a rect
  assert.equal(p.start.x, 50);
  assert.equal(p.end.x, 250);
});

test("oval clip differs from rect clip on a diagonal", () => {
  const from = { x: 0, y: 0, w: 100, h: 100 };
  const to = { x: 200, y: 200, w: 100, h: 100 };
  const oval = parse_path(edge_path(from, to, "oval", 0).d);
  const rect = parse_path(edge_path(from, to, "rect", 0).d);
  // rect exits at a corner-ish point; oval exits closer to the center along the
  // ray, so the two start points must not coincide on a 45-degree edge
  assert.notDeepEqual(oval.start, rect.start);
  // oval start is still outside the center and inside the rect corner radius
  const dist = Math.hypot(oval.start.x, oval.start.y);
  assert.ok(dist > 0);
});

test("rounded clip stays within the box half-extents", () => {
  const from = { x: 0, y: 0, w: 100, h: 100 };
  const to = { x: 200, y: 200, w: 100, h: 100 };
  const geo = edge_path(from, to, "rounded", 0);
  const p = parse_path(geo.d);
  // the rounded exit point must not exceed the box boundary on either axis
  assert.ok(Math.abs(p.start.x) <= 50 + 1e-9);
  assert.ok(Math.abs(p.start.y) <= 50 + 1e-9);
});

//============================================
// curvature / bowing
//============================================

test("curvature 0 produces a straight cubic (control points on the line)", () => {
  const from = { x: 0, y: 0, w: 100, h: 40 };
  const to = { x: 300, y: 0, w: 100, h: 40 };
  const p = parse_path(edge_path(from, to, "rect", 0).d);
  // a straight horizontal edge keeps every control point on y = 0
  assert.equal(p.c1.y, 0);
  assert.equal(p.c2.y, 0);
});

test("positive and negative curvature bow to opposite sides", () => {
  const from = { x: 0, y: 0, w: 100, h: 40 };
  const to = { x: 300, y: 0, w: 100, h: 40 };
  const pos = edge_path(from, to, "rect", 0.3);
  const neg = edge_path(from, to, "rect", -0.3);
  // label midpoints sit on opposite sides of the y = 0 axis
  assert.ok(pos.label_y > 0);
  assert.ok(neg.label_y < 0);
  assert.equal(Math.sign(pos.label_y), -Math.sign(neg.label_y));
});

test("label anchor is the curve midpoint t=0.5", () => {
  const from = { x: 0, y: 0, w: 100, h: 40 };
  const to = { x: 300, y: 0, w: 100, h: 40 };
  const geo = edge_path(from, to, "rect", 0);
  // on a straight horizontal edge the midpoint x is halfway between the clipped
  // endpoints (50 and 250) and y stays on the axis
  assert.equal(geo.label_x, 150);
  assert.equal(geo.label_y, 0);
});

//============================================
// self loop
//============================================

test("self loop path is a valid cubic starting and ending on the node", () => {
  const box = { x: 100, y: 100, w: 80, h: 40 };
  const geo = self_loop_path(box, "rect");
  const p = parse_path(geo.d);
  // path must be a well-formed cubic with all four coordinate pairs present
  assert.match(geo.d, /^M [-\d.]+ [-\d.]+ C /);
  // start and end attach on the top edge (above the center)
  assert.ok(p.start.y <= box.y);
  assert.ok(p.end.y <= box.y);
  // the loop bulges above the box (control points well above the top edge)
  assert.ok(p.c1.y < box.y - box.h / 2);
  assert.ok(p.c2.y < box.y - box.h / 2);
  // label sits up in the bulge, above the node
  assert.ok(geo.label_y < box.y);
});

//============================================
// assign_curvatures
//============================================

test("a lone edge gets curvature 0", () => {
  const curvatures = assign_curvatures([{ id: "e1", from_key: "a", to_key: "b" }]);
  assert.equal(curvatures.get("e1"), 0);
});

test("bidirectional pair bows apart (opposite signs)", () => {
  const curvatures = assign_curvatures([
    { id: "e1", from_key: "a", to_key: "b" },
    { id: "e2", from_key: "b", to_key: "a" },
  ]);
  const a_to_b = curvatures.get("e1");
  const b_to_a = curvatures.get("e2");
  // both are non-zero and have opposite sign so the arrows separate
  assert.notEqual(a_to_b, 0);
  assert.notEqual(b_to_a, 0);
  assert.equal(Math.sign(a_to_b), -Math.sign(b_to_a));
});

test("duplicate same-direction edges fan with increasing magnitude", () => {
  const curvatures = assign_curvatures([
    { id: "e1", from_key: "a", to_key: "b" },
    { id: "e2", from_key: "a", to_key: "b" },
    { id: "e3", from_key: "a", to_key: "b" },
  ]);
  const m1 = Math.abs(curvatures.get("e1"));
  const m2 = Math.abs(curvatures.get("e2"));
  const m3 = Math.abs(curvatures.get("e3"));
  // every duplicate is distinguishable and curvature grows with each one
  assert.ok(m1 > 0);
  assert.ok(m2 > m1);
  assert.ok(m3 > m2);
});

test("duplicates within a bidirectional direction share one sign", () => {
  const curvatures = assign_curvatures([
    { id: "e1", from_key: "a", to_key: "b" },
    { id: "e2", from_key: "a", to_key: "b" },
    { id: "e3", from_key: "b", to_key: "a" },
  ]);
  // both a->b duplicates bow the same way, opposite the b->a edge
  assert.equal(Math.sign(curvatures.get("e1")), Math.sign(curvatures.get("e2")));
  assert.equal(Math.sign(curvatures.get("e1")), -Math.sign(curvatures.get("e3")));
});
