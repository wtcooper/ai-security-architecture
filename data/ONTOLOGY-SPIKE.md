# Spike ontology — zones and numbered flows

**Status: research preview.** This is a second grammar, running alongside the main one in
`data/ONTOLOGY.md`, tried on the personal autonomous agent only. Two variants are published
for comparison (`archPersonalAgentZones`, `archPersonalAgentHub`); the intent is to keep one
and retire the other and this document with it, or to promote it over the main grammar.

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
| **Zone** | An ownership band with an `owner` of `user`, `endpoint`, `enterprise` or `external`. Every block declares one. Drawn as a labelled background band, sized from its members. |
| **Flow** | A numbered, named path (`F1`, `F2` …) over real edges, carrying `moves` (what travels), `threats`, and `controls` (capability ids that must also be pinned). Selectable in the rail; the drawing traces it. |

## Rules the build enforces

1. **Zone completeness** — if an architecture declares zones, every block declares one and it
   must exist.
2. **The crossing rule** — no edge may connect an `endpoint`-zone block directly to an
   `external`-zone block. The crossing must terminate in an `enterprise` zone first. This is
   the ONTOLOGY.md §3 zone-3 invariant, promoted from prose to a build failure and made
   visible as geometry.
3. **Flow integrity** — flow ids match `^F\d+$` and are unique; every path step follows a real
   edge (reverse legal on bidirectional edges); every `moves` statement is present; every
   capability a flow claims is pinned on the drawing.

## What stays from the main grammar

Risk codes stay catalogue-stable, capability pins stay surface-validated, blocks keep their
CoSAI anchors, scenario walks, deviations, exemplars and dated sources all behave as before.
A spike architecture is still a normal architecture — it just carries two extra dimensions.

## The one deliberate departure from the source research

Both research streams draw five separate brokers (messaging relay, AI gateway, MCP gateway,
API gateway, egress proxy). This catalogue draws **one bundled AI gateway**, because that is
how the organisation actually operates: a LiteLLM-class tier fronting the model providers,
the MCP servers and the skills/plugin brokerage together. The consolidation is recorded as a
deviation on both variants rather than silently redrawn — an organisation running separate
broker tiers should split the block and keep the flows unchanged.

## What the two variants test

| | `archPersonalAgentZones` (A) | `archPersonalAgentHub` (B) |
| --- | --- | --- |
| Decomposition | Fine — bridges, harness, tools, memory, workspace drawn separately | Coarse — one agent runtime with the loop, bridges and local tools as items |
| Messaging | Relay and platform drawn; unsolicited senders are an actor | Relay bundled into the gateway; unsolicited senders are a risk pin on the device |
| Supply chain | Its own install path from the tool surface to the registry | Routed through the one gateway with everything else |
| Reads as | A zone map — where things live and what crosses | A hub — one door, everything radiating from it |

Choose on which one a reviewer can answer "what crosses this boundary, and what stops it"
faster.
