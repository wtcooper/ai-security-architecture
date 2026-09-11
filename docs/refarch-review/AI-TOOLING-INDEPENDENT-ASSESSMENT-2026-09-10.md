# AI Tooling capability — independent assessment

**Review date:** 2026-09-10  
**Repository baseline:** `15d5b5411ffbdafea9024134721738d4fab1196e`  
**Status:** Review complete; findings not yet remediated  
**Decision:** Suitable as a researched product catalogue, but not yet suitable as an authoritative
control-coverage matrix

## Executive assessment

The AI Tooling capability is unusually well sourced. The current registry contains 25 tool records
from seven vendors, 518 product-to-control ratings, and 532 distinct outbound URLs. The link set is
healthy: no dead URLs or invalid fragments were found, and most operator steps lead to specific
vendor documentation rather than generic product pages.

The principal weakness is not link quality. It is the meaning created by combining a tool with one
reference architecture and then rating that tool against every control pinned to that architecture.
Four entries are not products that instantiate their assigned architecture, several records combine
surfaces with materially different custody or administration, and the current `native` label is
applied to developer hooks and user choices even though the interface defines it as an
administrator-settable product control.

Consequently, the catalogue is useful for research and discovery, but some green/native results can
overstate what an enterprise administrator can actually enforce. The architecture control sets are
generally coherent; the material errors arise primarily from tool-to-architecture assignment,
entity boundaries, and coverage semantics.

### Overall verdict

| Assessment area | Verdict | Basis |
| --- | --- | --- |
| Product inventory | Pass | The declared vendor and product scope is represented comprehensively. |
| Reference-architecture control sets | Pass with qualification | The pinned sets are internally coherent; no systemic missing-control class was identified. |
| Tool-to-architecture mapping | Needs correction | SDKs, the MCP tunnel, and mixed-custody variants distort inherited control requirements. |
| Product control ratings | Needs correction | `native` conflates administrator configuration, user choice, and developer implementation. |
| URL validity | Pass | 532/532 destinations were found to be live or browser-accessible. |
| Link relevance | Mostly pass | A small number of links are secondary, broader than the claim, or contrary to the stated sourcing protocol. |
| Evidence traceability | Needs correction | 87 control rows have no control-scoped evidence URL despite carrying a verification date. |
| Build and schema integrity | Pass with qualification | The build succeeds, but the schema does not enforce control evidence or verification semantics. |

## Scope and method

This was a read-only, independent review of the AI Tooling data and its relationship to the reference
architecture catalogue. It did not test vendor products in live tenants and is not a certification of
vendor controls.

The review covered:

1. Every current tool record under [`data/tooling/`](../../data/tooling/).
2. Every reference architecture used by at least one tool.
3. All 518 tool-to-capability coverage rows.
4. The coverage labels shown to users and the build-time validation applied to the registry.
5. All 1,468 URL occurrences, representing 532 distinct destinations.
6. The existing tooling validation report and the registry's own inclusion and evidence rules.

The assessment applied four questions to each record:

1. Does this product or component actually instantiate the assigned reference architecture?
2. Does the entity combine variants whose architecture, custody, or administrative mechanism differs?
3. Does each coverage word mean what the user interface says it means?
4. Does the cited page directly substantiate the claim or operator action?

Build verification completed successfully with `npm run build`. The lint run completed with two
unrelated existing warnings; neither affected the tooling data assessment.

## Current inventory

Only six of the fifteen active reference architectures currently have tool records.

| Reference architecture | Tools | Controls per tool | Product-control rows |
| --- | ---: | ---: | ---: |
| Multi-agent workflow | 3 | 25 | 75 |
| Browser AI agents & extensions | 1 | 18 | 18 |
| Third-party coding & desktop agents | 7 | 21 | 147 |
| Personal autonomous agent | 2 | 22 | 44 |
| Enterprise AI chat with connectors | 6 | 20 | 120 |
| API/SDK managed agent runtime | 6 | 19 | 114 |
| **Total** | **25** | — | **518** |

Coverage distribution:

| Coverage | Rows | Share |
| --- | ---: | ---: |
| Native | 159 | 30.7% |
| Partial | 226 | 43.6% |
| None | 57 | 11.0% |
| External | 75 | 14.5% |
| Unknown | 1 | 0.2% |

The build currently confirms that a tool references an existing architecture and that every claimed
capability is pinned to that architecture. It does not establish that the tool instantiates the
architecture, that every inherited control is applicable to that tool, or that the coverage claim is
supported by evidence.

## Findings

### P1 — SDKs are implementation components, not Multi-agent Workflow deployments

**Affected records:** Claude Agent SDK, GitHub Copilot SDK, Codex SDK

The [Multi-agent Workflow architecture](../../data/reference/architectures/cloud-agent-workflow.yaml)
defines a hosted system started by requests, schedules, or events, with durable orchestration,
supervisor-to-subagent delegation, a journal, and a governed gateway. The three SDK records instead
describe libraries or local runtimes embedded in applications controlled by the customer:

- [Claude Agent SDK](../../data/tooling/anthropic/claude-agent-sdk.yaml) explicitly says the agent
  loop runs in the customer's process and that nothing is hosted by Anthropic.
- [GitHub Copilot SDK](../../data/tooling/github/copilot-sdk.yaml) says the customer owns routing,
  authentication, session ownership, tool registration, secrets, and scaling.
- [Codex SDK](../../data/tooling/openai/codex.yaml) says execution occurs wherever the host runs.

Anthropic's [official Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview) similarly
describes the SDK as a library, while Managed Agents is a separate hosted service.

An SDK can be used to build a single interactive agent, an API backend, a scheduled job, or a durable
multi-agent workflow. The SDK alone does not determine which architecture exists. Assigning each SDK
to `archAgentWorkflow` forces it to answer 25 controls that belong to a specific deployed system.

**Required correction:** Treat SDKs as implementation components or introduce deployment profiles
that map an SDK-based system to the architecture it actually creates. Do not inherit the Multi-agent
Workflow control set from the presence of an SDK alone.

### P1 — Secure MCP Tunnel is a transport component, not Enterprise AI Chat

The [Secure MCP Tunnel record](../../data/tooling/openai/secure-mcp-tunnel.yaml) states that the tunnel
performs no inference. It establishes outbound connectivity between private MCP servers and ChatGPT,
Codex, or the Responses API. OpenAI's
[Secure MCP Tunnel documentation](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)
describes the same transport role.

The [Enterprise AI Chat architecture](../../data/reference/architectures/saas-enterprise-ai-chat.yaml)
instead represents a workforce assistant with user sessions, file uploads, connector grants, tenant
boundaries, retention, and audit export. The tunnel is used by such products, but it is not itself that
product. The assignment produces chat-specific rows that are meaningless for a transport binary,
including browser inspection, human approval, and tenant discovery controls.

**Required correction:** Represent the tunnel as a component or exemplar used by the relevant
architectures. If components must remain in the tooling registry, give them component-specific
capability mappings rather than a full product control column.

### P1 — Coverage terminology overstates administrator control

The UI defines `native` as **Admin-settable** and explains it as: “An administrator can switch this on
in the product itself.” See [`labels.ts`](../../src/components/tooling/labels.ts) and
[`ToolsForArchitecture.tsx`](../../src/components/tooling/ToolsForArchitecture.tsx).

The data uses `native` for at least three different implementation modes:

1. An enterprise administrator can centrally enforce the setting.
2. An individual user can choose the setting.
3. An application developer can implement the behavior with callbacks, hooks, or code.

Those modes have materially different assurance value. A developer callback available in an SDK is
not equivalent to an administrator-enforced tenant policy, and a per-user approval preference is not
an administrative control.

Confirmed examples:

| Tool and capability | Current | Assessment |
| --- | --- | --- |
| Claude in Chrome — HITL | Native | Should be partial: the record says approval mode is a per-user choice and an admin cannot force manual approval. |
| Claude/Copilot Agent SDK — HITL and runtime enforcement | Native | Developer-integrated, not administrator-settable in the SDK product. |
| Cursor — audit logging | Native | Should be partial against the current capability definition; tamper evidence and retention are explicitly not established. |
| Cursor Cloud Agents — audit logging | Native | Should be partial; agent responses and code are not logged, and record integrity and retention are not established. |
| Cursor Cloud Agents — rate limiting | Native | Should be partial; financial limits exist, but tool-depth and run-duration bounds do not. |
| Hermes — rate limiting | Native | Strong execution bounds exist, but no hard token or monetary-spend control is identified. |
| ChatGPT — agent registry | Native | Marketplace and GPT listings do not establish ownership, declared capabilities, approval, and reconciliation. |
| Secure MCP Tunnel — agent registry | Native | A tunnel list is not an authoritative agent-and-tool registry; the row becomes inapplicable if the tunnel is remodeled. |

The audit-logging capability requires tamper-evident, append-only records bound to cryptographic
identities and retained for attribution. Seven products currently claim native audit logging. Those
rows should all be re-reviewed against that complete definition; ordinary activity logs or
OpenTelemetry exports do not establish non-repudiation by themselves.

**Required correction:** Separate implementation method from control completeness. A workable model
would be:

- `implementation`: `adminConfigurable`, `userConfigurable`, `developerIntegrated`, `external`,
  `absent`, or `unknown`
- `completeness`: `full` or `partial`

If the schema remains unchanged, the UI should describe `native` as vendor-native support rather than
administrator-settable enforcement, and every existing rating must be re-evaluated under that weaker
meaning.

### P2 — Several entities combine materially different product surfaces

The registry's [inclusion rule](../../data/tooling/README.md) says one entity represents one
**product × reference architecture**, and a variant becomes a separate entity when its architecture
or administrative mechanism differs. The following records do not consistently follow that rule.

#### Claude Cowork

[Claude Cowork](../../data/tooling/anthropic/claude-cowork.yaml) combines:

- local desktop sessions in an endpoint VM;
- cloud sessions on Anthropic infrastructure;
- browser and mobile surfaces;
- Dispatch and scheduled background tasks.

The record itself says device-managed settings do not reach cloud sessions. That is a direct
administrative-boundary difference and therefore meets the repository's split criterion.

#### ChatGPT Enterprise

[ChatGPT Enterprise](../../data/tooling/openai/chatgpt.yaml) combines SaaS chat, desktop packaging,
Work Local, Work Cloud, a hosted browser, and a Chrome extension. The chat tenant, local execution,
hosted agent, and browser-control surfaces expose different data paths and controls.

#### Claude Code and Codex

[Claude Code](../../data/tooling/anthropic/claude-code.yaml) and
[Codex](../../data/tooling/openai/codex.yaml) include GitHub Actions variants under the endpoint coding
architecture. That architecture explicitly states that CI-hosted execution uses the runner's
credentials and belongs in the cloud agent drawings.

#### Hosted product families

[Cursor Cloud Agents](../../data/tooling/cursor/cloud-agents.yaml) combines its core cloud agent,
self-hosted machines, chat integrations, Bugbot, Security Agents, Approval Agents, and automations.
[GitHub Copilot cloud agent](../../data/tooling/github/copilot-cloud-agent.yaml) combines GitHub's
agent, code review, third-party partner agents, Agent Apps, and Agentic Workflows. These products may
share infrastructure, but they do not necessarily share ownership, administration, control coverage,
or vendor assurance.

**Required correction:** Split only where custody, architecture, or administrator mechanism actually
changes. Shared UI shells can remain variants; cloud execution, CI execution, third-party agent
custody, or materially different policy planes should not.

### P2 — Managed-runtime scope and title are inconsistent

The architecture named **API/SDK managed agent runtime** is used for API-driven runtimes, hosted
coding agents, scheduled agents, and persistent UI-driven assistants. Its detailed description is
broad enough to discuss managed harnesses, but its title and summary imply that the customer owns the
front end and drives the service through an API or SDK.

This creates ambiguity for Claude Code on the web, Codex cloud, Cursor Cloud Agents, GitHub Copilot
cloud agent, and Grok Bot.

**Required correction:** Either rename and redefine the architecture as a broader
**Vendor-hosted agent runtime** pattern, or separate API/SDK runtimes from vendor-delivered hosted
agents. The present placement is defensible only under the broader interpretation.

### P2 — Control verification is not evidence-complete

Every one of the 518 current control rows carries a `verified` date, but 87 rows have no
control-scoped URL:

| Coverage | Rows without a control URL |
| --- | ---: |
| None | 57 |
| External | 29 |
| Unknown | 1 |
| **Total** | **87** |

Negative and unknown assertions are especially important to substantiate. A claim that a vendor does
not provide a control should identify the documentation set searched, a relevant limitation page, or
the basis for the conclusion. The current generic tool-level `sources` collection does not show which
source supports which row.

The most direct contradiction is Gemini CLI's AI BOM row: it says the issue was “not checked” and the
mechanism is “Not verified,” but the row still has a `verified: 2026-09-10` date.

The TypeScript schema makes step URLs and verification dates optional. The build validates step
titles and bodies but does not require a URL, verify that a row has scoped evidence, or distinguish
“research performed” from “control verified.”

**Required correction:** Add a control-level `evidence` collection separate from operator `steps`.
Require at least one evidence URL for every row, including `none`, `external`, and `unknown`. Reserve
`verified` for claims actually checked and use a separate `reviewed` date for an inconclusive search.

### P2 — A small number of links do not fully substantiate their claims

The following are relevance defects, not broken URLs:

1. **Claude Managed Agents — rotate and revoke.** The step links to the webhooks page. That page
   supports the refresh-failure subscription, but not the update and archive operations that make up
   most of the instruction. Link to the vault update/archive API documentation, retaining webhooks as
   a secondary link.
2. **Claude Managed Agents — check posture from the API.** The instruction spans environments,
   agents, sessions, and budgets, but links only to the environments page. Add the corresponding API
   references or narrow the instruction.
3. **Codex cloud — encryption key management.** The OpenAI Trust Portal is appropriate evidence for
   third-party risk management, but a certification scope is not sufficient evidence for encryption
   implementation or the absence of workspace CMEK. Use specific encryption and data-control
   documentation.
4. **GitHub Copilot Chat — CamoLeak.** The Legit Security article is relevant independent research,
   but the registry says every entry is sourced from the vendor's own documentation. Add a first-party
   GitHub advisory or changelog if one exists, or amend the research protocol to allow clearly labeled
   independent security research.

Trust-center roots used for TPRM controls were not considered low-value generic links. In those rows,
collecting SOC, ISO, and related assurance artifacts is the operator action, and the trust center is
the correct destination.

### P3 — The validation report is stale

[`VALIDATION-2026-09-10-TOOLING.md`](../VALIDATION-2026-09-10-TOOLING.md) reports a final sweep of
438 distinct URLs. The current registry contains 532. Its vendor totals predate the completed
OpenClaw/Hermes control records and subsequent link additions.

**Required correction:** Update the report with the current inventory and identify whether its totals
describe an intermediate or final state. Validation reports should be generated from the same dataset
used by the application where possible.

## Link audit

### Results

| Metric | Result |
| --- | ---: |
| URL occurrences | 1,468 |
| Distinct destinations | 532 |
| Direct successful responses | 529 |
| Automation-blocked but browser-valid | 3 |
| Confirmed dead links | 0 |
| Invalid URL fragments | 0 |

The three automation-blocked destinations were:

- [Admin controls, security, and compliance for plugins and apps](https://help.openai.com/en/articles/11509118)
- [OpenAI Compliance Platform for Enterprise and Edu Customers](https://help.openai.com/en/articles/9261474)
- [OpenAI Trust Portal](https://trust.openai.com/)

All three were independently opened and found to be live and relevant to their associated claims.
The NVD page for CVE-2026-25253 returned a client-rendered shell to the mechanical crawler but used a
valid canonical URL and was not classified as dead.

### Link-quality conclusion

The registry does not have a generic-link problem at scale. Most control steps link to precise vendor
configuration or reference pages. The link work is one of the strongest parts of the capability.
Remaining work should focus on claim-to-source precision and evidence completeness rather than broad
URL replacement.

## Tool placement disposition

“Keep” below addresses architecture placement only; it does not certify every control rating.

| Tool | Current architecture | Disposition |
| --- | --- | --- |
| Claude Agent SDK | Multi-agent workflow | Re-model as an implementation component or deployment-specific profile. |
| Claude in Chrome | Browser AI agents & extensions | Keep; correct administrator-versus-user coverage ratings. |
| Claude Code | Third-party coding & desktop agents | Keep endpoint variants; split GitHub Actions into a cloud/CI entity. |
| Claude Code on the web | API/SDK managed agent runtime | Keep only under a broadened vendor-hosted runtime definition. |
| Claude Cowork | Third-party coding & desktop agents | Split local endpoint and cloud/background variants. |
| Claude web, mobile and Desktop | Enterprise AI chat | Keep. |
| Claude for Microsoft 365 | Enterprise AI chat | Keep. |
| Claude Managed Agents | API/SDK managed agent runtime | Keep; correct the identified evidence links. |
| Claude Tag | Enterprise AI chat | Keep. |
| Cursor Cloud Agents | API/SDK managed agent runtime | Keep core service under a broader runtime definition; split materially different self-hosted and specialized-agent surfaces. |
| Cursor | Third-party coding & desktop agents | Keep; reassess native audit coverage. |
| Grok Bot | API/SDK managed agent runtime | Conditional: suitable as vendor-hosted runtime, not specifically API/SDK runtime. |
| GitHub Copilot Chat on github.com | Enterprise AI chat | Keep; resolve first-party versus independent source policy. |
| GitHub Copilot CLI | Third-party coding & desktop agents | Keep. |
| GitHub Copilot cloud agent | API/SDK managed agent runtime | Keep base agent under a broader runtime definition; split partner agents, Agent Apps, and workflows where administration differs. |
| GitHub Copilot in editors | Third-party coding & desktop agents | Keep. |
| GitHub Copilot SDK | Multi-agent workflow | Re-model as an implementation component or deployment-specific profile. |
| Gemini CLI | Third-party coding & desktop agents | Keep; fix the AI BOM verification contradiction. |
| Hermes Agent | Personal autonomous agent | Keep; reassess rate-limiting completeness. |
| ChatGPT Enterprise | Enterprise AI chat | Keep core chat; split Work execution and browser-agent surfaces where their architecture or administration differs. |
| Codex | Third-party coding & desktop agents | Keep endpoint variants; split the GitHub Action. |
| Codex cloud | API/SDK managed agent runtime | Keep only under a broadened vendor-hosted runtime definition. |
| Codex SDK | Multi-agent workflow | Re-model as an implementation component or deployment-specific profile. |
| Secure MCP Tunnel | Enterprise AI chat | Remove as a product column; model as a transport component or component-specific record. |
| OpenClaw | Personal autonomous agent | Keep. |

## Control and evidence inventory by tool

The last column counts controls without a control-scoped step URL. `N/P/0/E/U` means
native/partial/none/external/unknown.

| Tool | Controls | N/P/0/E/U | No control URL |
| --- | ---: | --- | ---: |
| Claude Agent SDK | 25 | 4/12/5/4/0 | 5 |
| Claude in Chrome | 18 | 4/7/0/7/0 | 0 |
| Claude Code | 21 | 7/9/2/3/0 | 2 |
| Claude Code on the web | 19 | 3/12/2/2/0 | 2 |
| Claude Cowork | 21 | 8/9/1/3/0 | 1 |
| Claude web, mobile and Desktop | 20 | 8/9/0/3/0 | 0 |
| Claude for Microsoft 365 | 20 | 2/12/1/5/0 | 1 |
| Claude Managed Agents | 19 | 10/7/0/2/0 | 0 |
| Claude Tag | 20 | 6/11/1/2/0 | 1 |
| Cursor Cloud Agents | 19 | 8/6/2/3/0 | 4 |
| Cursor | 21 | 8/8/3/2/0 | 3 |
| Grok Bot | 19 | 6/6/4/3/0 | 6 |
| GitHub Copilot Chat on github.com | 20 | 2/10/3/5/0 | 7 |
| GitHub Copilot CLI | 21 | 9/7/2/3/0 | 4 |
| GitHub Copilot cloud agent | 19 | 7/9/1/2/0 | 2 |
| GitHub Copilot in editors | 21 | 8/8/2/3/0 | 3 |
| GitHub Copilot SDK | 25 | 6/12/6/1/0 | 7 |
| Gemini CLI | 21 | 5/10/3/2/1 | 5 |
| Hermes Agent | 22 | 9/8/4/1/0 | 5 |
| ChatGPT Enterprise | 20 | 6/9/0/5/0 | 3 |
| Codex | 21 | 7/9/2/3/0 | 4 |
| Codex cloud | 19 | 5/10/1/3/0 | 3 |
| Codex SDK | 25 | 6/14/4/1/0 | 5 |
| Secure MCP Tunnel | 20 | 5/4/5/6/0 | 10 |
| OpenClaw | 22 | 10/8/3/1/0 | 4 |

## Remediation sequence

The following order avoids re-reviewing control rows that will later move or disappear.

1. **Correct the entity model.** Remove the tunnel from the product grid, decide how SDKs are
   represented, and split mixed-custody variants.
2. **Resolve the managed-runtime definition.** Rename/broaden it or create separate hosted-agent and
   API/SDK runtime architectures.
3. **Correct the coverage schema and UI.** Separate implementation method from completeness, then
   migrate the 518 rows.
4. **Re-rate controls after placement is stable.** Start with HITL, audit logging, agent registry,
   rate limiting, and key management because those have confirmed semantic mismatches.
5. **Add control-scoped evidence.** Require evidence for negative, external, and unknown findings as
   well as positive settings.
6. **Correct the identified link relevance issues.** Preserve trust-center links where TPRM is the
   actual control action.
7. **Regenerate the validation report and re-run the crawler.** Record exact counts from the final
   dataset and distinguish bot walls from dead pages.
8. **Run build and lint verification.** Confirm that entity splits preserve complete architecture pin
   coverage and introduce no rendering regressions.

## Acceptance criteria

The capability can reasonably be treated as an authoritative control matrix when all of the following
are true:

- Every tool entity has one coherent architecture, custody model, and administrative mechanism.
- SDK availability is not presented as proof that a durable multi-agent deployment exists.
- Transport and infrastructure components do not inherit unrelated product controls.
- A native/admin-settable label is used only where an administrator can centrally enforce the
  capability, or the UI clearly states a different definition.
- Full versus partial coverage is tested against the complete capability definition, not one feature
  contained within it.
- Every control row has claim-specific evidence, including absence and unknown findings.
- Every operator link leads to the page that documents the action, with independent research labeled
  separately from vendor evidence.
- The generated validation report matches the current tool, control, and URL counts.
- The data build, application build, and link audit all pass after remediation.

## Final conclusion

The AI Tooling capability has a strong factual foundation and excellent URL hygiene. It represents
real products in meaningful detail and generally uses high-value vendor documentation. The work
should be preserved and refined rather than rebuilt.

The current weakness is assurance semantics: product components and mixed surfaces are sometimes
treated as complete architectural instances, while feature availability is sometimes presented as
administrator-enforceable control coverage. Correcting those modeling boundaries, separating control
implementation from completeness, and requiring row-level evidence will make the capability suitable
for objective architecture and governance decisions.
