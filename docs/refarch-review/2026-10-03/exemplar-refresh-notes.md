# Endpoint and cloud exemplar refresh — 2026-10-03

## Selection and scope

Updated only the `exemplars` arrays in all 12 active endpoint/cloud architectures. Each example has a short explanation, an official source and `asOf: "2026-10"`. Examples identify a relevant product mode or implementation building block; inclusion does not claim that a product implements every control in the diagram. No market-share or security endorsement claims were added.

Preferred recognizable provider/project names and existing tooling records. Removed generic shell labels, niche product padding and assertions such as “most popular,” “flagship,” and “most-consumed.” Retained one example for the personal-agent category rather than filling it with adjacent products that have a different hosting model.

## Selections and primary evidence

| Architecture | Selected examples and official evidence | Scope qualification |
| --- | --- | --- |
| Single agent workflow | [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/), [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview), [Microsoft Agent Framework](https://learn.microsoft.com/en-us/agent-framework/overview/) | Frameworks running in an application the organization operates; tools and business authorization are application responsibilities. |
| Multi-agent workflow | [LangGraph](https://docs.langchain.com/oss/python/langgraph/overview), [Microsoft Agent Framework](https://learn.microsoft.com/en-us/agent-framework/overview/), [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) | Orchestration and delegation building blocks. The OpenAI entry explicitly leaves durable workflow infrastructure to the deployment. |
| Chat agent with tools | [Vercel AI SDK](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage), [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) | Customer-built chat applications with tools and approval; excludes finished vendor-hosted support agents from this customer-operated shape. |
| Agent federation | [Google ADK](https://adk.dev/a2a/), [Microsoft Agent Framework](https://learn.microsoft.com/en-us/agent-framework/journey/agent-to-agent), [Atlassian Rovo A2A Gateway](https://www.atlassian.com/platform/rovo-mcp) | ADK's A2A support is marked experimental. SDK integrations implement protocol endpoints; Rovo is an actual vendor-operated remote peer. Authentication and trust agreements remain deployment responsibilities. |
| Remote MCP server | [GitHub MCP server](https://github.com/github/github-mcp-server), [Atlassian Rovo MCP server](https://www.atlassian.com/platform/rovo-mcp), [Cloudflare Workers and Agents SDK](https://developers.cloudflare.com/agents/model-context-protocol/) | GitHub and Atlassian illustrate service publishers; Cloudflare supplies a hosting implementation for tools an organization publishes. |
| Self-hosted inference | [vLLM](https://docs.vllm.ai/en/latest/), [NVIDIA NIM](https://docs.nvidia.com/nim/large-language-models/latest/reference/architecture.html), [KServe](https://kserve.github.io/website/) | NIM means customer-run containers, not NVIDIA's hosted model API. KServe is the Kubernetes serving platform; vLLM is an inference engine. |
| Training and registry | [Hugging Face Transformers](https://huggingface.co/docs/transformers/training), [Hugging Face PEFT](https://huggingface.co/docs/peft/index), [MLflow Model Registry](https://mlflow.org/docs/latest/ml/model-registry/) | Training and registry building blocks on organization-operated compute. No claim that a library is the entire pipeline or that registry versioning supplies approval enforcement. |
| Browser AI | [Claude in Chrome](https://support.claude.com/en/articles/13065128-claude-in-chrome-admin-controls), [Gemini in Chrome](https://gemini.google/overview/gemini-in-chrome/), [Microsoft Copilot in Edge](https://explore.microsoft.com/en-us/edge/copilot) | Gemini auto browse is explicitly qualified as preview with plan/region limits. Copilot in Edge illustrates page/tab context; its note does not promise every action in the reference. |
| First-party coding | [OpenCode](https://opencode.ai/docs/), [Cline](https://docs.cline.bot/cline-overview) | Local, customer-selected-provider modes. These are externally developed open-source harnesses; the existing catalogue's “first-party” title describes operation, not software authorship. |
| Third-party coding | [Claude Code](https://code.claude.com/docs/en/overview), [OpenAI Codex](https://learn.chatgpt.com/docs/codex/cli), [GitHub Copilot](https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/use-copilot-agents/use-agent-mode), [Cursor](https://cursor.com/docs/agent/overview) | Local execution in terminal/editor/desktop, with cloud sessions explicitly outside this example. |
| Personal autonomous agent | [OpenClaw](https://docs.openclaw.ai/concepts/architecture) | Endpoint-hosted personal assistant. Its [official repository](https://github.com/openclaw/openclaw) documents own-device execution and broad messaging integrations; substantial visible project activity supports selecting it without asserting enterprise adoption. |
| Local inference | [Ollama](https://docs.ollama.com/faq), [LM Studio](https://lmstudio.ai/docs/developer/core/server), [llama.cpp server](https://github.com/ggml-org/llama.cpp/tree/master/tools/server) | Ollama uses local models with cloud features disabled. LM Studio and llama.cpp represent GUI-managed and directly operated local serving respectively. |

## Name changes and deliberate exclusions

- Atlassian's official current page calls its service **Rovo MCP server** and separately documents the **A2A Gateway**. Both entries use the published product names and different roles.
- Microsoft's old Copilot Mode URL redirects to **Copilot in Edge**. The example uses that current name and avoids promising unsupported automation details.
- Removed Sierra, Intercom Fin and Decagon from customer-operated cloud patterns: their packaged hosted services introduce a different operational boundary. The replacement frameworks are illustrative implementation choices, not complete secure deployments.
- Removed the protocol and IETF grant draft from federation's example list; they remain standards, not products. ADK, Microsoft and Rovo provide concrete implementation/peer examples.
- Removed Axolotl and SGLang to keep the training/serving examples focused on a small recognizable set. This is an editorial selection, not a judgment of their quality.
- Kept OpenCode and Cline, both already in the tooling catalogue, instead of adding Goose or generic classes. Kept only OpenClaw for personal agents; Hermes and homegrown scripts remain possible implementations without being needed in this concise example list.
- Excluded Dia and Perplexity Comet from the shorter browser list, and did not reintroduce the retired Atlas brand. Copilot's more limited browser-context example is explicitly qualified.
- Kept vLLM on the infrastructure-hosted inference pattern; local inference already has three direct desktop/runtime examples.

## Tooling catalogue follow-up

No tooling records were created or altered. Existing records cover OpenAI/Claude Agents SDKs, Vercel AI SDK, GitHub MCP, vLLM, MLflow, Claude in Chrome, OpenCode, Cline, Claude Code, Codex, GitHub Copilot, Cursor, OpenClaw, Ollama and LM Studio. An existing product record on one architecture does **not** establish control coverage on another.

Previously documented exemplar exclusions in `data/tooling/README.md` cover LangGraph, Microsoft Agent Framework, Atlassian remote MCP, Cloudflare remote MCP hosting, KServe, Hugging Face PEFT, Gemini in Chrome, Copilot Mode in Edge, and llama.cpp. Their names/modes have been refreshed here; this change does not silently onboard them.

Newly concrete examples without matching product records: **Google ADK, Atlassian Rovo A2A Gateway, NVIDIA NIM and Hugging Face Transformers**. Microsoft Agent Framework also now appears in additional architecture modes. These need a deliberate tooling inclusion decision if control-level product coverage is later requested; the exemplar refresh does not require or claim such coverage.

## Verification

All 12 YAML files parse successfully. Every selected example has an official URL and the October 2026 date. A semantic comparison excluding `exemplars` confirms no other architecture fields changed, including diagrams, pins, walkthroughs and guidance. The shared UI/build verification is handled by the parent task.
