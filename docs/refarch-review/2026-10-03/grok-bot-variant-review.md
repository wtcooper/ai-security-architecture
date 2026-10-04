# Grok Bot: persistent hosted teammate variant

Supplement reviewed 2026-10-03 against current primary documentation and `data/tooling/cursor/grok-bot.yaml`. Scope is topology and security lifecycle, not a full product audit. Sources and architectures were not edited.

## Recommendation

**Give persistent hosted teammates an explicit variant of the managed-runtime family. Grok Bot does not satisfy the existing hosted-session architecture's per-session isolation contract.** Reuse canonical components; change the lifetime, sharing, identity and flow assumptions. Do not create one architecture per product or classify everything exposed through an API as the same architecture.

| Pattern | Architectural discriminator | Placement recommendation |
| --- | --- | --- |
| Per-task coding/desktop session | Task-scoped execution environment; repository/artifact workflow; explicit session admission and completion | Keep `archHostedAgentSessions` for this contract. Its current `D3-EI` note promises one environment per session, reclaimed afterward. |
| Persistent hosted teammate | Durable account/team computer, ongoing memory and credentials, recurring work, browser actions and delegation | Add a distinct reference variant with shared components and a persistent-workspace lifecycle. Place Grok Bot here. |
| API/SDK managed service | Customer application binds callers, starts work, controls delegated authority and consumes results | Keep in `archManagedAgentRuntime`; separately state whether its compute/state is persistent. An API trigger alone does not change the first two patterns. |

This is a design judgment based on differences in real trust and state boundaries. The current local Grok record already describes persistent per-user compute but maps to `archHostedAgentSessions`; that is a reference-contract mismatch, not proof that the product lacks useful isolation.

### Current availability, not an announcement assumption

Grok Bot launched in beta on August 11, 2026; the current original announcement still calls it beta. The August 26 expansion announcement confirms broader paid-plan access. Current Cursor docs list paid individual plans, Teams access and Enterprise dashboard enablement; the older announcement's Enterprise waitlist should not override the current admin documentation. Team Bots are documented, but access can still be disabled/unavailable for a particular team. No general-availability milestone was verified. [Launch](https://x.ai/news/introducing-grok-bot), [expansion](https://x.ai/news/grok-bot-more-plans), [current access](https://cursor.com/docs/grok-bot/teams), [Team Bot rollout](https://cursor.com/help/grok-bot/team-bots).

## Defining facts to preserve

- Personal Bots share one persistent cloud computer per user, including files and browser sessions; conversations and learned context are per Bot. Separate screens are work surfaces. These are materially different lifetimes and boundaries from task sandboxes. [Overview](https://cursor.com/docs/grok-bot), [working model](https://cursor.com/docs/grok-bot/work).
- Team Bot private chats normally use the invoker's computer; Slack/group chats use a shared Team Bot computer. Owner-added secrets, files and plugins are available across its audience. The same documentation says connected accounts act as the person being answered: **do not infer universal owner-OAuth inheritance** from shared configuration. [Team Bots](https://cursor.com/help/grok-bot/team-bots).
- Stopping, disabling future access and deleting persistent data are separate operations. Terminate stops current work and preserves disk; a later message can start a new computer. Recreate preserves state too. `Delete VMs and Data` is the explicit destructive reset. [Computer management](https://cursor.com/docs/grok-bot/computers).
- Connector OAuth is held on the vendor backend; browser sessions on the computer remain usable authority. Blocking a plugin does not block the corresponding website. A VM boundary between users does not isolate Bots sharing that user's machine. [Security FAQ](https://cursor.com/docs/grok-bot/security-faq).

## Actionable supplemental findings

### GROK-01 — P1, defect: the current reference promises the wrong isolation unit

**Local evidence:** `data/tooling/cursor/grok-bot.yaml: tools[toolGrokBot].architecture` points at `archHostedAgentSessions`; its `D3-EI` row correctly says shared persistent computer, while `saas-hosted-agent-sessions.yaml` describes per-session compute and no shared filesystem between sessions.

**Smallest change:** move the product mapping when the persistent variant exists. Give that variant a vendor `Managed runtime`, its customer-visible native-tool surface and a persistent `Memory & state`/workspace representation. Reuse names and represent actual customer-configurable boundaries without guessing vendor internals. Repository/PR flow becomes a delegated coding scenario, not a mandatory main path.

**Acceptance:** the reference distinguishes user isolation, Bot/context separation and shared disk/session authority; none is reported as per-task sandbox teardown.

### GROK-02 — P1, conditional defect: a shared audience needs an explicit authority contract

The primary Team Bots page limits ordinary action-approval prompts to the owner's own chat. Other teammate/channel contexts operate within configured permissions; personal-account consent is a separate step, and enforced Auto-review can still inspect actions. That does not establish a human gate for each consequential action. [Team Bots approval behavior](https://cursor.com/help/grok-bot/team-bots).

**Recommendation:** add a channel-to-runtime grant boundary and test the effective principal per tool: caller OAuth, shared secret, service account or browser session. Limit shared credentials to the published audience's legitimate scope. Where no trusted approver can act, constrain writes to preauthorized low-impact operations or require an external action-specific approval path. Keep Auto-review as automated screening, never label it human approval.

**Acceptance:** a weaker user cannot acquire wider source-system access merely by invoking the Bot; a consequential write lacking an available approver is blocked or outside the variant's permitted scope. Do not claim the docs prove every owner plugin impersonates its owner.

### GROK-03 — P1, defect if omitted: persistence changes recovery and offboarding

**Local evidence:** Grok's `AML.M0031` and kill-switch rows acknowledge persistent disk and partial memory controls. Carry those caveats into the reference rather than inheriting generic session cleanup.

**Recommendation:** distinguish four operations in guidance: stop active execution, prevent restart/scheduled triggers, revoke downstream/browser/network grants, and remove or restore persistent state. Inventory routines and shared Team Bot ownership alongside users. A poisoned memory or shared file can survive a VM restart; returning to a trusted state needs an explicit content recovery decision. Automatic recreation is not sanitization.

**Acceptance:** an offboarding scenario verifies both a stopped run and a later attempted trigger; a recovery scenario verifies that retained malicious state cannot restart the same behavior. Data deletion remains a deliberate operation, not an implied property of the kill switch. [Documented lifecycle](https://cursor.com/docs/grok-bot/computers).

### GROK-04 — P1, defect if omitted: draw the real browser, connector and private-network paths

Private reach is either a member-desktop route or a customer-installed networking client on the hosted computer. Team Setup is only the installation hook; the customer operates the network client and its access policy. This is not evidence of the vendor-managed MCP tunnel drawn in the existing hosted-session reference. [Private networks](https://cursor.com/docs/grok-bot/private-networks).

**Recommendation:** minimum baseline: disable local execution and local egress unless needed; show direct hosted-browser/shell egress and separate vendor-backend connectors. If private access is selected, draw one actual connection method and put customer authorization at the destination. Keep local execution separate from routing traffic through the laptop: they cross different boundaries. Shared vendor egress IPs cannot identify the enterprise tenant. Network policy and connector allowlisting must each cover their own path. [Network controls](https://cursor.com/docs/grok-bot/security).

**Acceptance:** a website route cannot bypass a connector ban; a laptop/VPN route cannot silently broaden approved destinations; disabling one route is tested against every other permitted route. Never imply all computer traffic traverses a customer MCP gateway.

### GROK-05 — P2, conditional defect: delegation starts another security lifecycle

Grok can launch separate Cloud Agents under their own controls. Bot-to-Bot messages can also wake work; the group-chat documentation offers instruction-based limits rather than a deterministic messaging-disable switch. [Delegation control](https://cursor.com/docs/grok-bot/teams), [Bot messaging](https://cursor.com/help/grok-bot/group-chats).

**Recommendation:** treat delegated coding as a link to the task-session architecture with its own identity, network policy, budget and cancellation. Correlate parent/child runs; do not assume the parent's termination kills the child. Exclude unnecessary delegation from the smallest baseline. Instructions to stop collaborating are helpful behavior guidance, not `AML.M0028` authorization enforcement or a loop budget.

**Acceptance:** disable delegation at its supported admission switch; where enabled, test the child cannot exceed granted authority, and trace/cancel it independently. A persistent parent's “stop” scenario covers downstream outstanding work explicitly.

### GROK-06 — P2, defect: update the tooling narrative for Team Bots and current telemetry

The local record's primary variants are the personal app and Slack integration; it lacks the documented Team Bot audience/computer/approval distinctions. It also says tracing never exports tool arguments/results, while the current vendor security page documents opt-in conversation export including hosted MCP arguments/results. This needs a targeted evidence refresh, not automatic promotion of every coverage score. [Current logging documentation](https://docs.x.ai/grok-bot/security).

**Recommendation:** add channel-specific qualifiers and revisit `AML.M0029`, `D3-AA`, `D3-CTS`, `D3-EI`, memory, registry and kill-switch evidence. Distinguish source authority from the human/Bot labels appearing in logs. Preserve the local record's useful separation of audit events from action recording and trace export. Distinguish the newer content opt-in from the default sanitized action stream.

**Acceptance:** the product page describes private personal use and shared Team Bot use accurately; every telemetry claim specifies fields, provenance, retention and opt-in status. “Native” tracing does not silently mean complete observation of every memory write or downstream effect.

## Capability and risk placement for the variant

| Control/risk | Direct placement and limit |
| --- | --- |
| `D3-EI` | Actual hosted-computer boundary; user isolation only where shared Bots occupy it. Vendor assurance unless a customer-configurable isolation mode is evidenced. |
| `AML.M0031` | Durable Bot memory/state lifecycle; appropriate here, unlike transient inference KV caches. Shared files and browser credentials also need their own access/lifecycle controls. |
| `D3-CTS`, `D3-CH` | Vendor connector token custody and actual browser/network-secret storage; keeping OAuth off the VM does not protect all browser session authority. |
| `AML.M0028`, `D3-APA` | Tool permission and admission settings at platform and destination; policy administration is not proof of a runtime per-caller authorization check. |
| `AML.M0029` | Only an actual authenticated human approval path; mark unavailable/partial for channels without a suitable approver. |
| `cap-agent-egress-control` | Hosted-computer network enforcement, plus independent backend-connector and delegated-child restrictions where applicable. |
| `cap-agent-kill-switch` | Vendor termination plus no-restart/queued-work response; disk erasure is separate. |
| `riskPromptInjection` | External content entering persistent context; input screening must actually classify/block, not only mark content untrusted. |
| `riskAgenticDelegationConfusedDeputy` | Caller-to-Team Bot/tool delegation where shared authority exceeds caller rights. Verify effective identity before asserting this failure. |
| `riskExcessiveDataHandlingDuringInference` | Persistent files, browser state and retained conversations beyond permitted purpose/retention. |
| `riskRogueActions` | Browser/tool writes, including unattended channel work; bounded permissions and direct action enforcement. |

Do not substitute `riskStaleAgentIdentityBinding` for departed-owner credentials: the canonical risk concerns model-artifact replacement. Do not label same-user shared cookies “cross-tenant propagation” unless a real tenant boundary is crossed. The cloud-session architecture's controls should be inherited only where the same enforcer and protected operation exist.

## Scope and verification

Primary pages above were successfully read on 2026-10-03. Current documentation supports the variant recommendation, but no live tenant was exercised; channel approval behavior and mixed credential modes require deployment probes. The companion [managed-runtime coverage update](managed-runtime-variants.md) classifies Dots and the OpenAI Agents API using these lifecycle criteria.

### Reviewed local fingerprints (SHA-256)

| File | SHA-256 |
| --- | --- |
| `data/tooling/cursor/grok-bot.yaml` | `0af3f8d051ca154888dfab1f293b15c8e57caf2858bbf926d4d9b55c69637a32` |
| `data/reference/architectures/saas-hosted-agent-sessions.yaml` | `c5338522f6acbce4e3084d51110d278cf483638b0b815fd678289d8dbfb2ea57` |
