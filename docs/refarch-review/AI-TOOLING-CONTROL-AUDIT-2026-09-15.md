# AI tooling and control assessment — 2026-09-15

## Executive assessment

The catalogue is useful as an operator-oriented reference, but its current control ratings are not yet a dependable measure of security coverage. The principal problem is **semantic**, not widespread dead links: a related setting, an integration point, a vendor safeguard and a complete control outcome are repeatedly treated as equivalent.

The recent separation of vendor capability from organization implementation status is a worthwhile improvement. It does not resolve the underlying differences in what each control means. Some entries overstate protection; others create false gaps or underrate legitimate built-in safeguards.

The highest-priority corrections are:

1. Define an acceptance test for each control and distinguish applicability, delivery mechanism, scope and evidence.
2. Correct the human-approval and kill-switch claims before operators rely on them.
3. Stop equating retention with DSPM, settings readback with SSPM, allowlisting with complete supply-chain protection, or anti-exfiltration restrictions with content DLP.
4. Preserve the difference between contributing to an upstream control and satisfying it.
5. Correct two broken control-reference destinations, edition-mismatched citations, and working links that do not support the associated procedure.
6. Make tool applicability independent of which controls happen to be pinned on its reference diagram.

This is a documentation-based, independent-style technical assessment, not a certification, penetration test or attestation of any deployed organization's controls. No product records, ratings, organization statuses or application code were changed.

## Scope and evidence

Snapshot: repository HEAD `4035bad775367dd30f61b29035f65fd574ceb2db`. Review date: September 15, 2026.

| Item | Scope |
| --- | --- |
| Products | All 25 tool records across 7 vendors |
| Tool/control records | All 518 authored mappings |
| Control definitions | All 38 capability classes used by these tools |
| Upstream controls | Read all 35 local CoSAI control descriptions; examined the 38 capability crosswalks, which reach 34 distinct upstream controls |
| Operator references | 756 step URL occurrences; 532 distinct URLs across all fields of tool records |
| Control-definition references | 19 distinct URLs across the 38 definitions |
| Organization examples | Four example tools, 81 per-control statuses; related enterprise capability examples |
| Presentation | Coverage terminology, aggregation, configuration-link selection and enterprise badges |
| Reference architectures | Only their role in selecting tool controls; **not** another diagram, flow, placement or architecture-layout audit |

Reviewed sources include [tool records](../../data/tooling), [capability definitions](../../data/overlay/capabilities.yaml), [upstream control definitions](../../data/cosai/controls.yaml), [example tool statuses](../../data/org/example/tooling-status.yaml), [organization mappings](../../data/org/example/frameworks.yaml), and the tooling UI's [model](../../src/components/tooling/model.ts), [labels](../../src/components/tooling/labels.ts), and [shared components](../../src/components/tooling/shared.tsx).

The prior [September 10 assessment](AI-TOOLING-INDEPENDENT-ASSESSMENT-2026-09-10.md) is context, not the evidence base for this rerun. Comparing its baseline commit `15d5b5411ffbdafea9024134721738d4fab1196e` to this snapshot finds no changes under `data/tooling/`; relevant changes are principally presentation, status examples and a small capability-description edit. The current mapping count is 518.

### Method and limits

- Read every current tool/control mechanism and limitation, compare across vendors, and compare against the control definition and upstream objective.
- Inspect operator procedures and current primary documentation for disputed or consequential claims. This included approval modes, human/automatic reviewers, managed settings, agent permission policies, vaults, compliance exports and source-edition references.
- Fetch every distinct URL authored in the in-scope tool records and capability sources, following redirects and checking response status/title and any authored fragments.
- Review example statuses and code paths that can misrepresent the meaning or source of a combined control.

**Coverage is comprehensive at the record/definition and URL-reachability levels, not at the product-behavior level.** The report does not claim that all 756 procedure steps were executed, that every sentence on all 551 destination pages was independently validated, or that all vendor features were exercised in licensed tenants. Detailed content review was risk-directed. A live URL is not a passed claim. Absence of a documented feature is not proof that no vendor-internal protection exists.

The [518-row ledger](AI-TOOLING-CONTROL-LEDGER-2026-09-15.md) preserves each current claim, limitation and operator link and routes it to the applicable control assessment. It is not a claim that all rows failed. The [551-URL appendix](AI-TOOLING-CONTROL-LINKS-2026-09-15.md) records reachability separately from relevance.

## Findings

Priorities below describe risk of misleading security decisions, not exploit severity in the products.

### F01 — High: one rating conflates applicability, delivery and completeness

**Evidence:** [coverage labels](../../src/components/tooling/labels.ts), all tool records, and the model-scanning/RAG rows.

Current values are `native: 159`, `partial: 226`, `none: 57`, `external: 75`, `unknown: 1`. The UI defines native as admin-settable, external as the product offering nothing itself, and none as neither the product nor anything around it filling the gap.

That is not a stable security taxonomy:

- Sixteen records literally say “not applicable” in their mechanism or note while using `none`. Local model scanning on a hosted-inference client is a clear example.
- Several `none` rows explicitly recommend the customer's inventory, evaluation or scanning tooling, contradicting the displayed assertion that nothing around the product can fill the gap.
- Built-in, always-on safeguards need not have an administrator toggle to be real.
- An SDK callback can enable a customer implementation without providing a completed control.
- An external control can be more complete than a native setting. Deployment location is not assurance quality.

**Recommendation:** separate applicability (applicable / conditional / not applicable), delivery (vendor-operated / product policy / integration / customer-operated), scope and documentation confidence. Retain organization implementation status as a separate axis. If the existing schema is retained temporarily, narrow the label definitions and put these distinctions explicitly in the mechanism and limitation; do not mechanically re-rate every row.

### F02 — High: neighboring safeguards substitute for the named control

**Evidence:** [Claude chat DSPM/SSPM/SSE](../../data/tooling/anthropic/claude-desktop.yaml), [Cursor rules and shadow AI](../../data/tooling/cursor/cursor.yaml), [Codex DLP](../../data/tooling/openai/codex.yaml), and the control-by-control assessments below.

| Current substitution | What it actually establishes | What is still missing |
| --- | --- | --- |
| Retention/delete/export → DSPM | Data lifecycle administration | Discovery, classification and exposure/posture assessment |
| Settings API → SSPM | Configuration evidence/readback | Baseline comparison, drift detection and remediation |
| File deny/egress list → DLP | Source/destination restriction | Sensitive-content inspection on specified data paths |
| Sandbox/approval → injection detection | Containment/action restriction | Detection of malicious instructions on the claimed input boundary |
| Personal-login restriction → shadow discovery | Prevention of some unsanctioned use | Observation and reconciliation of actual unregistered use |
| Admin inventory/analytics → governance platform | Inputs to governance | Accountable intake, risk decision and lifecycle workflow |
| Enforced prompt inclusion → hard behavioral control | Instruction configuration integrity | Deterministic action authorization |

These mechanisms remain useful and should not be deleted. Their claims need to be narrowed or mapped to the right objective. Claude's [Compliance API](https://platform.claude.com/docs/en/manage-claude/compliance-api) documents export/readback facilities; that is evidence for integration, not proof of a standalone posture-assessment engine. Cursor's [rules documentation](https://cursor.com/docs/rules) supports managed instruction delivery, not a guarantee that model behavior always follows those instructions.

### F03 — High: comparable mechanisms receive inconsistent ratings

**Evidence:** the corresponding records in the complete ledger; see assessments C05, C07, C14, C15, C16, C25, C27 and C30.

Examples include:

- MCP endpoint/source restrictions: native in Cowork, Copilot CLI/editors and Codex, but partial for analogous Claude Code/Cursor/Gemini contributions.
- Encryption: no customer-managed keys becomes none in Grok Bot and Copilot chat/cloud, while provider encryption without CMEK remains partial in ChatGPT/Codex cloud.
- Version pinning: Codex SDK receives AI-BOM credit; Claude Agent SDK's bundled binary pin does not.
- Hosted model safeguards, customer evaluation harnesses, version history and spend/loop bounds are each evaluated under different completeness rules.

**Recommendation:** adjudicate the sub-objective first, then apply the same rule to every vendor. Do not resolve inconsistency by downgrading everything or by demanding every example in a broad definition from every product variant.

### F04 — High: human approval and emergency stopping are overstated

**Codex:** the local HITL procedure allows `on-request` but does not require the reviewer to be human. Automatic review is separately configurable, and actions inside permitted sandbox boundaries can run without a new approval. The relevant managed restriction is `allowed_approvals_reviewers`, with a human-only policy where that is the requirement. The docs distinguish the retirement of explicit `approval_policy = "untrusted"` from the continued role of `"untrusted"` in managed allowed-policy/trust handling; the latter should not be reported simply as an invalid setting. See [sandbox and approvals](https://learn.chatgpt.com/docs/sandboxing) and [managed configuration](https://learn.chatgpt.com/docs/enterprise/managed-configuration).

**Grok Bot:** enabling Enforce Auto-review ensures an AI reviewer is used, not that every relevant action reaches a human. The HITL procedure should include the appropriate team Ask first rules. Also distinguish the administrator's local-execution permission ceiling from the member's effective default; the team's “Always allow” ceiling should not be described as universal automatic execution. See [team controls](https://cursor.com/docs/grok-bot/teams).

**Cloud coding agents:** required PR review is a human gate on merge. It does not retrospectively approve external tool calls or network effects performed while producing the PR. Copilot cloud and Codex cloud native ratings versus Cursor cloud partial need the same temporal and action-scope rule.

**Kill switches:** revoking a seat/token can prevent future access without immediately stopping a running local process, delegated work or an already-authorized request. Copilot CLI's record acknowledges a refresh delay of up to an hour yet is native; local Codex and SDK revocation similarly require a separate stop mechanism. Define the maximum cessation/revocation delay and test active, queued and delegated work.

**Recommendation:** write an action-bound human-approval test and a timed stop/revoke test. Where only a merge gate or future-login block exists, label that exact scope.

### F05 — High: scope, ownership and compound requirements are under-specified

**Evidence:** definitions plus SDK, logging, credential, sandbox and encryption records throughout the ledger.

The same row often combines several separately testable outcomes: logging and non-repudiation; secret storage and ephemeral credentials; TLS and key custody; memory retention and poisoning protection; versioning and progressive rollback. A native contribution to one does not establish all of them.

The boundary matters just as much as the feature:

- A shell sandbox does not automatically protect the full application, remote MCP tool or hosted browser.
- A customer-implemented SDK permission callback is not equivalent to a centrally enforced fleet policy.
- A shared workload principal can be useful NHI management without satisfying a stronger per-agent identity-attestation requirement.
- Hidden credentials are not necessarily tenant-scoped credentials.
- Trace emission does not establish detection logic or immutable security records.

The [Managed Agents permission-policy documentation](https://platform.claude.com/docs/en/managed-agents/permission-policies) distinguishes built-in/MCP policy from custom tools handled by the application. That is exactly the kind of boundary each row should retain, including when a setting affects only new sessions.

**Recommendation:** require each record to state the controlled asset/action, enforcing actor, supported variant/version, bypass/uncovered paths and independently applicable sub-objectives. These are precision improvements, not a requirement to turn every record into a full compliance checklist.

### F06 — High: diagram membership is being used as the tool's complete applicability assessment

**Evidence:** [view-model comments and row selection](../../src/components/tooling/model.ts), the onboarding rules, and the six managed-hosted records.

Claude Code on the web, Claude Managed Agents, Cursor Cloud Agents, Grok Bot, Copilot cloud agent and Codex cloud all lack rows for sandboxing, egress control, runtime action authorization, credential isolation and MCP supply-chain security because their common architecture does not supply those rows. Several of the products' own descriptions discuss mechanisms directly relevant to these topics.

This is a catalogue-selection finding, not a conclusion that every one of those 30 potential mappings should be added or marked native. Some safeguards are vendor-internal, some customer-configurable, some relevant only to a variant, and some out of scope. A diagram's ownership rules may reasonably omit vendor-internal implementation details; a product security assessment still needs to state that responsibility and evidence.

**Recommendation:** keep architecture pins as a view/filter, but perform a product applicability check across the control catalogue. Record excluded, conditional and supplier-assured objectives explicitly. Do not redesign architecture drawings as part of the control-data correction.

### F07 — Medium: link health is mostly good, but evidence relevance is not assured

Two control-source destinations return 404; several other references have access or edition problems. More importantly, a valid page about retention cannot substantiate DSPM, and a valid hook reference does not prove a content scanner exists.

All 57 none rows, 29 external rows and the one unknown row have no operator-step URL: 87 records total. This is not automatically a schema violation—external and none can legitimately have no product configuration steps—but absence claims and external integration recommendations still need an evidence route. Do not invent a configuration page for an inapplicable control.

All 518 records carry the same `verified: 2026-09-10` date, including Gemini's unknown AI-BOM entry. The field therefore does not, on its own, distinguish a supported feature, an unsupported absence claim and an unresolved question.

**Recommendation:** distinguish configuration instructions, vendor assurance, external integration and rationale sources; keep a claim-level evidence status. See the dedicated link assessment below.

### F08 — Medium: combined UI rows can show the wrong label/link context

**Evidence:** [cell aggregation](../../src/components/tooling/model.ts) and [CellTile / EnterpriseModules](../../src/components/tooling/shared.tsx).

- The model orders `external` below `partial` and `native`, although delivery location is not an assurance ranking. It also drops missing coverage values while aggregating, which could hide missing records if mixed with populated ones.
- A combined cell takes its worst coverage value, but its hyperlink is the first available component URL—not necessarily the component responsible for that value.
- Reproducible example: example AIS-2.1 combines tool permissions and MCP supply-chain security. Claude Code has native tool permissions and partial MCP coverage, so the combined badge is partial but links to permission modes, not its managed-MCP procedure. Cursor has the analogous mismatch.
- EnterpriseModules labels, links and colors a combined row using the first capability, while its enforcement locations include all capabilities. The posture note can come from yet another first available value. This is not a faithful combined control statement.

**Recommendation:** retain component-specific links and statuses in aggregated rows, or explicitly label a composite and show its components. Do not attach one component's evidence to another component's deficit.

### F09 — High: a crosswalk relationship is not evidence of satisfying the upstream control

**Evidence:** [CoSAI definitions](../../data/cosai/controls.yaml), [capability mappings](../../data/overlay/capabilities.yaml), and [example organization standards](../../data/org/example/frameworks.yaml).

This is a second semantic layer beyond product ratings. The 38 tooling capabilities map to 34 upstream controls, but the mappings are unqualified relationships rather than requirement-by-requirement fulfillment.

Examples:

- Agent Execution Bounds explicitly addresses enforced orchestration limits. A sandbox, network restriction or human-approval feature can constrain execution but does not establish mandatory turn/tool budgets or loop circuit breakers.
- Agent Inventory requires lifecycle authority and detection/blocking of unregistered agents. A connector list or telemetry identifier is not sufficient.
- Agent Integrity requires runtime identity/configuration binding to the registered agent. Version history and prompt configuration alone do not demonstrate that binding.
- Component Identity Provenance asks whether the callee is the currently registered, non-revoked principal. TLS, a vault and a service account are ingredients, not that entire test.
- Agent Credential Isolation specifies tenant-scoped issuance and propagation properties. Keeping a token out of model text does not prove them.
- Shadow discovery does not provide user education; TPRM does not provide employee education. The capability catalogue header itself acknowledges these as secondary relationships.

**Recommendation:** label crosswalks as “contributes to” unless stronger fulfillment is evidenced. Identify primary versus supporting relationships and preserve unmet upstream requirements. The operational criteria in this report clarify contributions; they do not silently relax a stricter adopted CoSAI or organization requirement.

## A consistent assessment rule

For each tool/control pair, answer these questions in order:

1. **Applicability:** which product variant, asset and action makes this objective relevant? If conditional or not applicable, why?
2. **Outcome:** what specific protection must be achieved, and which part of a compound control is being claimed?
3. **Enforcement and responsibility:** what enforces it, who configures/operates it, and can the user, model or another execution path bypass it?
4. **Evidence:** does a current, product-specific primary source support that exact outcome and procedure?
5. **Deployment:** what evidence shows the organization implemented and tested it? Keep this separate from vendor availability.

A minimal example:

| Record | Honest assessment |
| --- | --- |
| Claude chat retention | Native tenant-configurable data retention; useful lifecycle control; does not establish DSPM |
| SDK approval callback | Native integration interface; customer must implement authenticated human approval and fail-closed handling |
| Hosted-inference client model scanning | Not applicable to local weights; supplier assurance or conditional local-provider responsibility remains |
| Enterprise SSE inspecting AI traffic | Customer-operated enforcement plus any vendor tenant/IP integration; completeness depends on traffic coverage |
| Organization marks a control enabled | Evidence of the required outcome is needed; enabling a related setting is not enough |

## Control-by-control assessment

The following 38 assessments cover every capability used by the tooling catalogue. C01–C38 are review-local identifiers, **not** changes to the application's control numbering. Counts are authored tool mappings, not passing implementations. The linked ledger contains all underlying mechanisms, limitations and current step links.

<a id="c01"></a>

### C01 — Data loss prevention for AI interactions

ID: `capabilityAiDlp`. 19 tool mappings: 2 external, 17 partial. Review priority: High. Finding family: F02.

**Acceptance criterion:** Require content-sensitive inspection and an enforceable decision on an identified prompt, upload, tool-result, or output path.

**Assessment:** File-read denies, domain allowlists and log redaction are useful but are not interchangeable with content DLP. Claude Code, Codex and Gemini CLI credit these or scanner hooks as partial; Claude Agent SDK calls the analogous customer scanner external. Retain actual content-scanning contributions (including scoped secret-pattern filters), identify uncovered paths, and describe hooks as integration support until a scanner is attached.

Upstream relationships (contribution, not automatic fulfillment): `controlUserDataManagement`, `controlRuntimePrivacyEnhancingTechnologies`, `controlOutputValidationAndSanitization`.

<a id="c02"></a>

### C02 — Data security posture management for AI

ID: `capabilityDspm`. 6 tool mappings: 1 native, 4 partial, 1 none. Review priority: High. Finding family: F02.

**Acceptance criterion:** Discover and classify sensitive AI-accessible data, assess exposure/permissions, and support remediation.

**Assessment:** Claude chat is native on retention, deletion and export alone; the other five records are partial on related lifecycle features. These are data lifecycle controls, not evidence of a DSPM discovery/classification/posture engine. Keep the useful settings, but move or explicitly narrow their objective; show customer DSPM integration separately.

Upstream relationships (contribution, not automatic fulfillment): `controlUserDataManagement`, `controlTrainingDataManagement`, `controlModelAndDataInventoryManagement`.

<a id="c03"></a>

### C03 — Data access governance for retrieval

ID: `capabilityDataAccessGovernance`. 9 tool mappings: 2 external, 6 partial, 1 none. Review priority: Medium. Finding family: F05.

**Acceptance criterion:** Authorize retrieval against the correct requesting principal and resource scope; preserve tenant boundaries.

**Assessment:** Per-user connector ACLs are a legitimate contribution. A shared service account, selected folder or mount is not automatically end-user authorization. State whether retrieval is delegated or service-owned, how scope is narrowed, and where downstream authorization is enforced. Inheriting existing permissions also inherits oversharing.

Upstream relationships (contribution, not automatic fulfillment): `controlUserDataManagement`, `controlModelAndDataAccessControls`, `controlApplicationAccessManagement`.

<a id="c04"></a>

### C04 — Retrieval & vector store security

ID: `capabilityRagSecurity`. 3 tool mappings: 3 none. Review priority: Medium. Finding family: F01.

**Acceptance criterion:** For deployments with retrieval/vector stores, enforce source provenance, trust separation, access scoping and retrieval integrity.

**Assessment:** All three SDK rows say none because the SDK supplies no vector store. Record conditional applicability: the SDK-only component has no store, but a deployed application may attach one. Do not turn a component boundary into an unfillable product gap, nor imply an attached store is protected.

Upstream relationships (contribution, not automatic fulfillment): `controlRetrievalAndVectorSystemIntegrity`, `controlTrainingDataSanitization`, `controlModelAndDataAccessControls`.

<a id="c05"></a>

### C05 — AI bill of materials & artifact signing

ID: `capabilityAiBom`. 10 tool mappings: 7 none, 2 partial, 1 unknown. Review priority: Medium. Finding family: F03.

**Acceptance criterion:** Inventory deployed models, tools, plugins and dependencies with identities/versions and separately record provenance/signing.

**Assessment:** Codex SDK receives partial credit for a pinned runtime while Claude Agent SDK is none despite a bundled pinned CLI. Installation pinning alone is not an AI BOM or signed provenance. Keep version pinning as supporting evidence; distinguish inventory, attestation and signature verification, with a customer-maintained inventory path.

Upstream relationships (contribution, not automatic fulfillment): `controlModelAndDataIntegrityManagement`, `controlModelAndDataInventoryManagement`, `controlSecureByDefaultMLTooling`.

<a id="c06"></a>

### C06 — Model artifact scanning & safe deserialization

ID: `capabilityModelScanning`. 12 tool mappings: 12 none. Review priority: Medium. Finding family: F01.

**Acceptance criterion:** Scan model artifacts before loading where the deployment actually obtains/deserializes model files.

**Assessment:** Most hosted-inference entries are not applicable to local scanning, although they use none. Local-provider and local-embedding variants are conditional and belong to the party loading weights. Hermes desktop's documented model-download path and OpenClaw's optional local models deserve a real scanning requirement; a size/hash check alone is not a malicious-artifact scan.

Upstream relationships (contribution, not automatic fulfillment): `controlModelAndDataExecutionIntegrity`, `controlModelAndDataIntegrityManagement`, `controlVulnerabilityManagement`.

<a id="c07"></a>

### C07 — Encryption & key management for AI assets

ID: `capabilityEncryptionKeyManagement`. 15 tool mappings: 9 partial, 2 native, 4 none. Review priority: High. Finding family: F03.

**Acceptance criterion:** Assess encryption in transit, at rest, key custody/rotation and customer-key requirements separately for each asset.

**Assessment:** Grok Bot and Copilot chat/cloud are none because customer-managed keys are unavailable; ChatGPT and Codex cloud retain partial credit for provider encryption. Lack of CMEK is not proof of no encryption. Record each asset and key owner; local disk protection is a host responsibility, and residency is not an encryption property.

Upstream relationships (contribution, not automatic fulfillment): `controlModelAndDataAccessControls`, `controlModelAndDataIntegrityManagement`, `controlInterComponentTransportSecurity`.

<a id="c08"></a>

### C08 — Agent execution sandboxing

ID: `capabilityAgentSandboxing`. 12 tool mappings: 2 partial, 10 native. Review priority: High. Finding family: F05.

**Acceptance criterion:** Identify the OS/VM/container isolation boundary, protected processes/resources, supported platforms and bypass conditions.

**Assessment:** The repository generally identifies real isolation mechanisms well. Preserve that work, but qualify shell-only versus whole-agent coverage, remote tools, browser surfaces and platform variants. Copilot in editors spans products for which the record itself says sandbox support differs; one unqualified native label is too broad. Optional capability is not evidence of deployment.

Upstream relationships (contribution, not automatic fulfillment): `controlIsolatedConfidentialComputing`, `controlModelAndDataExecutionIntegrity`, `controlAgentExecutionBounds`.

<a id="c09"></a>

### C09 — Network segmentation & egress control

ID: `capabilityEgressControl`. 19 tool mappings: 10 partial, 9 native. Review priority: High. Finding family: F05.

**Acceptance criterion:** Enforce allowed destinations on the actual outbound paths, including bypass and remote-tool boundaries.

**Assessment:** A configured proxy is routing until direct egress is prevented. Shell-only restrictions do not constrain browser or remote MCP execution. Codex, Cursor and Hermes need the same scope rule rather than different aggregate ratings for comparable exclusions. An outbound-only tunnel design is not by itself an administrator-defined destination policy.

Upstream relationships (contribution, not automatic fulfillment): `controlModelAndDataAccessControls`, `controlIsolatedConfidentialComputing`, `controlAgentExecutionBounds`.

<a id="c10"></a>

### C10 — Secure service edge for AI services

ID: `capabilitySse`. 7 tool mappings: 5 external, 1 native, 1 none. Review priority: High. Finding family: F02.

**Acceptance criterion:** Identify the enterprise access/inspection enforcement service and the product's integration with it.

**Assessment:** Claude chat is native for IP restrictions and proxy-injected tenant restrictions, but the proxy is customer-operated SSE infrastructure. ChatGPT treats comparable surrounding controls as external. Describe vendor tenant/IP controls plus external enforcement as separate contributions; neither a tenant header nor an IP allowlist is a complete SSE service.

Upstream relationships (contribution, not automatic fulfillment): `controlModelAndDataAccessControls`, `controlApplicationAccessManagement`, `controlInputValidationAndSanitization`.

<a id="c11"></a>

### C11 — Non-human & agent identity management

ID: `capabilityNhiManagement`. 15 tool mappings: 8 partial, 2 none, 5 native. Review priority: Medium. Finding family: F05.

**Acceptance criterion:** Identify a non-human principal, its owner, credentials, scopes and lifecycle at the granularity required by the workload.

**Assessment:** Service accounts and vendor application identities can be valid scoped workload identities without one identity per subagent. Conversely a human token, compliance API key or resource identifier is not automatically the agent's runtime principal. Reconcile Claude Tag's native shared-identity treatment with Copilot cloud's partial vendor-app treatment; state which identity authorizes which action.

Upstream relationships (contribution, not automatic fulfillment): `controlComponentIdentityProvenance`, `controlAgentCredentialIsolation`, `controlApplicationAccessManagement`.

<a id="c12"></a>

### C12 — Secrets management & ephemeral credentials

ID: `capabilitySecretsManagement`. 24 tool mappings: 16 partial, 7 native, 1 none. Review priority: High. Finding family: F05.

**Acceptance criterion:** Protect storage, retrieval and injection of secrets; separately assess ephemeral issuance, rotation, revocation and model exposure.

**Assessment:** Encrypted storage, CI secrets, startup-only injection and short-lived credentials solve different parts of this compound control. Do not infer ephemeral credentials from an encrypted secrets store. Identify whether the model, shell, setup script or external service can read each secret. Blocking personal model API keys does not protect arbitrary tool credentials.

Upstream relationships (contribution, not automatic fulfillment): `controlModelAndDataAccessControls`, `controlAgentCredentialIsolation`, `controlComponentIdentityProvenance`.

<a id="c13"></a>

### C13 — Inter-component & inter-agent transport security

ID: `capabilityTransportSecurity`. 2 tool mappings: 1 partial, 1 native. Review priority: Medium. Finding family: F05.

**Acceptance criterion:** Protect each actual inter-component channel with appropriate authentication, confidentiality, integrity and message validation.

**Assessment:** Only OpenClaw and Hermes have rows. Do not require mTLS on a same-process or local stdio connection; use the relevant OS/process boundary. Conversely HTTPS plus a token does not establish replay protection or complete schema validation. Map channel types instead of applying one undifferentiated protocol checklist.

Upstream relationships (contribution, not automatic fulfillment): `controlInterComponentTransportSecurity`, `controlComponentIdentityProvenance`, `controlOrchestratorAndRouteIntegrity`.

<a id="c14"></a>

### C14 — Staged rollout, versioning & rollback

ID: `capabilityStagedRollout`. 6 tool mappings: 2 none, 1 native, 3 partial. Review priority: Medium. Finding family: F03.

**Acceptance criterion:** Control release versions and promotion, then separately establish progressive exposure, regression gates and actionable rollback.

**Assessment:** Claude Managed Agents is native on immutable versions/history, while other hosted tools receive partial credit for versioning. Version history is valuable but is not evidence of a staged rollout or regression-triggered rollback. Split the outcomes and specify whether rollback covers agent config, environment, credentials and active sessions.

Upstream relationships (contribution, not automatic fulfillment): `controlModelAndDataIntegrityManagement`, `controlSecureByDefaultMLTooling`, `controlAgentIntegrityManagement`.

<a id="c15"></a>

### C15 — Prompt injection & jailbreak detection

ID: `capabilityPromptInjectionDefense`. 25 tool mappings: 23 partial, 2 none. Review priority: High. Finding family: F02.

**Acceptance criterion:** Distinguish detecting malicious instructions from reducing their opportunity or blast radius; name the protected input boundary.

**Assessment:** The capability is titled detection, while many records cite sandboxing, network policy, approvals or model-side resilience. These mitigate effects without necessarily detecting an injected instruction. Copilot CLI gets partial for hooks while Gemini CLI is none with a comparable customer-extension path. Preserve genuine scoped classifiers/heuristics; classify prevention, detection, containment and customer integrations separately.

Upstream relationships (contribution, not automatic fulfillment): `controlInputValidationAndSanitization`, `controlAdversarialTrainingAndTesting`, `controlRetrievalAndVectorSystemIntegrity`.

<a id="c16"></a>

### C16 — Runtime content & policy guardrails

ID: `capabilityModelGuardrails`. 8 tool mappings: 4 partial, 4 none. Review priority: Medium. Finding family: F03.

**Acceptance criterion:** Enforce stated content or policy constraints at an identified input/output/action stage; distinguish configurable policy from provider defaults.

**Assessment:** Claude cloud/Managed Agents, Copilot cloud and Codex cloud receive partial credit for default model safeguards; other hosted records with no customer policy are none. Choose one rule. A model provider's default safety behavior is not an organization-configured policy, but absence of a customer setting does not mean no vendor safeguard exists.

Upstream relationships (contribution, not automatic fulfillment): `controlOutputValidationAndSanitization`, `controlInputValidationAndSanitization`, `controlUserTransparencyAndControls`.

<a id="c17"></a>

### C17 — System prompt & instruction hierarchy management

ID: `capabilitySystemPromptManagement`. 7 tool mappings: 6 partial, 1 native. Review priority: High. Finding family: F02.

**Acceptance criterion:** Protect instruction configuration, authority and change history; do not claim deterministic model obedience from prompt precedence.

**Assessment:** Cursor Team Rules marked Enforce prevent users disabling rules, but free-form rule text is not a hard runtime action boundary. Repository instruction files and system prompts are useful configuration, not structurally guaranteed compliance by the model. Separate configuration integrity from runtime authorization and tested resistance to conflicting instructions.

Upstream relationships (contribution, not automatic fulfillment): `controlInputValidationAndSanitization`, `controlOutputValidationAndSanitization`, `controlAgentIntegrityManagement`.

<a id="c18"></a>

### C18 — Agent observability & tracing

ID: `capabilityAgentObservability`. 9 tool mappings: 4 native, 5 partial. Review priority: Medium. Finding family: F05.

**Acceptance criterion:** Capture attributable requests, decisions, tool calls/results, errors and execution context with useful correlation.

**Assessment:** The nine records generally name useful traces or event streams. Require actual event coverage and correlation identifiers, not disclosure of hidden model chain-of-thought. Content redaction/opt-ins and missing tool paths should be explicit. Observability is not automatically security detection, audit completeness or durable tamper evidence.

Upstream relationships (contribution, not automatic fulfillment): `controlAgentObservability`, `controlAgentInventoryManagement`, `controlThreatDetection`.

<a id="c19"></a>

### C19 — Agent & tool registry

ID: `capabilityAgentRegistry`. 25 tool mappings: 2 none, 1 external, 18 partial, 4 native. Review priority: Medium. Finding family: F02.

**Acceptance criterion:** Maintain an authoritative inventory of relevant agents/tools, approved ownership and lifecycle, with a defined reconciliation scope.

**Assessment:** Seat lists, connector allowlists and telemetry labels are not interchangeable with an agent inventory. Hosted deployment registries and a personal gateway's declared agents can be valid within their stated scope; do not impose enterprise ownership workflows on a single-user product without saying so. Mark customer inventory integrations, and distinguish approved configuration from discovered actual use.

Upstream relationships (contribution, not automatic fulfillment): `controlAgentInventoryManagement`, `controlAgentIntegrityManagement`, `controlProductGovernance`.

<a id="c20"></a>

### C20 — Tool permission scoping & least agency

ID: `capabilityToolPermissionScoping`. 25 tool mappings: 22 native, 3 partial. Review priority: High. Finding family: F05.

**Acceptance criterion:** Constrain available tools, operations and resource scopes using an enforceable policy at the appropriate authority.

**Assessment:** Much of this category is well grounded in named settings. Preserve it, but distinguish hiding a tool, pre-approving it and limiting its arguments. Check default/bypass modes and built-in versus MCP/custom-tool behavior. SDK options require application integration; a tool-name allowlist does not imply resource-level least privilege.

Upstream relationships (contribution, not automatic fulfillment): `controlAgentPluginPermissions`, `controlApplicationAccessManagement`, `controlAgentExecutionBounds`.

<a id="c21"></a>

### C21 — Runtime action authorization

ID: `capabilityAgentRuntimeEnforcement`. 13 tool mappings: 11 native, 2 partial. Review priority: High. Finding family: F05.

**Acceptance criterion:** Authorize the concrete action before execution, fail closed where required, and document every path outside that decision point.

**Assessment:** Hooks, deterministic deny rules and AI action reviewers are different mechanisms. A hook API is an enforcement integration point, not an implemented policy. Ensure subagents and custom/remote tools are addressed. Copilot editor support must be version/component-specific: general editor policy material and the Agent Host reference describe different scopes.

Upstream relationships (contribution, not automatic fulfillment): `controlAgentExecutionBounds`, `controlAgentPluginPermissions`, `controlApplicationAccessManagement`.

<a id="c22"></a>

### C22 — Human-in-the-loop approval & escalation

ID: `capabilityHitlControls`. 25 tool mappings: 18 native, 6 partial, 1 none. Review priority: High. Finding family: F04.

**Acceptance criterion:** Require an actual human decision before the specified sensitive action, with action context, binding and a non-bypassable policy.

**Assessment:** Codex approval_policy on-request does not by itself require a human reviewer; restrict allowed_approvals_reviewers where human review is required. Grok Bot Enforce Auto-review can allow an action without a human; configure appropriate Ask first rules. PR review gates merging, not earlier network/tool side effects. Apply that distinction equally to Copilot cloud, Codex cloud and Cursor cloud. User-only Chrome prompts and SDK callbacks need explicit ownership/enforcement qualifications.

Upstream relationships (contribution, not automatic fulfillment): `controlAgentPluginUserControl`, `controlUserTransparencyAndControls`, `controlAgentExecutionBounds`.

<a id="c23"></a>

### C23 — Agent memory & context protection

ID: `capabilityMemoryProtection`. 19 tool mappings: 17 partial, 2 native. Review priority: Medium. Finding family: F05.

**Acceptance criterion:** Identify persistent agent memory, its writers/readers, tenant boundary and integrity/recovery controls.

**Assessment:** Conversation retention, disabling auto-memory, per-tenant directories and versioned memory stores are different contributions. Do not treat transcript retention as poisoning detection, or version history as validated recovery. Credit genuine read-only/versioned or approval-gated memory mechanisms while stating what can still write, how writes are trusted and how corrupted memory is restored.

Upstream relationships (contribution, not automatic fulfillment): `controlAgentIntegrityManagement`, `controlRetrievalAndVectorSystemIntegrity`, `controlAgentObservability`.

<a id="c24"></a>

### C24 — Agent behavioural & goal-drift detection

ID: `capabilityBehavioralDriftDetection`. 2 tool mappings: 2 none. Review priority: Medium. Finding family: F03.

**Acceptance criterion:** Compare observed behavior with intended goals/policy over time, alert on deviations and support investigation.

**Assessment:** The two personal-agent rows correctly do not claim a native drift detector. Repetition/loop limits are not goal-drift detection. However none currently also says no surrounding product could fill the gap, which the evidence does not establish; an external monitoring integration remains a separate possibility.

Upstream relationships (contribution, not automatic fulfillment): `controlAgentObservability`, `controlAgentIntegrityManagement`, `controlThreatDetection`.

<a id="c25"></a>

### C25 — Rate limiting, quotas & spend controls

ID: `capabilityRateLimiting`. 11 tool mappings: 7 partial, 4 native. Review priority: Medium. Finding family: F03.

**Acceptance criterion:** Bound the relevant request rate, concurrency, runtime/iterations and spend, stating whether each limit is hard or soft.

**Assessment:** Cursor cloud spend controls and Hermes iteration bounds are native while OpenClaw loop/time limits are partial. Treat them as distinct subcontrols and apply the same completeness rule. Failed-login throttling is not agent resource control; a budget that only stops the next request may overshoot within the active request.

Upstream relationships (contribution, not automatic fulfillment): `controlAgentExecutionBounds`, `controlApplicationAccessManagement`, `controlAgentPluginPermissions`.

<a id="c26"></a>

### C26 — Agent credential isolation & delegation control

ID: `capabilityCredentialIsolation`. 13 tool mappings: 8 partial, 1 external, 1 none, 3 native. Review priority: High. Finding family: F05.

**Acceptance criterion:** Keep designated secrets outside the model/execution boundary and constrain delegated authority where delegation exists.

**Assessment:** Hidden tokens, a proxy, per-session credentials, OBO exchange and a shared host filesystem address different threats. Native Copilot CLI/SDK and Hermes versus partial Claude SDK need an explicit common scope test. OBO is not necessary for every single-user operation, but must be evaluated when an agent acts for multiple requesting users.

Upstream relationships (contribution, not automatic fulfillment): `controlAgentCredentialIsolation`, `controlApplicationAccessManagement`, `controlAgentPluginPermissions`.

<a id="c27"></a>

### C27 — Tool & MCP supply-chain security

ID: `capabilityMcpToolSecurity`. 13 tool mappings: 8 partial, 5 native. Review priority: High. Finding family: F03.

**Acceptance criterion:** Control admission/provenance of tools and separately constrain mutable descriptions, versions, dependencies and updates.

**Assessment:** Native Cowork, Copilot CLI/editors, Codex and Codex SDK largely cite allowlists or trusted sources, while comparable Claude Code/Cursor/Gemini restrictions are partial. Endpoint identity allowlisting does not pin returned tool descriptions or detect a changed implementation. Credit admission policy without calling it the complete supply-chain outcome.

Upstream relationships (contribution, not automatic fulfillment): `controlAgentIntegrityManagement`, `controlAgentInventoryManagement`, `controlModelAndDataIntegrityManagement`.

<a id="c28"></a>

### C28 — Kill switch, quarantine & decommissioning

ID: `capabilityKillSwitch`. 25 tool mappings: 7 partial, 18 native. Review priority: High. Finding family: F04.

**Acceptance criterion:** Stop active execution and delegated work, revoke future access, prevent restart, then handle residual data and decommissioning.

**Assessment:** Seat removal, key revocation, run cancellation and process termination have different effects and delays. Copilot CLI is native despite a documented token-refresh delay up to an hour. Codex local/SDK native revocation should not imply active local processes/tools are stopped. Compare them consistently with partial Claude Code/Cursor, and distinguish a product feature from a customer incident runbook.

Upstream relationships (contribution, not automatic fulfillment): `controlAgentExecutionBounds`, `controlAgentInventoryManagement`, `controlIncidentResponseManagement`.

<a id="c29"></a>

### C29 — Identity & access management for AI applications

ID: `capabilityIga`. 25 tool mappings: 1 external, 22 native, 2 partial. Review priority: High. Finding family: F05.

**Acceptance criterion:** Authenticate and authorize human access to the relevant application and manage provisioning/deprovisioning.

**Assessment:** Enterprise SSO/SCIM entries are generally useful. Copilot SDK native credential/OAuth handling is not the deployer's application login, tenant authorization or user lifecycle; Claude SDK external and Codex SDK partial expose the inconsistency. Separate vendor-account administration, deployed-application identity and runtime non-human identity. Personal products need proportionate identity requirements.

Upstream relationships (contribution, not automatic fulfillment): `controlApplicationAccessManagement`, `controlModelAndDataAccessControls`, `controlUserTransparencyAndControls`.

<a id="c30"></a>

### C30 — Model & agent evaluation harnesses

ID: `capabilityModelEvals`. 9 tool mappings: 7 none, 2 partial. Review priority: Medium. Finding family: F03.

**Acceptance criterion:** Run a repeatable, deployment-relevant quality/security regression suite with datasets, results and release criteria.

**Assessment:** Copilot cloud's vendor benchmark/security checks are not the customer's agent evaluation harness; Copilot SDK is none despite shared vendor evaluation. Task outcome graders and CodeQL can contribute but do not establish safety regression coverage. Record supplier evaluation evidence separately from the deployer's CI harness and gate.

Upstream relationships (contribution, not automatic fulfillment): `controlRedTeaming`, `controlVulnerabilityManagement`, `controlAdversarialTrainingAndTesting`.

<a id="c31"></a>

### C31 — AI-aware detection & response

ID: `capabilityAiDetectionResponse`. 3 tool mappings: 3 external. Review priority: Medium. Finding family: F05.

**Acceptance criterion:** Apply AI-specific detection logic to usable telemetry and connect alerts to investigation and response.

**Assessment:** All three external classifications are directionally appropriate. OTLP events and SIEM connectors support detection but are not themselves detections or response playbooks. Identify the intended detection, required fields and response action instead of describing a feed as a completed security control.

Upstream relationships (contribution, not automatic fulfillment): `controlThreatDetection`, `controlIncidentResponseManagement`, `controlAgentObservability`.

<a id="c32"></a>

### C32 — Audit logging & non-repudiation

ID: `capabilityAuditLogging`. 25 tool mappings: 18 partial, 7 native. Review priority: High. Finding family: F05.

**Acceptance criterion:** Emit relevant attributable security events, retain them durably, and separately establish integrity/tamper evidence.

**Assessment:** Seven native rows provide logs/recording, but native event emission is not proof of non-repudiation or immutable retention. Signed commits do not sign the whole agent action history. Customer SIEM export can be the correct retention path, but must specify the protection and event coverage. Avoid downgrading good native logging merely because a separate archive is required.

Upstream relationships (contribution, not automatic fulfillment): `controlThreatDetection`, `controlAgentObservability`, `controlIncidentResponseManagement`.

<a id="c33"></a>

### C33 — Endpoint detection & response

ID: `capabilityEdr`. 10 tool mappings: 10 external. Review priority: Medium. Finding family: F05.

**Acceptance criterion:** Provide endpoint detection/response on the host or guest actually executing risky code, with an owner and supported boundary.

**Assessment:** The ten external rows correctly distinguish host EDR from the AI product. Retain that model. Clarify whether the sensor sees host activity, a VM guest, containers or only process launch, and do not call an agent hook an endpoint security sensor.

Upstream relationships (contribution, not automatic fulfillment): `controlThreatDetection`, `controlIncidentResponseManagement`, `controlVulnerabilityManagement`.

<a id="c34"></a>

### C34 — Browser detection & response

ID: `capabilityBrowserDetectionResponse`. 7 tool mappings: 4 external, 2 none, 1 partial. Review priority: Medium. Finding family: F05.

**Acceptance criterion:** Observe and enforce relevant browser actions on the actual browser/webview or hosted browsing surface.

**Assessment:** Extension restrictions and browser administration can enable external protection but do not themselves prove content inspection or behavioral detection. Office webviews require explicit supported enforcement paths. ChatGPT's hosted agent-browser controls do not automatically secure employees' local browsers. Non-browser variants should be not applicable.

Upstream relationships (contribution, not automatic fulfillment): `controlThreatDetection`, `controlUserDataManagement`, `controlInputValidationAndSanitization`.

<a id="c35"></a>

### C35 — SaaS security posture management for AI features

ID: `capabilityVendorAssurance`. 12 tool mappings: 4 partial, 1 native, 7 external. Review priority: High. Finding family: F02.

**Acceptance criterion:** Assess SaaS configuration against policy, detect drift and support remediation; distinguish configuration readback from posture assessment.

**Assessment:** Despite its ID, this capability is SSPM, not vendor TPRM. Claude chat is native because its Compliance API exposes settings; other Claude entries are partial and other vendors external for comparable inputs. A settings API enables SSPM but does not compare policy or remediate drift by itself. Apply one integration-versus-engine distinction.

Upstream relationships (contribution, not automatic fulfillment): `controlVulnerabilityManagement`, `controlThreatDetection`, `controlProductGovernance`.

<a id="c36"></a>

### C36 — AI governance platform

ID: `capabilityAiGovernancePlatform`. 12 tool mappings: 9 external, 3 partial. Review priority: Medium. Finding family: F02.

**Acceptance criterion:** Support the accountable inventory, intake, risk decisions, ownership and lifecycle workflow for AI use.

**Assessment:** Claude Tag and Copilot chat/cloud receive partial credit for admin dashboards/analytics while other vendor APIs are external. Those are governance inputs, not evidence of the governance workflow. Credit a concrete workflow if documented; otherwise describe the customer platform/process and the vendor data it consumes.

Upstream relationships (contribution, not automatic fulfillment): `controlProductGovernance`, `controlRiskGovernance`, `controlModelAndDataInventoryManagement`.

<a id="c37"></a>

### C37 — Shadow AI discovery

ID: `capabilityShadowAiDiscovery`. 16 tool mappings: 10 external, 4 partial, 2 none. Review priority: High. Finding family: F02.

**Acceptance criterion:** Discover actual unregistered or unauthorized AI use and reconcile it to the approved inventory.

**Assessment:** Blocking personal login or restricting plugins prevents some shadow use but does not discover it. Cursor is partial while analogous Claude Code posture is external; Gemini/Hermes none still recommend surrounding inventory. OpenClaw's installation-level unexpected-plugin checks may be a legitimate narrow discovery contribution. State discovery scope and source, not just prevention policy.

Upstream relationships (contribution, not automatic fulfillment): `controlProductGovernance`, `controlUserPoliciesAndEducation`, `controlAgentInventoryManagement`.

<a id="c38"></a>

### C38 — Third-party risk management platform for AI vendors

ID: `capabilityAiTprm`. 20 tool mappings: 20 external. Review priority: Low. Finding family: F05.

**Acceptance criterion:** Run vendor/product due diligence and ongoing review using artifacts relevant to the contracted service and deployment.

**Assessment:** The 20 external classifications are consistently sensible: vendor trust artifacts are evidence for the buyer's TPRM process, not a built-in TPRM platform. Trust-center landing pages are useful here and should not be rejected just for being broad. Verify service/feature coverage, artifact access and dates; do not infer every product variant inherits every certification.

Upstream relationships (contribution, not automatic fulfillment): `controlRiskGovernance`, `controlProductGovernance`, `controlInternalPoliciesAndEducation`.

## Product-by-product priorities

These summaries identify the issues to address first; the [ledger](AI-TOOLING-CONTROL-LEDGER-2026-09-15.md) includes every current control row, not only these examples.

| Tool | Rows | Priority review actions |
| --- | ---: | --- |
| [Claude Agent SDK](../../data/tooling/anthropic/claude-agent-sdk.yaml) | 25 | Keep the SDK/deployer boundary explicit: HITL callbacks, DLP hooks and telemetry are integration surfaces. RAG/model scanning are conditional or not applicable to the SDK itself; runtime containment and credential brokerage depend on the host deployment. |
| [Claude in Chrome (Claude for Chrome)](../../data/tooling/anthropic/claude-chrome.yaml) | 18 | Human approval is user-operated where enterprise policy cannot force it. Separate browser administration, content detection and network controls; document extension-specific data paths. |
| [Claude Code](../../data/tooling/anthropic/claude-code.yaml) | 21 | Correct DLP/injection-detection substitutions, model-scanning applicability, shadow-discovery examples and the distinction between emergency revocation and stopping the local process. Preserve its well-specified managed permissions/sandbox details. |
| [Claude Code on the web (cloud sessions)](../../data/tooling/anthropic/claude-code.yaml) | 19 | Separate merge review from pre-action approval, model defaults from customer guardrails, and transcript retention from memory integrity. Check omitted hosted-runtime control objectives. |
| [Claude Cowork](../../data/tooling/anthropic/claude-cowork.yaml) | 21 | Do not equate approved MCP sources with full supply-chain integrity. Separate VM versus host security/telemetry and not-applicable model scanning; qualify user versus organization control. |
| [Claude (claude.ai web, mobile and Claude Desktop)](../../data/tooling/anthropic/claude-desktop.yaml) | 20 | Highest concentration of categorical overclaims: native DSPM from retention, native SSPM from settings readback, and native SSE from a combination requiring an external proxy. Reconcile registry/audit completeness and example enabled statuses. |
| [Claude for Microsoft 365 (Excel, PowerPoint, Word, Outlook add-ins)](../../data/tooling/anthropic/claude-m365.yaml) | 20 | Post-action telemetry cannot provide preventive DLP. Validate enforcement in each Office add-in/webview, connector authorization and offboarding scope; do not assume browser or endpoint controls inspect every path. |
| [Claude Managed Agents](../../data/tooling/anthropic/claude-managed-agents.yaml) | 19 | Strong concrete controls exist, but version history is not progressive rollout, shared vault delivery is not automatically tenant-scoped delegation, and custom-tool approval belongs to the application. Separate SSPM evidence and strengthen vault procedure links. |
| [Claude Tag (Claude in Slack)](../../data/tooling/anthropic/claude-tag.yaml) | 20 | Admin analytics are governance inputs; service identities need bounded scope. Auto mode is not a human approval checkpoint. Browser controls may be not applicable to the Slack surface; distinguish that from a product gap. |
| [Cursor Cloud Agents](../../data/tooling/cursor/cloud-agents.yaml) | 19 | Separate spend limits from execution limits, PR review from pre-action HITL, and shell/network boundaries from general containment. Normalize comparisons to Copilot/Codex cloud. |
| [Cursor](../../data/tooling/cursor/cursor.yaml) | 21 | Enforced Team Rules are configuration, not guaranteed behavioral compliance. Personal-login restrictions prevent some shadow use but do not discover it. Normalize MCP coverage, credential scope and example enabled statuses. |
| [Grok Bot](../../data/tooling/cursor/grok-bot.yaml) | 19 | Require Ask first rules for the relevant HITL objective; AI Auto-review alone is not human review. Clarify local-execution ceiling versus effective default and distinguish absent CMEK from absent encryption. |
| [GitHub Copilot Chat on github.com](../../data/tooling/github/copilot-chat.yaml) | 20 | Separate provider encryption from customer-key support. Retention and admin analytics do not establish DSPM or a governance platform; preserve limits of per-user repository/connector access. |
| [GitHub Copilot CLI](../../data/tooling/github/copilot-cli.yaml) | 21 | Native kill-switch claim conflicts with acknowledged refresh delay. MCP admission is narrower than supply-chain integrity, and hidden credentials are narrower than tenant-scoped delegation. Apply consistent injection-detector criteria. |
| [GitHub Copilot cloud agent](../../data/tooling/github/copilot-cloud-agent.yaml) | 19 | PR review gates merging, not all prior side effects. Vendor benchmarks/static analysis do not establish customer agent evals. Correct encryption/CMEK treatment and assess omitted runtime objectives. |
| [GitHub Copilot in editors](../../data/tooling/github/copilot-editors.yaml) | 21 | Split or qualify editor/platform/Agent Host variants. Fine-grained permission and sandbox statements must reference the supported component. Normalize MCP allowlisting and credential claims. |
| [GitHub Copilot SDK](../../data/tooling/github/copilot-sdk.yaml) | 25 | Provider OAuth/token support is not deployed-application IGA. Callbacks need a customer implementation; SDK-only retrieval/model-scanning applicability differs from a completed application. Compare credential isolation and evals consistently. |
| [Gemini CLI](../../data/tooling/google/gemini-cli.yaml) | 21 | Do not rate hook-enabled content/injection defenses differently from analogous products without an actual detector distinction. Clarify external inventory options, local scanning applicability, and the unresolved AI-BOM evidence. |
| [Hermes Agent](../../data/tooling/nous/hermes.yaml) | 22 | Differentiate secret-pattern scanning from full DLP, loop bounds from broader quotas and drift detection, and local stdio from network transport. Desktop local weights create a real artifact-scanning obligation. |
| [ChatGPT Enterprise (web, desktop and Work)](../../data/tooling/openai/chatgpt.yaml) | 20 | Distinguish provider encryption, retention and hosted-agent browser features from customer-key, DSPM and employee-browser controls. Keep useful trust/compliance references but scope them to the actual surface. |
| [Codex](../../data/tooling/openai/codex.yaml) | 21 | Add the human-reviewer restriction to the HITL assessment; do not treat on-request alone as human enforcement. Separate file/egress restrictions from DLP, credential revocation from process stopping and model-scanning applicability. |
| [Codex cloud](../../data/tooling/openai/codex.yaml) | 19 | Narrow PR review to merge approval, provider safeguards to their actual policy scope, and cache/transcript retention to lifecycle management. Assess missing customer-configurable runtime objectives. |
| [Codex SDK](../../data/tooling/openai/codex.yaml) | 25 | A pinned runtime is not a complete AI BOM; compare to Claude SDK consistently. Clarify application identity, credential isolation, callback ownership and process termination; distinguish conditional RAG/model scanning. |
| [Secure MCP Tunnel (tunnel-client)](../../data/tooling/openai/secure-mcp-tunnel.yaml) | 20 | Assess it as connectivity infrastructure: a tunnel identifier is not by itself a runtime principal, and outbound-only design is not a configurable egress policy. Avoid importing full chat/agent controls without an applicability rationale. |
| [OpenClaw](../../data/tooling/openclaw/openclaw.yaml) | 22 | Preserve narrow installation-registry/plugin-discovery strengths. Separate log redaction from prompt DLP, HTTPS/token auth from complete transport/provenance requirements, and gateway credentials from tenant-safe delegation. Local embedding/model paths remain conditional scanning obligations. |

## Link correctness and relevance

### Reachability results

| Link population | Distinct URLs | HTTP 200 | HTTP 403 | HTTP 404 |
| --- | ---: | ---: | ---: | ---: |
| Tool-record links, all fields | 532 | 528 | 4 | 0 |
| Sources of the 38 control definitions | 19 | 15 | 2 | 2 |
| Total | 551 | 543 | 6 | 2 |

There are 1,544 total URL occurrences: 1,468 in tool records and 76 in control sources. The 756 operator-step occurrences are a subset of the tool occurrences.

No failing authored fragment was detected by the HTML check. This is not a rendered-browser guarantee. HTTP 200 pages can still be an application shell, generic overview or irrelevant evidence.

### Definite repairs and qualified exceptions

| Reference | Assessment and action |
| --- | --- |
| MITRE ATLAS `/mitigations` | HTTP 404; reused by 10 control definitions. Replace with verified specific mitigation references. The [official mitigation dataset](https://github.com/mitre-atlas/atlas-data/blob/main/data/mitigations.yaml) is a verified primary fallback; include the exact mitigation ID rather than treating the dataset root as a complete reader-friendly fix. |
| CISA `/resources-tools/resources/deploying-ai-systems-securely` | HTTP 404; reused by egress, staged rollout, IGA and AI detection/response. The original [joint agency guidance PDF](https://media.defense.gov/2024/Apr/15/2003439257/-1/-1/0/CSI-DEPLOYING-AI-SYSTEMS-SECURELY.PDF) is accessible. Cite the relevant section/page rather than a generic CISA homepage. |
| OWASP LLM Top 10 generic landing page | The linked [generic page](https://genai.owasp.org/llm-top-10/) presents 2025 numbering, while several authored reference titles use 2026 numbering. The 2026 IDs are not intrinsically wrong. Point to the [2026 edition](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) and the specific risk; preserve the edition in the citation. |
| Gartner reprint and ISO 42001 page | HTTP 403/access challenge in the direct sweep. Not demonstrated broken. Their content was not fully validated here; do not rely on them as the sole accessible evidence for an operator procedure. |
| Four OpenAI Help Center URLs | HTTP 403 to the direct client; content was accessible through the web reader. Classify as an access-method limitation, not a dead link. They remain separately noted in the appendix. |
| Anthropic/Cursor trust centers | HTTP 200 but thin client-rendered shells in the direct fetch. Valid destinations for obtaining assurance artifacts, not proof that a particular artifact was read or applies to all product variants. |
| NVD CVE-2026-25253 | HTTP 200 redirects to normalized CVE casing but the fetched text was only a thin NVD shell. Do not claim advisory content was validated from that response; retain a readable primary advisory for any substantive CVE claim. |

### Working links that need better claim alignment

- **DSPM and SSPM:** the retention and Compliance API links are useful, but support lifecycle/readback capabilities rather than the complete control class.
- **Managed Agents “Rotate and revoke”:** the current step links to webhooks while bundling credential update/archive and an event subscription. Link the credential operations to [vaults](https://platform.claude.com/docs/en/managed-agents/vaults), and keep [webhooks](https://platform.claude.com/docs/en/managed-agents/webhooks) for notification behavior. The page is not dead; the compound procedure needs more than one source.
- **Hooks as DLP or injection protection:** a hook API reference supports where a customer can attach logic. It does not establish a shipped scanner or verified inspection coverage.
- **Copilot editor permissions:** [VS Code enterprise AI settings](https://code.visualstudio.com/docs/enterprise/ai-settings) and [GitHub enterprise-managed settings](https://docs.github.com/en/copilot/reference/enterprise-administrators/enterprise-managed-settings) describe different component/support scopes. Keep the precise Agent Host/editor/version qualifier and resolve any apparent documentation conflict before making a blanket editor claim.
- **Broad settings/security pages:** acceptable where they contain the precise cited setting; use a stable section anchor when available. Do not reject a useful page merely because it hosts several settings.
- **Trust-center roots:** appropriate for TPRM artifact access. They are not substitutes for configuration instructions, runtime guarantees or a specific product certification.
- **Aggregated badges:** even correct component URLs can be wrong for the aggregate claim; see F08.

A useful citation tells the reader why it is there: “configure this setting,” “verify this limitation,” “integrate this customer control,” or “obtain this assurance artifact.” A generic vendor homepage is not a substitute for any of these.

## Organization example statuses

The shipped data explicitly identifies itself as an example. These are **template-quality findings**, not assertions about a real organization's deployment.

Examples that currently teach an overly broad completion rule:

| Example | Problem with the stated justification |
| --- | --- |
| Claude chat DSPM enabled for retention/deletion | Does not show sensitive-data discovery, classification or posture assessment |
| Managed Agents SSPM enabled for effective-settings readback | Does not show a policy baseline, drift comparison or remediation |
| Claude Code/Cursor shadow discovery enabled using login restrictions | Shows prevention, not discovery or reconciliation |
| Claude Code model scanning gap while the note says not applicable | Converts a component applicability decision into a deployment failure |
| Cursor secrets management enabled for blocking personal API keys | Does not cover tool credentials, safe injection or credential lifecycle |
| Kill-switch enabled using deprovisioning/minimum-version policies | Does not establish a tested stop path or bounded delay for active work |
| MCP supply-chain enabled using allowlists | Establishes admission restrictions, not all integrity/update/provenance outcomes |
| Managed Agents staged rollout enabled from version pinning | Does not show staged promotion or rollback execution |

These examples can remain intentionally incomplete, but their status should be attached to an explicit objective and evidence. Where an organization deliberately demands customer-held keys, a CMEK gap can be valid—record that requirement rather than inferring it from the broad encryption title.

## What is already sound

- Product surfaces and deployment differences are generally described with considerably more precision than a generic vendor comparison.
- Many records name actionable settings, APIs, policy files and explicit limitations. Preserve that detail.
- Separating vendor availability from organization deployment status is the right direction.
- External TPRM and EDR treatment is largely consistent with responsibility boundaries.
- The catalogue generally avoids claiming that every product ships a complete inline injection filter.
- All 518 rows reference known in-scope capability IDs, with no duplicate tool/capability pairs found.
- Tool-record URLs are predominantly reachable. A wholesale link replacement would discard useful documentation; targeted corrections are preferable.

## Remediation order and acceptance tests

### First: correct meaning and high-risk instructions

1. Agree the control acceptance rules in C01–C38; preserve stricter adopted upstream requirements.
2. Correct HITL reviewer ownership, cloud merge-gate scope and active-work kill semantics.
3. Separate applicability from absence and retire the “nothing around it fills the gap” interpretation.
4. Reclassify the clear category substitutions without deleting the useful underlying settings.

**Verify:** take the same mechanism across at least two vendors and explain its rating using the same rule; test the documented human gate and active-work stop in a controlled environment before claiming effective enforcement.

### Second: normalize records and evidence

1. Reassess compound controls by scoped contribution: encryption/key custody, logging/integrity, versioning/rollout, inventory/provenance, secrets/delegation.
2. Evaluate omitted controls by actual product applicability rather than diagram membership alone.
3. Repair broken/edition-mismatched citations and attach evidence to each substantive presence, absence and limitation claim.
4. Update example statuses to require the stated outcome.

**Verify:** every row has an applicability rationale, boundary/owner, exact claim and appropriate evidence route; none/unknown entries are not disguised as verified negative facts.

### Third: make the display faithful

1. Keep aggregated component links and status meanings aligned.
2. Stop using native/external as a universal assurance-quality order.
3. Distinguish evidence freshness from verification outcome; monitor links without treating HTTP success as semantic validation.

**Verify:** exercise AIS-2.1 and other multi-capability rows, a not-applicable hosted-model record, an externally complete control and an unresolved record. The displayed claim, status and hyperlink must refer to the same objective and component.

## Completion and limitations

This rerun covers the tools and controls, not just reference architectures. It includes all current records, all 38 relevant capability definitions, their local upstream-control relationships, the example implementation layer, related display logic and every authored in-scope URL.

The findings establish documentation and classification defects. They do not establish that a vendor lacks an undocumented internal safeguard, that a customer's deployment is insecure, or that every current rating should be changed. Final product-behavior assurance requires scoped configuration tests and, where relevant, contract/assurance-artifact review.

The engineering review and documentation guidance shaped the separation of findings, evidence, acceptance criteria and limitations. Repository onboarding conventions were treated as the current rules under review, not as proof that diagram-pinned coverage is semantically complete.
