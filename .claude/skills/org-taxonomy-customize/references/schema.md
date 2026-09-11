# data/org/<profile>/ schema

The build uses `data/org/local/` when it exists, else `data/org/example/`. Both files are optional
inside the profile; a missing file is an empty layer.

## frameworks.yaml

```yaml
organisation:
  name: Example Corp              # shown on badges, pills and the footer
  shortName: EX                   # optional

frameworks:                       # any number of catalogues
  - id: org-example-ais           # unique; must not collide with an existing framework id
    name: Example AI Security Standard
    fullName: Example Corp AI Security Standard (AIS)   # optional
    version: "2026.1"             # optional, quoted
    url: https://intranet.example/standards/ais         # optional; "Official reference" link
    description: >-               # optional
      ...
    entries:
      - id: AIS-3.2               # your identifier, unique within the framework
        label: Agent tool permission scoping           # required
        description: ...          # optional but recommended
        group: Agent runtime      # optional heading shown beside the id
        url: https://...          # optional per-entry deep link ("Read the source")
        controls: [controlAgentPluginPermissions]      # CoSAI control ids (data/cosai/controls.yaml)
        capabilities: [capabilityToolPermissionScoping] # capability ids (data/overlay/capabilities.yaml)
        risks: [riskRogueActions] # CoSAI risk ids (data/cosai/risks.yaml)
      - id: AIS-7.1
        label: AI use-case approval board
        description: A process requirement; maps to nothing, shown as a gap.
```

Build rules: `id`, `name`, ≥1 entry; each entry has `id` and `label`; every target id exists.
An entry with no targets is allowed. Framework ids are checked against every other framework.

## capabilities.yaml — the enterprise layer

```yaml
capabilities:
  capabilityAiDlp:                # data/overlay/capabilities.yaml id
    surfaceEndpoint:              # surfaceEndpoint | surfaceCloud | surfaceSaas
      status: enabled             # enabled | inProgress | gap
      technology: Netskope endpoint DLP    # optional; the named product you run
      note: ...                   # optional
    surfaceSaas: { status: inProgress, technology: Netskope CASB }
```

Build rules: the capability and surface ids exist; status in enum. This is the only source of
the Capabilities tab's status, and it is what appears as the enterprise-capability modules on
each architecture's Tools tab: the product's own setting is one half of a control, the enterprise
technology that delivers or surrounds it is the other. A capability × surface not listed reads
as a gap once status is shown.

## tooling-status.yaml

```yaml
tools:
  - tool: toolClaudeCode          # an id from data/tooling/
    available: true               # may people install and use it? omit the tool, or say false, if not
    note: ...                     # optional
    controls:                     # keyed by capability id pinned on the tool's architecture
      capabilityToolPermissionScoping:
        status: enabled           # enabled | inProgress | gap
        note: permissions.deny via managed-settings.json   # optional
        evidence: CHG-1042        # optional ticket / document reference
      capabilityAgentSandboxing: { status: gap }
```

Build rules: the tool exists; each capability key is pinned on that tool's architecture
(`node .claude/skills/org-taxonomy-customize/scripts/cosai-index.mjs tools` prints the set);
`available` is a boolean and control statuses are in the enum. A tool may appear once. A tool not
listed is not available and renders greyed out; a pinned capability with no key under an onboarded tool reads as a gap.

## Where it renders

| Data | Where |
| --- | --- |
| Framework entries | Frameworks tab, grouped under the organisation name; entry detail with mapped risks/controls/capabilities and the risk map |
| Entry ids | Badges on risk, control and capability cards; "Your controls" line under expanded rows on the architecture Capabilities/Risks tabs; hover cards on the drawing chips and tags; the controls table of every product record on the Tools tab |
| Adoption + statuses | The Tools tab on each architecture and its product records |
| Organisation name | Footer (`org: <name>`), pill labels; the example profile is labelled "example" everywhere |
