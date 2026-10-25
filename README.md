# AI Security Architecture

**[wtcooper.github.io/ai-security-architecture](https://wtcooper.github.io/ai-security-architecture/)**

Securely enabling AI, grounded in risk. The site reads as one path, from the risk down to enabling a deployment:

- **Learn the risk.** An interactive map of AI security risk — where each risk is
  **introduced**, where it is **exposed**, and where it can be **mitigated**, across the
  components of an AI system — plus reference architectures for every class of AI application,
  with sequence flows that show how data moves and where risk enters, and twenty real 2025–26
  incidents walked step by step across the architecture each happened on.
- **Enable it, per architecture.** Every architecture has an Enable tab: what to put in place,
  in the order an organisation puts it in place — enterprise foundations every AI deployment
  needs, what the surface adds, what the use case adds, then the tools, built or bought, and how
  far each covers the rest. Every row is a numbered capability chip on the drawing above it.

It began as a recreation of [Google's SAIF Map](https://saif.google/secure-ai-framework), rebuilt
on the broader taxonomy that succeeded it — the
[CoSAI Risk Map](https://github.com/cosai-oasis/secure-ai-tooling/tree/main/risk-map), which
SAIF became after Google donated it to the Coalition for Secure AI at OASIS — with capabilities
from MITRE D3FEND and ATLAS. [`docs/REFOCUS-INVENTORY.md`](docs/REFOCUS-INVENTORY.md) records
what the October 2026 refocus kept, moved and cut.

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

The nav follows one path, from the risk down to enabling a deployment, with the taxonomy kept
as reference — **Risk map** · **Capabilities** · **Architectures** · **Incidents** · **Reference ▾**
(Risks, Controls, Components, Personas, Frameworks).

| View | What it does |
| --- | --- |
| **Landing** | What this is, the path from risk to enablement in four steps, where the data comes from. |
| **Risk map** | Step through 36 risks × 3 phases. Each phase highlights a different set of components; the mitigated step names the controls that break the chain. |
| **Architectures** | 18 reference architectures, one per class of AI application. The drawing, with its numbered capability chips, then three tabs: Overview; Sequence flows (a walk numbered onto the drawing beside its sequence diagram, with the coded risk tags); and **Enable** — four steps that open folded, each showing its pin numbers until unfolded: (1) the enterprise foundations this architecture draws on, (2) the surface baseline, (3) the use case's own additions, each row a chip on the drawing with placement notes, governance guidance, the risks it reduces and a **Status ⓘ**; then (4) a tools grid — every product of that kind against every capability, one word per cell: Built-in, Partial or Not in tool — with each product's record and operator steps beneath. Opening a row lights its chip; picking a chip opens its row. Old `/enable` links redirect to the tab. |
| **Incidents** | A list of real 2025–26 incidents, newest first, filtered by attack type and architecture. Each opens its own page: a step-by-step walk across its reference architecture, every step sourced, ending at the capability pins that would have broken the chain — each a link to its row on the Enable tab. Old `/examples` links redirect. |
| **Reference › Risks** | All 36 by category: causes, impact, personas, lifecycle / impact / attacker-access facets, framework mappings, linked controls. |
| **Reference › Controls** | The 35 CoSAI controls in six groups. A control's status rolls up from the capabilities that deliver it. |
| **Reference › Capabilities** | The full catalogue — 59 MITRE mitigations and 17 authored specialisations — as a control group × deployment-surface matrix, tinted by status. A capability's detail shows the MITRE definition, the authored implementation scope, example technologies and where it is pinned. |
| **Reference › Components** | Click any of the 23 components for its description, data flow, the risks that touch it, the controls that protect it — and any place the map differs from CoSAI. |
| **Reference › Personas** | CoSAI's eight actors — responsibilities, "is this you?" questions, and the risks and controls each carries. |
| **Reference › Frameworks** | The cross-reference, read backwards. Pick OWASP LLM 2026 / OWASP Agentic / OWASP MCP / ATLAS / STRIDE / NIST / ISO, see what maps to each entry, and watch it light up the map. |

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

## Controls and capabilities

Two countermeasure vocabularies sit at different altitudes:

| Layer | Source | Role | Status? |
| --- | --- | --- | --- |
| Controls | CoSAI, 35 | The function the business needs ("Agent Execution Bounds"); personas own them | rolled up |
| **Capabilities** | MITRE D3FEND + ATLAS, 59, plus 17 authored specialisations (`cap-*`) | The actionable countermeasure at a place in the data flow ("Outbound Traffic Filtering on the sandbox egress"); the pins on every drawing and the rows on its Enable tab | **yes** |
| Tools | registry, 42 | Named products; each an instance of one reference architecture, with vendor coverage per capability | no |

A capability is a MITRE mitigation. The 59 MITRE entries are the citable vocabulary; each
carries the CoSAI controls it supports, the risks it addresses, example technologies that
deliver it, and an authored decision per surface (endpoint / cloud / third-party SaaS). Where
one MITRE entry is too coarse to report on, an authored **specialisation** in
`data/overlay/specializations.yaml` carries a local `cap-*` id and exactly one MITRE parent:
beside Generative AI Guardrails (`AML.M0020`) sit `cap-sensitive-data-redaction`, a DLP
enforcement point, and `cap-retrieval-grounding-checks` on the retrieval path. A specialisation
is a distinct enforcement point, never one technology split by risk type. In data and code the
record is still called `mitigation`, because its identifier is MITRE's; the app calls the layer
**Capabilities**.

Canonical identifiers, names and definitions come from checksum-pinned snapshots in
`data/mitre/` (D3FEND 1.6.0, ATLAS 2026.09). The selection, implementation guidance, example
technologies, deployment responsibility and CoSAI crosswalk are authored in
`data/overlay/mitigations.yaml`. The build rejects invented IDs and overrides of upstream names
or definitions, and checks each specialisation against its parent.

**31 of 35 CoSAI controls have a supporting mapping; this does not mean they are fulfilled.**
The four unmapped controls and important partial matches are documented in
[the gap assessment](docs/MITRE-CAPABILITY-GAPS.md) and rendered in the app. A separate authored
NIST CSF 2.0 crosswalk maps 34 of the 35 controls at category level; all 22 CSF categories are
visible, including unmapped ones.

### Status and your own names

Status is set in one file, [`data/status.yaml`](data/status.yaml), keyed by capability id, and
nothing ships with one: every capability reads **Not set** until listed there. Each entry takes
a `status` (`enabled`, `inProgress` or `gap`), optionally a `displayName` — the organisation's
own name for the capability, shown first with the catalogue name beneath — and a `note`. Every
Status heading carries an ⓘ saying so.

Status is set only on capabilities. A MITRE parent with no entry rolls up its specialisations,
and a control rolls up the capabilities that support it: Enabled only when every part is, a Gap
when nothing is under way, In progress otherwise. A rollup describes deployment, not control
compliance or mitigation effectiveness. Tools carry vendor facts only.

### Enable layers

[`data/overlay/enablement.yaml`](data/overlay/enablement.yaml) puts capabilities in the order an
organisation puts them in place: four groups of **enterprise foundations** every AI deployment
needs (identity & access, AI gateway & data protection, inventory & supplier review, monitoring
& response) and a **baseline per surface**. A use case's **additions** are derived — the
capabilities its architecture pins that neither layer already holds — and the **tools** grid
shows every pinned capability, grouped by layer, against every product of that kind. A
foundation must apply on every surface and nothing sits in two layers; the build checks both.

### Why the capability layer looks the way it does

Both frameworks stop at the control *strategy*. CoSAI names "User Data Management"; leadership
asks which tool does that, and on what — the laptop, the cloud service we run, or the vendor AI
we merely subscribe to. The answer differs on all three, and neither framework models the
difference. That is why each capability records its own per-surface decision, and why a blank
cell in the capabilities matrix is a finding, not missing data.

Two findings from the original survey are worth keeping in view because they change what a
control mapping can claim: **ISO/IEC 42001's Annex A names no security control at all** — no
red-teaming, no weight protection, no injection defence; it is a governance catalogue. And
**no major cloud provider ships model signing**; AI-BOM and artifact signing are
standards-mandated with no product behind them, which makes them a predictable real-world gap.

Deliberate exclusions: bias and fairness testing and standalone hallucination detection (safety,
not security: CoSAI carries no matching risk), deepfake detection (single-source, no CoSAI
risk), and Zero Trust (an architecture stance, not a purchasable capability — it lives inside the
segmentation and identity entries).

## The reference architectures: the drawing layer

The taxonomy answers *what to worry about* and the mitigations answer *what defensive function to
deploy*. The architectures answer the question that comes next in every review: **"so what does
a sound deployment actually look like?"** — one drawing per class of AI application, 18 in all,
across the three deployment surfaces used by the capability matrix.

The catalogue is original work: no published source offers "here are the classes of AI
application, each with an architecture" — AWS ships worked scenarios, Google ships agent
patterns, OWASP ships threat taxonomies, all orthogonal to it. The archetypes were derived from
those catalogues plus the 2026 incident record, split or merged on one test: two archetypes are
separate when their control sets differ, not when their vendors do.

| Surface | Architectures |
| --- | --- |
| **Endpoint** (5) | Third-party coding & desktop agents, first-party coding & desktop agents, personal autonomous agent (the OpenClaw class), local model runtime, browser AI agents & extensions |
| **Cloud & hosted** (8) | Single agent workflow, multi-agent workflow, chat agent with tools, remote MCP server you publish, self-hosted model inference, model training & release pipeline, agent sandbox for RL & evaluation, agent-to-agent federation |
| **Third-party SaaS** (5) | Enterprise AI chat with connectors, and four managed agent runtimes: UI/low-code, coding & desktop sessions, API/SDK, and persistent agents |

The drawing grammar is the one practitioners already read from vendor reference architectures
(F5's AI reference architecture is the closest published relative): **mitigation blocks** with
icon internals and a coloured title tab, **typed data paths** (data / external content &
actions), **numbered capability chips** seated on the drawing where each of
the selected mitigations must be deployed, **coded risk tags** (`R01`–`R36`, stable across every
architecture) pinned where each CoSAI risk surfaces, and **scenario walks** that replay a
use case over the same canvas with everything else faded — *a stranger messages the agent*,
*a step replays after a crash*, *a skill is installed*.

Tab colour answers "what is this thing" in three layers plus grey: **Application** (running
code), **Model** (the model and its serving infrastructure, one green), **Data** (anything at
rest — records, memory files, indexes, registries), and a quiet grey for the security and
governance machinery CoSAI has no component for — gateways, identity edges, sandboxes, the
governance plane itself. That grey is a finding about the taxonomy, not a gap in the drawings:
it marks the 2026 product categories the component list has not caught up to. The **zones**
say who runs each block: neutral grey bands for what you operate, a darker band with a dotted
edge for a vendor's platform and the outside world. Every block border is solid; only a
containment frame is dashed. Paths are dark grey and differ by dash alone (solid data path,
dashed external content & actions), and capability chips are violet — so each colour on the
drawing means one thing.

The drawing shows **one kind of pin at a time**: risk codes on Overview and Risks, numbered
capability chips on Capabilities, step numbers on Sequence flows. Every pin stays authored and
placed; only what is visible changes.

The discipline matches the rest of the repository — architectures are authored as graphs, never
as pictures:

- Blocks sit on a coarse authored grid; `src/lib/flow-layout.ts` computes every pixel at build
  time. The client renders coordinates and runs no layout algorithm.
- **Every risk and mitigation on a page is pinned to a specific block or flow.** The
  architecture-level lists are derived from the pins, so the side rail can never claim
  something the drawing does not show.
- A pinned mitigation must apply on the architecture's surface per `mitigations.yaml` — the
  two taxonomy layers cannot drift into contradiction.
- The build **re-runs the renderer's own placement geometry** and fails if a flow passes
  through a block, a chip or tag lands on one, a tag stack runs off the canvas, or a title
  overflows its tab. Legibility is checked, not hoped for.
- Named products appear only in each architecture's dated `exemplars`; the drawings themselves
  are vendor-neutral.

`docs/AUDIT.md` section 4 tables the coverage (which risks and mitigations no architecture
pins yet) and every block's CoSAI anchor, so the colour claims stay reviewable. Under the
drawing sits a one-line key; everything else is on hover.

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
│   ├── mitigations.yaml         ★ MITRE selection, CoSAI mappings + 3 surfaces,
│   │                               each mapped to CoSAI controls/risks/components,
│   │                               with per-surface applicability and sources
│   ├── specializations.yaml     ★ 17 authored specialisations (cap-*), one MITRE parent each,
│   │                               with the retired ids they restore, an implementation scope
│   │                               and optional control, surface, risk and process overrides
│   ├── enablement.yaml          ★ Enable layers: foundations for all AI, a baseline per surface
│   ├── risk-components.yaml      which components light up per risk × phase
│   ├── saif-tour-seed.json       45 steps extracted from the public SAIF bundle
│   └── frameworks-authored.yaml  OWASP Agentic, LLM Top 10 2026 and MCP Top 10 mappings
├── frameworks/
│   ├── entries.yaml              framework entry titles and descriptions
│   └── nist-csf.yaml             NIST CSF 2.0 categories + CoSAI control crosswalk
├── incidents/                    authored incidents, one YAML each, replayed on their architecture
├── reference/
│   ├── architectures/            ★ 18 flow-style reference architectures, one YAML each
│   └── guidance/                 controls guidance, one document per architecture
├── tooling/                      ★ the AI tooling registry: named products, one entity per
│   ├── vendors.yaml                product × architecture, with per-control operator steps
│   └── <vendor>/<family>.yaml      and vendor doc links, dated and verified
├── status.yaml                   ★ YOUR status and names per capability (see "Adopt this" below)
└── PROVENANCE.md                 pinned SHA, extraction record, what is original work

scripts/
├── build-data.ts                 data/** → dataset.json, with every integrity check
├── audit.ts                      regenerates docs/AUDIT.md from the data
├── fetch-cosai.ts                refreshes the vendored CoSAI snapshot
├── extract-saif-tour.ts          re-extracts the SAIF tour seed
└── lib/enablement.ts             loads and checks the Enable layers and the status file

src/
├── data/generated/dataset.json   the compiled dataset (committed, never hand-edited)
├── lib/
│   ├── types.ts                  every shape, including Mitigation and Surface
│   ├── data.ts                   the typed accessors the whole app reads
│   ├── map-layout.ts             hand-authored SVG geometry for the map
│   ├── flow-layout.ts            ★ build-time geometry + pin placement for the architectures
│   ├── bands.ts                  component → stack band
│   ├── deviations.ts             declared divergences from CoSAI
│   └── frameworks.ts             framework lens logic
├── app/                          one route per tab (App Router, static export)
│   ├── page.tsx                  landing
│   ├── incidents/[id]/           one static page per incident
│   └── map|reference|incidents|examples|enable|risks|controls|capabilities|components|personas|frameworks/
│                                   (enable/ and examples/ only redirect)
└── components/
    ├── shell/SiteHeader.tsx      nav: Risk map · Capabilities · Architectures · Incidents · Reference ▾
    ├── map/RiskMap.tsx           the SVG map
    ├── tour/TourExplorer.tsx     the three-phase walkthrough
    ├── browse/                   components, risks, controls, personas, frameworks;
    │                               CataloguePage.tsx is the shared master-detail shell
    ├── capabilities/             the Capabilities matrix (control group × surface) and detail
    ├── reference/                ★ flow diagram, sequence flows, picker, per-block styling
    ├── enable/                   ★ an architecture's Enable tab: the four layers, the tools grid, product records
    └── incidents/                the incident list and the per-incident walk-through

docs/AUDIT.md                     generated: every deviation and authored mapping, with reasons
```

## The incidents

Each incident is one YAML file in `data/incidents/`, walked step by step across one reference
architecture. The list on `/incidents` stays one glance however many are added: newest first,
with two filters — the attack type and the architecture.

**Attack types** (`src/lib/incident-categories.ts`), one per incident: prompt injection, supply
chain, identity & credentials, exposed by default, agent breaks out, AI as the attacker. The list
is short on purpose; an incident that fits none of them is a reason to revisit it.

**Adding one.** The build checks every field:

- `date` (`YYYY-MM`, when it came to light) sorts the list; `dateRange` is the human version.
- `category`, `perspective` (`target`: the AI system was attacked; `weapon`: an agent ran the
  attack) and `archetype`.
- `subtitle` (what happened, in a sentence or two) leads both the list row and the page.
- `caveat` when the account rests on one report or on figures nobody has confirmed.
- `steps`, each with a `path` of real edges and blocks on the architecture; the last step is the
  `mitigated` one.
- `breaks`: three to five capabilities pinned on that architecture, each with one line on where
  it bites. The last step lights them on the drawing.
- `sources` on the incident and on each step; smaller related events go in `alsoSeen`.

`components` and `controls` (the CoSAI component map and controls) are optional and no longer
shown; older case studies keep them.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

| Script | Purpose |
| --- | --- |
| `npm run data` | Compile `data/**` → the typed dataset, with every integrity check |
| `npm test` | Run the capability, matrix, Enable and Incidents tests |
| `npm run audit` | Regenerate `docs/AUDIT.md` |
| `npm run fetch:cosai` | Refresh the vendored CoSAI snapshot from its pinned commit |
| `npm run extract:saif` | Re-extract the SAIF tour seed from the public SAIF bundle |

`dev` and `build` both compile the dataset first and fail on any dangling identifier — a risk
pointing at a control that does not exist, an incident step naming an unknown component, an
overlay phase with no components, a map that has drifted from CoSAI.

## Adopt this in your organisation

Everything is text. Clone the repository, and:

1. **Set status, and your own names.** List capabilities in [`data/status.yaml`](data/status.yaml)
   by id — a MITRE mitigation (`D3-MFA`, `AML.M0020`) or a `cap-*` specialisation
   (`cap-sensitive-data-redaction`) — with a `status` (`enabled`, `inProgress`, `gap`) and,
   where you have one, a `displayName`. Anything not listed reads **Not set**. Control status and
   MITRE parents roll up automatically. The `org-taxonomy-customize` skill walks through the
   mapping.
2. **Adjust the Enable layers if your order differs.** `data/overlay/enablement.yaml` decides
   which capabilities are foundations and which a surface adds; use-case additions follow.
3. **Add or refresh products.** `data/tooling/<vendor>/<family>.yaml` is the registry; the
   `tooling-onboard` skill under `.claude/skills/` carries the research protocol. `npm run data`
   fails on any dangling id and `npm run audit` lists what each product entry has not yet
   addressed.

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
