# Reference architecture review — recommendations

**Reviewed:** 2026-10-03 · **Scope:** all 16 active reference architectures and all 15 existing guidance documents.

**Implementation update:** the subsequent [exemplar and persistent-agent change](IMPLEMENTATION.md) adds the seventeenth architecture and displays dated product examples above every diagram. The counts and fingerprints below describe the original review snapshot; remaining findings retain their individual remediation scope.

## Overall recommendation

Keep the catalogue and most of its component structure. **Correct control meanings and enforcement paths before adding more security components.** The main weaknesses are overstated capability pins, risk IDs used outside their definitions, and guidance that credits a gateway with controls on paths that bypass it. A few normal flows also contradict the secure posture their pins promise.

Naming is mechanically consistent, but some shared names hide different functions and some shared item packs add features a design does not need. The goal should be the same name for the same role, with only the features actually used by that architecture.

Three subagents reviewed the endpoint, cloud-agent and platform families under a [common rubric](REVIEW-RUBRIC.md). The lead reviewed hosted sessions and, after the requested delay, the managed API/SDK runtime, then reconciled the common findings. **Every one of the 279 capability pins and 215 risk pins has a disposition in the detailed reports.** These are recommendations; no architecture or application changes were made.

## Managed-agent update: Dots, Grok Bot and new runtime modes

Your current coding/desktop-session and API/SDK edits **were included**: both architecture files and both guidance files match the completed review. Two subagents rechecked the revisions and Grok Bot; the lead reviewed current OpenAI announcements and adjacent execution modes. See the [exact comparison](managed-architecture-delta-review.md).

The [managed-runtime coverage update](managed-runtime-variants.md) adds six recommendations and a product/mode matrix. **Keep hosted task sessions, add one persistent hosted-agent sibling, and extend the existing API/SDK reference with explicit browser/executor profiles.** Dots and Grok Bot need the persistent contract. General desktop/document sessions still need coverage in the task family, with approval before application effects rather than a universal pull-request ending. This refines HS-07's earlier coding-only recommendation.

The main additions are durable-state recovery, channel-specific authority, browser credentials, separate browser/connector/local routes, and delegated-work cancellation. [Grok Bot's detailed review](grok-bot-variant-review.md) records six further findings. These changes belong with items 5, 7 and 8 below; the proposed new sibling would bring the catalogue to 17 architectures.

## Work through these ten items

P1 means a misleading security claim, a significant protocol defect, or a missing/contradictory essential enforcement path. P2 means material ambiguity, inconsistency or unnecessary complexity. Detailed reports distinguish defects, conditional defects and design judgments.

| Order | Priority | Recommendation | Done when |
| ---: | --- | --- | --- |
| 1 | P1 | **Fix stretched capability and risk mappings across the catalogue.** Examples: SSO ≠ MFA; inventory ≠ authentication; credential transmission scoping ≠ filesystem isolation; an orphan token ≠ stale model/identity binding. | Every retained pin matches its canonical definition and names the actual enforcer. Global mappings agree with the corrected instance. [CC-01/02](cross-catalogue-review.md) |
| 2 | P1 | **Close gaps in local-tool and custom-handler authorization.** Cloud native tools and managed-runtime callbacks can bypass the gateway credited with enforcing policy. | Trace every executable route to its resource; each verifies principal, operation, arguments and resource permissions before effects. [CA-01](cloud-agents-review.md), [EP-08](endpoint-review.md), [MR-01](managed-runtime-review.md) |
| 3 | P1 | **Correct protocol, approval and identity guarantees.** Fix A2A paths/dispatch assumptions, MCP caller-confirmation trust, bearer replay claims and lifecycle propagation. | Protocol examples match a stated binding/version; forged approval, wrong-audience tokens and unauthorized object handles fail at the named enforcer. [CA-12–20](cloud-agents-review.md) |
| 4 | P1 | **Make normal flows obey their own security requirements.** Repair unattended chat writes, local-inference wrapper bypass/egress, unsecured first-party relay, mixed third-party inference modes, and model→gateway→tool sequences that skip the harness. | A normal walkthrough can execute without bypassing a pin, changing deployment mode, or assigning planning to a gateway. [CA-02/09](cloud-agents-review.md), [EP-09–12/18](endpoint-review.md) |
| 5 | P1 | **Make shutdown and workload bounds real.** Revocation, registry withdrawal and gateway quotas do not necessarily stop local execution, queued work or remote peers. | A stop exercise accounts for active processes, children, queues, schedules and delegated work, with a known maximum delay. Budgets bound the whole run. [EP-05/17](endpoint-review.md), [CA-08/17](cloud-agents-review.md), [TRAIN-01](platform-review.md), [MR-05/06](managed-runtime-review.md) |
| 6 | P1 | **Repair inference and training guarantees.** Distinguish KV/cache isolation from agent memory, hardware process isolation from side-channel protection, and evaluated artifacts from merely signed bytes. | Tenant cache separation is enforced; promotion binds to approved immutable artifacts; risk tags and release/rollback controls match their actual mechanisms. [INF-01–03, TRAIN-01–04](platform-review.md) |
| 7 | P1/P2 | **Make SaaS boundaries and coverage truthful.** Correct data gateway vs passive tunnel; show or disable direct connector bypasses; distinguish vendor assurance from customer-configurable enforcement. | Each route has a real transport and enforcer; vendor-only guarantees are not reported as customer controls. [PLAT-02/03, LOW-01/02](platform-review.md), [HS-03/06](hosted-sessions-review.md), [MR-03](managed-runtime-review.md) |
| 8 | P1/P2 | **Clarify managed-runtime coverage and simplify each baseline.** Add the persistent hosted-agent contract; preserve coding/general-work session profiles. Remove unnecessary A2A/skills items and ownership-changing scenarios. | Dots/Grok persistence and API browser paths have correct lifetimes, authority and gates; every default component serves a necessary flow or threat. [MV-01–06](managed-runtime-variants.md), [CC-04–06](cross-catalogue-review.md) |
| 9 | P2 | **Fix shared naming and custody semantics.** Distinguish a web proxy from an AI gateway; put rented services in the vendor band; show coding agents' actual local workspace. | The same title means the same role, bands always identify the operator, and local work does not appear to require a remote data round trip. [EP-13/14](endpoint-review.md), [HS-04](hosted-sessions-review.md), [LOW-03](platform-review.md) |
| 10 | P2/P3 | **Synchronize guidance and review rules.** Add missing browser guidance, remove blanket TLS/product claims, refresh stale ontology/guide language, and clarify composite capability attribution. | Each architecture and its guidance describe one system; external standards, product facts and local conventions are distinguishable. [EP-06/15/19](endpoint-review.md), [CC-07/08](cross-catalogue-review.md) |

**Suggested first change set:** item 1's clear semantic substitutions/removals and the contradictory approval/bypass claims in items 2–4. Fix shared patterns in sibling architectures and guidance together. Avoid a broad diagram redesign while those meanings are still unsettled.

## Architecture-by-architecture queue

| Architecture | Highest-value changes | Detailed review |
| --- | --- | --- |
| Browser AI agents & extensions | Fix CTS/MFA and risk meanings; correct TLS assumptions; name the web proxy honestly; add guidance. | [EP-01/02/04/06/14/15](endpoint-review.md) |
| First-party coding & desktop agents | Secure or remove remote relay; add local workspace; cover both tool paths and endpoint stop/logging. | [EP-05/08/09/13](endpoint-review.md) |
| Third-party coding & desktop agents | Choose one compatible inference mode; keep hosted-session reachback in its own pattern; fix local enforcement/workspace. | [EP-05/08/10/13](endpoint-review.md) |
| Personal autonomous agent | Complete local/relay stop coverage, harden durable state, correct definition admission and gateway/control-API terminology. | [EP-03/05/07/08/18](endpoint-review.md) |
| Local model runtime | Make authenticated wrapper and private backend real; enforce local-only egress; narrow supply-chain/risk pins. | [EP-02/03/11/12/16](endpoint-review.md) |
| Single agent workflow | Cover local handlers; return model output to the planner before dispatch; repair credential/retrieval/integrity claims. | [CA-01/03–09](cloud-agents-review.md) |
| Multi-agent workflow | Clarify logical vs process identity, shared-state provenance and sandbox placement; bound whole-workflow execution. | [CA-01/03–11](cloud-agents-review.md) |
| Chat agent with tools | Stop scheduled writes lacking authorization; separate retrieval permissions from grounding; cover local paths. | [CA-01/02/04/08](cloud-agents-review.md) |
| Agent-to-agent federation | Correct protocol examples and dispatch authorization; cover both peer paths; narrow delegation/revocation promises. | [CA-12–17/20](cloud-agents-review.md) |
| Remote MCP server | Fix client confirmation trust, message-auth/authorization confusion, risk meanings and stop semantics. | [CA-17–22](cloud-agents-review.md) |
| Self-hosted model inference | Correct cache/isolation and artifact-access claims; bind promotion; bound telemetry. | [INF-01–05](platform-review.md) |
| Fine-tuning and model registry pipeline | Separate withdrawal from termination; use training-appropriate controls; bind evaluation/signing to bytes; correct privacy risk. | [TRAIN-01–05](platform-review.md) |
| Enterprise AI chat with connectors | Correct identity/risk pins, inspectability assumptions and action approval; clarify tenant configuration versus assurance. | [PLAT-01–03, CHAT-01–04](platform-review.md) |
| UI/low-code managed agent runtime | Correct connector transport, authorize at execution, simplify provider boundary and repair grounded-response sequence. | [LOW-01–05](platform-review.md) |
| Coding & desktop session managed runtime | Enforce dependency admission; show/disable direct connectors; correct ownership/risk pins; distinguish coding promotion from general-work action approval. | [HS-01–07](hosted-sessions-review.md), [MV-01](managed-runtime-variants.md) |
| API/SDK managed agent runtime | Complete custom-tool authorization; correct identity pins; align direct connector coverage/egress; add explicit browser and executor profiles. | [MR-01–07](managed-runtime-review.md), [MV-05/06](managed-runtime-variants.md) |
| **Proposed: persistent hosted agents** | Cover durable state, personal/shared authority, browser/connector/local routes, schedules and delegated-work lifecycle. | [MV-01–06](managed-runtime-variants.md), [GROK-01–06](grok-bot-variant-review.md) |

## Standards and simplicity decisions

Keep established component roles and the useful separation between prevention, observability and assurance. Do not add a component merely because a control needs a pin. Allow canonical item subsets instead of requiring identical optional features everywhere.

Apply protocol requirements precisely: token audience, sender binding and authorization are different protections under [OAuth security guidance](https://www.rfc-editor.org/rfc/rfc9700.html) and [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization). Our exact box names and gateway layout are local conventions, not requirements imposed by those standards. The [cross-catalogue report](cross-catalogue-review.md) records the proposed naming contract and mapping rules.

Do not fill every taxonomy gap with another pin. The 2 unpinned risks and 23 unpinned capabilities include out-of-scope, overlapping and parent techniques. Add a pin only for a needed, directly enforced function. Keep unsupported protections as explicit gaps rather than stretching the nearest capability.

## Validation and review limits

- All **16 architectures, 263 blocks, 178 edges, 279 capability pins and 215 risk pins** reviewed, including walks, scenarios and deviations. All 15 existing guidance files reviewed; browser guidance is absent.
- Data compilation passed: vocabulary conformant; **65 block titles / 128 item labels**. This proves structural consistency, not security correctness.
- Generated audit passed; all **10 capability tests passed** in an isolated snapshot. The `tsx` CLI initially hit a sandbox IPC restriction; the same build/audit scripts succeeded using `node --import tsx`.
- Reviews used canonical local definitions and current primary protocol/vendor sources. This is a design/data review, not a deployed security test, product certification, exhaustive source-link audit or rendered-diagram usability review.
- Managed API/SDK runtime was reviewed last. Completion fingerprints are in [review-final.json](review-final.json); the [follow-up comparison](managed-architecture-delta-review.md) confirms the current managed architecture/guidance edits were included. Later edits in other branches/worktrees are outside that comparison.
- The October 2026 [coverage supplement](managed-runtime-variants.md) checks current primary product sources and refines HS-07. Its proposed new reference is not counted in the 16 reviewed architectures or existing pin totals.
- Only new report files were written in this folder. Existing architectures, guidance, application code and generated data were left untouched by the review team.

After remediation, rerun the builder, capability checks and generated audit, then verify the specific rejection/approval/stop scenarios in the findings. Passing the builder alone should not close a semantic finding.
