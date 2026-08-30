# Full reference-architecture catalog

Every architecture ever drawn in this catalogue — active and disabled. Active entries are the
YAML files in `data/reference/architectures/` and render in the app. Disabled entries are
parked intact under `data/reference/architectures/disabled/`, excluded from the build; each
carries the reason it was parked. Nothing here is deleted — a disabled architecture returns to
the app only by an explicit decision to reactivate it (move the file back up one level and
re-run `npm run data`).

Most of the parked entries fell to one test: *is this a distinct architecture, or an agent
workflow with a different tool set, a single node, or a control drawn as a place?*

## Active — 12

### Endpoint (6)

| Rank | Architecture | id | File |
| --- | --- | --- | --- |
| 1 | Coding and desktop agents (vendored) | `archCodingAgent` | `endpoint-coding-agent.yaml` |
| 2 | Open-source coding & desktop agents | `archOssCodingAgent` | `endpoint-oss-coding-agent.yaml` |
| 3 | Personal autonomous agent | `archPersonalAgent` | `endpoint-personal-agent.yaml` |
| 4 | Local model runtime | `archLocalInference` | `endpoint-local-inference.yaml` |
| 5 | Personal agent — zone map (spike A) | `archPersonalAgentZones` | `endpoint-personal-agent-zones.yaml` |
| 6 | Personal agent — one door (spike B) | `archPersonalAgentHub` | `endpoint-personal-agent-hub.yaml` |

- **Ranks 5 and 6 are a research preview**, not additions to the catalogue proper. They redraw
  the personal autonomous agent in the spike grammar (`data/ONTOLOGY-SPIKE.md`): ownership
  zones as geometry with a build-enforced crossing rule, and nine numbered first-class data
  flows carrying what moves, the threats and the controls. Two variants are published for A/B
  comparison — a fine-grained zone map and a coarse one-door hub. The intent is to keep one,
  retire the other and its ontology document, or promote the grammar over the main one.

- **The vendored/OSS split (2026-08)** replaced a single coding-agent diagram that carried an
  either/or model path. The ontology bans conditional edges: the OSS harnesses differ in
  custody (pasted keys vs session credentials), supply chain (community registries deliver
  the harness itself), remote admission (bearer-secret serve ports, relay tunnels and chat
  bridges vs an owner-bound vendor relay) and the absence of any control plane — four
  graph-level differences, so two architectures. All three agent architectures on this
  surface now draw the standard **Remote device** block on the user's path; its admission
  model degrades across the surface (vendor account → bearer secret / platform identity →
  raw platform identity from an unbounded sender set), which is the endpoint story in one
  comparison.

- **Coding and desktop agents** absorbs the former Desktop AI assistant: same engine, different
  GUI, slightly different tool and sandbox controls. The vendor application is drawn as a
  containment frame around the harness and tool services; sandboxed tools are an item inside
  Tool services; the OS permission layer became the standard permission control on the
  harness→tools edge.
- **Personal autonomous agent** is the sandbox-wrapped harness: local tools only inside the
  boundary (files, shell, skills), the AI gateway as the general-purpose exit to the model
  provider and remote tool services, and a read-only pull from the private package registry as
  the only other opening.
- **Local model runtime** dropped its "Local guardrails" block — guardrails are a control on
  the API→runtime path — and its weights block is now the standard amber **Storage**.

### Cloud & hosted (6)

| Rank | Architecture | id | File |
| --- | --- | --- | --- |
| 1 | Single agent workflow | `archActionAgent` | `cloud-action-agent.yaml` |
| 2 | Durable multi-agent workflow | `archAgentWorkflow` | `cloud-agent-workflow.yaml` |
| 3 | Chat agent with tools | `archChatAgent` | `cloud-chat-agent.yaml` |
| 4 | Remote MCP server | `archRemoteMcpServer` | `cloud-remote-mcp-server.yaml` |
| 5 | Self-hosted open-weights inference | `archSelfHostedInference` | `cloud-self-hosted-inference.yaml` |
| 6 | Fine-tuning and model registry pipeline | `archTrainingPipeline` | `cloud-training-pipeline.yaml` |

- **Self-hosted inference** is the local model runtime with an AI gateway in front (standard
  gateway items) and a governance plane behind; GPU fleet, batch and KV cache are items of the
  Inference runtime; weights live in amber **Storage**, fed by a public hub or a self-trained
  model from the fine-tuning pipeline.

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
