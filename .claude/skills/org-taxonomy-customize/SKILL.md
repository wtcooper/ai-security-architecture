---
name: org-taxonomy-customize
description: Map an organization's security capabilities onto the repository's capability catalogue (MITRE mitigations and their cap-* specialisations in data/overlay/specializations.yaml) and record deployment status per surface and per tool in data/org. CoSAI control status rolls up from those records; technology categories carry no status.
---

# Customize organization capabilities

Read `references/schema.md`. Organization data is authored exclusively against capabilities: a
capability is a MITRE mitigation (`D3-MFA`, `AML.M0020`) or an authored specialisation of one
(`cap-*`, exactly one MITRE parent). Do not add direct organization mappings or status to CoSAI
controls, `tech-*` technology categories, or risks. Do not alter `data/cosai/` or invent
capabilities; if the catalogue lacks one, report the gap.

1. Identify the organization's actual capabilities, names, and deployment contexts. Use
   provided inventory and evidence; do not infer a deployment from a requirement.
2. Create `data/org/local/` when needed. Copy only the active example YAML files and replace
   their example content. Set `organisation.name` and `shortName` in `capabilities.yaml`.
3. Give each org capability an ID and title, and map it once using
   `capability: <MITRE id or cap-*>`. `scripts/cosai-index.mjs` lists the capabilities (the 59
   MITRE mitigations, with the 17 specialisations marked under their parent) with the controls
   each supports, its surfaces and the technology categories that realise it;
   `references/mapping-cheatsheet.md` has the common picks. Prefer the specialisation where one
   exists for what is deployed (a DLP product is `cap-sensitive-data-redaction`, not all of
   `AML.M0020`). If no capability fits, report the gap; do not force a mapping.
4. Record `surfaces` using `enabled`, `inProgress`, or `gap`, with notes and optional evidence.
   A surface is accepted only where the capability says `applies: true` (a specialisation
   inherits its parent's surfaces unless it overrides them); the build rejects the rest. Use
   `{}` for an inventoried capability with no assessment. Missing data is Not assessed.
5. In `tooling-status.yaml`, record availability and `capabilities` assessments keyed by
   organization capability ID. These describe that product's own settings or integrations.
   The capability must be pinned on the product's reference architecture — itself, its MITRE
   parent, or a specialisation of it; `cosai-index.mjs tools <toolId>` lists the eligible set.
6. Run `npm run data`, fix invalid references, and verify **Show org data** on Capabilities,
   Controls and the architecture Tools tab. The generated `org-capabilities` framework shows
   the derived mappings. CoSAI and the external framework crosswalks remain unchanged.

Organization → capability → CoSAI control is the only mapping path. Status is authored only on
capabilities: per surface here, per product in `tooling-status.yaml`. A record on a
specialisation also rolls up to its MITRE parent; control status is a rollup of the
capabilities that support it, never verified control compliance or mitigation effectiveness.
Mixed statuses are partial. Per-tool status does not inherit the enterprise status.

Older profile files belong in `archive/`, preserving evidence before reassessment. A profile
written against an earlier model (`tech-*` categories, or capability ids since retired) is
re-keyed to the MITRE mitigation or specialisation the deployment actually delivers, dropping
surface records where it does not apply; `npx tsx scripts/specialize-capabilities.mts`
(idempotent, `--write`) does this for any id a specialisation's `legacy` list names. Follow
`data/org/README.md`; do not reverse-map one broad mitigation to every possible capability.
