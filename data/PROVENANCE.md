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

`npm run data` fails if CoSAI maps to an identifier with no entry, and reports any entry
nothing maps to — except for the two OWASP LLM editions, STRIDE and OWASP Agentic,
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

## Capabilities

`data/overlay/capabilities.yaml` is original work: a taxonomy of vendor-neutral technology
capability classes (EDR, model API guardrails, AI-SPM, …), each mapped onto CoSAI controls,
risks and components, with per-surface applicability across endpoint, cloud/hosted and
third-party SaaS. The capability classes were derived by convergence across four independent
source families read from the primary documents — threat and mitigation catalogues (MITRE
ATLAS, the OWASP LLM and Agentic Top 10s, LLMSVS, the Securing Agentic Applications Guide),
government and standards controls (NIST SP 800-218A, AI RMF, AI 600-1, the CISA/NSA and Five
Eyes joint guidance, UK NCSC, CSA AICM, ISO/IEC 42001, EU AI Act Article 15), procurable
market categories (Gartner AI TRiSM, CSA's agentic market map, the cloud providers' own
published AI security catalogues), and lifecycle tooling maps (OWASP's AI Security Solutions
Landscape). A class is included only where at least two independent families name it, **a class
of tooling exists that implements it** — every entry is named for the technology, not the
practice it supports, and activities, policies, artifacts and interface conventions are
excluded — and it differs across at least one surface boundary; the count follows from that
test rather than being targeted. The full method,
including granularity rules and deliberate exclusions, is in the header of
`data/overlay/capabilities.yaml`. Each entry carries a `sources` list, and where a class rests
on market rather than standards evidence its sources say so; the CoSAI mappings are judgements
made here. Product names are deliberately absent: a fork records its own
tooling and posture (`status` per surface) via the Capabilities tab's export flow, and the
shipped dataset never sets `status` — everything reads as `needsAssessment`, because this
repository maps what the taxonomy covers and must never imply a posture anyone holds.
`npm run data` fails on any dangling id, a primary
`category` no mapped control belongs to, or a capability missing a decision for a declared
surface.

## Reference architectures

`data/reference/` is original work: a vocabulary of node and zone types, and 28 application
archetypes drawn as selections over it. An archetype is authored as a graph — zones, nodes,
edges — and never as a picture; `src/lib/architecture-layout.ts` computes the geometry at build
time, so what is reviewed is the claim rather than the drawing.

The archetype set was derived by taking the union of what the published catalogues treat as a
distinct thing to architect — the AWS Well-Architected Generative AI and Agentic AI Lenses,
Microsoft's Azure Architecture Center AI patterns and CAF agent guidance, Google Cloud's agentic
architecture index, OWASP's Agentic Threats and Mitigations reference architectures, and CSA
MAESTRO — and then splitting or merging on one test: two archetypes are separate when their
control sets differ, not when their vendors do. Each entry records that reasoning in
`distinguishedBy`. No published source offers a catalogue of this kind; the closest are worked
scenarios and agent-orchestration patterns, both orthogonal to "here are the classes of AI
application, each with an architecture".

The node vocabulary converges CoSAI's 23 components with OWASP's KC1–KC6 key components, Azure
WAF's layer model and MAESTRO's seven layers. Where a node type has a CoSAI equivalent it carries
a `cosaiComponent` anchor and is coloured by the corresponding risk-map band. The `governance`
group deliberately carries neither: CoSAI's component set names no identity provider, policy
engine, agent registry, approval gate, audit sink or kill switch, and the diagrams show that plane
sitting beside the stack rather than inventing a band for it. The build reports the count of node
types with no CoSAI equivalent so the gap stays visible.

These are **target states** — the architecture as it should be built, not a description of what
deployments typically look like. That distinction drives the whole schema: there is no way to
express an unsecured crossing, because an architecture that needs one is not what this catalogue
describes. Where the common deployment is weaker than the target, the observation lives in the
control's note; the drawn state is the one worth building.

Four editorial rules are enforced by `npm run data` rather than by review:

- **Every edge crossing a zone boundary names the control that secures it**, from a canonical list
  of 29 control kinds in `vocabulary.yaml`, each of which names the capability class that delivers
  it. That link is how the capability taxonomy reaches the architectures: a reader at a boundary
  follows the control to a capability and from there to the tooling. An earlier draft let each
  archetype phrase its own mechanism and 286 crossings produced 226 different phrasings, which was
  unusable and taught nothing transferable.
- **Zone names are canonical**, taken from the zone type rather than authored per archetype, with a
  qualifier only where one archetype has two zones of a type. The same draft produced fourteen
  different names for one network tier and made the diagrams incomparable.
- **A `vendorOpaque` zone may contain only interfaces the provider publishes** — or a node with an
  explicit `published: true` claim and a note saying what is documented. Drawing a vendor's
  internals means inventing them, and the honest statement about a third party is its boundary and
  what crosses it.
- **A capability attached to an archetype must apply on that archetype's surface** per
  `capabilities.yaml`. The two datasets cannot drift into contradiction; where they disagreed
  during authoring, the capability taxonomy won and the archetype was corrected.

Zone ownership is expressed in CoSAI personas rather than as "you" and "the vendor". Which party
"you" are depends on who is reading, and two personas on one zone states shared responsibility more
precisely than a "shared" label would. A zone with no persona is outside the system — CoSAI names
none for an attacker.

Named products appear only in each archetype's `exemplars`, each carrying a source and an `asOf`
date, and are rendered as dated illustration. This is a deliberate departure from the
vendor-neutral discipline of `capabilities.yaml`: a reference architecture is not usable without
knowing what it is a reference to, and this is a domain where names moved fast enough during 2026
that an undated one becomes a wrong claim. The architectures themselves name no products.

`docs/AUDIT.md` section 4 reports the coverage gaps: risks no architecture names, capabilities none
attaches, CoSAI components none draws, and every unauthenticated crossing in the catalogue.
