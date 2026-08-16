# Node review — every block across the 29 reference architectures

Generated from `data/reference/architectures/*.yaml` on 2026-08-16 for a systematic
consistency review. Blocks are grouped by the role they play; within each group, rows sort by
surface and rank. Items show `icon · label`. The standard vocabulary this is reviewed against
lives in `data/PROVENANCE.md`.

---

# Assessment — where consistency still has room to improve

Ordered by how much they'd bother a reader flipping between diagrams.

## F1 · Sandboxing is drawn three different ways (the big one)

| Shape | Where | What it claims |
| --- | --- | --- |
| Standalone node beside Tool services | Coding agent, Personal agent | "Commands run isolated" — an execution facility the tool plane calls into |
| Harness fused inside the sandbox | Sandboxed agentic execution ("Sandboxed runtime") | "The whole agent is contained" — loop, workspace, browser all inside the boundary |
| Provider product | Managed agent runtime ("Managed sandbox") | Same claim as row 2, bought not built |
| GUI variant | Desktop assistant ("Contained desktop") | A contained desktop for computer use — row 2's claim for the screen |
| Item inside a block | Internal platform ("Sandboxed execution" item in Shared agent runtime) | Row 2's claim, one level down |

These are genuinely **two different claims** sharing one word: *isolated execution as a
facility* (a place specific commands run — correctly a standalone node) versus *the agent
contained* (the Docker-style product that wraps OpenClaw/Hermes whole; the disposable cloud
environment). The flow grammar has no way to draw containment — no nested blocks — so the
second claim is currently expressed by fusion ("Sandboxed runtime") or not at all (the
personal agent's standalone box **understates** the wrap-the-whole-harness product).

**Recommendation:** add a containment affordance to the layout — a labelled boundary frame
that visually encloses a set of blocks (build-time, same collision rules). Then: sandboxed
execution draws the frame around harness+workspace; the personal agent's target state draws
the frame around harness+tools (the Docker product); coding agent keeps the standalone
facility node (that is its actual shape — only commands are contained). Near-term, before the
affordance exists: keep the two names strict — "Sandboxed execution" = facility node,
"Sandboxed/Contained X" = containment — and say which claim each note makes.

## F2 · Downstream services: three anchors, two kinds — visible as three tab colours

The same block is anchored `Application` (blue tab: multi-agent, chat, coding, personal,
browser, desktop, tool plane, vendor action), `DataStorage` (amber: single agent, sandboxed
execution, managed runtime, API backend) and `DataSources` (amber: voice). Voice's is also
`kind: service` while every other one is `external`. A reader comparing diagrams sees the
"same" node change colour and border for no stated reason.

**Recommendation:** one rule — `kind: external`, anchored `Application` (they are running
services being acted on; the records live behind them), with the data-at-rest story carried
by the items. Voice's block also becomes external.

## F3 · Endpoint vendor blocks: "Vendor service" vs "Model provider"

Coding agent calls it **Vendor service** (inference + managed settings + audit export).
Desktop assistant calls it **Model provider** yet also carries the vendor's connector broker.
Personal agent and browser have pure-inference **Model provider** blocks — correct.

**Recommendation:** rule — pure inference boundary = "Model provider"; vendor control-plane
surfaces present = "Vendor service". Rename the desktop assistant's block to "Vendor service".

## F4 · The governance audit item goes by seven names

Audit sink · Decision audit · Session audit · Call audit · Usage & prompt log · Exported
audit · Audit export · Post-call review. Some differences are real (SaaS tenants *export*
audit, they do not own a sink; voice reviews calls), most are drift.

**Recommendation:** "Audit sink" wherever the org owns the store; "Audit export" wherever a
vendor emits it; keep "Post-call review" (voice) as a genuinely different activity. Retire
Decision/Session/Call audit labels into notes.

## F5 · Front-end items drift from the standard pair

Standard is `App & API endpoint` + `Identity binding` (chat agent, RAG). Managed agent
runtime has "App & API surface | User identity"; analytics has "Conversation UI | Session
attribution". Same roles, different words.

**Recommendation:** align labels; keep analytics' "Session attribution" note text (execution
as the asking user) under the standard "Identity binding" label.

## F6 · SaaS edge blocks: three names for the customer edge

"Identity & secure edge" (enterprise chat, tenant assistant) · "Identity & network edge"
(vendor action agent) · "Secure service edge" (shadow AI — deliberately IdP-less, correct).

**Recommendation:** "Identity & secure edge" for all three identity-bearing ones; shadow AI
keeps "Secure service edge".

## F7 · The egress family is fine — leave it

"Egress gate" (per-task network policy, sandboxed execution), "Provider egress" (the AI
gateway's own crossing), "Egress inspection" (third-party MCP) are three real, different
mechanisms. Reviewed and deliberately not merged.

## F8 · Consuming-workload blocks appear in three kinds

The org's AI-consuming applications are an actor ("AI workloads", AI gateway), a service
block ("Application services", managed model API), and a service block ("Tenant workloads",
internal platform). Defensible — when the *platform* is the subject, its consumers compress —
but worth a one-line rule in PROVENANCE: consumers of the subject are actors unless they
carry items of their own.

## F9 · ReasoningCore without a harness — correct, but state the rule

RAG's "Query orchestration" and analytics' "Query generation" anchor ReasoningCore but are
not titled Agent harness — right, because neither runs an agent loop. Add the rule to
PROVENANCE: *ReasoningCore anchor does not imply harness; a harness requires a loop.*

## F10 · Minor label sweep

- "Extension distribution" (shadow AI) → "Extension store" reads more naturally.
- `gear` icon is the catch-all (Computer use, Installed skills, engines, registries) — if the
  icon set ever grows, these are the candidates.
- "Public model hub" appears identically in local inference and self-hosted — good; keep as
  the template for repeated externals.

## Suggested order

F2 (mechanical, visible) → F3 + F6 + F5 + F4 + F10 (renames, one pass) → F1 (needs the
layout affordance — the only structural one) → F8/F9 (PROVENANCE prose only).

---

# The full node inventory

## Agent harness & orchestration (14 blocks)

| Architecture | Block | Kind | CoSAI anchor | Items (icon · label) |
| --- | --- | --- | --- | --- |
| Single agent workflow _(Cloud)_ | **Agent harness** | service | ReasoningCore | agent · Agent loop<br>doc · Context assembly |
| Durable multi-agent workflow _(Cloud)_ | **Supervisor agent** | service | ReasoningCore | agent · Planning loop<br>gear · Durable engine |
| Durable multi-agent workflow _(Cloud)_ | **Subagents** | service | ReasoningCore | agent · Specialist agents<br>chat · Inter-agent messages |
| Chat agent with tools _(Cloud)_ | **Agent harness** | service | ReasoningCore | agent · Agent loop<br>doc · Context assembly |
| Embedded retrieval assistant _(Cloud)_ | **Query orchestration** | service | ReasoningCore | doc · Prompt assembly<br>search · Retriever<br>code · Grounding & encoding |
| Text-to-SQL analytics agent _(Cloud)_ | **Query generation** | service | ReasoningCore | code · SQL generator<br>doc · Result summarisation |
| Realtime voice agent _(Cloud)_ | **Agent harness** | service | ReasoningCore | chat · Stream handling<br>agent · Agent loop<br>person · Human transfer |
| Managed agent runtime _(Cloud)_ | **Managed runtime** | provider | ReasoningCore | plug · Runtime API<br>agent · Declarative harness<br>code · Custom-code runtime |
| Internal multi-tenant AI platform _(Cloud)_ | **Shared agent runtime** | service | ReasoningCore | agent · Tenant execution<br>shield · Sandboxed execution |
| Vendor coding agent _(Endpoint)_ | **Agent harness** | service | ReasoningCore | agent · Agent loop<br>doc · Context assembly |
| Desktop AI assistant _(Endpoint)_ | **Agent harness** | service | ReasoningCore | agent · Agent loop<br>doc · Context assembly |
| Personal autonomous agent _(Endpoint)_ | **Agent harness** | service | ReasoningCore | agent · Agent loop<br>clock · Heartbeat<br>doc · Context assembly<br>key · Secrets store |
| Agentic browser and AI extension _(Endpoint)_ | **Agent harness** | service | ReasoningCore | agent · Agent loop<br>doc · Context assembly<br>doc · Page extraction |
| Third-party MCP server you consume _(Saas)_ | **Agent harness** | service | ReasoningCore | agent · Agent loop<br>doc · Context assembly |

## Sandboxing & containment (5 blocks)

| Architecture | Block | Kind | CoSAI anchor | Items (icon · label) |
| --- | --- | --- | --- | --- |
| Sandboxed agentic execution service _(Cloud)_ | **Sandboxed runtime** | service | ReasoningCore | agent · Agent loop<br>code · Workspace & shell<br>globe · Clean browser<br>shield · Isolation boundary |
| Managed agent runtime _(Cloud)_ | **Managed sandbox** | provider | — | code · Code interpreter<br>globe · Hosted browser |
| Vendor coding agent _(Endpoint)_ | **Sandboxed execution** | service | — | shield · Isolated runtime |
| Desktop AI assistant _(Endpoint)_ | **Contained desktop** | service | Tools | gear · Screen & input control<br>globe · GUI applications<br>folder · Contained workspace |
| Personal autonomous agent _(Endpoint)_ | **Sandboxed execution** | service | — | shield · Isolated runtime |

## Tool plane (14 blocks)

| Architecture | Block | Kind | CoSAI anchor | Items (icon · label) |
| --- | --- | --- | --- | --- |
| Single agent workflow _(Cloud)_ | **Tool services** | service | Tools | plug · MCP servers<br>plug · APIs & connectors<br>agent · A2A peer agents |
| Durable multi-agent workflow _(Cloud)_ | **Tool services** | service | Tools | plug · MCP servers<br>plug · APIs & connectors<br>agent · A2A peer agents |
| Chat agent with tools _(Cloud)_ | **Tool services** | service | Tools | plug · MCP servers<br>plug · APIs & connectors<br>agent · A2A peer agents |
| Remote MCP server you publish _(Cloud)_ | **Tool definitions** | service | Tools | doc · Tool descriptions<br>code · Input schemas<br>shield · Confirmation flags |
| Remote MCP server you publish _(Cloud)_ | **Tool handlers** | service | Application | code · Handler code<br>shield · Argument validation<br>doc · Result shaping |
| Realtime voice agent _(Cloud)_ | **Tool services** | service | Tools | plug · MCP servers<br>plug · APIs & connectors |
| Managed agent runtime _(Cloud)_ | **Managed tool gateway** | provider | — | key · Scoped tool brokering<br>plug · MCP & connectors |
| Vendor coding agent _(Endpoint)_ | **Tool services** | service | Tools | folder · File & edit tools<br>code · Shell commands<br>gear · Installed skills<br>plug · Local & remote MCP |
| Desktop AI assistant _(Endpoint)_ | **Tool services** | service | Tools | folder · File & edit tools<br>plug · Local & remote MCP<br>code · Shell commands<br>gear · Installed skills<br>gear · Computer use |
| Personal autonomous agent _(Endpoint)_ | **Tool services** | service | Tools | folder · File & edit tools<br>code · Shell commands<br>plug · Local & remote MCP<br>gear · Computer use<br>gear · Installed skills |
| Agentic browser and AI extension _(Endpoint)_ | **Tool services** | service | Tools | globe · Navigation & input<br>search · DOM reader<br>plug · Local & remote MCP<br>plug · Extension host & updates |
| Local MCP and tool plane _(Endpoint)_ | **Tool configuration** | service | DataStorage | doc · Project-scoped file<br>doc · User-scoped file<br>shield · Auto-approve rules |
| Local MCP and tool plane _(Endpoint)_ | **Tool services** | service | Tools | plug · Stdio child processes<br>doc · Tool descriptions<br>key · Server credentials |
| Third-party MCP server you consume _(Saas)_ | **Tool broker** | service | — | plug · Connection manager<br>doc · Description pinning<br>scale · Approval gate<br>eye · Call log |

## Gateways (12 blocks)

| Architecture | Block | Kind | CoSAI anchor | Items (icon · label) |
| --- | --- | --- | --- | --- |
| Single agent workflow _(Cloud)_ | **AI gateway** | service | — | key · Credential broker<br>clock · Rate & budget limits<br>doc · Audit tap |
| Durable multi-agent workflow _(Cloud)_ | **AI gateway** | service | — | key · Credential broker<br>shield · Policy enforcement<br>clock · Rate & budget limits<br>eye · Audit taps |
| Chat agent with tools _(Cloud)_ | **AI gateway** | service | — | key · Credential broker<br>clock · Rate & budget limits<br>doc · Audit tap |
| Embedded retrieval assistant _(Cloud)_ | **AI gateway** | service | — | shield · Content guardrails<br>key · Credential broker<br>clock · Rate & cost limits<br>eye · Logging tap |
| Managed model API consumption _(Cloud)_ | **AI gateway** | service | — | gear · Model routing<br>eye · Prompt redaction<br>clock · Per-caller quotas<br>doc · Call log tap |
| AI gateway, router and guardrail plane _(Cloud)_ | **Gateway endpoint** | service | — | plug · Unified API<br>eye · Prompt redaction<br>shield · Guardrails, both legs |
| AI gateway, router and guardrail plane _(Cloud)_ | **Routing & failover** | service | — | gear · Model router<br>clock · Budget enforcement |
| AI gateway, router and guardrail plane _(Cloud)_ | **Semantic cache** | service | ModelServing | db · Cached responses |
| AI gateway, router and guardrail plane _(Cloud)_ | **Provider egress** | service | — | key · Credential injection<br>globe · Egress proxy |
| Sandboxed agentic execution service _(Cloud)_ | **AI gateway** | service | Tools | key · Credential broker<br>plug · Proxied operations<br>doc · Artifact creation |
| Self-hosted open-weights inference _(Cloud)_ | **AI gateway** | service | — | clock · Admission & quotas<br>shield · Guardrail checks<br>gear · Model routing |
| Internal multi-tenant AI platform _(Cloud)_ | **Shared AI gateway** | service | — | globe · Provider crossing<br>clock · Per-tenant quotas<br>eye · Tenant-tagged telemetry |

## Egress & edge inspection (7 blocks)

| Architecture | Block | Kind | CoSAI anchor | Items (icon · label) |
| --- | --- | --- | --- | --- |
| Sandboxed agentic execution service _(Cloud)_ | **Egress gate** | service | — | shield · Per-task allowlist<br>eye · Attempt logging |
| Enterprise AI chat with connectors _(Saas)_ | **Identity & secure edge** | service | — | key · Identity provider<br>shield · Secure service edge |
| Tenant-wide assistant over your corpus _(Saas)_ | **Identity & secure edge** | service | — | key · Identity provider<br>shield · Secure service edge |
| Shadow AI services and extensions _(Saas)_ | **Secure service edge** | service | — | shield · Inline inspection<br>stop · Destination control |
| In-app agent acting on vendor records _(Saas)_ | **Identity & network edge** | service | — | key · Identity provider<br>shield · Network inspection |
| Vendor low-code agent builder _(Saas)_ | **Identity & entitlements** | service | — | person · User authentication<br>key · Invoker credentials |
| Third-party MCP server you consume _(Saas)_ | **Egress inspection** | service | — | shield · Secure service edge<br>eye · Content inspection |

## Memory & state (9 blocks)

| Architecture | Block | Kind | CoSAI anchor | Items (icon · label) |
| --- | --- | --- | --- | --- |
| Single agent workflow _(Cloud)_ | **Memory & state** | service | DataStorage | search · Policy & record retrieval<br>folder · Case state |
| Durable multi-agent workflow _(Cloud)_ | **Memory & state** | service | DataStorage | doc · Step journal<br>search · Vector index<br>folder · Shared memory |
| Chat agent with tools _(Cloud)_ | **Memory & state** | service | DataStorage | folder · Conversation state<br>search · Vector index |
| Embedded retrieval assistant _(Cloud)_ | **Memory & state** | service | DataStorage | db · Vector index<br>folder · Conversation state |
| Realtime voice agent _(Cloud)_ | **Audio & transcripts** | service | DataStorage | folder · Call audio<br>doc · Transcripts |
| Managed agent runtime _(Cloud)_ | **Managed memory** | provider | DataStorage | folder · Memory store<br>gear · Scope configuration |
| Agent-facing endpoint _(Cloud)_ | **Orders & evidence** | service | DataStorage | db · Orders & accounts<br>doc · Mandate evidence |
| Personal autonomous agent _(Endpoint)_ | **Memory & state** | service | DataStorage | folder · Memory files<br>search · Search index |
| Agentic browser and AI extension _(Endpoint)_ | **Browser profile** | service | DataStorage | key · Session cookies<br>doc · Saved passwords & autofill |

## Downstream & acted-on systems (18 blocks)

| Architecture | Block | Kind | CoSAI anchor | Items (icon · label) |
| --- | --- | --- | --- | --- |
| Single agent workflow _(Cloud)_ | **Downstream services** | external | DataStorage | db · Business records<br>mail · Email & SaaS<br>globe · External APIs |
| Durable multi-agent workflow _(Cloud)_ | **Downstream services** | external | Application | db · Business records<br>mail · Email & SaaS<br>globe · External APIs |
| Chat agent with tools _(Cloud)_ | **Downstream services** | external | Application | db · Business records<br>mail · Email & SaaS<br>globe · External APIs |
| AI-augmented API backend _(Cloud)_ | **Downstream services** | external | DataStorage | db · Records & downstream code |
| Remote MCP server you publish _(Cloud)_ | **Tenant data** | service | DataStorage | db · Tenant records<br>shield · Tenant isolation |
| Text-to-SQL analytics agent _(Cloud)_ | **Warehouse & engine** | service | DataStorage | gear · Query execution as the user<br>db · Live records |
| Sandboxed agentic execution service _(Cloud)_ | **Downstream services** | external | DataStorage | code · Target repositories<br>gear · Infrastructure & records |
| Realtime voice agent _(Cloud)_ | **Downstream services** | service | DataSources | db · Accounts & history |
| Managed agent runtime _(Cloud)_ | **Downstream services** | external | DataStorage | db · Business records<br>globe · External content |
| Vendor coding agent _(Endpoint)_ | **Downstream services** | external | Application | db · Package registries<br>globe · Web & APIs |
| Desktop AI assistant _(Endpoint)_ | **Downstream services** | external | Application | mail · Mail & calendar<br>db · File storage |
| Personal autonomous agent _(Endpoint)_ | **Downstream services** | external | Application | mail · Email & accounts<br>globe · Websites & APIs<br>phone · Paired devices |
| Agentic browser and AI extension _(Endpoint)_ | **Downstream services** | external | Application | mail · Mail & calendar<br>db · Banking & payments<br>code · Source control & internal apps |
| Local MCP and tool plane _(Endpoint)_ | **Downstream services** | external | Application | globe · Remote APIs<br>mail · SaaS accounts |
| Enterprise AI chat with connectors _(Saas)_ | **User-connected systems** | service | DataSources | db · Repos, drives & trackers<br>mail · Content authored elsewhere |
| Tenant-wide assistant over your corpus _(Saas)_ | **Systems of record** | service | DataSources | folder · Mail, files & wikis<br>shield · Source permissions<br>key · Indexing grant |
| In-app agent acting on vendor records _(Saas)_ | **Downstream services** | external | Application | db · Billing & entitlements<br>people · Directory & downstream apps |
| Vendor low-code agent builder _(Saas)_ | **Connected systems** | service | DataSources | db · Business data<br>mail · Mail & action paths |

## Front ends & entry surfaces (13 blocks)

| Architecture | Block | Kind | CoSAI anchor | Items (icon · label) |
| --- | --- | --- | --- | --- |
| Chat agent with tools _(Cloud)_ | **Application front end** | service | Application | globe · App & API endpoint<br>shield · Identity binding |
| Embedded retrieval assistant _(Cloud)_ | **Application front end** | service | Application | globe · App & API endpoint<br>shield · Identity binding |
| AI-augmented API backend _(Cloud)_ | **API contract** | service | ApplicationInputHandling | globe · Published endpoint |
| Remote MCP server you publish _(Cloud)_ | **Protocol endpoint** | service | ApplicationInputHandling | plug · MCP transport<br>shield · Session handling |
| Text-to-SQL analytics agent _(Cloud)_ | **Application front end** | service | Application | chat · Conversation UI<br>key · Session attribution |
| Realtime voice agent _(Cloud)_ | **Telephony edge** | service | AgentUserQuery | phone · Session border<br>globe · Caller ID & carrier signals |
| Managed agent runtime _(Cloud)_ | **Application front end** | service | Application | globe · App & API surface<br>shield · User identity |
| Internal multi-tenant AI platform _(Cloud)_ | **Onboarding & templates** | service | — | doc · Registration<br>gear · Paved-road templates |
| Agent-facing endpoint _(Cloud)_ | **Human path & bot defence** | service | — | shield · Bot management<br>phone · Out-of-band confirmation |
| Agent-facing endpoint _(Cloud)_ | **Agent lane** | service | ApplicationInputHandling | key · Agent authentication<br>clock · Per-operator rate limits<br>eye · Behaviour baselines |
| Personal autonomous agent _(Endpoint)_ | **Channel bridges** | service | AgentUserQuery | chat · Channel adapters |
| Enterprise AI chat with connectors _(Saas)_ | **Chat surface & uploads** | service | AgentUserQuery | chat · Browser / client<br>doc · File upload |
| Tenant-wide assistant over your corpus _(Saas)_ | **Managed workspace** | service | AgentUserQuery | chat · Assistant surface<br>eye · Browser & DLP controls |

## Model providers & vendor platforms (21 blocks)

| Architecture | Block | Kind | CoSAI anchor | Items (icon · label) |
| --- | --- | --- | --- | --- |
| Single agent workflow _(Cloud)_ | **Model provider** | provider | ModelServing | model · Inference API |
| Durable multi-agent workflow _(Cloud)_ | **Model provider** | provider | ModelServing | model · Inference API |
| Chat agent with tools _(Cloud)_ | **Model provider** | provider | ModelServing | model · Inference API |
| Embedded retrieval assistant _(Cloud)_ | **Model provider** | provider | ModelServing | model · Inference API |
| AI-augmented API backend _(Cloud)_ | **Model provider** | provider | ModelServing | model · Inference API |
| Managed model API consumption _(Cloud)_ | **Model provider** | provider | ModelServing | model · Inference API<br>shield · Managed guardrails<br>gear · Data-handling controls |
| AI gateway, router and guardrail plane _(Cloud)_ | **Model providers** | provider | ModelServing | model · Inference APIs |
| Batch and offline AI pipeline _(Cloud)_ | **Model provider** | provider | ModelServing | model · Batch inference API |
| Text-to-SQL analytics agent _(Cloud)_ | **Model provider** | provider | ModelServing | model · Inference API |
| Sandboxed agentic execution service _(Cloud)_ | **Model provider** | provider | ModelServing | model · Inference API |
| Realtime voice agent _(Cloud)_ | **Model provider** | provider | ModelServing | model · Realtime speech API |
| Internal multi-tenant AI platform _(Cloud)_ | **Model providers** | provider | ModelServing | model · Inference APIs |
| Vendor coding agent _(Endpoint)_ | **Vendor service** | provider | ModelServing | model · Inference API<br>gear · Managed settings<br>eye · Session audit export |
| Desktop AI assistant _(Endpoint)_ | **Model provider** | provider | ModelServing | model · Inference API<br>plug · Connector broker |
| Personal autonomous agent _(Endpoint)_ | **Model provider** | provider | ModelServing | model · Inference API |
| Agentic browser and AI extension _(Endpoint)_ | **Model provider** | provider | ModelServing | model · Inference API |
| Enterprise AI chat with connectors _(Saas)_ | **Vendor chat service** | provider | Application | globe · Managed tenant API<br>plug · Connector broker<br>gear · Tenant configuration |
| Tenant-wide assistant over your corpus _(Saas)_ | **Vendor assistant** | provider | Application | globe · Tenant API<br>plug · Indexing connectors<br>gear · Tenant configuration |
| In-app agent acting on vendor records _(Saas)_ | **Vendor agent platform** | provider | Application | agent · In-app agent<br>db · Record & case APIs<br>plug · Integration framework |
| Vendor low-code agent builder _(Saas)_ | **Agent builder platform** | provider | Application | code · Authoring surface<br>agent · Agent runtime<br>plug · Connector framework |
| Third-party MCP server you consume _(Saas)_ | **Vendor MCP server** | provider | Tools | key · OAuth authorisation<br>plug · Tool interface |

## Model serving & artifacts (9 blocks)

| Architecture | Block | Kind | CoSAI anchor | Items (icon · label) |
| --- | --- | --- | --- | --- |
| Self-hosted open-weights inference _(Cloud)_ | **Model registry & weights** | service | ModelStorage | gear · Versioned registry<br>folder · Weight storage |
| Self-hosted open-weights inference _(Cloud)_ | **Serving runtime** | service | ModelServing | gear · Continuous batching<br>code · Serving stack |
| Self-hosted open-weights inference _(Cloud)_ | **KV & prefix cache** | service | ModelServing | db · KV cache<br>search · Prefix sharing |
| Self-hosted open-weights inference _(Cloud)_ | **Models on GPU** | service | TheModel | model · Loaded weights<br>gear · GPU node pool |
| Fine-tuning and model registry pipeline _(Cloud)_ | **Model registry** | service | ModelStorage | model · Candidate checkpoints<br>doc · Lineage metadata<br>shield · Signed releases |
| Local model runtime _(Endpoint)_ | **Local HTTP API** | service | ModelServing | plug · Completion endpoint<br>gear · Interface binding<br>globe · Cross-origin policy |
| Local model runtime _(Endpoint)_ | **Local guardrails** | service | — | shield · Input classification<br>eye · Output classification |
| Local model runtime _(Endpoint)_ | **Inference runtime** | service | TheModel | gear · Weight loader<br>model · Loaded model |
| Local model runtime _(Endpoint)_ | **Weights on disk** | service | ModelStorage | db · Model files |

## Data & pipeline stages (13 blocks)

| Architecture | Block | Kind | CoSAI anchor | Items (icon · label) |
| --- | --- | --- | --- | --- |
| Embedded retrieval assistant _(Cloud)_ | **Sources & ingest** | service | DataSources | db · Systems of record<br>plug · Source connectors<br>gear · Chunk & embed |
| AI-augmented API backend _(Cloud)_ | **Transformation** | service | Application | doc · Prompt construction<br>clock · Timeouts & retries |
| AI-augmented API backend _(Cloud)_ | **Output validation** | service | ApplicationOutputHandling | shield · Schema conformance<br>doc · Field constraints<br>code · Output encoding<br>gear · Deterministic fallback |
| Batch and offline AI pipeline _(Cloud)_ | **Source corpus** | service | DataSources | db · Stored records |
| Batch and offline AI pipeline _(Cloud)_ | **Job orchestration** | service | DataFilteringAndProcessing | gear · Batching & checkpoints<br>doc · Prompt construction<br>clock · Retry & idempotency |
| Batch and offline AI pipeline _(Cloud)_ | **Validation & stamping** | service | ApplicationOutputHandling | shield · Output validation<br>doc · Provenance stamp |
| Batch and offline AI pipeline _(Cloud)_ | **Derived data** | service | DataStorage | db · Generated fields<br>search · Embeddings & indexes |
| Text-to-SQL analytics agent _(Cloud)_ | **Semantic layer** | service | DataFilteringAndProcessing | doc · Curated tables & metrics<br>shield · Row policies & masking<br>eye · Read-only views |
| Fine-tuning and model registry pipeline _(Cloud)_ | **Curation & filtering** | service | DataFilteringAndProcessing | search · Quality & safety filters<br>shield · Sensitive-content removal<br>doc · Provenance capture |
| Fine-tuning and model registry pipeline _(Cloud)_ | **Training corpus** | service | TrainingData | db · Dataset versions |
| Fine-tuning and model registry pipeline _(Cloud)_ | **Training job** | service | ModelTrainingTuning | gear · Tuning run<br>doc · Reproducibility record<br>shield · Write-once output |
| Fine-tuning and model registry pipeline _(Cloud)_ | **Evaluation & red teaming** | service | ModelEvaluation | scale · Capability & safety evals<br>eye · Backdoor probing<br>search · Memorisation testing |
| Internal multi-tenant AI platform _(Cloud)_ | **Shared data plane** | service | DataStorage | search · Shared vector store<br>folder · Memory & state |

## Untrusted content & supply sources (22 blocks)

| Architecture | Block | Kind | CoSAI anchor | Items (icon · label) |
| --- | --- | --- | --- | --- |
| Managed model API consumption _(Cloud)_ | **Context from elsewhere** | external | DataSources | doc · Untrusted content |
| AI gateway, router and guardrail plane _(Cloud)_ | **Content inside prompts** | external | DataSources | doc · Untrusted context |
| Batch and offline AI pipeline _(Cloud)_ | **Downstream consumers** | external | DataStorage | db · Warehouse & BI<br>search · Retrieval indexes<br>folder · Training sets |
| Sandboxed agentic execution service _(Cloud)_ | **Arbitrary internet** | external | — | globe · Collection endpoints |
| Sandboxed agentic execution service _(Cloud)_ | **Repository & web content** | external | DataSources | code · Cloned repositories<br>globe · Web pages & docs |
| Self-hosted open-weights inference _(Cloud)_ | **Public model hub** | external | ModelStorage | db · Published weights |
| Fine-tuning and model registry pipeline _(Cloud)_ | **Training content origins** | external | DataSources | globe · Scraped & purchased sets<br>db · Internal records |
| Fine-tuning and model registry pipeline _(Cloud)_ | **Base model & deps** | external | ModelStorage | model · Base checkpoint<br>code · Frameworks & dependencies |
| Fine-tuning and model registry pipeline _(Cloud)_ | **Serving & consumers** | external | ModelServing | gear · Inference platforms |
| Vendor coding agent _(Endpoint)_ | **Repository content** | external | DataSources | doc · Code & project docs<br>gear · Tool config dotfile |
| Desktop AI assistant _(Endpoint)_ | **Docs & screen content** | external | DataSources | doc · Documents & mail<br>eye · Screenshots |
| Personal autonomous agent _(Endpoint)_ | **Public skill registry** | external | DataSources | db · Community skills |
| Agentic browser and AI extension _(Endpoint)_ | **Open web** | external | DataSources | globe · Arbitrary pages |
| Local MCP and tool plane _(Endpoint)_ | **Repo-supplied config** | external | DataSources | doc · Cloned declarations |
| Local MCP and tool plane _(Endpoint)_ | **Package registry** | external | DataSources | db · Community packages<br>clock · Auto-update channel |
| Local model runtime _(Endpoint)_ | **Public model hub** | external | ModelStorage | db · Open-weights catalogue |
| Enterprise AI chat with connectors _(Saas)_ | **Consumer product** | external | Application | person · Personal accounts |
| Shadow AI services and extensions _(Saas)_ | **Extension distribution** | external | DataSources | — |
| Shadow AI services and extensions _(Saas)_ | **Consumer AI services** | external | Application | — |
| Shadow AI services and extensions _(Saas)_ | **Direct provider APIs** | external | ModelServing | — |
| Vendor low-code agent builder _(Saas)_ | **Attached knowledge** | external | DataSources | folder · Grounding sources |
| Third-party MCP server you consume _(Saas)_ | **Content from elsewhere** | external | DataSources | — |

## Other processing & control blocks (10 blocks)

| Architecture | Block | Kind | CoSAI anchor | Items (icon · label) |
| --- | --- | --- | --- | --- |
| Remote MCP server you publish _(Cloud)_ | **Authorization server** | service | — | key · Token issuance<br>doc · Consent records |
| Managed model API consumption _(Cloud)_ | **Application services** | service | Application | code · Service callers<br>doc · Prompt assembly<br>shield · Output handling |
| Sandboxed agentic execution service _(Cloud)_ | **Task control plane** | service | Application | clock · Task scheduler<br>gear · Environment provisioning |
| Managed agent runtime _(Cloud)_ | **Agent definition & code** | service | AgentSystemInstruction | doc · Declarative definition<br>code · Custom loop code |
| Internal multi-tenant AI platform _(Cloud)_ | **Tenant workloads** | service | Application | agent · Assistants & agents<br>clock · Batch pipelines |
| Agent-facing endpoint _(Cloud)_ | **Mandate verification** | service | — | doc · Mandate check<br>plug · Scheme adapters |
| Agent-facing endpoint _(Cloud)_ | **Transaction processing** | service | Application | gear · Idempotency & reconciliation<br>code · Business logic<br>chat · Response & error text |
| Desktop AI assistant _(Endpoint)_ | **OS permission layer** | service | — | eye · Screen recording grant<br>gear · Input control grant<br>folder · File access grant |
| Shadow AI services and extensions _(Saas)_ | **Browser & extensions** | service | Application | globe · Web sessions<br>plug · Installed extensions |
| Shadow AI services and extensions _(Saas)_ | **Scripts & services** | service | Application | code · Scripts & servers<br>key · Unregistered keys |

## Governance planes (23 blocks)

| Architecture | Block | Kind | CoSAI anchor | Items (icon · label) |
| --- | --- | --- | --- | --- |
| Single agent workflow _(Cloud)_ | **Governance plane** | governance | — | person · Identity provider<br>scale · Action policy<br>eye · Approval threshold<br>doc · Decision audit<br>stop · Kill switch |
| Durable multi-agent workflow _(Cloud)_ | **Governance plane** | governance | — | person · Identity provider<br>gear · Agent & tool registry<br>scale · Evaluation gates<br>eye · Audit sink<br>stop · Kill switch |
| Chat agent with tools _(Cloud)_ | **Governance plane** | governance | — | person · Identity provider<br>gear · Agent & tool registry<br>scale · Evaluation gates<br>eye · Audit sink<br>stop · Kill switch |
| Embedded retrieval assistant _(Cloud)_ | **Governance plane** | governance | — | person · Identity provider<br>scale · Evaluation & red teaming<br>eye · Audit sink<br>gear · AI posture management |
| AI-augmented API backend _(Cloud)_ | **Governance plane** | governance | — | key · Credential broker<br>clock · Quota & cost ceiling<br>scale · Accuracy & adversarial evaluation<br>eye · Prompt & response log |
| Remote MCP server you publish _(Cloud)_ | **Governance plane** | governance | — | scale · Scope catalogue<br>doc · Description review<br>eye · Call audit<br>stop · Revocation & kill |
| Managed model API consumption _(Cloud)_ | **Governance plane** | governance | — | key · Credential broker<br>clock · Quota & spend policy<br>scale · Version registry & evals<br>eye · Usage & prompt log<br>doc · Data-handling terms |
| AI gateway, router and guardrail plane _(Cloud)_ | **Gateway control plane** | governance | — | stop · Egress enforcement<br>key · Provider credentials<br>scale · Budgets & quotas<br>gear · Model catalogue<br>eye · Aggregate telemetry |
| Batch and offline AI pipeline _(Cloud)_ | **Governance plane** | governance | — | key · Pipeline identity<br>stop · Run budget & kill<br>doc · Run & lineage registry<br>scale · Sampling & drift review |
| Text-to-SQL analytics agent _(Cloud)_ | **Governance plane** | governance | — | gear · Semantic-layer curation<br>key · Identity & entitlements<br>eye · Aggregation monitoring<br>scale · Query cost ceiling |
| Sandboxed agentic execution service _(Cloud)_ | **Governance plane** | governance | — | shield · Isolation & egress policy<br>scale · Artifact review<br>eye · Session audit<br>stop · Task termination |
| Realtime voice agent _(Cloud)_ | **Governance plane** | governance | — | key · Out-of-band verification<br>scale · Action limits<br>doc · Retention policy<br>eye · Post-call review<br>stop · Kill switch |
| Self-hosted open-weights inference _(Cloud)_ | **Governance plane** | governance | — | shield · Artifact scanning<br>scale · Evaluation & red teaming<br>eye · Posture & inventory<br>key · Workload identity |
| Managed agent runtime _(Cloud)_ | **Customer governance** | governance | — | key · Agent identities<br>gear · Agent & tool admission<br>shield · Policy & guardrail config<br>scale · Evaluation gates<br>eye · Audit export |
| Fine-tuning and model registry pipeline _(Cloud)_ | **Governance plane** | governance | — | doc · Data & model lineage<br>scale · Promotion authority<br>key · Artifact signing |
| Internal multi-tenant AI platform _(Cloud)_ | **Platform governance** | governance | — | shield · Tenancy & isolation policy<br>gear · Model catalogue<br>search · Inventory & adoption<br>scale · Shared evaluation service<br>eye · Central log & operator access |
| Agent-facing endpoint _(Cloud)_ | **Governance plane** | governance | — | gear · Agent registry<br>scale · Delegation policy<br>person · Dispute & reversal<br>eye · Operator monitoring |
| Enterprise AI chat with connectors _(Saas)_ | **Tenant governance** | governance | — | gear · Tenant policy<br>search · Connector inventory<br>eye · Shadow use discovery<br>doc · Audit & detection |
| Tenant-wide assistant over your corpus _(Saas)_ | **Tenant governance** | governance | — | gear · Tenant policy<br>eye · Exported audit<br>scale · Vendor assurance<br>search · Shadow tenant discovery |
| Shadow AI services and extensions _(Saas)_ | **Discovery & response** | governance | — | search · Discovery correlation<br>doc · AI service inventory<br>scale · Sanctioned alternative<br>eye · Detection & response |
| In-app agent acting on vendor records _(Saas)_ | **Tenant governance** | governance | — | gear · Action catalogue & thresholds<br>key · Agent identity<br>eye · Outcome monitoring<br>stop · Disable control |
| Vendor low-code agent builder _(Saas)_ | **Maker governance** | governance | — | search · Agent inventory<br>scale · Publication gate<br>shield · Connector policy<br>eye · Usage audit |
| Third-party MCP server you consume _(Saas)_ | **Consumption governance** | governance | — | key · IdP-managed admission<br>search · Connection inventory<br>scale · Vendor assurance<br>eye · Call audit |

## Actors (45 blocks)

| Architecture | Block | Kind | CoSAI anchor | Items (icon · label) |
| --- | --- | --- | --- | --- |
| Single agent workflow _(Cloud)_ | **Schedules & events** | actor | — | — |
| Single agent workflow _(Cloud)_ | **Requester** | actor | — | — |
| Durable multi-agent workflow _(Cloud)_ | **Initiator** | actor | — | — |
| Durable multi-agent workflow _(Cloud)_ | **Schedules & events** | actor | — | — |
| Chat agent with tools _(Cloud)_ | **End user** | actor | — | — |
| Embedded retrieval assistant _(Cloud)_ | **End user** | actor | — | — |
| Embedded retrieval assistant _(Cloud)_ | **Content authors** | actor | — | — |
| AI-augmented API backend _(Cloud)_ | **Calling system** | actor | — | — |
| Remote MCP server you publish _(Cloud)_ | **Delegating user** | actor | — | — |
| Remote MCP server you publish _(Cloud)_ | **Calling agent** | actor | — | — |
| Managed model API consumption _(Cloud)_ | **Application users** | actor | — | — |
| Managed model API consumption _(Cloud)_ | **Agents & pipelines** | actor | — | — |
| AI gateway, router and guardrail plane _(Cloud)_ | **AI workloads** | actor | — | — |
| Batch and offline AI pipeline _(Cloud)_ | **Source authors** | actor | — | — |
| Batch and offline AI pipeline _(Cloud)_ | **Schedule** | actor | — | — |
| Text-to-SQL analytics agent _(Cloud)_ | **Analyst** | actor | — | — |
| Text-to-SQL analytics agent _(Cloud)_ | **Upstream authors** | actor | — | — |
| Sandboxed agentic execution service _(Cloud)_ | **Task requester** | actor | — | — |
| Realtime voice agent _(Cloud)_ | **Caller** | actor | — | — |
| Self-hosted open-weights inference _(Cloud)_ | **Consuming applications** | actor | — | — |
| Managed agent runtime _(Cloud)_ | **End user** | actor | — | — |
| Fine-tuning and model registry pipeline _(Cloud)_ | **Labelling workforce** | actor | — | — |
| Internal multi-tenant AI platform _(Cloud)_ | **Product teams** | actor | — | — |
| Agent-facing endpoint _(Cloud)_ | **Delegating customer** | actor | — | — |
| Agent-facing endpoint _(Cloud)_ | **Third-party agent** | actor | — | — |
| Vendor coding agent _(Endpoint)_ | **Developer** | actor | — | — |
| Desktop AI assistant _(Endpoint)_ | **User** | actor | — | — |
| Personal autonomous agent _(Endpoint)_ | **Unsolicited senders** | actor | — | — |
| Personal autonomous agent _(Endpoint)_ | **Owner** | actor | — | — |
| Agentic browser and AI extension _(Endpoint)_ | **User** | actor | — | — |
| Local MCP and tool plane _(Endpoint)_ | **Agent clients** | actor | — | — |
| Local MCP and tool plane _(Endpoint)_ | **Developer** | actor | — | — |
| Local model runtime _(Endpoint)_ | **Unexpected callers** | actor | — | — |
| Local model runtime _(Endpoint)_ | **Local applications** | actor | — | — |
| Enterprise AI chat with connectors _(Saas)_ | **Employee** | actor | — | — |
| Tenant-wide assistant over your corpus _(Saas)_ | **Employee** | actor | — | — |
| Tenant-wide assistant over your corpus _(Saas)_ | **External authors** | actor | — | — |
| Shadow AI services and extensions _(Saas)_ | **Employee** | actor | — | — |
| In-app agent acting on vendor records _(Saas)_ | **Customer** | actor | — | — |
| In-app agent acting on vendor records _(Saas)_ | **Service staff** | actor | — | — |
| In-app agent acting on vendor records _(Saas)_ | **Administrator** | actor | — | — |
| Vendor low-code agent builder _(Saas)_ | **Citizen builder** | actor | — | — |
| Vendor low-code agent builder _(Saas)_ | **Agent consumers** | actor | — | — |
| Third-party MCP server you consume _(Saas)_ | **Agent user** | actor | — | — |
| Third-party MCP server you consume _(Saas)_ | **Other tenants** | actor | — | — |
