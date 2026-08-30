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
| **Zone** | An ownership band with one of five standard `owner` values (below). Every block declares one. Drawn as a full-height background column, so a crossing is a horizontal move. |
| **Flow** | A numbered, named path (`F1`, `F2` …) over real edges, carrying `moves` (what travels), `threats`, and `controls` (capability ids that must also be pinned). Selectable in the rail; the drawing traces it. |

## The five standard zones

The `owner` values are fixed catalogue-wide; only the band *titles* change per architecture.
They run left to right as an ownership gradient, and the reason there are five rather than
four is that **our systems and outside systems are different places** — an agent reaching the
organisation's own data is not the same event as an agent reaching the open internet, and the
controls differ.

| Order | `owner` | What belongs in it | Who operates it |
| --- | --- | --- | --- |
| 1 | `principal` | People and the surfaces they instruct from — staff, customers, remote devices, chat surfaces, application front ends | The person, on a device the organisation may or may not manage |
| 2 | `workload` | Where the agent loop actually runs, and the state and local tools it owns | Us on the endpoint and cloud surfaces; **the vendor** on the SaaS surface |
| 3 | `crossing` | The governed brokers and the control plane: AI gateway, MCP gateway, secure edge, relay, identity, secrets, policy, registry, telemetry | Always the organisation |
| 4 | `enterprise` | The organisation's own systems and data — systems of record, internal APIs and MCP servers, tenant data, artifact stores. **What our MCPs and connectors reach in our own environment.** | The organisation |
| 5 | `external` | Outside the company entirely — model providers, third-party SaaS, remote MCP servers, public hubs, the open web, and the unsolicited senders who arrive through them | Nobody in the drawing |

### How the bands map onto each surface

| Surface | `principal` | `workload` | `crossing` | `enterprise` | `external` |
| --- | --- | --- | --- | --- | --- |
| **Endpoint** | Owner or developer, remote device, local terminal | The managed device and its sandbox — harness, local tools, memory, workspace | Relay, AI gateway, secure edge, control plane | Org repos, internal APIs and MCP servers, org data | Model providers, messaging platforms, remote MCP, package registries, the web, senders |
| **Cloud & hosted** | Requesters, initiators, schedules and events, the application front end | The agent tier the organisation runs — supervisor, subagents, memory, sandboxes | AI gateway, tool gateway, governance plane | Systems of record, tenant data, vector stores, model registry | Model providers, third-party APIs, A2A peers, the web |
| **Third-party SaaS** | Employees, citizen builders, agent consumers | **The vendor's runtime** — where the loop runs, operated by someone else | Our secure edge, our MCP gateway, our tenant governance | Org data the vendor's agents reach through our gateway | The vendor's own backend, its model providers, consumer tenants, the web |

The SaaS row is the one that earns the model: putting the vendor runtime in `workload` and
our data in `enterprise` makes the crossing rule say exactly what we want it to say — a
vendor-hosted agent cannot touch our systems except through a component we run.

## Rules the build enforces

1. **Zone completeness** — if an architecture declares zones, every block declares one and it
   must exist.
2. **The crossing rule** — no edge may join a `workload` block directly to an `enterprise` or
   `external` block. Every such path terminates in the `crossing` band first. This is the
   ONTOLOGY.md §3 invariant generalised and promoted from prose to a build failure, and it is
   the rule that does the real work: it refuses to let an author draw a sandbox that reaches
   the internet, or a vendor runtime that reaches our data, without the component that makes
   it governable.
3. **Flow integrity** — flow ids match `^F\d+$` and are unique; every path step follows a real
   edge (reverse legal on bidirectional edges); every `moves` statement is present; every
   capability a flow claims is pinned on the drawing.

Because the rule is a failure rather than a warning, it surfaces missing controls at authoring
time: drawing the vendored coding agent in this grammar immediately exposes that the harness
talks to the vendor's cloud with nothing of the organisation's on the path, and forces the
secure edge into the picture.

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

## Where the grammar is tried

| Architecture | id | What it tests |
| --- | --- | --- |
| Personal agent — zone map | `archPersonalAgentZones` | The endpoint surface: an always-on loop whose every path out is a crossing |
| Coding & desktop agents — zone map | `archCodingAgentZones` | The same grammar against a vendored product, where the workload band is ours but the vendor's cloud is external — and the crossing rule exposes the egress control the main drawing never made explicit |

Both sit alongside their main-grammar originals rather than replacing them, so the two
readings of the same archetype can be compared directly.
