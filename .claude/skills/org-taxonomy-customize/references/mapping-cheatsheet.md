# Mapping cheat-sheet

The requirements nearly every AI security standard contains, and where they usually land. Use
as a starting point, then confirm against the descriptions the index script prints — the
adopter's wording decides. Mitigation IDs are native MITRE D3FEND/ATLAS identifiers.
These are candidate supporting functions, not equivalent bundles: verify each definition
and implementation boundary. In particular, AML.M0020 is broad guardrails; a DLP or
injection-screening feature alone provides partial evidence. See docs/MITRE-CAPABILITY-GAPS.md.

| Requirement says… | controls | mitigations | risks (control standard: usually none) |
| --- | --- | --- | --- |
| Approved-tooling inventory / register | controlAgentInventoryManagement | D3-AI | riskShadowAndUnknownAgents |
| Vendor / third-party AI assessment | controlProductGovernance | D3-ORA, D3-CI | riskInsecureIntegratedComponent |
| Agents call only approved tools; admin-managed permissions | controlAgentPluginPermissions | AML.M0028, AML.M0014, D3-FIM | — |
| Agent actions need approval / human in the loop | controlAgentPluginPermissions | AML.M0029, D3-AMED, AML.M0037, AML.M0030, AML.M0033 | — |
| Agent execution is sandboxed / contained | controlAgentExecutionBounds | D3-EI | — |
| Network egress from agents is restricted | controlAgentExecutionBounds | D3-OTF, D3-NI, D3-AMED | — |
| No long-lived keys; brokered credentials | controlAgentCredentialIsolation | D3-CTS, D3-TB, D3-CH, D3-CRO | — |
| Users authenticate with SSO/MFA; access reviewed | controlApplicationAccessManagement | D3-MFA, D3-APA | — |
| Prompts / uploads inspected for sensitive data (DLP) | controlUserDataManagement | AML.M0020 | riskSensitiveDataDisclosure |
| Retrieval respects source permissions | controlModelAndDataAccessControls | D3-AMED, D3-APA | riskSensitiveDataDisclosure |
| Prompt injection defences | controlInputValidationAndSanitization | AML.M0020 | riskPromptInjection |
| Output filtering / guardrails | controlOutputValidationAndSanitization | AML.M0020, AML.M0033 | riskInsecureModelOutput |
| AI activity logged to the SIEM | controlAgentObservability, controlThreatDetection | AML.M0024, D3-SFA | — |
| Ability to stop / quarantine an agent | controlIncidentResponseManagement | D3-PT, D3-CR | riskRogueActions |
| Spend and rate limits on AI use | controlAgentExecutionBounds | AML.M0004, AML.M0036 | riskEconomicDenialOfWallet |
| Red-teaming before release | controlRedTeaming | AML.M0035, AML.M0008 | — |
| Model / dependency supply chain verified | controlModelAndDataIntegrityManagement | AML.M0023, AML.M0013, AML.M0014, D3-FA, AML.M0011 | riskToolSourceProvenance |
| Approval board / policy / training (process only) | — | — | — (leave unmapped; it shows as a gap) |

CoSAI's data controls are named for privacy and consent rather than leakage, which is why DLP
requirements land on `controlUserDataManagement`; say so in the entry description if the
adopter asks why.
