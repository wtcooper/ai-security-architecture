# AI Security Architecture

**[wtcooper.github.io/ai-security-architecture](https://wtcooper.github.io/ai-security-architecture/)**

Patterns for securely enabling AI. Pick the pattern for the AI tool or application in front of
you; it shows the controls your organisation needs in place and the settings of the product you
chose. Everything else in the app is the evidence behind those two lists.

- **Patterns.** One for each kind of AI tool or application, 20 in all, grouped by where the AI
  runs: tools on your devices, AI services you subscribe to, AI you host yourself. Each is a
  drawing of the components, data flows and trust boundaries, with every control numbered onto
  it where it goes.
- **Enable, per pattern.** Two steps: the **enterprise controls** the pattern needs, grouped by
  NIST CSF category, then the **settings** of the tools and clouds it runs on. For a team
  building on a cloud, the same list is the standard a design is reviewed against.
- **Three taxonomies, one job each.** NIST CSF 2.0 groups the controls. MITRE D3FEND and ATLAS
  name and identify each one. The CoSAI Risk Map and Google's SAIF explain the risks behind
  them, and live under **Reference** with the framework crosswalks.

The reader's words are **pattern**, **control**, **setting** and **risk**. In data and code a
pattern is still an `archetype` and a control a `mitigation`; a CoSAI control is always written
"CoSAI control".

It began as a recreation of [Google's SAIF Map](https://saif.google/secure-ai-framework), rebuilt
on the broader taxonomy that succeeded it — the
[CoSAI Risk Map](https://github.com/cosai-oasis/secure-ai-tooling/tree/main/risk-map), which
SAIF became after Google donated it to the Coalition for Secure AI at OASIS — and grew into
reference architectures. The risk-first version is kept on the `v1` branch;
[`docs/plans/2026-11-14-patterns-first.md`](docs/plans/2026-11-14-patterns-first.md) records the
restructure around patterns and where every page went.

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

## The pages

The nav leads with what a reader is enabling and keeps the reasoning one menu away —
**Patterns** · **Controls** · **Tools** · **Incidents** · **Reference ▾** (Risk map, Risks,
CoSAI controls, Components, Personas, Frameworks).

| View | What it does |
| --- | --- |
| **Home** (`/`) and **Patterns** (`/patterns/`) | Home opens with what the site is for and the three steps of reading a pattern, then the pattern finder: one situation at a time (tools on your devices, AI services you subscribe to, AI you host yourself), a short list of its patterns, and beside it a preview of the one the pointer is on — when it applies, its examples and its drawing. A click opens the pattern. The search box understands product, cloud and everyday words ("copilot", "azure", "chatbot") and searches every situation at once. |
| **Reference › Risk map** | Step through 36 risks × 3 phases. Each phase highlights a different set of components; the mitigated step names the controls that break the chain. |
| **A pattern** (`/patterns/<slug>/`) | One page per pattern. A header says when it applies and gives examples; the drawing carries its numbered control chips; beneath it sit four tabs, each of which changes what the drawing shows and the panel under it: How it works, Enable, Data flows and Incidents. **How it works** (default) opens with a **How to enable it →** link to Enable, then the pattern's overview (`overview`: what it is and what sets it apart from its nearest neighbour, in at most 420 characters), and folded sections for the risks that enter the pattern (opening one tags it on the drawing), the components, how it is built on the chosen platform and on each side by side, examples and sources. The long description, the guidance and the authors' notes on the drawing stay in the data for authors and are not shown. **Enable** is where the pattern is put in place, as folded steps: two for a pattern that is bought, three for one the organisation hosts (controls, then **Choose how you'll build it**, then **Set it**). (1) **Enterprise controls**: one table, a band per NIST CSF category with a plain heading ("Check your suppliers") and one sentence on what it is for, and one line per control: its chip, its name, your organisation's own controls that deliver it, where it goes on the drawing, the chosen product's settings for it, and its status once your organisation records one in `data/org/controls.yaml`. A row opens to what to do and why at each place it is pinned, each setting with the value to set, your own controls, and links to the drawing and the full definition. (2) **Set it in your product** (or **(3) Set it** on a hosted pattern): one pill per product and, for the one picked, its recommended settings as a table under the same bands and in the same column order as the controls table, so the eye moves from one to the other without relearning it: the chip of the control the setting delivers, then the control's name (and any other controls it delivers, each with its number) above the setting with a link to the vendor's page and its path; the value to set (a short `value` where the recommendation is a sentence, tinted so it never reads as the default) with the default and the reason; how it is set (MDM, admin console, config file, API/CLI, IdP, cloud policy or your own code); and its status at the right once recorded in `data/org/products.yaml`. A setting with a read-only command carries a **Check it** fold. On a hosted pattern, **(2) Choose how you'll build it** comes first, in the order the choices are made: (a) where it runs; (b) how it is hosted there, compared on the same ten rows from the vendor's own pages, none ranked, each marked if your organisation has approved it; (c) what the boxes you build are built with. **Data flows** numbers each sequence flow onto the drawing, with the boundary crossings. **Incidents** lists the real incidents that happened on it. The tab, the open product and the open control ride in the address; an old link to the Risks tab lands on How it works. |
| **Incidents** | A list of real 2025–26 incidents, newest first, filtered by attack type and architecture. Each opens its own page: a step-by-step walk across its reference architecture, every step sourced, ending at the controls that would have broken the chain — each a link to its row on the pattern's Enable tab. |
| **Reference › Risks** | All 36 by category: causes, impact, personas, lifecycle / impact / attacker-access facets, framework mappings, linked controls. |
| **Reference › CoSAI controls** (`/reference/cosai-controls/`) | The 35 CoSAI controls in six groups. A CoSAI control's status rolls up from the catalogue controls that deliver it. |
| **Controls** (`/controls/`) | The full catalogue — 59 MITRE mitigations and 17 authored specialisations — as a matrix of NIST CSF category × deployment surface, tinted by status; one switch regroups the rows by CoSAI control group (`/controls?by=cosai`). Filter by pattern, risk category, stack layer or source. A control's detail shows the MITRE definition, the authored implementation scope, example technologies, its CSF category, the CoSAI controls it contributes to and the patterns that pin it. |
| **Reference** (`/reference/`) | What each reference page is for, how risk is described, and where the data comes from. |
| **Reference › Clouds & on-premises** (`/reference/clouds/`) | One platform at a time (AWS, Azure, Google Cloud, your own data centre): the patterns mapped onto it, each with the vendor reference architecture it follows, and the cloud's own setting for every control under its NIST CSF category, with where it is set, the value to set, why, and the patterns that use it. |
| **Reference › Components** | Click any of the 23 components for its description, data flow, the risks that touch it, the controls that protect it — and any place the map differs from CoSAI. |
| **Reference › Personas** | CoSAI's eight actors — responsibilities, "is this you?" questions, and the risks and controls each carries. |
| **Reference › Frameworks** | The cross-reference, read backwards. Pick OWASP LLM 2026 / OWASP Agentic / OWASP MCP / ATLAS / STRIDE / NIST / ISO, see what maps to each entry, and watch it light up the map. |

Every diagram supports pan and zoom.

Addresses from before the restructure are forwarded: `/reference?archetype=…` (with its tab,
product and control anchor), `/enable`, `/capabilities` (the old address of the control
catalogue, now `/controls`), `/controls?control=<CoSAI id>` (now
`/reference/cosai-controls?control=<CoSAI id>`), `/map`, `/risks`, `/components`, `/personas`,
`/frameworks` and `/examples`. The site is a static
export, so each retired path keeps a small page that rewrites the address in the browser
(`src/components/shell/LegacyRedirect.tsx`); `src/lib/routes.ts` holds every address in one place.

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

## Controls, and the CoSAI controls above them

Two vocabularies sit at different altitudes. The app calls the MITRE-level item a **control**
and always writes "CoSAI control" for the layer above it:

| Layer | Source | Role | Status? |
| --- | --- | --- | --- |
| CoSAI controls | CoSAI, 35 | The function the business needs ("Agent Execution Bounds"); personas own them | rolled up |
| **Controls** | MITRE D3FEND + ATLAS, 59, plus 17 authored specialisations (`cap-*`) | The actionable control at a place in the data flow ("Outbound Traffic Filtering on the sandbox egress"); the pins on every drawing and the rows on its Enable tab | **yes** |
| Tools | registry, 54 | Named products; each an instance of one pattern, with its own security settings | adoption |

A control is a MITRE mitigation. The 59 MITRE entries are the citable vocabulary; each
carries the CoSAI controls it supports, the risks it addresses, example technologies that
deliver it, and an authored decision per surface (endpoint / cloud / third-party SaaS). Where
one MITRE entry is too coarse to report on, an authored **specialisation** in
`data/overlay/specializations.yaml` carries a local `cap-*` id and exactly one MITRE parent:
beside Generative AI Guardrails (`AML.M0020`) sit `cap-sensitive-data-redaction`, a DLP
enforcement point, and `cap-retrieval-grounding-checks` on the retrieval path. A specialisation
is a distinct enforcement point, never one technology split by risk type. In data and code the
record is still called `mitigation`, because its identifier is MITRE's; the app calls it a
**control**.

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

### Status and your own controls

Status comes from one file, [`data/org/controls.yaml`](data/org/controls.yaml), which lists the
organisation's own controls, and nothing ships with one: every catalogue control reads
**Not set** until one of yours maps to it. Each row takes an `id` (your own identifier, required
and unique, never shown on a page), a `name` (what pages show), optionally a `status`
(`enabled`, `inProgress` or `gap`), `maps` (the catalogue controls it delivers, one or more),
and optionally a `note` and a `link` to your policy or evidence. The mapping is many to many:
one of your controls can map to several catalogue controls, and several of yours can map to
one. A catalogue control lists your controls beneath it by name, each with its status. Every
Status heading carries an ⓘ saying so.

Status is never set on a catalogue control directly. It is worked out from your controls that
map to it: Enabled only when every one of them is enabled, a Gap when none is under way and at
least one has a status, In progress otherwise. A MITRE parent with none of yours mapped rolls
up its specialisations, and a CoSAI control rolls up the controls that support it, by the same
rule. A rollup describes deployment, not control compliance or mitigation effectiveness.

A second file, [`data/org/products.yaml`](data/org/products.yaml), records the tools, clouds
and data centres your organisation uses, under `products:`, keyed by tool id
(`toolClaudeCode`) or platform id (`cloudAzure`, `cloudOnPrem`): a `status` (`enabled`, `testing` or `notEnabled`) colours the product's pill,
and a `settings:` map gives each of its settings rows its own status and, optionally, the
`value` you actually set and a `link` to your own module, policy or runbook that applies it.
On a platform, a `components:` map records what you run for a component in place of the
reference service (`gateway: { uses: Kong AI Gateway, link: https://… }`), for every pattern or
for one (`archChatAgent/memory`). The drawing shows your choice in that box, marked as yours,
and How it works lists it beside the reference. A `hosting:` map records which ways of hosting
you have approved (`aks: { status: enabled }`), shown on each option in the choosing step. Anything not listed reads **Not enabled**.

### Control families: NIST CSF

[`data/overlay/enablement.yaml`](data/overlay/enablement.yaml) puts every one of the 76 controls
under exactly one **NIST CSF 2.0 category**, and that grouping is used everywhere a list of
controls is shown: the bands of a pattern's Enable tab (in CSF order: Govern, Identify, Protect,
Detect, Respond, Recover) and the rows of the control catalogue. Category names and functions
come from `data/frameworks/nist-csf.yaml`; only a one-line blurb is authored per category, with
an optional blurb per surface.

NIST publishes no mapping from CSF to MITRE D3FEND or ATLAS, so which category a control sits in
is this repository's judgement. Three fits are weak and were decided on purpose: input and
output guardrails sit under Data Security (PR.DS); agent permissions, action policy and human
approval under Identity Management, Authentication, and Access Control (PR.AA), because CSF has
no category for what an agent may do; and release controls are split between Platform Security
(PR.PS) and Risk Assessment (ID.RA). The build copies the grouping into the CSF crosswalk on the
Frameworks page, so the two cannot disagree.

The file's `baseline` list marks the controls **every AI deployment** needs, which are tagged on
their rows. Every control must sit in exactly one category that the CSF framework file declares,
and every baseline control must apply on every surface; the build checks all three.

### Why the control layer looks the way it does

Both frameworks stop at the control *strategy*. CoSAI names "User Data Management"; leadership
asks which tool does that, and on what — the laptop, the cloud service we run, or the vendor AI
we merely subscribe to. The answer differs on all three, and neither framework models the
difference. That is why each control records its own per-surface decision, and why a blank
cell in the control matrix is a finding, not missing data.

Two findings from the original survey are worth keeping in view because they change what a
control mapping can claim: **ISO/IEC 42001's Annex A names no security control at all** — no
red-teaming, no weight protection, no injection defence; it is a governance catalogue. And
**no major cloud provider ships model signing**; AI-BOM and artifact signing are
standards-mandated with no product behind them, which makes them a predictable real-world gap.

Deliberate exclusions: bias and fairness testing and standalone hallucination detection (safety,
not security: CoSAI carries no matching risk), deepfake detection (single-source, no CoSAI
risk), and Zero Trust (an architecture stance, not a purchasable control — it lives inside the
segmentation and identity entries).

## The reference architectures: the drawing layer

The taxonomy answers *what to worry about* and the mitigations answer *what defensive function to
deploy*. The architectures answer the question that comes next in every review: **"so what does
a sound deployment actually look like?"** — one drawing per class of AI application, 20 in all,
across the three deployment surfaces used by the control matrix.

The catalogue is original work: no published source offers "here are the classes of AI
application, each with an architecture" — AWS ships worked scenarios, Google ships agent
patterns, OWASP ships threat taxonomies, all orthogonal to it. The patterns were derived from
those catalogues plus the 2026 incident record, split or merged on one test: two patterns are
separate when their control sets differ, not when their vendors do.

| Surface | Architectures |
| --- | --- |
| **Endpoint** (5) | Third-party coding & desktop agents, first-party coding & desktop agents, personal autonomous agent (the OpenClaw class), local model runtime, browser AI agents & extensions |
| **AI you host yourself** (10; on a cloud or on-premises) | Single agent workflow, multi-agent workflow, chat agent with tools, remote MCP server you publish, self-hosted model inference, model training & release pipeline, agent sandbox for RL & evaluation, agent-to-agent federation, managed agent service in your cloud, agentic software factory |
| **Third-party SaaS** (5) | Enterprise AI chat with connectors, and four managed agent runtimes: UI/low-code, coding & desktop sessions, API/SDK, and persistent agents |

A managed agent service is sorted by tenancy, not by who runs the agent loop. A service that
runs inside a cloud account the organisation governs (its subscription, identity, network,
keys, policy and logs) is "AI you host yourself", drawn as the managed agent service in your
cloud: the provider still runs the loop, inside a provider boundary, and the enterprise wraps
its own cloud controls around it. A service in another company's tenancy, reached over the
internet with that vendor's console, keys and contract, stays with the third-party SaaS
patterns as the API/SDK managed agent runtime.

Every pattern has **one drawing**, the trust-boundary view: each zone is a labelled outline
(managed endpoint, enterprise cloud, vendor platform, external), people stand outside every
boundary, the security and governance control plane runs beneath, and each component is a
plain box with a title, one line and a thin accent for its type. Pointing at a box shows what
it holds, and the **How it works** tab lists every component with everything it holds, so
nothing is hover-only. The drawing is laid out automatically for all 20 patterns by
`src/components/drawing/layout.ts`; no pattern has coordinates in code. Four fields in a
pattern's file feed it: a `summary` on every block (its one line), a `gloss` on a zone (a few
words beside the canonical name), a `crossing` on every flow that crosses a boundary (what it
passes through on our side), and, where a wide zone should fold into fewer columns, a `cell`
on a block. People and outside callers stand outside every boundary, and their flows count as
crossings. An earlier second view (the "detailed" canvas, which drew every item with an icon)
was retired on 2026-11-16; incident replays use the same boundary drawing.

The mouse belongs to the page until the drawing is clicked. Click it and the wheel zooms about
the pointer and a drag pans; click anywhere else, or press Esc, and the wheel scrolls the page
again. The − / + / Fit buttons and Ctrl or ⌘ with the wheel work at any time, and Expand opens
the drawing across the whole window.

[`docs/PATTERN-STANDARD.md`](docs/PATTERN-STANDARD.md) states what a complete pattern must
meet: seven measured layout rules, the structure every drawing shares, and the content a
pattern's file must carry. `npm run drawing:audit` scores every pattern against it and the
tests fail if one slips. [`docs/PATTERN-FINDINGS.md`](docs/PATTERN-FINDINGS.md) lists the open
questions about the patterns themselves that the audit and the review turned up.

**A pattern you host can be read as built on a cloud, or in your own data centre.** Nine of
the ten "AI you host yourself" patterns (agents, model inference, MCP servers, pipelines, the
software factory) are mapped onto AWS, Azure, Google Cloud and an on-premises data centre in
`data/clouds/`; the tenth, the managed agent service in your cloud, is mapped onto the three clouds only, because a
provider-run service has no on-premises form (the platform's file says so under `notOffered`,
and the page points to the pattern to build there instead). On that pattern the cloud's own
agent service comes with the cloud: its product record carries `platform:`, its settings are
listed with the cloud's rows, and together they must deliver every pinned control. A **Built on**
switch above the drawing (Generic · AWS · Azure · Google Cloud · On-premises) is one state,
kept in the address as `?cloud=aws` or `?cloud=onprem` on every tab, and it changes four things
together: every box on the drawing names what plays it (or says "you build this"); every
control row on Enable names that platform's own settings for it, and the open row gives each
one's place, value and reason; the settings step lists that platform's settings; and How it
works names what plays each component, with its note, and compares the platforms side by side.
A control-plane box is a function, not one service, so it lists the settings that deliver its
controls. The tests check, for all 39 pattern-and-platform pairs, that every named component
and every pinned control is covered.

**Where it runs is not what it is built with.** A platform says where each box runs and which
of its services plays it; it does not decide the framework. Each catalogued tool on a hosted
pattern says which box it `fills`, each example says which box it is an example of, and a
platform's mapping records the framework its own guides use as `builtWith` beside the service
name ("Your agent on AgentCore Runtime", built with Strands Agents in AWS's guides: a default,
not a requirement). A setting in a platform's file that is really a framework's own carries the
same tag, so it reads "applies if you build this with …".

**Who runs the agent is a choice of its own.** Between the platform and the framework sits the
hosting option. Running your code on your own cluster and running it on the platform's
own runtime are the same pattern: the trust boundaries do not move, so a mapping records
the second as a variant that changes only some components and settings (`hosting:` in the
platform's file, chosen as `?host=`). A managed agent service, where the vendor runs the agent
loop, is not a variant: the loop moves into the provider's boundary, which is another pattern
(the managed agent service in your cloud), so the option links there instead of being redrawn
here. For the other hosted patterns a managed option is a service where the provider runs the
server, the model, the training or the sandbox for you; no pattern draws it, so the option says
what the service offers. The
comparison rows are fixed (who runs it, who patches, where the data lives, networking,
identity, what it accepts, how it handles the work, portability, what your team operates, when
the vendor says it fits) and carry no ranking, because the right answer depends
on what an organisation has approved. That is recorded in `data/org/products.yaml` under
`products.<platform>.hosting`, and shown on each option. All eight hosted patterns list their
options on every platform (for example, on Azure: Container Apps, AKS and Foundry Agent
Service for an agent; AKS, managed online endpoints and Foundry Models for inference). The rows
are worded for what the pattern hosts: an agent, an MCP server, a model server, a training job
or a sandbox. Each claim was written by one researcher and re-checked by a second who was not
shown the first one's sources; [`docs/CLOUD-VERIFICATION.md`](docs/CLOUD-VERIFICATION.md) has
the counts and what the second check changed.

*On-premises* is the pattern run on infrastructure the organisation owns and operates, where no
provider runs any part: Kubernetes on its own servers, LiteLLM Proxy as the AI gateway, vLLM
for inference, and self-hosted identity, secrets, registry, policy and logging. The
organisation's boundary on the drawing then reads **Enterprise data centre**, and How it works
lists what a cloud provider would otherwise have run for you. The stack is this catalogue's
choice for each role; record what you run instead in `data/org/products.yaml`.

**One drawing, and each platform says where it differs.** The drawing is the same on every
platform, because the trust boundaries and the controls do not change with the vendor. What
does change is stated, not hidden: each mapping lists the places where that platform does not
follow the drawing (a model call that goes direct by default, a search feature that bypasses
the gateway, a sandbox with no outbound network). Those places carry a **≠** mark on the
drawing, and How it works has a section for the chosen platform with the differences, the
supporting services you also need (identity, network, keys, registries, logging) that are not
boxes on the drawing, and the vendor's own quickstart to start building from. Every named
component links to the vendor page it was checked against, with the date.
[`docs/CLOUD-VERIFICATION.md`](docs/CLOUD-VERIFICATION.md) records what was checked, what was
corrected and what is still open.

**How far the detail goes.** A pattern tells you what to build, which setting delivers each
control and what value to set. It does not carry commands that create or change anything: how
an organisation deploys (its landing zone, its modules, its pipelines) is its own, and a
snippet copied from here would be stale or wrong for it. Two things close the gap. A setting
may carry a **check**: one read-only command from the vendor's reference that shows the
setting's current value, with what a pass looks like (piloted on the single agent workflow on
AWS; the build refuses a check that is not read-only, and no check here has been run by this
project). And an organisation records, in `data/org/products.yaml`, what it runs for a component in
place of the reference and a link to its own module or runbook for a component or a setting;
the drawing and the tables then show the organisation's choice beside the reference.

Under **Flows**, a
**boundary crossings** table lists every flow that crosses a trust boundary: what crosses, what
it passes through on our side (a control point we run, the vendor, the person, or nothing of
ours), and the controls held there.

What is drawn: **typed data paths** (data / external content & actions), **numbered control
chips** seated where each of the pattern's controls must be deployed, **coded risk tags**
(`R01`–`R36`, stable across every pattern) pinned where each CoSAI risk surfaces, and
**sequence flows** that replay a use case over the same drawing with everything else faded —
*a stranger messages the agent*, *a step replays after a crash*, *a skill is installed*.

A box's accent answers "what is this thing" in three layers plus grey: **Application** (running
code), **Model** (the model and its serving infrastructure, one green), **Data** (anything at
rest — records, memory files, indexes, registries), and a quiet grey for the security and
governance machinery CoSAI has no component for — gateways, identity edges, sandboxes, the
governance plane itself. That grey is a finding about the taxonomy, not a gap in the drawings:
it marks the 2026 product categories the component list has not caught up to. The **boundaries**
say who runs each block: dashed grey for what you operate, violet for a vendor's platform,
red-tinted for the outside world. Paths are dark grey and differ by dash alone (solid data
path, dashed external content & actions), and control chips are violet — so each colour on the
drawing means one thing.

The drawing shows **one kind of marker at a time**: numbered control chips on Enable, How it
works and Incidents; a risk's tags while one is open under How it works; a flow's step numbers
on Data flows. Every pin stays authored and
placed; only what is visible changes.

The discipline matches the rest of the repository — architectures are authored as graphs, never
as pictures:

- Blocks sit on a coarse authored grid (`col`, `row`); `src/components/drawing/layout.ts`
  turns it into the drawing, routing every arrow, and no pattern carries coordinates.
- **Every risk and mitigation on a page is pinned to a specific block or flow.** The
  architecture-level lists are derived from the pins, so the side rail can never claim
  something the drawing does not show.
- A pinned mitigation must apply on the architecture's surface per `mitigations.yaml` — the
  two taxonomy layers cannot drift into contradiction.
- The tests **run the drawing's own layout** for every pattern and fail if an arrow passes
  through a box or a boundary it does not belong to, a label is cut or lands on something, or
  the drawing outgrows a laptop screen. Legibility is checked, not hoped for.
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
│   ├── enablement.yaml          ★ control families: each control's NIST CSF category, and the baseline for all AI
│   ├── patterns.yaml            ★ the pattern finder: a use-when line and search words per pattern
│   ├── risk-components.yaml      which components light up per risk × phase
│   ├── saif-tour-seed.json       45 steps extracted from the public SAIF bundle
│   └── frameworks-authored.yaml  OWASP Agentic, LLM Top 10 2026 and MCP Top 10 mappings
├── frameworks/
│   ├── entries.yaml              framework entry titles and descriptions
│   └── nist-csf.yaml             NIST CSF 2.0 categories + CoSAI control crosswalk
├── incidents/                    authored incidents, one YAML each, replayed on their architecture
├── reference/
│   ├── architectures/            ★ 20 flow-style reference architectures, one YAML each
│   └── guidance/                 controls guidance, one document per architecture
├── tooling/                      ★ the AI tooling registry: named products, one entity per
│   ├── BASELINE.md                 product × architecture, with per-control operator steps,
│   ├── vendors.yaml                each security setting and its recommended baseline value
│   └── <vendor>/<family>.yaml      (BASELINE.md is the rubric), dated and verified
├── clouds/                       ★ AWS, Azure, Google Cloud and on-premises: each platform's security
│   └── <cloud>.yaml                settings, and every hosted pattern as built on it (onprem.yaml is your own data centre)
├── org/                          ★ YOUR organisation's inputs (see "Adopt this" below)
│   ├── controls.yaml               your own controls: name, status and the catalogue controls each delivers
│   └── products.yaml               the tools and platforms you use, their settings, components and hosting
└── PROVENANCE.md                 pinned SHA, extraction record, what is original work

scripts/
├── build-data.ts                 data/** → dataset.json, with every integrity check
├── audit.ts                      regenerates docs/AUDIT.md from the data
├── fetch-cosai.ts                refreshes the vendored CoSAI snapshot
├── extract-saif-tour.ts          re-extracts the SAIF tour seed
├── lib/enablement.ts             loads and checks the control families and your controls (data/org/controls.yaml)
└── lib/products.ts               checks settings rows, cloud implementations and your products (data/org/products.yaml)

src/
├── data/generated/dataset.json   the compiled dataset (committed, never hand-edited)
├── lib/
│   ├── types.ts                  every shape, including Mitigation and Surface
│   ├── data.ts                   the typed accessors the whole app reads
│   ├── map-layout.ts             hand-authored SVG geometry for the map
│   ├── icon-names.ts             the icons a component's items may use
│   ├── bands.ts                  component → stack band
│   ├── deviations.ts             declared divergences from CoSAI
│   ├── frameworks.ts             framework lens logic
│   └── routes.ts                 ★ every internal address, and the helpers that build them
├── app/                          one route per tab (App Router, static export)
│   ├── page.tsx                  home: the pattern finder
│   ├── patterns/[slug]/          one static page per pattern
│   ├── controls/                 the control catalogue
│   ├── incidents/[id]/           one static page per incident
│   ├── reference/                the index, and risk-map|risks|cosai-controls|components|personas|frameworks|clouds/
│   └── map|risks|components|personas|frameworks|capabilities|enable|examples/
│                                   retired paths: each only forwards to its new address
└── components/
    ├── shell/SiteHeader.tsx      nav: Patterns · Controls · Incidents · Reference ▾
    ├── shell/LegacyRedirect.tsx  forwards every address the site used before patterns led
    ├── patterns/                 ★ the finder (browse with a preview), the pattern page, its risk and incident panels
    ├── map/RiskMap.tsx           the SVG map
    ├── tour/TourExplorer.tsx     the three-phase walkthrough
    ├── browse/                   components, risks, CoSAI controls, personas, frameworks;
    │                               CataloguePage.tsx is the shared master-detail shell
    ├── controls/                 the control catalogue (CSF category × surface) and a control's detail
    ├── OrgControls.tsx           an organisation's own controls, shown by name beside the control they map to
    ├── drawing/                  ★ the boundary drawing: automatic layout, crossings, the crossings table
    ├── cloud/                    ★ a pattern as built on a cloud: the switch, the component table, options per control, the Clouds page
    ├── reference/                ★ the pattern view (drawing, tabs, panels), sequence flows, switcher, per-block styling
    ├── enable/                   ★ a pattern's Enable tab: the controls by CSF category, the choices of a hosted pattern, product pills and recommended-settings tables
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
- `breaks`: three to five controls pinned on that architecture, each naming one as `control:`
  with one line on where it bites. The last step lights them on the drawing.
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
| `npm test` | Run the control, matrix, Enable, incident, route, vocabulary and drawing tests |
| `npm run audit` | Regenerate `docs/AUDIT.md` |
| `npm run drawing:audit` | Score every pattern against the pattern standard; add `-- <slug>` for one pattern's findings |
| `npm run fetch:cosai` | Refresh the vendored CoSAI snapshot from its pinned commit |
| `npm run extract:saif` | Re-extract the SAIF tour seed from the public SAIF bundle |

`dev` and `build` both compile the dataset first and fail on any dangling identifier — a risk
pointing at a control that does not exist, an incident step naming an unknown component, an
overlay phase with no components, a map that has drifted from CoSAI.

## Adopt this in your organisation

Everything is text. Clone the repository, and:

1. **Record your own controls, and their status.** List your organisation's controls in
   [`data/org/controls.yaml`](data/org/controls.yaml), one row each: an `id` of your own (never
   shown on a page), the `name` people see, a `status` (`enabled`, `inProgress`, `gap`) where
   you have assessed it, and `maps`, the catalogue controls it delivers: each a MITRE mitigation
   (`D3-MFA`, `AML.M0020`) or a `cap-*` specialisation (`cap-sensitive-data-redaction`). One of
   yours can map to several, and several of yours can map to one. A catalogue control with none
   of yours mapped reads **Not set**. Catalogue control status, MITRE parents and CoSAI controls
   roll up automatically. The `org-taxonomy-customize` skill walks through the mapping. In
   [`data/org/products.yaml`](data/org/products.yaml), record the tools and platforms you use,
   which of their settings you have switched on, what you run in place of a reference
   component, and links to your own modules and runbooks.
   [`data/org/README.md`](data/org/README.md) describes both files.
2. **Adjust the control families if you disagree with a fit.** `data/overlay/enablement.yaml`
   decides which NIST CSF category each control sits under and which controls are the baseline
   for every AI deployment; `data/overlay/patterns.yaml` holds each pattern's use-when line and
   search words.
3. **Add or refresh products.** `data/tooling/<vendor>/<family>.yaml` is the registry; the
   `tooling-onboard` skill under `.claude/skills/` carries the research protocol. `npm run data`
   fails on any dangling id and `npm run audit` lists what each product entry has not yet
   addressed.

## Keeping it current

Five skills under `.claude/skills/` carry the procedures for maintaining the catalogue. Each is
run by asking Claude Code for the thing in plain words.

| Skill | What it does | It leaves |
| --- | --- | --- |
| `pattern-research` | Sweeps the web, as of the day it runs, for kinds of AI tool or application the catalogue has no pattern for, and sorts each finding into new pattern, change to an existing pattern, product of an existing pattern, or watch. | A dated report in `docs/research/patterns/`. It changes no data. |
| `pattern-author` | Adds a pattern, or restructures one, to the [pattern standard](docs/PATTERN-STANDARD.md): the drawing, one-liners, crossings, pins, sequence flows, guidance and finder entry, looped against the build, the drawing audit and the tests. | The pattern's files, and its row in the sign-off table. |
| `incident-research` | Sweeps the web for AI security incidents since the last one on file, verifies each against its sources, and writes the ones that qualify as walk-throughs on the pattern they happened on. | New files in `data/incidents/` and a dated log in `docs/research/incidents/`. |
| `tooling-onboard` | Adds or re-verifies a product's security settings under the pattern it belongs to. | A file in `data/tooling/`. |
| `org-taxonomy-customize` | Records your organisation's own controls, their status and the catalogue controls each delivers, and the products you use. | `data/org/controls.yaml` and `data/org/products.yaml`. |

The three research and authoring skills hand off to each other: a scan that finds a new kind of
system recommends a pattern, `pattern-author` draws it, and an incident that fits no pattern is
sent back to the scan as evidence for one. Both research skills read the current date from the
machine and record every query they ran, so a gap in the catalogue can be told from a lane
nobody searched.

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
