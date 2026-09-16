# AI tooling control remediation — 2026-09-15

Tracker and closing report for the findings in
[AI-TOOLING-CONTROL-AUDIT-2026-09-15.md](AI-TOOLING-CONTROL-AUDIT-2026-09-15.md). Every finding,
control assessment (C01–C38), product priority, link repair and example-status item in the audit
maps to exactly one task below. Success criterion: every task ends `done`, or `not addressed` with
a written justification. Nothing is left implicit.

Baseline: HEAD `4035bad`. Audit counts were reproduced before work began (518 rows; native 159,
partial 226, none 57, external 75, unknown 1; 16 `none` rows saying "not applicable"; 19 `none`
rows recommending customer tooling; all rows `verified: 2026-09-10`; 13 ATLAS and 3 CISA source
links answering 404). The two vendor-doc claims behind F04 were re-fetched and hold: Codex
documents `allowed_approvals_reviewers` and has retired `approval_policy = "untrusted"`; Grok Bot's
Enforce Auto-review guarantees an AI reviewer, and "Ask first" rules are the human gate.

Status values: `done` · `not addressed` (with justification). No task is left `pending`.

## Result in numbers

| Measure | Before | After the audit fixes | After F-4 (30 new rows) |
| --- | ---: | ---: | ---: |
| Rows | 518 | 518 | 548 |
| native | 159 | 149 | 169 |
| partial | 226 | 232 | 241 |
| external | 75 | 85 | 85 |
| none | 57 | 32 | 32 |
| notApplicable | — | 20 | 21 |
| unknown | 1 | 0 | 0 |
| Rows whose coverage word changed | | 62 | |
| Rows whose note was written or rewritten | | 236 | |
| Rows carrying an `evidence` entry (absence or integration claims) | 0 | 82 | 83 |
| Rows verified against the vendor on 2026-09-15 | | 4 | 34 |
| Capabilities pinned on `archManagedAgentRuntime` | 19 | 19 | 24 |
| `none` rows whose text says "not applicable" | 16 | 1 (Hermes model scanning, deliberately — see C06) |

Validation: `npm run data` passes with the new build rule (every row has a step url or an
evidence entry); `npx tsc --noEmit` clean; `npm run build` succeeds; `npm run audit` regenerated
with every tool at 100% addressed; `npm run links` run twice (see A5).

## A. Code

| Task | Finding | Action | Status | Notes |
| --- | --- | --- | --- | --- |
| A1 | F08 | `CellTile` links the component that produced the cell's worst coverage, not the first component with a URL | done | `Cell.decisive` in [model.ts](../../src/components/tooling/model.ts); `configureUrl(cell.decisive)` in [shared.tsx](../../src/components/tooling/shared.tsx). The audit's AIS-2.1 example now links Claude Code's MCP procedure, not permission modes. |
| A2 | F08 | `EnterpriseModules` labels a composite row with every capability, and takes status/posture as the worst across all of them | done | Label joins every abbrev with " + "; status is the worst across the row's capabilities; each posture note is attributed to its capability in the tooltip. |
| A3 | F08 | Composite cells flag a component with no vendor record instead of silently dropping it | done | `Cell.missing`; the tile shows a † with the missing component names in its tooltip. |
| A4 | F01 | Add `notApplicable` to `ToolCoverage`; rank it neutral in composites; reword the `none` blurb; document in README, skill and schema | done | `worstCoverage()` ignores N/A parts and shows N/A only when every part is. The organisation never records a status on an N/A control (`cellFor`, `ControlRowDetail`, hover card). `none` now reads "the organisation covers it by process or its own tooling"; `external` names "a named class of product". |
| A5 | F07 | Link checker | done | `npm run links` → [scripts/check-links.ts](../../scripts/check-links.ts): 581 distinct URLs across the registry and capability sources, with a wall/SPA host list so their non-200s are reported as unverifiable rather than dead. First run found 3 unreachable (two evidence URLs my populator had lifted from notes, removed; openai.com, added to the wall list) and 6 redirects whose path changed — all rewritten to the landed URL. Second run after the repairs: 579 distinct URLs, 0 unreachable, 0 path-changing redirects, 20 unverifiable by automated fetch (13 ATLAS deep links, 4 OpenAI Help Center articles, openai.com, the Gartner reprint, ISO 42001). |
| A6 | F09 | Crosswalk labelled "contributes to" where displayed | done | [CapabilityDetail.tsx](../../src/components/capabilities/CapabilityDetail.tsx), [ControlRowDetail.tsx](../../src/components/tooling/ControlRowDetail.tsx), [CapabilitiesBrowser.tsx](../../src/components/capabilities/CapabilitiesBrowser.tsx). |
| A7 | F07 (L3) | `evidence: [{ title, url }]` on a control row, rendered as "Checked at"; build fails on a row with neither a step url nor evidence | done | [types.ts](../../src/lib/types.ts), [build-data.ts](../../scripts/build-data.ts), [ControlRowDetail.tsx](../../src/components/tooling/ControlRowDetail.tsx). Added while doing L3 because the audit's ask — an evidence route for absence claims without inventing a configuration page — needs a field the coverage word never links to. |

## B. Capability source links (data/overlay/capabilities.yaml)

| Task | Finding | Action | Status | Notes |
| --- | --- | --- | --- | --- |
| B1 | F07 | 13 `atlas.mitre.org/mitigations` links | done, differently from the audit's proposal | The site is a Vue single-page app: its router bundle declares `/:objectTypePlural(tactics\|techniques\|mitigations\|studies)/:id`, and every route — including the long-standing `/techniques/AML.T0051` — answers HTTP 404 with the app shell, then renders client-side. The links were not dead; the HTTP status was misleading. Each is now a deep link to its own mitigation (`/mitigations/AML.M0007` etc.), which is the precision the audit asked for, and the link checker lists atlas.mitre.org as an SPA host. The audit's suggested fallback `github.com/mitre-atlas/atlas-data/blob/main/data/mitigations.yaml` answers 404 itself (`dist/ATLAS.yaml` in that repository is the file that resolves), so it was not adopted. |
| B2 | F07 | 3 dead CISA links | done | Now `cisa.gov/news-events/alerts/2024/04/15/joint-guidance-deploying-ai-systems-securely` (200). The PDF the audit proposed on media.defense.gov answers 403 to non-browser clients, so the CISA alert page, which links it, is the citation. |
| B3 | F07 | 7 OWASP LLM Top 10 links | done | Now the 2026 edition page. The 2026 numbering was confirmed (LLM03 Excessive Agency, LLM04 Supply Chain, LLM06 Unbounded Consumption, LLM07 Misinformation, LLM09 Vector and Embedding Weaknesses, LLM10 Improper Output Handling) and matches every authored title; the generic page shows 2025 numbering. |
| B4 | A5 fallout | 3 sources redirecting to a new path (MCP security best practices, OWASP MCP Top 10, CISA AI Data Security) rewritten to the landed URL | done | 13 occurrences. |

## C. Tool rows, by capability

The rule that decided each capability is written into the `note` of the rows it changed, so the
same mechanism carries the same word on every vendor and a reader can see why.

| Task | Audit ref | Rule applied | Status | Rows changed |
| --- | --- | --- | --- | --- |
| C22 | F04 | Human approval means a person decides before the action; an AI reviewer or a merge gate is credited for what it is | done | Codex: retired `untrusted` step removed, `allowed_approvals_reviewers = ["user"]` step added, sandbox-boundary note (re-verified today). Grok Bot: Ask-first step added as the human gate, Auto-review named as an AI reviewer, local-execution ceiling versus member default stated (re-verified today). Copilot cloud and Codex cloud native → partial and Cursor cloud's note aligned: the PR gates the output, not the actions that produced it. Claude Chrome native → partial (user-operated mode; no admin setting). Claude Agent SDK and Copilot SDK keep native with the ownership note (the application implements the approver and fails closed). Claude Code on the web's merge step says the PR gates the output. Secure MCP Tunnel → notApplicable. |
| C28 | F04 | Native when active work can be stopped or the surface is vendor-hosted; partial when only future access is blocked and a running local process continues; every row states the delay | done | Copilot CLI, Codex and Codex SDK native → partial. Delay notes on all 25 rows, including "the docs state no propagation delay, so measure it" where that is the truth. |
| C02 | F02 | Retention, deletion and export are lifecycle; DSPM is discovery, classification and posture | done | Claude chat native → partial; five other notes narrowed; Tunnel → notApplicable. |
| C35 | F02 | The posture engine is a third-party product; a readback API is its input | done | All Claude rows (chat, Code on the web, M365, Managed Agents, Tag) native/partial → external, matching every other vendor; notes name the readback API as the integration input. |
| C10 | F02 | Partial where the vendor offers a tenant or IP restriction the edge enforces; external where the product side is ordinary HTTPS | done | Claude chat native → partial; ChatGPT external → partial (allowed_chatgpt_workspaces, IP restrictions); Chrome, M365 notes say the vendor-side feature is credited on the chat entity; Tunnel → notApplicable. |
| C01 | F02 | Partial = the product restricts a data path or offers a content-inspection attach point; every row says which | done | Claude Agent SDK external → partial (aligned with Claude Code, Gemini, Copilot SDK); path-restriction-not-inspection notes on Claude Code, Chrome, Cowork, chat, M365 (post-action telemetry), Copilot chat, Copilot SDK, Codex SDK, OpenClaw (log redaction). |
| C15 | F02 | Partial = some detection over a named input, or a hook a detector attaches to; rows say what is detected versus contained | done | Gemini CLI none → partial with a detector-attach step (aligned with Copilot CLI/SDK); Tunnel → notApplicable; containment-not-detection notes on 10 rows. |
| C16 | F03 | Partial = the vendor operates a content safeguard on this product's I/O; none = the product relays a third-party model's defaults | done | Ratings unchanged (the split already followed this rule); the rule written into all six rows that lacked it. |
| C17 | F02 | Instruction configuration integrity is not behavioural guarantee | done | Cursor note appended; other rows already said so. |
| C06 | F01 | notApplicable when the product loads no weights; none when it downloads or loads weights unscanned | done | 10 rows none → notApplicable (a local-provider option is the local server's obligation, said in the note); Hermes and OpenClaw stay none with the reason stated. |
| C04 | F01 | Conditional applicability is not a product gap | done | 3 SDK rows none → notApplicable with a conditional note. |
| C05 | F03 | Version pinning is supporting evidence, not an inventory or signed provenance | done | Codex SDK partial → none (aligned with Claude Agent SDK). Gemini unknown → none: checked today against the npm registry — `@google/gemini-cli` 0.60.0 carries registry signatures but no provenance attestation (re-verified today). |
| C07 | F03 | Native = customer keys; partial = vendor encryption without customer custody; none = an asset stored with neither; every row names asset and key owner | done | Grok Bot none → partial with the Cursor data-governance page as the step (re-verified today: TLS 1.2+, AES-256, CMEK for Cloud Agent data only); Copilot chat and Copilot cloud none → partial with the Copilot Trust Center as the artifact and a note that it is client-rendered and unverified by automated fetch; asset/key-owner notes on 7 more rows. |
| C08 | F05 | Native = an OS/container boundary an admin can require; rows name inside, outside and platform | done | Copilot in editors native → partial (Visual Studio, Xcode, Eclipse, Vim have no sandbox); boundary notes on 9 rows. |
| C09 | F05 | Native = destination policy on the command sandbox and the product's own web tools; partial = one path, a proxy variable, or a fixed design; rows name uncovered paths | done | Secure MCP Tunnel native → partial (outbound-only is design, not policy); the rule explains why Codex is partial while Cursor and Hermes are native; uncovered-path notes on 12 rows. |
| C27 | F03 | Native = an admin allowlist admits servers by identity and can be made exclusive; every row says admission is not integrity | done | Claude Code, Cursor, Gemini CLI, OpenClaw partial → native (Claude Code's exclusive managed-mcp.json is stronger than Copilot CLI's bypassable registry); admission-not-integrity notes on all 13 rows; Hermes stays partial with the reason. |
| C14 | F03 | Native = immutable versions plus progressive exposure plus rollback | done | Claude Managed Agents native → partial. |
| C25 | F03 | Native = an enforced hard bound on runtime, iterations or spend; rows list sub-limits and hard/soft | done | OpenClaw partial → native (aligned with Hermes); sub-limit notes on 6 rows. |
| C26 | F05 | Native = secrets kept outside the model/execution boundary by default or policy; delegation stated separately | done | Copilot SDK native → partial (aligned with Claude Agent SDK); scope and on-behalf-of notes on 6 rows. |
| C29 | F05 | An SDK contributes credential handling; the deployed application's login is the deployer's | done | Copilot SDK native → partial, Claude Agent SDK external → partial, Codex SDK note; all three now agree. |
| C30 | F03 | Supplier evaluation evidence is recorded, not credited | done | Copilot cloud stays partial for the customer-usable validation tools only; Copilot SDK and Managed Agents notes. |
| C11 | F05 | Native = a distinct non-human principal whose lifecycle the organisation manages | done | Secure MCP Tunnel native → partial (an identifier is not a principal); Claude Tag versus Copilot cloud reconciled in both notes (the organisation owns Tag's per-tool accounts; GitHub owns Copilot's app identity); identity-per-action notes on 6 rows. |
| C37 | F02 | Partial = the product surfaces actual unregistered use in a stated scope; external = prevention only | done | Cursor and Claude Tag partial → external (aligned with Claude Code); Gemini and Hermes none → external; Claude chat (domain capture) and OpenClaw (unallowed plugins) stay partial with scope stated. |
| C36 | F02 | External unless the product documents an intake, ownership and approval workflow | done | Claude Tag, Copilot chat, Copilot cloud partial → external. |
| C34 | F05 | notApplicable where there is no browser surface | done | Claude Tag, Secure MCP Tunnel → notApplicable; ChatGPT note scopes partial to the agent browser. |
| C12 | F05 | Storage and ephemeral issuance are separate claims; every row says who can read each secret | done | Copilot chat none → notApplicable (chat holds no agent credentials); reader/issuance notes on 19 rows, including Managed Agents: vault substitution is not tenant-scoped delegation. |
| C03 | F05 | Delegated versus service-owned retrieval, and where authorisation is enforced | done | Codex SDK none → external (aligned with Claude Agent SDK); notes on 6 rows. |
| C13 | F05 | Channel types mapped; no mTLS expectation on stdio | done | OpenClaw note; Hermes already said so. |
| C18 | F05 | Coverage and correlation; emission is not detection | done | Notes on 5 rows. |
| C19 | F02 | Approved configuration versus discovered use | done | Notes on 8 rows. |
| C20 | F05 | Hiding, pre-approving and limiting arguments distinguished; bypass modes and MCP/custom tools named | done | Notes on all 22 rows lacking one. |
| C21 | F05 | Hook API is an integration point; deterministic rules versus classifiers; Copilot editor scope | done | Notes on 11 rows; the Copilot editors row names the two GitHub/VS Code pages' scopes and which is authoritative (L2). |
| C23 | F05 | Retention, integrity and recovery are separate claims | done | Notes on 10 rows, including what can still write to Managed Agents' versioned stores. |
| C24 | F03 | none must not deny an external option | done | Fixed by the reworded `none` blurb (A4); both rows already name the external feed. |
| C32 | F05 | Emission is not non-repudiation | done | Notes on 5 native rows. |
| C31 | C31 | External classifications sound | done | Notes added on the two rows that lacked one (required fields for a detection). |
| C33 | C33 | External classifications sound; sensor scope | done | Host-versus-guest scope notes on Claude Code, Cowork, Cursor. |
| C38 | C38 | External classifications sound | done | Reviewed, no change: every row already names the artifact source and its scope. |
| L1 | F07 links | Managed Agents "Rotate and revoke" | done | Step links the vaults page; the body names the webhooks page for the notification. |
| L2 | F07 links | Copilot editor permission scope | done | See C21. |
| L3 | F07 | Evidence for absence | done | 82 rows rated none, external, notApplicable or unknown that had no step url now carry `evidence`: the vendor's docs index (or first source) with the review date and the reason (applicability / integration point / no setting), plus any page the note already cited that resolves. Two note-cited URLs that do not resolve (an admin console and a container registry) were dropped. |
| L4 | F07 | CVE-2026-25253 | done | GitHub Advisory GHSA-g8p2-7wf7-98mq (200) added as the readable primary advisory beside the NVD record in both places OpenClaw cites it. |

## D. Organisation example (data/org/example/tooling-status.yaml)

| Task | Finding | Action | Status | Notes |
| --- | --- | --- | --- | --- |
| D1 | Org examples | The eight cited statuses | done | Seven moved `enabled` → `inProgress` with notes that name the outcome still missing (DSPM discovery, SSPM baseline comparison, shadow-AI reconciliation, kill-switch stop path untested, secrets not vaulted, rollback not rehearsed); the MCP note states admission-only with the residual accepted; the two model-scanning "gap / not applicable" rows were removed, since a not-applicable control no longer carries an organisation status. |

## E. Documentation and skill

| Task | Finding | Action | Status | Notes |
| --- | --- | --- | --- | --- |
| E1 | F05 | Boundary checklist in the onboarding skill | done | [SKILL.md](../../.claude/skills/tooling-onboard/SKILL.md): "One rule per capability, every vendor", "A related setting is not the control", "Every row states its boundary" (asset, actor, variant, bypass paths, sub-objective; kill-switch delay; who approves). |
| E2 | F01 | README, skill and schema document `notApplicable`, the narrowed `none`, and `evidence` | done | [data/tooling/README.md](../../data/tooling/README.md) gains a "Coverage: what each word claims" section; [schema.md](../../.claude/skills/tooling-onboard/references/schema.md) coverage bullet; skill step 4 and the link-sweep bullet (`npm run links`). |

## F. Deliberately not addressed

| Task | Finding | Justification | Status |
| --- | --- | --- | --- |
| F-1 | F01 | Four-axis rating schema (applicability / delivery / scope / documentation confidence). The defects the audit observed — applicability hidden inside `none`, the `none` blurb denying external options, delivery location read as assurance — are each fixed by narrower means: `notApplicable`, the reworded blurbs, the per-row boundary notes and the `evidence` field. A four-axis schema would multiply every one of 518 rows by four judgements and would not change what an operator does with the grid. If the single word proves insufficient after the rules in the README have been applied for a while, that is the moment to revisit. | not addressed |
| F-2 | F07 | `verified` field semantics. The field records the date the row's steps were checked against the vendor's page, which is what it says; the audit's concern (a supported feature, an absence claim and an unresolved question all dated the same) is answered by the `evidence` entry, whose title states the kind of check and its date, and by resolving the one `unknown`. Four rows re-checked today carry today's date. | not addressed |
| F-3 | F08 | Coverage rank order in composite cells. "A gap anywhere is a gap" is the intended reading of an organisation entry that spans several capabilities; the audit's objection was that the link did not match the word, which A1 fixes. `notApplicable` is excluded from the ranking so it never drags a composite down. | not addressed |
| F-4 | F06 | Product applicability check independent of diagram pins. "Only pinned capabilities" stays the organising rule; the owner chose the fix the rule allows — pins on the drawing — on 2026-09-15. `archManagedAgentRuntime` now pins agent sandboxing and egress control at the built-in tool surface (`nativeTools`), and runtime action authorization, credential isolation and MCP supply-chain security at the runtime (`managedRuntime`), each also listed on its governance block; 24 capabilities, up from 19. Three capabilities had `applies: false` on the SaaS surface in the taxonomy (written for fused chat products); their notes now say they apply to the API/SDK managed-runtime class, dated with the pin. The six hosted products then gained 30 rows through the onboarding skill, every step URL fetched on 2026-09-15 and rated under the same per-capability rules as the rest of the registry: sandboxing native on all six (with self-hosted variants, per-user versus per-session and persistent versus ephemeral boundaries named); egress native on five and partial on Copilot cloud, whose firewall does not cover MCP server processes; runtime enforcement native where the vendor evaluates an author-owned deterministic policy (Claude Code on the web, Managed Agents, Grok Bot) and partial where the only rule engine is repository-owned hooks (Cursor cloud, Copilot cloud) or connector action control alone (Codex cloud); credential isolation native where designated secrets stay outside the execution boundary (Managed Agents vaults, Grok Bot backend tokens, Codex cloud setup-only secrets) and partial where they are readable by commands (Claude Code on the web on Team and Enterprise, Cursor cloud Runtime Secrets, Copilot Agents secrets); MCP supply chain native where an organisation-wide allowlist exists (Claude Code on the web, Cursor cloud, Grok Bot), partial where admission is per definition or per repository (Managed Agents, Copilot cloud), and not applicable to Codex cloud, which has no MCP path into cloud tasks. The example organisation's Managed Agents block carries five new statuses. One vendor contradiction is recorded rather than resolved: OpenAI's environment page says a fresh container per prompt, its Work Cloud security page says no new container per execution. | done |
| F-5 | F07 | Gartner reprint, ISO 42001, OpenAI Help Center, openai.com and the two trust centres answer 403 or a client-rendered shell to automated fetches but open in a browser. They are listed as walled hosts in the link checker so they are reported as unverifiable, never as dead, and the rows that cite them already say the claim was not verified by automated fetch. | not addressed |

## Closing report

Every task above is resolved: 57 done, 4 not addressed with the justification beside each. F-4 was
reopened on the owner's instruction the same day and is done: five pins on the managed-runtime
drawing, three taxonomy applicability notes updated, 30 rows added across the six hosted
products, `npm run audit` showing all six at 24/24, and a link check of the six files and the
drawing with 0 unreachable URLs (one OpenAI Help Center article behind its anti-bot wall, as
before; two of the drawing's own pre-existing sources rewritten to their landed URLs). The
change touches 19 registry files, the capability taxonomy sources, the vendors file, the example
organisation, four source files under `src/`, the build script, a new link-check script, the
registry README and the onboarding skill.

What changed in substance:

- **Two safety-relevant instructions corrected.** The Codex human-approval procedure cited a
  retired setting and omitted the one that keeps the reviewer human; Grok Bot's procedure
  presented an AI reviewer as the human gate. Both were re-verified against the vendor pages
  today and rewritten.
- **62 coverage words moved**, in both directions, so that the same mechanism carries the same
  word on every vendor: 10 downgrades where a related setting had been credited as the control
  (DSPM, SSPM, SSE, staged rollout, PR-gate approval, kill switches with a refresh delay),
  upgrades where an equal mechanism had been rated lower (MCP allowlists on Claude Code, Cursor,
  Gemini; encryption without customer keys; SDK hooks), 20 rows to `notApplicable`, and every
  `none` that recommended a product class to `external`.
- **236 notes now state the boundary** — what is inside, what is outside, who enforces it, and
  which half of a compound control is claimed — and 82 absence rows say where the absence was
  checked.
- **The grid tells the truth about composites**: the word and its link refer to the same
  component, a missing component is flagged, and a not-applicable control neither counts as a
  gap nor carries an organisation status.
- **The example organisation no longer teaches "related setting equals enabled"**.
- **Link hygiene is repeatable**: `npm run links`, with the wall and single-page-app hosts
  documented so a 404 from atlas.mitre.org is not mistaken for a dead link again.

What was verified: YAML parse of every edited file after each batch; `npm run data` with the
new evidence rule; TypeScript; `npm run build`; `npm run audit` (25/25 tools fully addressed);
two link-checker runs (the second: 0 unreachable, 0 path-changing redirects). What was not verified: the rendered grid was not screenshotted (the
Playwright browser was held by another session), so the † marker, the "+"-joined composite label
and the N/A badge were checked by type and build only; and no vendor feature was exercised in a
tenant — as the audit itself notes, a documented control is not a tested one.

No decisions remain open.
