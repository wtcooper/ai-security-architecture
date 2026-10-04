# API/SDK managed agent runtime — review

## Verdict and coordination

Keep the architecture's distinction between a customer application and a provider-operated loop. The current revision correctly exposes the vendor-direct MCP route and explicitly disables other external routes. However, its custom-tool callback path remains incomplete, several identity pins do not match their definitions, and the guidance still claims gateway coverage for traffic that bypasses it.

Review began after the other architecture reviews, as requested while another agent worked on this design. Its SHA-256 was unchanged from our initial snapshot when this review began: `4a70f6a7b48018db1fdaea3ebbadef603b444c703c5732d8095f771c37668691`. This is a review of that version, not an assertion that the other agent has finished. Final manifests record whether it changed again.

Inputs: [architecture](../../../data/reference/architectures/saas-managed-agent-runtime.yaml), [guidance](../../../data/reference/guidance/saas-managed-agent-runtime.yaml). Inventory: 17 blocks, 11 edges, 17 capability pins, 10 risk pins.

**October launch follow-up:** the current source matches this assessment. [MV-05/06](managed-runtime-variants.md) adds the OpenAI Agents API browser profile, approval semantics and current provider evidence. MR-04's closed-egress recommendation applies to the selected baseline; an explicitly drawn browser-enabled profile is also valid. MR-07's stale availability concern remains: OpenAI's API is now available in public beta, and its September 29 computer-use addition needs separate coverage.

## Recommendations

### MR-01 · P1 · Complete and secure the application-executed custom-tool path — defect

Evidence: `entry.items[handlers]`, `entry.note`, and scenario “A custom tool runs in our own code” say our application executes a provider-requested tool using our credentials. The graph only shows `managedRuntime->entry` and the result sent back. There is no `entry` edge to the tool/data tier, and no action-policy pin on `entry`. The policy pin on `managedRuntime` admits that custom tools return unevaluated and need the same decision locally. Guidance instead says every route terminates at the gateway.

Change: show `entry->internalTools` or `entry->aiGateway`, whichever actually executes this reference's custom calls, and carry the authenticated user/tenant/session context through it. Pin `cap-agent-action-policy-enforcement` on the application handler if it owns execution; validate tool name, schema, arguments and target, reject replayed call IDs for effects that must run once, enforce resource permissions, and bind required approval to the exact operation before dispatch. Use existing components. The vendor explicitly delegates custom-tool authorization to the application. [Managed Agents permission policies](https://platform.claude.com/docs/en/managed-agents/permission-policies)

Acceptance: a complete custom-tool walk reaches the resource and returns a result; an injected call cannot run merely because it arrived on an authenticated session stream. The diagram and guidance name the same enforcer.

### MR-02 · P1 · Correct identity capabilities and risk tags — defect

Evidence: `D3-MFA @ entry` says only that a user's identity is established. `D3-AA @ managedRuntime` says credentials are inventoried with owners and expiry. Neither note describes its named technique. `riskStaleAgentIdentityBinding @ managedRuntime` is an orphan user credential, not model substitution with retained identity. `riskCrossTenantCredentialPropagation @ tunnel` is tunnel secret theft with no cross-tenant propagation mechanism.

Change: retain MFA only with an explicit second-factor requirement at the human login. Describe workload authentication separately. Move inventory to the existing registry/identity management record; use D3-AA only for actual agent identity verification at its verifier. Retag the orphaned-agent scenario where appropriate as `riskShadowAndUnknownAgents`, or leave ordinary credential lifecycle risk in prose. Replace the tunnel risk with the actual disclosure/impersonation mechanism; retain a cross-tenant tag only if tenant A's credential can reach tenant B. Do not change canonical risk definitions just to retain pins.

Acceptance: each identity pin names a real verification/enforcement action; each retained risk satisfies its canonical definition without stretching its title.

### MR-03 · P1 · Make gateway coverage and direct connector admission truthful — defect

Evidence: `managedRuntime->extTools` correctly bypasses our gateway, and `riskToolSourceProvenance` says the declared servers are vetted by nobody. The guidance item “Bind approvals to exact actions” nevertheless claims everything returning, including connector content and hosted-browser pages, is classified at our crossing. Hosted web/browser tools are disabled in this drawing, and vendor-direct connector responses never cross that component.

Change: state the coverage of each route. For a simple secure baseline, either broker approved external tools at our existing gateway, or retain the direct provider route with pinned/approved tool metadata and customer-configurable provider screening/action policies whose scope is evidenced. Keep the direct route visible if it remains enabled. Reuse `cap-mcp-tool-integrity` at definition admission or the appropriate configurable discovery enforcement point only when its verification actually exists. If unavailable, make the gap explicit and disable high-impact access that depends on it. Do not represent provider assessment as a substitute for validation.

Acceptance: a changed/unapproved manifest has a defined reject or re-approval behavior; no customer-gateway control is credited to the direct route. The guidance no longer describes web tools that the reference disables.

### MR-04 · P2 · Choose one egress and deployment posture — defect / design judgment

Evidence: `nativeTools.note` and the external-route deviation say the sandbox has no external reach; `cap-agent-egress-control @ nativeTools` says named package registries and MCP endpoints are opened. `agentDef.items[environment]` mixes unrestricted egress, host lists and self-hosted workers. The custom-code scenario changes who authors the loop but retains the opaque provider semantics unchanged.

Change: make the pin describe closed runtime egress for this reference. If setup downloads are required, document the bounded preparation stage, artifact verification and closure before execution; draw a supply path only if it matters to the diagram. Treat self-hosted workers and customer-written loops as adaptations that change ownership and enforcement, not scenarios that silently redefine a block. Remove disabled Computer use from the default item list, or label it unmistakably as a disabled option.

Acceptance: notes, pins and walks agree about reachable destinations and component operators. A reader does not need deviations to discover the effective security posture.

### MR-05 · P2 · Add explicit workload bounds and safe output handling — conditional defect

Evidence: guidance mentions session budgets, but no capability pin expresses `AML.M0036`, and no risk pin captures runaway work or spending. The normal walk returns a provider completion through our front end with no output-consumption rule.

Change: require enforced run limits—time, iterations/tool calls and cost where supported—at the managed runtime, with cumulative application limits where repeated sessions can bypass a per-session cap. Pin the existing workload-bounds capability and relevant risk if this is the autonomous reference it claims to be. If the front end renders active HTML/Markdown or consumes structured output, pin output encoding/schema validation at `entry`; otherwise state that it renders inert text. Do not add a separate “guardrail service” box.

Acceptance: the normal configuration bounds expensive or non-terminating sessions; the consuming application has an explicit rule for untrusted output. A vendor's per-session budget does not get reported as an organization-wide spend ceiling. [Provider session-budget semantics](https://platform.claude.com/docs/en/managed-agents/budgets)

### MR-06 · P2 · Narrow memory, credential and vendor-policy claims — defect / conditional defect

- `AML.M0031 @ managedRuntime` says setting scope is the whole control. It is one part: durable state also needs authorized writes, provenance/integrity, retention and recovery. Keep the narrow scope claim or enumerate the actual tenant-configurable features; assure unavailable internals.
- `D3-CTS @ managedRuntime` fits substitution to designated recipients, not the complete per-user authorization policy. Specify issuer/audience validation and recipient restrictions rather than inferring least privilege from a vault. [Current MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
- `cap-agent-action-policy-enforcement @ managedRuntime` is defined locally as deterministic per-operation policy over principal, arguments and resource. Tool-level enablement and an automated safety classifier alone do not establish that entire function. Name which customer-authored decision runs; otherwise use the narrower tool-permissions or human-approval pin. Provider `auto` policy can authorize execution without human review. [Permission policy behavior](https://platform.claude.com/docs/en/managed-agents/permission-policies)
- `cap-agent-kill-switch @ govObservability` appropriately includes interruption and credential revocation. State whether queued/delegated work and application handlers stop too; an alias rollback affects new runs unless existing sessions are also interrupted.

Acceptance: each pin's note limits the claim to supported operations, and the guidance records remaining obligations without presenting them as completed coverage.

### MR-07 · P2 · Keep the architecture independent of one provider's decomposition — design judgment

Evidence: generic notes assert a particular workspace-scoped vault, URL matching, unauthenticated fallback, immutable session sandbox secrets, native coding tool anatomy and universal declarative governance. These are product-specific interfaces. The description simultaneously says both vendors ship the path and that a second vendor is only pre-announced. The low-code comparison implies visual authorship removes ordinary versioning/release controls.

Change: retain the common contract: customer application and reviewed definition; hosted loop and state; customer-configured tools; explicit customer-owned authorization at our systems. Put vault details, model routing, runtime availability and preview status in exemplars/tooling. Explain that visual and code-authored agents both need versioned releases and review. Keep the tool-only AI gateway name and contents: that reuse is coherent because its actual role is documented. Avoid adding a skills catalogue or A2A feature solely to satisfy a shared pack.

Acceptance: removing a product's name does not leave its undocumented implementation promoted to an industry-wide requirement.

## Every capability pin

| Capability @ location | Disposition and direct effect |
| --- | --- |
| `D3-MFA @ entry` | Change: identifying a user is not evidence of a second factor. MR-02. |
| `cap-agent-tool-registry @ agentDef->managedRuntime` | Keep as deploy-time registration/admission support; inventory alone does not validate content. |
| `cap-staged-rollout-gate @ agentDef->managedRuntime` | Keep for evaluation, gradual release and rollback; existing sessions need separate interruption. |
| `D3-AA @ managedRuntime` | Change inventory/expiry note to actual authentication or remove duplicate inventory claim. MR-02. |
| `D3-CTS @ managedRuntime` | Conditional: scoped credential substitution fits; least privilege requires additional policy. MR-06. |
| `cap-agent-action-policy-enforcement @ managedRuntime` | Conditional: verify deterministic principal/argument/resource checks; custom handlers require their own pin. MR-01/06. |
| `AML.M0031 @ managedRuntime` | Change “whole control” wording; scope setting is partial memory hardening. MR-06. |
| `cap-ai-vendor-assessment @ managedRuntime` | Keep as supplier assurance; no direct proof of isolation or prevention. |
| `D3-EI @ nativeTools` | Conditional: correct isolation technique; identify selectable setting vs provider assurance. Self-hosted execution is a different ownership profile. |
| `cap-agent-egress-control @ nativeTools` | Change to the closed egress posture the drawing promises; does not govern provider MCP/web services. MR-04. |
| `AML.M0028 @ managedRuntime->extTools` | Keep for permitted tools and delegated scopes; does not verify tool metadata or returned content. MR-03. |
| `D3-CH @ tunnel` | Keep for protecting actual tunnel secrets; never count transport identity as end-user authorization. |
| `AML.M0028 @ aiGateway->internalTools` | Keep for customer-issued tool permissions; include downstream resource entitlement enforcement. |
| `AML.M0029 @ aiGateway->internalTools` | Keep for consequential actions approved before execution; reference flow must actually show approval where it writes. |
| `cap-input-guardrails @ aiGateway` | Keep for returned content on gateway paths only; cannot cover vendor-direct connectors. MR-03. |
| `cap-agent-tracing @ govObservability` | Keep as observation/evidence support; include application handlers and provider routes in correlation. |
| `cap-agent-kill-switch @ govObservability` | Conditional: termination plus revocation must cover active, queued and delegated work. MR-06. |

## Every risk pin

| Risk @ location | Review and direct control relationship |
| --- | --- |
| `riskAgenticDelegationConfusedDeputy @ tunnel` | Keep mechanism, prefer the gateway authorization point; tunnel authentication is not delegated authorization. |
| `riskCrossTenantCredentialPropagation @ tunnel` | Change: no tenant-to-tenant mechanism described. MR-02. |
| `riskSensitiveDataDisclosure @ managedRuntime` | Keep: context custody and memory sharing; scope, retention, permitted data and resource access constrain it. |
| `riskStaleAgentIdentityBinding @ managedRuntime` | Change: orphan-user grant is not model substitution. MR-02. |
| `riskShadowAndUnknownAgents @ agentDef->managedRuntime` | Keep: uncontrolled population; registry supports visibility, mandatory admission/lifecycle enforcement prevents shadow execution. |
| `riskRogueActions @ internalTools->orgData` | Keep: direct action/approval controls apply before the resource effect; include application handler route. MR-01. |
| `riskPromptInjection @ managedRuntime->extTools` | Keep: provider-direct returned content; current customer gateway screening does not apply. MR-03. |
| `riskToolSourceProvenance @ managedRuntime->extTools` | Keep: actual unverified tool descriptions; direct integrity/admission requirement is missing. MR-03. |
| `riskAgenticDelegationConfusedDeputy @ entry->managedRuntime` | Keep: user context can be replaced by service authority; authenticate at entry and re-authorize actual custom actions. |
| `riskPromptInjection @ internalTools->orgData` | Keep: enterprise records can be hostile; screening is partial and must not replace operation authorization. |

## Flow and naming summary

The main SDK → runtime → tunnel → gateway → tool → data round trip is coherent. Keep the visible direct MCP crossing and the explicit statement that our gateway does not inspect provider-internal model traffic. Fix the absent custom-handler dispatch, clarify approval for writes in the normal walk, align sandbox egress prose, and remove ownership-changing scenarios from the current topology. The current generic names mostly work; the larger problem is over-specific item semantics and an incomplete enforcement story.

No architecture changes were made by this review.
