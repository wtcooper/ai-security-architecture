# Full reference-architecture catalog

Every architecture ever drawn in this catalogue — active and disabled. Active entries are the
YAML files in `data/reference/architectures/` and render in the app. Disabled entries are
parked intact under `data/reference/architectures/disabled/`, excluded from the build; each
carries the reason it was parked. Nothing here is deleted — a disabled architecture returns to
the app only by an explicit decision to reactivate it (move the file back up one level and
re-run `npm run data`).

Most of the parked entries fell to one test: *is this a distinct architecture, or an agent
workflow with a different tool set, a single node, or a control drawn as a place?*

## Active — 13

### Endpoint (4)

| Rank | Architecture | id | File |
| --- | --- | --- | --- |
| 1 | Third-party coding & desktop agents | `archCodingAgentThirdParty` | `endpoint-coding-agent-third-party.yaml` |
| 2 | First-party coding & desktop agents | `archCodingAgentFirstParty` | `endpoint-coding-agent-first-party.yaml` |
| 3 | Personal autonomous agent | `archPersonalAgent` | `endpoint-personal-agent.yaml` |
| 4 | Local model runtime | `archLocalInference` | `endpoint-local-inference.yaml` |

- **All four are on the zone grammar** (`data/ONTOLOGY.md` §4a and §4b): ownership bands as
  full-height columns with a build-enforced crossing rule, numbered first-class data flows
  carrying what moves and the threats and controls that ride them, and five standalone
  governance call-outs across the bottom band. The two `-zones` research-preview files that
  proved the grammar have been folded into their originals and no longer exist.

- **First-party vs third-party (2026-08)** renamed what had been the OSS/vendored split, and
  the names now say what actually differs: who supplies the harness. The first-party drawing is
  the third-party drawing with the vendor band deleted, deliberately identical everywhere else
  so that the missing column is the only thing a reader comparing them sees — and in its place
  sits the private package registry, because in that archetype the supply chain delivers the
  agent itself.

  It replaced a single diagram that carried an either/or model path, which the ontology bans:
  the two differ in custody, supply chain, remote admission and the absence of any control
  plane — four graph-level differences, so two architectures. All three agent architectures on
  this surface draw the standard **Remote device** block on the user's path, and its admission
  model degrades across them (vendor account → bearer secret or platform identity → raw
  platform identity from an unbounded sender set), which is the endpoint story in one
  comparison.

- **Third-party coding & desktop agents** absorbs the former Desktop AI assistant: same engine,
  different GUI. The vendor band carries its control plane; sandboxed tools are an item inside
  Tool services; the OS permission layer is the standard permission control on the
  harness→tools edge.
- **First-party coding & desktop agents** is that drawing with the vendor band deleted, and
  the private package registry standing where the vendor column was — in this archetype the
  supply chain delivers the agent itself.
- **Personal autonomous agent** is the always-on harness: local tools on the managed endpoint,
  the AI gateway as the general-purpose exit, and the messaging leg — bridges, relay, platform
  and an unbounded sender set — that no other endpoint architecture has.
- **Local model runtime** is the crossing rule's smallest demonstration: the loopback API is a
  registered crossing because it is the endpoint's admission surface, and the weight fetch
  goes through the egress tier.

### Cloud & hosted (6)

| Rank | Architecture | id | File |
| --- | --- | --- | --- |
| 1 | Single agent workflow | `archActionAgent` | `cloud-action-agent.yaml` |
| 2 | Durable multi-agent workflow | `archAgentWorkflow` | `cloud-agent-workflow.yaml` |
| 3 | Chat agent with tools | `archChatAgent` | `cloud-chat-agent.yaml` |
| 4 | Remote MCP server | `archRemoteMcpServer` | `cloud-remote-mcp-server.yaml` |
| 5 | Self-hosted open-weights inference | `archSelfHostedInference` | `cloud-self-hosted-inference.yaml` |
| 6 | Fine-tuning and model registry pipeline | `archTrainingPipeline` | `cloud-training-pipeline.yaml` |

- **All six are on the zone grammar.** The three agent architectures — single, chat and
  multi-agent — are deliberately one drawing three times, differing only in their trigger and
  their fan-out. The other three each stress the grammar somewhere different: the MCP server
  inverts the band mapping because it is drawn from the publisher's chair, the training
  pipeline draws external on the left because it is an ingest pipeline, and self-hosted
  inference is the local model runtime with an AI gateway in front of it.

### Third-party SaaS (3)

| Rank | Architecture | id | File |
| --- | --- | --- | --- |
| 1 | Enterprise AI chat with connectors | `archEnterpriseAiChat` | `saas-enterprise-ai-chat.yaml` |
| 2 | UI/low-code managed agent runtime | `archLowCodeAgentBuilder` | `saas-low-code-agent-builder.yaml` |
| 3 | API/SDK managed agent runtime | `archManagedAgentRuntime` | `saas-managed-agent-runtime.yaml` |

- The managed agent runtime moved from Cloud & hosted to SaaS — it is a vendor-operated
  runtime the customer configures — and split by author surface: **UI/low-code** (builder UIs:
  Copilot Studio / Foundry class) vs **API/SDK** (Anthropic managed agents, hosted background
  coding agents, hyperscaler SDK runtimes).

- **This is where the vendor band earns its keep**, and where ONTOLOGY §3's three-zone rule
  stops being prose and becomes geometry: zone 1 is inside the vendor block and never drawn,
  zone 2 is the pins on it, zone 3 is the band boundary where our own gateway sits. Enterprise
  AI chat is the only architecture using all five bands — and its sharpest control, that the
  same client with a personal login is the consumer product carrying none of the enterprise
  terms, is now a visible band crossing rather than a sentence in a note.

## Disabled — 17

Parked under `data/reference/architectures/disabled/`, with the reason recorded here.

### Endpoint

| Architecture | id | Reason |
| --- | --- | --- |
| Desktop AI assistant | `archDesktopAssistant` | Merged into **Coding and desktop agents** — same engine, different GUI shell; the differences are items and controls, not architecture. Its guidance items were merged into the coding-agent guidance doc. |
| Agentic browser & AI extension | `archAgenticBrowser` | An agent with a browser tool set — a tool-calling use case, not a distinct architecture. |
| Local MCP / tool plane | `archLocalToolPlane` | The tool plane is a component of the agent architectures (Tool services), not an architecture of its own. Its incident (MCP supply chain) replays on the coding and desktop agents. |

### Cloud & hosted

| Architecture | id | Reason |
| --- | --- | --- |
| Embedded retrieval assistant | `archRagAssistant` | RAG is a tool/retrieval pattern inside other architectures (Vectorstore in Downstream services), not a standalone one. |
| AI-augmented API backend | `archAiApiBackend` | A service with a model call inside — an application pattern, not an agent architecture. |
| Agent-facing endpoint | `archAgentFacingApi` | The callee side of A2A/agentic-commerce appears as "A2A peer agents" inside Tool services. |
| Batch / offline AI pipeline | `archBatchPipeline` | A single- or multi-agent workflow that runs offline, possibly on open weights — covered by those architectures. |
| AI gateway, router & guardrail plane | `archAiGateway` | It is a node — the standard **AI gateway** block on every architecture — not an architecture. |
| Sandboxed agentic execution service | `archSandboxedExecution` | A sandbox around a single- or multi-agent workflow; containment is now drawn as a frame on the workflow architectures. Its incidents (OpenAI–Hugging Face, evaluation containment) replay on the single agent workflow. |
| Realtime voice agent | `archVoiceAgent` | An agent with a different I/O tool set (speech), not a distinct architecture. |
| Text-to-SQL / analytics agent | `archAnalyticsAgent` | Text-to-SQL is a tool. |
| Managed model API consumption | `archManagedModelApi` | Consuming a hosted model API is an edge on every architecture (the Model provider block), not an architecture. |
| Internal multi-tenant AI platform | `archInternalPlatform` | A paved-road program over the other architectures rather than an architecture itself. |
| Managed agent runtime (cloud placement) | — | Not parked — moved to SaaS as **API/SDK managed agent runtime** (`saas-managed-agent-runtime.yaml`). |

### Third-party SaaS

| Architecture | id | Reason |
| --- | --- | --- |
| Tenant-wide assistant over your corpus | `archTenantAssistant` | Part of **Enterprise AI chat with connectors** (Copilot-class); may return later if the corpus-grounded variant earns its own drawing. Its incident (prompt-injection lineage) replays there. |
| In-app agent acting on vendor records | `archVendorActionAgent` | A vendor's tool-calling agent on vendor data — a tool-calling use case in the vendor's tenant. |
| Third-party MCP server / connector | `archThirdPartyMcp` | It is a tool — admitted into Tool services — not an architecture. |
| Shadow AI SaaS & browser extensions | `archShadowAi` | A governance condition rather than an architecture; its incident (identity & shadow AI) replays on Enterprise AI chat. |
