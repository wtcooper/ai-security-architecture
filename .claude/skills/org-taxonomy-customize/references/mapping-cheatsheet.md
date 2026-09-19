# Pick the capability

Map each organization capability to one existing id: a MITRE mitigation in
`data/overlay/mitigations.yaml` or a `cap-*` specialisation in
`data/overlay/specializations.yaml`. Read the capability's definition and implementation
scope, the controls it supports and the technology categories that realise it, not just a
similar label. Where a specialisation exists for what is deployed, use it rather than the
parent. Never author separate organization mappings to technology categories or controls.

| Organization technology or practice | Capability |
| --- | --- |
| Endpoint or gateway DLP, prompt and upload redaction | Sensitive Data Detection and Redaction (`cap-sensitive-data-redaction`, under `AML.M0020`) |
| Prompt-attack and jailbreak classifiers, harm-category filters, denied topics, policy classifiers | Generative AI Guardrails (`AML.M0020`) — input and output classification stay in the parent |
| RAG source trust scoring, grounding and tool-call validation | Retrieval Trust and Grounding Checks (`cap-retrieval-grounding-checks`, under `AML.M0020`) |
| IdP with SSO and phishing-resistant MFA | Multi-factor Authentication (`D3-MFA`) |
| Policy engine over agent tool calls, tool allowlists with escalation | Agent Action Policy Enforcement (`cap-agent-action-policy-enforcement`, under `D3-AMED`) |
| Identity-scoped retrieval, oversharing analysis | Data Access Governance for Retrieval (`cap-data-access-governance`, under `D3-AMED`) |
| Secure web gateway, egress proxy, workload network segmentation | Agent Egress Control (`cap-agent-egress-control`, under `D3-OTF`) |
| Agent and MCP server registry | Agent and Tool Registry (`cap-agent-tool-registry`, under `D3-AI`) |
| CASB or network discovery of unsanctioned AI, endpoint agent inventory | Shadow AI Discovery (`cap-shadow-ai-discovery`, under `D3-AI`) |
| Vendor risk (TPRM) platform with AI questionnaires | AI Vendor Risk Assessment (`cap-ai-vendor-assessment`, under `D3-ORA`) |
| Threat modelling practice or platform | AI System Threat Modelling (`cap-ai-threat-modeling`, under `D3-ORA`) |
| Model registry, model cards | Model Registry and Documentation (`cap-model-documentation`, under `D3-ORA`) |
| Agent tracing and observability | Agent Execution Tracing (`cap-agent-tracing`, under `AML.M0024`) |
| MCP tool definition scanning, hash pinning, server allow-lists | Tool and MCP Server Integrity (`cap-mcp-tool-integrity`, under `AML.M0014`) |
| Agent kill switch, credential revocation on trigger | Agent Kill Switch and Quarantine (`cap-agent-kill-switch`, under `D3-PT`) |
| Canary release, graduated autonomy, automated rollback | Staged Rollout and Rollback Gate (`cap-staged-rollout-gate`, under `AML.M0008`) |
| Terminal, HTML or SQL output encoding for agent output | Output Encoding and Safe Rendering (`cap-output-encoding`, under `AML.M0033`) |
| Model and agent evaluation harness | Validate AI Model (`AML.M0008`) |
| Adversarial testing programme | AI Red Team (`AML.M0035`) |
| Model and artifact signing | Code Signing (`AML.M0013`) |
| AI bill of materials, dependency inventory | AI Bill of Materials (`AML.M0023`) |
| Encryption and key management for AI assets, BYOK/CMEK | Encrypt Sensitive Information (`AML.M0012`) |
| Rate limiting, quotas, spend controls | Limit AI Service Query Volume and Rate (`AML.M0004`) |
| Per-tool permission grants, OS permission layer | AI Agent Tools Permissions Configuration (`AML.M0028`) |
| Execution sandbox for agent tools | Execution Isolation (`D3-EI`) |
| Human approval of agent actions | Human In-the-Loop for AI Agent Actions (`AML.M0029`) |

These are candidates, not guarantees of function. One product can deliver several capabilities
(a secure web gateway serves egress control and can host DLP inspection), so pick the
capability the deployment actually delivers, and add a second org entry when one product
genuinely delivers two. A specialisation is a distinct enforcement point, never one technology
split by risk type: a guardrail product that classifies inputs and outputs is `AML.M0020`
itself, while a DLP point is `cap-sensitive-data-redaction`. A record on a specialisation rolls
up to its MITRE parent. Deployment status belongs to the org
capability and surface, and only on surfaces where the capability applies. A missing capability
is a catalogue gap; do not invent a match. Use
`node .claude/skills/org-taxonomy-customize/scripts/cosai-index.mjs` to inspect the full
catalogue and `... tools toolClaudeCode` to list the capabilities a product may be assessed
against.
