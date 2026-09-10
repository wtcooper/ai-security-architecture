# AI tooling registry

Named products, one entity per **product × reference architecture**, under
`<vendor>/<family>.yaml`. The registry answers the question the taxonomy cannot: *for the tool we
actually run, which of the reference controls does the vendor let us switch on, and where?*

This is the only layer of the repository that names vendors, so the exemplar rule applies to
every entry: dated (`asOf`), sourced from the vendor's own documentation, and every operator step
linking to the page that documents it. Nothing is recalled from memory. `npm run audit` flags
entries older than six months and lists the pinned capabilities each tool does not yet address.

## Inclusion rule

An entity is a product surface that runs an agent, hosts one, or feeds one with organisation
data, from the four vendors in scope (Anthropic, OpenAI, Cursor, GitHub) plus the open-source
personal-agent exemplars the guidance layer already cites. A product's UI shells (CLI, IDE
extension, desktop app) are `variants` of one entity; a shell becomes its own entity only when
its reference architecture or its admin mechanism differs (a cloud-hosted variant of a local
agent is the usual case).

## Schema

```yaml
vendor: anthropic                       # file-level default; ids from vendors.yaml
family: Claude Code
tools:
  - id: toolClaudeCode                  # ^tool[A-Z]
    name: Claude Code
    surfaceClasses: [endpointCli, ideExtension, desktopApp]
    #  endpointCli | ideExtension | desktopApp | browserExtension | cloudAgent |
    #  managedRuntime | chatIntegration | saasChat | officeAddin | ciIntegration
    variants:                           # named shells, each with a class from surfaceClasses
      - { name: Claude Code CLI, class: endpointCli, url: ... }
    architecture: archCodingAgentThirdParty   # fixes the reference control set (its pins)
    secondaryArchitectures: []
    status: ga                          # ga | beta | preview | announced
    asOf: "2026-09"
    summary: [...]
    facts:                              # plans, inference location, routing, what leaves the device
      - { label: Inference, value: "...", url: ... }
    items:                              # admin-configuration detail (also on the Controls-guidance panel)
      - { title: ..., body: [...], links: [{ title, url }] }
    riskNotes:                          # tool-specific emphasis; risk must be pinned on the architecture
      - { risk: riskPromptInjection, note: ... }
    controls:                           # one row per pinned capability the vendor addresses
      - capability: capabilityToolPermissionScoping
        coverage: native                # native | partial | none | external | unknown
        mechanism: managed-settings.json (MDM/GPO) or server-managed settings
        steps:
          - { title: Pin permission rules, body: [...], url: https://... }
        verified: "2026-09-10"
    advisories:
      - { title: "CVE-2025-59536 ...", url: ..., date: "2025-10" }
    sources: [{ title, url }]
```

Build rules: the vendor exists; the architecture exists; every `controls[].capability` and
`riskNotes[].risk` is pinned on the primary architecture; every step, advisory and source has a
title and a url; `asOf` is present. A tool cannot claim, or disclaim, a control its drawing does
not show — the fix is a pin on the architecture.

## Research protocol

Applied by the `tooling-onboard` skill under `.claude/skills/`:

1. Enumerate the vendor's surfaces from its own docs index; decide entity vs variant.
2. Fetch each page; record only settings whose names appear on a page that resolved. A step
   that cannot be verified is `coverage: unknown`, never a guess.
3. Choose the architecture by surface class (coding shells → third-party coding agent;
   hosted agents → managed agent runtime; chat and add-ins → enterprise AI chat; autonomous
   personal agents → personal agent), and write `controls[]` only for its pins.
4. Record `asOf`, a `verified` date per control, advisories from 2025–26, and the docs index.

## Exclusions

Recorded here when a surface is deliberately left out, with the reason.
