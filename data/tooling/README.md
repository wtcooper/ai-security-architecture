# AI tooling registry

Named products, one entity per **product × reference architecture**, under
`<vendor>/<family>.yaml`. The registry answers the question the taxonomy cannot: *for the tool we
actually run, which of the reference controls does the vendor let us switch on, and where?*

This is the only layer of the repository that names vendors, so the exemplar rule applies to
every entry: dated (`asOf`), sourced from the vendor's own documentation, and every operator step
linking to the page that documents it. Nothing is recalled from memory. `npm run audit` flags
entries older than six months and lists the pinned mitigations each tool does not yet address.

## Inclusion rule

An entity is a product surface that runs an agent, hosts one, serves or trains a model for one, or
feeds one with organisation data: the products of the original vendors in scope (Anthropic,
OpenAI, Cursor, GitHub, Google) plus every named product in a reference architecture's
`exemplars` block. Generic classes and protocols in that block (a specification, "homegrown
harnesses") are not entities; a class exemplar is represented by one named product. A product's UI shells (CLI, IDE
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
    #  managedRuntime | chatIntegration | saasChat | officeAddin | ciIntegration |
    #  sdkFramework | selfHostedServer | remoteMcpServer | saasAgentPlatform | agenticBrowser
    variants:                           # named shells, each with a class from surfaceClasses
      - { name: Claude Code CLI, class: endpointCli, url: ... }
    architecture: archCodingAgentThirdParty   # the ONE architecture it instantiates; its pins are the reference control set
    status: ga                          # ga | beta | preview | announced
    asOf: "2026-09"
    summary: [...]
    facts:                              # canonical labels, in order: Plans · Inference & routing ·
      - { label: Plans, value: "...", url: ... }   # Data leaving the device · Retention & training · Docs index
      - { label: Inference & routing, value: "...", url: ... }
    items:                              # admin-configuration detail (also on the Controls-guidance panel)
      - { title: ..., body: [...], links: [{ title, url }] }
    riskNotes:                          # tool-specific emphasis; risk must be pinned on the architecture
      - { risk: riskPromptInjection, note: ... }
    controls:                           # one row per pinned mitigation the vendor addresses
      - mitigation: capabilityToolPermissionScoping
        coverage: native                # native | partial | none | external | notApplicable | unknown
        mechanism: managed-settings.json (MDM/GPO) or server-managed settings
        steps:
          - { title: Pin permission rules, body: [...], url: https://... }
        verified: "2026-09-10"
    advisories:
      - { title: "CVE-2025-59536 ...", url: ..., date: "2025-10" }
    sources: [{ title, url }]
```

Build rules: the vendor exists; the architecture exists; every `controls[].mitigation` and
`riskNotes[].risk` is pinned on the primary architecture; every step, advisory and source has a
title and a url; `asOf` is present; every control row has either a step with a url or an
`evidence` entry saying where the claim was checked. A tool cannot claim, or disclaim, a control
its drawing does not show — the fix is a pin on the architecture.

## Coverage: what each word claims

One rule per mitigation, applied to every vendor the same way; the rule is written in the
`note` of the rows it decided, so a reader can see why two products with the same mechanism
carry the same word.

- `native` — an administrator (on a personal agent, the user) can switch it on in the product
  and the product enforces it. Says nothing about completeness: the row names what is inside
  the boundary and what is not.
- `partial` — part of the outcome is settable in the product; the rest is process, another
  product, or the deployer's own code (an SDK hook is an attach point, not a control).
- `external` — the product offers nothing itself and a named class of product placed around it
  (EDR, SSE, TPRM platform, SSPM, a governance platform) provides the outcome; the row names
  the integration point the product exposes to it.
- `none` — the vendor offers nothing in the product and no product class fills it; the
  organisation covers it by process or its own tooling. Rare, and the row says what stands in.
- `notApplicable` — the product has no surface for the control (a hosted-inference client and
  model-artifact scanning; an SDK with no vector store and retrieval security). The objective
  belongs to another component or party, named in the row. Not a gap: the grid records no
  organisation status for it, and it never drags a composite cell down.
- `unknown` — could not be confirmed; the note says why.

Three distinctions every row keeps, because the 2026-09-15 control audit found them collapsed:
a related setting is not the control (retention is not DSPM; a settings API is not SSPM; an
allowlist admits servers but does not verify what they serve; a file deny keeps a path out
but inspects nothing); a merge gate approves the output, not the actions taken to produce it;
revoking future access does not stop a running process, so kill-switch rows state the delay.

## Research protocol

Applied by the `tooling-onboard` skill under `.claude/skills/`:

1. Enumerate the vendor's surfaces from its own docs index; decide entity vs variant.
2. Fetch each page; record only settings whose names appear on a page that resolved. A step
   that cannot be verified is `coverage: unknown`, never a guess.
3. Choose the architecture by surface class (coding shells → third-party coding agent;
   vendor-hosted coding sessions started from a local harness, the vendor's web or chat surfaces,
   a repository event or a schedule → coding & desktop session managed agent runtime;
   programmatic API/SDK runtimes → API/SDK managed agent runtime; chat and add-ins → enterprise AI chat; autonomous
   personal agents → personal agent), and write `controls[]` only for its pins.
4. Record `asOf`, a `verified` date per control, advisories from 2025–26, and the docs index.

## Coverage status

Verified 2026-09-10 for Anthropic, OpenAI, Cursor and GitHub: every entity addresses every
mitigation pinned on its architecture. A second pass the same day re-opened every URL against the
vendor pages and corrected about 90 links, keys and claims; the findings and the unverifiable
remainder are in `docs/VALIDATION-2026-09-10-TOOLING.md`. `toolOpenclaw` and `toolHermes` (personal agents) gained their control rows the same day; for a
personal agent the "admin" is the user who runs it, so `native` means the user can set it in the
product's own config, and the grid's band says so.

Re-verified 2026-09-25 against the MITRE capability definitions, for the thirteen entities on the
third-party coding & desktop agent and coding & desktop session runtime drawings: the 65 rows left
`unknown` by the capability migration were rewritten, the 10 missing rows (Credential Hardening on
every hosted entity, four more on `toolClaudeCoworkCloud`) added, and every other row re-checked
against the vendor page it cites. 40 `native` ratings came down, mostly by five rules now written into
the rows: an MCP allowlist admits servers but pins nothing they serve; an AI reviewer is not human
approval and a merge gate approves only the output; a sandbox a user can step out of (an approved
escalation, an unlockable exclusion list) is not a required boundary; a kill switch that only blocks
new sessions is partial unless the stop of a running one is documented; a path exclusion is
minimisation, not detection.

## Exclusions

Recorded here when a surface is deliberately left out, with the reason.

- Cursor Origin (git forge, early beta 2026-08-17) — code hosting rather than an agent runtime; the admin disable switch and the code-egress concern are recorded as facts on `toolCursorCloudAgents`.
- OpenAI ChatGPT Atlas — winding down; browser features moved into the ChatGPT app's built-in browser (recorded as a variant of toolChatgptDesktop). The Help Center article "Evolving Atlas into ChatGPT" returned 403 to automated fetch on 2026-09-10.
- OpenAI Agent Builder — scheduled shutdown 2026-11-30 per developers.openai.com/api/docs/guides/agent-builder; ChatKit and the Agents SDK are the replacement.
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
- Google Antigravity CLI — the consumer replacement for Gemini CLI since 2026-06-18 (unpaid tier and Google One users); not onboarded, its docs were not fetched on 2026-09-10. Gemini CLI remains the Code Assist Standard/Enterprise, API-key and Vertex AI product and is recorded as `toolGeminiCli`.
- Google run-gemini-cli GitHub Action — a CI runtime for the same engine; its advisory GHSA-wpqr-6v78-jr5g is recorded on `toolGeminiCli` because it patched the CLI itself.

## MITRE mitigation scope

`controls[].mitigation` uses a selected native `D3-*` or `AML.M*` identifier. Canonical
definitions come from `data/mitre`; the overlay supplies authored implementation scope.
A migrated row with `migration.reviewRequired: true` has `coverage: unknown`; its steps and
`migration.original` preserve prior evidence, not verified coverage of the new function.
Re-verify each required feature and boundary, set the appropriate coverage and verification
date, and clear the review flag. Do not mark all of `AML.M0020` native merely because a
product implements prompt-injection screening.
