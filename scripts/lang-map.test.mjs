// Tests for how a path becomes a language.
//
// The extension table is data and mostly self-evident. What is worth testing is
// the part that is not a table: `.h`, which belongs to C or C++ depending on
// the tree it sits in.
//
// Run with `node --test scripts/lang-map.test.mjs`.

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// The script runs its whole pipeline on import, so the rules are read out of the
// source rather than imported. Crude, and it keeps this test from needing a
// token and forty clones.
const source = await readFile(new URL("./lang-history.mjs", import.meta.url), "utf8");

const EXT_TABLE = source.slice(
  source.indexOf("const EXT"),
  source.indexOf("};", source.indexOf("const EXT"))
);

/**
 * Whether the extension table maps `ext` to `lang`.
 *
 * The key has to be matched at a boundary. A plain substring search says `.h`
 * maps to C++ because the table contains `hh: "C++"`, which is how the first
 * version of this file reported a bug that was not there.
 */
function maps(ext, lang) {
  const escape = (text) => text.replace(/[.*+?^${}()|[\]\\"]/g, "\\$&");
  const key = /^[a-z]+$/.test(ext) ? escape(ext) : `"${escape(ext)}"`;
  return new RegExp(`(^|[\\s,{])${key}: "${escape(lang)}"`).test(EXT_TABLE);
}

test("every C++ source extension is counted", () => {
  for (const ext of ["cpp", "cc", "cxx", "c++"]) {
    assert.ok(maps(ext, "C++"), `${ext} is not counted as C++`);
  }
});

test("C++ headers and templates are counted", () => {
  // A header-only library is entirely .hpp and .ipp, and missing them would
  // report a project of that shape as having almost no code.
  for (const ext of ["hpp", "hh", "hxx", "h++", "ipp", "tpp", "inl"]) {
    assert.ok(maps(ext, "C++"), `${ext} is not counted as C++`);
  }
});

test("C++ modules are counted", () => {
  for (const ext of ["cppm", "ixx"]) {
    assert.ok(maps(ext, "C++"), `${ext} is not counted as C++`);
  }
});

test("CUDA is its own language rather than C++", () => {
  // Linguist separates them, and both charts have to agree with the API's
  // numbers or the bars and the history disagree.
  assert.ok(maps("cu", "Cuda"));
  assert.ok(maps("cuh", "Cuda"));
});

test("plain .h is not in the table at all", () => {
  // It is resolved per tree instead. If it were in the table it would answer
  // before the per-tree rule ever ran.
  assert.ok(!maps("h", "C"), ".h is still mapped to C in the table");
  assert.ok(!maps("h", "C++"), ".h is mapped to C++ in the table");
});

test("the per-tree rule attributes headers to the language beside them", () => {
  // The rule itself, as prose the code has to match: bytes are held back, and
  // handed to C++ only when the tree contains something definitely C++.
  assert.match(source, /headerBytes \+= size/);
  assert.match(source, /sawCpp \? "C\+\+" : "C"/);
});

test("C++ has a colour, so a band is never drawn colourless", () => {
  assert.match(source, /"C\+\+": "#f34b7d"/);
  assert.match(source, /Cuda: "#3A4E3A"/);
});

test("Twill (.tw) is counted, so my own language is not invisible", () => {
  // Linguist does not know Twill, so if the walk does not count it either then
  // the compiler, its standard library and its toolchain — all written in .tw —
  // vanish from every chart and inflate whatever is left.
  assert.ok(maps("tw", "Twill"));
});

test("Twill has a colour of its own rather than the fallback violet", () => {
  assert.match(source, /Twill: "#4FB79B"/);
});
