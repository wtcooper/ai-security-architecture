# Pattern findings, 2026-11-15

What turned up while every pattern was brought to [the pattern standard](PATTERN-STANDARD.md).
Nothing here fails the build: the measured rules are all met. These are questions about the
patterns themselves that only their author can settle, and inconsistencies in their prose that
were noticed while the one-liners and crossings were written.

Two kinds of entry:

- **Open questions** come from `npm run drawing:audit`, which lists them per pattern
  (`npm run drawing:audit -- <slug>`). They are counted in its last column and are reproducible.
- **Noticed in the prose** were reported by the reviewers who read each pattern file end to end
  to author its one-liners and crossings. They have not been checked a second time, so read each
  as a pointer to look, not a verdict.

## Across patterns

**Control-plane boxes that own nothing (rule C5).** Four patterns draw a control-plane box that
owns no control the pattern pins. Either a control belongs there, or the box's note should say
why it is drawn empty.

| Pattern | Empty box | What the file says |
| --- | --- | --- |
| Agent sandbox for RL & evaluation | Secrets & key management | Its note says it is kept out on purpose. Settled. |
| Self-hosted model inference | Secrets & key management | The note describes storage, registry and control-plane credentials, but no secrets control is pinned. |
| Model training & release pipeline | Observability & response | The note describes the lineage record and model documentation, which are supply-chain controls owned elsewhere. No logging control is pinned. |
| First-party coding & desktop agents | Identity services | No identity control is pinned; the third-party sibling's MFA sits on a vendor service that does not exist here. |

**Controls pinned on the drawing but grouped under no control-plane function.** Twenty-seven
pins across thirteen patterns. Most are isolation controls enforced where the workload runs
(Execution Isolation on ten patterns, Network Isolation, Hardware-based Process Isolation),
which the control-plane grouping in `data/reference/vocabulary.yaml` does not assign to any
function. If that is intended, nothing changes; if every control should have an owner in the
band, the grouping needs an entry for them. The rest: Retrieval Trust and Grounding Checks
(single agent, multi-agent, chat agent), Output Encoding (chat agent), Sanitize Training Data
(training pipeline), Data Inventory (enterprise chat), Message Authentication (personal agent),
and on the local model runtime Agent Authentication, Output Guardrails, Limit Query Volume and
Control Access to Models and Data at Rest, where only two control-plane boxes are drawn.

**No catalogued product (rule C9).** Agent-to-agent federation and Agent sandbox for RL &
evaluation have cloud mappings but no product in the tool registry. Their Enable tab says so.

**Walk steps with no note (rule C6).** Persistent managed agents: five steps on the remote
device's flows, in the walkthrough and the approval scenario.

**People who connect straight to the vendor.** On the low-code builder and persistent managed
agents, people reach the vendor with no managed endpoint or browser drawn, unlike enterprise
chat and hosted sessions. Their crossings are therefore "governed by the vendor", with nothing
of ours in the path.

## Noticed in the prose, by pattern

### Endpoint

**Third-party coding & desktop agents**
- Execution Isolation is pinned on the tools but owned by no control-plane box.

**First-party coding & desktop agents**
- The skills item says skills are "delivered from the mirror through the crossing" and the
  harness-to-gateway label is "inference, MCP & skills", while the registry flow's note says the
  gateway is not on the install path.
- The External zone's note says "no agreement", but it holds the model provider reached on our
  own vaulted key.

**Browser AI agents & extensions**
- A walkthrough step and a flow note say page extraction "strips hidden content"; the input
  guardrails pin says "No hidden-content stripping is documented".
- The gateway-to-downstream crossing is thin by the pattern's own pins: tracing is the only
  control on that flow or its ends.

**Local model runtime**
- The data-handling risk note and a deviation rely on a device firewall denying the runtime
  outbound traffic and on a local-only switch. No egress control is pinned.

**Personal autonomous agent**
- The harness-to-gateway note says "every skill fetch leaves the endpoint here"; the skills
  catalogue item and the registry flow's note say the bytes come straight from the mirror.
- Egress control and Execution Isolation are pinned on the sandbox container, not on the tools,
  so the tools-to-open-web crossing shows no egress control in the crossings table.
- The tools note lists computer use as "all inside the sandbox"; the computer-use item says it
  drives the host browser outside the boundary and is disabled in the target state.
- The workspace is described as mounted read-only, while the sandbox note says the mount
  "propagates both ways" and the flow is drawn two-way.
- The remote device's notes list the control UI and the local terminal as remote surfaces, but
  its only item is messaging apps.

### SaaS

**Enterprise AI chat with connectors**
- Identity services' note describes domain capture, but its only control, Access Policy
  Administration, is pinned on the vendor's tool services as admin consent. Domain capture has
  no pin.
- The Browser note says "a browser tab, or their desktop app", while the zone note and ontology
  rule 14 say browser only.

**Coding & desktop session managed agent runtime**
- The walkthrough says instruction files and threads are "classified on the way in" from source
  control, but the only input-guardrail pin is on the AI gateway, whose note covers gateway
  returns only.
- The runtime-to-our-source-control crossing is authored as brokered (our GitHub tenant: App on
  named repositories, IP allow list, branch protection). The third-party coding agent marks its
  own source-control flow direct. One of the two readings should hold for both.

**UI/low-code managed agent runtime**
- Nothing beyond the cross-pattern points above.

**API/SDK managed agent runtime**
- Identity services' note says "No identity technique is pinned here", yet the box lists Access
  Policy Administration, which is pinned twice.
- The code-base scenario says threads arrive "screened", with no screening control pinned on
  that path. The same text is in persistent managed agents.

**Persistent managed agents**
- The source-control flow and block text is carried over from the session patterns ("the
  session's own branch", "enter the session"), in a pattern defined as not being a session.
- That flow's note relies on the vendor's git proxy holding the credential, but Credential
  Transmission Scoping is pinned only on the connector flow.
- The exemplar "Grok Bot" links to cursor.com addresses.

### Cloud

**Single agent workflow**
- The input guardrails note says the trigger payload is classified at the gateway "before it
  enters" the loop, but the trigger goes from triggers to the harness without crossing the
  gateway. The multi-agent sibling words it correctly.

**Multi-agent workflow**
- The operator flows carry notes copied from the single-agent pattern ("case", "parked
  proposal"); this pattern's own scenario says "workflow state", "signal" and "suspended step".

**Chat agent with tools**
- The user-to-front-end crossing is brokered here (three controls are pinned at the front end)
  and "through the person" on agent federation (none are). Both follow their pins; if they
  should read alike, federation is missing the pins.

**Agent-to-agent federation across platforms**
- The harness-to-gateway label reads "inference, MCP & skills", but its note and the gateway's
  item say the traffic is inference and A2A tasks.
- Tool services carries an "A2A peer agents" item, while a deviation says peers are blocks here.
- Risk and control pins differ between the two peers (prompt injection and spend only on the
  partner; data disclosure, delegation opacity and card tampering only on the vendor's peer),
  though the notes describe most as applying to both.

**Agent sandbox for RL & evaluation**
- No human sign-in or approval control is pinned on the researcher, the orchestrator or the
  flow between them.
- The kill switch is pinned at Observability & response, though the notes say the orchestrator
  enforces the stop, so the orchestrator owns no control on the drawing.
- The open-web-to-offline-web crossing is direct: nothing is pinned on it or its ends.

**Remote MCP server you publish**
- Fixed here: the callers were drawn inside our cloud, so the inbound flows were not counted as
  crossings. They now stand outside it, and the three inbound crossings are authored.
- Identity services' note is about scope design and step-up, which is what the tool-permissions
  pin says, but that control is owned by Policy & authorization.
- Policy & authorization's note does not cover the per-tenant data scoping it cites.

**Self-hosted model inference**
- One pin says "only the promotion pipeline writes" to storage; the sources-to-storage note says
  hub artifacts are fetched by ingest tooling into storage before promotion.
- Observability & response's note mentions per-version red teaming, but the only pin covering
  per-version evaluation is the staged rollout gate, a supply-chain control.

**Model training & release pipeline**
- The base-model block's note says "pulled from a public hub or an internal mirror", but the
  block is external and the internal mirror is the separate registry block.
- Agent Authentication is pinned only on the job-to-storage flow, while its note and the
  walkthrough say the run's identity is also checked at the corpus store.
