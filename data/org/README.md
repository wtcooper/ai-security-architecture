# Your organisation's inputs

Two files, and nothing else, turn this catalogue into your organisation's own view. Both ship
empty; `npm run data` checks them and tells you what is wrong, by name.

| File | What you record |
| --- | --- |
| [`controls.yaml`](controls.yaml) | Your own controls: a name, a status, and the catalogue controls each one delivers. Many of yours can map to one of ours, and one of yours can map to many. |
| [`products.yaml`](products.yaml) | The tools, clouds and data centres you use: which are enabled, which of their settings you have switched on, what you run in place of a reference component, and which ways of hosting you have approved. |

What appears on the site:

- On a pattern's **Enable** tab and in the **Controls** catalogue, each catalogue control lists
  your controls beneath it by name, with their status. The catalogue control's own status is
  worked out from yours.
- On a pattern's settings step, a product you have enabled is marked, and so is each setting.
- On a hosted pattern, the box for a component shows what you run there, and the hosting
  options you have approved are marked.

Identifiers (yours and the catalogue's) are for these files only. Pages show names.
