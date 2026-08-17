# Embedding the diagrams in a website

Three options, cheapest first.

## Option 1 — iframe the standalone file (any stack, zero code)

The HTML from `engine/render-html.mjs` *is* the widget:

```html
<iframe src="/diagrams/my-arch.html" style="width:100%;height:720px;border:0"></iframe>
```

Serve the file from your static assets. Nothing to install, updates are re-renders.

## Option 2 — native React component (this folder)

`FlowViewer.jsx` is the same viewer as the standalone template, as an importable component
consuming a render model:

```bash
npm install @xyflow/react        # v12 — React 18/19
```

```jsx
import { FlowViewer } from "./FlowViewer";
import model from "./my-arch.model.json";   // node engine/build.mjs my-arch.yaml my-arch.model.json

// The component fills its parent; give the parent a height.
<div style={{ height: 720 }}>
  <FlowViewer model={model} />
</div>
```

Notes:

- React Flow measures DOM nodes, so render client-side only (Next.js:
  `dynamic(() => import("./FlowViewer"), { ssr: false })`).
- Import `@xyflow/react/dist/style.css` once (FlowViewer does it).
- The component keeps the side rail optional: `<FlowViewer model={m} rail={false} />`
  renders just the canvas; scenario control then comes from the `scenario` prop.
- Colours are CSS custom properties with fallbacks (`--ink`, `--paper`, `--app`,
  `--model`, `--data`, `--chip`, `--line`, `--paper-2`, `--ink-2`, `--ink-3`) — define
  them in your theme to restyle, or leave the fallbacks.

## Option 3 — your own renderer over the model

`engine/build.mjs <yaml> <out.json>` emits the full render model — block rects, item cells,
SVG path strings, resolved pins with coordinates (see
[../references/engine-internals.md](../references/engine-internals.md)). Static SVG, a
different canvas library, a PDF export: everything needed is in the numbers. Follow the two
coordinate conventions (block pins relative to their block, edge pins as midpoint offsets)
and the geometry-enforcement pattern in
[../references/renderer-techniques.md](../references/renderer-techniques.md).
