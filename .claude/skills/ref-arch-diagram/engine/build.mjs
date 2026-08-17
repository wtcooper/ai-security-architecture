#!/usr/bin/env node
/**
 * CLI: validate a YAML architecture and emit its render model.
 *
 *   node engine/build.mjs <diagram.yaml> [out.json]
 *
 * Exit 0 with the model written (or printed) on success; exit 1 with every validation
 * error listed on failure. Run this after every edit — the errors name their own fixes.
 */
import { readFileSync, writeFileSync } from "node:fs";
import yaml from "js-yaml";
import { buildRenderModel } from "./model.mjs";

const [input, output] = process.argv.slice(2);
if (!input) {
  console.error("usage: node engine/build.mjs <diagram.yaml> [out.json]");
  process.exit(1);
}

let arch;
try {
  // js-yaml v4 load() is safe by default; CORE_SCHEMA pins it to plain data regardless.
  arch = yaml.load(readFileSync(input, "utf8"), { schema: yaml.CORE_SCHEMA });
} catch (e) {
  console.error(`${input}: ${e.message}`);
  process.exit(1);
}

let model;
try {
  model = buildRenderModel(arch);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

const json = JSON.stringify(model, null, 2);
if (output) {
  writeFileSync(output, json);
  console.log(
    `${model.id}: ${model.blocks.length} blocks, ${model.edges.length} edges, ` +
      `${model.blockPins.length + model.edgePins.length} pins, ${model.frames.length} frames ` +
      `→ ${output}`,
  );
} else {
  console.log(json);
}
