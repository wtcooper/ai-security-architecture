# AI Security Architecture

**[wtcooper.github.io/ai-security-architecture](https://wtcooper.github.io/ai-security-architecture/)**

AI security from risk map to reference architecture. It starts as an interactive map of AI security risk —
where each risk is **introduced**, where it is **exposed**, and where it can be **mitigated**,
across the components of an AI system — and descends from there through the full taxonomy, the
technology capabilities that implement each control on endpoint / cloud / third-party SaaS, and
reference architectures for every class of AI application, drawn as target states in the
capability-blocks-and-data-paths grammar practitioners already read.

It is a recreation of [Google's SAIF Map](https://saif.google/secure-ai-framework), rebuilt on
the broader taxonomy that succeeded it — the
[CoSAI Risk Map](https://github.com/cosai-oasis/secure-ai-tooling/tree/main/risk-map), which
SAIF became after Google donated it to the Coalition for Secure AI at OASIS. Five real 2025–26
incidents are replayed on the same map.

---

## Why this exists

Google's SAIF Map was an excellent teaching tool: pick a risk, step through three phases, and
watch the components light up. CoSAI then grew that taxonomy substantially — **36 risks instead
of 15**, a full agentic breakdown, eight personas, six framework mappings — and published it as
YAML with no interactive front end at all.

So the taxonomy and the interface had come apart. This puts them back together.

|  | SAIF | CoSAI-RM |
| --- | --- | --- |
| Risks | 15 | **36** (21 net-new, heavily agentic) |
| Components | 14 boxes, one "Agents" | **23**, with orchestration, tools, memory, retrieval broken out |
| Personas | 2 (creator, consumer) | **8** |
| Framework mappings | — | MITRE ATLAS, OWASP LLM Top 10, STRIDE, NIST AI RMF, EU AI Act, ISO 22989 |
| Interactive | yes | no |

## The approach: CoSAI's taxonomy, SAIF's composition

The two frameworks disagree in places, and the disagreements are not cosmetic. CoSAI's data is
built for a table — a category column disambiguates names, and length is cheap. SAIF's diagram is
built to be read. Trying to render CoSAI's classification literally produced a diagram that was
correct and unusable.

The rule that resolved it: **every fact is CoSAI's, every composition decision is SAIF's.** Each
box is a real CoSAI component, each arrow a real CoSAI edge — but where CoSAI's filing would
break the picture, the picture wins and the divergence is *declared*.

Nothing about that is a matter of trust. Every deviation is enumerated in code, checked on every
build, and surfaced in the product on the component it affects:

| | Count | Declared in |
| --- | --- | --- |
| Components drawn outside their CoSAI band | 8 | `BAND_DEVIATIONS` |
| Edges drawn opposite to CoSAI's direction | 4 | `EDGE_DEVIATIONS` |
| Edges shown by nesting instead of an arrow | 2 | `CONTAINMENT_EDGES` |
| Edges deliberately not drawn | 4 | `UNDRAWN_EDGES` |
| Components renamed for the diagram | 9 | `DISPLAY_NAME` |

`npm run build` fails if a component is drawn in a band nobody declared, if an arrow appears that
CoSAI does not declare, or if a CoSAI edge is neither drawn, nested, nor documented as omitted.

### The larger judgement calls

- **Orchestration lives with the agent.** CoSAI files tools, retrieval, memory and their handlers
  under `componentsModel`. They are the harness around the model, not the model artefact, so they
  are drawn inside the Agent group as SAIF drew them.
- **Data is infrastructure.** CoSAI folds data under Infrastructure, which is a genuine
  improvement on SAIF. The bands are named for it: **Model Infrastructure** and **Data
  Infrastructure**.
- **Three Input/Output Handling pairs, not one.** CoSAI's own contributor guide explains why: a
  second component is earned by "a second *locus* — a distinct place where something is decided
  or enforced". Application, agent and orchestration handling are three real trust boundaries.
  CoSAI gives all three pairs identical titles and lets a category column separate them; on a
  diagram showing all six at once, each is named for the boundary it guards instead.
- **One contradiction in the source data.** CoSAI's edges route the application out through
  Output Handling and back in through Input Handling; its own prose says output handling guards
  "dangerous outputs from a model". The map follows the prose, which is also SAIF's reading.
- **The boundary is drawn.** Three dashed actors — **User**, **External Sources** on the agent
  side and **External Data** upstream of the pipeline — mark where untrusted input crosses in.
  CoSAI models the system and not what sits outside it, so none of the three is a component and
  none carries a CoSAI risk or control; but most of the 2026 incidents happen exactly there, so
  incident steps name them and the Components tab explains each one.

`docs/AUDIT.md` is generated from the data and lists every one of these, with reasons.

## How the map knows what to highlight

CoSAI publishes `tourContent` prose for introduced / exposed / mitigated, but **not** the
component lists a map needs to light boxes up. That gap is filled by
[`data/overlay/risk-components.yaml`](data/overlay/risk-components.yaml), and it has two
provenances:

- **The 15 risks inherited from SAIF** use Google's own mapping. The SAIF site drives its
  highlights from an object inside its JavaScript bundle; `npm run extract:saif` recovers all 45
  steps into [`saif-tour-seed.json`](data/overlay/saif-tour-seed.json) and translates them onto
  CoSAI component ids. Every build re-verifies them and **fails on drift**.
- **The 21 risks CoSAI added afterwards** have no upstream mapping and are authored here, from
  each risk's own prose, cross-checked against the components its controls protect. These are
  editorial judgements, marked as such, and listed in full in `docs/AUDIT.md` next to the prose
  they came from — the part of this repo most worth reviewing.

## The tabs

The nav has three destinations: the **Risk Map** group (the taxonomy, seven views), **Reference
Architectures** (the drawing layer), and **Incidents** (the evidence).

| View | What it does |
| --- | --- |
| **Landing** | What this is, how to read the three phases, where the data comes from. |
| **Risk Map Walkthrough** | Step through 36 risks × 3 phases. Each phase highlights a different set of components; the mitigated step names the controls that break the chain. |
| **Components** | Click any of the 23 components for its description, data flow, the risks that touch it, the controls that protect it — and any place the map differs from CoSAI. The Agent group and the three boundary actors are selectable too. |
| **Risks** | All 36 by category: causes, impact, personas, lifecycle / impact / attacker-access facets, framework mappings, linked controls. |
| **Controls** | All 35 by category: what each protects, which risks it addresses, who owns it. |
| **Capabilities** | The layer neither framework has: 56 vendor-neutral technology classes, as a matrix of CoSAI control groups × three deployment surfaces. Filter by risk category or stack layer, click any capability for its controls, risks, components and sources, and record your own posture in the edit pane. |
| **Personas** | CoSAI's eight actors — responsibilities, "is this you?" questions, and the risks and controls each carries. |
| **Frameworks** | The cross-reference, read backwards. Pick OWASP LLM 2026 / OWASP Agentic / ATLAS / STRIDE / NIST / ISO, see what maps to each entry, and watch it light up the map. |
| **Reference Architectures** | 28 target-state architectures, one per class of AI application, drawn in the capability-blocks-and-data-paths grammar. Searchable by any word in a name or description. See the section below. |
| **Incidents** | Five real 2025–26 incidents replayed step by step on the map, every step sourced. |

Every diagram supports pan and zoom.

## Frameworks as a lens

CoSAI maps its entries onto six external frameworks, and each risk or control card lists what
it corresponds to. The more common question is the reverse — *"I am measured against OWASP,
what does that mean here"* — so the Frameworks tab inverts the index and answers it, including
the part most cross-reference tables leave out: **what a framework does not reach**.

The frameworks apply to different things, and CoSAI is explicit about which. A framework with
nothing mapped to it is not listed — CoSAI declares the EU AI Act applicable to personas and
controls but has published no mappings, so its pill led to an empty page. That is a data-driven
filter, not an exclusion list: it returns the moment mappings appear.

| Framework | Applies to | Entries | Coverage |
| --- | --- | --- | --- |
| MITRE ATLAS | risks, controls | 39 | 20/36 risks, 10/35 controls |
| STRIDE | risks | 6 | 26/36 risks |
| NIST AI RMF | controls | 10 | 8/35 controls |
| ISO 22989 | personas | 6 | 6/8 personas |
| **OWASP Agentic Top 10** | risks | 10 | 21/36 risks — **added here** |
| **OWASP LLM Top 10 2026** | risks, controls | 10 | 19/36 risks, 7/35 controls — **added here**, replaces CoSAI's 2025 |

Nothing maps to components, so the mapping block was removed from that tab rather than left
rendering nothing.

### The one framework CoSAI does not carry

CoSAI lists six frameworks, and the OWASP entry among them is the **LLM** Top 10. OWASP
published a separate **[Top 10 for Agentic Applications](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)**
on 9 December 2025 — ASI01 to ASI10 — and nothing in CoSAI references it. That is the single
most relevant external framework for CoSAI's newest content, so it is added here, in
[`data/overlay/frameworks-authored.yaml`](data/overlay/frameworks-authored.yaml).

It is the only cross-reference in the product that is not CoSAI's, so it is kept apart in the
data and marked in the UI: the framework card carries a *mappings authored here* badge and an
attribution block, and the badge on a risk card is labelled `authored`. 21 of 36 risks map —
essentially the agentic subset. The other 15 are left unmapped rather than stretched to fit,
and ASI09 *Human-Agent Trust Exploitation* has nothing mapped to it at all, because CoSAI has
no risk for a human over-trusting an agent.

### The LLM Top 10 moved on a week ago

OWASP published the **[2026 edition](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/)**
on **4 August 2026** — the first ranked partly on real incident data rather than expert vote
alone. It keeps all ten risks and reorders most of them:

| 2025 | 2026 | |
| --- | --- | --- |
| LLM06 Excessive Agency | **LLM03** | up three |
| LLM10 Unbounded Consumption | **LLM06** | up four |
| LLM09 Misinformation | **LLM07** | up two |
| LLM05 Improper Output Handling | **LLM10** | down five |
| LLM07 System Prompt Leakage | **LLM08 Hidden Context Exposure** | renamed and widened |

**CoSAI still maps to 2025.** Rather than wait, the 2026 edition is added as its own
framework and is the default lens, with titles and descriptions read from OWASP's document.
What is authored is only the renumbering — OWASP kept all ten risks, so each of CoSAI's 19
risk and 7 control mappings is carried onto its 2026 identifier one-for-one, none created,
dropped or reinterpreted.

**The 2025 edition is not shown.** It is superseded, and an obsolete ranking sitting next to
the current one is a trap rather than a feature. Its data stays in the repository — it is what
CoSAI publishes, and the translation is derived from it — so nothing is lost: every 2026 entry
shows the 2025 identifier CoSAI actually maps to, the card holds the full crosswalk, and a
link naming the old edition resolves to its 2026 equivalent instead of breaking.

`LLM09:2026` has nothing mapped to it — the same gap CoSAI leaves at `LLM08:2025`, carried
across honestly.

Every mapping badge elsewhere in the app links into this view.

## The capability layer: what you actually deploy

Both frameworks stop at the control *strategy*. CoSAI names "User Data Management"; leadership
asks which tool does that, and on what — the laptop, the cloud service we run, or the vendor AI
we merely subscribe to. The answer differs on all three, and neither framework models the
difference.

So the Capabilities tab adds a fourth taxonomy layer:
**CoSAI control group → CoSAI control → technology capability → deployment surface.**
Rows are the six CoSAI control groups, columns are **Endpoint**, **Cloud / hosted** and
**Third-party SaaS**, and every cell holds the tooling classes that work there. A blank cell is
a finding in itself: model weight protection has nothing under Third-party SaaS because the
vendor holds the weights.

The 56 classes are not a list of products, and the count was not chosen. Each had to pass three
tests:

1. **Named by at least two independent source families** — the threat and mitigation catalogues
   (MITRE ATLAS v5.6.0, OWASP LLM and Agentic Top 10s, LLMSVS, the Securing Agentic Applications
   Guide), government and standards controls (NIST SP 800-218A / AI RMF / AI 600-1, the CISA-NSA
   and 2026 Five Eyes joint guidance, UK NCSC, CSA AICM, ISO/IEC 42001, EU AI Act Article 15),
   procurable market categories (Gartner AI TRiSM, CSA's agentic market map, the cloud providers'
   own catalogues), and lifecycle tooling maps (OWASP's AI Security Solutions Landscape).
2. **A technology exists that implements it.** Entries are named for the tool, not the practice —
   *model registry & documentation generation*, not *documentation*. If the honest answer to
   "what would we deploy?" is "nothing, we would write something down or train someone", it is
   excluded. That rule removed user-transparency safeguards and acceptable-use policy from an
   earlier draft.
3. **It differs across at least one surface boundary**, or it is a control restatement.

Granularity follows the sources rather than taste. Gartner's information-governance layer
separates DSPM, DLP and data access governance, and puts runtime redaction in a different layer,
so those are four entries — the market buys them separately. Conversely non-human identity and
agent identity are **one** entry, because CSA's own non-human identity taxonomy makes agent
identity a class of NHI and every vendor ships them as one platform.

Two findings worth stating plainly, because they change what a control mapping can claim:
**ISO/IEC 42001's Annex A names no security control at all** — no red-teaming, no weight
protection, no injection defence; it is a governance catalogue. And **no major cloud provider
ships model signing**; AI-BOM and artifact signing are standards-mandated with no product behind
them, which makes them a predictable real-world gap.

**Nothing ships assessed.** Every capability starts at *needs assessed*, because this repository
maps what the taxonomy covers and must never imply a posture anyone holds. The edit pane cycles
each cell through *in place / partial / gap*, stores it in your browser, and exports a
`capabilities.yaml` that round-trips through `npm run data` — so a fork commits its own answers
and the site rebuilds around them. Vendor names are deliberately absent for the same reason: a
fork adds its own.

Deliberate exclusions are recorded with reasons in the file header — bias and fairness testing
and standalone hallucination detection (safety, not security: CoSAI carries no matching risk),
deepfake detection (single-source, no CoSAI risk), and Zero Trust (an architecture stance, not a
purchasable capability — it lives inside the segmentation and identity entries).

## The reference architectures: the drawing layer

The taxonomy answers *what to worry about* and the capabilities answer *what class of tool to
deploy*. The architectures answer the question that comes next in every review: **"so what does
a sound deployment actually look like?"** — one drawing per class of AI application, 28 in all,
across the same three surfaces as the capability matrix.

The catalogue is original work: no published source offers "here are the classes of AI
application, each with an architecture" — AWS ships worked scenarios, Google ships agent
patterns, OWASP ships threat taxonomies, all orthogonal to it. The archetypes were derived from
those catalogues plus the 2026 incident record, split or merged on one test: two archetypes are
separate when their control sets differ, not when their vendors do.

| Surface | Architectures |
| --- | --- |
| **Endpoint** (6) | Personal autonomous agent (the OpenClaw class), coding agent, agentic browser & AI extension, desktop assistant with computer use, local model runtime, local MCP & tool plane |
| **Cloud & hosted** (16) | RAG assistant, action agent, core agent workflow, AI API backend, agent-facing endpoint, batch pipeline, remote MCP server, sandboxed execution, voice agent, analytics agent, self-hosted inference, managed model API, managed agent runtime, AI gateway, training pipeline, internal AI platform |
| **Third-party SaaS** (6) | Tenant assistant, vendor action agent, low-code agent builder, enterprise AI chat, third-party MCP, shadow AI |

The drawing grammar is the one practitioners already read from vendor reference architectures
(F5's AI reference architecture is the closest published relative): **capability blocks** with
icon internals and a coloured title tab, **typed data paths** (data / external content &
actions / dotted governance), **numbered capability chips** seated on the drawing where each of
the 56 capabilities must be deployed, **coded risk tags** (`R01`–`R36`, stable across every
architecture) pinned where each CoSAI risk surfaces, and **scenario walks** that replay a
use case over the same canvas with everything else faded — *a stranger messages the agent*,
*a step replays after a crash*, *a skill is installed*.

Tab colour answers "what is this thing" in three layers plus grey: **Application** (running
code), **Model** (the model and its serving infrastructure, one green), **Data** (anything at
rest — records, memory files, indexes, registries), and a quiet grey for the security and
governance machinery CoSAI has no component for — gateways, identity edges, sandboxes, the
governance plane itself. That grey is a finding about the taxonomy, not a gap in the drawings:
it marks the 2026 product categories the component list has not caught up to. Border style
carries who runs the block — solid for services you operate, dashed grey for a provider you
cannot see into, dashed amber for the outside world.

The discipline matches the rest of the repository — architectures are authored as graphs, never
as pictures:

- Blocks sit on a coarse authored grid; `src/lib/flow-layout.ts` computes every pixel at build
  time. The client renders coordinates and runs no layout algorithm.
- **Every risk and capability on a page is pinned to a specific block or flow.** The
  architecture-level lists are derived from the pins, so the side rail can never claim
  something the drawing does not show.
- A pinned capability must apply on the architecture's surface per `capabilities.yaml` — the
  two taxonomy layers cannot drift into contradiction.
- The build **re-runs the renderer's own placement geometry** and fails if a flow passes
  through a block, a chip or tag lands on one, a tag stack runs off the canvas, or a title
  overflows its tab. Legibility is checked, not hoped for.
- Named products appear only in each architecture's dated `exemplars`; the drawings themselves
  are vendor-neutral.

`docs/AUDIT.md` section 4 tables the coverage (which risks and capabilities no architecture
pins yet) and every block's CoSAI anchor, so the colour claims stay reviewable. The
first-generation zone-style catalogue this replaced is archived intact under
`data/reference/archive/`.

## Where things live

Taxonomy data is YAML under `data/`, compiled once into a single typed dataset that the app
reads synchronously. Nothing is fetched at runtime.

```
data/
├── cosai/                        VENDORED, pinned commit, Apache-2.0 © Google LLC → CoSAI
│   ├── risks.yaml                36 risks in 5 categories
│   ├── controls.yaml             35 controls in 6 categories
│   ├── components.yaml           23 components in 3 categories
│   ├── personas.yaml             8 active personas (+ deprecated)
│   ├── frameworks.yaml           the 6 frameworks CoSAI maps onto
│   └── …                         actor-access, impact-type, lifecycle-stage vocabularies
├── overlay/                      AUTHORED HERE — everything CoSAI does not publish
│   ├── capabilities.yaml         ★ the capability taxonomy: 56 classes + 3 surfaces,
│   │                               each mapped to CoSAI controls/risks/components,
│   │                               with per-surface applicability and sources
│   ├── risk-components.yaml      which components light up per risk × phase
│   ├── saif-tour-seed.json       45 steps extracted from the public SAIF bundle
│   └── frameworks-authored.yaml  OWASP Agentic Top 10 + LLM Top 10 2026 mappings
├── frameworks/entries.yaml       framework entry titles and descriptions
├── incidents/                    5 authored incidents, replayed on the map
├── reference/
│   ├── architectures/            ★ 28 flow-style reference architectures, one YAML each
│   └── archive/                  the superseded zone-style catalogue, kept for the record
└── PROVENANCE.md                 pinned SHA, extraction record, what is original work

scripts/
├── build-data.ts                 data/** → dataset.json, with every integrity check
├── audit.ts                      regenerates docs/AUDIT.md from the data
├── fetch-cosai.ts                refreshes the vendored CoSAI snapshot
└── extract-saif-tour.ts          re-extracts the SAIF tour seed

src/
├── data/generated/dataset.json   the compiled dataset (committed, never hand-edited)
├── lib/
│   ├── types.ts                  every shape, including Capability and Surface
│   ├── data.ts                   the typed accessors the whole app reads
│   ├── map-layout.ts             hand-authored SVG geometry for the map
│   ├── flow-layout.ts            ★ build-time geometry + pin placement for the architectures
│   ├── bands.ts                  component → stack band
│   ├── deviations.ts             declared divergences from CoSAI
│   └── frameworks.ts             framework lens logic
├── app/                          one route per tab (App Router, static export)
│   ├── page.tsx                  landing
│   └── map|components|risks|controls|capabilities|reference|personas|frameworks|examples/
└── components/
    ├── shell/SiteHeader.tsx      nav: Risk Map group + Architectures + Incidents
    ├── map/RiskMap.tsx           the SVG map
    ├── tour/TourExplorer.tsx     the three-phase walkthrough
    ├── browse/                   components, risks, controls, personas, frameworks
    ├── capabilities/             matrix, detail, stack filter, status store, edit drawer
    ├── reference/                ★ flow diagram, insight rail, picker, per-block styling
    └── examples/IncidentExplorer.tsx

docs/AUDIT.md                     generated: every deviation and authored mapping, with reasons
```

## The incidents

Each is authored in `data/incidents/`, replayed as a numbered attack flow on the same map, and
tagged `target` (the AI system was attacked) or `weapon` (an AI agent ran the attack).

1. **OpenAI–Hugging Face** (May–Jul 2026) — training agents turned a writable package cache into
   a message board, taught each other to escape, and reached Hugging Face production. Nobody
   directed it.
2. **The MCP and agent-tool supply chain** (2025–26) — a CVE timeline from a single malicious
   server owning its client to an architectural flaw across every official SDK.
3. **Indirect prompt injection** (2025–26) — EchoLeak's zero-click exfiltration, evolving into a
   worm that propagates document to document.
4. **Coding-agent hijack via repository content** (2026) — hostile PR comments and poisoned
   `CLAUDE.md` / `.cursorrules` files.
5. **AI-orchestrated offensive operations** (2025–26) — GTG-1002, the Mexico nine-agency campaign
   and JADEPUFFER: assisted, then mostly automated, then fully autonomous.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

| Script | Purpose |
| --- | --- |
| `npm run data` | Compile `data/**` → the typed dataset, with every integrity check |
| `npm run audit` | Regenerate `docs/AUDIT.md` |
| `npm run fetch:cosai` | Refresh the vendored CoSAI snapshot from its pinned commit |
| `npm run extract:saif` | Re-extract the SAIF tour seed from the public SAIF bundle |

`dev` and `build` both compile the dataset first and fail on any dangling identifier — a risk
pointing at a control that does not exist, an incident step naming an unknown component, an
overlay phase with no components, a map that has drifted from CoSAI.

## Deployment

Static export, published to GitHub Pages by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main`. The
workflow lints and runs the full build, so a broken cross-reference fails the deploy rather than
shipping.

## Data and attribution

CoSAI-RM is vendored at a pinned commit under `data/cosai/`, Apache-2.0, © Google LLC,
contributed to CoSAI. See [`data/PROVENANCE.md`](data/PROVENANCE.md) for the pinned SHA, the SAIF
extraction record, and what here is original work.

Built with Next.js 16 (App Router), TypeScript and Tailwind v4. All diagrams are inline SVG —
the risk map's geometry is hand-authored, the architectures' is computed at build time from
authored graphs. No chart library, no runtime layout, no database, no runtime data fetching.
