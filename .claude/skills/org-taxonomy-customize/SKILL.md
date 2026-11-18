---
name: org-taxonomy-customize
description: Map an organization's security capabilities onto the repository's capability catalogue (MITRE mitigations and their cap-* specialisations) and record, in data/status.yaml, each capability's status and the organisation's own name for it. CoSAI control status rolls up from those entries. Also records, in the same file's products section, which tools, clouds and on-premises platforms the organisation uses, which settings are on, what it runs in place of a reference component (its own approved gateway, registry or store) and links to its own modules and runbooks. Use it when someone asks to record their status, map their controls, mark what is enabled, or add their approved services or modules to a hosted pattern.
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
   column on a pattern's Enable tab (`/patterns/<slug>/`), the control catalogue (`/controls/`)
   and the CoSAI controls list (`/reference/cosai-controls/`). The app calls a capability a
   **control**; a CoSAI control is always written "CoSAI control".

Status is set only on capabilities. A MITRE parent with no entry of its own rolls up its
specialisations; a control rolls up the parent capabilities that support it. A rollup is
Enabled only when every part is, a Gap when nothing is under way, and In progress otherwise.
It describes deployment, never verified control compliance or mitigation effectiveness.

## Products, platforms and your own components

The same file has a `products:` section, keyed by a tool id (`data/tooling/`) or a platform id
(`data/clouds/`: `cloudAws`, `cloudAzure`, `cloudGcp`, `cloudOnPrem`). Its header comment gives
the fields; `npm run data` rejects anything it does not recognise.

- `status` and `settings: { <setting id>: { status, value, note, link } }` record which
  settings are switched on, the value actually set where it differs from the recommendation,
  and a `link` (https) to the organisation's own module, policy-as-code or runbook.
- On a platform, `components:` records what the organisation runs for a component in place of
  the reference service: `gateway: { uses: "Kong AI Gateway", link: "https://…" }`. The key is
  the component's id in the pattern file (it applies on every pattern that has it) or
  `<pattern id>/<component id>` for one pattern. `uses` is at most 60 characters because it is
  printed in the box. Record a choice only where the organisation has approved one; do not
  invent a link.
- On a platform, `hosting:` records which ways of hosting the organisation has approved, keyed
  by the hosting option's id in that platform's file: `aks: { status: enabled }`,
  `containerApps: { status: testing, note: "…" }`. The page compares the options without
  ranking them; this entry is what turns the comparison into the organisation's own answer.

Check the result on a hosted pattern with **Built on** set to that platform: the box shows the
organisation's choice, marked as its own, and How it works lists it beside the reference.
