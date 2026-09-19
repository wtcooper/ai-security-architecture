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
    capability: cap-sensitive-data-redaction # one MITRE id (data/overlay/mitigations.yaml) or cap-* (data/overlay/specializations.yaml)
    description: Sensitive-data inspection for AI prompts and uploads.
    surfaces:
      surfaceEndpoint:
        status: inProgress # enabled | inProgress | gap
        note: Upload inspection is still in pilot.
        evidence: SEC-42 # optional reference
  - id: AC-MFA
    title: Workforce IdP with phishing-resistant MFA
    capability: D3-MFA # a MITRE id directly
    surfaces: {}
```

`surfaces: {}` means no assessment yet. Other surfaces are `surfaceCloud` and `surfaceSaas`.
A surface entry is accepted only where the capability has `applies: true` for that surface;
the reason is in its surface note, and a specialisation inherits its parent's surfaces unless
it overrides them. Organization IDs must be unique, titles nonempty, and the capability key
valid. Do not add `controls`, `mitigations`, `risks`, `capabilities`, `categories`, or
multiple targets to an organization entry; the build rejects them.

```yaml
# tooling-status.yaml
tools:
  - tool: toolClaudeCode
    available: true
    note: Approved for engineering.
    capabilities:
      AC-DLP: # organization capability ID, not a MITRE id, cap-* or tech-*
        status: inProgress
        note: Verifying coverage of this tool's outbound prompts.
        evidence: SEC-43
```

The capability behind the org ID must be pinned on the product's reference architecture —
itself, its MITRE parent, or a specialisation of it; a product is assessed only against
capabilities its drawing calls for. Unavailable tools do not contribute to surface rollups.
Only recorded assessments contribute: matching statuses retain their value; mixed statuses
become partial. Missing records are Not assessed.

Status is authored only here, on capabilities. A parent rolls up its specialisations' records;
control status is the rollup of the capabilities that support it; technology categories carry
none. All CoSAI organization associations are generated. Vendor research remains per
capability row in the tool registry and is not organization posture. See
`data/org/README.md` for migration.
