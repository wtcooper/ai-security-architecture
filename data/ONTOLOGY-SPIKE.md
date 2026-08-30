# Spike ontology — zones and numbered flows

**Status: research preview.** This is a second grammar, running alongside the main one in
`data/ONTOLOGY.md`, tried on two archetypes so far (`archPersonalAgentZones`,
`archCodingAgentZones`). Both sit beside their main-grammar originals so the readings can be
compared. The intent is to retire it and this document, or to promote it over the main grammar
and retrofit the rest of the catalogue.

## Why a second grammar

The main grammar makes components first-class and flows incidental: an edge is an unnamed
connector with a note, so nobody designs the flows — they emerge as leftovers between blocks.
It also states its ownership rule (ONTOLOGY.md §3) in prose without drawing it. Independent
research on this archetype organises the same material the other way round: numbered data
flows carry the identity, and ownership zones are the geometry. This spike tests that
inversion.

## Entities added

| Entity | Rule |
| --- | --- |
| **Zone** | An ownership band with one of five standard `owner` values (below). Every block declares one. Drawn as a full-height background column, so a crossing is a horizontal move. |
| **Flow** | A numbered, named path (`F1`, `F2` …) over real edges, carrying `moves` (what travels), `threats`, and `controls` (capability ids that must also be pinned). Selectable in the rail; the drawing traces it, and a **sequence view** renders beneath the canvas. A step may be a bare edge ref or an edge ref with its own note — a round trip reuses one edge in both directions and means something different each time. |

## The standard zones

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
| — | `governance` | **Governance** | The oversight column, drawn full-width *beneath* every band | — |

An architecture draws only the bands it uses: the personal agent has no vendor band, a cloud
workflow has no endpoint band.

### Crossing is a component property, not a band

An earlier draft made "Enterprise crossing" its own band, which put a functional concept in a
row of locational ones. A gateway is a thing that lives somewhere — in our cloud, next to the
systems it protects. So the vocabulary marks components `crossing: true` (AI gateway, egress
control, service edge, messaging relay, application front end, a vendor's managed tool
gateway), and the rule is about components meeting bands rather than about a band existing.

This is also more precise. `harness -> orgData` now fails even though both could sit in
adjacent bands, because orgData is not a crossing — the path has to run
`harness -> aiGateway -> orgData`.

### The governance band

Governance is drawn as a band across the full width beneath the others, because it applies to
all of them — including the external band, since whether an external destination is reachable
at all is a governed decision enforced at our crossings.

**Its services are standalone call-outs with no edges.** Identity services, secrets and key
management, policy and authorization, supply-chain assurance, observability and response —
each an icon carrying the **chip numbers of the controls it implements**, so a reader can map
a numbered control on the drawing to the technology that delivers it without hovering. They
are deliberately unconnected: governance is a set of services *and processes* that apply
across every band, not another hop in the data path, and drawing arrows to them would force a
box-and-arrow reading onto something that is neither. A sequence view still passes through
these technologies where a real traversal does; the reference architecture does not need to
draw them all.

Two consequences worth stating. A band holding one component that holds the real content is
nesting for its own sake — the services are blocks, not items of a block. And the *controls*
still pin where they are enforced, which is the crossing, not the call-out: the call-out
names the implementing technology and cites the number, it does not claim the enforcement
point. There is no "Control plane" component; management capabilities never become boxes in
the data path, which is the rule that stops a reference architecture becoming a tool
inventory.

## Rules the build enforces

1. **Zone completeness and naming** — if an architecture declares zones, every block declares
   one and it must exist; and every band carries the fixed title for its owner. Omit the title
   and the build fills it in; give it a different one and the build fails.
2. **The crossing rule** — any edge entering or leaving a band *we* operate (`endpoint`,
   `cloud`) must terminate at a component the vocabulary marks `crossing: true`. Exempt: a
   person using their own managed device, anything wholly outside us (a vendor calling its own
   model provider), and the governance band, whose relationships are oversight rather than
   data.
3. **Flow integrity** — flow ids match `^F\d+$` and are unique; every path step follows a real
   edge (reverse legal on bidirectional edges); every `moves` statement is present; every
   capability a flow claims is pinned on the drawing.

### What the crossing band is *not*

The rule says every path out of the workload crosses something we operate. It does **not** say
every path is inspected or brokered — the crossing band holds controls with three different
jobs, and conflating them produces architectures nobody would build:

| Destination | Job of the crossing | Typical component |
| --- | --- | --- |
| An **approved vendor's own service** under an enterprise agreement | Destination admission. The vendor's endpoints are allowlisted because third-party risk management cleared them; the session is not inspected, and on a pinned TLS session it cannot be. | Firewall / egress allowlist |
| **Arbitrary destinations** — registries, the open web, third-party servers | Admission *and* inspection, because nothing vouches for what comes back | Egress proxy, SSE, CASB |
| **Our own systems and data** | Brokered access: scoped short-lived grants, our keys, our audit | AI gateway / API gateway |

Drawing an inspection point on a sanctioned vendor path asserts a control nobody operates.
What governs that path is the assessment behind the allowlist entry, the tenant binding in
managed settings, and the agreement itself — pinned as vendor assurance and egress control on
the edge, not drawn as a proxy in the middle of it.

## The sequence view

A static drawing answers "what is connected to what". It cannot answer "in what order, and in
which direction" — and for this catalogue's most-misread path, an instruction typed on a phone
that ends up executing on the user's own laptop by way of a vendor relay, the ordering *is* the
architecture. So a selected flow also renders as lifelines and numbered messages beneath the
canvas. The pair is the explanation: the drawing places the components and the boundaries, the
sequence shows the traversal, including the same crossing being used four times in four
directions.

This is also the answer to arrow density. A drawing whose every path is legible at rest is a
drawing with very few paths; the resting state shows the topology, and reading any particular
story is a click.

## What stays from the main grammar

Risk codes stay catalogue-stable, capability pins stay surface-validated, blocks keep their
CoSAI anchors, scenario walks, deviations, exemplars and dated sources all behave as before.
A spike architecture is still a normal architecture — it just carries two extra dimensions.

## The one deliberate departure from the source research

Both research streams draw five separate brokers (messaging relay, AI gateway, AI gateway,
API gateway, egress proxy). This catalogue draws **one bundled AI gateway**, because that is
how the organisation actually operates: a LiteLLM-class tier fronting the model providers,
the MCP servers and the skills/plugin brokerage together. The consolidation is recorded as a
deviation on both variants rather than silently redrawn — an organisation running separate
broker tiers should split the block and keep the flows unchanged.

## Where the grammar is tried

| Architecture | id | What it tests |
| --- | --- | --- |
| Personal agent — zone map | `archPersonalAgentZones` | The endpoint surface: an always-on loop whose every path out is a crossing |
| Coding & desktop agents — zone map | `archCodingAgentZones` | The same grammar against a vendored product, where the workload band is ours but the vendor's cloud is external — and the three crossing jobs are visible on one page: an approved vendor admitted by allowlist, the open internet admitted and inspected, our own systems brokered |

Both sit alongside their main-grammar originals rather than replacing them, so the two
readings of the same archetype can be compared directly.
