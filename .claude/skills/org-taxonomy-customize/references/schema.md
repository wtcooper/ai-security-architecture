# Organization capability schema

`data/org/local/` is preferred; `example/` is the fallback. Only the following active files
are accepted. Historical control/mitigation mappings belong under `archive/`.

```yaml
# capabilities.yaml
organisation:
  name: Acme
  shortName: AC
capabilities:
  - id: AC-DLP
    title: Corporate endpoint DLP
    capability: tech-dlp # exactly one existing default technology category
    description: Sensitive-data inspection for AI prompts and uploads.
    surfaces:
      surfaceEndpoint:
        status: inProgress # enabled | inProgress | gap
        note: Upload inspection is still in pilot.
        evidence: SEC-42 # optional reference
```

`surfaces: {}` means no assessment yet. Other surfaces are `surfaceCloud` and `surfaceSaas`.
The selected default category must support the surface through its mitigation mappings.
Organization IDs must be unique, titles nonempty, and technology keys valid. Do not add
`controls`, `mitigations`, `risks`, or multiple default targets to an organization entry.

```yaml
# tooling-status.yaml
tools:
  - tool: toolClaudeCode
    available: true
    note: Approved for engineering.
    capabilities:
      AC-DLP: # organization capability ID, not tech-* or a MITRE identifier
        status: inProgress
        note: Verifying coverage of this tool's outbound prompts.
        evidence: SEC-43
```

The product's architecture must contain a mitigation reached by that default capability.
Unavailable tools do not contribute to surface deployment rollups. Only recorded assessments
contribute: matching statuses retain their value; mixed statuses become partial. Missing
records are Not assessed; absent technology mappings are No capability mapping.

All MITRE and CoSAI organization associations are generated. Vendor research remains
mitigation-specific and is not organization posture. See `data/org/README.md` for migration.
