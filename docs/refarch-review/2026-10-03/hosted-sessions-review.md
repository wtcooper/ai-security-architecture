# Hosted coding and desktop sessions — review

## Verdict

Keep this architecture with explicit **coding and general-work task profiles**. Merge review approves a code change after execution; it cannot authorize or undo the tool calls that produced the change. Desktop/document tasks need their own completion and pre-effect approval flow. The [October product update](managed-runtime-variants.md) refines the initial coding-only recommendation and adds a persistent hosted-agent sibling for Dots/Grok Bot. The current drawing mixes task types, product defaults and a customer-hosted worker variant.

Reviewed: [architecture](../../../data/reference/architectures/saas-hosted-agent-sessions.yaml), [guidance](../../../data/reference/guidance/saas-hosted-agent-sessions.yaml). Inventory: 19 blocks, 15 edges, 19 capability pins, 13 risk pins. References below use stable YAML IDs; line numbers describe the reviewed snapshot.

## Recommendations

### HS-01 · P1 · Correct authentication and risk identities — defect

Evidence: `pins.mitigations[D3-AA @ managedRuntime]` (around line 820) describes inventory, ownership and expiry. It never describes verification of an agent's identity. That is already largely covered by `cap-agent-tool-registry @ govSupplyChain`. `riskStaleAgentIdentityBinding @ managedRuntime` describes departed users and abandoned App grants, whereas its canonical definition specifically requires a changed model artifact retaining the old identity. `riskCrossTenantCredentialPropagation @ tunnel` mixes shared environments, cached secrets and a stolen tunnel token without identifying two tenants or cross-tenant credential validity. `riskToolSourceProvenance` concerns tool discovery metadata; its two pins here describe generic dependencies and instruction files.

Change: remove the duplicate inventory-as-authentication claim. If runtime authentication is intended, pin it at the verifier and name credential validation, tenant/session binding and the rejected failure. Replace the orphan-grant example with `riskShadowAndUnknownAgents` where it actually describes unmanaged identities. Remove the cross-tenant pin unless a concrete tenant boundary is specified. Keep tool provenance only for the discovery manifest/schema path; use the existing component-compromise or prompt-injection risks for executable dependencies and malicious instructions, according to the mechanism. Preserve the threat in prose if no catalogue risk fits exactly.

Acceptance: every retained risk note satisfies the canonical risk definition; every authentication pin names a verifier. No new box is needed.

### HS-02 · P1 · Make artifact admission part of the secure baseline — defect

Evidence: `nativeTools->sources`, `sources.note`, and the tool-provenance pin explicitly describe public dependencies as vetted by nobody. The walkthrough installs them, and the final deviation says the drawing shows what ships. A destination allowlist controls where traffic goes; it does not validate a package, publisher, version, setup script or installed skill.

Change: require reviewed setup scripts and pinned, verified dependencies before the agent phase. Enforce verification in the setup runner or use an existing approved registry; a new mirror box is necessary only if it is actually deployed. Scope `AML.M0014` or the applicable integrity capability to the verification operation after correcting the risk tag. Record public/unreviewed setup as an insecure deviation or attack scenario, not the reference's normal operation. Do not imply verification establishes benign behavior.

Acceptance: the normal install walk names the artifact identity, approval/verification check, enforcing component and rejection behavior. Unsigned or changed dependencies cannot become an implicitly approved baseline.

### HS-03 · P1 · Show the connector bypass that determines control coverage — defect

Evidence: `vendorService.items[connectorBroker]` and the deviation at line 1083 say the vendor calls third-party servers directly, but that edge is omitted to preserve one visible external path. Only `aiGateway->extTools` is drawn. Readers can infer that all connector responses pass through our guardrails, although the prose says otherwise.

Change: for the simplest reference, disable direct vendor connectors and show only the customer-brokered path. If direct connectors are part of the intended baseline, add the actual `vendorService->extTools` crossing and place the customer-configurable connector policy there; label returned content as outside our gateway's inspection. This adds at most one edge, not another tier. Keep output-data authorization distinct from prompt-injection screening.

Acceptance: every enabled connector route is visible and its specific permission/content controls can be identified. No claim about `cap-input-guardrails @ aiGateway` extends to a bypass route.

### HS-04 · P2 · Restore consistent ownership and flows — defect / conditional defect

Evidence: `sourceControl` and its deviation explicitly place a rented code host in Enterprise cloud because we control repository policy. This changes the zone axis from operator to policy owner. The self-hosted-worker scenario (line 1034) calls a vendor-zone `nativeTools` block ours and describes `sources` as our private mirror, although that block is public sources. `vendorService->managedRuntime` is one-way configuration, but the walkthrough sends requests through the connector service and returns results there without a runtime/service exchange.

Change: choose a hosted code service or a self-hosted repository and place it by actual operator. Two suppliers can share Vendor platform while notes identify distinct agreements. Keep the worker variant as a separate adaptation note, without replaying false ownership on the current graph. Where two vendor interfaces remain visible, represent the session/tool request and result exchange explicitly; alternatively collapse them into one opaque provider boundary and keep configuration as notes. Do not infer call/response from containment alone.

Acceptance: the same zone always means the same operator; normal and scenario walks do not relocate components in prose; remote session and tool results have a complete return path at the diagram's chosen level of abstraction.

### HS-05 · P2 · Distinguish recommended requirements from product facts — defect

Evidence: the architecture and guidance say every vendor built the same product, a repository credential never enters the sandbox, no product routes inference through the customer, every product supports self-hosted workers, and only a verified human may trigger a run. Other paragraphs admit non-proxied credentials and schedules. These are different kinds of claim.

Change: write the reference as requirements: administrator-approved initiators, constrained repository writes, protected merge, reviewed CI execution, scoped secrets, bounded egress and session limits. An authorized schedule may start a session under a registered, bounded identity; the requirement need not ban all automation. Move provider-specific branch restrictions, secret handling, runner availability and inference routing to dated product evidence. GitHub documents detailed branch and approval restrictions, but those do not establish identical capabilities in every product. Its own documentation also describes scheduled/event-driven automation. [GitHub security guidance](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/risks-and-mitigations)

Acceptance: a reader can distinguish required behavior, observed product behavior and a residual gap without opening every exemplar.

### HS-06 · P2 · Align pins to the precise operation — defect / conditional defect

Evidence and changes:

- `cap-input-guardrails @ managedRuntime->sourceControl`: retain malicious-content screening; remove CODEOWNERS/change approval from this pin's asserted function. Those govern configuration changes.
- `D3-CTS @ managedRuntime`: retain credential substitution/scoping to designated relying parties; do not count transcript redaction or setup-secret deletion as that same technique. Those need their own existing capability if claimed, or a clearly separate requirement in guidance.
- `D3-EI @ nativeTools`: appropriate for sandbox containment, but vendor-internal assurance must not be presented as a customer-enforced toggle. Specify whether the customer selects an isolation mode or verifies a provider guarantee.
- `AML.M0029 @ sourceControl`: keep for approval before merge/workflow execution. State that it does not satisfy approval for privileged writes made by the running agent through `aiGateway->internalTools`; require `cap-agent-action-policy-enforcement` there when such actions are enabled.
- `cap-input-guardrails @ aiGateway`: prompt-attack detection does not authorize disclosure of enterprise records. Name per-resource/user authorization on `internalTools->orgData`; use the already available data-access capability if pinning that function.

Acceptance: pin notes describe one defensible capability; each protected operation has its own enforcing component, and prior merge approval is never inherited by a different action.

### HS-07 · P2 · Reduce the union of optional features — design judgment

The drawing simultaneously includes local handoff, mobile/channel initiation, schedules, hosted desktop operation, repository CI, internal connectors, external brokered tools and self-hosted workers. Preserve the session contract with separate coding and general-work profiles: coding uses reviewed promotion; desktop/document work needs approval at the affected resource before consequential effects. Optional entry points must use the selected deployment consistently. The [managed-runtime supplement](managed-runtime-variants.md) recommends a separate persistent hosted-agent reference for Dots/Grok Bot, refining the earlier suggestion to narrow this whole architecture to coding. `Local applications` is a reasonable reduced-detail name here; it need not be expanded into a full endpoint harness. Drop A2A from the shared `toolServicesRemote` pack if no peer-agent exchange is intended.

Acceptance: every default component and item participates in a necessary normal flow or a clearly relevant threat; optional product features no longer read as universal requirements. Both task profiles have a correct effect/completion gate, and persistent agents do not inherit per-session teardown guarantees.

## Every capability pin

**Keep** means the definition fits the described locus, not that a deployed product has been verified. **Conditional** requires the stated enforcement or provider evidence. Management pins are supporting assurance, detection or response; they are not inline prevention.

| Capability @ location | Disposition and direct effect |
| --- | --- |
| `D3-APA @ vendorService` | Keep: administrator policy on who may enable/start sessions; separate MFA/device assurance if claimed. |
| `AML.M0028 @ vendorService` | Keep: fixed permitted tool/connector set; do not imply it validates every tool argument. |
| `AML.M0036 @ vendorService` | Keep: run/automation budgets directly bound runaway resource use; name enforced ceilings. |
| `D3-APA @ managedRuntime->sourceControl` | Conditional: enforce registered trigger policy; authorized automation is compatible with least privilege. HS-05. |
| `cap-input-guardrails @ managedRuntime->sourceControl` | Change mixed note: input screening fits; CODEOWNERS is not screening. HS-06. |
| `D3-AA @ managedRuntime` | Change: inventory/owner/expiry is not identity verification. HS-01. |
| `D3-CTS @ managedRuntime` | Conditional: credential recipient scoping fits; secret redaction/deletion is separate. HS-06. |
| `AML.M0031 @ managedRuntime` | Keep for persistent agent memory, transcript access and retention; snapshots are covered only to the extent they carry that state. |
| `cap-ai-vendor-assessment @ managedRuntime` | Keep as supporting assurance of provider guarantees, not tenant-isolation enforcement. |
| `D3-EI @ nativeTools` | Conditional: real execution containment; distinguish provider guarantee from customer configuration. HS-06. |
| `cap-agent-egress-control @ nativeTools` | Keep for setup/agent network policy; enumerate exempt connector/model/git paths. Does not prove permitted-host payload safety. |
| `AML.M0028 @ managedRuntime->sourceControl` | Keep as a target requirement for constrained repository operations; verify each product's available granularity. |
| `AML.M0029 @ sourceControl` | Keep for pre-merge/pre-workflow approval only; not prior session actions. HS-06. |
| `D3-CH @ tunnel` | Keep: protect tunnel credential/key; rotation and revocation should be described as distinct operations if credited separately. |
| `AML.M0028 @ aiGateway->internalTools` | Keep for per-principal permitted tools; require downstream resource authorization and exact-action policy as applicable. |
| `cap-input-guardrails @ aiGateway` | Keep for injection screening on returned connector content; no protection for omitted direct vendor routes. HS-03. |
| `cap-agent-tool-registry @ govSupplyChain` | Keep as inventory; prevention requires admission tied to the registry. |
| `cap-agent-tracing @ govObservability` | Keep as evidence collection/detection support; completeness and export availability are conditional. |
| `cap-agent-kill-switch @ govObservability` | Conditional: vendor cancel must stop live work and delegated jobs; deleting an App/seat alone is insufficient. The existing note recognizes this correctly. |

## Every risk pin

| Risk @ location | Review and direct control relationship |
| --- | --- |
| `riskPromptInjection @ managedRuntime->sourceControl` | Keep: untrusted issue/repository context; screening plus constrained actions limits impact. Authorized trigger does not make all read content trusted. |
| `riskPromptInjection @ nativeTools->downstream` | Keep if web access is enabled; egress limits reach but does not make returned content safe. |
| `riskSensitiveDataDisclosure @ nativeTools->sources` | Keep for public package upload/exfiltration; remove gist/repository-host examples from this package-source edge. Use the actual repository edge for those. |
| `riskSensitiveDataDisclosure @ managedRuntime` | Keep: retention/sharing/custody; tenant access/retention and data minimization apply. Assessment is supporting assurance. |
| `riskRogueActions @ managedRuntime->sourceControl` | Keep: unauthorized writes/automation effects; branch controls and pre-effect approval bound this path. |
| `riskAgenticDelegationConfusedDeputy @ managedRuntime->sourceControl` | Keep: attacker-controlled context exercises a legitimate grant; scope plus operation authorization, not authentication alone. |
| `riskToolSourceProvenance @ nativeTools->sources` | Change generic dependency example to exact tool metadata, or retag component compromise; artifact admission missing. HS-01/02. |
| `riskToolSourceProvenance @ sourceControl` | Change generic instruction/hook example to prompt injection or compromised component as appropriate; keep only actual tool manifests under this ID. |
| `riskShadowAndUnknownAgents @ remoteDevice->vendorService` | Keep: unregistered channel/scheduled identities; inventory supports detection, admission/lifecycle enforcement prevents unauthorized execution. |
| `riskRunawayAgentToolLoops @ vendorService->managedRuntime` | Keep: self-triggering schedules; hard budgets, trigger-cycle controls and live cancellation apply. |
| `riskStaleAgentIdentityBinding @ managedRuntime` | Change: note describes orphan grants rather than model/identity substitution. HS-01. |
| `riskCrossTenantCredentialPropagation @ tunnel` | Change unless tenant A can authenticate to tenant B is explicitly shown; generic secret theft is insufficient. HS-01. |
| `riskAgenticDelegationConfusedDeputy @ tunnel` | Keep threat, prefer pin at gateway authorization where delegated authority is exercised; tunnel transport alone does not constrain it. |

## Standards and evidence

- Credential audience, privilege restriction and sender constraint are separate OAuth controls. A tunnel or TLS connection does not itself establish resource authorization. [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html)
- MCP services validate intended token audience and do not forward a received client token as an upstream API credential. This should be explicit in the gateway/tool grant explanation. [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
- Credential Transmission Scoping concerns designated credential recipients; it is not a general name for all secret handling. [MITRE D3-CTS](https://d3fend.mitre.org/technique/d3f:CredentialTransmissionScoping/)
- Cursor documents separate VM, snapshot, conversation and credential lifetimes. Treating sandbox reclamation as deletion of all session data would be wrong. [Cursor security overview](https://cursor.com/docs/cloud-agent/security)

No architecture changes were made by this review. File fingerprints are recorded in the accompanying review manifests.
