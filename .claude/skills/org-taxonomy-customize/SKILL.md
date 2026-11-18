---
name: org-taxonomy-customize
description: Map an organization's own security controls onto the repository's control catalogue (MITRE mitigations and their cap-* specialisations) and record them in data/org/controls.yaml, one row per control the organisation runs, with its own id, its name, its status and the catalogue controls it delivers. The mapping is many to many. A catalogue control's status rolls up from the rows mapped to it, and CoSAI control status rolls up from the catalogue controls. Also records, in data/org/products.yaml, which tools, clouds and on-premises platforms the organisation uses, which settings are on, what it runs in place of a reference component (its own approved gateway, registry or store), which ways of hosting it has approved and links to its own modules and runbooks. Use it when someone asks to record their status, map their controls, mark what is enabled, or add their approved services or modules to a hosted pattern.
---

# Record your controls, their status and your products

Read `references/schema.md` and `data/org/README.md`. Everything an organisation records lives
in two files in one folder: `data/org/controls.yaml` (its own controls) and
`data/org/products.yaml` (the tools and platforms it uses). Both ship empty.

A row in `data/org/controls.yaml` is one control the organisation runs. It maps to one or more
controls in the catalogue: a MITRE mitigation (`D3-MFA`, `AML.M0020`) or an authored
specialisation of one (`cap-*`, exactly one MITRE parent). The mapping is many to many: one of
the organisation's controls can map to several catalogue controls, and several of its controls
can map to the same one. Do not add status to CoSAI controls or risks, and do not alter
`data/cosai/` or invent catalogue controls; if the catalogue lacks one, report the gap.

1. Identify the organization's actual controls: what each is called, its identifier in the
   organisation's own register, and how far along it is. Use the inventory and evidence
   provided; do not infer a deployment from a requirement.
2. For each one, find the catalogue controls it delivers. `scripts/cosai-index.mjs` lists the
   catalogue (the MITRE mitigations, with the specialisations marked under their parent), the
   CoSAI controls each supports and the surfaces it applies on;
   `references/mapping-cheatsheet.md` has the common picks. Prefer the specialisation where one
   exists for what is deployed (a DLP product is `cap-sensitive-data-redaction`, not all of
   `AML.M0020`). List every catalogue control the organisation's control really delivers, and
   only those. If nothing fits, report the gap; do not force a mapping.
3. Add a row under `controls:` in `data/org/controls.yaml`:
   - `id`: the organisation's own identifier (a policy or register number). Required and
     unique. It is for the file only and is never shown on a page.
   - `name`: what the organisation calls the control. This is what pages show.
   - `status`: `enabled`, `inProgress` or `gap`. Leave it out when the control has not been
     assessed yet.
   - `maps`: the catalogue control ids it delivers, one or more.
   - `note` (optional, shown beside the name) and `link` (optional, https: the policy,
     standard or evidence for it).

   A catalogue control with no row mapped to it reads "Not set".
4. Run `npm run data` (it rejects a missing or repeated `id`, an empty `name`, an unknown
   catalogue id in `maps`, an unknown status or field, and a `link` that is not https), then
   check a pattern's Enable tab (`/patterns/<slug>/`), the control catalogue (`/controls/`)
   and the CoSAI controls list (`/reference/cosai-controls/`). Each catalogue control lists
   the organisation's controls beneath it by name, with their status. Pages show names, never
   ids. A CoSAI control is always written "CoSAI control".

Status is set only on the organisation's own rows, never on a catalogue control directly. A
catalogue control's status is worked out from the rows mapped to it: Enabled only when every
one is enabled, a Gap when every one is a gap or has no status and at least one is a gap, and
In progress otherwise. A MITRE parent with no row mapped to it rolls up its specialisations,
and a CoSAI control rolls up the parent controls that support it, by the same rule. A rollup
describes deployment, never verified control compliance or mitigation effectiveness.

## Products, platforms and your own components

`data/org/products.yaml` has a `products:` map, keyed by a tool id (`data/tooling/`) or a
platform id (`data/clouds/`: `cloudAws`, `cloudAzure`, `cloudGcp`, `cloudOnPrem`). Its header
comment gives the fields; `npm run data` rejects anything it does not recognise.

- `status` (`enabled`, `testing` or `notEnabled`), an optional `note`, and
  `settings: { <setting id>: { status, value, note, link } }` record which settings are
  switched on, the value actually set where it differs from the recommendation, and a `link`
  (https) to the organisation's own module, policy-as-code or runbook.
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
