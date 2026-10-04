# Endpoint reference architecture review — 2026-10-03

## Scope and verdict

Reviewed all five active endpoint architectures, all **88 capability pins and 76 risk pins**, their blocks, edges, scenario walks, deviations, and the four existing guidance files. The browser architecture has no paired guidance file. No architecture, capability definition, implementation, or existing report was changed.

The designs contain useful controls, especially sandboxing, explicit package admission, tool permissions and separate messaging egress. They need corrections before being presented as a consistent secure reference baseline. The largest issues are controls mapped to the wrong MITRE technique, target-state paths that still describe an uncontrolled common deployment, and claims of complete visibility or shutdown from a gateway that several paths bypass.

**Recommended sequence:** fix semantic mapping errors and unsupported security claims (EP-01–EP-08); choose one coherent baseline per drawing (EP-09–EP-14); then align guidance, ownership and naming (EP-15–EP-19). Most changes are pin/note/edge corrections; avoid adding infrastructure solely to accommodate a capability.

### Evidence and interpretation

Canonical definitions were read from the checksum-pinned MITRE snapshots, authored specializations, CoSAI risk definitions, vocabulary, ontology and provenance. Local rules are catalogue conventions; they are not external security standards. A pin can be a direct preventive control, direct detection, or supporting assurance; the last must not imply runtime enforcement. **Pass** below means the mapping has a defensible scope, not that a deployed product has been verified. **Change** means the current mapping or claim is wrong/incomplete. **Conditional** identifies the prerequisite needed to make the pin valid.

Primary-source checks used the following sources (checked 2026-10-03):

- [Claude Code enterprise network configuration](https://code.claude.com/docs/en/network-config): explicitly documents custom/OS CA trust and enterprise TLS-inspection proxies. This disproves a categorical uninspectable-CLI assumption.
- [Claude Code gateway configuration](https://code.claude.com/docs/en/llm-gateway): managed endpoint configuration and provider restrictions illustrate a verifiable route-enforcement mechanism.
- [MCP security best practices](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices): distinguishes per-client consent, token audience validation, transport/session protection and local-server execution controls. These are separate from merely possessing a scoped token.
- [Ollama FAQ](https://docs.ollama.com/faq): documents loopback default, proxying and explicit disabling of cloud models/web search. A local API alone does not establish local-only processing.
- [Claude in Chrome admin controls](https://support.claude.com/en/articles/13065128-claude-in-chrome-admin-controls): documents tenant binding, site access controls, vendor/bridge endpoints and separately managed browser variants. These are product examples, not universal browser-agent capabilities.
- [Chrome extension version pinning](https://support.google.com/chrome/a/answer/11190170): version pinning is a real supported administrative mechanism; retain it where the deployment supports it.

## Actionable findings

### EP-01 — P1 / defect: credential isolation is mislabeled as credential transmission scoping

**Evidence:** both coding architectures, `D3-CTS@toolPlane`, protect local SSH keys, cloud credentials and browser profiles from file reads. Browser `D3-CTS@profile` specifies a separate profile and fewer signed-in sites. Canonical `D3-CTS` limits credential transmission to scoped relying parties; it is not local file isolation or general profile separation. Third-party coding guidance compounds this by citing the same pin for forcing organization login.

**Smallest change:** retain the security requirements, map filesystem denial to execution isolation/access mediation or credential hardening where supported, and describe profile separation as reduced ambient authority. Keep CTS only where the system actually restricts the relying party receiving a credential. Personal-agent CTS can remain if it explicitly checks target/audience, independently of operation scope.

**Acceptance:** each remaining CTS note identifies the credential, permitted recipient and enforcement check; no CTS coverage derives only from a filesystem deny rule or a profile name. Update both coding guidance files together.

### EP-02 — P1 / defect: SSO and API authentication are presented as MFA

**Evidence:** `D3-MFA` at browser/third-party coding `vendorService`, first-party coding `relay`, and local inference `api`. Notes describe federation, managed-device identity or caller authentication; none establishes two independent factor categories. The local API wrapper normally authenticates software, not an interactive user completing MFA.

**Smallest change:** require actual MFA at interactive human login if that is the baseline; use an appropriate authentication/access-control mapping for per-request caller identity. Preserve tenant binding as a separate authorization/configuration requirement.

**Acceptance:** MFA pins explicitly state where the human supplies multiple factors and which session inherits the result. A token-authenticated local application cannot satisfy the MFA pin merely by authenticating.

### EP-03 — P1 / defect: Message Authentication is used for network and origin configuration

**Evidence:** `D3-MAN@api` in local inference and `D3-MAN@harness` in personal-agent describe loopback bind, Host/Origin checks, authenticated transport, and outbound-only connectivity. The canonical definition requires sender authentication and message integrity. Interface binding and Origin validation alone provide neither.

**Smallest change:** retain binding/origin controls as specific configuration requirements; retain MAN only for an authenticated integrity-protected message mechanism that is actually specified. Do not add signature machinery merely to preserve the pin. Personal `D3-APA@bridges` is **conditional**, not inherently wrong: it can cover administering and implementing a real pairing policy, but the note must distinguish that from the per-message authorization check.

**Acceptance:** the notes separately state who authenticates the channel, validates the sender/channel binding and enforces policy. No Host/Origin/CORS setting alone is claimed as message authentication. Update both guidance files.

### EP-04 — P1 / defect: stale logins and pooled browser authority borrow unrelated risk codes

**Evidence:** `riskStaleAgentIdentityBinding` at first-party `remoteDevice->relay`, third-party `remoteDevice->vendorService`, and personal `relay->bridges` describes old logins/pairings. The canonical risk concerns agent credentials surviving replacement of the **model artifact or inference endpoint**. Browser `riskCrossTenantCredentialPropagation@browser` explicitly substitutes one user's cross-origin sessions for cross-tenant credential reuse. Recorded deviations admit both substitutions.

**Smallest change:** remove these stretched pins; keep ordinary session lifecycle/pairing risks in notes, or use a genuinely matching risk only when its preconditions are present. The browser already has the directly matching confused-deputy and rogue-action risks.

**Acceptance:** every stale-binding risk identifies a model/endpoint replacement and retained agent authority; every cross-tenant propagation risk identifies two tenants and the credential crossing them. No “nearest coded risk” deviation remains.

### EP-05 — P1 / defect: gateway shutdown and telemetry claims exceed their actual reach

**Evidence:** personal `cap-agent-kill-switch@gateway` says revocation denies every flow, but `bridges->relay`, `toolPlane->registry`, local memory/workspace and heartbeat bypass the gateway. `AML.M0024@gateway` similarly claims a full per-message trace. First-party `cap-agent-kill-switch@govObservability` only revokes credentials/blocks a port, leaving local execution and outbound relay operation. Third-party shutdown describes vendor sessions and brokered grants but omits local processes. `D3-PA` in both coding designs and local inference combines process observation with active host containment, beyond Process Analysis itself.

**Smallest change:** use the existing observability/response call-out to name an external host/sandbox stop authority; stop daemon and children, suspend heartbeat/queued work, revoke gateway **and relay** credentials, and verify no effects continue. Scope gateway logs to what crosses it; combine endpoint/tool/relay events if claiming a complete trace. Narrow PA to detection and identify the actual response mechanism separately.

**Acceptance:** a stop rehearsal includes local tools, a queued turn and messaging reply, and confirms all stop. The trace identifies the source of local actions, approvals, bridge recipients and external effects. Revocation alone is never described as process termination.

### EP-06 — P1 / defect: browser-vs-CLI TLS inspection rule is factually wrong

**Evidence:** browser description, `aiGateway` note and inspection deviation claim it is the one endpoint client whose traffic can be inspected; both coding designs invoke pinned vendor sessions categorically. [Claude Code's official network documentation](https://code.claude.com/docs/en/network-config) explicitly supports enterprise TLS inspection with trusted roots.

**Smallest change:** replace the product-category axiom with deployment prerequisites: supported proxy/root configuration, actual endpoint/transport, policy permission and payload visibility. For browser inference DLP, installing a root is necessary in some configurations but does not itself prove that all agent traffic is routed through the proxy or that the proxy can parse/redact it. Keep vendor assurance for unobservable internals; label it assurance.

**Acceptance:** each inspection claim has a tested route and representative payload. No prose says all CLIs pin TLS or all browser agents are inspectable. The browser DLP pin identifies the proxy/parser and failure policy. Apply to architecture descriptions, deviations and coding guidance.

### EP-07 — P1 / defect: memory content screening stands in for durable-state hardening

**Evidence:** all four agent designs use `AML.M0031@toolPlane->memory` chiefly for treating remembered text as untrusted. Canonical Memory Hardening explicitly distinguishes durable-state authorization, isolation, provenance, integrity and recovery from interaction guardrails. Coding notes mix executable hooks/settings with textual agent memory.

**Smallest change:** specify owner/session scope, write permissions, source metadata, protected instruction/configuration files, and a known-good rollback/delete procedure on the existing memory tier. Describe content screening separately. No new database is required; scoped files and protected version history can satisfy the small endpoint baseline.

**Acceptance:** an injected turn cannot modify protected policy or another user's state; suspicious memory can be attributed and rolled back without restoring the attacker-written instructions. Guidance distinguishes hook execution from prose injection.

### EP-08 — P1 / defect: capability placement misses the operation its note promises to protect

**Evidence:** coding action policy is at `harness->aiGateway` but tool-originated calls have their own `toolPlane->aiGateway` edge. Input guardrails sit only at `hostedTools->orgData`, yet walks claim classification of external tool results, and local working-tree input has no displayed destination. First-party redaction sits only on the tool-to-gateway edge despite code/context leaving on `harness->aiGateway`. Personal input screening is only at the messaging relay, leaving workspace, memory and remote/internal results outside that screening point. Integrity of MCP definitions is pinned on a package-fetch edge in personal-agent; remote definitions enter via the gateway.

**Smallest change:** pin policy to the existing gateway block where it evaluates **all** brokered tool calls; describe additional local enforcement at Native tools where needed. Place a single context-screening pin at the harness assembly boundary if all sources are inspected there; otherwise state exact covered paths and residual exposure. Place tool-definition integrity at actual definition admission and use artifact verification for packages. For first-party inference, apply redaction on the model request boundary if it is part of the baseline.

**Acceptance:** trace one local file, one MCP result, one internal record and one model request; every claimed check executes on that route before the protected operation. Unsupported routes remain explicitly uncovered rather than inheriting nearby pins.

### EP-09 — P1 / defect: first-party remote access remains an uncontrolled common deployment in the target drawing

**Evidence:** first-party `relay` is in `zoneExternal`; the `remoteDevice->relay` and `harness->relay` notes say uncontracted, bearer secret at best, never owner-bound. Its MFA pin instead requires contracting a directory-backed relay. `aiGateway` incorrectly claims to admit the remote surface despite no remote-steering path passing through it. Guidance says remote access is off by default.

**Smallest change:** choose the secure pattern already proposed by the pin: managed relay with named authenticated user/device, per-message authorization and revocable pairing, placed in the correct ownership band. Keep the local listener private. Alternatively omit remote access from the minimal baseline and document it as a separate option; do not route it through an AI gateway solely to satisfy a rule.

**Acceptance:** the normal remote scenario follows the secured path and records principal validation; it never states that admission is absent. Gateway notes describe only paths actually traversing it.

### EP-10 — P1 / defect: third-party coding combines incompatible variants and an unrelated hosted-session pattern

**Evidence:** `harness->vendorService`, `harness->aiGateway->provider` and remote steering coexist while the deviation explicitly says they are not composable per seat. Hosted-session reach-back `vendorService->aiGateway` is described as involving no laptop, although this is the endpoint reference. Its edge is authored in the reverse direction with `bidir`, masking the initiating principal. The remote relay edge `harness->vendorService` is also bidirectional despite prose saying only the endpoint opens it.

**Smallest change:** choose the subscription path as this drawing's baseline, retain the customer-operated tool gateway, and link the separately modeled hosted-session design. Explain customer-key inference as an explicit selectable alternative rather than a simultaneously active route. If catalogue rules require a separate architecture, first decide whether an existing sibling covers it before multiplying drawings. Mark the endpoint-opened relay connection outbound with replies over that connection.

**Acceptance:** one normal walk uses one compatible inference/authentication mode. No endpoint path claims controls supplied only by the alternative. A vendor-started tool request names and authenticates its actual caller.

### EP-11 — P1 / defect: local inference has a policy wrapper but its normal walk bypasses the target's guarantees

**Evidence:** local `api` claims an authenticated policy wrapper and `cap-output-guardrails@api->runtime` claims classification; `localApps->api` still describes the same unauthenticated request, and normal steps say “raw completion”/“response, no floor.” The raw runtime is called private without specifying what prevents another same-host process connecting to it. Loopback alone does not provide that separation. The browser attack scenario states that every simple cross-origin POST is acted upon, regardless of server request validation or browser restrictions.

**Smallest change:** make the baseline walk authenticate and enforce limits/input-output policy at the wrapper. Explicitly isolate the raw listener using service identity, a protected local socket or equivalent OS/container restriction. Keep the browser attack as a conditional failure scenario: accepted unauthenticated request, permissive parsing/origin policy or rebinding, and a reachable listener must all be established.

**Acceptance:** an unauthorized local process cannot call either wrapper or raw backend; malformed/disallowed-origin requests fail before inference; the normal response passes the declared policy. The attack scenario names which baseline protection was disabled or failed.

### EP-12 — P1 / defect: local-only processing is promised while runtime cloud egress is omitted

**Evidence:** local inference summary promises data stays on the machine. `riskExcessiveDataHandlingDuringInference@runtime` explicitly notes cloud-model/search offload and absence of egress governance; deviation says the device firewall closes it, yet neither pin nor guidance gives that control an enforceable baseline. [Ollama's FAQ](https://docs.ollama.com/faq) documents an explicit local-only switch that disables cloud models and web search.

**Smallest change:** specify local-only mode and deny runtime outbound inference/search egress, while separating approved artifact/update acquisition. Pin the existing egress capability at the runtime if the catalogue requires a capability-backed recommendation; no cloud provider box is necessary for a denied path.

**Acceptance:** a cloud-model name/search request cannot send content externally; approved local inference still works; update/model acquisition remains an explicit controlled process. Summary, deviation and guidance say the same thing.

### EP-13 — P2 / defect: coding references omit their primary local workspace while overbuilding remote retrieval

**Evidence:** both coding `toolPlane` notes promise local file edits and commands, and walkthroughs end with a working-tree diff. The only drawn repository content lives in cloud `orgData` behind hosted tools; there is no local workspace block/edge. The walkthrough's “edits, commands; brokered calls” step follows a network gateway edge even though local edits do not traverse it. Personal-agent already has a reusable `Owner workspace` concept.

**Smallest change:** represent the actual local working tree using the existing workspace role and connect Native tools. Keep the remote repository/enterprise-data path only when independently useful. Update shared source-input, local output and approval notes rather than adding extra gateways.

**Acceptance:** a simple local edit/test/diff task can be followed without an invented remote repository round trip; local file injection is pinned at its actual entry point. Both coding siblings use the same workspace semantics.

### EP-14 — P2 / defect: browser “AI gateway” is a different kind of component and ownership is conflated

**Evidence:** browser `aiGateway` explicitly brokers no model/MCP API; its sole item is Secure web gateway. It is nevertheless titled AI gateway to meet a registry embodiment. `downstream` in `zoneExternal` combines contracted SaaS and the organization's own internal applications; `memory` is endpoint-only while prose describes vendor-synchronized memory. The description frames authorized cross-origin automation as breaking same-origin policy; the actual issue is powerful agent/extension authority, not necessarily a browser enforcement failure.

**Smallest change:** use a distinct canonical Secure web gateway role for the real proxy. Select a concrete downstream ownership baseline and refer to other ownership placements as alternatives; split only if two trust boundaries matter to the use case. State local vs vendor memory custody explicitly. Preserve same-origin terminology accurately and explain the confused-deputy mechanism.

**Acceptance:** identical block names mean identical functions across siblings; internal applications never appear under “no agreement, outside company”; memory data location is stated. No extra AI gateway is inserted simply to accommodate a control pin.

### EP-15 — P2 / defect: browser guidance is missing and vendor internals are pinned as assured controls

**Evidence:** `data/reference/guidance/endpoint-browser-ai.yaml` does not exist. Browser `cap-input-guardrails@harness` says vendor classifiers are “assured rather than drawn” while pinning their behavior as if deployable. `cap-agent-action-policy-enforcement@vendorService` describes a per-action decision enforced on the endpoint. D3-WSAA merely records reads/clicks, without the baseline/anomaly comparison its definition requires.

**Smallest change:** add concise guidance after the baseline is corrected. Separate vendor assessment from customer-controlled extraction/site permissions, and pin action enforcement at the local enforcer while retaining configuration ownership in notes. Keep WSAA only if actual session-behavior analysis is required; otherwise use a logging mapping. Document product/edition prerequisites for actions, telemetry and settings.

**Acceptance:** each browser recommendation has a named configurable or operated enforcement point; vendor-only classifier assurance does not masquerade as a customer-deployed screen. Guidance covers all security-critical pins with compatible definitions.

### EP-16 — P2 / defect: canonical local-inference risk and supply-chain mappings need narrowing

**Evidence:** `riskModelEvasion@runtime` describes removing refusal behavior by fine-tuning, which is a model change rather than adversarial input perturbation. `riskMaliciousLoaderDeserialization@runtime` describes inference-time chat templates, beyond the named load/deserialization operation. `AML.M0005@weights` credits integrity detection although the definition is access control. `AML.M0023@govSupplyChain` is used for deployment inventory rather than a bill of constituent artifacts. `D3-ORA@govObservability` is described as a policy system of record, not a risk assessment.

**Smallest change:** remove the evasion pin or describe an actual evasion input; map vulnerable template execution to insecure integrated components unless an unsafe loading mechanism is shown. Keep model access control for access, add precise integrity verification at promotion/load if claimed, use inventory for deployed-model records, and retain BOM only for constituent provenance. Describe an actual assessment for ORA or remove the stretched pin.

**Acceptance:** every mapping can be justified directly from its canonical definition without broadening it. Keep the useful fetch/quarantine/promote/load sequence. Change `govSupplyChain`'s stale “scan before fetch” prose to scan after fetch and before load.

### EP-17 — P2 / conditional defect: token brokerage, spend ceilings and registry entries are credited with broader protection

**Evidence:** personal `D3-CTS@gateway->remoteTools` equates a task-narrowed token with solving confused deputy. Coding `riskMCPTransportHijacking@aiGateway->extTools` has no explicit TLS/session-identity control. First-party and personal `AML.M0036` only describes gateway limits, leaving local iterations and tool paths independent; third-party/browser loop risks rely largely on stop controls/seat metering. Agent Registry notes often describe an allowlist without owner/version/reconciliation records. Tool Integrity notes often describe review/signing without refusing a changed tool-definition hash.

**Smallest change:** make target/audience, authorized principal, consent and scope validation explicit on existing broker/tool edges; preserve authenticated transport and reject replay/session misuse as separate requirements. Bound local turns/retries/time as well as brokered spend. Make registry and tool-definition admission notes meet their actual specialization. Remove coverage for properties the implementation cannot enforce.

**Acceptance:** an unauthorized principal cannot reuse a permitted tool's credential; wrong-audience and stale-session requests fail; changed tool definitions are refused until reviewed; a local-only runaway terminates under the documented budget. No new policy-service box is required.

### EP-18 — P2 / defect: personal-agent target and guidance disagree about boundaries and flow sequence

**Evidence:** architecture selects a whole-harness microVM and cloud Messaging relay; guidance `mode: use` discusses alternative tool-only containers and refers to “gateway” as a loopback local dashboard, while the architecture's `gateway` is enterprise cloud brokerage. Architecture `bridges->relay` says outbound-only but is `bidir`. Its normal walk jumps from `internalTools->gateway` directly to `gateway->remoteTools`, implying the gateway makes the next reasoning decision, and claims a read-only host workspace returns a diff made in a private clone. `D3-EI@sandbox` says absence of a model key leaves “nothing to exfiltrate,” despite accessible memory/workspace data.

**Smallest change:** use one baseline in guidance and name the local control API separately from the AI gateway; describe build/hybrid customer responsibilities honestly. Mark the relay transport endpoint-initiated. Return tool results to the harness before the next decision/call, and state that the private clone creates the diff. Limit the secret claim to the withheld provider credential.

**Acceptance:** each step has its actual initiating actor; the guide's security boundary matches the diagram; the sandbox claim acknowledges that task data can still leak through allowed outputs.

### EP-19 — P3 / design judgment: reduce duplicate control prose and unsupported universal product claims

**Evidence:** coding gateway packs include Skills catalogue while package bytes go straight to a separate mirror; personal skills notes alternate between gateway serving bytes and only authorizing admission. First-party notes say the gateway is the only component capable of holding any control, while many controls are pinned locally. Several designs say all context is indistinguishable from the user goal, every extension sees every tab, every current personal-agent implementation runs MCP on the host, or no first-party harness supplies identity/audit. These are stronger than a reference pattern needs and age quickly.

**Smallest change:** retain common component names only for shared functions; omit unused traffic items rather than inventing flows. Describe trusted instructions/untrusted content as distinct inputs with residual injection risk. Move product-specific absolutes into dated exemplars supported by evidence. Keep the normal walk focused on the secure baseline; failure scenarios should explicitly identify the control that failed.

**Acceptance:** every component item corresponds to an actual selected function/flow. No broad product assertion is needed to justify a baseline security control. Repeatable family changes are applied to both coding diagrams and their guidance.

## Architecture-by-architecture pin ledger

Every entry below is in source order, including repeated IDs at different loci. Block counts include boundaries and governance call-outs. Risk pins are potential failure locations, not claims that the normal secured path necessarily fails. The ledgers intentionally retain residual risks where controls reduce rather than eliminate them.

### Browser AI agents & extensions — archAgenticBrowser

**Verdict:** Useful profile/site/action baseline, but rename the proxy, correct risk semantics and inspection assumptions, and add the missing guidance. Keep a dedicated profile; it is a scope reduction, not an OS security boundary.

**Inventory:** 16 blocks, 10 edges, 15 capability pins, 13 risk pins, 4 failure/variant scenarios. Source: [endpoint-browser-ai.yaml](../../../data/reference/architectures/endpoint-browser-ai.yaml). Guidance: **missing**.

**Flows and minimal baseline:** The browser request/response and approval walk is coherent. Extension supply is intentionally a logical artifact-delivery edge; label it as such so it does not imply unsolicited ingress. The browser invokes authenticated site requests with the cookies matching each origin, not the entire cookie jar on every request. Cloud memory synchronization is asserted without a concrete custody path. Existing endpoint/browser/vendor components suffice; a new model gateway is unnecessary.

#### Capability dispositions

| Capability and locus | Disposition and direct mechanism |
| --- | --- |
| [AML.M0029 @ user->harness](../../../data/reference/architectures/endpoint-browser-ai.yaml#L623) | Pass — user confirms consequential action before execution; bind exact site/action/arguments (EP-17). |
| [AML.M0028 @ toolPlane](../../../data/reference/architectures/endpoint-browser-ai.yaml#L629) | Pass — site-level read/act/deny checks at Native tools directly reduce unauthorized browser actions. |
| [D3-CTS @ profile](../../../data/reference/architectures/endpoint-browser-ai.yaml#L634) | Change — dedicated profile limits ambient authority; it is not credential recipient scoping (EP-01). |
| [cap-input-guardrails @ harness](../../../data/reference/architectures/endpoint-browser-ai.yaml#L640) | Conditional — extraction/classification can screen context, but vendor-only classifiers are assurance; identify configurable/enforced part (EP-15). |
| [AML.M0031 @ toolPlane->memory](../../../data/reference/architectures/endpoint-browser-ai.yaml#L646) | Change — read-time distrust/origin selection needs durable write authorization, provenance and recovery (EP-07). |
| [D3-WSAA @ browser](../../../data/reference/architectures/endpoint-browser-ai.yaml#L651) | Change — click/read collection is telemetry; WSAA additionally requires comparison to behavioral baseline or malicious patterns (EP-15). |
| [cap-agent-tool-registry @ browser](../../../data/reference/architectures/endpoint-browser-ai.yaml#L656) | Conditional — retain real browser policy enforcement, but include owner/version/approval registry and reconciliation; pinning support is product-specific (EP-17). |
| [cap-shadow-ai-discovery @ browser](../../../data/reference/architectures/endpoint-browser-ai.yaml#L663) | Pass — endpoint/browser inventory can directly detect unregistered extensions and assistants; reconcile findings. |
| [AML.M0024 @ aiGateway](../../../data/reference/architectures/endpoint-browser-ai.yaml#L668) | Conditional — gateway plus vendor export records only observed fields; prove read/click coverage and minimize sensitive log content (EP-05). |
| [cap-sensitive-data-redaction @ harness->aiGateway](../../../data/reference/architectures/endpoint-browser-ai.yaml#L673) | Conditional — proxy can redact only routed, decrypted and parsed payloads; root trust alone is insufficient (EP-06). |
| [cap-agent-egress-control @ aiGateway->openWeb](../../../data/reference/architectures/endpoint-browser-ai.yaml#L678) | Pass — enforced destination/site policy directly blocks disallowed browse/exfil routes; allowed destinations remain residual risk. |
| [D3-MFA @ vendorService](../../../data/reference/architectures/endpoint-browser-ai.yaml#L684) | Change — federated/tenant-bound login alone is not MFA (EP-02). |
| [cap-agent-action-policy-enforcement @ vendorService](../../../data/reference/architectures/endpoint-browser-ai.yaml#L690) | Change — settings are vendor-configured but action decision occurs in local harness/tools; pin and describe that enforcer (EP-15). |
| [cap-ai-vendor-assessment @ vendorService](../../../data/reference/architectures/endpoint-browser-ai.yaml#L695) | Pass, assurance — supplier evaluation informs admission/retention acceptance; does not block a malicious page or prove runtime controls. |
| [cap-agent-kill-switch @ govObservability](../../../data/reference/architectures/endpoint-browser-ai.yaml#L700) | Conditional — removal/disable/revoke is a useful response, but verify running tasks and queued actions stop across browser shapes (EP-05). |

#### Risk dispositions and residual exposure

| Risk and locus | Disposition and control relationship |
| --- | --- |
| [riskPromptInjection @ aiGateway->openWeb](../../../data/reference/architectures/endpoint-browser-ai.yaml#L552) | Pass — returned hostile page is an indirect instruction entry point; extraction/permissions reduce, not remove, injection. |
| [riskSensitiveDataDisclosure @ aiGateway->openWeb](../../../data/reference/architectures/endpoint-browser-ai.yaml#L557) | Pass — browser submission to attacker page is concrete exfiltration; destination limits leave allowed-site residual risk. |
| [riskAgenticDelegationConfusedDeputy @ aiGateway->downstream](../../../data/reference/architectures/endpoint-browser-ai.yaml#L563) | Pass — hostile lower-trust page inducing authenticated cross-origin action is a real confused-deputy boundary. |
| [riskRogueActions @ aiGateway->downstream](../../../data/reference/architectures/endpoint-browser-ai.yaml#L569) | Pass — unintended click/send/purchase materializes at downstream request; requires operation-specific approval. |
| [riskSensitiveDataDisclosure @ harness->aiGateway](../../../data/reference/architectures/endpoint-browser-ai.yaml#L574) | Pass — authenticated content can leak into model request; DLP/selection scope must be proven (EP-06). |
| [riskExcessiveDataHandlingDuringInference @ aiGateway->vendorService](../../../data/reference/architectures/endpoint-browser-ai.yaml#L579) | Pass — excessive page/tab collection and provider retention fit; specify actual retained/synced data. |
| [riskInsecureModelOutput @ harness](../../../data/reference/architectures/endpoint-browser-ai.yaml#L585) | Pass — unvalidated completion becomes browser actuation; transport authenticity would not establish safe intent. |
| [riskRunawayAgentToolLoops @ harness](../../../data/reference/architectures/endpoint-browser-ai.yaml#L590) | Pass — repeated clicks/retries can exhaust resources or repeat effects; explicit turn/retry/time limits remain missing (EP-17). |
| [riskCrossTenantCredentialPropagation @ browser](../../../data/reference/architectures/endpoint-browser-ai.yaml#L595) | Change — same-user cross-origin ambient authority is not cross-tenant credential propagation; existing deputy pin fits (EP-04). |
| [riskPromptInjection @ memory](../../../data/reference/architectures/endpoint-browser-ai.yaml#L600) | Pass — persistent malicious remembered instructions are prompt injection, not training poisoning (EP-07). |
| [riskInsecureIntegratedComponent @ harness](../../../data/reference/architectures/endpoint-browser-ai.yaml#L605) | Pass — privileged extension vulnerabilities/supply compromise fit; “all sites/every page” is conditional on granted permissions. |
| [riskToolSourceProvenance @ openWeb->browser](../../../data/reference/architectures/endpoint-browser-ai.yaml#L611) | Change — code-store update is integrated-component supply risk; Tool Source Provenance specifically concerns tool metadata unless a manifest/description trust path is identified. |
| [riskShadowAndUnknownAgents @ harness](../../../data/reference/architectures/endpoint-browser-ai.yaml#L616) | Pass — unmanaged assistant with inherited session authority fits; discovery is direct detection. |

### First-party coding & desktop agents — archCodingAgentFirstParty

**Verdict:** Keep gateway-held credentials, package mirror and endpoint isolation. Replace the uncontracted relay target, show the local workspace, and fix inference DLP, memory and telemetry coverage. Optional remote access should not dominate the baseline.

**Inventory:** 19 blocks, 15 edges, 20 capability pins, 17 risk pins, 3 failure/variant scenarios. Source: [endpoint-coding-agent-first-party.yaml](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml). Guidance: [paired file](../../../data/reference/guidance/endpoint-coding-agent-first-party.yaml).

**Flows and minimal baseline:** Provider and external-tool calls correctly originate outbound; package pull is separate from model/MCP brokerage. Remote steering reaches the harness directly via relay, contradicting gateway admission claims. Both harness and Native tools can call the gateway, so gateway-level controls must cover both. The supply edge is logical mirroring, not public publishers opening connections. Missing local workspace is the largest ordinary-flow omission.

#### Capability dispositions

| Capability and locus | Disposition and direct mechanism |
| --- | --- |
| [D3-MFA @ relay](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L748) | Change — contracted identity-backed relay contradicts drawn uncontracted relay; identity alone also is not MFA (EP-02, EP-09). |
| [cap-agent-action-policy-enforcement @ harness->aiGateway](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L756) | Change — move/name per-tool enforcement at gateway for both harness and tool-originated calls; session admission alone is insufficient (EP-08). |
| [cap-sensitive-data-redaction @ toolPlane->aiGateway](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L760) | Change — useful tool-payload DLP, but model context leaves on a separate edge; cover that boundary and stop referring to a nonexistent pinned vendor path (EP-06, EP-08). |
| [AML.M0036 @ harness->aiGateway](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L765) | Conditional — gateway spend limit is direct for brokered calls; local turns/time/retries need harness budgets (EP-17). |
| [AML.M0028 @ toolPlane](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L770) | Pass — per-tool working-tree/task grants restrict native tool operations; keep protected configuration outside the writable repo. |
| [D3-EI @ toolPlane](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L775) | Pass — OS-enforced tool isolation limits filesystem/process reach; make the target default explicit and avoid implying only escape actions require approval. |
| [D3-CTS @ toolPlane](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L780) | Change — denying file reads of keys/profiles is isolation/hardening, not credential transmission scoping (EP-01). |
| [AML.M0031 @ toolPlane->memory](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L783) | Change — add durable memory authorization/provenance/recovery; hooks are executable configuration with separate admission (EP-07). |
| [cap-input-guardrails @ hostedTools->orgData](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L789) | Change — vague distrust statement needs actual classify/block behavior; cover local and external returned context, not just enterprise records (EP-08). |
| [D3-CH @ aiGateway](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L792) | Pass — gateway vault/injection with scoped short-lived grants directly reduces exposed credential material; does not itself establish caller authorization. |
| [cap-mcp-tool-integrity @ toolPlane->aiGateway](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L797) | Change — tool-definition verification belongs at definition admission; harness/skill package pinning is a separate artifact operation (EP-08, EP-17). |
| [AML.M0029 @ hostedTools->orgData](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L803) | Pass — approval before consequential enterprise writes is direct; local and external operations require their own actual gate. |
| [cap-agent-tool-registry @ aiGateway](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L806) | Conditional — gateway consults approved tool inventory, but inventory must include ownership/version and reconciliation, not just an allowlist (EP-17). |
| [AML.M0024 @ aiGateway](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L811) | Change — gateway tap logs brokered traffic; “whole record” is false for local tools, memory, direct egress and relay (EP-05). |
| [cap-shadow-ai-discovery @ harness](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L816) | Pass — device discovery finds undeployed harnesses and supports inventory reconciliation. |
| [D3-PA @ harness](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L819) | Change — keep process/child-process detection; inventory and active containment are distinct functions (EP-05). |
| [cap-agent-action-policy-enforcement @ harness->relay](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L825) | Change — bearer-secret session admission does not satisfy per-action policy over principal/operation/arguments/resource (EP-09). |
| [cap-agent-kill-switch @ govObservability](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L831) | Change — credential revocation and port blocking do not terminate local tools or an outbound relay session (EP-05). |
| [cap-agent-egress-control @ toolPlane](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L836) | Pass — host-enforced default-deny egress at execution environment blocks unapproved direct destinations; allowlisted exfil remains possible. |
| [D3-FA @ sources->registry](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L843) | Pass — quarantine file analysis at mirror can detect malicious artifacts before admission; signatures/scans do not prove benign behavior. |

#### Risk dispositions and residual exposure

| Risk and locus | Disposition and control relationship |
| --- | --- |
| [riskPromptInjection @ hostedTools->orgData](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L653) | Pass — retrieved repository/document instructions are indirect prompt injection; local ingress needs representation (EP-13). |
| [riskPromptInjection @ memory](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L658) | Pass — remembered rules can carry prompt injection; separate executable settings from prose. |
| [riskToolRegistryTampering @ toolPlane](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L664) | Conditional — post-approval metadata/config mutation fits; first adoption of unvetted config is provenance/admission risk. |
| [riskInsecureModelOutput @ harness](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L669) | Pass — unvalidated completion causes edits/commands/actions; authentication of source is not semantic validation. |
| [riskExcessiveDataHandlingDuringInference @ aiGateway->provider](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L674) | Pass — model-bound context can exceed approved purpose/retention; provider defaults must not substitute for agreement. |
| [riskStaleAgentIdentityBinding @ remoteDevice->relay](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L680) | Change — stale remote login lacks model-artifact swap required by risk definition (EP-04). |
| [riskInsecureIntegratedComponent @ toolPlane->registry](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L686) | Pass — compromised harness release executes as developer; mirror pinning/scanning reduces but does not guarantee safety. |
| [riskSensitiveDataDisclosure @ toolPlane->aiGateway](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L692) | Pass — native tool payload can carry local secrets to broker; file isolation plus DLP are distinct defenses. |
| [riskToolSourceProvenance @ extTools->downstream](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L697) | Change — tool metadata is admitted at gateway/server definition boundary, not downstream action edge (EP-08). |
| [riskRogueActions @ hostedTools->orgData](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L702) | Pass — unintended enterprise writes materialize at tool-to-data effect boundary. |
| [riskInsecureIntegratedComponent @ harness](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L705) | Pass — unauthenticated/exposed serve mode is an insecure component; normal target must close it (EP-09). |
| [riskShadowAndUnknownAgents @ harness](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L712) | Pass — unregistered local harness using valid keys fits; discovery cannot itself revoke. |
| [riskInsecureIntegratedComponent @ aiGateway](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L718) | Pass — gateway vulnerability/supply compromise is material because it holds credentials/policy. |
| [riskMCPTransportHijacking @ aiGateway->extTools](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L724) | Pass — MCP impersonation/replay fits transport edge; explicit authenticated transport/session binding remains required (EP-17). |
| [riskRunawayAgentToolLoops @ harness](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L729) | Pass — unbounded local agent loop fits, but note about seat metering is copied from vendor case and should be removed. |
| [riskInsecureIntegratedComponent @ memory](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L734) | Pass — executable hooks/settings are software execution compromise, correctly distinct from memory prompt injection. |
| [riskSensitiveDataDisclosure @ toolPlane->downstream](../../../data/reference/architectures/endpoint-coding-agent-first-party.yaml#L740) | Pass — direct tool egress is concrete secret exfiltration outside gateway; host egress policy is the proper control. |

### Third-party coding & desktop agents — archCodingAgentThirdParty

**Verdict:** Keep managed policy, endpoint containment and brokered enterprise tools. Select one compatible inference/relay mode; move hosted-only reach-back to the hosted architecture. Correct stale-risk and capability semantics together with its sibling.

**Inventory:** 19 blocks, 17 edges, 20 capability pins, 18 risk pins, 4 failure/variant scenarios. Source: [endpoint-coding-agent-third-party.yaml](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml). Guidance: [paired file](../../../data/reference/guidance/endpoint-coding-agent-third-party.yaml).

**Flows and minimal baseline:** Package/direct-tool egress is rightly separated from model proxying. Two model routes and hosted reach-back obscure which controls actually apply to a seat. Scope the endpoint reference to local execution with one auth/inference mode. External tool downstream effects require provider-side authorization; a gateway-issued grant cannot erase that separate trust boundary.

#### Capability dispositions

| Capability and locus | Disposition and direct mechanism |
| --- | --- |
| [D3-MFA @ vendorService](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L809) | Change — federation alone is not multifactor authentication (EP-02). |
| [cap-agent-action-policy-enforcement @ harness->aiGateway](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L815) | Change — gateway action policy must cover toolPlane and vendor-originated calls as well as harness edge (EP-08). |
| [cap-ai-vendor-assessment @ vendorService](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L819) | Pass, assurance — vendor assessment informs onboarding/retention acceptance; replace universal TLS-uninspectability premise (EP-06). |
| [cap-sensitive-data-redaction @ toolPlane->aiGateway](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L825) | Conditional — direct DLP for brokered tool payloads; no inferred coverage of direct subscription prompts or local egress (EP-06, EP-08). |
| [AML.M0028 @ toolPlane](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L830) | Pass — per-tool task/workspace permissions limit native actions when enforced outside mutable project settings. |
| [D3-EI @ toolPlane](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L835) | Pass — native tool isolation directly contains command execution; protect GUI/browser tools under the selected boundary too. |
| [D3-CTS @ toolPlane](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L840) | Change — protected filesystem paths are not credential transmission scoping (EP-01). |
| [AML.M0031 @ toolPlane->memory](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L843) | Change — durable state isolation/provenance/recovery is missing from a note mainly about untrusted text and hooks (EP-07). |
| [cap-input-guardrails @ hostedTools->orgData](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L849) | Change — name actual classifier/blocker and cover working-tree/external result ingress before context assembly (EP-08). |
| [D3-CH @ aiGateway](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L852) | Pass — gateway-held credentials reduce exposure; grants must be minted/obtained via real authorization services and scoped independently. |
| [cap-mcp-tool-integrity @ toolPlane->aiGateway](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L857) | Conditional — explicit runtime definition-hash verification/refusal is needed beyond provenance review/version pinning (EP-17). |
| [AML.M0029 @ hostedTools->orgData](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L862) | Pass — bound approval before enterprise data writes; map local approval described in guidance to its own actual enforcer. |
| [cap-agent-tool-registry @ aiGateway](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L865) | Conditional — inventory and admission enforcement are related but distinct; add owner/version/reconciliation semantics (EP-17). |
| [AML.M0024 @ aiGateway](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L870) | Conditional — gateway/vendor logs need endpoint events for local execution and unbrokered egress; do not imply complete coverage (EP-05). |
| [cap-shadow-ai-discovery @ harness](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L875) | Pass — device discovery detects unregistered clients directly. |
| [cap-agent-kill-switch @ govObservability](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L878) | Change — include external host stop for local children and queued work; vendor-session off and grant revocation are partial (EP-05). |
| [D3-PA @ harness](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L883) | Change — Process Analysis supports behavioral detection, not automatic host quarantine by definition (EP-05). |
| [cap-agent-action-policy-enforcement @ vendorService](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L888) | Change — configuration origin is vendor, but deterministic action enforcement is local harness/tool plane; make locus explicit (EP-08). |
| [cap-agent-egress-control @ toolPlane](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L893) | Pass — endpoint egress filtering directly bounds local tools and approved direct destinations; it does not inspect all allowed content. |
| [D3-FA @ sources->registry](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L900) | Pass — mirror quarantine scanning directly analyzes incoming files before release; retain behavioral/residual-risk limits. |

#### Risk dispositions and residual exposure

| Risk and locus | Disposition and control relationship |
| --- | --- |
| [riskPromptInjection @ hostedTools->orgData](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L711) | Pass — tool-returned repo/document instructions fit; local source-file path is missing (EP-13). |
| [riskPromptInjection @ memory](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L716) | Conditional — prose memory is injection; hook execution in same note belongs to separately pinned insecure component. |
| [riskToolRegistryTampering @ toolPlane](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L722) | Conditional — mutation after vetting fits registry tampering; distinguish initial untrusted config admission. |
| [riskInsecureModelOutput @ harness](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L727) | Pass — completion-derived native actions require independent validation/permissions. |
| [riskExcessiveDataHandlingDuringInference @ harness->vendorService](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L732) | Pass — direct subscription context/retention is genuine privacy boundary; do not assume no inspection is technically possible (EP-06). |
| [riskStaleAgentIdentityBinding @ remoteDevice->vendorService](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L738) | Change — stale owner login is not stale model-to-agent identity binding (EP-04). |
| [riskAgenticDelegationConfusedDeputy @ aiGateway->vendorService](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L745) | Conditional — requires lower-privilege caller gaining deputy authority; hosted context alone is insufficient and belongs in hosted design (EP-10). |
| [riskSensitiveDataDisclosure @ toolPlane->aiGateway](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L750) | Pass — tool payload may contain local credentials; gateway sees only this brokered path. |
| [riskToolSourceProvenance @ extTools->downstream](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L755) | Change — tool metadata/source admission belongs at definition load, not service-to-downstream action edge. |
| [riskRogueActions @ hostedTools->orgData](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L760) | Pass — unintended enterprise write at tool-to-data boundary fits. |
| [riskInsecureIntegratedComponent @ aiGateway](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L763) | Pass — compromised gateway component can alter credentials, policy and traffic. |
| [riskMCPTransportHijacking @ aiGateway->extTools](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L769) | Pass — MCP transport/session interception fits; provenance pins are not transport protection (EP-17). |
| [riskZombieShadowMCPServers @ toolPlane](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L774) | Conditional — a forgotten server fits if still discoverable/callable after decommissioning; a running old process alone is ordinary unmanaged software. |
| [riskShadowAndUnknownAgents @ harness](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L779) | Pass — unmanaged harness with inherited credentials fits inventory/lifecycle blind spot. |
| [riskInsecureIntegratedComponent @ memory](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L785) | Pass — hook/config code execution is distinct from textual injection. |
| [riskRunawayAgentToolLoops @ harness](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L791) | Pass — autonomous loops remain possible in vendor tools; seat billing is not a workflow bound (EP-17). |
| [riskToolSourceProvenance @ toolPlane->registry](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L796) | Conditional — fits tool/skill metadata only; ordinary package executable compromise is integrated-component risk. |
| [riskSensitiveDataDisclosure @ toolPlane->downstream](../../../data/reference/architectures/endpoint-coding-agent-third-party.yaml#L801) | Pass — direct native-tool exfiltration bypasses gateway; endpoint egress policy directly constrains it. |

### Personal autonomous agent — archPersonalAgent

**Verdict:** The whole-harness containment and separate relay are strong choices. Gateway-only stop/logging claims and missing per-channel/per-action distinctions prevent the current version from being a complete secure reference.

**Inventory:** 23 blocks, 16 edges, 22 capability pins, 17 risk pins, 4 failure/variant scenarios. Source: [endpoint-personal-agent.yaml](../../../data/reference/architectures/endpoint-personal-agent.yaml). Guidance: [paired file](../../../data/reference/guidance/endpoint-personal-agent.yaml).

**Flows and minimal baseline:** Messaging relay correctly exposes a second data-exit path. Bind reply routing to the authenticated source channel or a separately approved destination; content filtering alone cannot authorize recipients. Native tool, memory, workspace and package operations remain within or beside the sandbox, outside gateway visibility. Preserve isolation, correct outbound-only relay grammar and add the missing harness decision between sequential tool calls.

#### Capability dispositions

| Capability and locus | Disposition and direct mechanism |
| --- | --- |
| [cap-input-guardrails @ relay](../../../data/reference/architectures/endpoint-personal-agent.yaml#L794) | Pass — operated relay can screen inbound chat before forwarding; no implied coverage of other context paths (EP-08). |
| [cap-sensitive-data-redaction @ relay](../../../data/reference/architectures/endpoint-personal-agent.yaml#L799) | Pass — relay is correct reply-path DLP enforcer; bind permitted destination/channel as well as sensitive-content detection. |
| [D3-APA @ bridges](../../../data/reference/architectures/endpoint-personal-agent.yaml#L804) | Conditional — policy administration can implement pairing policy; distinguish policy management from authenticated per-message sender/channel check (EP-03). |
| [cap-agent-action-policy-enforcement @ gateway](../../../data/reference/architectures/endpoint-personal-agent.yaml#L810) | Pass — deterministic gateway decisions directly gate brokered actions; read-only unattended policy must also apply to relay/native paths (EP-17). |
| [D3-MAN @ harness](../../../data/reference/architectures/endpoint-personal-agent.yaml#L816) | Change — binding/Origin/outbound-only controls do not by themselves authenticate message sender and integrity (EP-03). |
| [AML.M0031 @ toolPlane->memory](../../../data/reference/architectures/endpoint-personal-agent.yaml#L821) | Change — input screening/write scanning is insufficient durable-state authorization, provenance and recovery (EP-07). |
| [D3-EI @ sandbox](../../../data/reference/architectures/endpoint-personal-agent.yaml#L824) | Pass — whole-harness microVM is direct isolation; remove claim that withholding model key leaves no sensitive data to exfiltrate (EP-18). |
| [AML.M0028 @ toolPlane](../../../data/reference/architectures/endpoint-personal-agent.yaml#L831) | Pass — native per-tool least privilege restricts local operations within the sandbox. |
| [D3-CTS @ gateway->remoteTools](../../../data/reference/architectures/endpoint-personal-agent.yaml#L836) | Conditional — valid only for audience/relying-party restriction; task-scoped permissions alone do not solve confused deputy (EP-01, EP-17). |
| [D3-CH @ gateway](../../../data/reference/architectures/endpoint-personal-agent.yaml#L842) | Pass — externally held/injected provider credentials reduce theft from sandbox; still authenticate the workload and restrict use. |
| [cap-output-guardrails @ gateway->provider](../../../data/reference/architectures/endpoint-personal-agent.yaml#L847) | Pass — model-boundary content policy can reject unsafe content; does not authorize tool actions or replace injection screening. |
| [cap-mcp-tool-integrity @ toolPlane->registry](../../../data/reference/architectures/endpoint-personal-agent.yaml#L850) | Change — signed/pinned packages are artifact integrity; remote MCP definitions enter at gateway, not package mirror (EP-08). |
| [AML.M0029 @ gateway->remoteTools](../../../data/reference/architectures/endpoint-personal-agent.yaml#L855) | Pass — approved exact remote operation before leaving customer broker; expiration and target/argument binding needed. |
| [AML.M0029 @ internalTools->orgData](../../../data/reference/architectures/endpoint-personal-agent.yaml#L860) | Pass — human approval at internal effect boundary directly blocks unapproved consequential writes. |
| [AML.M0036 @ harness->gateway](../../../data/reference/architectures/endpoint-personal-agent.yaml#L865) | Conditional — gateway can bound brokered cost; local heartbeat/retries and non-gateway activity require runtime bounds (EP-17). |
| [AML.M0024 @ gateway](../../../data/reference/architectures/endpoint-personal-agent.yaml#L868) | Change — gateway cannot emit all local/relay effects; correlate actual producers and protect audit records (EP-05). |
| [cap-agent-kill-switch @ gateway](../../../data/reference/architectures/endpoint-personal-agent.yaml#L873) | Change — gateway credential revocation leaves local, relay, mirror and heartbeat paths active (EP-05). |
| [cap-shadow-ai-discovery @ harness](../../../data/reference/architectures/endpoint-personal-agent.yaml#L878) | Pass — external device inventory detects unknown daemons. |
| [D3-PA @ harness](../../../data/reference/architectures/endpoint-personal-agent.yaml#L881) | Pass — daemon/child-process behavior monitoring directly detects suspicious execution; name telemetry outside the containment boundary. |
| [cap-agent-tool-registry @ gateway](../../../data/reference/architectures/endpoint-personal-agent.yaml#L886) | Conditional — gateway registration needs tool inventory, owner/version and discovery reconciliation as defined, not only caller enumeration (EP-17). |
| [cap-agent-egress-control @ toolPlane](../../../data/reference/architectures/endpoint-personal-agent.yaml#L891) | Pass — sandbox network allowlist is the direct network enforcer; ensure it applies to bridges/harness as well as native tools. |
| [D3-FA @ sources->registry](../../../data/reference/architectures/endpoint-personal-agent.yaml#L897) | Pass — mirror scans incoming artifacts before promotion; keep package provenance separate from remote tool-definition admission. |

#### Risk dispositions and residual exposure

| Risk and locus | Disposition and control relationship |
| --- | --- |
| [riskInsecureIntegratedComponent @ toolPlane](../../../data/reference/architectures/endpoint-personal-agent.yaml#L709) | Pass — privileged MCP/browser component compromise is plausible; describe target residual risk without universal product claims (EP-19). |
| [riskPromptInjection @ relay->platform](../../../data/reference/architectures/endpoint-personal-agent.yaml#L718) | Pass — attacker-writable messages are input; admission identifies sender but does not make body trusted. |
| [riskPromptInjection @ memory](../../../data/reference/architectures/endpoint-personal-agent.yaml#L724) | Pass — poisoned durable instructions can retrigger on heartbeat; memory provenance/recovery is essential. |
| [riskPromptInjection @ remoteTools->downstream](../../../data/reference/architectures/endpoint-personal-agent.yaml#L729) | Pass — remote fetched text/tool results can inject context; gateway output-safety filtering alone is not injection screening. |
| [riskPromptInjection @ internalTools->orgData](../../../data/reference/architectures/endpoint-personal-agent.yaml#L732) | Pass — internal documents are also untrusted model input; source location is not authorization to instruct. |
| [riskAgenticDelegationConfusedDeputy @ gateway->remoteTools](../../../data/reference/architectures/endpoint-personal-agent.yaml#L737) | Conditional — show unauthorized lower-privilege caller/metadata steering higher-privilege agent; owner-scoped token alone does not prove prevention (EP-17). |
| [riskInsecureIntegratedComponent @ harness](../../../data/reference/architectures/endpoint-personal-agent.yaml#L743) | Pass — control API vulnerability/exposure is real; binds/auth/origin checks must match actual transport (EP-03). |
| [riskStaleAgentIdentityBinding @ relay->bridges](../../../data/reference/architectures/endpoint-personal-agent.yaml#L750) | Change — stale channel pairing is not model-artifact identity substitution (EP-04). |
| [riskRunawayAgentToolLoops @ harness](../../../data/reference/architectures/endpoint-personal-agent.yaml#L756) | Pass — recurring autonomous tool loop fits; local bounds and external stop required. |
| [riskShadowAndUnknownAgents @ harness](../../../data/reference/architectures/endpoint-personal-agent.yaml#L759) | Pass — unknown daemon with inherited access fits; device discovery is direct detection. |
| [riskSensitiveDataDisclosure @ harness->gateway](../../../data/reference/architectures/endpoint-personal-agent.yaml#L762) | Pass — model request can leak memory/workspace data; present DLP pin at relay does not inspect this separate boundary (EP-08). |
| [riskInsecureModelOutput @ harness](../../../data/reference/architectures/endpoint-personal-agent.yaml#L767) | Pass — unvalidated model output selecting tool calls fits. |
| [riskCovertChannelsInModelOutputs @ gateway->provider](../../../data/reference/architectures/endpoint-personal-agent.yaml#L770) | Conditional — encoded model-output signaling fits if a secret source and receiver/channel are identified; unattended operation alone is not evidence. |
| [riskToolSourceProvenance @ registry](../../../data/reference/architectures/endpoint-personal-agent.yaml#L777) | Conditional — tools/skills metadata provenance fits; package binary integrity needs its own component/supply description. |
| [riskRogueActions @ remoteTools->downstream](../../../data/reference/architectures/endpoint-personal-agent.yaml#L780) | Pass — unattended unintended remote action fits; consequence-bound approval and read-only scheduled mode are direct controls. |
| [riskToolRegistryTampering @ gateway->remoteTools](../../../data/reference/architectures/endpoint-personal-agent.yaml#L783) | Pass — post-review catalog/schema tampering fits if admission rejects changed definitions; pin is at relevant discovery/call boundary. |
| [riskSensitiveDataDisclosure @ bridges->relay](../../../data/reference/architectures/endpoint-personal-agent.yaml#L787) | Pass — model-addressed messaging reply leaks through relay; DLP must be paired with authorized recipient/channel binding. |

### Local model runtime — archLocalInference

**Verdict:** The smallest and clearest topology. Preserve wrapper and quarantine/promote/load, but make the wrapper unbypassable, enforce local-only operation and align the normal walk with its own controls.

**Inventory:** 8 blocks, 5 edges, 11 capability pins, 11 risk pins, 2 failure/variant scenarios. Source: [endpoint-local-inference.yaml](../../../data/reference/architectures/endpoint-local-inference.yaml). Guidance: [paired file](../../../data/reference/guidance/endpoint-local-inference.yaml).

**Flows and minimal baseline:** Fetch to quarantine then promotion/load is a sound sequence using one storage tier, provided permissions truly prevent loading quarantined files. Storage contains both states, so write access must not allow self-promotion or a swap between verification and load. Keep one wrapper/runtime pair and prove raw-backend isolation. Normal request/response must show authenticated caller, bounded work and output policy; cloud offload is denied in this local-only baseline.

#### Capability dispositions

| Capability and locus | Disposition and direct mechanism |
| --- | --- |
| [D3-FA @ hub->weights](../../../data/reference/architectures/endpoint-local-inference.yaml#L362) | Pass — quarantine analysis before load is direct detection/admission evidence; format policy and integrity checks remain distinct. |
| [D3-MFA @ api](../../../data/reference/architectures/endpoint-local-inference.yaml#L367) | Change — software caller identity at wrapper is not human MFA (EP-02). |
| [cap-output-guardrails @ api->runtime](../../../data/reference/architectures/endpoint-local-inference.yaml#L372) | Conditional — actual non-bypassable API wrapper classifies content; the present normal walk contradicts it (EP-11). |
| [AML.M0004 @ api](../../../data/reference/architectures/endpoint-local-inference.yaml#L377) | Conditional — per-caller query/burst/concurrency quotas are direct; resource-heavy individual requests also need workload limits (EP-17). |
| [D3-MAN @ api](../../../data/reference/architectures/endpoint-local-inference.yaml#L380) | Change — interface binding and Host/Origin policy do not alone provide Message Authentication (EP-03). |
| [AML.M0005 @ weights](../../../data/reference/architectures/endpoint-local-inference.yaml#L386) | Change — retain at-rest access permissions; separate hash/signature verification from this access-control capability (EP-16). |
| [D3-ORA @ govObservability](../../../data/reference/architectures/endpoint-local-inference.yaml#L389) | Change — policy inventory/system of record is not Operational Risk Assessment; describe actual risk assessment or remap (EP-16). |
| [D3-PA @ runtime](../../../data/reference/architectures/endpoint-local-inference.yaml#L394) | Change — runtime behavior monitoring is Process Analysis; version inventory and host quarantine require distinct mechanisms (EP-05). |
| [AML.M0023 @ govSupplyChain](../../../data/reference/architectures/endpoint-local-inference.yaml#L399) | Change — deployment inventory is not AI BOM; retain BOM only for constituent artifacts/provenance (EP-16). |
| [cap-shadow-ai-discovery @ runtime](../../../data/reference/architectures/endpoint-local-inference.yaml#L404) | Pass — endpoint runtime discovery detects installs omitted from inventory. |
| [AML.M0008 @ govObservability](../../../data/reference/architectures/endpoint-local-inference.yaml#L407) | Pass, assurance — pre-promotion adversarial/backdoor/leakage evaluation supports model validation; it does not replace loader isolation or artifact integrity. |

#### Risk dispositions and residual exposure

| Risk and locus | Disposition and control relationship |
| --- | --- |
| [riskMaliciousLoaderDeserialization @ weights->runtime](../../../data/reference/architectures/endpoint-local-inference.yaml#L308) | Pass — unsafe checkpoint deserialization at load is precisely this risk; format policy/scanning do not replace sandboxing. |
| [riskModelSourceTampering @ hub->weights](../../../data/reference/architectures/endpoint-local-inference.yaml#L313) | Pass — compromised source/dependency/weights during acquisition fits; verify trusted digest/provenance at admission. |
| [riskDenialOfMLService @ localApps->api](../../../data/reference/architectures/endpoint-local-inference.yaml#L316) | Pass — too many or expensive local requests can exhaust resources; browser route requires reachable/accepted request (EP-11). |
| [riskModelExfiltration @ weights](../../../data/reference/architectures/endpoint-local-inference.yaml#L319) | Conditional — proprietary fine-tunes/adapters warrant theft protection; copying public weights is not an organizational secrecy loss. |
| [riskInsecureIntegratedComponent @ runtime](../../../data/reference/architectures/endpoint-local-inference.yaml#L322) | Pass — native parser/server vulnerabilities fit; patching and process isolation are needed beyond telemetry. |
| [riskInsecureModelOutput @ api->runtime](../../../data/reference/architectures/endpoint-local-inference.yaml#L327) | Pass — raw unvalidated output fits on response leg; normal wrapper must actually enforce its output policy (EP-11). |
| [riskDenialOfMLService @ api](../../../data/reference/architectures/endpoint-local-inference.yaml#L332) | Pass — exposed unauthenticated serving can exhaust capacity; distinguish network reachability from mere loopback locality. |
| [riskModelEvasion @ runtime](../../../data/reference/architectures/endpoint-local-inference.yaml#L339) | Change — fine-tune removing refusals is model modification, not perturbing inference input (EP-16). |
| [riskExcessiveDataHandlingDuringInference @ runtime](../../../data/reference/architectures/endpoint-local-inference.yaml#L345) | Pass — optional cloud offload can violate local-only promise; disable and enforce runtime egress (EP-12). |
| [riskModelDeploymentTampering @ weights->runtime](../../../data/reference/architectures/endpoint-local-inference.yaml#L350) | Pass — unauthorized replacement in serving directory is deployment tampering; access permissions and integrity verification differ. |
| [riskMaliciousLoaderDeserialization @ runtime](../../../data/reference/architectures/endpoint-local-inference.yaml#L356) | Change — inference-time template execution is not necessarily loader/deserialization; use integrated-component risk unless loading exploit is shown (EP-16). |

## Completion record

Review covers the working-tree content identified below, not a deployed product or a proof that every named exemplar supplies the target controls. Online product documentation was checked for disputed architecture claims; individual product/edition feature audits remain a separate exercise. No build/test command was run from this sub-review because root is validating an isolated snapshot. The pin counts and table coverage were checked programmatically: one disposition per source pin. All nine existing endpoint architecture/guidance files were rehashed at completion and match the initial review baseline.

The missing browser guidance is recorded as missing, not treated as reviewed. The foundational documents and canonical snapshots listed below were used directly; hashes make later changes detectable.

| File | SHA-256 at review completion |
| --- | --- |
| data/reference/architectures/endpoint-browser-ai.yaml | 0b54e2c85c89a1cd14b2b91c66b870a851b1eef0eef7b485252962b1ecc7758f |
| data/reference/guidance/endpoint-browser-ai.yaml | MISSING |
| data/reference/architectures/endpoint-coding-agent-first-party.yaml | a575af7a4e95e00131eba0149694dcfd5e026f90e40efd51197319e82f0c49d7 |
| data/reference/guidance/endpoint-coding-agent-first-party.yaml | 1d3de4e96b0b72d59684d382022cbf147d276da4359b58dd1cbae648efa9ad8f |
| data/reference/architectures/endpoint-coding-agent-third-party.yaml | 05b55e7d10087ae8d0c02241dbf39778004b5e55174e2cd82d09d9ab8a60b259 |
| data/reference/guidance/endpoint-coding-agent-third-party.yaml | e22b11260f01f2103b93af368c718be849911b85b779df8bd9ec2a23406063e3 |
| data/reference/architectures/endpoint-personal-agent.yaml | c2d6c506eceb671833c1318fe9936124d662ca157c61b4bc327c0cdb5632c913 |
| data/reference/guidance/endpoint-personal-agent.yaml | 8179fe2cbfd2c1b573a306c27396b77b1ac511dceac719f1a527ba21421a33fe |
| data/reference/architectures/endpoint-local-inference.yaml | 621a7650e12b09a96f01ca90c5f83af6a560593d228fa663e389b2bf1254c498 |
| data/reference/guidance/endpoint-local-inference.yaml | 9a261f99a9e391e7c37588def3bffb09b6b6143845df3aa65cfce546a5d43344 |
| data/ONTOLOGY.md | 0cf7e6b007b4acdc71fb3a59a1f073d95c2fcecf01434a5360a3811fbaec588e |
| data/PROVENANCE.md | 34495a3849c4567a507c97d5e4201abe7459f3b027706ef8a5e80fed43e26a93 |
| data/reference/vocabulary.yaml | 8b699f6387ec1bf5c8e9a55942ebb0a61fd4f4cbecded5c20e9e4e62afa236d5 |
| data/overlay/mitigations.yaml | b56eb2e01c328ac2739db6279dd52c70bed0a3aecc78418a25ed4fba8477edcb |
| data/overlay/specializations.yaml | 2b760c6568fbe7e3bed4d11e4a34be599b7e151d0818468b16757cd04a48c476 |
| data/cosai/risks.yaml | f555670dd51f65360aee32e0b0a0e6284598804f6e0f987a8b8f462a353cf6a8 |
| data/mitre/d3fend/1.6.0/d3fend.json | e1546d432c6aa64d45b62dd9e9484b0774ae84de7ff3605ff9dd4e20278957bf |
| data/mitre/atlas/2026.09/ATLAS.yaml | 935efa93e28294432d3e2f537eb94991ef8d1f8c58341cd360ea3321ddb66688 |
