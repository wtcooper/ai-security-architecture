import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { dataset } from "../src/lib/data";

/**
 * The reader's words are pattern, control, setting and risk. "Capability", "countermeasure",
 * "archetype" and "reference architecture" are the names this app used before patterns became
 * the front door; they stay in identifiers and data keys but must not reach the page.
 */
const RETIRED = /capabilit|countermeasure|archetype|reference architecture/i;

/** Text a reader can see: string literals and JSX text, with code-only strings left out. */
function readerText(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const literals = [...code.matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)].map((m) => m[1] ?? m[2] ?? m[3] ?? "");
  const jsx = [...code.matchAll(/>([^<>{}=;()]+)</g)].map((m) => m[1]);
  return [...literals, ...jsx]
    .map((t) => t.replace(/\$\{[^}]*\}/g, " ").trim())
    .filter((t) => t && !/^(@\/|\.\.?\/)/.test(t)) // import paths
    .filter((t) => !/^(capabilities|capability|archetype|capability-|#capability-)$/.test(t)) // internal enum values and legacy anchors
    .filter((t) => !/^[\w./-]+$/.test(t) || /\s/.test(t)); // bare identifiers, ids, class tokens
}

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : /\.tsx?$/.test(name) ? [path] : [];
  });

test("no retired word reaches the page from the interface code", () => {
  const offenders: string[] = [];
  for (const file of walk("src")) {
    if (file.includes("data/generated") || file.endsWith("lib/types.ts")) continue;
    // The legacy redirect names the old query parameter and anchor on purpose.
    if (file.endsWith("LegacyRedirect.tsx")) continue;
    // Drawings on trial are not part of the app a reader navigates.
    if (file.includes("components/experimental")) continue;
    for (const text of readerText(readFileSync(file, "utf8"))) {
      if (RETIRED.test(text) && !/^(text|bg|border|flex|grid|rounded|mt|px)-/.test(text)) offenders.push(`${file}: ${text.slice(0, 90)}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("no pattern, guidance or incident prose still says archetype", () => {
  const prose = (value: unknown): string[] =>
    typeof value === "string" ? [value] : Array.isArray(value) ? value.flatMap(prose) : value && typeof value === "object" ? Object.entries(value).flatMap(([k, v]) => (/^(id|archetype|architecture|slug|at|from|to|follow)$/.test(k) ? [] : prose(v))) : [];
  for (const [name, items] of [["patterns", dataset.archetypes], ["guidance", dataset.guidance], ["incidents", dataset.incidents]] as const) {
    const hits = prose(items).filter((t) => /\barchetypes?\b/i.test(t));
    assert.deepEqual(hits.map((t) => t.slice(0, 80)), [], name);
  }
});
