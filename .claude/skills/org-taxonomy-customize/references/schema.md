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
    capability: cap-ai-data-protection # exactly one cap-* from data/overlay/capabilities.yaml
    description: Sensitive-data inspection for AI prompts and uploads.
    surfaces:
      surfaceEndpoint:
        status: inProgress # enabled | inProgress | gap
        note: Upload inspection is still in pilot.
        evidence: SEC-42 # optional reference
```

`surfaces: {}` means no assessment yet. Other surfaces are `surfaceCloud` and `surfaceSaas`.
A surface entry is accepted only where the capability's catalogue entry has `applies: true`
for that surface; the reason is in the catalogue's surface note. Organization IDs must be
unique, titles nonempty, and the capability key valid. Do not add `controls`, `mitigations`,
`risks`, `capabilities`, `categories`, or multiple targets to an organization entry; the build
rejects them.

```yaml
# tooling-status.yaml
tools:
  - tool: toolClaudeCode
    available: true
    note: Approved for engineering.
    capabilities:
      AC-DLP: # organization capability ID, not cap-*, tech-* or a MITRE identifier
        status: inProgress
        note: Verifying coverage of this tool's outbound prompts.
        evidence: SEC-43
```

The capability behind the org ID must deliver at least one CoSAI control that a mitigation
pinned on the product's reference architecture supports; a product is assessed only against
capabilities its drawing calls for. Unavailable tools do not contribute to surface rollups.
Only recorded assessments contribute: matching statuses retain their value; mixed statuses
become partial. Missing records are Not assessed.

Status is authored only here, on capabilities. Control status is the rollup of the
capabilities that deliver it; technology categories and mitigations carry none. All CoSAI and
MITRE organization associations are generated. Vendor research remains mitigation-specific
and is not organization posture. See `data/org/README.md` for migration.
