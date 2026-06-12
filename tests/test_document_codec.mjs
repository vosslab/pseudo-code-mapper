// Unit tests for the versioned document codec (src/document_codec.ts).
// Run: node --import tsx --test tests/test_document_codec.mjs

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  empty_document,
  parse_document,
  serialize_document,
  prune_overrides,
} from "../src/document_codec.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, "fixtures");

function read_fixture(name) {
  return fs.readFileSync(path.join(fixtures, name), "utf8");
}

//============================================
// empty_document
//============================================

test("empty_document is a valid, content-free document", () => {
  const doc = empty_document();
  assert.equal(doc.format, "concept-map-maker");
  assert.equal(doc.version, 1);
  assert.equal(doc.triples.length, 0);
  assert.equal(doc.definitions.length, 0);
  assert.deepEqual(doc.overrides, {});
});

test("empty_document round-trips through serialize/parse", () => {
  const doc = empty_document();
  const restored = parse_document(serialize_document(doc));
  assert.deepEqual(restored, doc);
});

//============================================
// round-trip on real fixtures
//============================================

test("honeybees fixture parses and round-trips losslessly", () => {
  const doc = parse_document(read_fixture("honeybees_document.json"));
  const restored = parse_document(serialize_document(doc));
  assert.deepEqual(restored, doc);
});

test("honeybees fixture preserves the multi-input/output structure", () => {
  const doc = parse_document(read_fixture("honeybees_document.json"));
  // Castes has three outgoing edges
  const castes_out = doc.triples.filter((t) => t.from === "Castes");
  assert.equal(castes_out.length, 3);
  // Female has three incoming edges
  const female_in = doc.triples.filter((t) => t.to === "Female");
  assert.equal(female_in.length, 3);
});

test("stress fixture parses and round-trips losslessly", () => {
  const doc = parse_document(read_fixture("stress_80_nodes.json"));
  const restored = parse_document(serialize_document(doc));
  assert.deepEqual(restored, doc);
});

//============================================
// loud rejection of garbage
//============================================

test("non-JSON text is rejected with a clear error", () => {
  assert.throws(() => parse_document("this is not json {"), /not valid JSON/);
});

test("a JSON array is rejected (not an object)", () => {
  assert.throws(() => parse_document("[]"), /must be an object/);
});

test("a foreign format tag is rejected", () => {
  const foreign = JSON.stringify({ format: "some-other-app", version: 1 });
  assert.throws(() => parse_document(foreign), /not a Concept Map Maker file/);
});

test("a missing format tag is rejected", () => {
  const noformat = JSON.stringify({ version: 1, title: "x" });
  assert.throws(() => parse_document(noformat), /format must be a string/);
});

test("a malformed triple is rejected loudly", () => {
  const bad = JSON.stringify({
    format: "concept-map-maker",
    version: 1,
    title: "t",
    triples: [{ id: "t1", from: "A", verb: "v" }],
    definitions: [],
    overrides: {},
    theme: { shape: "rounded", palette: "earth" },
  });
  assert.throws(() => parse_document(bad), /triples\[0\]\.to must be a string/);
});

test("an unknown theme shape is rejected", () => {
  const bad = JSON.stringify({
    format: "concept-map-maker",
    version: 1,
    title: "t",
    triples: [],
    definitions: [],
    overrides: {},
    theme: { shape: "hexagon", palette: "earth" },
  });
  assert.throws(() => parse_document(bad), /not a known shape/);
});

//============================================
// version gate
//============================================

test("an unknown version is rejected with a version message", () => {
  const future = JSON.stringify({
    format: "concept-map-maker",
    version: 2,
    title: "t",
    triples: [],
    definitions: [],
    overrides: {},
    theme: { shape: "rounded", palette: "earth" },
  });
  assert.throws(() => parse_document(future), /Unsupported document version 2/);
});

//============================================
// override pruning
//============================================

test("prune_overrides drops keys absent from the triples", () => {
  const triples = [{ id: "t1", from: "Castes", verb: "include", to: "Workers" }];
  const overrides = {
    castes: { x: 1, y: 2 },
    workers: { x: 3, y: 4 },
    drones: { x: 5, y: 6 },
  };
  const pruned = prune_overrides(overrides, triples);
  // live keys kept, orphaned "drones" dropped
  assert.deepEqual(pruned, { castes: { x: 1, y: 2 }, workers: { x: 3, y: 4 } });
});

test("serialize prunes overrides whose concept no longer appears", () => {
  const doc = empty_document();
  doc.triples = [{ id: "t1", from: "Castes", verb: "include", to: "Workers" }];
  doc.overrides = { castes: { x: 10, y: 20 }, ghost: { x: 99, y: 99 } };
  const restored = parse_document(serialize_document(doc));
  assert.ok("castes" in restored.overrides);
  assert.ok(!("ghost" in restored.overrides));
});

test("parse prunes stale overrides from a hand-edited file", () => {
  const handEdited = JSON.stringify({
    format: "concept-map-maker",
    version: 1,
    title: "t",
    triples: [{ id: "t1", from: "A", verb: "v", to: "B" }],
    definitions: [],
    overrides: { a: { x: 1, y: 1 }, stale: { x: 2, y: 2 } },
    theme: { shape: "oval", palette: "fire" },
  });
  const doc = parse_document(handEdited);
  assert.ok("a" in doc.overrides);
  assert.ok(!("stale" in doc.overrides));
});
