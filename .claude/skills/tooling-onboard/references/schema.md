# data/tooling/ schema

```
data/tooling/
├── README.md              inclusion rule, research protocol, exclusions
├── vendors.yaml           attribution + vendors: [{ id, name, url?, trust? }]
└── <vendor>/<family>.yaml one file per product family
```

```yaml
# <Family> — one entity per product × reference architecture. Facts are dated (asOf) and
# cite the vendor's own documentation; re-verify before enforcing. Schema: data/tooling/README.md.
vendor: anthropic                       # id from vendors.yaml (file-level default)
family: Claude Code
tools:
  - id: toolClaudeCode                  # ^tool[A-Z], camelCase, stable
    name: Claude Code
    surfaceClasses: [endpointCli, ideExtension, desktopApp]
    #  endpointCli | ideExtension | desktopApp | browserExtension | cloudAgent |
    #  managedRuntime | chatIntegration | saasChat | officeAddin | ciIntegration
    variants:
      - { name: Claude Code CLI, class: endpointCli, url: https://..., note: ... }
    architecture: archCodingAgentThirdParty
    secondaryArchitectures: []          # optional
    status: ga                          # ga | beta | preview | announced
    asOf: "2026-09"
    summary:
      - >-
        ...
    facts:
      - { label: Plans, value: "...", url: https://... }
      - { label: Inference & routing, value: "...", url: https://... }
      - { label: Data leaving the device, value: "...", url: https://... }
      - { label: Retention & training, value: "...", url: https://... }
    items:                              # optional admin-configuration detail (also rendered on
      - title: ...                      # the architecture's Controls-guidance panel)
        body: [ ... ]
        links: [{ title, url }]
    riskNotes:
      - { risk: riskPromptInjection, note: ... }     # risk must be pinned on the architecture
    controls:
      - capability: capabilityToolPermissionScoping  # must be pinned on the architecture
        coverage: native                # native | partial | none | external | unknown
        mechanism: managed-settings.json (MDM/GPO) or server-managed settings
        steps:
          - title: Pin permission rules
            body:
              - Set permissions.allow / deny / ask; set allowManagedPermissionRulesOnly.
            url: https://code.claude.com/docs/en/settings
        verified: "2026-09-10"
        note: ...                       # optional; what the org should do for none/external rows
    advisories:
      - { title: "CVE-2025-59536 — ...", url: https://..., date: "2025-10" }
    sources:
      - { title: Claude Code docs index, url: https://code.claude.com/docs }
```

Build rules (scripts/build-data.ts, checkTooling): vendor exists; id unique and `^tool[A-Z]`;
name, family, asOf, summary, ≥1 surface class (all known); each variant's class is in
`surfaceClasses`; architecture (and secondaries) exist; every `controls[].capability` is pinned
on the primary architecture and listed once; coverage in enum; each step has title + body; each
risk note names a pinned risk; every link/source/advisory has title + url; ≥1 source.

Coverage meanings: **native** the vendor ships an admin-settable control; **partial** part of it;
**external** only via a third-party product placed around the tool; **none** nothing offered;
**unknown** could not verify (say why in `note`).
