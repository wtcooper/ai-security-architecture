# The authoring schema

One YAML file per diagram. The author writes a *graph* — blocks on a coarse grid, edges
with a path class, pins, walks — never a picture; all geometry is computed. Everything
below is validated by `engine/build.mjs`; invalid input fails with every error listed.

```yaml
id: myDiagram                # required — used for output filenames
title: My system             # required — page/header title
summary: One paragraph.      # optional — shown under the title

blocks:      [...]           # required, see Blocks
edges:       [...]           # required, see Edges
frames:      [...]           # optional, see Frames
riskLegend:  [...]           # required if any risk pins
capabilityLegend: [...]      # required if any capability pins
pins:
  risks:        [...]
  capabilities: [...]
scenarios:   [...]           # optional, see Scenarios
```

## Blocks

```yaml
- id: harness                # unique slug; edges and pins reference it
  kind: service              # actor | service | provider | external | governance
  title: Agent harness       # ≤ 24 chars (the tab is as wide as the block); uppercased tab
  icon: agent                # required for actors; optional otherwise
  col: 1                     # grid column, 0-based, left to right
  row: 1                     # grid row, 0-based, top to bottom
  rowSpan: 3                 # optional — tall side column (e.g. a governance plane);
                             # items then stack one per row instead of two across
  layer: app                 # optional tab colour: app (blue) | model (green) | data (amber)
  note: >                    # optional — the hover card; one or two sentences
    The loop that plans, calls tools and reads results back as context.
  items:                     # optional icon+label internals, packed two per row
    - id: loop
      label: Agent loop      # keep short; wraps to two lines at most
      icon: agent
      note: Optional hover text for the item.
```

### Block kinds — what the border says

| kind | Drawn as | Means |
| --- | --- | --- |
| `actor` | small unboxed icon + label | a person or peer system |
| `service` | solid dark border | a capability block the operator runs |
| `provider` | dashed grey border | vendor-operated; only the published interface is drawn |
| `external` | dashed amber border | data or services outside the system, read or acted on |
| `governance` | dotted border | the management plane |

### Tab colour rules

The title tab colours by `layer` when authored. Two rules apply regardless:
`external` blocks always get the data amber (**the outside is data** — whatever runs behind
the boundary, what crosses back is content the system will read), and blocks with no layer
get a quiet grey — reserved for security/governance machinery (gateways, identity edges,
the governance plane).

### Icon vocabulary (the build rejects anything else)

`person people agent model chat clock folder db key shield plug code globe doc gear phone
search mail scale eye stop`

## Edges

```yaml
- from: harness
  to: gateway
  path: primary              # primary | external | governance
  bidir: true                # optional — arrowheads both ends; also legalises reverse
                             # scenario steps and reverse pin references
  route: vh                  # optional, diagonal connections only: leave the source
                             # horizontally then turn (hv, default) or vertically then
                             # turn (vh). Authored when the default leg would cross a
                             # block — the validator tells you which to set.
  label: model & egress calls  # optional — shown in the hover card title
  note: >                    # optional — the hover card body
    Every call out of the sandbox crosses here on an injected credential.
```

Path classes: `primary` (green — data flow inside the system), `external` (amber — crosses
into content or services nobody in the diagram operates), `governance` (dotted grey — a
management-plane relationship).

Two edges between the same pair of blocks automatically fan out a few pixels so both stay
visible. An edge from a block to itself is rejected.

## Frames — containment drawn as containment

A frame is a labelled dashed boundary *around* member blocks: a sandbox, a vendor
application, a tenant. Never model a boundary as a block; things live *in* boundaries.

```yaml
frames:
  - label: Sandbox           # the frame's tab
    note: >                  # hover card for the frame
      The boundary — its own filesystem and network; the gateway is the only exit.
    members: [harness, tools, memory]
    labelPos: top            # optional: top (default) | bottom — use bottom when edge
                             # pins crowd the frame's top edge
```

The frame rect is computed from the member rects plus padding. In the viewer, dragging the
frame moves everything inside it. Edges from a member to a non-member visibly cross the
boundary — that is the point.

## Legends and pins — the risk/control overlay

Risks and capabilities are declared once in legends, then *pinned* where they live. The
side rail is derived from the pins, so it can never claim what the drawing does not show.

```yaml
riskLegend:
  - id: promptInjection
    code: R01                # short code shown in the tag pill
    title: Prompt injection
    note: Default hover text (a pin's own note overrides it).

capabilityLegend:
  - id: egressControl
    title: Egress allowlisting
    note: Deny by default; every destination named.

pins:
  risks:
    - risk: promptInjection
      at: gateway->downstream   # a block id, or an edge as "from->to"
      note: >                   # optional, overrides the legend note for this spot
        Fetched content re-enters the loop as context.
  capabilities:
    - capability: egressControl
      at: gateway
```

- **Capability chips** are numbered circles. Numbers are assigned by first appearance in
  the pins list — order your pins in the order you want the rail to read.
- **Risk tags** are coded pills (`R01`). On a block they stack above the title tab with a
  leader line; on a horizontal flow they stack above the midpoint; on a vertical flow they
  sit beside it.
- The same risk or capability may be pinned in several places (it keeps one number/code).
- A pin on an edge may reference it in reverse (`b->a`) only if the edge is `bidir`.
- Placement is deterministic and collision-checked: too many pins on one target fails the
  build with the fix named. Spread pins across the blocks and flows they genuinely govern.

## Scenarios — walks over the same canvas

```yaml
scenarios:
  - title: A task becomes an action
    steps:
      - follow: user->harness     # must be a real edge; reverse needs bidir: true
        note: The task is stated.
      - follow: harness->gateway
        note: The model call crosses the boundary.
```

In the viewer, selecting a walk fades everything not on the path, hides the pins, and
lists the numbered steps in the rail. 1–3 walks per diagram; a happy path plus an attack
path is the classic pairing.

## Style guidance that keeps diagrams consistent

If you are drawing many diagrams as a set, standardize the vocabulary: the same role gets
the same block title everywhere (e.g. *Agent harness*, *AI gateway*, *Tool services*,
*Memory & state*, *Downstream services*, *Model provider*, *Governance plane*), and the
same item set for the same surface. Sameness of name is a claim of sameness of role — a
reader flipping between diagrams reads any naming difference as an architectural one.
