# AI tooling registry — validation pass, 2026-09-10

Every URL in `data/tooling/` was opened against the vendor's current documentation and each entity
was checked on four questions: does the link resolve to the right page, is each control step's link
the page where an admin performs the step, is the coverage word what the page supports, and is the
entity on the right reference architecture. Seven verification runs, one per vendor group, edited the
files in place; a mechanical sweep then re-fetched every distinct URL.

## Totals

| Vendor group | Entities | Distinct URLs | Corrections | Bot-walled | Dead |
| --- | --- | --- | --- | --- | --- |
| Anthropic coding (Claude Code, web, Agent SDK, Managed Agents) | 4 | 70 | 0 | 0 | 0 |
| Anthropic apps (Chrome, Cowork, Desktop, M365, Tag) | 5 | 81 | 5 | 1 | 0 |
| OpenAI (Codex, Codex cloud, Codex SDK, ChatGPT, MCP tunnel) | 5 | 71 | 7 | 5 | 0 |
| Cursor (IDE/CLI, Cloud Agents, Grok Bot) | 3 | 87 | 25 | 1 | 0 |
| GitHub local (editors, CLI, SDK) | 3 | 95 | 30 | 0 | 0 |
| GitHub hosted (cloud agent, chat) | 2 | 49 | 12 | 0 | 0 |
| Google, OpenClaw, Hermes | 3 | 37 | 8 | 1 | 0 |

Final sweep: 438 distinct URLs, one non-200 (trust.openai.com refuses automation), one cosmetic
redirect (NVD lower-cases the CVE id). No dead links remain.

## Placement and status

All 25 entities stay where they were. Every `status` word was confirmed against the vendor page
(Claude Code on the web preview, Claude Managed Agents beta, Claude Tag beta, Grok Bot beta with
no GA language yet; everything else GA). No coverage word changed except Grok Bot
`capabilityEncryptionKeyManagement` unknown → none, because Cursor's data-governance page scopes
CMEK to Cloud Agent data only.

## What was wrong

Grouped by kind, most frequent first.

**Renamed vendor pages (GitHub, Cursor, Claude).** About 30 docs.github.com URLs returned 200 but
redirected to renamed paths (`concepts/agents/*` → `concepts/enterprise/*`,
`reference/mcp-allowlist-enforcement` → `enterprise-administrators/mcp-private-registry-enforcement`,
the proxy reference → `copilot-allowlist-reference`, the audit-log how-to, the extension install page).
All canonicalised. Same for Cursor's ignore-file page and Claude's Cowork extensions page.

**Steps pointing at concept pages instead of the setting.** Copilot CLI's marketplace-pinning and
OpenTelemetry steps cited overview pages that do not list the keys; both now cite the
enterprise-managed-settings reference. Codex's plugin-restriction step cited the end-user plugins
guide; it now cites managed configuration. Copilot Chat's content-exclusion step cited the concept
page; it now cites the admin how-to. Cursor Cloud Agents' three Admin API endpoints now cite the
Admin API page. Copilot SDK's managed-identity step now cites the Azure managed identity page.

**Wrong key names or values.** Copilot CLI `seatbelt.keychainAccess` → `sandbox.userPolicy.seatbelt.keychainAccess`;
Copilot policy "Configure custom models" → "Enable custom models"; Cursor sandbox `network.default`
→ `networkPolicy.default`; Cursor CLI `--sandbox <mode>` → `--sandbox enabled|disabled`.

**Inverted or overstated claims.** Copilot policy precedence: web search follows the least restrictive
organisation policy, public-code matching the most restrictive; the cloud-agent step said the
opposite and now matches `concepts/enterprise/policies`. Cowork: OTLP export is metadata-only unless
`otlpContentCapture` is on (the file said prompts were exported by default). Cursor Cloud Agents:
Memories are on by default and opt-out, not opt-in; Origin is a one-way mirror, not two-way sync.
Codex: structured OTel export is opt-in but an anonymous usage ping is on by default (the file said
"telemetry is opt-in"). Grok Bot: the entity summary said nothing runs on the member's device, but
the Teams page documents "Execution on Local Computer" (default Always allow); a step was added and
the summary corrected. Copilot SDK: the GA post does not mention managed permissions; they shipped
in SDK v1.0.2 (2026-06-18) and v1.0.13 (2026-09-04) per the changelog. Copilot SDK
`sessionLimits.maxAiCredits` is documented (the note said it was not).

**Misattributed CVE.** CVE-2026-35603 was assigned by Anthropic for Claude Code's ProgramData
managed-settings path. Cymulate's article covers the same class in Cursor, Codex CLI and Gemini CLI,
but those vendors have no CVE and no committed fix. The Cursor, Codex and ChatGPT advisory titles
now say so. CurXecute's fix version was 1.3.9, not 1.3.

**Facts out of date or uncited.** Grok Bot plans widened again on 2026-08-26 to all SuperGrok,
Cursor Pro and Teams plans (x.ai post replaces a third-party source); Cursor's free tier is Hobby;
Copilot editors' Plans fact now cites the plans page; Copilot SDK's Plans fact cites the GA post;
Copilot cloud agent's training and retention fact cites the model-hosting page. Chrome's "still
risky" quote was not on the page (the real wording is "is not zero") and the "off until 10 September"
framing was stale on the day itself; Claude M365 conflated the org-level "work across apps" toggle
with the per-device "work across files" toggle; Desktop's audit export claimed a CSV format the page
does not state.

## Could not be verified (left as written, flagged)

- help.openai.com articles (five) and trust.openai.com / trust.anthropic.com / trust.cursor.com refuse
  or client-render for automation. The links are the right pages; the claims behind them stand on
  search corroboration only.
- Anthropic's own pages disagree on whether Claude for Microsoft 365 sessions reach the Compliance
  API: the office-agents pages say no, the Compliance API reference lists `office_agents/*` as beta.
  The file follows the API reference.
- Copilot editors: the Business default for "Suggestions matching public code" and the exact label of
  the enterprise "disabled everywhere" option are not stated on the fetched pages.
- Copilot SDK `onPermissionRequest` deny-by-default without a handler has only third-party
  corroboration.
- SpaceX's close of the Cursor acquisition is 2026-08-14 on docs.x.ai and 2026-08-15 in TechCrunch;
  each entity cites its own source.
- Claude Desktop "30+ event types" could not be recounted from the client-rendered audit-log table.

## Placement questions raised

None. Every verifier independently confirmed the current architecture for its entities, including
the owner's explicit calls (Claude Code and Cowork on third-party coding agents, Claude in Chrome on
browser AI, OpenClaw and Hermes on the personal agent).
