/**
 * One-shot extractor for Google's original SAIF Map tour data.
 *
 * The public SAIF site drives its map highlights from a plain object inside its JS bundle,
 * keyed `tour_NN_{introduced|exposed|mitigated}` -> { map, boxes, contents }. The risk title
 * for each `content_tour_NN` id lives in the server-rendered HTML. This script joins the two
 * and writes data/overlay/saif-tour-seed.json.
 *
 * Output is committed, so this only needs re-running if Google ships a new bundle.
 *   npm run extract:saif
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const MAP_PAGE = "https://saif.google/secure-ai-framework/saif-map";
const BUNDLE =
  "https://www.gstatic.com/marketing-cms/reviewed-scripts/prod/saif-1.3.14-318a3a1/styles/default/All.min.js";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";

async function get(url: string) {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  return res.text();
}

async function main() {
  const [html, js] = await Promise.all([get(MAP_PAGE), get(BUNDLE)]);

  // content_tour_NN -> risk title, from the tour panel markup.
  const titles = new Map<string, string>();
  const titleRe =
    /data-id="(content_tour_\d+)"[\s\S]{0,400}?tour-content__title[^>]*>([^<]+)</g;
  for (const m of html.matchAll(titleRe)) titles.set(m[1], m[2].trim());

  // tour_NN_phase -> { map, boxes }
  const stepRe =
    /(tour_\d+_(?:introduced|exposed|mitigated)):\{map:"(\w+)",boxes:\[([^\]]*)\],contents:\["(\w+)"\]/g;

  type Seed = {
    step: string;
    risk: string;
    phase: string;
    map: string;
    boxes: string[];
  };
  const seeds: Seed[] = [];

  for (const m of js.matchAll(stepRe)) {
    const [, step, map, boxesRaw, contentId] = m;
    const risk = titles.get(contentId);
    if (!risk) throw new Error(`no title found for ${contentId}`);
    seeds.push({
      step,
      risk,
      phase: step.split("_").at(-1)!,
      map,
      boxes: boxesRaw
        .split(",")
        .map((b) => b.trim().replace(/^"|"$/g, ""))
        .filter(Boolean),
    });
  }

  if (seeds.length !== 45) {
    throw new Error(`expected 45 steps (15 risks x 3 phases), got ${seeds.length}`);
  }

  const out = {
    source: MAP_PAGE,
    bundle: BUNDLE,
    extractedAt: new Date().toISOString().slice(0, 10),
    note:
      "Factual risk -> component-box mapping extracted from the public SAIF Map. " +
      "Used as a seed for data/overlay/risk-components.yaml. See data/PROVENANCE.md.",
    steps: seeds,
  };

  const path = join(process.cwd(), "data", "overlay", "saif-tour-seed.json");
  await writeFile(path, JSON.stringify(out, null, 2) + "\n");
  console.log(`wrote ${seeds.length} steps across ${titles.size} risks -> ${path}`);
}

main();
