/**
 * Fetch every URL authored in the AI tooling registry and the capability taxonomy, and report
 * the ones that do not resolve. Reachability only: a 200 says the page exists, not that it
 * still documents the claim beside it — that is the onboarding skill's job, page by page.
 *
 *   npm run links            every URL under data/tooling and data/overlay/mitigations.yaml
 *   npm run links -- <path>  one file
 *
 * Hosts known to answer automated fetches with a wall or a client-rendered shell are listed in
 * KNOWN, so their non-200s are reported as "unverifiable here", not as dead.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();

/** Hosts whose HTTP status says nothing about the page. */
const KNOWN: Record<string, string> = {
  "atlas.mitre.org": "single-page app: every route answers 404 and renders client-side",
  "help.openai.com": "anti-bot wall: 403 to automated fetches",
  "openai.com": "anti-bot wall: 403 to automated fetches",
  "www.gartner.com": "access challenge on reprints",
  "www.iso.org": "access challenge",
  "media.defense.gov": "403 to non-browser clients",
  "www.nsa.gov": "403 to non-browser clients",
  "trust.anthropic.com": "client-rendered trust portal",
  "trust.cursor.com": "client-rendered trust portal",
};

async function* yamlFiles(dir: string): AsyncGenerator<string> {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* yamlFiles(p);
    else if (e.name.endsWith(".yaml")) yield p;
  }
}

async function main() {
  const arg = process.argv[2];
  const files: string[] = [];
  if (arg) files.push(arg);
  else {
    for await (const f of yamlFiles(join(ROOT, "data/tooling"))) files.push(f);
    files.push(join(ROOT, "data/overlay/mitigations.yaml"));
    files.push(join(ROOT, "data/frameworks/technology-sources.yaml"));
  }

  const where = new Map<string, string[]>();
  for (const f of files) {
    const text = await readFile(f, "utf8");
    text.split("\n").forEach((line, i) => {
      for (const m of line.matchAll(/https?:\/\/[^\s"'<>)\]]+/g)) {
        const url = m[0].replace(/[.,;:]+$/, "");
        where.set(url, [...(where.get(url) ?? []), `${f.replace(ROOT + "/", "")}:${i + 1}`]);
      }
    });
  }

  const urls = [...where.keys()].sort();
  console.log(`${urls.length} distinct URLs in ${files.length} file(s)`);

  type Result = { url: string; status: number | string; landed?: string };
  const results: Result[] = [];
  const queue = [...urls];
  const worker = async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      try {
        const res = await fetch(url, {
          method: "GET",
          redirect: "follow",
          headers: { "user-agent": "Mozilla/5.0 (link check; ai-security-framework-viz)" },
          signal: AbortSignal.timeout(25_000),
        });
        results.push({ url, status: res.status, landed: res.url !== url ? res.url : undefined });
      } catch (e) {
        results.push({ url, status: (e as Error).name === "TimeoutError" ? "timeout" : "error" });
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));

  const host = (u: string) => new URL(u).host;
  const dead = results.filter((r) => r.status !== 200 && !KNOWN[host(r.url)]);
  const walled = results.filter((r) => r.status !== 200 && KNOWN[host(r.url)]);
  const moved = results.filter((r) => r.status === 200 && r.landed && new URL(r.landed).pathname !== new URL(r.url).pathname);

  const show = (title: string, rows: Result[], detail: (r: Result) => string) => {
    console.log(`\n## ${title} (${rows.length})`);
    for (const r of rows.sort((a, b) => a.url.localeCompare(b.url))) {
      console.log(`- ${r.status}  ${r.url}${detail(r)}`);
      for (const at of where.get(r.url) ?? []) console.log(`    ${at}`);
    }
  };
  show("Not reachable", dead, () => "");
  show("Unverifiable here", walled, (r) => `  (${KNOWN[host(r.url)]})`);
  show("Redirected to another path — write the URL you land on", moved, (r) => `\n    -> ${r.landed}`);

  process.exitCode = dead.length ? 1 : 0;
}

main();
