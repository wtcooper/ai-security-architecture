---
name: org-taxonomy-customize
description: Map an organization's security capabilities onto the repository's authored capability catalogue (cap-* in data/overlay/capabilities.yaml) and record deployment status per surface and per tool in data/org. CoSAI control status rolls up from those records; MITRE mitigations and technology categories carry no status.
---

# Customize organization capabilities

Read `references/schema.md`. Organization data is authored exclusively against the capability
catalogue. Do not add direct organization mappings or status to CoSAI controls, MITRE
mitigations, `tech-*` technology categories, or risks. Do not alter `data/cosai/` or invent
capabilities; if the catalogue lacks one, report the gap.

1. Identify the organization's actual capabilities, names, and deployment contexts. Use
   provided inventory and evidence; do not infer a deployment from a requirement.
2. Create `data/org/local/` when needed. Copy only the active example YAML files and replace
   their example content. Set `organisation.name` and `shortName` in `capabilities.yaml`.
3. Give each org capability an ID and title, and map it once using `capability: cap-*`.
   `scripts/cosai-index.mjs` lists the 16 capabilities with the controls each delivers and the
   technology categories that realise it; `references/mapping-cheatsheet.md` has the common
   picks. If no capability fits, report the gap; do not force a mapping.
4. Record `surfaces` using `enabled`, `inProgress`, or `gap`, with notes and optional evidence.
   A surface is accepted only where the capability's catalogue entry says `applies: true`; the
   build rejects the rest. Use `{}` for an inventoried capability with no assessment. Missing
   data is Not assessed.
5. In `tooling-status.yaml`, record availability and `capabilities` assessments keyed by
   organization capability ID. These describe that product's own settings or integrations.
   The capability must deliver a CoSAI control that a mitigation pinned on the product's
   reference architecture supports; `cosai-index.mjs tools <toolId>` lists the eligible set.
6. Run `npm run data`, fix invalid references, and verify **Show org data** on Capabilities,
   Controls and the architecture Tools tab. The generated `org-capabilities` framework shows
   the derived mappings. CoSAI and the external framework crosswalks remain unchanged.

Organization → capability → CoSAI control (→ supporting MITRE mitigation, as detail) is the
only mapping path. Status is authored only on capabilities: per surface here, per product in
`tooling-status.yaml`. Control status is a rollup of the capabilities that deliver it, never
verified control compliance or mitigation effectiveness. Mixed statuses are partial. Per-tool
status does not inherit the enterprise status.

Older profile files belong in `archive/`, preserving evidence before reassessment. A profile
written against the earlier `tech-*` model is re-keyed to the `cap-*` capability the category
realises, dropping surface records where that capability does not apply. Follow
`data/org/README.md`; do not reverse-map one broad method to every possible capability.
