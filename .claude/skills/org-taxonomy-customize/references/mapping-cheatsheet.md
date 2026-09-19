# Pick the capability

Map each organization capability to one existing `cap-*` entry in
`data/overlay/capabilities.yaml`. Read the capability's description, the controls it delivers
and the technology categories in its realisation, not just a similar label. Never author
separate organization mappings to technology categories, methods or controls.

| Organization technology or practice | Capability |
| --- | --- |
| Endpoint or gateway DLP, encryption and key management | AI Data Protection (`cap-ai-data-protection`) |
| IdP with SSO/MFA, SCIM provisioning, CASB, credential vault or broker | AI Access Management (`cap-ai-access-management`) |
| AI runtime guardrails, prompt and output filtering | AI Runtime Guardrails (`cap-runtime-guardrails`) |
| AI asset discovery and posture (AI-SPM), model and agent inventory | AI Asset Inventory (`cap-ai-asset-inventory`) |
| Agent tool allowlists, action policy, agent observability | Agent Permissions and Oversight (`cap-agent-governance`) |
| Execution sandbox, secure web gateway, cloud network policy | AI Workload Isolation (`cap-workload-isolation`) |
| SIEM, EDR, incident response | AI Threat Detection and Response (`cap-ai-threat-detection-response`) |
| Vendor risk (TPRM) platform, AI governance register | AI Governance Review (`cap-ai-governance-review`) |
| Evaluation harness, adversarial testing | Model Robustness Assurance (`cap-model-robustness`) |
| Model and artifact signing, dependency scanning | AI Supply Chain Integrity (`cap-ai-supply-chain-integrity`) |

These are candidates, not guarantees of function. One technology category can realise several
capabilities (a SIEM serves detection, an IdP serves access management), so pick the
capability the deployment actually delivers, and add a second org entry when one product
genuinely delivers two. Deployment status belongs to the org capability and surface, and only
on surfaces where the capability applies. A missing capability is a catalogue gap; do not
invent a match. Use `node .claude/skills/org-taxonomy-customize/scripts/cosai-index.mjs` to
inspect the full catalogue and `... tools toolClaudeCode` to list the capabilities a product
may be assessed against.
