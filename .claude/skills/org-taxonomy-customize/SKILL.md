---
name: org-taxonomy-customize
description: Map an organization's security capabilities onto the repository's capability catalogue (MITRE mitigations and their cap-* specialisations) and record, in data/status.yaml, each capability's status and the organisation's own name for it. CoSAI control status rolls up from those entries.
---

# Customize capability status and names

Read `references/schema.md`. Everything an organisation records lives in one file,
`data/status.yaml`, keyed by capability id: a MITRE mitigation (`D3-MFA`, `AML.M0020`) or an
authored specialisation of one (`cap-*`, exactly one MITRE parent). Do not add status to CoSAI
controls or risks, and do not alter `data/cosai/` or invent capabilities; if the catalogue
lacks one, report the gap.

1. Identify the organization's actual capabilities and what it calls them. Use the inventory
   and evidence provided; do not infer a deployment from a requirement.
2. Map each one to a single catalogue id. `scripts/cosai-index.mjs` lists the capabilities
   (the MITRE mitigations, with the specialisations marked under their parent), the controls
   each supports and the surfaces it applies on; `references/mapping-cheatsheet.md` has the
   common picks. Prefer the specialisation where one exists for what is deployed (a DLP
   product is `cap-sensitive-data-redaction`, not all of `AML.M0020`). If nothing fits,
   report the gap; do not force a mapping.
3. Add an entry under `capabilities:` in `data/status.yaml` with `status` (`enabled`,
   `inProgress` or `gap`), and `displayName` where the organisation has its own name for it.
   A `note` is optional and shows on hover. Leave a capability out entirely when it has not
   been assessed: it reads "Not set".
4. Run `npm run data` (it rejects unknown ids, statuses and fields), then check the Status
   column on an architecture's Enable tab, the Capabilities matrix and the Controls list.

Status is set only on capabilities. A MITRE parent with no entry of its own rolls up its
specialisations; a control rolls up the parent capabilities that support it. A rollup is
Enabled only when every part is, a Gap when nothing is under way, and In progress otherwise.
It describes deployment, never verified control compliance or mitigation effectiveness. Tools
carry vendor facts only (`data/tooling/`); the organisation records no per-tool status.
