# The status file

`data/status.yaml` is the only file an organisation edits to record its position. It ships
with no entries.

```yaml
capabilities:
  cap-sensitive-data-redaction:      # a cap-* specialisation (data/overlay/specializations.yaml)
    status: inProgress               # enabled | inProgress | gap
    displayName: Corporate AI DLP    # optional: shown first, the catalogue name beneath it
    note: Upload inspection is still in pilot.   # optional: shown on hover
  D3-MFA:                            # or a MITRE id (data/overlay/mitigations.yaml)
    status: enabled
    displayName: Phishing-resistant SSO
```

Rules the build enforces (`scripts/lib/enablement.ts`, `loadStatus`):

- every key is a capability id in the catalogue;
- `status`, if present, is `enabled`, `inProgress` or `gap`;
- only `status`, `displayName` and `note` are accepted; `displayName` may not be empty.

An entry may carry only a `displayName` — renaming without assessing. Status is one value per
capability, not per surface or per product.

Rollups, computed in `src/lib/data.ts`:

- a MITRE parent with no entry of its own takes the rollup of its specialisations;
- a CoSAI control takes the rollup of the parent capabilities that support it;
- a rollup is Enabled only when every part is, a Gap when nothing is enabled or in progress,
  and In progress otherwise. Nothing set at all reads Not set.
