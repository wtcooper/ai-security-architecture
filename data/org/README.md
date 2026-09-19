# Your organization's capabilities

Author organization data at one layer:

**Organization capability → capability (`cap-*`) → CoSAI control → supporting MITRE mitigation.**

`data/org/local/` takes precedence when it exists. Otherwise the app uses the clearly labeled
`example/` profile. Both compile through `npm run data`; nothing is edited in the UI.

## Files

- `capabilities.yaml`: organization name and capability inventory. Each entry has its own
  ID and title, one `capability: cap-*` mapping into `data/overlay/capabilities.yaml`, and a
  status per deployment surface.
- `tooling-status.yaml`: tool availability and a status per **organization capability ID**,
  describing how the settings and integrations of that particular tool deliver it.
- `archive/`: historical evidence, excluded from the build and migration commands.

```yaml
# capabilities.yaml
organisation:
  name: Your Company
  shortName: YC
capabilities:
  - id: YC-DLP
    title: Corporate endpoint DLP
    capability: cap-ai-data-protection
    surfaces:
      surfaceEndpoint:
        status: inProgress
        note: Prompt and file-upload inspection are being verified.
        evidence: SEC-123
  - id: YC-SANDBOX
    title: Agent execution sandbox
    capability: cap-workload-isolation
    surfaces: {} # inventoried, not assessed yet
```

```yaml
# tooling-status.yaml
tools:
  - tool: toolClaudeCode
    available: true
    capabilities:
      YC-SANDBOX:
        status: inProgress
        note: Managed sandbox policy is being rolled out to this tool.
        evidence: SEC-456
```

Do not author organization mappings to CoSAI controls, risks, MITRE mitigations or `tech-*`
technology categories; the build rejects `controls`, `mitigations`, `risks`, `capabilities` or
`categories` keys on an entry. Control and mitigation associations are derived through the
capability. External framework mappings (including CoSAI's NIST AI RMF mappings) remain
unchanged. The generated `org-capabilities` framework lets you inspect the organization
catalogue and its derived links.

## Validation rules

`npm run data` checks every record:

- `capability` must name an existing `cap-*` id; org IDs are unique and titles nonempty.
- A surface entry is accepted only on a surface where that capability `applies: true` in the
  catalogue. Training data governance, for example, does not apply on the endpoint, so an
  endpoint status for it is rejected rather than silently shown.
- Statuses are `enabled`, `inProgress` or `gap`; anything else fails.
- In `tooling-status.yaml`, each tool id must exist in the registry once, `available` is a
  boolean, and every organization capability assessed for a tool must deliver at least one
  CoSAI control that is supported by a mitigation pinned on that tool's reference
  architecture. A product is assessed only against capabilities its drawing actually calls for.

## Status and rollups

Status is authored only on capabilities: per capability and surface in `capabilities.yaml`,
per product and capability in `tooling-status.yaml`. No record means **Not assessed**.
Everything else is a rollup of those records and is labelled as such in the UI.

- **Capabilities matrix** (capability × surface): combines the enterprise records on that
  surface with the records of available tools whose architecture sits on that surface. Equal
  statuses retain that status; mixed statuses become partial. Missing records do not invent
  deployments. Select a cell to inspect each contributing organization capability and context.
- **Controls**: a control's status is the rollup of the capabilities that deliver it, over
  every surface or one. It is a derived association, not a compliance claim.
- **Tools tab**: a product cell reads only that product's own record for the capability;
  enterprise posture is not copied into product columns. Vendor documentation stays attached
  to its specific MITRE mitigation and is shown as coverage, not status.
- **Mitigations** and **technology categories** carry no authored status. A method with no
  technology category is no longer a status gap; every control is delivered by at least one
  capability, so nothing in the countermeasure layers dangles without an operational owner.

A deployed capability does not by itself establish mitigation effectiveness or control
fulfillment.

**Show org data** retains the taxonomy names in the matrix, the Controls list and the
architecture Tools table. It adds organization capability names, deployment status, and derived
associations. The switch is shared across pages. Tools not recorded as available remain
unavailable.

## Adoption and migration

1. Create `data/org/local/` and copy the two current example YAML files (not `archive/`).
2. Replace the example records with your organization's capabilities. Use only existing
   `cap-*` ids from `data/overlay/capabilities.yaml`. If none fits, report the catalogue gap
   rather than mapping to an unrelated capability or inventing one.
3. Record surface statuses on the surfaces where the capability applies and, where useful,
   per-tool statuses against those org IDs.
4. Run `npm run data`, then enable **Show org data** and inspect Capabilities, Controls and
   the Tools tab.

For a profile written against the earlier `tech-*` model, re-key each entry's `capability:`
to the `cap-*` capability that the old technology category realises (a category may realise
several; pick the one the deployment actually delivers) and drop any surface record on a
surface where that capability does not apply. The rest of the schema is unchanged.

For an older profile still, preserve `frameworks.yaml`, `mitigations.yaml`, and the old
`tooling-status.yaml` in `archive/` before creating the current files. Review each deployment
and its evidence; reverse-mapping a broad mitigation to every candidate capability would
invent implementations. Reuse notes only when they describe the actual chosen technology.
The build rejects legacy active files and direct control/mitigation mappings instead of
silently discarding them. The shipped example's previous records are preserved in `archive/`.

`local/` is gitignored upstream. In a private clone, `git add -f data/org/local` if you want to
track your profile. The old MITRE schema migration commands leave current capability files
untouched; they do not convert old organization assessments into capability records.
