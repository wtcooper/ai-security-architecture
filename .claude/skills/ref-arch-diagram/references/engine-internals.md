# Engine internals — layout, pin placement, validation

For anyone modifying `engine/`. The design principle throughout: **geometry as data**. The
author writes a grid; the engine computes pixels once, deterministically; every renderer —
the standalone viewer, an embedded React component, a build check — consumes the same
numbers. One implementation of the placement maths, imported by both the validator and the
renderers, so the check can never drift from the drawing.

## Pipeline

```
YAML ──js-yaml──▶ arch object ──validate.mjs──▶ errors? fail with all of them
                                   │
                                   ▼
                            layout.mjs  layoutArchetype(arch)
                                   │    {width, height, blocks:{id:rect}, edges:[{d,midX,midY,horizontal}]}
                                   ▼
                            validate.mjs  checkDiagramCollisions(arch, layout)
                                   │    flows through blocks? pins on blocks? off-canvas?
                                   ▼
                            model.mjs  buildRenderModel(arch)
                                        the fully-resolved render model (below)
```

## Layout constants (`layout.mjs`)

| Constant | Value | Meaning |
| --- | --- | --- |
| `COL_W` | 176 | every non-actor block is one column wide |
| `COL_GAP` / `ROW_GAP` | 64 / 116 | gutters; ROW_GAP is generous so labels and pins have air |
| `MARGIN_TOP` | 68 | room above row 0 for title tabs and risk-tag stacks |
| `TAB_H` | 20 | the title tab straddles the block's top edge by TAB_H/2 |
| `ITEM_H` | 50 | items pack two per row (one per row in `rowSpan` columns) |
| `ACTOR_H` | 66 | actors are 64 px wide, centred in their column |
| `TAG_H` / `TAG_GAP` | 17 / 20 | risk pill height / stack spacing |
| `FRAME_PAD` / `FRAME_HEAD` | 26 / 52 | containment-frame padding; HEAD leaves room for member tabs |

Row heights: each row takes the tallest single-row block in it (`naturalHeight`, driven by
item count); a `rowSpan` block then grows its *last* row if the span still cannot hold it.
Short blocks centre vertically in their row.

## The one-bend router

Deliberately simple — diagrams stay readable because the grid is curated so flows do not
cross, not because the router is clever:

1. **Vertical overlap** between the two rects (> 24 px) → straight horizontal at the
   overlap's midpoint.
2. **Horizontal overlap** → straight vertical.
3. Otherwise a single elbow. Default `hv`: leave the source sideways at its centre-Y, turn
   at the target's centre-X, enter vertically. `route: vh` flips it: leave vertically down
   the source's column, turn at the target's row, enter sideways. The vh entry sits 14 px
   above centre so a vh arrival and an hv departure on one block do not overdraw.
4. Parallel edges between the same pair fan out ±16 px per extra edge.

Every edge yields `{d, midX, midY, horizontal}` — `d` is plain `M x y L x y…` path data,
`midX/midY` is where pins and step numbers anchor, `horizontal` says which way the midpoint
segment runs (it decides pin stacking direction).

## Pin placement (`chipSpots` / `tagSpots`)

- Chips on a **block**: along the bottom border, from the left corner, 24 px apart.
- Chips on an **edge**: centred on the midpoint, spread 24 px apart along the segment's
  direction.
- Tags on a **block**: stacked *above* the title tab with a vertical leader line down to it.
- Tags on a **horizontal edge**: stacked above the midpoint with a leader.
- Tags on a **vertical edge**: right-aligned beside the midpoint with a leader.

Tag width is `code.length * 6.6 + 12`. These functions are the single source of truth: the
validator collision-checks their output, the model bakes their output in, the app's SVG
renderer (in the origin repo) draws from them directly.

## Validation rules (`validate.mjs`)

Graph rules — ids unique; kinds/paths/icons/layers from the fixed vocabularies; titles ≤ 24
chars; grid cells exclusive (rowSpan counts); edge endpoints exist; no self-loops; no
duplicate edges; `route` ∈ {hv, vh}; frame members exist; legend entries complete; pins
resolve to a block or an edge (reverse only when `bidir`); scenario steps follow real edges.

Geometry rules — after layout, re-run the placement maths and fail on: an edge segment
intersecting any non-endpoint block (fix: `route` hint or a different grid cell); a chip or
tag rect intersecting any block other than the one it annotates; a tag stack with y < 2
(off the canvas top — fewer pins there, or move the block down a row).

Error strings always name the fix. Keep that property when adding rules.

## The render model (`model.mjs`)

Everything a renderer needs, fully resolved — no registries, no lookups:

```jsonc
{
  "id": "...", "title": "...", "summary": "...",
  "width": 942, "height": 780,
  "blocks": [ { "id", "kind", "title", "icon", "layer", "note",
                "x", "y", "w", "h",
                "items": [ { "id", "label", "icon", "note",
                             "x", "y", "w", "h" } ] } ],   // item rects RELATIVE to the block
  "edges":  [ { "id": "a->b", "from", "to", "path", "bidir", "label", "note",
                "d", "midX", "midY", "horizontal" } ],
  "frames": [ { "label", "note", "labelPos", "members", "x", "y", "w", "h" } ],
  "blockPins": [ { "kind": "chip"|"tag", "parent": "<blockId>",
                   "x", "y",                                 // RELATIVE to the block
                   "n"?, "code"?, "w"?, "title", "note" } ],
  "edgePins":  [ { "kind", "edge": "a->b",
                   "dx", "dy",                               // offsets from the edge MIDPOINT
                   "n"?, "code"?, "w"?, "title", "note" } ],
  "scenarios": [ { "title", "steps": [ { "follow", "note" } ] } ],
  "legend": { "capabilities": [ { "n", "title", "note" } ],
              "risks":        [ { "code", "title", "note" } ] }
}
```

The two coordinate conventions are load-bearing for interactivity: block pins are relative
to their block so a dragged block carries them for free (React Flow `parentId` children);
edge pins are midpoint offsets so a re-routed arrow carries them by re-basing on the live
midpoint. Any producer that emits this model — this engine from YAML, or an application
exporting its own diagrams — gets the full viewer behaviour for free.
