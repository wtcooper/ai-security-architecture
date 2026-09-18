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
        mitigations: [AML.M0028] # mitigation ids (data/overlay/mitigations.yaml)
        risks: [riskRogueActions] # CoSAI risk ids (data/cosai/risks.yaml)
      - id: AIS-7.1
        label: AI use-case approval board
        description: A process requirement; maps to nothing, shown as a gap.
```

Build rules: `id`, `name`, ≥1 entry; each entry has `id` and `label`; every target id exists.
An entry with no targets is allowed. Framework ids are checked against every other framework.

## mitigations.yaml — the enterprise layer

```yaml
mitigations:
  AML.M0020:                # data/overlay/mitigations.yaml id
    surfaceEndpoint:              # surfaceEndpoint | surfaceCloud | surfaceSaas
      status: inProgress          # enabled | inProgress | gap; one guardrail feature is partial
      technology: Netskope endpoint DLP    # optional; the named product you run
      note: DLP inspection deployed; other required guardrail features await assessment.
    surfaceSaas: { status: inProgress, technology: Netskope CASB }
```

Build rules: the mitigation and surface ids exist; status in enum. This is the only source of
status on the Mitigations matrix and in the "Your status" line on a drawing's Controls tab, and
it tints the enterprise-mitigation tag beside every control on the Tools tab: the product's own setting is one half of a control, the enterprise
technology that delivers or surrounds it is the other. A mitigation × surface not listed reads
as a gap once status is shown.

## tooling-status.yaml

```yaml
tools:
  - tool: toolClaudeCode          # an id from data/tooling/
    available: true               # may people install and use it? omit the tool, or say false, if not
    note: ...                     # optional
    controls:                     # keyed by mitigation id pinned on the tool's architecture
      AML.M0028:
        status: enabled           # enabled | inProgress | gap
        note: permissions.deny via managed-settings.json   # the justification: what you set up; shown on hover in the grid
        evidence: CHG-1042        # optional ticket / document reference; shown with the note
      D3-EI: { status: gap, note: sandbox.enabled pending bubblewrap packaging }   # a gap still says why
```

Build rules: the tool exists; each mitigation key is pinned on that tool's architecture
(`node .claude/skills/org-taxonomy-customize/scripts/cosai-index.mjs tools` prints the set);
`available` is a boolean and control statuses are in the enum. A tool may appear once. A tool not
listed is not available and its column renders greyed out; a pinned mitigation with no key under
an available tool reads as a gap.

## Where it renders

| Data | Where |
| --- | --- |
| Framework entries | Frameworks tab, grouped under the organisation name; entry detail with mapped risks/controls/mitigations and the risk map |
| Entry ids | Badges on risk, control and mitigation cards; "Your controls" line under expanded rows on the architecture Controls/Risks tabs; hover cards on the drawing chips and tags; the row labels and controls table on the Tools tab |
| Mitigation statuses | The Mitigations matrix (pill tints), each mitigation's surface cards, the "Your status" line on the Controls tab, and the enterprise-mitigation tag on the Tools tab |
| Availability + control statuses | The Tools tab: the product header pill (Available / Not available), the tint on every cell, and the product record |
| Organisation name | Footer (`org: <name>`), pill labels; the example profile is labelled "example" everywhere |

Everything in this table is behind the **Show status** switch beside the Mitigations and
Reference architectures titles; it defaults on when `data/org/local/` exists.

Use the native MITRE IDs selected in `data/overlay/mitigations.yaml`; canonical names and
definitions come from the compiled dataset. For migrated records, `migration.original` retains
the previous evidence. Keep `migration.reviewRequired: true` until reassessment; tool coverage
stays `unknown` and organization posture cannot be `enabled` while that flag is set.
