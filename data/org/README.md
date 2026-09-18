# Your organization's capabilities

Author organization data at one layer:

**Organization capability → default technology capability → MITRE mitigation → CoSAI control.**

`data/org/local/` takes precedence when it exists. Otherwise the app uses the clearly labeled
`example/` profile. Both compile through `npm run data`; nothing is edited in the UI.

## Files

- `capabilities.yaml`: organization name and capability inventory. Each capability has its own
  ID and title, one `capability: tech-*` mapping, and optional assessments by deployment surface.
- `tooling-status.yaml`: tool availability and optional assessments keyed by **organization
  capability ID**, for the settings and integrations of that particular tool.
- `archive/`: historical evidence, excluded from the build and migration commands.

```yaml
# capabilities.yaml
organisation:
  name: Your Company
  shortName: YC
capabilities:
  - id: YC-DLP
    title: Corporate endpoint DLP
    capability: tech-dlp
    surfaces:
      surfaceEndpoint:
        status: inProgress
        note: Prompt and file-upload inspection are being verified.
        evidence: SEC-123
  - id: YC-SANDBOX
    title: Agent execution sandbox
    capability: tech-sandbox
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

Do not author organization mappings to CoSAI controls, risks, or MITRE mitigations. The build
validates default technology IDs and computes the MITRE and control associations. External
framework mappings (including CoSAI's NIST AI RMF mappings) remain unchanged. The generated
`org-capabilities` framework lets you inspect the organization catalogue and its derived links.

## Status and rollups

The authored statuses are `enabled`, `inProgress`, and `gap`. No record means **Not assessed**.
A mitigation with no default technology category is **No capability mapping**, which is a
catalogue gap rather than a deployment gap. The mapping coverage panel lists these explicitly.

The capability matrix combines recorded enterprise assessments and assessments of available
tools on the same surface. Equal statuses retain that status; mixed statuses become partial.
Missing records do not invent deployments or require every alternative technology category.
Select a capability to inspect each contributing organization capability and deployment context.

Mitigation status is a **capability support rollup** through the default mappings. Control
badges are derived associations, not compliance claims. A deployed technology does not by
itself establish mitigation effectiveness or control fulfillment. Product columns use only
that product's capability assessments; enterprise posture is not copied into product settings.
Vendor documentation remains attached to its specific MITRE mitigation.

**Show org data** retains the taxonomy names on both matrices and in the architecture Tools
table. It adds organization capability names, deployment status, and derived associations.
The switch is shared across pages. Tools not recorded as available remain unavailable.

## Adoption and migration

1. Create `data/org/local/` and copy the two current example YAML files (not `archive/`).
2. Replace the example records with your organization's capabilities. Use only existing
   `tech-*` categories from `data/overlay/technology-capabilities.yaml`. If none fits, report
   the taxonomy gap rather than mapping to an unrelated category or inventing a default.
3. Record surface assessments and, where useful, per-tool assessments against those org IDs.
4. Run `npm run data`, then enable **Show org data** and inspect both matrices and Tools.

For an older profile, preserve `frameworks.yaml`, `mitigations.yaml`, and the old
`tooling-status.yaml` in `archive/` before creating the current files. Review each deployment
and its evidence; reverse-mapping a broad mitigation to all candidate technologies would
invent implementations. Reuse notes only when they describe the actual chosen technology.
The build rejects legacy active files and direct control/mitigation mappings instead of
silently discarding them. The shipped example's previous records are preserved in `archive/`.

`local/` is gitignored upstream. In a private clone, `git add -f data/org/local` if you want to
track your profile. The old MITRE schema migration commands leave current capability files
untouched; they do not convert old organization assessments into technology deployments.
