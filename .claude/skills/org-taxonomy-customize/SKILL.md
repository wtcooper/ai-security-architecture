---
name: org-taxonomy-customize
description: Map organization technology capabilities onto the repository's sourced default capability taxonomy and record deployment status in data/org. MITRE mitigation and CoSAI control relationships roll up automatically.
---

# Customize organization capabilities

Read `references/schema.md`. Organization data is authored exclusively at the technology
capability layer. Do not add direct organization mappings or status to MITRE mitigations,
CoSAI controls, or risks. Do not alter `data/cosai/` or invent default technology categories.

1. Identify the organization's actual technology capabilities, names, and deployment contexts.
   Use provided inventory and evidence; do not infer product deployment from a requirement.
2. Create `data/org/local/` when needed. Copy only the active example YAML files and replace
   their example content. Set `organisation.name` and `shortName` in `capabilities.yaml`.
3. Give each org capability an ID and title, and map it once using `capability: tech-*`.
   `scripts/cosai-index.mjs` lists current defaults and the derived taxonomy relationships.
   If no category fits, report the gap; do not force a mapping.
4. Record `surfaces` using `enabled`, `inProgress`, or `gap`, with notes and optional evidence.
   Use `{}` for an inventoried capability with no assessment. Missing data is Not assessed.
5. In `tooling-status.yaml`, record availability and optional `capabilities` assessments keyed
   by organization capability ID. These describe that product's settings or integrations.
   The default capability must reach a mitigation pinned on the product's architecture.
6. Run `npm run data`, fix invalid references, and verify **Show org data** on capabilities,
   mitigations, and architecture Tools. The generated `org-capabilities` framework shows the
   derived mappings. CoSAI and the external framework crosswalks remain unchanged.

Organization → default capability → MITRE mitigation → CoSAI control is the only mapping
path. Status rollups show capability support, never verified mitigation effectiveness or
control compliance. Mixed deployment statuses are partial; an unmapped mitigation remains
No capability mapping. Per-tool status does not inherit the enterprise status.

Older profile files belong in `archive/`, preserving evidence before reassessment. Follow
`data/org/README.md`; do not reverse-map one broad method to every possible technology.
