# Reference-architecture layout review

The bar is a drawing a person would have drawn by hand: tight, aligned, nothing hidden, no
arrow doing something a human would fix by moving a box. This list grows — when a review finds
a new kind of defect, add it here with an id, and move it up to *Build-enforced* once it can be
checked mechanically.

Run a review in three passes:

1. `npm run data` — the build must pass (section A).
2. `npm run layout:audit` — read every line it prints (section B).
3. Look at every drawing at full size (Expand, or a 2× screenshot) against section C, and check
   it still follows its family's blueprint (section D).

## A. Build-enforced (the build fails)

| id | rule |
|----|------|
| A1 | No arrow passes through a block it does not start or end in. |
| A2 | No chip, risk tag or step number lands on a block. |
| A3 | No chip, risk tag or step number overlaps another (step numbers within one walk). |
| A4 | No chip or risk tag sits on, or within 2px of, the line of an arrow other than its own. |
| A5 | No two arrows share a line, and no arrow's start, end or bend lands on another arrow. |
| A6 | Bands never overlap; each band is one contiguous run of columns. |
| A7 | Every pin sits within the span of the bands its arrow connects. |

## B. Audit-reported (`npm run layout:audit`)

| id | signal | what to do |
|----|--------|-----------|
| C1 | Two arrows cross. | Swap the boxes, reorder them in their column, or give one a gutter route. A crossing stays only when every rearrangement costs more (say so in the review). |
| C2 | Two arrows run side by side within 14px for 80px or more. | Spread them: align one straight, or move a target so they part sooner. |
| C3 | An arrow runs within 10px of a block border it does not belong to. | Move the block or the route so the line has clear space. |
| C4 | An arrow runs above every block, along the band titles. | Find it a route inside the bands. |
| C5 | An arrow runs within 10px of a band border (a seam between two bands). | The engine widens a seam that carries a gutter leg; if this fires, the route is not an `hvh` into the next column — move the block. |
| C6 | A chip or tag sits across a band border. | Pins prefer the in-band part of their arrow; an arrow that only hops the seam gets a widened gap. If this fires, move a block so the arrow has an in-band run. |
| C7 | A risk tag sits more than 34px from its own arrow. | The reader cannot tell which line it tags. Give the arrow a longer run, or move the block that crowds it. |
| C8 | An arrow ends on a title tab (it stops at the tab's top). | Only blocks whose tab leaves no border beside it (long titles) do this. Bring the arrow in from a side if the block allows it. Figures have no tab and are not checked. |
| C9 | A risk tag sits nearer another arrow than its own. | It reads as the other arrow's tag. The engine flips a horizontal arrow's tags to the other side; if this fires, give the arrow a clearer run. |
| C10 | A block's chip row is split by an arrow. | The engine keeps a block's chips in one run past the arrows on its border; if this fires the border is too crowded — move the arrow's other end. |

## C. Visual review (judged on the screenshot)

| id | look for |
|----|----------|
| V1 | **Alignment.** Blocks that could share a column don't; blocks that could share a row sit in different rows; a block floats in a row much taller than itself. |
| V2 | **Avoidable crossings.** Two arrows cross, or swap order near where they end, when swapping two boxes or two rows would untangle them. |
| V3 | **Hidden things.** Any number, tag, label, arrowhead or line partly covered — by a pin, a tab, another line or a band edge. |
| V4 | **Arrows inside containers.** An arrow climbing through a container's own items, or across its title tab, to reach a child. |
| V5 | **Detours.** An arrow taking a long way round (over the top, under everything) where a nearby block move would make it short and straight. |
| V6 | **Ends.** Arrowheads that do not meet their block, meet it at a corner, or arrive under a title tab. |
| V7 | **Tags and chips far from their arrow** — a reader cannot tell which line they belong to. |
| V8 | **Dead space.** A band, row or column that is mostly empty and could close up. |
| V9 | **Flow direction.** The main path does not read left to right (users → our side → vendor → external), or reads against its own arrows. |
| V10 | **Family consistency.** A recurring role sits somewhere other than where the family's other drawings put it (section D). |
| V11 | **Readability at page size.** Text that would be too small in the inline frame, or a drawing much taller than wide. |
| V12 | **Nested chips.** A child's chip row and its container's chip row within a chip-height of each other, so it is unclear which box a chip belongs to. |
| V13 | **Split clusters.** A block's chip or tag row straddling an arrow, or an arrow squeezed between two of its chips. |
| V14 | **Touching labels.** Two item labels in one row with no visible gap, so they read as one phrase. |
| V15 | **Cluster order.** Chips or tags in one cluster not in ascending number order. |
| V16 | **Level icons.** Governance call-out icons not on one line; a wrapped chip row should grow the call-out downward. |
| V17 | **Prose matches the drawing.** A zone, edge or deviation note that describes a placement the drawing no longer has ("drawn to the left of…"). |
| V18 | **Frame headroom.** A frame's top child whose risk tags reach the frame's own title or border. |
| V20 | **Levelled rows.** A child inside a frame and the blocks outside it that it faces sit at different heights, so their arrows meet near corners. |
| V21 | **Owner ambiguity.** A block's tag row within ~20px of an untagged arrow on the same border, or an arrow's pin within 8px of another owner's pin. |
| V22 | **Floor clearance.** Chips on the lowest blocks touching the band's floor. |
| V23 | **Orphan wraps.** An item label that leaves "&" or one short word alone on a line, or a third line that runs into the row below; check at inline and expanded zoom. |
| V24 | **One line through a row.** A chain of straight arrows through one block (A → B → C) jogs between the two arrows, or a vertical chain jogs at the middle block. |
| V25 | **Figure ends.** An arrow to a person or origin figure stops short of the icon, or meets it below its middle. |
| V26 | **Through-lines.** An arrow into a block and an unrelated arrow out of its opposite side at the same height read as one path. |
| V27 | **Bunched content.** A block or frame stretched over rows with its content bunched at one end above a blank remainder. |
| V19 | **Content smells** (report, do not fix in layout): the same chip or tag on a block and on an arrow touching it within ~100px; a governance call-out with no chips; a service block with no items. Changing pins needs the tooling evidence check first. |

## D. Family blueprints

Bands always run User | Endpoint | Our cloud | Vendor | External (the training pipeline's
external sources sit on the left, because that is where its material comes from).

- **Cloud agent apps** (chat agent, single-agent workflow, multi-agent workflow, federation):
  three rows. Front door and memory in the first cloud column, the harness spanning rows in the
  second, the AI gateway with tool services and enterprise data beside it, the model provider
  straight off the gateway, open web and package sources stacked in one external column, the
  private package registry on the bottom row under the harness — or beside native tools when the
  harness spans all three rows (chat agent). Accepted crossing: in the action agent and the
  workflow the operator escalation has to pass under the two-row harness, across the
  native-tools → registry line; every rearrangement tried either hits a block or moves the
  crossing onto the package-sources line.
- **Endpoint coding agents** (first- and third-party): identical grids apart from the vendor
  column. Harness spanning two rows with native tools at its foot, memory beneath it, AI gateway
  → tool services → enterprise data along the top cloud row, source control and the private
  registry on the bottom row, external sources stacked in one column.
- **SaaS** (enterprise chat, low-code builder, hosted sessions, managed runtime, persistent
  agents): a 2×2 reach-back block at the foot of our cloud band — tunnel → AI gateway → tool
  services → enterprise data — source control above it, the vendor runtime spanning rows so
  each of our blocks reaches it straight, external sources stacked in one column with no empty
  row, users reaching the vendor along the top row. The managed runtime keeps agent definition
  and source control in the first cloud column, so their arrows cross open cloud space to the
  runtime rather than hopping a seam.
- **Endpoint apps** (local inference, personal agent, agentic browser): model supply reads right
  to left in one row (hub → weights → runtime), as in self-hosted inference; a frame (sandbox,
  browser profile) puts the block its outside arrows reach on the row they arrive on.

## Engine rules that carry these (so a review does not re-raise them)

- Arrows meet a top border beside the title tab, spread over the free border either side; only a
  tab with no room beside it takes the arrow.
- Risk tags on a vertical arrow sit beside it, clear of its chips; a block's tag row starts past
  any arrow leaving its top.
- Band seams widen (+32px) for a gutter leg or a pinned straight hop; a straight hop with two or
  more tags widens its gap so they pair up.
- Two arrows running side by side stagger their pins along their runs.
- A container whose children carry chips keeps a chip row of room beneath them.
- A container spanning rows levels its children with the rows outside it — every inner row
  ("full"), or the first one with the rest rigid ("first") — when that costs at most 72px.
- Arrows to a figure meet its icon; a lone arrow into a top border takes the middle of the free
  border on the side facing its other end; an arrow into a border with chips lands past them.
- A straight hop widens its gap for two or more tags or three or more chips (inside frames too);
  a hop across a seam keeps its pins in the middle of the gap.
- Item rows grow a line for a label that needs a third; a stacked block spreads its items down
  its height; a figure-only column is as wide as a figure and its name.
- Tags on a horizontal arrow flip to the other side when nearer another line; a block's tag
  row keeps 8px from other owners' lines and chips, trying the far end before stepping past a line.

## Routes available

Straight where blocks face each other; `hv` / `vh` one bend; `hvh` down the gap beside the target's
column; `vhv` along the gap beside the target's row; `under` / `over` a loop beneath or above both
blocks. Prefer moving a block to adding a route.
