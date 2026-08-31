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
| Container | architecture `blocks:` via `parent` | a `boundary` block, or any block with children; nests without limit |
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
else; functional properties belong to components, and containment belongs to `parent`. State
the axis in the registry, not just the allowed values.

**Naming is a hard standard, not a preference.** Every recurring component, item and zone band
has one name, registered in `vocabulary.yaml`, and the build reports any drawing that invents
another. This rule exists because it has failed twice in practice: the same gateway was drawn
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
- **Boundaries** (sandboxes, shipped applications, tenants) are **containers** — a
  `kind: boundary` block that other blocks name as their `parent` (see §4a). Sandboxing has
  three canonical forms, chosen by criteria: a **boundary container** when it wraps a set of
  components; a **Sandboxed tools item** when it is a contained execution path inside one
  application; a **Managed sandbox block** when it is a provider-operated product you buy.
- **CoSAI (and OWASP KC, and the F5 grammar) are crosswalks, not the source.** Our component
  registry is authoritative; `cosaiComponent` anchors are kept where a mapping exists
  because they buy the risk-map linkage, and their absence is meaningful (the grey blocks).

## 4a. Zones — the ownership bands

**Bands measure one axis: who operates the environment.** They are surfaces — locations and
trust domains — never functions. Two earlier drafts got this wrong: the first let titles vary
per architecture (so the same band was "Owner surfaces" on one drawing and "Developer
surfaces" on another), and the second standardised onto a *functional* name, "Agent workload",
which cannot be a location because an agent workload can run on an endpoint, in our cloud, or
in a vendor's. Naming rules only help if the dimension being named is coherent.

The set below is purely locational, and three of the five are the catalogue's own surface
taxonomy, so a reader meets the same vocabulary at both levels.

| Order | `owner` | Fixed title | What belongs in it | Maps to |
| --- | --- | --- | --- | --- |
| 1 | `user` | **User surfaces** | The person's own devices and channels — phone, chat client, browser, local terminal | — |
| 2 | `endpoint` | **Managed endpoint** | Devices the organisation manages and whatever runs on them | `surfaceEndpoint` |
| 3 | `cloud` | **Enterprise cloud** | Infrastructure the organisation operates — crossings, agent tiers, our own systems and data | `surfaceCloud` |
| 4 | `vendor` | **Vendor platform** | Environments a vendor operates under an agreement we hold | `surfaceSaas` |
| 5 | `external` | **External** | Outside the company with no agreement — public hubs, the open web, unsolicited senders | — |
| — | `governance` | **Security & governance control plane** | The oversight band, drawn full-width *beneath* every other | — |

An architecture draws only the bands it uses: the personal agent has no vendor band, a cloud
workflow has no endpoint band. **Columns must be assigned in band order** — the renderer
derives each band's rect from the `min..max col` of its members, so a column out of band order
makes two bands overlap.

### Bands are locations, not a pipeline

A band says who operates an environment. It does **not** imply an ordering that traffic must
follow. A managed endpoint reaches our cloud, a vendor, or an uncontracted third party
directly; a vendor reaches back into our cloud; two outside parties talk to each other without
touching us at all. Draw the paths that exist.

**The crossing rule was removed on 2026-08-30, and the reason is worth keeping.** It required
every edge in or out of a band we operate to terminate at a component marked `crossing: true`.
The intent was sound — traffic crossing our boundary should meet a control we run. But it
encoded the pipeline assumption above, and because it was a hard build failure, an honest
drawing with no crossing could only be made to build by *inventing a component*. It produced
four fabricated blocks across four architectures, every one of them a control wearing a
component's clothes.

A rule that makes a drawing dishonest in order to satisfy itself is a broken rule. What
replaced it is an observation the build reports and never blocks on: an edge leaving a band we
operate with no inline control pinned at either end. When the rule was removed, that count
across the whole catalogue was **zero** — the drawings were already right, and the rule had
only ever been forcing boxes where pins sufficed.

### What the crossing band is *not*

The rule says every path out of the workload crosses something we operate. It does **not** say
every path is inspected or brokered — the crossing holds controls with three different jobs,
and conflating them produces architectures nobody would build:

| Destination | Job of the crossing | Typical component |
| --- | --- | --- |
| An **approved vendor's own service** under an enterprise agreement | Destination admission. The vendor's endpoints are allowlisted because third-party risk management cleared them; the session is not inspected, and on a pinned TLS session it cannot be. | Firewall / egress allowlist |
| **Arbitrary destinations** — registries, the open web, third-party servers | Admission *and* inspection, because nothing vouches for what comes back | Egress proxy, SSE, CASB |
| **Our own systems and data** | Brokered access: scoped short-lived grants, our keys, our audit | AI gateway / API gateway |

Drawing an inspection point on a sanctioned vendor path asserts a control nobody operates.
What governs that path is the assessment behind the allowlist entry, the tenant binding in
managed settings, and the agreement itself — pinned as vendor assurance and egress control on
the edge, not drawn as a proxy in the middle of it.

### The governance band

Governance is drawn across the full width beneath the others, because it applies to all of
them — including the external band, since whether an external destination is reachable at all
is a governed decision enforced at our crossings.

**Its services are standalone call-outs with no edges.** Identity services, secrets and key
management, policy and authorization, supply-chain assurance, observability and response —
each an icon carrying the **chip numbers of the controls it implements**, so a reader can map
a numbered control to the technology that delivers it without hovering. They are deliberately
unconnected: governance is a set of services *and processes* that apply across every band, not
another hop in the data path, and drawing arrows to them would force a box-and-arrow reading
onto something that is neither.

Two consequences worth stating. A band holding one component that holds the real content is
nesting for its own sake — the services are blocks, not items of a block. And the *controls*
still pin where they are enforced, which is the crossing, not the call-out: the call-out names
the implementing technology and cites the number. There is no "Control plane" component;
management capabilities never become boxes in the data path, which is the rule that stops a
reference architecture becoming a tool inventory.

### Containment nests, to any depth

An earlier draft claimed a containment frame inside a band "reads as a second boundary of the
same kind" and dropped frames entirely. **That was wrong, and it cost the catalogue its most
important control recommendation** — the sandbox around a personal agent became a sentence in a
note. A band answers *who operates this environment*; a container answers *what contains this
process*. Different questions, and a drawing carries both.

Containment is a block property: `parent: <blockId>`. It nests without limit — a sandbox
holding a harness that itself holds a supervisor and its subagents is three levels through one
mechanism. **Nested blocks stay ordinary blocks**, keeping their edges, pins, items and
capability chips, which is the property that makes containment expressible without breaking the
flows.

Two container flavours:
- **`kind: boundary`** — pure containment with no data path of its own. Dashed, a label tab, no
  items. A sandbox, a shipped vendor application, a tenant.
- **A normal block with children** — keeps its border and its own items. An agent harness
  containing a supervisor and its subagents.

One more kind exists for a different job: **`kind: origin`** occupies a grid cell and draws
nothing, so an edge can arrive from a deliberately unnamed source — used where a component is
reached from several surfaces and naming any one of them would be arbitrary.

## 4b. Walks and the sequence view

A static drawing answers "what is connected to what". It cannot answer "in what order, and in
which direction" — and for this catalogue's most-misread path, an instruction typed on a phone
that ends up executing on the user's own laptop by way of a vendor relay, the ordering *is* the
architecture.

So every architecture carries **one walkthrough** — the idealised main use, how the thing is
meant to work — and two or three **scenarios**, the adversarial variants. They are the same
data shape: ordered steps, each following a real edge, each with its own note (a round trip
reuses one edge in both directions and means something different each time, which is why the
note lives on the step rather than the edge).

They are presented as one list — "sequence data flows" — and behave identically. **The resting
drawing carries no step numbers at all.** Selecting any walk numbers its steps onto the arrows
it uses, dims what it does not touch, and opens its sequence diagram beneath the canvas. So a
number appears only because a reader asked for that walk, which is what lets it mean one thing:
the step you are on. The drawing and the sequence are the same walk seen twice, and the numbers
match in both directions.

Nothing in the interface marks the walkthrough as special. It is first in the list because it
is the complete walk; that is the whole of its privilege. A drawing that needed a badge to say
which walk was the important one would be admitting the list was not really one kind of thing.

### What this replaced, and why

There was a second, parallel mechanism. `flows:` named every route the architecture had, each
with its own id, threat list and control list, and each stamping its own badges onto the
canvas. It was introduced for a real reason — the older grammar made components first-class
and paths incidental, so edges were unnamed leftovers nobody had designed — and it did fix
that. What it never should have had is its own reader-facing presentation, because scenario
walks already had one.

The measurements that settled it:

- **Every one of the 171 flow `controls` was already drawn as a capability chip**, because the
  build required each to be pinned. The field could not carry anything new.
- **Scenarios visited no edge that flows did not**, on all thirteen drawings. One was a strict
  subset of the other.
- A reader who had used the catalogue for weeks did not know the sequence view existed, and
  read `F1` as "step one" — which is what ordinal notation means, and which flows could never
  deliver, because they all run at once.

Flow `threats` prose moved into step notes and risk-pin notes. Everything else was deleted.

### The rule that survived

Flows carried one check worth keeping: every drawn edge had to belong to some named route. The
replacement is narrower and truer — **an edge carrying a risk pin must be visited by some
walk.** An ordinary arrow with a note, a chip and a tag is perfectly legible unvisited; an
arrow with a risk tag is not, because the tag says *that* something can go wrong there and
only a walk says how it plays out. The low-code builder's connector path was the case that
proved it: prompt injection pinned on an arrow no story went near.

## 4c. Reuse before you create

The catalogue's measured failure is name sprawl: at the point this rule was written, 66% of
block titles and 75% of item labels were used exactly once, and there was nothing to stop a
fourteenth name for the ninth version of the same idea. Every build now prints a census line so
the number is visible; it should only ever go down.

Before authoring a block or an item:

1. **Search `vocabulary.yaml` first** — `components:`, `itemPacks:` and `patterns:`. If a
   canonical name means what you mean, use it, even if you would have phrased it differently.
2. **Prefer a registered pack to a hand-written item list.** `pack: toolServicesRemote` is a
   promise that this block is identical to the same block on four other drawings; five
   hand-copied items are a promise that they are similar.
3. **Prefer a registered pattern to a hand-drawn chain.** If your drawing has the blocks a
   pattern requires, draw the pattern — the build checks it.
4. **A new name is a registry entry made in the same change**, with a one-line note saying why
   an existing name did not fit. Never a local choice.
5. **Retired names carry their replacement.** The build reports `deprecated:` entries with the
   surviving name, so the message says what to do rather than only what is wrong.

The bar for a new name is not "is this slightly different?" but "would a reader comparing two
drawings be misled by using the existing one?" Location is never a reason for a new name — the
band already says where a thing is (rule 7).

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
4. **Bands are locations, not a pipeline.** A band says who operates an environment; it implies
   no ordering traffic must follow. Draw the paths that exist. *(Failed as: the crossing rule,
   removed 2026-08-30 — see §4a for why, and for what four invented components it cost.)*
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
11. **Zone completeness and naming.** If an architecture declares zones, every block declares
   one and it must exist; every band carries the fixed title for its owner. Omit the title and
   the build fills it in; give it a different one and the build fails. Columns are assigned in
   band order, or two bands draw on top of each other.
12. **A component is a thing somebody runs, not the name of a control.** The test is
   provenance, not wording: an AI gateway is a real tier (LiteLLM-class) and is a component;
   "Egress control" is the name of a capability in our own catalogue and belongs as a pin. If
   you cannot name the product class that sits there, it is not a component. *(Failed as: four
   Egress control blocks invented across four architectures to satisfy the crossing rule this
   rule replaced.)*
13. **Flow integrity.** Flow ids match `^F\d+$` and are unique; every path step follows a real
   edge (reverse legal on bidirectional edges); every `moves` statement is present; every
   capability a flow claims is pinned on the drawing.

### Families that must stay in step

| Family | Members | May differ in |
| --- | --- | --- |
| Endpoint agents | personal autonomous agent, first-party coding agent, third-party coding agent | The vendor band and its relay; the messaging bridges and unbounded sender set; the heartbeat, scheduling and memory emphasis of an always-on daemon versus a human-triggered session. Nothing else. |
| Cloud agents | single agent workflow, chat agent with tools, durable multi-agent workflow | The trigger (human, schedule, or supervisor); the durability layer and subagent fan-out. The gateway, the tool chain, the enterprise data behind it and the governance band are the same drawing three times. |
| SaaS agents | enterprise AI chat, low-code agent builder, managed agent runtime | What the vendor operates inside the vendor band, and who governs the tenant. The crossing into our systems and the three-zone treatment of vendor internals are identical. |

Everything outside that column — the local session path, the tool-services chain, the gateway,
the enterprise data behind it, the governance call-outs, the band set and the positions — is
the same drawing twice, and a difference is a defect in one of them until proven otherwise.

## 7. Authoring checklist (every new or changed architecture)

0. **Reuse before you create (§4c).** Search `vocabulary.yaml` — `components:`, `itemPacks:`,
   `patterns:` — before writing a single block. Reference a pack rather than copying its items;
   draw a registered pattern rather than re-deriving its chain. The census line in
   `npm run data` should go down, never up.
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
