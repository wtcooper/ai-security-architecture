/**
 * Refresh the vendored CoSAI-RM snapshot in data/cosai/.
 *
 * Bump COSAI_REF here and in data/PROVENANCE.md together, then run:
 *   npm run fetch:cosai
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const COSAI_REF = "afa43cd605674bcbaa5b1420f7b018ee23b4e8d6";

const FILES = [
  "components",
  "controls",
  "risks",
  "personas",
  "frameworks",
  "lifecycle-stage",
  "impact-type",
  "actor-access",
];

const OUT_DIR = join(process.cwd(), "data", "cosai");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const name of FILES) {
    const url = `https://raw.githubusercontent.com/cosai-oasis/secure-ai-tooling/${COSAI_REF}/risk-map/yaml/${name}.yaml`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
    await writeFile(join(OUT_DIR, `${name}.yaml`), await res.text());
    console.log(`fetched ${name}.yaml`);
  }
  console.log(`\nSnapshot pinned at ${COSAI_REF}`);
}

main();
