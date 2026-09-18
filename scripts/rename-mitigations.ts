/** Rename the former MITRE capability schema; historical migration evidence is immutable. */
import { readFile, readdir, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { isMap, isScalar, isSeq, parseDocument, type Node } from "yaml";

export function renameMitigationKeys(source: string): string {
  const doc = parseDocument(source);
  if (doc.errors.length) throw new Error(doc.errors.join(", "));
  const edits: [number, number, string][] = [];
  const keys: Record<string, string> = { capability: "mitigation", capabilities: "mitigations", capabilityEnforcement: "mitigationEnforcement" };
  const walk = (node: Node | null) => {
    if (isSeq(node)) node.items.forEach((item) => walk(item as Node | null));
    if (isMap(node)) for (const pair of node.items) {
      if (!isScalar(pair.key) || pair.key.value === "migration") continue;
      // New org crosswalks use capabilities for tech-* categories, not MITRE methods.
      if (pair.key.value === "capabilities" && isSeq(pair.value)) {
        const technology = pair.value.items.filter((item) => isScalar(item) && String(item.value).startsWith("tech-"));
        if (technology.length && technology.length !== pair.value.items.length) {
          throw new Error("Mixed technology and legacy capability references: separate tech-* capabilities from MITRE mitigations before migration");
        }
        if (technology.length || (!pair.value.items.length && node.has("mitigations"))) continue;
      }
      const replacement = keys[String(pair.key.value)];
      if (replacement && pair.key.range) edits.push([pair.key.range[0], pair.key.range[1], replacement]);
      walk(pair.value as Node | null);
    }
  };
  walk(doc.contents);
  for (const [start, end, replacement] of edits.sort((a, b) => b[0] - a[0])) {
    source = source.slice(0, start) + replacement + source.slice(end);
  }
  return source;
}

async function main() {
  const write = process.argv.includes("--write");
  async function* files(dir: string): AsyncGenerator<string> {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === "archive") continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) yield* files(path);
      else if (path.endsWith(".yaml")) yield path;
    }
  }
  for (const dir of ["data/reference", "data/tooling", "data/org"]) for await (const path of files(dir)) {
    const before = await readFile(path, "utf8");
    const after = renameMitigationKeys(before);
    const target = path.endsWith("/capabilities.yaml") ? path.replace(/capabilities\.yaml$/, "mitigations.yaml") : path;
    if (before === after && target === path) continue;
    if (target !== path && existsSync(target)) throw new Error(`Both ${path} and ${target} exist; merge explicitly before migration`);
    if (write) {
      await writeFile(path, after);
      if (target !== path) await rename(path, target);
    }
    console.log(`${write ? "Renamed" : "Would rename"} ${path}${path !== target ? ` → ${target}` : ""}`);
  }
}

if (process.argv[1]?.endsWith("rename-mitigations.ts")) main().catch((error) => { console.error(error); process.exitCode = 1; });
