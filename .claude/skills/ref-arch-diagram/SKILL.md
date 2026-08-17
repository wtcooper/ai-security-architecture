---
name: ref-arch-diagram
description: Author and render flow-style reference-architecture diagrams — capability blocks on a grid, typed connectors, numbered control chips and coded risk tags pinned onto the drawing, containment frames, and scenario walks. Use when the user wants to create, edit or export an architecture diagram of this style; the skill interviews them for the content, writes the YAML, validates it with the bundled engine, and renders a standalone interactive HTML (React Flow) they can open directly or embed in a website.
---

# ref-arch-diagram — flow-style architecture diagrams

This skill turns a conversation into a validated, interactive architecture diagram. The user
describes a system; you author a YAML file against the schema in
[references/yaml-schema.md](references/yaml-schema.md); the bundled engine computes the
geometry and refuses anything illegible; the renderer produces a standalone HTML with the
diagram in React Flow — draggable blocks, hover cards, containment frames, risk/control
overlays and scenario walks.

**One-time setup** (per machine): run `npm install` inside this skill's directory — the
engine needs only `js-yaml`. The generated HTML needs an internet connection when opened
(React and React Flow load from a CDN); everything else is inlined.

## The workflow

### 1. Interview the user

Get the content before drawing anything. Ask, in whatever order the conversation allows —
and don't interrogate: for anything the user shrugs at, propose a sensible default and move on:

1. **What is the system?** Title, one-sentence summary, and the 5–10 major components.
   Fewer, larger blocks beat many small ones — this grammar tops out around 10 blocks.
2. **Who and what is outside?** People (actors), vendor services drawn as opaque
   (`provider`), and external data/services the system reads or acts on (`external`).
3. **What flows where?** For each connection: direction, whether traffic returns
   (`bidir`), and whether it is internal data (`primary`), crosses to content nobody in
   the diagram operates (`external`), or is a management relationship (`governance`).
4. **What are the risks and controls?** Each risk gets a short code (R01…) and a title;
   each control/capability a title. Then — the important part — *where does each one sit*:
   on a block, or on a specific flow ("the injection risk is on the retrieval edge").
5. **Containment?** Anything that should be drawn as a boundary *around* blocks (a
   sandbox, an application shell, a tenant) becomes a `frame`, not a block.
6. **Scenario walks?** 1–3 named sequences of steps along the edges ("a request becomes
   an action", "the injection path") — each step follows one edge, with a one-line note.

### 2. Author the YAML

Write `<name>.yaml` following [references/yaml-schema.md](references/yaml-schema.md). Start
from [examples/sandboxed-agent.yaml](examples/sandboxed-agent.yaml) — it exercises every
feature. The judgment calls that make a good drawing:

- **Grid curation is the layout algorithm.** Place blocks on `col`/`row` so flows do not
  cross: main data path left→right along one row, sources/actors in col 0, external
  destinations in the last column, a governance plane as a tall `rowSpan` column on the
  right edge. The router only draws straight lines and single bends — that is a feature;
  a grid that needs a cleverer router is a diagram that needs a better grid.
- **Blocks are things, pins are judgments.** Items inside a block name things that exist
  (transports, stores, runtimes, published surfaces). Controls and policies are never
  items — they are capability pins on the block or flow they govern. Exception: a block
  whose role *is* a control surface (a gateway, a governance plane) describes its function
  in its items.
- **Notes carry the reading.** Every block, edge and pin takes an optional `note:` — one
  or two sentences shown on hover. Write them; a diagram without notes is a picture,
  with them it is an argument.

### 3. Validate — loop until clean

```bash
node engine/build.mjs <name>.yaml
```

Exit 1 lists every problem, and each error names its own fix ("passes through block X —
move a block, or set route: vh"; "lands on block Y — pin it elsewhere"). Fix and re-run
until it prints the summary line. Never hand the user a file that has not passed — the
validator is the reviewer.

### 4. Render and deliver

```bash
node engine/render-html.mjs <name>.yaml <name>.html
```

Give the user the HTML file — double-clicking it opens the finished diagram. Offer the
delivery options and let them pick:

| Want | Do |
| --- | --- |
| Just see it / share it | The standalone HTML from `render-html.mjs`. Self-contained except the CDN. |
| Embed in any website | `<iframe src="diagram.html" style="width:100%;height:700px;border:0">` — the file is the widget. |
| Native React integration | See [web/README.md](web/README.md): a `FlowViewer` component consuming the same render-model JSON (`engine/build.mjs <name>.yaml model.json`), with React Flow installed from npm. |
| Machine-readable geometry | `node engine/build.mjs <name>.yaml model.json` — the full render model (rects, path strings, resolved pins) for any other renderer. |

### 5. Iterating

Edits go to the YAML, then re-run steps 3–4. The user drags blocks around in the viewer to
explore, but the *authored* layout lives in `col`/`row` — if they want a permanent
rearrangement, change the grid and re-render. When a diagram grows past ~10 blocks or wants
two ideas at once, split it into two diagrams rather than crowding one.

## What the engine guarantees

- Deterministic geometry: same YAML → pixel-identical drawing, every time.
- No flow passes through a block; no chip or tag lands on a block or runs off the canvas;
  no two blocks share a grid cell; no title overflows its tab (24-char limit).
- Every pin resolves to a real block or flow; every scenario step follows a real edge
  (reverse only if `bidir: true`); every pinned risk/capability is in its legend.
- Chip numbers and the side-rail legend are derived from the pins — the rail can never
  claim something the drawing does not show.

## Reference material

- [references/yaml-schema.md](references/yaml-schema.md) — every field, with the block
  kinds, path classes, icon vocabulary and layer colours.
- [references/engine-internals.md](references/engine-internals.md) — the layout constants,
  the one-bend router, pin-placement maths and validator rules, for anyone modifying the
  engine.
- [references/renderer-techniques.md](references/renderer-techniques.md) — how the React
  Flow viewer works: verbatim-then-live edges, frames via `parentId`, pins that travel
  with blocks and arrows, hover cards. Read before touching `templates/viewer.html` or
  building a custom renderer.
- [web/README.md](web/README.md) — embedding in a React site.
