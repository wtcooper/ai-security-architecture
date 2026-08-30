# Ontology for the reference-architecture catalogue

This document is the authority on what the reference architectures are made of and how each
kind of thing is represented. `data/reference/vocabulary.yaml` is its machine half: the
canonical component registry, icon semantics, and capability enforcement classification the
build checks against. `data/PROVENANCE.md` records where content comes from; this document
records what content is allowed to look like. When the two disagree, this one wins.

## 1. Entities

| Entity | Where it lives | Identity |
| --- | --- | --- |
| Surface | capabilities.yaml | `surfaceEndpoint` / `surfaceCloud` / `surfaceSaas` |
| Architecture | data/reference/architectures/*.yaml | `arch[A-Z]…`, ranked within a surface |
| Component (block) | architecture `blocks:` | canonical title from vocabulary, or a recorded custom |
| Subcomponent (item) | block `items:` | canonical label+icon from vocabulary where the concept recurs |
| Flow (edge) | architecture `edges:` | `from->to`, one of three path classes |
| Boundary (frame) | rf-config.ts | containment only — never a block |
| Capability (control) | data/overlay/capabilities.yaml | 56 catalogue-wide, stable ids; per-diagram chip numbers |
| Risk | data/overlay/*.yaml | catalogue-stable `R##` codes |
| Scenario walk | architecture `scenarios:` | steps follow real edges |
| Guidance document | data/reference/guidance/*.yaml | one per architecture; `mode: build | use | hybrid` |

Components are the things data flows between. Some controls ARE components — a WAF, a
gateway, a curation stage — and some controls are properties of components or flows. The
enforcement classification below decides which, once, catalogue-wide.

**A dimension states the axis it measures.** Naming rules only help if the concept being
named is coherent: a set of bands that mixes "where it runs" with "what it does" produces
consistent names for a confused idea. Zones measure who operates an environment, and nothing
else; functional properties (is this a crossing?) belong to components. State the axis in the
registry, not just the allowed values.

**Naming is a hard standard, not a preference.** Every recurring component, item and zone band
has one name, registered in `vocabulary.yaml`, and the build reports any drawing that invents
another. This rule exists because it has failed twice in practice: the same crossing was drawn
as both "MCP gateway" and "AI gateway", and the same ownership band as both "Managed endpoint"
and "Vendor application on the endpoint". A reader comparing two architectures cannot tell
whether differently-named things are different things — so a new name is a deliberate act that
adds a registry entry, never a local choice. Architecture-specific meaning belongs in notes.

## 2. The enforcement classification

Every capability carries `enforcement` in vocabulary.yaml:

- **inline** — enforced by a separately operated service that data flows THROUGH. An inline
  capability pinned on an architecture requires its embodying component (a block, or an item
  on a standard control block) to exist in that drawing, and the chip pins onto it.
  *Absorption* is permitted (option B): a simple diagram may let a functional block absorb the
  duty — the chip pins to the absorbing block and a `deviations:` entry records the
  absorption. The build counts unrecorded absorptions as warnings.
- **embedded** — enforced inside a functional component or on a flow (input validation,
  tenant checks, memory scoping, output bounding, permission gates). Pin only — on the edge
  or block where enforcement happens. Never drawn as a block.
- **management** — off the data path (audit, registry and admission, evaluation of change,
  kill switch, policy authoring, assurance). Governance-plane item plus chip pinned to the
  plane or its dotted edges.

The same capability may legitimately sit at a different locus in one architecture when the
data path differs — the canonical example is evaluation: a block in the training pipeline
(candidates flow through the gate) and a governance item in the agent architectures (it
gates change, not data). Such departures are recorded in `deviations:`, which is the single
mechanism for every rule in this document.

Two placement principles, verbatim:
- **Risks pin where they materialize; controls pin where they are enforced.**
- **Either/or edges are banned.** A variant that needs a conditional edge is a separate
  architecture.

## 3. The three-zone responsibility rule (build vs buy, by mode)

The architecture's guidance `mode` is a first-class property of the architecture. For
`use`-mode (and the vendor half of `hybrid`) architectures, every control falls in exactly
one zone:

- **Zone 1 — vendor-internal.** What the vendor implements inside their environment. Never
  drawn, never pinned — not even as chips. The single permitted representation is
  `capabilityAiTprm` on the vendor block: assure it, don't draw it.
- **Zone 2 — customer-configurable vendor surface.** Tenant policy, admin toggles,
  retention, BYOK/CMEK (`capabilityEncryptionKeyManagement`). Pinned on the vendor block or
  the governance→vendor configuration edge.
- **Zone 3 — boundary crossings between their environment and ours.** Full control
  treatment, including the inline rule — because the components there are customer-owned.
  Ownership, not architecture mode, is what activates the inline rule.

**The zone-3 invariant:** any flow from a vendor or provider environment into customer
systems must pass through a customer-owned inline component — the AI gateway (see
vocabulary) being the canonical one. An edge from a vendor block into customer data with no
customer-owned component on it is an audit finding.

## 4. Representation rules

- **Components** are blocks with items; items name things that exist. Control or policy
  statements are not items — the pinned chip is the statement. Exception: blocks whose role
  IS a control surface (AI gateway, Service edge, egress control, governance plane, OS permission layer, output validation stage, tool broker) — their items describe
  function.
- **Controls** are numbered capability chips: the number is per-diagram (position in the
  architecture's derived capability list); the catalogue-stable code (C-number, the
  capability's position in capabilities.yaml) appears in the legend and hover so a reader
  can relate controls across architectures the way `R##` codes already relate risks.
- **Risks** are coded tags pinned to the block or flow where the risk materializes;
  architecture-level lists are derived from pins, never authored.
- **Flows** use three path classes: `primary` (owned data path), `external` (crossing a
  trust or ownership boundary, or carrying untrusted content), `governance` (dotted policy
  and configuration relationships). Labels appear only where the flow's nature is not
  obvious from its endpoints.
- **Boundaries** (sandboxes, shipped applications, tenants) are frames, never blocks.
  Sandboxing has exactly three canonical forms, chosen by criteria: a **frame** when the
  boundary wraps the whole system under discussion; a **Sandboxed tools item** when it is a
  contained execution path inside an application; a **Managed sandbox block** when it is a
  provider-operated product the customer buys.
- **CoSAI (and OWASP KC, and the F5 grammar) are crosswalks, not the source.** Our component
  registry is authoritative; `cosaiComponent` anchors are kept where a mapping exists
  because they buy the risk-map linkage, and their absence is meaningful (the grey blocks).

## 5. Layout conventions

Actors in column 0 (or on the user's path); Remote device on the user's path; governance
plane rightmost; model provider top-right; Downstream services directly beneath Tool
services on a vertical external edge; Memory & state adjacent to the harness; customer
crossings (egress control and AI gateway) between the workload column and what they govern.
These are conventions checked in review, not by the build — the build checks collisions.

## 6. Authoring checklist (every new or changed architecture)

1. Block titles, item labels and zone bands from vocabulary.yaml — the build warns on an
   unregistered component name and fails on a non-standard zone title. A genuinely new
   component is registered in the vocabulary in the same change, never named locally.
2. Inline capabilities embodied or their absorption recorded; zone rules respected for the
   architecture's mode.
3. Risks pinned where they materialize; standard pin patterns applied (untrusted-content
   ingress → R23 + injection defense; downstream write → HITL and/or egress control;
   credential crossing → secrets management; memory → R23 + memory protection;
   supply-chain ingress → R07 + scanning or pinning; governance plane → audit + kill).
4. At least two scenario walks — one happy path, one adversarial.
5. Sources dated; guidance document created or updated in the same change, mode declared.
6. `npm run data` clean; vocabulary warnings triaged; `npm run audit` regenerated; the
   catalogue document and NODE-REVIEW.md updated when structure changed.
