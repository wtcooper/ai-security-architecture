# Cross-catalogue recommendations

## CC-01 · P1 · Require a direct mechanism for each pin and risk relationship

The catalogue validates IDs, surfaces and locations, but those checks cannot establish that a component performs the named defense. In the reviewed snapshot, 279 capability pins and 215 risk pins compile successfully despite the semantic mismatches documented in the individual reviews.

Adopt a short authoring test for every capability pin:

> **[Component] enforces [operation/check] on [specific data/action] before/when [event], preventing, detecting or recovering from [specific failure]. It does not cover [material bypass or limit].**

Use only relevant limitations; do not turn each note into boilerplate. Prefer the existing `note` field and a small review checklist before adding schema or UI complexity. Record an explicit capability-to-risk relationship in review evidence where a diagram currently relies on two independent pin lists. A shared architecture, shared component or taxonomy link alone is not evidence of direct control.

Separate three valid contributions:

- **Prevention / containment:** checks or boundaries before an unauthorized effect.
- **Detection / response:** observed events and actions that limit an ongoing incident; specify trigger, stop coverage and delay.
- **Assurance / management:** assessment, inventory, release review and ownership. Keep these useful practices, but do not present them as runtime prevention.

Acceptance: every pin has a concrete enforcer and an honest effect. For every risk, state a direct control or an explicit residual gap. A risk need not be completely eliminated; an assurance pin cannot substitute for its missing inline protection.

## CC-02 · P1 · Repair recurring capability and risk semantics in one sweep

Evidence lives in the linked architecture reports and the canonical definitions under `data/mitre`, `data/cosai/risks.yaml`, and `data/overlay/specializations.yaml`.

| Current recurring claim | Correct interpretation / change |
| --- | --- |
| SSO, domain binding or selecting a user = `D3-MFA` | Require actual multiple factors at human authentication, or stop claiming MFA. Workload identity is a separate operation. |
| Inventory + owner + expiry = `D3-AA` | Authentication verifies a caller. Inventory belongs to the registry/identity lifecycle, with admission/revocation separately enforced. |
| Filesystem isolation or permission intersection = `D3-CTS` | CTS limits credential recipients. Use actual filesystem isolation/access policy or tool permissions for those other operations. |
| TLS + Origin/CORS = caller authentication and object authorization | Describe verified identity, message protection and resource/state-handle permissions independently. |
| mTLS connection or audience-restricted bearer = sender-constrained token | Require proof of the token's bound key (for example a certificate-bound access token or DPoP) when claiming bearer replay resistance. |
| Vulnerability enumeration = patching | Enumeration identifies vulnerabilities; software update remediates them. |
| Registry withdrawal, grant deletion or alias rollback = live process termination | Identify the running process/session cancellation and queued/delegated work handling. Use revocation or release gating when that is the actual control. |
| Persistent agent memory hardening = transient inference KV/cache isolation | Distinguish durable state from runtime memory and shared response caches. |
| Model-at-rest access controls / process write isolation = accelerator side-channel protection | Narrow to the actual protected resource and threat; keep hardware side-channel defenses as an explicit implementation requirement or gap. |
| Orphan OAuth token = `riskStaleAgentIdentityBinding` | That risk requires model/artifact substitution retaining prior identity. Ordinary lifecycle failures need a fitting risk or plain-language requirement. |
| A stolen tunnel key or shared session = `riskCrossTenantCredentialPropagation` | Identify the actual tenant A→tenant B credential/identity propagation. Otherwise retag the real disclosure or confused-deputy threat. |
| npm/pip dependency or instruction file = `riskToolSourceProvenance` | This risk concerns discovery metadata/manifests. Separate malicious components, prompt injection and post-admission tool-registry tampering. |
| Memorized training-record extraction = `riskInferredSensitiveData` | Canonical inferred data is new information inferred beyond training records. Use sensitive-data disclosure for extraction. |

This also requires checking the global `risks:` mappings, not just diagram notes. For example, `D3-AA` is mapped to stale model/identity binding, but authenticating an unchanged valid credential does not detect a changed model. `AML.M0005` at-rest access is mapped to accelerator side channels, and `cap-output-encoding` to covert output channels; those links need a concrete matching mechanism or must be narrowed/removed. HTML escaping does not stop information encoded in otherwise valid prose.

Do not automatically replace every incorrect pin with another pin. Remove duplicates when an existing correctly placed control already expresses the requirement. Preserve canonical upstream definitions; local mappings are the layer to correct.

Acceptance: audit both the instance note and its global risk/control mappings. No corrected note continues to inherit an incompatible coverage claim from the catalogue.

## CC-03 · P1 · Authorize every executable route, including local handlers

Cloud siblings and the managed API runtime expose routes that do not traverse the gateway their guidance treats as universal. Hosted sessions omit a vendor-direct connector route from the drawing while keeping it enabled in prose.

Keep controls where execution occurs: local dispatcher, application handler, MCP service, gateway or data service. Require verified caller/tenant context, operation and argument validation, resource permissions and consequential-action approval at the relevant point. Screening malicious text helps; it does not decide whether an operation is authorized. An authenticated provider event is still an untrusted proposed action.

Acceptance: trace local tools, remote tools, custom callbacks, connector bypasses, memory reads/writes and asynchronous jobs. Every enabled route has a stated enforcer; a denied action cannot reach the same target through another route. No additional gateway is required merely to make every path look identical.

## CC-04 · P2 · Standardize roles and names without forcing identical features

The builder reports conformant vocabulary: **65 distinct block titles (32 single-use), 128 item labels (64 single-use)**. That is syntax consistency, not semantic consistency. A singleton is not automatically a defect; a dedicated training stage can earn a unique name.

| Component concept | Recommended naming rule |
| --- | --- |
| Agent harness | Agent reasoning/context/dispatch application. Keep supervisor/subagent distinctions where they explain real orchestration. |
| Native tools | Embedded tool execution surface; containment is not evidence of authorization or isolation. |
| Tool services | Network-invoked tools. List only protocols actually present; do not force A2A onto every MCP/API tier. |
| AI gateway | Brokers model and/or tool API traffic. Its item list must state which classes it actually carries. |
| Secure web gateway | Browser/web traffic mediation. Do not reuse AI gateway solely to avoid a new name if the role is different. Reuse an existing registry entry if available. |
| Tunnel connector | Transport adapter for a specific private connectivity pattern. Do not imply a data gateway that decrypts credentials and connects to data sources is transport-only. |
| Memory & state / Storage / Model registry | Keep working agent state, inference artifacts/cache and approved model releases distinct. Shared names must not hide different trust or persistence properties. |
| Application front end | Customer user/API entry; can contain a tool handler, but that handler's execution and authorization must be visible. |
| Managed runtime / Vendor service | Expose public interfaces and customer configuration. Split only when the separate interfaces explain real flows or responsibilities. |
| Developer / End user / Operator | Standardize by actual role. Consider replacing generic User with End user; keep specialized actors only when their authority differs. Cosmetic actor naming is P3. |

Relax the byte-identical item-pack rule to allow canonical subsets. It currently causes unexplained Skills catalogue and A2A items, and encourages deviations to satisfy the pattern rather than describe the system. Keep shared role contracts and stable component IDs; allow meaningful architecture-specific contents.

Acceptance: every default item has a necessary flow or responsibility; two components with the same title perform the same role; distinct roles do not share a title merely for registry compliance.

## CC-05 · P2 · Keep ownership, transport initiation and data direction separate

`data/ONTOLOGY.md` says bands identify the operator, yet hosted sessions place rented source control in Enterprise cloud because its policy is ours. Its “Nothing external reaches back in” rule also equates an incoming connection with a contractual relationship. Initiation and contract status are independent facts: an authenticated public API client need not be a contracted vendor, and an outbound connection can carry inbound commands.

Use bands for the operator only. Notes can identify the tenant, agreement or policy owner. Clearly distinguish an outbound-established tunnel from the request direction over it. Use `outbound` consistently for call/response across comparable boundaries; a bidirectional data arrow must not imply unrestricted connection initiation. Public listeners and private tunnels can both have strong application authorization; describe their exposure differences without calling IP allowlisting an identity check.

Acceptance: moving a service from self-hosted to SaaS changes its operator band even if customer policy stays identical. A flow description identifies initiator and request/result direction without inferring trust from either.

## CC-06 · P2 · Make each drawing one secure target state

Several designs mix optional products and insecure defaults into their normal flow. Examples include hosted public package installs vetted by nobody, two non-composable endpoint modes, an unattended chat write despite mandatory approval, and a scenario that moves a sandbox into our cloud without changing its vendor-zone block.

Choose the minimum defensible normal deployment. Put optional features in clearly scoped extensions; only create another full architecture when ownership, enforcement or a central flow changes enough to justify it. Attack scenarios may show a control failing or being disabled, but must say so. They should not silently contradict a baseline pin.

Acceptance: the normal walk is buildable and secure under stated assumptions; it neither skips an approval nor treats permissive product defaults as best practice. Each deviation explains a real exception rather than excuses a contradictory drawing.

## CC-07 · P2 · Keep local conventions separate from external standards

No reviewed external standard requires this catalogue's exact names, five governance call-outs, one universal gateway, byte-identical tool packs, or one particular tunnel product. Those are repository conventions. OAuth/MCP/A2A protocol requirements should be labeled and versioned; OWASP/NIST guidance informs threat and control choices; product documentation establishes the behavior of that product only.

The old review guide is stale: it still describes three path classes including governance, says every architecture has guidance, and reports an older vocabulary count. The actual build reports two flow classes, 15 guidance documents and 65/128 names. `data/PROVENANCE.md` and `src/lib/types.ts` also retain obsolete governance/crossing/component language. Refresh the review guide and authoritative ontology together after agreeing on the recommendations; generated counts should be generated or omitted.

Acceptance: a reviewer can identify which requirements come from a protocol, a best-practice guide, a product or our own design choice. Documentation no longer promises guarantees that the builder does not check.

## CC-08 · P2 · Treat composite specializations as authored recipes, not broader MITRE definitions

`cap-agent-kill-switch` has parent `D3-PT` (process termination) but includes revocation, quarantine and secure deletion. `cap-staged-rollout-gate` has parent `AML.M0008` (model validation) but also includes progressive release and restoration. Those are useful recipes, but a single parent's canonical definition does not establish every constituent defense. The specialized records also inherit their parent's broad description, which can obscure their narrower authored implementation.

Keep a small catalogue. Narrow a specialization to its stated mechanism, or explicitly document that it is an authored composite with separate supporting techniques. Do not make a pin's successful sub-operation count as the whole recipe. Present the authored implementation alongside the parent attribution. This is a taxonomy decision to make before mechanically repinning all diagrams.

Acceptance: a process stop can pass termination while credential revocation remains unverified; a model evaluation can pass while rollback remains untested. Coverage reflects those limits without proliferating diagram boxes.

## Coverage gaps and what not to add

The generated audit lists 2 unpinned risks and 23 unpinned capabilities. They are not a backlog to fill by maximizing pin counts.

- Federated/distributed training privacy need not appear when no design performs that training.
- Prompt/response cache poisoning matters only where a shared reusable response/cache mechanism exists; distinguish it from transient KV state and durable agent memory.
- Credential revocation, token binding and software update should be used where current notes explicitly claim those functions under the wrong IDs.
- New discovery, evaluation or monitoring pins should only be added when the architecture requires a distinct enforcer and mechanism.

## Primary reference anchors

- [OAuth security best current practice, RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html): access-token privilege restriction and OAuth threat controls.
- [OAuth mTLS and certificate-bound tokens, RFC 8705](https://www.rfc-editor.org/rfc/rfc8705.html): distinguishes transport client authentication from a token's certificate binding.
- [MCP 2026-07-28 authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization): resource audience and credential separation requirements.
- [A2A specification](https://a2a-protocol.org/latest/specification/): protocol fields and binding-specific endpoint syntax; local authorization policy still needs its own contract.
- [MITRE Credential Transmission Scoping](https://d3fend.mitre.org/technique/d3f:CredentialTransmissionScoping/): the actual scope of that technique.

Architecture-specific reports link additional primary evidence next to findings. This review establishes design recommendations; it does not certify product configurations or standards compliance.
