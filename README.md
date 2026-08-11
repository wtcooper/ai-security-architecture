# AI Risk Map

A recreation of [Google's SAIF Map](https://saif.google/secure-ai-framework), rebuilt on the
broader taxonomy that succeeded it — the [CoSAI Risk Map](https://github.com/cosai-oasis/secure-ai-tooling/tree/main/risk-map),
which Google's SAIF became after donation to the Coalition for Secure AI at OASIS.

CoSAI-RM publishes a much broader taxonomy than SAIF (36 risks vs 15, with a full agentic
component breakdown) but ships as YAML with no interactive front end. This is that front end,
plus an **Examples** tab that replays real AI security incidents on the same map.

**The taxonomy is CoSAI's; the composition is SAIF's**, because that layout is what makes the
diagram readable. Everywhere the two disagree the choice is declared, checked at build time,
and shown in the product on the component it affects.

## Tabs

| Tab | What it does |
| --- | --- |
| **Landing** | What this is, how to read it, and where the data comes from. |
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

- **Bands start from CoSAI.** Each component's band comes from its own `category` /
  `subcategory` in `components.yaml`. CoSAI has three categories; the four-band stack is
  recovered by splitting Infrastructure along its own two subcategories, which is also why the
  bands are named **Model Infrastructure** and **Data Infrastructure**. Eight components are
  drawn elsewhere — the agent's orchestration, and the model-creation processes — each declared
  in `BAND_DEVIATIONS` with a reason. The build fails on any undeclared divergence.
- **Every arrow is a CoSAI edge.** Nothing is invented. 30 of CoSAI's 32 edges are drawn; the
  two omitted are long-haul duplicates listed in `UNDRAWN_EDGES` with reasons, and both remain
  visible on the Components tab. Four are drawn in the opposite direction to CoSAI's edge list,
  declared in `EDGE_DEVIATIONS` — CoSAI's edges and its own prose contradict each other on the
  application input/output round trip, and the map follows the prose, which is also SAIF's
  reading.

- **The boundary is drawn too.** The User, and external sources on both the agent and the data
  side, appear as dashed actors on the edges they cross. CoSAI models the system and not what
  sits outside it, so these are not components — but most of the 2026 incidents happen exactly
  there, so risks and incident steps can name them and they highlight like anything else.

`docs/AUDIT.md` lists every placement, every edge, every deviation and every authored
judgement.

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
