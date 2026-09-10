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

## Coverage status

Verified 2026-09-10 for Anthropic, OpenAI, Cursor and GitHub: every entity addresses every
capability pinned on its architecture. `toolOpenclaw` and `toolHermes` were carried over from the
earlier guidance registry with their admin items only; they carry no control rows yet, and
`docs/AUDIT.md` §5b lists them as unaddressed until someone runs the `tooling-onboard` skill on
them.

## Exclusions

Recorded here when a surface is deliberately left out, with the reason.

- Cursor Origin (git forge, early beta 2026-08-17) — code hosting rather than an agent runtime; the admin disable switch and the code-egress concern are recorded as facts on `toolCursorCloudAgents`.
- OpenAI ChatGPT Atlas — winding down; browser features moved into the ChatGPT app's built-in browser (recorded as a variant of toolChatgptDesktop). The Help Center article "Evolving Atlas into ChatGPT" returned 403 to automated fetch on 2026-09-10.
- OpenAI Agent Builder — scheduled shutdown 2026-11-30 per developers.openai.com/api/docs/guides/agent-builder; ChatKit and the Agents SDK are the replacement.
- OpenAI Managed Agents — DevDay is 2026-09-29 and nothing has shipped; nothing to verify.
- ChatGPT Workspace Agents (research preview) — no official page resolved on 2026-09-10 (openai.com/business/workspace-agents and openai.com/index 403, learn.chatgpt.com guesses 404, help.openai.com 403); only a "Workspace Agents" access-token scope on learn.chatgpt.com/docs/enterprise/access-tokens confirms it exists, so no control row could be verified.
- GitHub Copilot Extensions (GitHub Apps) — retired 2025-11-10; superseded by MCP servers.
- GitHub `gh copilot` CLI extension — retired 2025-10-25; Copilot CLI (toolCopilotCli) replaces it.
- GitHub Copilot Workspace — discontinued; no product page to verify.
- GitHub Spark — retired 2026-08-31; still listed as a column on the supported-surfaces table but no longer shipped.
- GitHub Models — retired 2026-07-30.
- Copilot knowledge bases — replaced by Copilot Spaces (variant of toolCopilotChatGithub).
- Jules, Devin and Cursor agents inside GitHub — announced partners, not shipped as of 2026-09-10; the third-party coding agents page lists only Anthropic Claude and OpenAI Codex.
- Anthropic — Claude Code in Slack (earlier per-user @Claude routing to Claude Code on the web) — being retired on Team and Enterprise in favour of Claude Tag; remains only as the Pro/Max path and is recorded as a variant note on `toolClaudeTag`, with its runtime on `toolClaudeCodeWeb`.
- Anthropic — Code Review, Routines, Ultrareview, Claude Security — features of the Claude Code cloud runtime, recorded on `toolClaudeCodeWeb`, not entities.
- Anthropic — Bedrock / Google Cloud's Agent Platform (Vertex) / Microsoft Foundry / Claude apps gateway / LLM gateway routing — deployment facts on `toolClaudeCode` and `toolClaudeDesktop`, not entities.
- Anthropic — Claude Desktop on 3P — a deployment mode of Claude Desktop (variant on `toolClaudeDesktop`), not a separate product.
- Anthropic — Computer use, Skills, the connector directory and the Developer Console — features and planes, recorded as facts and steps on the entities that expose them.
