# Cloud agents and MCP publisher review

Reviewed 2026-10-03 against `REVIEW-RUBRIC.md`. Scope: five active architectures, their paired guidance, `data/ONTOLOGY.md`, `data/PROVENANCE.md`, `data/reference/vocabulary.yaml`, the previous review guide, every pinned capability's canonical MITRE definition and specialization, and every pinned risk's CoSAI definition. Architecture and guidance source files were not edited.

## Conclusions

The common component names are useful and the major deployment boundaries are recognizable. The main problems are semantic: some controls promise something their definition does not do, local tool paths bypass the place guidance says enforces policy, and several scenarios describe an insecure outcome as the normal reference behavior. Federation needs protocol corrections before it is a reliable implementation reference.

| Architecture | Blocks (including governance) | Edges | Capability pins | Risk pins | Verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| `archActionAgent` / `cloud-action-agent` | 18 | 12 | 20 | 14 | Keep shape; repair local enforcement, response/action sequencing, and stretched pins. |
| `archAgentWorkflow` / `cloud-agent-workflow` | 20 | 14 | 21 | 17 | Keep durable supervisor pattern; clarify process trust, local controls, state provenance and replay safety. |
| `archChatAgent` / `cloud-chat-agent` | 19 | 12 | 22 | 15 | Good approval round trip; scheduled write contradicts the mandatory approval policy. |
| `archAgentFederation` / `cloud-agent-federation` | 18 | 12 | 14 | 9 | Substantial correction needed for protocol examples, skill dispatch, token claims and control coverage. |
| `archRemoteMcpServer` / `cloud-remote-mcp-server` | 13 | 8 | 16 | 13 | Good current MCP transport model; fix risk meanings, authentication/authorization pins, and confirmation/revocation claims. |

Counts enumerate pin occurrences, including repeated capabilities at distinct enforcement points. Pass in the audit below means a direct, appropriate contribution at that locus; it does not imply complete protection. Conditional means the implementation condition must be stated or checked. Change means the current claim or placement should change.

## Recommended work order

1. Resolve P1 flow/control contradictions: CA-01, CA-02, CA-09, CA-12–CA-15, CA-17–CA-19.
2. Repair taxonomy meanings and control placement across siblings: CA-03–CA-08, CA-10, CA-16, CA-20–CA-22.
3. Simplify optional features and synchronize guidance: CA-11, CA-23–CA-25.

## Findings

### CA-01 — P1 defect: native-tool paths bypass the advertised security boundary

**Evidence:** All three cloud siblings' `blocks.localTools` describe in-process handlers, direct outbound calls, local memory access, and sandbox execution. Only gateway paths have action authorization and tool permissions. `cloud-agent-workflow` guidance “Route every tool call through one governed gateway” calls it the only path; “Treat retrieved content as input” puts inter-agent screening and outbound DLP there although `orchestration->subagents`, `localTools->state`, and `orchestration->state` do not traverse it. The same local memory paths exist in the action/chat designs. Egress control is pinned to `localTools` but described as the sandbox's network policy, leaving the unsandboxed harness handlers ambiguous.

**Why / smallest change:** A compromised or steered local handler can use ambient data and credentials without the promised checks. Keep local handlers; put embedded permission/action checks on their dispatcher and screening on memory/retrieval return before context assembly. Apply host/workload network policy to unsandboxed handlers as well as the sandbox. Explain which trusted orchestration writes are exempt from model action approval. Update “every network call” claims to name actual exceptions; do not route memory and checkpoints through the AI gateway just to make the prose true.

**Acceptance:** Trace one local memory read/write, local tool invocation, sandbox network request and remote tool invocation. Each has a named authorizer, credential owner and content boundary; a denied local action cannot execute through a different route. The guidance and pins name those same enforcers. **Affected:** action, workflow, chat; federation's memory handler should follow the corrected pattern.

### CA-02 — P1 defect: the chat scheduled scenario bypasses an approval rule that says it cannot

**Evidence:** `cloud-chat-agent.yaml:674` onward pins `cap-agent-action-policy-enforcement` to `gateway`: mutations require approval bound to action, arguments and session. Yet scenario “A scheduled run fires with the thread closed” (`:809`) goes from model return directly to `gateway->internalTools`, then an unattended write. Its note says catalogue and scoped grant are the only bounds. Guidance says a closed-session background continuation must meet a different architecture's requirements.

**Smallest change:** Make the scenario stop/suspend at the gateway when approval is absent, or remove the scheduler from this reference design and link the action-agent design as the separate unattended pattern. If bounded standing authorization is deliberately supported, define its exact operation/resource/time limits and show enforcement instead of calling it absent approval.

**Acceptance:** A scheduled mutation lacking the required authorization cannot reach `orgData`; scenario, pin, guidance and session-expiry rule agree. No new boxes are needed.

### CA-03 — P2 defect: credential recipient scoping is repeatedly used as permission policy

**Evidence:** `D3-CTS` means limiting the relying parties to which a credential is transmitted. Action pin `gateway->internalTools` (`:645`) instead defines permission intersection. Workflow pin `orchestration->subagents` (`:692`) defines task privilege narrowing, even though the gateway is said to retain all remote credentials. Chat pin (`:683`) contains a real token-exchange claim, but blends it with action authorization. `D3-APA` at action/workflow ingress and chat `user->entry` describes grant/identity binding without identifying the administered policy. Its canonical definition includes defining, implementing and managing policy, so an ingress policy implementation can legitimately contribute; identity binding alone does not demonstrate it.

**Smallest change:** Keep `D3-CTS` only where recipient allowlisting, audience validation and non-forwarding are actually enforced. Use existing `AML.M0028` and `cap-agent-action-policy-enforcement` for operation/resource permissions. For `D3-APA`, name the administered policy and its implementation at the existing locus, or move it to the actual policy owner if ingress only authenticates. A separate governance component is not required. Distinguish proof of identity from authorization. Do not add a second pin if the existing direct policy pin already makes the requirement clear.

**Acceptance:** Each CTS note names the credential and allowed recipient, each APA note names an administered policy, and per-operation denial is attributed to the actual PDP/handler. Update corresponding guidance citations.

### CA-04 — P2 defect: retrieval trust is confused with access control; grounding lacks an output enforcer

**Evidence:** Chat `cap-retrieval-grounding-checks@memory` (`:642`) says only “asking user's permissions,” already the purpose of `cap-data-access-governance`. Its guidance additionally demands checking final claims against cited sources, with no corresponding output-stage pin. Action/workflow pins describe ingest trust and index isolation, which directly cover the retrieval half of the specialization, but their guidance largely describes scoping; no corpus ingestion flow is described. The specialization at `data/overlay/specializations.yaml:83` explicitly includes source/poisoning checks and output grounding.

**Smallest change:** In chat, describe source admission and query-time document screening on the retrieval path, and put grounding verification at the output-handling stage if it is a requirement. Otherwise remove the grounding promise and use the ACL capability for the existing permission claim. Action/workflow should state the ingest/source boundary in the existing store note and whether output grounding is outside this profile. No dedicated “grounding service” is required.

**Acceptance:** An entitled but malicious document is evaluated separately from an unauthorized document; a factually unsupported answer is either checked at an identified output stage or honestly outside the claimed control.

### CA-05 — P2 defect: tool-definition integrity is pinned to governance without the runtime verifier

**Evidence:** Action/workflow/chat pin `cap-mcp-tool-integrity` only at `govSupplyChain`; notes claim detecting a changed definition after admission. The canonical specialization (`specializations.yaml:489`) runs where definitions are loaded, refuses a mismatched definition, and repeats after update. MCP publisher puts it at `toolDefs->service` but says it is implemented at the gateway, which is not on that loading edge. Publisher guidance also relies on consuming clients to pin tool definitions.

**Smallest change:** Keep admission ownership at supply-chain governance; move the integrity pin to the gateway/harness definition loader for consumers, or explicitly state a runtime verifier there. On the publisher, pin the service loader/release verification it operates; describe client-side admission as a separate responsibility. Hash stable tool IDs/content versions, with principal/scope-sensitive listings handled explicitly.

**Acceptance:** An already admitted description changes; the consuming runtime refuses the changed definition before offering it to a model. A publisher release change cannot be claimed to force an independent client's refusal.

### CA-06 — P2 defect: generic package provenance is assigned a tool-metadata risk

**Evidence:** All three siblings pin `riskToolSourceProvenance@registry` with generated-code dependency installs and mirror write compromise. The canonical risk (`data/cosai/risks.yaml:2235`) concerns unvetted tool registries/manifests/metadata used for tool selection; it explicitly distinguishes previously admitted registry tampering. A generic Python/npm dependency install is not that mechanism.

**Smallest change:** Use `riskInsecureIntegratedComponent` for malicious/vulnerable executable dependencies, with `D3-FA` and admission controls as partial detection. Retain `riskToolSourceProvenance` only if the mirror actually delivers tool/skill metadata consumed for tool selection, and state that path. A post-admission metadata mutation belongs to `riskToolRegistryTampering`.

**Acceptance:** Each risk note identifies whether the attack changes executable code, source trust before admission, or admitted metadata after admission; controls and failure scenarios match that mechanism.

### CA-07 — P2 defect: model validation and file analysis have broader release claims than their definitions

**Evidence:** `AML.M0008@govSupplyChain` in the three siblings is described as a gate for every model, prompt, catalogue/tool and agent change. Its canonical definition is model validation against backdoors, leakage and adversarial influence. Behavioral validation of the assembled model application is a reasonable contribution, but not complete dependency/configuration assurance. Action/chat guidance cites `D3-FA` under behavioral change evaluation without describing file analysis. `D3-FA@sources->registry` itself correctly includes malware scanning, but signature/digest verification alone is not malware detection.

**Smallest change:** Keep the useful checks; separate model/application behavioral evaluation from definition integrity and dependency analysis in the existing release paragraph. Cite each capability only for its actual check; no extra pipeline boxes.

**Acceptance:** Release evidence separately identifies behavioral test results, admitted definition hashes, and package analysis. A passing model evaluation never establishes dependency integrity or safe tool arguments.

### CA-08 — P2 conditional defect: quota pins do not bound local execution or the whole workflow

**Evidence:** The three siblings pin `AML.M0036` only at the gateway and claim it ends loops. This directly bounds brokered token/call spend, but local sandbox computation, in-process loops, orchestration fan-out and local state writes can continue without another gateway request. Federation and MCP publisher pin only `AML.M0004` despite describing streams, retries, expensive tool workloads and per-task costs.

**Smallest change:** Keep query-rate limits; state shared per-run accounting, runtime deadline/cancellation, local execution limits and downstream cost bounds at the existing harness/tool executor. For federation/MCP, add `AML.M0036` only where a task/handler enforces actual work limits; otherwise narrow claims to request volume.

**Acceptance:** A single permitted request that loops locally or launches an expensive long-running tool hits a defined runtime/work budget. Independent cheap-request rate limits remain distinguishable.

### CA-09 — P1 defect: single-agent walkthrough turns the gateway into the planner

**Evidence:** `cloud-action-agent` main walkthrough jumps `provider->gateway` directly to `gateway->internalTools`; the prompt-injection and timer scenarios do the same. Blocks say the harness chooses and dispatches actions; the gateway brokers them. The final `gateway->planner` claims the outcome is posted to the originating channel, but no subsequent tool call/event shows that delivery. Workflow main walkthrough similarly jumps an internal tool result into a third-party call without the harness choosing it, and claims result delivery in a checkpoint step.

**Smallest change:** Show `gateway->planner` / `gateway->harness` for the model/tool result and the harness's next call back to the gateway before executing it. Add the actual result-channel tool call using existing edges or end the walk at durable completion without claiming delivery. Nesting can omit in-process dispatch arrows, but it cannot make a network gateway reason or deliver an event that did not occur.

**Acceptance:** Every model-generated action has a harness decision/dispatch before execution, and every claimed delivered result has a real modeled delivery path. Chat's main approval round trip is the good sibling example.

### CA-10 — P2 defect: workflow identity, state and sandbox claims conflict internally

**Evidence:** `cloud-agent-workflow.blocks.harness` says no separate identity in its shared process; `D3-AA@subagents` says one logical principal per specialist. Its main walk `state->localTools` calls previous-run content “unattributed,” conflicting with run-scoped memory and hardening. `D3-EI@internalTools` says generated code never runs on the orchestration tier, but `localTools.items.sandboxedTools` describes its isolated execution path there. The isolation pin is absent from the actual local sandbox.

**Smallest change:** State one OS/process trust boundary with scheduler-assigned logical roles; the trusted broker must derive specialist context instead of accepting an arbitrary role string from model output. Label provenance on shared state and explicitly authorize any reusable cross-run corpus separately. Put isolation at the actual sandbox execution location and remove the conflicting “never” statement. Do not require a separate service per subagent unless protection from process compromise is a requirement.

**Acceptance:** A specialist cannot request another logical role through untrusted arguments; process compromise is honestly documented as compromising all co-resident agents; cross-run reads are purposeful and authorized; every generated-code path reaches the same stated sandbox enforcer.

### CA-11 — P2 design judgment: identical item packs manufacture optional features and complexity

**Evidence:** All three siblings carry `aiGatewayTraffic` including Skills catalogue while a deviation says its supply path is outside scope; the designs now draw a package registry but still claim the supply chain is not drawn. `toolServicesRemote` forces Remote MCP, APIs and A2A peers into every tool tier. A sandbox/package mirror is included even for a deterministic refund agent, although arbitrary generated-code execution is not essential to the archetype.

**Smallest change:** Preserve canonical names and role meanings; permit subsets of canonical items according to actual traffic. Make code execution/package installation and A2A peer delegation optional extensions to the minimal agent profile. Where retained, document real paths and controls. Remove obsolete skill-supply deviations, not the real supply-chain protections.

**Acceptance:** Each visible item has a flow or an explicit scoped role in this deployment; comparing siblings still yields the same name for the same component. Removing an optional sandbox also removes its unused registry/source path and pins coherently.

### CA-12 — P1 defect: federation assumes a standard skill selector that the protocol does not supply

**Evidence:** `cloud-agent-federation` inbound scenario checks the skill `id` “in the request”; “A valid token for one skill invokes another” treats this as standard A2A dispatch. The standard `SendMessageRequest` has message/configuration/metadata/tenant fields, without a standard skill selector. Server authorization is implementation-defined. [A2A specification §§3.2.1, 7.5](https://a2a-protocol.org/latest/specification/)

**Smallest change:** Define a deterministic application dispatch contract (or separate scoped agent endpoints), and carry authorization context through to internal tools. A model choosing an action from free text must not define its own authorization target. Keep per-operation policy; label the dispatch mapping as this reference profile's convention.

**Acceptance:** A valid lookup grant paired with text requesting an update fails at a deterministic operation/resource check. The example names the exact application selector and how it is bound to execution.

### CA-13 — P1 defect: federation protocol examples mix incorrect HTTP paths and message shapes

**Evidence:** Its walkthrough and scenarios repeatedly use `/.well-known/agent-card`, `/message/send` and `message/stream`; v1 uses `/.well-known/agent-card.json`, `/message:send` and `/message:stream` for HTTP+JSON. Push bodies use the `StreamResponse` wrapper, not an unwrapped update event. [A2A specification §§4.3.3, 8.2, 11.3](https://a2a-protocol.org/latest/specification/)

**Smallest change / acceptance:** Pick HTTP+JSON as the concrete walkthrough binding, correct paths/wrappers and validate a request, response, resume and push example against that binding. Keep other bindings in notes rather than mixing syntax into one sequence. Guidance should cite the precise protocol version.

### CA-14 — P1 defect: TLS, audience and token exchange are claimed to prevent more than they do

**Evidence:** Federation `D3-CTS@gateway->authServer` says “sender-constrained or over mutual TLS” prevents replay of a token taken from logs. TLS client authentication and certificate-bound access tokens are separate features. [RFC 8705 §3](https://www.rfc-editor.org/rfc/rfc8705.html) The description also says a peer cannot delegate onward because its incoming token is audience-bound. Audience restriction stops reuse at a different relying party; it does not stop a peer using its own credential, exchanging a token under an allowed policy, or forwarding task content. Token exchange is explicitly subject to authorization-server policy. [RFC 8693](https://www.rfc-editor.org/rfc/rfc8693.html)

**Smallest change:** Require actual certificate-bound token validation or DPoP for the replay-resistant variant; otherwise state residual bearer replay. Replace “authority must not propagate” absolutes with no inbound-token passthrough plus explicit policy on downstream delegation, data release and audit. Keep claims within what our gateway can enforce.

**Acceptance:** A copied bearer cannot be accepted as sender-constrained without proof of the bound key; a peer's onward activity is governed by an agreement/policy and evidenced by trace events, not inferred from our token's audience.

### CA-15 — P1 defect: federation pins controls to only one peer path and equates login with action approval

**Evidence:** Input screening is pinned only on `gateway->partner`, while vendor artifacts and inbound requests enter through `gateway->peerVendor`. Redaction is pinned only to the vendor edge; the partner also receives model-composed payloads. The risk note calls classification the “only control” against a partner artifact, while another note claims consequential actions always stop for a person. `AML.M0029@entry->harness` describes obtaining user authentication/consent for the peer, not approval of a particular consequential action. Inbound autonomous-peer scenario has no human yet can reach our systems.

**Smallest change:** Put common content screening/redaction on the gateway with explicit directional coverage. Keep consent as authorization setup; bind human approval to the actual irreversible action at `gateway->internalTools`/handler or explicitly limit autonomous inbound tasks to approved read-only operations. Pin data access enforcement at the tool/data boundary rather than relying on token minting alone. Apply task and object ownership checks to polling, resume and webhook events.

**Acceptance:** A malicious vendor artifact receives the same screen as a partner artifact; data cannot leave via the unpinned peer path; authenticating at a peer does not by itself authorize a payment/write. An inbound machine caller cannot escape its operation and tenant policy.

### CA-16 — P2 defect: federation reuses tool-specific integrity for cards without acknowledging the scope change

**Evidence:** `cap-mcp-tool-integrity@gateway->peerVendor` is a card signature/hash control, while the specialization explicitly covers tool servers and loaded tool definitions. `cap-agent-tool-registry` legitimately includes agent cards. Card admission is a sensible control; the wrong part is presenting the tool-specific specialization as an exact match. Partner cards require the same integrity claim, but no integrity pin sits on that edge. Fetching a signing key from a card-provided `jku` also needs destination restrictions and an independently admitted trust anchor.

**Smallest change:** Use parent `AML.M0014` for a pinned/verified agent-card artifact if the narrower tool specialization remains tool-specific; otherwise deliberately broaden/re-author the specialization across the catalogue. Put verification at the gateway, covering both peers. Pin trusted issuer/key provenance at admission, restrict key/discovery fetch URLs and define approved key rotation. Avoid live refetch on every task if cached admitted content plus explicit update handling meets the design.

**Acceptance:** An attacker-controlled card cannot establish its own trusted signing key, redirect discovery to internal addresses or silently change endpoint/skill metadata. The chosen capability's definition expressly covers agent cards.

### CA-17 — P1 defect: revocation is claimed without the lifecycle propagation that makes it true

**Evidence:** Federation and MCP publisher claim client/group removal, introspection and refresh rotation revoke existing access immediately. A resource authorization server may not know an upstream IdP group changed; refresh grants may persist; an in-flight task may continue after token rejection. Introspection may be cached, which creates an explicit stale-authorization window. [RFC 7662 §§2.2, 4](https://www.rfc-editor.org/rfc/rfc7662.html) Federation `cap-agent-kill-switch` describes revoking a peer registration, not terminating its already running work; MCP pin describes only token revocation. The specialization requires stopping execution and queued/delegated work.

**Smallest change:** Define local deny/revoke handling, upstream lifecycle-event/revalidation propagation, refresh-grant revocation, maximum cache/token lifetimes and cancellation of active/queued local work. For externally operated peers, state that our access/data flow can be stopped; remote process termination requires peer support and confirmation. Use credential-revocation capability instead of a full kill-switch claim where that is all the component does.

**Acceptance:** Revocation tests include existing access and refresh tokens, an active stream, an in-flight side effect, queued work and each participating authorization server. Publish the observed maximum stop window; do not equate key deletion with revoking every previously minted token.

### CA-18 — P1 defect: remote MCP confirmation is accepted from the very client being constrained

**Evidence:** `cloud-remote-mcp-server.blocks.service.items.handlers` and guidance say a consequential handler returns `input_required` and executes on retry carrying “the caller's confirmation.” The stated threat model includes malicious/steered machine callers. MCP MRTR delivers input requests and responses; it is not proof an independent human reviewed the action. The current protocol mechanism is real. [MCP tools / multi-round-trip example](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)

**Smallest change:** Treat client elicitation as UX assistance. If human approval is a security requirement, verify a server-side approval artifact bound to principal, operation, canonical arguments, tenant, expiry and one-time consumption, issued by a trusted approval service/channel. Alternatively constrain autonomous calls to pre-authorized operations and do not claim confirmation is a human gate. This can live in the handler; it needs no new box unless a separate approval service is actually deployed.

**Acceptance:** A client fabricating an affirmative input response cannot execute a consequential operation requiring human approval.

### CA-19 — P1 defect: MCP authorization/handle protection is credited to message authentication

**Evidence:** `D3-MAN@callers->gateway` (`:548`) describes HTTPS and Origin validation. Paired guidance's state-handle principal/expiry/access checks cite only `D3-MAN`. Its canonical definition authenticates the message sender and integrity. Server-authenticated TLS protects transport; Origin validation limits browser-origin attacks but does not authenticate an arbitrary caller or authorize access to a handle. The architecture elsewhere correctly describes bearer validation, which should be the explicit identity mechanism. MCP lists Origin validation and connection authentication as separate requirements. [MCP Streamable HTTP security](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)

**Smallest change:** Keep TLS/Origin requirements, assign transport protection to the appropriate existing capability, and explicitly pin caller authentication and per-handle authorization at the service. Use `AML.M0028`/access mediation for operation/tenant/state ownership; do not claim Origin proves a caller identity. Add `AML.M0033` for schema/argument validation at handlers if that direct protection is to be claimed.

**Acceptance:** A non-browser caller with an arbitrary Origin and another subject's state handle is denied by verified identity and object authorization, independently of TLS success. Malformed tool arguments fail before backend execution.

### CA-20 — P2 defect: three risk definitions are stretched in federation/MCP

**Evidence:** `riskStaleAgentIdentityBinding` at federation `authServer` (`:589`) and MCP `service->authServer` (`:522`) describes routine deregistration/group removal. Canonical `risks.yaml:2611` specifically means an underlying model/artifact is replaced while its old identity remains authorized. MCP `riskMCPTransportHijacking@service` (`:500`) describes guessable/unscoped application handles, while the canonical risk (`:2730`) concerns intercepted/replayed/modified transport. `riskCrossTenantCredentialPropagation@service->orgData` describes any missing row-tenant filter; canonical (`:3210`) requires credential/identity propagation across tenants.

**Smallest change:** Remove the stale-model risk where no model/artifact substitution is modeled; retain ordinary revocation as a requirement. Put transport hijacking on `callers->gateway` with interception/replay mechanism, and describe object-handle authorization separately. Keep cross-tenant credential risk only with a concrete shared/mis-scoped token/cache mechanism; use disclosure/confused-deputy risk for an application row-filter defect.

**Acceptance:** Every revised risk note identifies the canonical precondition and consequence, and a reviewer can reproduce that mechanism without changing the risk's definition.

### CA-21 — P2 defect: MCP patching and server lifecycle claims exceed pinned capabilities

**Evidence:** `D3-AVE@govObservability` (`:585`) describes tracking SDK/gateway/handler patching “with an owner and a clock”; canonical Asset Vulnerability Enumeration enriches inventory with vulnerability knowledge. `D3-SYSVA@service` describes application assessment, a valid assurance activity, but not runtime prevention. `riskZombieShadowMCPServers@service` mentions surviving grants, omitting stale discovery/DNS/endpoints that define the canonical risk. Guidance says registry listing is required but `cap-agent-tool-registry` is not pinned.

**Smallest change:** Describe AVE as vulnerability identification/prioritization, use the existing update capability for remediation if needed, and keep assessment in the assurance plane. Specify inventory owner/expiry and decommission removal from registry, DNS/load balancing and credentials. Do not count logging or vulnerability enumeration as preventing zombie endpoints.

**Acceptance:** An expired server is no longer discoverable/reachable and has no live grants; one sample vulnerable dependency has both an inventory finding and independently verified remediation evidence.

### CA-22 — P2 defect: several less central risk notes change the failure mechanism

**Evidence:** Workflow `riskOrchestratorRouteHijacking@orchestration` describes steering specialist routing; the canonical risk is model/orchestration routing manipulation. This is valid only when specialist routing changes model/authorized execution routing, not for ordinary bad planning. MCP `riskAgenticDelegationConfusedDeputy@callers->authServer` describes OAuth issuer mix-up, which is a real attack but not automatically the high-privilege deputy acting without caller authorization that the risk defines. MCP `riskSensitiveDataDisclosure@service->downstream` says the service always uses its own identity, contradicted by the edge's supported OBO exchange. MCP `riskEconomicDenialOfWallet` describes only backend falling over, which needs a cost amplification mechanism to distinguish it from ordinary availability failure.

**Smallest change / acceptance:** Keep genuine threats and rewrite each note around its actual mechanism. Distinguish configuration/route tampering from planning failure; model issuer mix-up as its own protocol security concern without forcing an unrelated risk; describe disclosure under service-credential fallback and OBO over-broad export; connect economic abuse to billed/expensive tool work.

### CA-23 — P2 design judgment: protocol profiles and deployment choices are written as universal standards

**Evidence:** MCP requires three identity profiles in one reference and says a stateless ASGI application is the shape to require; ASGI is one implementation. Guidance rejects DCR outright although the current authorization specification deprecates but permits it for compatibility. [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) Federation's identity assertion examples omit explicit ID-JAG request/type/client binding details while invoking the draft as the mechanism; the profile should either be complete or remain conceptual. [Identity Assertion JWT Authorization Grant §4.3](https://www.ietf.org/archive/id/draft-ietf-oauth-identity-assertion-authz-grant-04.html)

**Smallest change:** Label customer policy (signed cards, no shared secrets, no legacy DCR), optional deployment profiles (public interactive/enterprise/autonomous), protocol requirements, and illustrative framework choices distinctly. Keep the main MCP walkthrough to one chosen profile with alternate scenarios. A separately drawn IdP must be in the operator's ownership band; an external customer IdP is not infrastructure we run. Keep the federation exchange abstract unless exact normative parameter values are maintained.

**Acceptance:** A reader can distinguish MUST-from-protocol, required-by-this-reference and optional extension; no organization is told it must deploy all grant profiles or ASGI. Do not undo the correct 2026-07-28 protocol-session removal or header/body matching rules: these were checked against the current primary source.

### CA-24 — P2 conditional defect: memory scope, authorization freshness and audit retention are underspecified

**Evidence:** `AML.M0031` across all four agent designs mainly means case/run/session scope, while its canonical definition also covers authenticated writes, provenance, integrity, retention and recovery. Current workflow walk explicitly loses provenance. “No cross-session reads, ever” is broader than necessary for deliberately authorized durable memories, while keeping all old authorized records in one session can still expose data after entitlements change. Trace pins call for reasoning, inputs and results without matching data minimization, redaction, access and retention requirements.

**Smallest change:** Keep a narrow memory baseline: authorized namespace, write provenance, retention/deletion, integrity/recovery and entitlement reevaluation when sensitive content is reused. State that trusted reusable knowledge may be separately authorized. Trace decisions/tool events and available model summaries; do not require inaccessible internal model reasoning or unrestricted raw secrets in the audit.

**Acceptance:** Revoking access to a record prevents its later sensitive reuse from memory, a poisoned memory can be quarantined/restored, and exported traces contain no credentials/raw secrets. The memory pin remains partial if only namespace isolation is implemented.

### CA-25 — P3 defect: prose and walkthroughs need a parity pass after the semantic fixes

**Evidence:** Action approval note says the operator is reached “over the front end” although the design explicitly has none; `internalTools->operator` is the actual approval path. Inference responses are repeatedly called “unauthenticated content”; authenticated TLS/provider origin does not make output safe, but “untrusted output” is the accurate term. Federation introduction calls cards signed before acknowledging signing is optional; guidance says “two identities on every task” while autonomous inbound work has no user. The tool-side gateway cannot see arbitrary in-process activity; phrases “invisible to every drawn control” also overstate the absence of supply-chain/logging controls.

**Smallest change / acceptance:** Rewrite these statements to the actual profile and mechanism. Walk the ordinary request, denied action, approval, retrieval, replay and cancellation stories again after fixes; each should be a coherent secure target state, with attack outcomes identified as failures instead of implied normal behavior.

## Architecture-level flow and risk verdicts

### Single agent workflow

Retain trigger→harness, gateway→model/tool services, tool→record and operator→trigger approval return. Native handler containment is useful as a deployment statement, but the omitted local call still needs an embedded permission boundary. The source→mirror ingest arrow is acceptable as a one-way artifact flow; clarify that the mirror initiates the pull if using it as a network sequence. Correct the harness return/dispatch in CA-09. External actions need the same policy/approval rules as internal records; the unattended external-action scenario currently mentions only the catalogue/compensation. A compensation cannot unsend disclosed data or a delivered email: irreversible classes stay above the approval threshold. Preserve residual prompt injection, unsafe output and malicious dependency risk after screening.

### Multi-agent workflow

The extra supervisor, specialists and engine journal path earn their place. A shared process with trusted logical-role dispatch is a reasonable minimal design; separate workload credentials alone cannot isolate hostile code in that process. Keep approval suspension, fresh authorization on resume and per-side-effect idempotency. State and inter-agent messages must be screened/authorized at their actual local boundaries. The ordinary walk should retrieve attributed, authorized state; attacks and replay duplication belong in the failure scenarios. A gateway inference budget does not stop a scheduler or sandbox that is consuming resources locally.

### Chat agent

The main proposal→render→specific approval→execution→result sequence is the strongest normal flow of the three. Keep the frontend safe-rendering control and separate session request-rate and per-turn work limits. Resolve the scheduler contradiction; change memory retrieval trust and grounding placement; extend direct authorization to native tools. Prompt injection remains possible even with a present human, and an allowlisted SaaS destination can still be used to exfiltrate to an unauthorized recipient, so destination allowlisting is only one part of output/action policy.

### Agent federation

Opaque peer blocks are the right ownership abstraction. An IdP and resource authorization server can be separate logical roles even when one deployment supplies both; the drawing need not require separate products. Identity assertions, token exchange and an admitted peer registry are a useful reference profile, provided the actual profile is explicit and all actor/tenant/resource constraints are validated. Fix dispatch and protocol examples, then make screening/data handling cover both peer paths. Keep federation grants and action approval separate. Our gateway can stop our own flows; a foreign task needs protocol cancellation plus confirmed peer cooperation. Trace correlation proves what peers report, not complete visibility into every internal delegation.

### Remote MCP server

Preserve current stateless transport, authorization per request, header/body agreement, audience restriction and no passthrough. Those are concrete strengths. The minimal design is a protocol/handler service, an authorization service and data/downstream systems, with a gateway if it performs the claimed edge duties. The externally operated client remains untrusted even after OAuth authentication. Tool argument/schema checks, object/tenant authorization, output bounds, work budgets and action confirmation must live in trusted server code. The consuming client's prompt defenses and hash pins cannot be enforced by the publisher alone. All three auth variants are valid scenarios but are optional service profiles, not an obligation to support every caller class.

## Exhaustive pin audit

Each table row corresponds to one source pin, in source order. Findings above provide remediation and acceptance criteria. Canonical checks used the pinned files `data/mitre/d3fend/1.6.0/d3fend.json`, `data/mitre/atlas/2026.09/ATLAS.yaml`, `data/overlay/specializations.yaml`, `data/overlay/mitigations.yaml`, and `data/cosai/risks.yaml`. The specialization's parent was read as well as the local text.

### cloud-action-agent — capability pins

| Capability | Pin | Disposition / direct-control reasoning |
| --- | --- | --- |
| `D3-APA` | `events->planner` | Change — Note supplies ingress grant binding, without an administered policy; retain here if actual policy implementation is identified (CA-03). |
| `cap-agent-tool-registry` | `govSupplyChain` | Pass — Governance admits named tools; runtime consults the approved catalogue to refuse unknown tools. |
| `AML.M0008` | `govSupplyChain` | Conditional — Model/application behavioral evaluation is direct assurance; it does not establish safe dependencies or catalogue integrity (CA-07). |
| `AML.M0028` | `gateway->internalTools` | Change — Permission configuration is appropriate here, but parameter validation and compensation are separate controls; describe actual allowed operations (CA-03, CA-07). |
| `AML.M0029` | `internalTools->orgData` | Pass — Internal-tool handler gates high-consequence record writes; exact-action approval and trusted operator identity must survive the round trip. |
| `cap-agent-action-policy-enforcement` | `gateway` | Pass — Gateway evaluates principal, operation, record and value before remote action execution; native-tool coverage still needs CA-01. |
| `D3-AA` | `planner` | Conditional — A distinct workload principal needs an authenticating verifier; inventory/revocability alone is not authentication. |
| `cap-data-access-governance` | `internalTools->orgData` | Pass — Tool/data authorization prevents another account’s records entering the requesting case’s context. |
| `cap-input-guardrails` | `events->planner` | Pass — Ingress classifier directly screens attacker-controlled event text; false negatives remain. |
| `AML.M0031` | `stateRetrieval` | Conditional — Store case scoping directly hardens memory; provenance, authorized writes, retention and recovery remain partial (CA-24). |
| `D3-CH` | `planner->gateway` | Pass — Gateway holds/brokers remote credentials, reducing standing-secret exposure in the harness; local credentials need explicit treatment. |
| `AML.M0036` | `gateway` | Conditional — Gateway limits remote token/call spend; runtime/local resource consumption remains outside this pin (CA-08). |
| `cap-agent-egress-control` | `localTools` | Conditional — Sandbox network enforcer blocks unauthorized destinations; also bound unsandboxed handler egress and allowed-host abuse (CA-01). |
| `cap-input-guardrails` | `gateway` | Pass — Gateway screens remote tool/record returns before the next model call; memory returns need local screening (CA-01). |
| `D3-CTS` | `gateway->internalTools` | Change — Note is permission intersection; CTS needs credential recipient/audience restrictions (CA-03). |
| `cap-agent-tracing` | `govObservability` | Pass — Off-runtime trace storage detects/reconstructs action chains; apply privacy controls and avoid promising unavailable internal reasoning (CA-24). |
| `cap-agent-kill-switch` | `govObservability` | Conditional — External halt/revoke is direct recovery; explicitly stop queued/delegated work as well as the current loop (CA-17). |
| `cap-retrieval-grounding-checks` | `stateRetrieval` | Conditional — Ingest trust/index isolation directly addresses poisoned retrieval; identify admission/query checks and partial grounding scope (CA-04). |
| `cap-mcp-tool-integrity` | `govSupplyChain` | Change — Governance owns admission; silent definition change must be refused by the runtime loader (CA-05). |
| `D3-FA` | `sources->registry` | Pass — Mirror file analysis can detect malicious artifacts before admission; signatures/hashes do not themselves establish benignness (CA-07). |

### cloud-action-agent — risk pins

| Risk | Pin | Disposition / direct mapping |
| --- | --- | --- |
| `riskPromptInjection` | `events->planner` | Pass — Attacker event instructions enter model context; ingress screening plus deterministic action policy bound effects. |
| `riskPromptInjection` | `internalTools->orgData` | Pass — Stored record instructions return into context; remote-return screening is correctly separate from data entitlements. |
| `riskRogueActions` | `internalTools->orgData` | Pass — Model-selected record write can be wrong; permission, approval and compensation directly limit consequence. |
| `riskInsecureModelOutput` | `gateway->provider` | Pass — Model completion is untrusted input to action execution; parameter validation/action policy are direct, not authentication claims. |
| `riskAgenticDelegationConfusedDeputy` | `planner` | Pass — Ambient workload privilege may exceed requester grant; authorize each action against both and scope retrieval. |
| `riskSensitiveDataDisclosure` | `internalTools->orgData` | Pass — Over-broad account reads disclose records; data-access enforcement directly answers the mechanism. |
| `riskRunawayAgentToolLoops` | `planner` | Pass — Loop recursion materializes at planner; remote budget limits plus runtime termination needed (CA-08). |
| `riskPromptInjection` | `stateRetrieval` | Pass — Persisted injected instructions can steer later cases; memory isolation and screening are distinct protections. |
| `riskRetrievalVectorStorePoisoning` | `stateRetrieval` | Pass — Writable corpus/index can poison retrieval; ACL alone does not defend entitled malicious content (CA-04). |
| `riskInsecureIntegratedComponent` | `localTools` | Pass — In-process vulnerable/malicious handler can compromise host authority; gateway is not the direct mitigation (CA-01). |
| `riskPromptInjection` | `gateway->extTools` | Pass — External tool return can carry instructions; screening and downstream action bounds fit. |
| `riskToolRegistryTampering` | `gateway->internalTools` | Pass — Altered admitted catalogue controls tool selection; runtime definition integrity must accompany admission (CA-05). |
| `riskEconomicDenialOfWallet` | `gateway` | Pass — Open triggers can generate costly inference; query/work limits address different amplification modes. |
| `riskToolSourceProvenance` | `registry` | Change — Generic executable dependency/mirror compromise is not tool metadata provenance unless that exact metadata flow exists (CA-06). |

### cloud-agent-workflow — capability pins

| Capability | Pin | Disposition / direct-control reasoning |
| --- | --- | --- |
| `AML.M0031` | `state` | Conditional — Run-scoped authorized state is direct hardening; ordinary walk’s unattributed earlier-run read contradicts it (CA-10, CA-24). |
| `AML.M0008` | `govSupplyChain` | Conditional — Behavioral evaluation is direct model assurance; narrow catalogue/dependency release claims (CA-07). |
| `cap-agent-tracing` | `govObservability` | Pass — Correlated supervisor/specialist/engine traces directly reduce delegation opacity; log privacy and explicit monitoring remain necessary. |
| `D3-APA` | `events->harness` | Change — Grant binding alone does not evidence the administered policy; identify actual ingress policy implementation or its owner (CA-03). |
| `D3-AA` | `subagents` | Conditional — Broker must authenticate trusted scheduler role context; same-process logical identities do not contain process compromise (CA-10). |
| `D3-CH` | `harness->gateway` | Pass — Brokered short-lived remote credentials reduce credential exposure; cannot imply local handlers have no secrets. |
| `cap-agent-action-policy-enforcement` | `gateway` | Pass — Gateway deterministic tool-call authorization directly blocks disallowed remote actions; local dispatcher is separate (CA-01). |
| `AML.M0028` | `gateway->internalTools` | Change — Least-privilege tool permissions fit, but note describes inter-agent hops rather than the pinned tool boundary (CA-03). |
| `D3-CTS` | `orchestration->subagents` | Change — Narrowing task grants is permission policy; state actual credential recipient scoping or remove this duplicate (CA-03). |
| `AML.M0036` | `gateway` | Conditional — Gateway bounds remote work only; shared workflow and local execution budgets need runtime enforcement (CA-08). |
| `cap-input-guardrails` | `gateway` | Change — Gateway cannot screen inter-agent/local state paths or trigger text before it reaches the harness; relocate/extend exact boundaries (CA-01). |
| `cap-sensitive-data-redaction` | `state` | Conditional — State write filter directly redacts journals; guidance also claims outbound gateway DLP, which this pin does not cover (CA-01). |
| `cap-retrieval-grounding-checks` | `state` | Conditional — Corpus trust/index isolation fit retrieval protection; specify source admission/query checks and partial output-grounding scope (CA-04). |
| `AML.M0029` | `internalTools->orgData` | Pass — Trusted handler gates consequential writes; bind approval to exact action, state version and expiry. |
| `cap-data-access-governance` | `internalTools->orgData` | Pass — Tool/data layer scopes reads to the current workflow grant instead of ambient service reach. |
| `D3-EI` | `internalTools` | Change — Pin names remote tool tier while native-tools sandbox also executes generated code; identify actual execution isolation locus (CA-10). |
| `cap-agent-tool-registry` | `govSupplyChain` | Pass — Registry inventories/adopts agents and tools, consulted before use; registration alone does not authorize actions. |
| `cap-agent-kill-switch` | `govObservability` | Conditional — External runtime halt is direct recovery; verify queued/child work cancellation and no replay after stop (CA-17). |
| `cap-mcp-tool-integrity` | `govSupplyChain` | Change — Place definition hash refusal at gateway/harness load, keeping governance ownership (CA-05). |
| `cap-agent-egress-control` | `localTools` | Conditional — Sandbox network restriction fits; cover unsandboxed handlers and permitted-host exfiltration separately (CA-01). |
| `D3-FA` | `sources->registry` | Pass — Mirror analyzes files before installation, a direct malicious-dependency detection contribution (CA-07). |

### cloud-agent-workflow — risk pins

| Risk | Pin | Disposition / direct mapping |
| --- | --- | --- |
| `riskPromptInjection` | `internalTools->orgData` | Pass — Record instructions can influence later agents; screen retrieval returns and keep action bounds. |
| `riskPromptInjection` | `gateway->extTools` | Pass — Third-party output enters several agents’ contexts; gateway screening is a direct partial defense. |
| `riskPromptInjection` | `events->harness` | Pass — Trigger text is untrusted model input; gateway-only pre-context claim is inaccurate (CA-01). |
| `riskInsecureModelOutput` | `orchestration->subagents` | Pass — Model-composed delegation is consumed downstream; local message validation/screening is required, not only gateway checks. |
| `riskInsecureModelOutput` | `gateway->provider` | Pass — Model output determines delegates/tools; validate structure and action permissions before dispatch. |
| `riskAgenticDelegationConfusedDeputy` | `orchestration->subagents` | Pass — Specialist inheriting excessive grant is a deputy mechanism; trusted dispatcher/broker narrowing directly applies (CA-10). |
| `riskAgentDelegationChainOpacity` | `orchestration` | Pass — Missing delegation events impair attribution; correlated scheduler and tool traces are direct detection evidence. |
| `riskOrchestratorRouteHijacking` | `orchestration` | Conditional — Keep only for unauthorized model/route manipulation; ordinary misguided planning is not necessarily route hijacking (CA-22). |
| `riskInsecureIntegratedComponent` | `localTools` | Pass — In-process handler vulnerabilities compromise shared authority; require local controls and honest shared-process scope. |
| `riskSensitiveDataDisclosure` | `state` | Pass — Journal can persist sensitive tool results; store redaction, access restrictions and retention fit. |
| `riskRogueActions` | `internalTools->orgData` | Pass — Unauthorized or replayed effects are rogue writes; exact approvals, handler idempotency and authorization fit. |
| `riskRunawayAgentToolLoops` | `harness` | Pass — Scheduler/agents may loop without convergence; harness/runtime bounds complement gateway quotas. |
| `riskPromptInjection` | `state` | Pass — Stored instructions recur across steps; memory scope and provenance plus read-side screening fit. |
| `riskEconomicDenialOfWallet` | `gateway` | Pass — Multi-day inference can amplify cost; per-run aggregate resource caps needed. |
| `riskToolRegistryTampering` | `gateway->internalTools` | Pass — Post-admission tool metadata manipulation changes action selection; runtime integrity verification is direct (CA-05). |
| `riskRetrievalVectorStorePoisoning` | `localTools->state` | Pass — Corpus/vector entry poisoning changes later context; source/ingest trust and query screening fit. |
| `riskToolSourceProvenance` | `registry` | Change — Package install provenance does not automatically meet tool metadata provenance definition (CA-06). |

### cloud-chat-agent — capability pins

| Capability | Pin | Disposition / direct-control reasoning |
| --- | --- | --- |
| `cap-agent-tool-registry` | `govSupplyChain` | Pass — Governance-controlled catalogue limits available tools; runtime checks admission before exposing/invoking them. |
| `AML.M0008` | `govSupplyChain` | Conditional — Model/application evaluation fits; do not treat it as complete tool/dependency integrity (CA-07). |
| `AML.M0029` | `user->entry` | Pass — Specific human action approval at the frontend is real; enforce the bound approval at the action handler/gateway. |
| `D3-APA` | `user->entry` | Change — Session-grant note omits the administered policy; identify it if ingress implements that policy, otherwise use the actual control (CA-03). |
| `AML.M0028` | `gateway->internalTools` | Pass — Per-call delegated tool permissions restrict operations to the conversing user’s authority. |
| `D3-AA` | `agent` | Conditional — Distinct workload identity requires proof validation; do not equate attribution/inventory with authentication. |
| `D3-CH` | `agent->gateway` | Pass — Gateway-held per-call credentials reduce secret exposure and preserve user-bound grants. |
| `AML.M0031` | `memory` | Conditional — Conversation namespace is direct protection; add memory lifecycle/fresh-entitlement requirements without claiming complete hardening (CA-24). |
| `cap-data-access-governance` | `internalTools->orgData` | Pass — Tool/data layer prevents retrieval beyond the user’s entitlements. |
| `cap-retrieval-grounding-checks` | `memory` | Change — Note describes ACL enforcement, not source trust or grounding; fix semantics and output verifier (CA-04). |
| `cap-input-guardrails` | `gateway` | Conditional — Gateway screens model-bound content and remote returns; local context assembly/write paths remain uncovered (CA-01). |
| `cap-output-encoding` | `entry` | Pass — Frontend encoding/render restrictions directly prevent executable markup and automatic resource-fetch exfiltration. |
| `cap-sensitive-data-redaction` | `localTools->memory` | Pass — Memory-write redaction reduces accumulated sensitive content; it is not full outbound DLP or entitlement refresh (CA-24). |
| `AML.M0004` | `entry` | Pass — Frontend per-user/session request limits directly bound ingress volume, distinct from one turn’s work. |
| `cap-agent-tracing` | `govObservability` | Pass — Separate append-only approval/action trace supports reconstruction; protect sensitive trace content (CA-24). |
| `cap-agent-kill-switch` | `govObservability` | Conditional — Runtime halt and identity revocation fit; queued schedules/delegated calls need verified cancellation (CA-17). |
| `cap-agent-action-policy-enforcement` | `gateway` | Change — Control itself is direct, but scheduled scenario violates its mandatory bound-approval rule (CA-02). |
| `AML.M0036` | `gateway` | Conditional — Gateway bounds tool/token use within a turn; local execution still needs limits (CA-08). |
| `D3-CTS` | `gateway->internalTools` | Pass — Exchange rather than forwarding to tools provides recipient scoping; permission intersection is separately enforced (CA-03). |
| `cap-mcp-tool-integrity` | `govSupplyChain` | Change — Silent metadata changes need runtime refusal, not only a governance pin (CA-05). |
| `cap-agent-egress-control` | `localTools` | Conditional — Sandbox destinations are constrained; unsandboxed handler egress must also be covered (CA-01). |
| `D3-FA` | `sources->registry` | Pass — Mirror scans dependency files before admission; guidance must describe that check instead of only behavioral evaluation (CA-07). |

### cloud-chat-agent — risk pins

| Risk | Pin | Disposition / direct mapping |
| --- | --- | --- |
| `riskPromptInjection` | `user->entry` | Pass — User turns/uploads can contain injected instructions; screening plus independent action policy fit. |
| `riskPromptInjection` | `gateway->extTools` | Pass — External records/tool responses carry indirect instructions; screen return and constrain actions. |
| `riskPromptInjection` | `memory` | Pass — Persistent poisoned turn can affect subsequent actions; scope/provenance and read-side screening fit. |
| `riskRetrievalVectorStorePoisoning` | `memory` | Pass — An entitled poisoned index entry is still malicious; current capability note only supplies ACLs (CA-04). |
| `riskInsecureModelOutput` | `gateway->provider` | Pass — Completion needs output/action validation; provider transport authentication does not make content safe. |
| `riskRogueActions` | `internalTools->orgData` | Pass — Wrong/steered record actions persist even with inattentive approvals; deterministic policy and specific approval limit them. |
| `riskRogueActions` | `events->agent` | Change — Scheduled unsafe write is a plausible risk, but current target policy should deny it; fix scenario instead of depicting permitted bypass (CA-02). |
| `riskRunawayAgentToolLoops` | `agent` | Pass — Mid-turn/scheduled loops occur at agent; ingress query ceilings alone cannot stop them (CA-08). |
| `riskToolRegistryTampering` | `gateway->internalTools` | Pass — Previously admitted catalogue can change; definition load must refuse silent changes (CA-05). |
| `riskPromptInjection` | `internalTools->orgData` | Pass — Records authored by others can inject context; tool-return screening directly applies. |
| `riskInsecureIntegratedComponent` | `localTools` | Pass — Native handlers can introduce application compromise; gateway claims do not cover it (CA-01). |
| `riskAgenticDelegationConfusedDeputy` | `agent` | Pass — Service authority exceeding user authority is a true deputy risk; per-call subject/operation checks fit. |
| `riskSensitiveDataDisclosure` | `localTools->memory` | Pass — Accumulated context can disclose unrelated sensitive information; redaction, minimization and entitlement freshness fit. |
| `riskEconomicDenialOfWallet` | `entry` | Pass — Public chat requests can amplify inference cost; separate request rate from total turn work. |
| `riskToolSourceProvenance` | `registry` | Change — Generic package mirror code risk is misclassified as tool metadata source provenance (CA-06). |

### cloud-agent-federation — capability pins

| Capability | Pin | Disposition / direct-control reasoning |
| --- | --- | --- |
| `D3-AA` | `authServer` | Pass — Authorization server verifies independently registered agent keys; registration/rotation are supporting lifecycle controls. |
| `D3-APA` | `idp->authServer` | Pass — IdP policy determines which users may be asserted to each peer; actual policy evaluation is identified. |
| `D3-CTS` | `gateway->authServer` | Change — Recipient/audience scoping fits; mTLS transport alone is not token binding and onward delegation is not eliminated (CA-14). |
| `cap-agent-tool-registry` | `govSupplyChain` | Pass — Admitted peer-card inventory directly excludes unknown peers; ownership and runtime consultation are explicit. |
| `cap-input-guardrails` | `gateway->partner` | Change — Direct screening is appropriate but covers only partner edge while vendor content also enters (CA-15). |
| `cap-agent-action-policy-enforcement` | `gateway` | Change — Per-operation authorization is essential, but standard request has no claimed skill selector; define dispatch contract (CA-12). |
| `cap-sensitive-data-redaction` | `gateway->peerVendor` | Change — Direct payload redaction fits, but partner/model paths and concrete block/redact behavior need explicit coverage (CA-15). |
| `AML.M0004` | `gateway->partner` | Conditional — Per-peer request-rate limits fit; long-lived work and task costs need AML.M0036/runtime bounds (CA-08). |
| `AML.M0029` | `entry->harness` | Change — User authentication/consent is not approval of the proposed agent action (CA-15). |
| `cap-ai-vendor-assessment` | `peerVendor` | Pass — Supplier assessment is honest onboarding assurance; it does not enforce tenant isolation or signing inside the vendor. |
| `cap-agent-tracing` | `govObservability` | Pass — Task/trace correlation directly supports attribution; complete remote internal visibility depends on peer evidence. |
| `cap-agent-kill-switch` | `govObservability` | Change — Peer access revocation does not stop existing remote task execution; implement stop/cancel or narrow the capability (CA-17). |
| `AML.M0031` | `localTools->memory` | Conditional — Task namespace isolation contributes to hardening; classification alone does not establish provenance/integrity/recovery (CA-24). |
| `cap-mcp-tool-integrity` | `gateway->peerVendor` | Change — Card verification is useful but specialization is tool-definition-specific and pinned to one peer only (CA-16). |

### cloud-agent-federation — risk pins

| Risk | Pin | Disposition / direct mapping |
| --- | --- | --- |
| `riskAgentDelegationChainOpacity` | `gateway->peerVendor` | Pass — Missing peer delegation events make the chain opaque; trace/audit exchange helps, token audience alone does not (CA-14). |
| `riskAgenticDelegationConfusedDeputy` | `gateway->authServer` | Pass — Over-broad exchanged authority can create a deputy; exchange policy plus downstream authorization both required. |
| `riskPromptInjection` | `gateway->partner` | Pass — Peer artifacts/card descriptions can steer context; screening is partial and should cover both peers (CA-15). |
| `riskStaleAgentIdentityBinding` | `authServer` | Change — Revoked peer/key rotation is ordinary credential lifecycle, not model replacement under stale identity (CA-20). |
| `riskShadowAndUnknownAgents` | `gateway` | Conditional — Unknown-peer admission fits only if unregistered agents retain accepted authority; avoid confusing card discovery with authenticated admission. |
| `riskCrossTenantCredentialPropagation` | `gateway->internalTools` | Pass — Cross-tenant token exchange/cache propagation fits; tenant routing fields must not substitute for validated identity claims. |
| `riskSensitiveDataDisclosure` | `gateway->peerVendor` | Pass — Outbound tasks can disclose organizational data; redaction and export/action policy must cover every peer path. |
| `riskEconomicDenialOfWallet` | `gateway->partner` | Pass — Retried/long-running delegated work can drive billed consumption; per-request limits are insufficient (CA-08). |
| `riskRogueActions` | `harness` | Pass — Acting on hostile peer recommendations is rogue action; action approval must be distinct from peer login (CA-15). |

### cloud-remote-mcp-server — capability pins

| Capability | Pin | Disposition / direct-control reasoning |
| --- | --- | --- |
| `D3-CTS` | `authServer` | Change — Issuance audience restriction contributes, but verifier also belongs at service; IdP policy does not imply immediate resource revocation (CA-17). |
| `AML.M0004` | `callers->gateway` | Pass — Gateway per-client/tenant volume limits directly constrain flooding; individual costly handlers need a separate work budget (CA-08). |
| `D3-MAN` | `callers->gateway` | Change — HTTPS/Origin are not arbitrary caller authentication or state-handle authorization (CA-19). |
| `AML.M0028` | `gateway->service` | Pass — Gateway/service least-privilege scopes and per-call operation checks directly constrain tool authority; listings are not the enforcement boundary. |
| `cap-mcp-tool-integrity` | `toolDefs->service` | Change — Service definition load and consumer hash verification are different ownership/loci; name the verifier being claimed (CA-05). |
| `D3-SYSVA` | `service` | Pass — Application vulnerability assessment is a valid assurance contribution; no runtime blocking is implied (CA-21). |
| `cap-data-access-governance` | `service->orgData` | Conditional — Identity/tenant-filtered reads fit; writes need operation/object authorization beyond retrieval governance (CA-19, CA-20). |
| `D3-CH` | `service->downstream` | Pass — Separate upstream credentials harden the boundary; OBO versus service-credential fallback must be explicit. |
| `cap-agent-egress-control` | `service->downstream` | Pass — Service egress policy directly blocks unapproved upstream destinations; allowed destination authorization is separate. |
| `AML.M0024` | `govObservability` | Pass — Invocation/tenant/delegation logs directly support detection and incident reconstruction; minimize secrets in parameters/results. |
| `cap-agent-kill-switch` | `govObservability` | Change — Pin promises issued-token revocation only, not external process/queue termination required by kill-switch specialization (CA-17). |
| `D3-AVE` | `govObservability` | Change — Vulnerability enumeration does not implement patching/remediation; separate evidence and capability (CA-21). |
| `D3-APA` | `callers->idp` | Pass — IdP group/application policy administration directly controls new grants; existing downstream access has separate lifecycle handling. |
| `cap-agent-egress-control` | `authServer` | Pass — Authorization-server fetch policy directly prevents metadata/discovery SSRF; validate redirects and DNS resolution too. |
| `D3-AA` | `authServer` | Pass — Authorization server authenticates autonomous workload’s registered key before client-credentials grant issuance. |
| `D3-CTS` | `service->authServer` | Pass — Service exchanges rather than forwards inbound token, scopes it to downstream audience and logs delegation; service fallback needs caller checks. |

### cloud-remote-mcp-server — risk pins

| Risk | Pin | Disposition / direct mapping |
| --- | --- | --- |
| `riskPromptInjection` | `gateway->service` | Pass — Published poisoned descriptions can inject a consumer model; direct publisher defense is reviewed/verified content, consumer screening is outside control. |
| `riskToolRegistryTampering` | `toolDefs->service` | Pass — Post-review definition mutation changes tool selection; release/loader verification directly contributes. |
| `riskCrossTenantCredentialPropagation` | `service->orgData` | Change — Missing row-level tenant filter alone is not credential propagation; name shared/mis-scoped token mechanism or use disclosure/deputy (CA-20). |
| `riskAgenticDelegationConfusedDeputy` | `authServer` | Conditional — Per-client consent protects a proxy/deputy using shared upstream authority; name that upstream relationship, not merely static registration. |
| `riskAgenticDelegationConfusedDeputy` | `service->downstream` | Pass — Passthrough/over-broad downstream use may produce deputy abuse; no passthrough and purpose-bound exchange are direct controls. |
| `riskSensitiveDataDisclosure` | `service->downstream` | Change — Disclosure risk is real; note incorrectly says all calls use service identity although OBO is supported (CA-22). |
| `riskEconomicDenialOfWallet` | `callers->gateway` | Conditional — Need billed/expensive-tool amplification, not only generic backend overload; add handler work bounds (CA-08, CA-22). |
| `riskMCPTransportHijacking` | `service` | Change — Application-handle IDOR is not transport interception/hijacking; relocate transport risk and separately enforce object authorization (CA-20). |
| `riskZombieShadowMCPServers` | `service` | Change — Complete canonical lifecycle mechanism with stale DNS/discovery/endpoints; surviving grants alone is incomplete (CA-21). |
| `riskInsecureIntegratedComponent` | `gateway->service` | Pass — SDK/handler vulnerabilities are direct integrated-component risks; scan, assess and remediate, with handler validation. |
| `riskInsecureIntegratedComponent` | `gateway` | Pass — Gateway dependency compromise can affect every request; runtime boundary does not eliminate supply-chain risk. |
| `riskStaleAgentIdentityBinding` | `service->authServer` | Change — User removal with unexpired token is not model/artifact replacement retaining identity (CA-20). |
| `riskAgenticDelegationConfusedDeputy` | `callers->authServer` | Change — OAuth issuer mix-up is a real concern but not automatically agent deputy privilege escalation; retain protocol defense without stretching risk (CA-22). |

## Crosswalk follow-through

Risk-to-capability catalogue links also need revision when these pins are fixed. In `data/overlay/mitigations.yaml`, `D3-FA` currently lists only model-loader/model-source/adapter risks: package analysis can directly detect an insecure executable dependency even though that relationship is absent. Do not force the package into `riskToolSourceProvenance` to fit a link. Conversely, `D3-AA` links stale-model identity and delegation opacity, while authentication alone does not bind a credential to a model artifact or emit a delegation chain. Treat those as conditional supporting relationships, requiring artifact binding or trace emission respectively. The same caution applies to `AML.M0004` linking runaway loops: rate limiting can contain remote call volume but does not terminate a local loop. This review uses the actual implementation mechanism instead of treating every catalogue link as direct coverage.

## Completion fingerprints

SHA-256 of current working-tree inputs at report completion. Architecture objects were compared with the initial review snapshots and were unchanged. No production source or paired guidance was modified by this reviewer.

| File | SHA-256 |
| --- | --- |
| `data/reference/architectures/cloud-action-agent.yaml` | `5fde09f881a5f7f1717f11011a0f99db982284a821726a0c8787eece1556ee56` |
| `data/reference/guidance/cloud-action-agent.yaml` | `431036cee3844eb6747ce249be88265645be60512794d16cb9b741d1d4a5fd96` |
| `data/reference/architectures/cloud-agent-workflow.yaml` | `d774e738c8a7fe87df765c7033db80def70e28f6e7e60a9fe8b13fd521198a14` |
| `data/reference/guidance/cloud-agent-workflow.yaml` | `4604194fbc7731f1252bfc049f32d7666f970be810f770267351c7b450bab503` |
| `data/reference/architectures/cloud-chat-agent.yaml` | `8b97daaa691990c88ef0b966eea675b43593df91ccccfaa621c2e943a0bed281` |
| `data/reference/guidance/cloud-chat-agent.yaml` | `2873c52735aafe2f0d5c9b08d1cb8b20ea8ff15d327b1a7b219b42ae982fe6c6` |
| `data/reference/architectures/cloud-agent-federation.yaml` | `41ab80b36e836e274ce6599d9c71cf506bc9e467326541b52d340220b119ac1d` |
| `data/reference/guidance/cloud-agent-federation.yaml` | `0b6a647a91f9035ff18605bcb4cc2233677c6ea9babfb02eb0d35b0e32544d94` |
| `data/reference/architectures/cloud-remote-mcp-server.yaml` | `b4a4e37b9f5510c8e774a5ef2fc3e825fa5c3cb97cb0110b7bbc94c30421b0e2` |
| `data/reference/guidance/cloud-remote-mcp-server.yaml` | `f639b21182331df2ec253663e6baa65f774f87391004c45bb3e9c4bee93b0e5f` |
| `data/ONTOLOGY.md` | `0cf7e6b007b4acdc71fb3a59a1f073d95c2fcecf01434a5360a3811fbaec588e` |
| `data/PROVENANCE.md` | `34495a3849c4567a507c97d5e4201abe7459f3b027706ef8a5e80fed43e26a93` |
| `data/reference/vocabulary.yaml` | `8b699f6387ec1bf5c8e9a55942ebb0a61fd4f4cbecded5c20e9e4e62afa236d5` |
| `data/overlay/mitigations.yaml` | `b56eb2e01c328ac2739db6279dd52c70bed0a3aecc78418a25ed4fba8477edcb` |
| `data/overlay/specializations.yaml` | `2b760c6568fbe7e3bed4d11e4a34be599b7e151d0818468b16757cd04a48c476` |
| `data/cosai/risks.yaml` | `f555670dd51f65360aee32e0b0a0e6284598804f6e0f987a8b8f462a353cf6a8` |
| `data/mitre/d3fend/1.6.0/d3fend.json` | `e1546d432c6aa64d45b62dd9e9484b0774ae84de7ff3605ff9dd4e20278957bf` |
| `data/mitre/atlas/2026.09/ATLAS.yaml` | `935efa93e28294432d3e2f537eb94991ef8d1f8c58341cd360ea3321ddb66688` |
