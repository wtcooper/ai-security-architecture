# Capability layer: three questions, three pages

Date: 2026-09-19. Branch: `capability-layer`.

## Why

The app now carries five countermeasure-shaped vocabularies as peers: CoSAI controls, MITRE
mitigations, OWASP/ENISA technology categories, organisation capabilities and tools. They sit
at different altitudes (requirement, method, market category, operational capacity, product)
but the navigation presents them as parallel catalogues, so the boundaries read as arbitrary
and status has three places to live.

The three questions the app must answer, in order:

1. What types of control does the business need against AI risk, and what is our status in
   delivering them?
2. Where are the gaps, and what operational capability do we need to procure or build?
3. For each kind of AI application, on which surface, where in the data flow must a control be
   enforced, and how do named products (Claude Code, Cursor) of that kind fare?

## Target model

| Layer | Source | Role | Status? |
| --- | --- | --- | --- |
| Risks (and ATLAS techniques as a lens) | CoSAI, MITRE | Threat side | no |
| Controls | CoSAI | Governance requirements; personas own them | rolled up |
| Mitigations | D3FEND, ATLAS | Engineering methods; support controls; the pin vocabulary on drawings | no |
| **Capabilities** | authored, small, stable | Durable operational outcomes; realised by people, process and technology | **yes, the only authored status** |
| Technology categories | OWASP, ENISA, ECSO | The technology dimension of a capability; what the tool registry keys on | no |
| Tools | registry | Named products; each is an instance of one reference architecture | per capability |

A capability is technology-agnostic. It declares the CoSAI controls it delivers, the surfaces
where it can exist, and its realisation: technology categories, process items with a playbook
sentence, and the CoSAI personas who run it. The only relation maintained by hand is
capability → control. MITRE mappings stay sourced detail under controls and categories.

Status is authored in exactly two places, both keyed by capability id:

- `data/org/<profile>/capabilities.yaml`: per capability and surface (enterprise layer).
- `data/org/<profile>/tooling-status.yaml`: per product and capability (tool layer).

Control status is a rollup of the capabilities that deliver it. Mitigations have no status.

## Navigation

- **Risk map** unchanged.
- **Controls**: six groups, 35 controls, each with a rolled-up status pill when the overlay is
  on. Detail shows the delivering capabilities and, as a "how" section, the supporting MITRE
  methods. No mitigation tab.
- **Capabilities** (top-level): matrix of capability × surface, coloured by status, with a
  "gaps only" toggle. Detail lists the controls delivered and the realisation in three columns:
  technology categories, process items, people. Technology categories have no page of their own.
- **Architectures** unchanged in role. The rail groups pinned mitigations under the control
  they support so the reader sees control first, method second. The Tools tab has one row per
  capability the architecture needs, technology-category pills beside it, and product columns
  with vendor coverage and org status per capability.
- **Incidents** unchanged.
- **Reference** dropdown: Components, Risks, Personas, Frameworks, Mitigations catalogue.

## Data changes

1. `data/overlay/technology-capabilities.yaml` → `data/overlay/technology-categories.yaml`.
   Ids stay `tech-*`. The type becomes `TechnologyCategory`. Per-surface flags move off the
   category (the capability owns surface); mitigation and framework mappings stay.
2. New `data/overlay/capabilities.yaml`: roughly sixteen capabilities, ids `cap-*`, every CoSAI
   control delivered by at least one, every technology category realising at least one.
3. `data/org/*/capabilities.yaml` entries map `capability: cap-*` instead of `tech-*`; the
   rest of the org schema is unchanged. `tooling-status.yaml` is unchanged in shape.
4. Build validation: controls fully covered; categories fully used; capability surfaces
   authored; org records only on surfaces where the capability applies; per-tool records reach a
   capability whose controls are supported by a mitigation pinned on the tool's architecture.
5. Rollups in `src/lib/data.ts`: control ← capabilities; category ← capabilities; tool cell ←
   the product's mitigation rows for the capability's categories, plus org status per capability.

## UI changes

1. `SiteHeader`: Risk map · Controls · Capabilities · Architectures · Incidents · Reference ▾.
2. `/controls`: master-detail only, status pill per row with the overlay, capability chips and
   a mitigation "how" section in the detail. `/mitigations` becomes the reference catalogue.
3. `/capabilities`: `DefenseMatrix` over capabilities, gaps toggle, realisation detail.
4. Tools tab: rows from `rowsFor` keyed by capability; cells unchanged in mechanism.
5. Rail: `MitigationList` grouped by supporting control.

## Phases

- **Phase 1, data**: types, catalogue, category rename, build validation, org example re-keyed,
  tests green. Nothing user-visible changes yet except names.
- **Phase 2, UI**: navigation, Controls, Capabilities, Tools tab, rail.
- **Phase 3, docs and skills**: README, data/org/README, ONTOLOGY, PROVENANCE, the
  `org-taxonomy-customize` and `tooling-onboard` skills, migration note for forks.

## Out of scope

Pin vocabulary stays MITRE. The tool registry's per-mitigation vendor rows stay as they are.
Process items are prose, not a workflow model. No ATLAS technique lens on risks yet.
