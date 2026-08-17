#!/usr/bin/env node
/**
 * CLI: turn a YAML architecture into a standalone HTML file with the diagram rendered in
 * React Flow — drag the blocks, hover everything, walk the scenarios.
 *
 *   node engine/render-html.mjs <diagram.yaml> [out.html]
 *
 * The output is a single self-contained file except for one thing: it loads React and
 * React Flow from the esm.sh CDN, so opening it needs an internet connection. Everything
 * else — geometry, icons, styles, the viewer code — is inlined.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { buildRenderModel } from "./model.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const [input, output] = process.argv.slice(2);
if (!input) {
  console.error("usage: node engine/render-html.mjs <diagram.yaml> [out.html]");
  process.exit(1);
}

let model;
try {
  model = buildRenderModel(
    yaml.load(readFileSync(input, "utf8"), { schema: yaml.CORE_SCHEMA }),
  );
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

const template = readFileSync(join(here, "..", "templates", "viewer.html"), "utf8");
// JSON inside a <script> element: escape the only sequence that could close it early.
const embedded = JSON.stringify(model).replace(/</g, "\\u003c");
const html = template
  .replaceAll("__TITLE__", model.title.replace(/[<>&]/g, ""))
  .replace("__ARCH_JSON__", embedded);

const out = output ?? `${model.id}.html`;
writeFileSync(out, html);
console.log(`${model.id}: rendered → ${out}  (open in a browser; needs internet for the React Flow CDN)`);
