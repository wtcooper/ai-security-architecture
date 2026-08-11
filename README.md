# CoSAI Risk Map Explorer

An interactive walkthrough of the [CoSAI Risk Map](https://github.com/cosai-oasis/secure-ai-tooling/tree/main/risk-map) — the successor to Google's SAIF Map after SAIF was donated to the Coalition for Secure AI at OASIS.

CoSAI-RM publishes a much broader taxonomy than SAIF (36 risks vs 15, with a full agentic component breakdown) but ships as YAML with no interactive front end. This is that front end, plus an **Examples** tab that replays real AI security incidents on the same map.

## Tabs

| Tab | What it does |
| --- | --- |
| **Risk Map** | Step through all 36 risks × 3 phases. For each, the map highlights where the risk is **introduced**, **exposed** and **mitigated**, and names the controls. |
| **Components** | Click any component on the map for its description, data flow, the risks that touch it, and the controls that protect it. |
| **Risks** | All 36 risks by category — descriptions, personas, lifecycle/impact/attacker-access facets, framework mappings, linked controls. |
| **Controls** | All 35 controls by category — what each protects, which risks it addresses, who owns it. |
| **Personas** | CoSAI's eight actors — responsibilities, "is this you?" questions, and the risks and controls each one owns. |
| **Examples** | Five real incident case studies replayed step by step on the map, every step sourced. |

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

`npm run dev` and `npm run build` both compile the dataset first and **fail on any dangling
identifier** — a risk pointing at a control that doesn't exist, an incident step naming an
unknown component, an overlay phase with no components.

| Script | Purpose |
| --- | --- |
| `npm run data` | Compile `data/**` → `src/data/generated/dataset.json`, with integrity checks |
| `npm run fetch:cosai` | Refresh the vendored CoSAI snapshot from its pinned commit |
| `npm run extract:saif` | Re-extract the SAIF tour seed from the public SAIF bundle |
| `npm run audit` | Regenerate `docs/AUDIT.md` — every judgement call in the repo, reviewable |

## Is the map faithful to CoSAI?

One diagram shows all **23** CoSAI components, with the agent and its orchestration fully
expanded. Two properties are asserted on every build, so this is checkable rather than a
claim:

- **Bands are computed, not chosen.** Each component's band comes from its own `category` /
  `subcategory` in `components.yaml` (`src/lib/bands.ts`). CoSAI has three categories; the
  four-band stack is recovered by splitting Infrastructure along its own two subcategories.
  Eleven components therefore sit in a different band than SAIF drew them — Training &
  Tuning, Evaluation and Frameworks are Model components in CoSAI, orchestration is a Model
  concern rather than an Application one, and Data Storage is a Data component.
- **Arrows are the CoSAI edge graph.** All 32 edges are drawn and nothing else is. The build
  compares the drawn set against `components.yaml` and fails on any addition, omission or
  reversal.

`docs/AUDIT.md` lists every placement, every edge, and one genuine contradiction found in the
upstream data (CoSAI's edges and its prose disagree on the direction of the application
input/output handling round trip — the map follows the edges).

## How the map knows what to highlight

CoSAI-RM gives every risk `tourContent` prose for introduced / exposed / mitigated, but **not**
the component ID lists needed to light up boxes. Those live in
[`data/overlay/risk-components.yaml`](data/overlay/risk-components.yaml):

- **The 15 risks inherited from SAIF** use Google's original mapping, recovered from the public
  SAIF Map bundle into [`data/overlay/saif-tour-seed.json`](data/overlay/saif-tour-seed.json)
  and translated onto CoSAI component ids. `npm run data` re-verifies all 45 of those steps on
  every build and fails on drift.
- **The 21 risks CoSAI added afterwards** are authored from each risk's own `tourContent`
  prose and cross-checked against the components its mapped controls protect.

Every entry records its `source`, so the UI can say which highlights came from Google and which
were written here.

## Data and attribution

CoSAI-RM data is vendored at a pinned commit under `data/cosai/` and is Apache-2.0, © Google LLC,
contributed to CoSAI. See [`data/PROVENANCE.md`](data/PROVENANCE.md) for the pinned SHA, the SAIF
extraction record, and what in this repo is original work.

Built with Next.js 16 (App Router), TypeScript and Tailwind v4. All diagrams are hand-authored
inline SVG. No database, no runtime data fetching — everything is static.
