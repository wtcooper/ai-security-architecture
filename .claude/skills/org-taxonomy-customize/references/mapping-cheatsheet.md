# Pick the technology category

Map each organization capability to one existing default in
`data/overlay/technology-capabilities.yaml`. Use the scope and mapping rationales, not just a
similar label. Never author separate organization mappings to methods or controls.

| Organization technology | Default capability |
| --- | --- |
| Endpoint or gateway DLP | Data Loss Prevention (`tech-dlp`) |
| Cloud access security broker | CASB (`tech-casb`) |
| AI runtime guardrails | LLM Guardrails (`tech-llm-guardrails`) |
| AI asset discovery and posture | AI-SPM (`tech-ai-spm`) |
| Agent action and identity security | Agentic AI App Security (`tech-agentic-security`) |
| Credential vault or broker | PAM (`tech-pam`) |
| Execution sandbox | Sandboxing (`tech-sandbox`) |
| Security event collection/correlation | SIEM (`tech-siem`) |

These are candidates, not guarantees of function. Deployment status belongs to the org
capability and context. A missing default category is a taxonomy gap; do not invent a match.
Use `node .claude/skills/org-taxonomy-customize/scripts/cosai-index.mjs` to inspect the full
catalogue and `... tools toolClaudeCode` to inspect the product's candidate categories.
