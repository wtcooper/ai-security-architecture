# Mapping cheat-sheet

The requirements nearly every AI security standard contains, and where they usually land. Use
as a starting point, then confirm against the descriptions the index script prints — the
adopter's wording decides.

| Requirement says… | controls | capabilities | risks (control standard: usually none) |
| --- | --- | --- | --- |
| Approved-tooling inventory / register | controlAgentInventoryManagement | capabilityShadowAiDiscovery, capabilityAgentRegistry | riskShadowAndUnknownAgents |
| Vendor / third-party AI assessment | controlProductGovernance | capabilityAiTprm, capabilityVendorAssurance | riskInsecureIntegratedComponent |
| Agents call only approved tools; admin-managed permissions | controlAgentPluginPermissions | capabilityToolPermissionScoping, capabilityMcpToolSecurity | — |
| Agent actions need approval / human in the loop | controlAgentPluginPermissions | capabilityHitlControls, capabilityAgentRuntimeEnforcement | — |
| Agent execution is sandboxed / contained | controlAgentExecutionBounds | capabilityAgentSandboxing | — |
| Network egress from agents is restricted | controlAgentExecutionBounds | capabilityEgressControl, capabilityAiGateway | — |
| No long-lived keys; brokered credentials | controlAgentCredentialIsolation | capabilityCredentialIsolation, capabilitySecretsManagement | — |
| Users authenticate with SSO/MFA; access reviewed | controlApplicationAccessManagement | capabilityIga | — |
| Prompts / uploads inspected for sensitive data (DLP) | controlUserDataManagement | capabilityAiDlp, capabilityPromptRedaction | riskSensitiveDataDisclosure |
| Retrieval respects source permissions | controlModelAndDataAccessControls | capabilityDataAccessGovernance | riskSensitiveDataDisclosure |
| Prompt injection defences | controlInputValidationAndSanitization | capabilityPromptInjectionDefense | riskPromptInjection |
| Output filtering / guardrails | controlOutputValidationAndSanitization | capabilityModelGuardrails, capabilityOutputEncoding | riskInsecureModelOutput |
| AI activity logged to the SIEM | controlAgentObservability, controlThreatDetection | capabilityAuditLogging, capabilityAgentObservability | — |
| Ability to stop / quarantine an agent | controlIncidentResponseManagement | capabilityKillSwitch | riskRogueActions |
| Spend and rate limits on AI use | controlAgentExecutionBounds | capabilityRateLimiting | riskEconomicDenialOfWallet |
| Red-teaming before release | controlRedTeaming | capabilityAiRedTeaming, capabilityModelEvals | — |
| Model / dependency supply chain verified | controlModelAndDataIntegrityManagement | capabilityAiBom, capabilityModelScanning | riskToolSourceProvenance |
| Approval board / policy / training (process only) | — | — | — (leave unmapped; it shows as a gap) |

CoSAI's data controls are named for privacy and consent rather than leakage, which is why DLP
requirements land on `controlUserDataManagement`; say so in the entry description if the
adopter asks why.
