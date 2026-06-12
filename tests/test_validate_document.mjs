// Tests for src/validate_document.ts
// Run: node --import tsx --test tests/test_validate_document.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { validate_document } from "../src/validate_document.js";

//============================================
// Helpers
//============================================

/** Build a minimal CmapDocument with sensible defaults. */
function make_doc(overrides = {}) {
  return {
    format: "concept-map-maker",
    version: 1,
    title: "Test map",
    triples: [],
    definitions: [],
    overrides: {},
    theme: { shape: "rounded", palette: "earth" },
    ...overrides,
  };
}

/** Make a triple with a generated id if not given. */
let _id_counter = 0;
function triple(from, verb, to, id = null) {
  _id_counter++;
  return { id: id ?? `t${_id_counter}`, from, verb, to };
}

/** Make a definition with a generated id. */
function def(word, definition) {
  _id_counter++;
  return { id: `d${_id_counter}`, word, definition };
}

/** Build 30+ distinct triples that form a linear chain of concepts. */
function make_30_concept_triples() {
  const triples = [];
  for (let i = 0; i < 31; i++) {
    triples.push(triple(`concept ${i}`, "relates to", `concept ${i + 1}`));
  }
  return triples;
}

/** Build 10 non-empty definitions. */
function make_10_definitions() {
  const defs = [];
  for (let i = 0; i < 10; i++) {
    defs.push(def(`word${i}`, `definition of word${i}`));
  }
  return defs;
}

/** Find the first ValidationItem with a given rule name from the result list. */
function find_rule(items, rule) {
  return items.find((it) => it.rule === rule);
}

//============================================
// min_30_concepts rule
//============================================

test("min_30_concepts: fail when fewer than 30 unique concepts", () => {
  const doc = make_doc({
    triples: [triple("A", "links", "B"), triple("B", "links", "C")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "min_30_concepts");
  assert.equal(item.level, "fail");
});

test("min_30_concepts: pass when 30 or more unique concepts present", () => {
  const doc = make_doc({ triples: make_30_concept_triples() });
  const items = validate_document(doc);
  const item = find_rule(items, "min_30_concepts");
  assert.equal(item.level, "pass");
});

test("min_30_concepts: normalized duplicates count once", () => {
  // "Cell" and "cell" and "CELL" are all the same concept key
  const triples_with_dups = make_30_concept_triples();
  triples_with_dups.push(triple("Cell", "is a", "unit"));
  triples_with_dups.push(triple("cell", "is a", "unit"));
  triples_with_dups.push(triple("CELL", "is a", "unit"));
  // There are still 32 concepts from the chain + "Cell" + "unit" = 34 unique
  // (unit was not in the chain; Cell/cell/CELL all normalize to "cell")
  const doc = make_doc({ triples: triples_with_dups });
  const items = validate_document(doc);
  const item = find_rule(items, "min_30_concepts");
  assert.equal(item.level, "pass");
});

//============================================
// verbs_required rule
//============================================

test("verbs_required: pass when all non-blank rows have a verb", () => {
  const doc = make_doc({
    triples: [triple("A", "links", "B")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "verbs_required");
  assert.equal(item.level, "pass");
});

test("verbs_required: fail when a non-blank row has an empty verb", () => {
  const doc = make_doc({
    triples: [triple("A", "", "B")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "verbs_required");
  assert.equal(item.level, "fail");
  assert.ok(item.tripleIds.length > 0);
});

test("verbs_required: blank rows are ignored", () => {
  const doc = make_doc({
    triples: [
      triple("A", "links", "B"),
      // fully blank row
      triple("", "", ""),
    ],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "verbs_required");
  assert.equal(item.level, "pass");
});

//============================================
// min_10_definitions rule
//============================================

test("min_10_definitions: fail when fewer than 10 filled definitions", () => {
  const doc = make_doc({
    definitions: [def("alpha", "first letter")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "min_10_definitions");
  assert.equal(item.level, "fail");
});

test("min_10_definitions: pass when 10 or more filled definitions present", () => {
  const doc = make_doc({ definitions: make_10_definitions() });
  const items = validate_document(doc);
  const item = find_rule(items, "min_10_definitions");
  assert.equal(item.level, "pass");
});

test("min_10_definitions: empty-word entries are not counted", () => {
  const defs = make_10_definitions();
  // Add one blank definition; total filled still 10 so should still pass
  defs.push(def("", ""));
  const doc = make_doc({ definitions: defs });
  const items = validate_document(doc);
  const item = find_rule(items, "min_10_definitions");
  assert.equal(item.level, "pass");
});

//============================================
// long_verb_label warn
//============================================

test("long_verb_label: no warn when all verbs are 3 words or fewer", () => {
  const doc = make_doc({
    triples: [triple("A", "relates to", "B"), triple("B", "is a", "C")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "long_verb_label");
  assert.equal(item, undefined);
});

test("long_verb_label: warn when a verb has more than 3 words", () => {
  const doc = make_doc({
    triples: [triple("A", "is often found within the", "B")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "long_verb_label");
  assert.equal(item.level, "warn");
  assert.ok(item.tripleIds.length > 0);
});

//============================================
// orphan_concept warn
//============================================

test("orphan_concept: no warn when every concept participates in a complete edge", () => {
  const doc = make_doc({
    triples: [triple("A", "links", "B")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "orphan_concept");
  assert.equal(item, undefined);
});

test("orphan_concept: warn for concept that appears only in partial row", () => {
  const doc = make_doc({
    triples: [
      // A complete row — A and B are fine
      triple("A", "links", "B"),
      // Partial row — "Orphan" appears but verb and to are missing
      triple("Orphan", "", ""),
    ],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "orphan_concept");
  assert.equal(item.level, "warn");
  assert.ok(item.conceptKeys.includes("orphan"));
});

//============================================
// partial_row warn
//============================================

test("partial_row: no warn when all rows are complete or blank", () => {
  const doc = make_doc({
    triples: [triple("A", "links", "B"), triple("", "", "")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "partial_row");
  assert.equal(item, undefined);
});

test("partial_row: warn for row with missing to field", () => {
  const doc = make_doc({
    triples: [triple("A", "links", "")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "partial_row");
  assert.equal(item.level, "warn");
});

//============================================
// duplicate_triple warn
//============================================

test("duplicate_triple: no warn when all triples are unique", () => {
  const doc = make_doc({
    triples: [triple("A", "links", "B"), triple("B", "links", "C")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "duplicate_triple");
  assert.equal(item, undefined);
});

test("duplicate_triple: warn when same from/verb/to triple appears twice", () => {
  const doc = make_doc({
    triples: [triple("A", "links", "B"), triple("A", "links", "B")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "duplicate_triple");
  assert.equal(item.level, "warn");
});

test("duplicate_triple: normalization applied — casing difference still counts as duplicate", () => {
  const doc = make_doc({
    triples: [triple("Cell", "is a", "unit"), triple("cell", "is a", "Unit")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "duplicate_triple");
  assert.equal(item.level, "warn");
});

//============================================
// self_loop warn
//============================================

test("self_loop: no warn when from and to are different concepts", () => {
  const doc = make_doc({
    triples: [triple("A", "links", "B")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "self_loop");
  assert.equal(item, undefined);
});

test("self_loop: warn when from and to normalize to the same key", () => {
  const doc = make_doc({
    triples: [triple("Cell", "relates to", "cell")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "self_loop");
  assert.equal(item.level, "warn");
  assert.ok(item.tripleIds.length > 0);
});

//============================================
// near_miss_spelling warn
//============================================

test("near_miss_spelling: no warn when all concept keys differ by more than 1 edit", () => {
  const doc = make_doc({
    triples: [triple("cat", "is a", "animal"), triple("tiger", "is a", "animal")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "near_miss_spelling");
  assert.equal(item, undefined);
});

test("near_miss_spelling: warn when two concept keys differ by exactly 1 substitution", () => {
  // "cat" vs "bat" differ by 1 substitution
  const doc = make_doc({
    triples: [triple("cat", "is a", "animal"), triple("bat", "is a", "animal")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "near_miss_spelling");
  assert.equal(item.level, "warn");
});

test("near_miss_spelling: warn when two keys differ by 1 insertion", () => {
  // "color" vs "colour" — differ by one insertion
  const doc = make_doc({
    triples: [triple("color", "describes", "light"), triple("colour", "describes", "light")],
  });
  const items = validate_document(doc);
  const item = find_rule(items, "near_miss_spelling");
  assert.equal(item.level, "warn");
});

//============================================
// defined_word_absent hint
//============================================

test("defined_word_absent: no hint when defined word appears in a concept label", () => {
  const doc = make_doc({
    triples: [triple("photosynthesis", "converts", "light")],
    definitions: [def("photosynthesis", "process in plants")],
  });
  const items = validate_document(doc);
  const hints = items.filter((it) => it.rule === "defined_word_absent");
  assert.equal(hints.length, 0);
});

test("defined_word_absent: hint when defined word appears nowhere in map text", () => {
  const doc = make_doc({
    triples: [triple("A", "links", "B")],
    definitions: [def("mitosis", "cell division process")],
  });
  const items = validate_document(doc);
  const hints = items.filter((it) => it.rule === "defined_word_absent");
  assert.ok(hints.length > 0);
  assert.equal(hints[0].level, "hint");
});

test("defined_word_absent: hint is case-insensitive substring match", () => {
  // "Mitosis" appears in concept "Mitosis stage" — should match "mitosis" definition
  const doc = make_doc({
    triples: [triple("Mitosis stage", "precedes", "telophase")],
    definitions: [def("mitosis", "cell division")],
  });
  const items = validate_document(doc);
  const hints = items.filter((it) => it.rule === "defined_word_absent");
  assert.equal(hints.length, 0);
});

test("defined_word_absent: hint also matches substring in verb phrase", () => {
  // "catalyze" appears in a verb phrase
  const doc = make_doc({
    triples: [triple("enzyme", "can catalyze", "reaction")],
    definitions: [def("catalyze", "speed up a chemical reaction")],
  });
  const items = validate_document(doc);
  const hints = items.filter((it) => it.rule === "defined_word_absent");
  assert.equal(hints.length, 0);
});

test("defined_word_absent: level is hint not warn or fail", () => {
  const doc = make_doc({
    triples: [triple("A", "links", "B")],
    definitions: [def("xylem", "water-conducting tissue")],
  });
  const items = validate_document(doc);
  const hints = items.filter((it) => it.rule === "defined_word_absent");
  assert.ok(hints.length > 0);
  for (const h of hints) {
    assert.equal(h.level, "hint");
  }
});
