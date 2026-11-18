# The pattern file

One file per pattern: `data/reference/architectures/<surface>-<slug>.yaml`. The file name
(without `.yaml`) is the page address, `/patterns/<surface>-<slug>/`. Open the nearest sibling
beside this page; a real file teaches the voice better than a schema does.

Contents: [header](#header) · [zones](#zones-the-trust-boundaries) · [blocks](#blocks-the-boxes) ·
[edges](#edges-the-flows) · [pins](#pins-risks-and-controls) · [walks](#walks) ·
[deviations and sources](#deviations-and-sources) · [the finder entry](#the-finder-entry) ·
[the guidance file](#the-guidance-file) · [platform mappings](#platform-mappings) · [wording](#wording)

## Header

```yaml
id: archShortName            # ^arch[A-Z]; never changes once published
surface: surfaceCloud        # surfaceEndpoint | surfaceSaas | surfaceCloud
rank: 9                      # display order within its surface; next free number
title: Reader-facing title
abbrev: Short title          # for tight spaces
summary:                     # one paragraph: what it is. Shown in the page header.
  - >
    …
description:                 # "How it works": three to five paragraphs
  - >
    …
distinguishedBy:             # one paragraph per neighbour: "Against the <pattern>: …"
  - >
    …
exemplars:                   # real products of this kind
  - name: Product name
    note: >
      What it is and which part of the drawing it illustrates.
    url: https://…           # the vendor's own page, read before citing
    asOf: "2026-11"          # the month you read it. Required.
    fills: harness           # hosted patterns only, and required there: the box it is an example of
```

On a hosted pattern an example is an example of one box (a framework for the agent, a server
for the inference runtime, an isolation technology for the sandbox), never of where the pattern
runs: that is a platform under `data/clouds/`. On endpoint and SaaS patterns an example is a
whole product and has no `fills`.

`distinguishedBy` is where the case for the pattern is made. If you cannot write it, the
pattern is probably a product of its neighbour.

## Zones: the trust boundaries

A zone says who operates what is inside it, and nothing else. Titles are fixed by owner; leave
`title` out and the build fills it in.

```yaml
zones:
  - id: zoneUser
    owner: user              # people; drawn at the left, outside every boundary
    note: >
      Who they are on this pattern.
  - id: zoneEndpoint
    owner: endpoint          # Managed endpoint: a device the organisation manages
    gloss: "developer's machine"     # a few words on what the zone is here; at most 40 characters
    note: >
      …
  - id: zoneCloud
    owner: cloud             # Enterprise cloud: infrastructure the organisation operates
  - id: zoneVendor
    owner: vendor            # Vendor platform: run by a vendor under an agreement the organisation holds
  - id: zoneExternal
    owner: external          # External: the open web and public sources; no agreement
  - id: zoneGovernance
    owner: governance        # Security & governance control plane, drawn beneath everything
```

- Every block names a zone. A zone that holds a block needs a `gloss` (endpoint, cloud,
  vendor). Keep it short: a zone holding one box has room for about 20 characters.
- A service the organisation connects to under contract is `vendor`, not `external`. The build
  rejects a contracted service in the external band, a two-way flow with the external band,
  and a flow that starts there: draw it outbound from our side.
- SaaS patterns are browser-based: the person's browser and the vendor's service, no endpoint
  application (ONTOLOGY rule 14).

## Blocks: the boxes

```yaml
blocks:
  - id: gateway              # short camelCase; used by flows, pins, walks and incident paths
    kind: service            # actor | service | provider | external | governance | boundary | origin
    title: AI gateway        # from vocabulary.yaml; at most 24 characters
    summary: "model proxy · MCP & API gateway · skills catalogue"
    icon: shield             # actors need one; items always do. Names: src/lib/icon-names.ts
    zone: zoneCloud
    col: 3                   # the grid cell; see layout.md
    row: 1
    rowSpan: 2               # optional
    cell: { col: 2, row: 3 } # optional: a different cell on the drawing, to fold a wide zone
    parent: sandbox          # optional: drawn inside that block (which is then a container)
    cosaiComponent: componentAgentOrchestration   # optional anchor to the CoSAI component it is
    pack: aiGatewayTraffic   # optional: a registered item list from vocabulary.yaml, instead of items
    note: >
      What it is and why it matters on this pattern.
    items:                   # what the box holds; listed under How it works and in the hover card
      - id: modelProxy
        label: Model proxy
        icon: model
        note: One line on this item here.
```

Kinds:

| Kind | Use for |
| --- | --- |
| `actor` | A person or outside caller. Drawn outside every boundary whatever zone it names. |
| `service` | Something the organisation runs: an application, a gateway, a store. |
| `provider` | Something a vendor runs, drawn as one opaque box. Its internals are assured, not drawn. |
| `external` | Data or a service that is reached, not run: a store, a registry, the open web. |
| `governance` | A control-plane box. Lists the controls it owns in `mitigations:`. |
| `boundary` | Pure containment (a sandbox, a tenant). Other blocks name it as `parent`. |
| `origin` | An anonymous starting point for a flow that begins outside the drawing. |

- **`summary`** is the one line under the title on the drawing: what the box holds or does on
  this pattern, in the reader's words. Lower case, no full stop, " · " between parallel items,
  at most 78 characters, and it must show uncut. A box shows about three lines of 25
  characters; a container's heading two lines of about 33. It does not repeat the title and
  does not list every item.
- **Control-plane boxes** are the five registered ones (Identity services, Secrets & key
  management, Policy & authorization, Supply-chain assurance, Observability & response). Each
  lists in `mitigations:` the controls it owns *that this pattern pins*. Which control belongs
  to which box is fixed by `governanceGroups` in `vocabulary.yaml`. Draw a box only if it owns
  a control here, or say in `deviations` why it is drawn empty.
- Two blocks cannot share a grid cell, and a block's id cannot be reused.

## Edges: the flows

```yaml
edges:
  - from: harness
    to: gateway
    path: primary            # primary = data path; external = outside content and actions (dashed)
    bidir: true              # traffic returns along it. Or:
    outbound: true           # only `from` opens it; the reply comes back. Not both.
    label: "inference, MCP & skills"    # every flow needs one; reuse registered labels
    crossing:                # required when the two ends are in different zones
      kind: brokered         # brokered | vendor | person | direct
      via: "AI gateway: vaulted key, allowlisted provider"
    note: >
      What moves, and what is true of it in the target state.
```

`crossing.kind`:

| Kind | Means | `via` reads like |
| --- | --- | --- |
| `brokered` | Through a control point the organisation runs | "AI gateway: vaulted key, allowlisted provider" |
| `vendor` | Governed by the vendor; assured, not inspected | "The vendor's own call: assured, not inspected" |
| `person` | The only thing in the path is the person present | "The person at the device: approves what matters" |
| `direct` | Nothing of ours in the path | "Nothing between: the endpoint egress allowlist only" |

The `via` line must agree with the controls pinned on the flow and its ends. A crossing on a
flow that stays inside one zone is an error. The build warns when a flow leaves one band for
another with no inline control pinned at either end; that warning is usually right.

`route` hints from older files are ignored by the drawing; do not add them.

## Pins: risks and controls

```yaml
pins:
  risks:
    - risk: riskPromptInjection      # an id from the risk catalogue
      at: gateway->partner           # a block id, or a flow as from->to
      note: >
        How this risk shows up at this place on this pattern.
  mitigations:
    - mitigation: cap-input-guardrails   # an id from the control catalogue
      at: gateway
      do: "Screen tool results and fetched documents at the AI gateway for hidden instructions before they reach the agent."
      why: "Content from outside can carry instructions that steer the agent."
      note: >-
        The precise version, for an architect: what the control does at this spot on this
        pattern and what it does not cover.
```

- `do` and `why` are required on every control pin: one plain sentence starting with a verb,
  then what goes wrong without it (at most 260 and 220 characters, no dashes, no security
  shorthand). They lead the control's row on Enable and its chip's hover; see the standard's
  rule C11. The tests reject an instruction that opens on a noun or uses a listed jargon word.
- The pattern's control list, and the chip numbers, come from the order of first appearance
  in `pins.mitigations`. **Append; never reorder.**
- A control must apply on this pattern's surface (the catalogue says which). The build fails
  otherwise.
- A control may be pinned in more than one place; it keeps one number.
- Some controls are *inline*: they need a component that embodies them (an AI gateway, Native
  tools, a Sandbox, a Browser). If the pattern pins one with no such component, record in
  `deviations` where it is absorbed, naming the control's id.
- A risk pinned on a flow must be visited by at least one walk.
- At least one risk and one control are required; a real pattern has six to fifteen risks and
  eleven to twenty-three controls.
- Standard pairings (ONTOLOGY §7): untrusted content coming in → injection risk plus input
  guardrails; a write downstream → human approval and/or egress control; a credential
  crossing → secrets management; memory → injection risk plus memory protection;
  supply-chain intake → scanning or pinning; the control plane → audit plus a kill switch.

List the catalogue with `npm run data` and browse `/controls/`, or read
`data/overlay/mitigations.yaml`, `data/overlay/specializations.yaml` and
`data/overlay/enablement.yaml` (which shows the NIST CSF category each control sits in, and the
fourteen every AI deployment needs).

## Walks

```yaml
walkthrough:                 # the complete, idealised main use. Required.
  title: A developer asks for a change
  moves: >-
    One line: what moves through the pattern, from where to where.
  steps:
    - follow: developer->harness     # a real flow; the reverse only if bidir or outbound
      label: task at the machine     # 1–44 characters
      note: What happens at this step.
scenarios:                   # at least two more; one of them adversarial
  - title: An injected page steers the agent
    steps: [ … ]
```

A step may not loop back on itself, and a walk with no steps is an error.

## Deviations and sources

```yaml
deviations:                  # where this drawing departs from the catalogue's rules, and why
  - subject: The identity provider is not drawn
    reason: >
      …
sources:                     # what the pattern's claims rest on. At least one.
  - title: "Publisher — page title"
    url: https://…
```

Deviations are shown to readers under How it works. Use them for every rule you knowingly
bend and every open question the audit lists that you decide to leave.

## The finder entry

`data/overlay/patterns.yaml`, keyed by the pattern's id. Required.

```yaml
  archShortName:
    useWhen: You are … .                # one sentence, the reader's situation, ends with a full stop
    keywords: [words, a reader, might type, that the pattern's text lacks]
```

The pattern must be found by its own title and by the everyday words for it; check on the home
page.

## The guidance file

`data/reference/guidance/<surface>-<slug>.yaml`. Required; it is shown under How it works as
"How to govern this pattern".

```yaml
archetype: archShortName
mode: build                  # build | use | hybrid
status: draft                # draft | reviewed
attribution: >-
  Authored in this repository. …
overview:
  - >-
    Two short paragraphs: what governing this pattern is really about.
items:                       # at least four
  - title: Hold the crossing's keys, and scope what the product may reach
    mitigations: [D3-CH, D3-CTS]     # each must be pinned on the pattern
    body:
      - >-
        What to do and why, in a paragraph.
sources:
  - title: "…"
    url: https://…
```

Item titles are actions a team can take. Guidance cannot recommend a control the drawing does
not show; if it needs to, the fix is a pin.

## Platform mappings

For a hosted pattern (`surfaceCloud`), each file under `data/clouds/` (`aws.yaml`, `azure.yaml`,
`gcp.yaml`, and `onprem.yaml` for the organisation's own data centre) carries one entry under
`implementations:`. Open an existing entry beside this; the build names anything missing.

```yaml
  - architecture: archShortName
    asOf: "2026-11"                 # the month the mapping was written
    verified: "2026-11-18"          # the day it was last checked against the vendor's pages
    reference:                      # the vendor's own reference architecture for this kind of build
      - { title: "The page's own title", url: https://… }
    summary:
      - One paragraph: what runs where and what makes it safe.
    bindings:                       # one per box that is not an actor or a control-plane box
      - { block: gateway, service: "The service that plays it", note: "What a builder must know." }
      - { block: harness, service: "Your agent on <the platform's runtime>", builtWith: "<framework>" }
        # builtWith: the framework or server the platform's own guides build that box with. Never
        # put it in brackets after the service: the platform says where the box runs, and what it
        # is built with is the builder's choice. Quote a service or note that contains a comma.
      - { block: tools, service: "Your tool servers", build: true }     # nothing managed fills it
    sources:                        # block id -> the vendor page that service was checked on
      gateway: https://…
    differences:                    # where this platform does not follow the drawing
      - at: harness->gateway        # a flow or a block of the pattern; the drawing marks it ≠
        text: "Plain words: what happens here instead, and what the builder does about it."
        url: https://…              # the page that shows it
    alsoNeeded:                     # services that are not boxes on the drawing
      - { service: "…", role: network, why: "…", url: https://… }
        # role: identity | network | ingress | keys | secrets | registry | logging | other
    quickstart:                     # the vendor's own starting point
      - { title: "…", url: https://… }
    settings: [settingIdOne, settingIdTwo]   # rows of the file's settings library
```

- Every pinned control needs at least one listed setting whose `mitigations` names it; where no
  product setting provides the control, the row is `setVia: [code]` and says what to build.
- Test each flow against the vendor's documentation before you accept the drawing for that
  platform: is the gateway really in the path, or does the default call direct; is search a
  feature of the model platform; does the sandbox have a network. What does not hold is a
  `differences` entry, not a quiet omission.
- A setting row that is really a framework's or a server's own (a tool-approval hook in an agent
  SDK, a flag of the inference server) carries `builtWith: <its name>`, so the page says it
  applies if the box is built with that.
- A setting row may carry a `check` (`command`, `expect`, `url`): one read-only command from the
  vendor's command reference. Never a command that creates or changes anything.
- An on-premises entry names software the organisation runs, says under `requires` when a
  feature needs a paid edition, and lists under `alsoNeeded` what a cloud provider would
  otherwise have run.

## Wording

- The reader's words are **pattern**, **control**, **setting** and **risk**. The tests fail on
  "archetype" in a pattern's prose.
- Describe the target state, and say plainly where the common install falls short of it.
- Do not assert a technique where a property will do. A sandbox, for example, is defined by
  what it does (enforced from outside, deny by default), not by how it is built.
- Named products appear only in `exemplars` and in sources. The drawing itself is
  vendor-neutral.
- British spelling, plain sentences, no claims a source does not support.
