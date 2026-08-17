# Renderer techniques — how the React Flow viewer works

The viewer (`templates/viewer.html`, and the same code as a component in `web/`) renders
the engine's render model with `@xyflow/react` v12. React Flow supplies interaction — pan,
zoom, drag, real DOM nodes — but never layout: every initial position and path string comes
from the validated build geometry. These are the techniques that make that combination
work; they were developed on the ai-security-architecture app and ported here.

## 1. Geometry enforcement: verbatim paths, then live routing

Edges use one custom edge type (`BuildPathEdge`). While neither endpoint has been dragged,
it renders the build-computed `d` string **verbatim** through `<BaseEdge path={d}>` — the
drawing on screen is exactly the drawing the validator approved. The component tracks a
`dragged: Set<nodeId>` (populated in `onNodeDragStart`); once an edge touches a dragged
node, its `data.live` flips and the edge switches to a simple live 3-segment orthogonal
route computed from React Flow's `sourceX/Y, targetX/Y`:

```js
if (Math.abs(tx - sx) > Math.abs(ty - sy)) {
  const ex = (sx + tx) / 2;   // horizontal-ish: H, V, H
  path = `M ${sx} ${sy} L ${ex} ${sy} L ${ex} ${ty} L ${tx} ${ty}`;
} else { /* vertical-ish: V, H, V */ }
```

Handles: every block renders four invisible source handles (`t b l r`) and four target
handles (`t-in` …) — one per side, `style={{opacity: 0}}`. Each edge picks its pair once
from the *initial* rects (`facing(a, b)`: larger axis delta wins), so arrows leave and
enter on the sides the build geometry implies.

## 2. Containment frames: `parentId` + `extent`-free children

A frame is a React Flow node (`type: "frame"`, `zIndex: -1`, `selectable: false`) whose
rect is the bounding box of its members plus padding. Member blocks set
`parentId: frameId` and their positions become *relative to the frame* — which is why
dragging the frame moves the whole cluster natively, no custom code. The frame's label is
a small tab at top-left (or bottom-left via `labelPos`, for when edge pins crowd the top
edge); the frame's `note` appears in the hover card.

Deliberately no `extent: "parent"` — blocks may be dragged out of the frame to explore;
the frame is an annotation of the target state, not a cage.

## 3. Pins that travel

The overlay must survive dragging, or interactivity has to be locked down. Two mechanisms:

- **Block-anchored pins** (chips on the bottom border, tag stacks above the tab) are React
  Flow nodes with `parentId` = their block and positions relative to it — they ride along
  automatically. `draggable: false, selectable: false, zIndex: 10`.
- **Edge-anchored pins** cannot be nodes (nothing to parent to), so they render *inside*
  `BuildPathEdge` via `<EdgeLabelRenderer>`, positioned as
  `translate(${midX + pin.dx}px, ${midY + pin.dy}px)` — offsets from the **current**
  midpoint: the build midpoint while static, the live route's midpoint once dragged. The
  pins are attributes of the arrow and move with it. `pointerEvents: "all"` re-enables
  hover inside `EdgeLabelRenderer` (which disables it by default).

## 4. Hover cards instead of on-canvas text

Nothing persistent is written on the canvas except titles and item labels; every note
lives in one hover card so text never bleeds through the drawing. One `card` state,
positioned in the wrapper's coordinate space:

```js
const wrap = event.target.closest("#canvas");        // resolve at event time — no refs
const rect = wrap.getBoundingClientRect();
setCard({ x: clamp(event.clientX - rect.left + 12), y: ..., title, note });
```

Sources: `onNodeMouseEnter` (blocks, frames, chips, tags), `onEdgeMouseEnter` (label or
"From → To", plus the note), the edge-pin `onMouseEnter` callbacks passed through edge
`data`, and `onMoveStart` clears it. Resolving the wrapper via `closest()` at event time
(rather than a captured ref) also keeps React's "no refs during render" lint rule happy
when this code lives in a React app.

## 5. Scenario fade without losing drag state

Selecting a walk must not reset the user's dragging. Node positions live in one
`useState` + `applyNodeChanges`; the scenario dim is **derived at render time** over that
state, never written into it:

```js
const displayNodes = useMemo(() => nodes.map((n) =>
  n.type === "block" ? { ...n, data: { ...n.data, dim: inScenario && !walkBlocks.has(n.id) } }
  : n.type === "chip" || n.type === "tag" ? { ...n, data: { ...n.data, dim: inScenario } }
  : n
), [nodes, inScenario, walkBlocks]);
```

Blocks off the walk fade to 0.25 opacity, off-walk edges to 0.15, pins hide entirely; the
rail lists the numbered steps. Walk membership comes from the scenario's `follow` refs
(reverse of a bidir edge resolves to the same drawn edge).

## 6. The rest of the assembly

- `nodeTypes` / `edgeTypes` are module-level constants (React Flow warns if re-created
  per render).
- `<ReactFlow fitView fitViewOptions={{padding: 0.05}} minZoom={0.2} maxZoom={4}
  nodesConnectable={false} elementsSelectable={false}>` + `<Background gap={24}/>`.
- Arrowheads via `markerEnd: {type: "arrowclosed", color: pathColor}`, and `markerStart`
  too when `bidir` — colored per path class (green primary / amber external / dotted grey
  governance).
- Icons are hand-drawn 24×24 stroke glyphs (21 names), inlined as SVG markup strings and
  wrapped in a `<g fill="none" stroke=... strokeWidth="1.5">`.
- Tab colours: authored `layer` (app blue / model green / data amber); `external` blocks
  are always amber ("the outside is data"); otherwise quiet grey.
- The standalone template loads React 19 + React Flow 12 + htm from esm.sh and the React
  Flow stylesheet from unpkg; the render model is embedded as
  `<script type="application/json">` with `<` escaped to `<`.

## Known limits

- The live re-route is a plain 3-segment elbow — it can cross blocks the user has dragged
  into its way. The authored layout is always collision-free; live routing is exploratory.
- No mobile pinch handling beyond what React Flow ships.
- The standalone file needs internet for the CDN imports. For a fully-offline artifact,
  render the model as static SVG instead — the model carries every coordinate needed.
