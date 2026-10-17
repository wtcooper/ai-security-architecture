# Refocus: feature inventory

The checklist for the Learn → Enable refocus (Option 2, *foundations first, then tools*).
Every feature the site had on 2026-10-17 is listed once with a decision. A rebuilt page is done
when every **Keep**, **Move** and **Simplify** row that points at it is true.

**The story:** Learn the risk → Enable the reduction. Learn is the risk map, the architectures
and their sequence walks, and the incidents. Enable is enterprise controls plus tools (build,
buy or both), in four layers: foundations for all AI → surface baseline → use-case additions → tools.

| Decision | Meaning |
| --- | --- |
| **Keep** | Stays where it is, as it is. |
| **Move** | Survives, on a different page. |
| **Simplify** | Survives with fewer states, colours or clicks. |
| **Cut** | Removed. Still in git history. |

## Site shell

| Feature | Decision | Where / notes |
| --- | --- | --- |
| Nav: Risk map · Taxonomy ▾ · Architectures · Incidents | Simplify | Risk map · Architectures · Incidents (Learn) · **Enable** · **Reference ▾** (Risks, Controls, Capabilities, Components, Personas, Frameworks). Flat, so the risk map stays one click away. |
| ⌘K search palette | Keep | Gains Enable results; capability results now link to their capability (they had an empty id). |
| Landing page with nine section cards | Simplify | Two halves (Learn, Enable) plus Reference; data sources block kept. |
| Footer counts and "org: example" | Simplify | Counts kept; org profile badge cut. |
| "Authored layers under review" badge | Keep | |
| Deep links (`?risk=`, `?archetype=`, `?tool=` …) | Keep | Old `?tool=` links on Architectures redirect to Enable. |

## Learn

| Feature | Decision | Where / notes |
| --- | --- | --- |
| Risk map: 36 risks × 3 phases, SAIF-style tour | Keep | |
| Map pan/zoom, component click-through | Keep | |
| Framework lens lighting up the map | Keep | |
| Incidents: 10 replayed on the map, sourced | Keep | |
| Architecture picker (searchable, grouped by surface, surface pills) | Keep | |
| Architecture drawing (blocks, flows, numbered capability chips, R-coded risk tags) | Keep | Learn shows where risk enters; chips stay as the hand-off to Enable. |
| Drawing legend (two line styles, tab colour = layer, chip status colours) | Simplify | One line: two path styles, capability chip, risk code, three layer swatches, dotted zone. Chips no longer change colour with status. |
| Drawing styling: zone tints, border dash styles, path colours | Simplify | Zones, layout, components, flows and pins unchanged. Zones neutral (dotted edge = vendor or outside); block borders solid except containment; paths dark grey, solid vs dashed; chips violet. Export HTML matches. |
| Risk codes and capability chips both shown at rest | Simplify | One kind at a time: risk codes on Overview, Risks and incident replays; chips on Capabilities; step numbers on Sequence flows. |
| Export / Expand buttons floating over the canvas | Simplify | Moved to a bar above it; they covered the rightmost zone label. |
| Sequence flows tab | Keep | Fixed: opening the tab now numbers the walkthrough (clearing the highlight used to clear the walk too). |
| Pan/zoom, Expand, hover notes on blocks | Keep | |
| Export HTML of a drawing | Keep | |
| Sequence flows: walk list, numbered steps on drawing, sequence diagram | Keep | The core learning device; stays a tab on the architecture page. |
| Architecture tabs: Overview · Sequence flows · Tools · Capabilities · Risks | Simplify | Overview · Sequence flows · Capabilities · Risks, plus **Enable this securely →**. Tools move to Enable; the Capabilities tab stays as the key to the numbered chips, with guidance moved to Enable. |
| Overview: how it works, why it is its own archetype, sources | Keep | |
| Exemplars (named products in the summary) | Keep | |
| Enterprise landscape view (CISA Zero Trust domains, coverage tiles) | Cut | Replaced by Enable › Foundations, which answers the same question in plain groups. |
| Experimental zone (six Tools/org-data mockups) | Cut | Superseded by this refocus. |
| 16 disabled architectures and their guidance | Cut | Parked since the October redesign; restore from history if needed. |
| Archived zone-style catalogue | Cut | |

## Enable (new)

| Feature | Decision | Where / notes |
| --- | --- | --- |
| "What are you enabling?" picker | New | Same 17 architectures, grouped by surface. |
| Layer 1: Enterprise foundations | New | Controls every AI deployment needs, shown once, in plain groups (identity, gateway and data protection, inventory and governance, monitoring and response). |
| Layer 2: Surface baseline | New | Extra for endpoint, cloud or SaaS. |
| Layer 3: Use-case additions | New | The architecture's pinned capabilities not already in layers 1–2. Derived, not authored. |
| Layer 4: Tools | Move + Simplify | From Architectures › Tools. One value per cell: **Built-in · Partial · Not in tool**. "Not in tool" means a foundation has to cover it. |
| Tool record: summary, facts, variants, operator steps, vendor links, advisories | Move | From the Architectures tool panel to Enable. |
| Controls guidance ("How to govern this", per-architecture items) | Move | From Architectures › Capabilities to Enable, as the use-case section's guidance. |
| Capability detail per row (MITRE definition, placement, implementation) | Keep | Links to Reference › Capabilities. |

## Status and customisation

| Feature | Decision | Where / notes |
| --- | --- | --- |
| "Show org data" toggle (localStorage, example org) | Cut | |
| Org capability records per surface (`data/org/*/capabilities.yaml`) | Cut | Replaced by one `data/status.yaml`. |
| Org tool posture (available / not, per-tool status) | Cut | Tools carry vendor facts only. |
| Rollups (capability → control, parent ← specialisations) | Simplify | Control status still rolls up from capabilities; no per-surface or per-tool status. |
| Status vocabulary: Enabled · In progress · Gap · Not assessed · No mapping | Simplify | **Enabled · In progress · Gap · Not set**. A rollup is Enabled only when every part is. |
| Status column | New | Always visible, header carries an ⓘ explaining how to set it. |
| Custom capability names | New | `displayName` in `data/status.yaml`; shown with the MITRE name beneath. |

## Reference

| Feature | Decision | Where / notes |
| --- | --- | --- |
| Risks browser (causes, impact, facets, framework badges) | Keep | |
| Controls browser (6 groups, detail with capabilities) | Simplify | Status pill comes from the status file, always on. |
| Capabilities matrix (control group × surface) | Simplify | Gaps toggle and stack-layer filter kept; status from the status file. |
| Capability detail (definition, implementation, pins, process) | Simplify | Technology category pills cut; org records cut. |
| Components browser and deviation notes | Keep | |
| Personas browser | Keep | |
| Frameworks browser and inverted index | Keep | |
| Technology categories (25 `tech-*`, OWASP/ENISA/ECSO/CISA TIC) | Cut | Capabilities already carry the technology dimension (`examples`, shown as "What delivers it"). |
| Technology pills on Tools tab and capability detail | Cut | |
| NIST CSF 2.0 crosswalk | Keep | The control → CSF category crosswalk stays, moved to `data/frameworks/nist-csf.yaml`; only its technology-category links are cut. |

## Data, build and tooling

| Feature | Decision | Where / notes |
| --- | --- | --- |
| Example organisation profile (`data/org/example`) | Cut | `data/status.yaml` ships empty; the old example records stay in git history. |
| Build integrity checks (dangling ids, SAIF drift, layout geometry) | Keep | |
| `docs/AUDIT.md` generator | Keep | Technology and org sections removed. |
| Tool registry (`data/tooling/`) and its schema | Keep | Coverage enum unchanged in data; only display collapses to three words. |
| Capability migration scripts (`migrate:*`, `specialize-capabilities`) | Cut | One-time migrations, already applied. |
| `tooling-onboard` skill | Keep | |
| `ref-arch-diagram` skill | Keep | |
| `org-taxonomy-customize` skill | Simplify | Rewritten around `data/status.yaml`. |

## Follow-ups not in the first pass

- Restore any disabled architecture the Enable picker should offer (RAG assistant, AI gateway, shadow AI are the likeliest).
- Onboard products for the architectures that show "Pattern only" on Enable.
