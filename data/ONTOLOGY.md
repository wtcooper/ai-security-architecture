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

- **Components** are blocks with items; items name things that exist. **A control is never an
  item.** It is a numbered pin where it is enforced, and — where useful — a call-out in the
  security and governance band naming the technology that delivers it. Writing it a third time
  as an item inside the component it governs states the same control in two grammars and is
  what makes a drawing feel arbitrary. This applies to control-surface components too: an AI
  gateway's items name **the traffic classes it brokers** (model proxy, MCP and tool broker,
  skills broker), not the checks it runs (egress allowlist, audit tap, credential broker). The
  build warns on the known control labels listed in `vocabulary.yaml`.
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

## 6. The rules, in one place

Every one of these exists because it failed at least once. They are listed together so a change
to any architecture can be checked against them without reading the whole document.

1. **One name per thing.** Block titles, item labels and band titles come from
   `vocabulary.yaml`. A new name is a registry entry made in the same change, never a local
   choice. *(Failed as: MCP gateway vs AI gateway; Owner surfaces vs Developer surfaces.)*
2. **A dimension states the axis it measures.** Zones measure who operates an environment and
   nothing else. Functional properties belong to components. *(Failed as: "Agent workload" and
   "Enterprise crossing" sitting among locational bands.)*
3. **A control is a pin, not an item, and not a box** unless data flows through it. Inline
   controls are components; embedded controls are pins; management controls are call-outs in
   the security and governance band. *(Failed as: egress allowlist and audit tap drawn as
   gateway items while also pinned.)*
4. **Crossing-ness is a component property.** Any edge entering or leaving a band we operate
   terminates at a component marked `crossing: true`.
5. **Risks pin where they materialize; controls pin where they are enforced.** A governance
   call-out cites a control's number; it does not claim to be the enforcement point.
6. **Either/or edges are banned.** A variant needing a conditional edge is its own
   architecture. *(Failed as: the vendored/OSS coding agent sharing one drawing.)*
7. **The same kind of thing keeps the same name across bands.** Tool services are Tool
   services on the endpoint, in our cloud, at a vendor and on the internet; the band says
   where, the item pack says what. *(Failed as: "Internal MCP & APIs" and "Remote tool
   services".)*
8. **Vendor internals are assured, not drawn.** What a vendor implements inside their
   environment gets `capabilityAiTprm` on the vendor block and nothing else.
9. **A shared pattern is drawn identically everywhere it appears, and a change to it
   propagates in the same commit.** Two architectures of the same family should differ only
   where they genuinely differ; everything else — component names, the order of the chain,
   the positions — matches, so a reader flipping between them sees the differences and
   nothing else. The canonical chain for reaching data is
   `harness -> AI gateway -> Tool services -> Enterprise data`, at every band and in every
   architecture that has one. If you change that shape in one drawing, change it in all of
   them before committing; if you cannot, the drawings have diverged and one of them is
   wrong. *(Failed as: the coding agent reaching Enterprise data straight from the gateway
   while the personal agent went through Tool services, and as an Egress control component
   existing in one drawing and not the other.)*
10. **Every claim is checkable.** An item or block that claims a capability must reference one
   actually pinned; a flow step must follow a real edge; guidance must cite pinned
   capabilities. If a claim cannot be checked by the build, say why in a deviation.

### Families that must stay in step

| Family | Members | May differ in |
| --- | --- | --- |
| Endpoint agents | personal autonomous agent, vendored coding agent, open-source coding agent | The vendor band and its relay; the messaging bridges and unbounded sender set; the heartbeat, scheduling and memory emphasis of an always-on daemon versus a human-triggered session. Nothing else. |

Everything outside that column — the local session path, the tool-services chain, the gateway,
the enterprise data behind it, the governance call-outs, the band set and the positions — is
the same drawing twice, and a difference is a defect in one of them until proven otherwise.

## 7. Authoring checklist (every new or changed architecture)

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
6. **Sibling check** — if the architecture belongs to a family above, open its siblings and
   confirm the shared patterns still match. A change to a shared pattern lands in every member
   in the same commit, never "later".
7. `npm run data` clean; vocabulary warnings triaged; `npm run audit` regenerated; the
   catalogue document and NODE-REVIEW.md updated when structure changed.
