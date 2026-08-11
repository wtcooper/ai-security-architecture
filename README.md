# AI Risk Map

**[wtcooper.github.io/ai-security-framework-viz](https://wtcooper.github.io/ai-security-framework-viz/)**

An interactive map of AI security risk: where each risk is **introduced**, where it is
**exposed**, and where it can be **mitigated**, across the components of an AI system.

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
- **The boundary is drawn.** The User, and external sources on both the agent and data sides,
  appear as dashed actors. CoSAI models the system and not what sits outside it — but most of the
  2026 incidents happen exactly there, so risks and incident steps can name them.

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

## Tabs

| Tab | What it does |
| --- | --- |
| **Landing** | What this is, how to read the three phases, where the data comes from. |
| **Risk Map** | Step through 36 risks × 3 phases. Each phase highlights a different set of components; the mitigated step names the controls that break the chain. |
| **Components** | Click any of the 23 components for its description, data flow, the risks that touch it, the controls that protect it — and any place the map differs from CoSAI. |
| **Risks** | All 36 by category: causes, impact, personas, lifecycle / impact / attacker-access facets, framework mappings, linked controls. |
| **Controls** | All 35 by category: what each protects, which risks it addresses, who owns it. |
| **Personas** | CoSAI's eight actors — responsibilities, "is this you?" questions, and the risks and controls each carries. |
| **Frameworks** | The cross-reference, read backwards. Pick OWASP / ATLAS / STRIDE / NIST / ISO, see what maps to each entry, and watch it light up the map. |
| **Examples** | Five incidents replayed step by step on the map, every step sourced. |

Every map view supports pan and zoom.

## Frameworks as a lens

CoSAI maps its entries onto six external frameworks, and each risk or control card lists what
it corresponds to. The more common question is the reverse — *"I am measured against OWASP,
what does that mean here"* — so the Frameworks tab inverts the index and answers it, including
the part most cross-reference tables leave out: **what a framework does not reach**.

The frameworks apply to different things, and CoSAI is explicit about which:

| Framework | Applies to | Entries | Coverage in CoSAI |
| --- | --- | --- | --- |
| MITRE ATLAS | risks, controls | 39 | 20/36 risks, 10/35 controls |
| STRIDE | risks | 6 | 26/36 risks |
| OWASP Top 10 for LLM | risks, controls | 10 | 19/36 risks, 7/35 controls |
| NIST AI RMF | controls | 10 | 8/35 controls |
| ISO 22989 | personas | 6 | 6/8 personas |
| EU AI Act | personas, controls | 0 | declared upstream, no mappings published yet |

Nothing maps to components, so the mapping block was removed from that tab rather than left
rendering nothing.

Two things fall out of this that are worth having:

- **Selecting an entry highlights the map.** "OWASP LLM01: Prompt Injection" becomes a picture
  of the components its mapped risks touch, at whichever phase you choose. It turns a
  compliance identifier into an architecture.
- **The gaps are shown, not hidden.** `LLM08:2025 Vector and Embedding Weaknesses` has nothing
  mapped to it; 17 of 36 risks carry no OWASP mapping at all. Both are stated plainly, because
  a cross-reference that only shows hits is misleading.

Every mapping badge elsewhere in the app links into this view.

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

Built with Next.js 16 (App Router), TypeScript and Tailwind v4. All diagrams are hand-authored
inline SVG — no chart library, no auto-layout. No database, no runtime data fetching.
