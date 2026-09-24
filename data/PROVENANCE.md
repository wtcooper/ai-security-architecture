# Data provenance

## CoSAI Risk Map (CoSAI-RM)

`data/cosai/*.yaml` is a verbatim snapshot of the `risk-map/yaml/` directory from:

- **Repository:** https://github.com/cosai-oasis/secure-ai-tooling
- **Pinned commit:** `afa43cd605674bcbaa5b1420f7b018ee23b4e8d6` (2026-08-07)
- **License:** Apache License 2.0
- **Copyright:** © Google LLC, contributed to the Coalition for Secure AI (CoSAI), an OASIS Open Project.

Refresh with `npm run fetch:cosai` (see `scripts/fetch-cosai.ts`), which rewrites the
snapshot from the commit recorded in that script. Bump the SHA there and here together.

The upstream JSON Schemas that describe these files live at `risk-map/schemas/` in the
same repository and were used to derive `src/lib/types.ts`.

## SAIF tour seed

`data/overlay/saif-tour-seed.json` records, for each of the 15 risks in Google's original
public SAIF Map, which component boxes were highlighted during the Introduced / Exposed /
Mitigated steps of the tour.

- **Source:** https://saif.google/secure-ai-framework/saif-map
- **Extracted from:** `https://www.gstatic.com/marketing-cms/reviewed-scripts/prod/saif-1.3.14-318a3a1/styles/default/All.min.js`
- **Extracted on:** 2026-08-10 by `scripts/extract-saif-tour.ts`

This is factual mapping data (risk → component identifiers), used only as a seed for our
own `data/overlay/risk-components.yaml`. No SAIF prose or artwork is redistributed here —
all displayed descriptions come from the Apache-2.0 CoSAI-RM snapshot above.

## Framework entry reference text

`data/frameworks/entries.yaml` gives every external-framework identifier CoSAI maps onto a
name and a one-sentence description. CoSAI publishes bare identifiers only, so without this
the Frameworks tab shows `AML.M0003` with nothing to read. Each block records its own source:

- **MITRE ATLAS** — `dist/ATLAS.yaml` at tag `v5.0.1`, the version CoSAI's mappings declare.
  Labels are ATLAS names verbatim; descriptions are the first sentence of the ATLAS
  description. Two identifiers CoSAI stamps `@5.0.1` (`AML.T0034.002`, `AML.M0028`) were not
  defined until later; their text comes from `v5.6.0` and each carries a note saying so.
- **OWASP Top 10 for LLM 2025** — the opening of OWASP's own Description section for each
  entry, from the project's `2_0_vulns/` source files, trimmed to the definitional sentences.
- **STRIDE** — Microsoft's own wording for each category, from the Threat Modeling Tool
  documentation, with the security property each category threatens.
- **NIST AI RMF 1.0** — subcategory text verbatim from the NIST AI RMF Playbook
  (`airc.nist.gov`). The short labels are ours; NIST publishes the subcategories without one.
- **ISO/IEC 22989:2022** — clause 5 ecosystem roles. The standard's text is not openly
  licensed, so these describe each role as the standard defines it rather than quoting it.
  The only block here that is not the framework's own words.
- **OWASP Top 10 for Agentic Applications 2026** — OWASP's titles and descriptions, from the
  9 December 2025 publication announcement and the project's summary of each entry. CoSAI
  does not carry this framework at all; see below.
- **OWASP Top 10 for LLM Applications 2026** — read from the document itself
  (`OWASP-GenAI-LLM-Top-10-2026-v1.0.pdf`, Version 2026, published 4 August 2026, CC BY-SA
  4.0). Labels and descriptions are the opening of each entry's own Description section,
  trimmed to the definitional sentences.
- **OWASP MCP Top 10** — titles and definitional sentences from the OWASP MCP Top 10 project
  page (`owasp.org/www-project-mcp-top-10/`), version 0.1, CC BY-NC-SA 4.0. CoSAI does not
  carry this framework at all; see below.

`npm run data` fails if CoSAI maps to an identifier with no entry, and reports any entry
nothing maps to — except for the two OWASP LLM editions, STRIDE, OWASP Agentic and OWASP MCP,
where the full published list is shown on purpose so unmapped entries read as gaps.

## Framework material that is not CoSAI's

`data/overlay/frameworks-authored.yaml` is original work in this repository, kept separate
from the vendored CoSAI snapshot and badged in the UI so the two are never confused.

- **OWASP Top 10 for Agentic Applications (ASI01–ASI10)** is a framework CoSAI does not
  carry: its `frameworks.yaml` lists six, the OWASP entry among them is the LLM Top 10, and
  nothing in CoSAI's risks, controls or personas references an ASI identifier. The framework
  is OWASP's; the 21 risk mappings onto it are judgements made here. A risk is mapped only
  where the ASI entry describes it as it occurs in an agentic system — 15 of CoSAI's 36 are
  deliberately left unmapped, and ASI09 has nothing mapped to it because CoSAI has no risk
  for a human over-trusting an agent.
- **OWASP Top 10 for LLM Applications 2026** is the current edition of a framework CoSAI
  does carry — but CoSAI maps to the 2025 edition, and OWASP renumbered. It is added as its
  own framework, and is the default lens on the Frameworks tab, because being current matters
  more here than mirroring CoSAI exactly. What is authored is only the renumbering: OWASP kept
  all ten risks and changed their order, so each of CoSAI's 19 risk and 7 control mappings is
  carried onto its 2026 identifier one-for-one. No mapping was created, dropped or
  reinterpreted. LLM09:2026 has nothing mapped to it, inheriting the same gap CoSAI leaves at
  LLM08:2025.
- **OWASP MCP Top 10 (MCP01–MCP10:2025)** is a framework CoSAI does not carry, and nothing
  in CoSAI's risks, controls or personas references an MCP identifier. The framework is
  OWASP's; the 21 risk and 17 control mappings onto it are judgements made here. A risk is
  mapped only where the entry describes it as it occurs on the MCP tool plane — the 15 CoSAI
  risks that live elsewhere are left unmapped, as are runaway tool loops and economic denial
  of wallet, which have no counterpart in a list carrying no unbounded-consumption entry. It
  is version 0.1 and still in beta, so its numbering should be expected to move; OWASP
  publishes no release date for it, so none is claimed here.
- **CoSAI's 2025 edition is no longer offered as a lens**, having been superseded. Its data
  stays — it is what CoSAI publishes, the build still requires reference text for every
  identifier CoSAI maps to, and the crosswalk is derived from it. The 2026 view carries
  everything a reader needs from it: each entry names the 2025 identifier CoSAI publishes for
  it, the card holds the full crosswalk, and a `?fw=owasp-top10-llm` link resolves forward to
  the 2026 entry rather than breaking.

## Overlay

`data/overlay/risk-components.yaml` is original work in this repository. Each entry records
`source: saif` (translated from the seed above) or `source: authored` (written for the 21
risks CoSAI added after the SAIF donation, derived from each risk's own `tourContent`
prose, `lifecycleStage`, and mapped controls).

## Incidents

`data/incidents/*.yaml` is original work. Every incident and every flow step carries its own
`sources` list of public reporting; those links are rendered in the UI.

## Mitigations

Canonical identifiers, names and definitions are vendored from MITRE D3FEND 1.6.0 and
MITRE ATLAS 2026.09. See [the source manifest](mitre/sources.yaml) for release URLs, retrieval
dates, SHA-256 checksums and license notices. The build verifies snapshot checksums and resolves
only selected D3FEND defensive-technique descendants and ATLAS mitigation records.
Upstream definitions are imported unmodified; their own reference syntax is retained.
CoSAI's existing historical ATLAS mappings are unchanged.

`data/overlay/mitigations.yaml` is an authored selection and crosswalk, not a new taxonomy.
It supplies CoSAI supporting relationships with rationale, implementation guidance, examples
and deployment responsibility. It cannot override canonical titles/definitions or introduce
non-MITRE IDs. A product category or a feature under a broad mitigation is not another
mitigation; where a MITRE entry is too coarse to act on, the narrowing is an authored
specialisation in `specializations.yaml` (see Capabilities below), never a new id here. These
mappings are repository judgments, not MITRE or CoSAI endorsements.

`data/overlay/mitigation-gaps.yaml` records missing/partial requirements against existing
CoSAI control IDs. It introduces no mitigation identifiers. The scope and limitations are in
[the gap assessment](../docs/MITRE-CAPABILITY-GAPS.md).

`data/migrations/capabilities-v1.yaml` accounts for all 56 former authored IDs. Tool coverage
and organization posture are conservatively reassessed where scope changes; original evidence
is retained. Retired references are preserved in `data/migrations/capabilities-v1-retired.yaml`.
The org example is explicitly illustrative, and no migrated evidence receives a fresh
verification date merely because the identifier changed.

## Reference architectures

Representation rules for this layer — the entity model, the canonical component vocabulary,
the control enforcement classification (inline / embedded / management), and the three-zone
build-vs-buy responsibility rule — live in `data/ONTOLOGY.md`, with
`data/reference/vocabulary.yaml` as its build-checked machine half. The prose rules later in
this section predate that document and are retained as background; where they differ, the
ontology wins.

`data/reference/architectures/` is original work, currently mid-rebuild. The first-generation
catalogue — 28 archetypes drawn as trust-boundary zone diagrams over a shared node/zone/control
vocabulary — is archived intact under `data/reference/archive/` and remains the research base;
its derivation, exemplar and target-state disciplines carry forward. The rebuild redraws the
catalogue one architecture at a time in the grammar of the F5 AI reference architecture
(f5.com/resources/reference-architectures/ai-overview), which is the form practitioners and
security leadership actually read: vendor-neutral mitigation blocks connected by typed data
paths, with the risk and requirement mapping pinned onto the drawing rather than kept beside it.

An architecture is authored as a graph — blocks on a coarse grid, edges with a path class — and
never as a picture; `src/lib/flow-layout.ts` computes the geometry at build time, so what is
reviewed is the claim rather than the drawing. The F5 grammar maps onto this framework directly:

- **Blocks** are CoSAI components wherever CoSAI names one, anchored via `cosaiComponent` on the
  block or its internals. Nearly every block is anchored, under one colour rule: anything that
  is data at rest — records, repositories, memory files, journals, indexes, whether the system
  reads it or acts on it — is Data Storage or Data Sources (amber); Application blue is reserved
  for running services and code. External blocks are amber without exception — Downstream
  services anchor to Data Sources even where CoSAI would class the target system as an
  application, because from the architecture's point of view tools return data: whatever runs
  behind the boundary, what crosses back is content the loop will read. This is a deliberate
  logical-over-exact deviation from CoSAI's classification, and the renderer enforces it (an
  `external` block's tab is always the data colour). Model and model infrastructure share one green on these
  diagrams — a model provider covers both, and a two-colour tab is a puzzle, not a legend; the
  risk map keeps its four bands. CoSAI's Memory and RAG Content components, which the risk map
  draws inside the agent, survive as item-level anchors within those amber blocks so the
  cross-links stay precise. A quiet grey tab is
  reserved for the security and governance machinery CoSAI does not model: gateways, identity
  edges, sandboxes, and the governance plane itself. The endpoint personal-agent architecture
  draws no governance column at all, which is that diagram's finding. docs/AUDIT.md section 4d
  tables every block's anchor so the claims stay reviewable.
- **Block titles are a standard vocabulary** — the granular, architecture-level counterpart to
  CoSAI's component list, so a reader moving between architectures never wonders whether two
  names hide a difference. The standard nodes, used with these exact titles wherever the role
  recurs: **Application front end** (where requests enter — drawn only where human interaction is the core input; autonomous workflows draw their triggers straight into the harness instead), **Agent harness** (the reasoning core and its
  machinery — the agent loop, context assembly, and harness-specific components such as a
  heartbeat, stream handling or page extraction; qualified only when an architecture has
  several agents — "Supervisor agent", "Subagents" — or when the runtime is fused with another
  role, e.g. "Sandboxed runtime", the provider-owned "Managed runtime"), **AI gateway** (the customer-operated crossing every model
  and tool call leaves through — credential broker, limits, audit tap; qualified only when
  ownership differs, e.g. "Shared AI gateway", "Managed tool gateway"), **Tool services** (the
  actuation surface where tool or action calls land; its discipline — open tool plane vs
  deterministic action catalogue — lives in the items and notes), **Memory & state** (working
  state the agent reads back as context: memory files, journals, indexes, case state),
  **Downstream services** (the backend systems where effects land — drawn directly beneath Tool
  services, connected by a vertical external edge, on every architecture that has both),
  **Model provider** (the opaque inference boundary), **Sandboxed execution**, and **Governance
  plane** (qualified by who governs, e.g. "Tenant governance"). Untrusted-content sources keep
  content-specific names ("Repository content", "Docs & screen content") because what the
  content is carries the threat model. Where a block deliberately differs from a standard
  concept, it gets a different name — sameness of name is a claim of sameness of role. Block
  items name things that exist — transports, artifacts, stores, runtimes, published surfaces,
  functions of the block. Control and policy statements are not items: the pinned mitigation
  chip is the statement. The one exception is a block whose role *is* a control surface — the
  AI gateway, the governance plane, an egress gate, the OS permission layer, an output
  validation stage, a secure service edge, a tool broker — whose items describe its function.
  Vendor-application agents (the coding and desktop agents) share one Tool services item set:
  File & edit tools, Shell commands, Local & remote MCP, Installed skills, Computer use where
  the shell exposes it, and Sandboxed tools — the in-application isolation where commands and
  driven desktops run. The sandboxed personal agent keeps only the local surface inside its
  boundary (File & edit tools, Shell commands, Installed skills) and reaches Remote MCP and
  APIs & connectors as a separate Remote tool services block behind its gateway. Cloud agents
  share MCP servers, APIs & connectors, A2A peer agents. **Downstream services items** come
  from one vocabulary: Org data (systems of record), SaaS (mail, calendar and workspace
  accounts — one item, mail icon), Web & APIs, Vectorstore (retrieval indexes), Package
  registries, File storage, and Sandboxed tools where a remote execution service is the
  destination; architecture-specific destinations (e.g. Paired devices) may extend the list
  but never rename its members. **The permission gate is standard**: every architecture with
  an agent harness and a tool surface pins `AML.M0028` (AI Agent Tools Permissions Configuration) on the crossing
  between them — the OS permission layer, per-tool grants and action-catalogue validation are
  all this one control in surface-specific dress. Sandboxing is drawn as containment (a
  labelled frame in the React Flow view, a Sandboxed tools item where it lives inside an
  application), never as a standalone facility block.
- **Typed paths** follow F5's legend, simplified to two classes: one data path for flows
  inside the system, and external content and actions. F5's dotted governance relationship
  was dropped: the control plane is call-outs, not hops.
- **Numbered mitigation chips** are F5's design-requirements treatment carried by this
  framework's mitigation taxonomy: each chip marks where a mitigation must be deployed, and the
  rail links it to the Mitigations tab. A pinned mitigation must apply on the architecture's
  surface per `mitigations.yaml` — enforced by `npm run data`.
- **Risk tags** are F5's OWASP tags carried by CoSAI risks, with catalogue-stable codes (R01…)
  assigned from the risks' display order.
- **Scenario walks** replay numbered use-case paths over the same canvas, F5's
  building-block-highlight move applied to flows.

Two rules replace the zone-era build enforcement: every risk and mitigation on the page must be
pinned to a specific block or flow (the architecture-level lists are derived from the pins, so
the rail cannot claim what the drawing does not show), and scenario steps must follow real edges.
The target-state discipline is unchanged — these are architectures as they should be built, and
where the common deployment is weaker the observation lives in a note on the drawing.

These are **target states** — the architecture as it should be built, not a description of what
deployments typically look like.

The catalogue is deliberately small. Most candidate architectures turned out to be an agent
workflow with a different tool set, a single node, or a control drawn as a place — those are
parked, not deleted: their YAML lives under `data/reference/architectures/disabled/`, excluded
from the build, and `docs/full-ref-arch-catalog.md` records every active and disabled entry
with the reason. A disabled architecture returns to the app only by an explicit decision to
reactivate it.

Named products appear only in each architecture's `exemplars`, each carrying a source and an
`asOf` date, and are rendered as dated illustration. This is a deliberate departure from the
vendor-neutral discipline of `mitigations.yaml`: a reference architecture is not usable without
knowing what it is a reference to, and this is a domain where names moved fast enough during 2026
that an undated one becomes a wrong claim. The architectures themselves name no products.

`docs/AUDIT.md` section 4 reports the coverage gaps: risks and mitigations not yet pinned by any
flow-style architecture, and CoSAI components none anchors. Until the rebuild covers all three
surfaces those gaps are the work list, not a regression.

## Controls guidance

`data/reference/guidance/` is original work: the rung below each reference architecture, for
admins, architects and security teams — what an organisation enforces around that class of
system. One document per architecture, named after the architecture's own file. Product
specifics are referenced from the AI tooling registry (below), never written here. The audience
split is deliberate: developer-facing setup guidance and secure starter templates live in the
companion `ai-security-sdlc` project, not here.

Two disciplines carry over from the layers above:

- **Derivation.** Every guidance item cites at least one mitigation, and each must be pinned on
  its architecture — guidance cannot recommend deploying something the drawing does not show.
  `npm run data` fails otherwise; the fix is a pin, not an exception.
- **Dated vendor facts.** The tool registry is the one place this layer names products, because
  the option space there is narrow (a handful of dominant coding agents and desktop assistants,
  each with one documented policy mechanism). Every entry carries an `asOf` date and cites the
  vendor's own documentation, verified by fetching those pages on that date — never recalled
  from model memory. `npm run audit` flags entries older than six months for re-verification,
  and section 5 of `docs/AUDIT.md` tracks which architectures carry guidance and which pinned
  mitigations each document has not yet addressed.

## AI tooling registry

`data/tooling/` is original work and the only layer that names products: one entity per product
× reference architecture, under `<vendor>/<family>.yaml`, with the product's UI shells as
variants. Every entity is dated (`asOf`) and sourced from the vendor's own documentation, every
control row carries a `verified` date, and every operator step links to the page that documents
it; nothing is recalled from model memory. A tool may only describe its implementation of
mitigations pinned on its architecture — the drawing is the reference control set — and the
build fails otherwise. `npm run audit` lists the pinned mitigations each entity has not yet
addressed and flags entries older than six months. The `tooling-onboard` skill under
`.claude/skills/` carries the research protocol.

## Organisation layer

`data/org/` is the adopter's, not this repository's. Upstream ships `example/` (labelled as
such everywhere it renders); an adopter creates `local/`, which the build prefers and which
upstream never ships. Its catalogues become authored frameworks with `org: true`, inverted from
the entry-keyed authoring into the same cross-reference shape as the OWASP lenses, so the
Frameworks tab, the card badges, the architecture rails and hover cards and the AI Tooling tab
all read them without special cases. Every organisation record maps to one capability — a
MITRE mitigation id or a `cap-*` specialisation — and carries status per surface; tool posture
lives beside it, per tool × capability, using the same status enum. Status is authored nowhere
else: a parent mitigation rolls up its specialisations' records, control status is a rollup of
the capabilities that support the control, and technology categories carry none. The
`org-taxonomy-customize` skill walks through it.

## Capabilities

A capability is a MITRE mitigation from the selection above, or an authored specialisation of
one. `data/overlay/specializations.yaml` is original work: 17 specialisations with `cap-*`
keys, each naming exactly one MITRE parent — three under Operational Risk Assessment
(`D3-ORA`), two each under Generative AI Guardrails (`AML.M0020`), Access Mediation (`D3-AMED`)
and Asset Inventory (`D3-AI`), and one each under `AML.M0033`, `D3-OTF`, `D3-PT`, `AML.M0008`,
`AML.M0024` and `AML.M0014`. A specialisation is a distinct enforcement point, never one
technology split by risk type: sensitive-data redaction (a DLP point) and retrieval grounding
checks (the retrieval path) sit beside Generative AI Guardrails, while injection screening and
output policy stay inside it. The `cap-*` identifiers are repository keys only; the parent is
the citable mitigation and the sole source of canonical names and definitions. Each specialisation
authors its implementation scope and feature list, a `legacy` list of the retired home-grown
capability ids it restores, and optionally a subset of the parent's controls, per-surface
overrides with a note, examples, risks and process items written as a title and one playbook
sentence; everything it does not override is inherited from the parent. The build compiles
them into the mitigation list and checks that the parent is a MITRE entry, the controls are a
subset of the parent's, the surfaces are well-formed, and each legacy id is restored by exactly
one specialisation; the MITRE-id rule applies to parents only. Titles, implementation text,
surface notes and process items are repository prose, not a published standard, and a mapping
records that a capability supports a control, never that the control is fulfilled.

## Enterprise landscape

`data/overlay/landscape.yaml` places every MITRE parent capability onto the security domains an
enterprise security organisation runs, so coverage reads at the enterprise level, on the
Reference architectures page, before any one architecture is opened: the CISA Zero Trust
Maturity Model's five pillars and three cross-cutting capabilities. The framing is CISA's and is
cited; the placement of each capability — one primary home, in a `group` or `group/lane`
grammar — is this repository's judgement and does not claim CISA would agree. (Two alternative
framings, a Cyber Defense Matrix and Gartner's AI TRiSM layers, were trialled on 2026-09-19 and
retired on 2026-09-24 in favour of this one.) Specialisations are never placed: they follow their
parent and their organisation records roll up into it, exactly as on the Capabilities page. The
build requires every parent to be placed in every view and refuses any other id.

## Technology categories and supplementary framework lenses

`data/overlay/technology-categories.yaml` defines 25 sourced technology categories using local
`tech-*` keys. They are the technology dimension of a capability — each maps to MITRE parents,
and a specialisation inherits its parent's categories — and carry no surfaces and no status of
their own. `data/frameworks/technology-sources.yaml`
records exact category names, source versions/locations, official-vs-local identifier kinds,
and the additive NIST CSF control crosswalk. OWASP is the primary AI naming source; ENISA
ECSMAF 3.0 and ECSO supply additional technology categories; CISA TIC v3.3 functions and NIST
CSF 2.0 outcomes provide supplementary views. Descriptions and all category/implementation
crosswalks are authored here. Each mapping has an explicit relationship and rationale. See
[the source contract](frameworks/README.md).

CoSAI controls and their NIST AI RMF mappings are unchanged. Technology associations never
change architecture pins, vendor evidence, incident evidence, or organization posture. Names
are shown before IDs, and repository keys are never labeled as publisher identifiers.
