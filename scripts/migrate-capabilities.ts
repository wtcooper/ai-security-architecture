/** One-time, idempotent migration. Run with --write after reviewing the dry-run file list. */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { isMap, isScalar, isSeq, parse, parseDocument, stringify, type Node } from "yaml";
import { migrateKeyed, migrateToolControls, type MigrationRules } from "./lib/capability-migration";
import type { LegacyToolControl as ToolControl } from "./lib/capability-migration";
import { isOrgCapabilityDocument } from "./rename-mitigations";

async function main() {
  const root = process.cwd();
  const rules = (parse(await readFile(join(root, "data/migrations/capabilities-v1.yaml"), "utf8")) as { mappings: MigrationRules }).mappings;
  const write = process.argv.includes("--write");
  const requested = process.argv.find((a, i) => i > 1 && !a.startsWith("--"));
  const dirs = requested ? [requested] : ["data/reference", "data/tooling", "data/org"];
  async function* files(path: string): AsyncGenerator<string> {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (entry.name === "archive") continue;
      const p = join(path, entry.name);
      if (entry.isDirectory()) yield* files(p);
      else if (entry.name.endsWith(".yaml")) yield p;
    }
  }
  let changed = 0;
  const archivePath = join(root, "data/migrations/capabilities-v1-retired.yaml");
  const archive = existsSync(archivePath) ? parse(await readFile(archivePath, "utf8")) : { description: "Retired capability references preserved for review.", records: [] };
  let archived = false;
  for (const dir of dirs) for await (const path of files(join(root, dir))) {
    const before = await readFile(path, "utf8");
    if (isOrgCapabilityDocument(before)) continue;
    const doc = parseDocument(before);
    if (doc.errors.length) throw new Error(`${path}: ${doc.errors.join(", ")}`);
    const preserveRetired = (value: unknown, location: (string | number)[] = []) => {
      const save = () => {
        const record = { file: path.slice(root.length + 1), path: location, value };
        if (!archive.records.some((r: unknown) => JSON.stringify(r) === JSON.stringify(record))) {
          archive.records.push(record);
          archived = true;
        }
      };
      if (Array.isArray(value)) value.forEach((v, i) => preserveRetired(v, [...location, i]));
      else if (value && typeof value === "object") {
        const row = value as Record<string, unknown>;
        if (typeof row.capability === "string" && rules[row.capability]?.targets.length === 0) { save(); return; }
        for (const [key, v] of Object.entries(row)) {
          if (key === "migration") continue;
          if (rules[key]?.targets.length === 0) {
            const record = { file: path.slice(root.length + 1), path: [...location, key], value: v };
            if (!archive.records.some((r: unknown) => JSON.stringify(r) === JSON.stringify(record))) { archive.records.push(record); archived = true; }
          } else preserveRetired(v, [...location, key]);
        }
      } else if (typeof value === "string" && rules[value]?.targets.length === 0) save();
    };
    preserveRetired(doc.toJS());
    // Persist the original evidence before removing any live reference.
    if (write && archived) { await writeFile(archivePath, stringify(archive, { lineWidth: 100 })); archived = false; }
    let dirty = false;
    const walk = (node: Node | null): Node | null => {
      if (isSeq(node)) {
        if (node.items.some((n) => isMap(n) && rules[String(n.get("capability"))] && n.has("coverage"))) {
          dirty = true;
          return doc.createNode(migrateToolControls(node.toJSON() as ToolControl[], rules));
        }
        let expanded = false;
        node.items = node.items.flatMap<Node | null>((item) => {
          if (isScalar(item) && rules[String(item.value)]) {
            dirty = true;
            expanded = true;
            return rules[String(item.value)].targets.map((id) => doc.createNode(id));
          }
          if (isMap(item) && rules[String(item.get("capability"))]) {
            dirty = true;
            expanded = true;
            const old = String(item.get("capability"));
            return rules[old].targets.map((id) => {
              const pin = item.clone();
              pin.set("capability", id);
              if (rules[old].reviewRequired) pin.set("note", `${pin.get("note") ?? ""} Functional requirement migrated from ${old}; verify ${id} at this boundary.`.trim());
              return pin as Node;
            });
          }
          return [walk(item as Node | null)];
        });
        // Merged platform functions can converge on the same requirement at the same boundary.
        const seen = new Map<string, Node>();
        node.items = node.items.filter((item) => {
          if (!expanded) return true;
          const key = isScalar(item) ? `scalar:${item.value}` : isMap(item) && item.has("capability") && item.has("at") ? `pin:${item.get("capability")}:${item.get("at")}` : null;
          if (!key || !item) return true;
          const prior = seen.get(key);
          if (!prior) { seen.set(key, item as Node); return true; }
          if (isMap(prior) && isMap(item) && item.get("note")) prior.set("note", `${prior.get("note") ?? ""} ${item.get("note")}`.trim());
          dirty = true;
          return false;
        });
      } else if (isMap(node)) {
        if (node.items.some((pair) => isScalar(pair.key) && rules[String(pair.key.value)])) {
          dirty = true;
          return doc.createNode(migrateKeyed(node.toJSON(), rules));
        }
        for (const pair of node.items) {
          // Original evidence is an immutable migration record, not a live reference.
          if (isScalar(pair.key) && pair.key.value === "migration") continue;
          if (isScalar(pair.key) && pair.key.value === "capabilities" && node.has("tool")) continue;
          pair.value = walk(pair.value as Node | null);
        }
      }
      return node;
    };
    doc.contents = walk(doc.contents) as typeof doc.contents;
    if (!dirty) continue;
    if (path.endsWith("vocabulary.yaml")) {
      const enforcement = doc.get("capabilityEnforcement");
      if (isMap(enforcement)) {
        const inlineNode = enforcement.get("inline");
        const embeddedNode = enforcement.get("embedded");
        const managementNode = enforcement.get("management");
        const inline = Object.keys(isMap(inlineNode) ? inlineNode.toJSON() : {});
        const embedded = (isSeq(embeddedNode) ? embeddedNode.toJSON() : []) as string[];
        enforcement.set("embedded", doc.createNode(embedded.filter((id) => !inline.includes(id))));
        const management = (isSeq(managementNode) ? managementNode.toJSON() : []) as string[];
        enforcement.set("management", doc.createNode(management.filter((id) => !inline.includes(id) && !embedded.includes(id))));
      }
    }
    if (write) await writeFile(path, doc.toString({ lineWidth: 110 }));
    console.log(`${write ? "Migrated" : "Would migrate"} ${path.slice(root.length + 1)}`);
    changed++;
  }
  console.log(`${changed} files ${write ? "migrated" : "would change (pass --write to apply)"}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
