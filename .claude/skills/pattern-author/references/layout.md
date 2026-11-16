# How the drawing is laid out, and how to fix an audit finding

The drawing is computed by `src/components/drawing/layout.ts` from the pattern's own data.
No pattern has coordinates. You control the result with a few fields: each block's zone,
`col`, `row`, `rowSpan`, `parent` and (rarely) `cell`; and the length of titles, one-liners,
glosses and flow labels.

## What goes where

```
 people ─── [ endpoint ] [ cloud ] [ vendor ]      boundaries, side by side
                 │            │
            [        external band        ]         beneath: each party under what reaches it
            [   security & governance     ]         beneath everything
```

- **People** (`kind: actor`, `origin`, or anything in the user zone) stand at the left, outside
  every boundary, in the rows you give them.
- **Endpoint, cloud and vendor** are boundaries drawn side by side, in the order their columns
  appear. Each hugs the boxes it holds. Which one leads depends on the surface: the endpoint
  for a tool on a device, the cloud for an application you build, the vendor for a service
  you subscribe to.
- **External** boxes sit in a band beneath the boundaries, each placed under whatever reaches
  it. You do not position them; the flows do.
- **Control-plane** boxes sit in a band at the bottom, in column order.
- **Containers**: a block that others name as `parent` is drawn as a frame around them, sized
  to the grid of what it holds.

## The grid

`col` and `row` are whole numbers. Columns run left to right across the whole pattern, so
assign them in boundary order (people 0, then the first boundary's columns, then the next).
Rows run top to bottom inside each boundary. Boxes keep the rows you give them, so two boxes
that talk to each other and share a row are joined by a straight arrow.

What makes a drawing read well:

- **Put the main path on one row**, left to right: person → application → gateway → what it
  reaches.
- **Put things that talk next to each other.** Most findings come from two connected boxes
  with something between them.
- **Keep a boundary to two columns** where you can. The house convention for a cloud boundary:
  Enterprise data sits *under* the Tool services that read it, not beside them.
- **Use `cell`** when a block's place on the drawing should differ from its `col`/`row`: it
  gives the block a different cell without disturbing anything that refers to the original.
  It is how a wide boundary is folded into fewer columns.
- **Leave no empty rows.** Rows are not compacted for you.

Arrows are routed for you, at right angles, around every box. You cannot draw an arrow; you
can only make its job easy.

## The audit

```bash
npm run drawing:audit -- <surface>-<slug>
```

One row of numbers, then each finding. Every code must reach zero.

| Code | Finding | What to change |
| --- | --- | --- |
| **L1** | Wider than 1440px or taller than 1080px | Too wide: fold the widest boundary into fewer columns with `cell`, or shorten the gloss that is stretching a one-box boundary. Too tall: remove empty rows, move a box up beside its neighbour, or use `rowSpan` less. If it still does not fit, the pattern has too many boxes: merge boxes that are one thing, or split the pattern. |
| **L2** | An arrow runs through a boundary neither end is in | The two ends are separated by a boundary that is not theirs. Reorder the boundaries' columns so connected boundaries are adjacent, or change the row of one end so the arrow can pass above or below. |
| **L3** | An arrow runs through a container neither end is in | Move the box that is on the far side of the container to the near side, or give the two ends a shared row clear of the container. |
| **L4** | A flow label is missing, overlaps something, or runs off the drawing | Shorten the label (reuse a shorter registered one). If two labels collide, the two flows are too close: separate their rows. A label at the edge means the flow is hugging the edge: move its end inward. |
| **L5** | A title, one-liner or flow label is cut ("…"), including a cloud service name | Shorten the text. For a one-liner, three lines of about 25 characters is the room. For a cloud service name, shorten the binding's `service` text in the cloud's file. |
| **L6** | A container or boundary has wasted space | An empty row or column: renumber `row`/`col` so they are consecutive, or drop a `rowSpan` that is larger than its neighbours need. |
| **L7** | An arrow turns more than four times, or passes through a box | Two connected boxes are too far apart or have a box between them. Move one beside the other. This is the most common finding and almost never needs anything cleverer. |
| **C1** | A block has no one-liner, or it is too long | Write or shorten `summary` (at most 78 characters, shown uncut). |
| **C2** | A zone that holds a block has no gloss, or the gloss stretches its boundary | Write or shorten `gloss`. |
| **C3** | A flow crosses a boundary with no `crossing` | Add `crossing: { kind, via }`. |
| **open** | A question about the pattern, not the drawing | For example a control-plane box that owns no control. Pin a control it owns, remove the box, or record in `deviations` why it stays. |

Work in this order: C1 to C3 first (text changes box sizes, which moves everything), then L1
and L6 (overall shape), then L2, L3 and L7 (arrows), then L4 and L5 (labels). Re-run after
each change; one move often clears several findings, and occasionally causes one elsewhere.

## Then look

A clean audit means nothing is broken, not that the drawing is good. Open the page and read it
as someone seeing the pattern for the first time: can the eye follow each flow? Do related
boxes sit together? Does anything look accidental? If the answer is no, change the grid again.
The existing patterns' sign-off notes in `docs/PATTERN-STANDARD.md` show what was accepted and
why.
