# Technology capability mapping gaps

Current catalogue: **26 sourced technology categories**, linked to **34 of 59 MITRE mitigations**.
The 25 mitigations below have no technology category mapping. This is a gap in the repository crosswalk, not a statement that no relevant technology exists. No new categories or forced mappings were added as part of simplifying organization data.

Organization capability → default technology category → mitigation → CoSAI control is now the only organization mapping path. A mitigation without that path displays **No capability mapping**, and cannot acquire organization status from an unrelated capability. These gaps do not remove MITRE methods or CoSAI controls from the catalogue.

| Mitigation | Identifier | Related CoSAI controls |
| --- | --- | --- |
| Data Inventory | D3-DI | Model and Data Inventory Management |
| Maintain AI Dataset Provenance | AML.M0025 | Training Data Management; Model and Data Inventory Management |
| Sanitize Training Data | AML.M0007 | Training Data Sanitization; Training Data Management |
| AI Bill of Materials | AML.M0023 | Model and Data Inventory Management |
| Code Signing | AML.M0013 | Model and Data Integrity Management; Agent Integrity Management |
| Verify AI Artifacts | AML.M0014 | Model and Data Integrity Management; Agent Integrity Management |
| Restrict Library Loading | AML.M0011 | Model and Data Execution Integrity; Secure-by-Default ML Tooling |
| Message Authentication | D3-MAN | Inter-Component Transport Security; Component Identity Provenance |
| Application Configuration Hardening | D3-ACH | Secure-by-Default ML Tooling |
| Restore Configuration | D3-RC | Incident Response Management; Agent Integrity Management |
| Restore Software | D3-RS | Incident Response Management; Model and Data Integrity Management |
| Restore Database | D3-RD | Incident Response Management; Retrieval and Vector System Integrity Management |
| Predictive AI Model Hardening | AML.M0003 | Adversarial Training and Testing |
| Generative AI Model Alignment | AML.M0022 | Adversarial Training and Testing |
| System Configuration Permissions | D3-SCP | Agent Integrity Management; Orchestrator and Route Integrity |
| Generative AI Guidelines | AML.M0021 | Input Validation and Sanitization; Output Validation and Sanitization |
| Restrict AI Agent Tool Invocation on Untrusted Data | AML.M0030 | Agent Permissions; Agent Execution Bounds |
| Memory Hardening | AML.M0031 | Agent Integrity Management; Retrieval and Vector System Integrity Management |
| Limit AI Service Query Volume and Rate | AML.M0004 | Agent Execution Bounds |
| Limit AI Workload Resource Consumption | AML.M0036 | Agent Execution Bounds |
| Credential Transmission Scoping | D3-CTS | Agent Credential Isolation |
| Token Binding | D3-TB | Agent Credential Isolation; Inter-Component Transport Security |
| File Integrity Monitoring | D3-FIM | Agent Integrity Management; Model and Data Integrity Management; Orchestrator and Route Integrity |
| System File Analysis | D3-SFA | Threat Detection; Agent Observability |
| Software Update | D3-SU | Vulnerability Management |

## Controls with no capability path

9 of 35 CoSAI controls currently have no path from any default technology capability. Some are process or governance requirements; do not force technology mappings to hide those distinctions.

- Privacy Enhancing Technologies for Model Training (controlModelPrivacyEnhancingTechnologies)
- Training Data Management (controlTrainingDataManagement)
- Training Data Sanitization (controlTrainingDataSanitization)
- Model and Data Integrity Management (controlModelAndDataIntegrityManagement)
- User Transparency and Controls (controlUserTransparencyAndControls)
- User Policies and Education (controlUserPoliciesAndEducation)
- Internal Policies and Education (controlInternalPoliciesAndEducation)
- Orchestrator and Route Integrity (controlOrchestratorAndRouteIntegrity)
- Agent Integrity Management (controlAgentIntegrityManagement)

Mapping presence describes possible support. It is not proof that a capability implements every function of a broad mitigation, or that a control is fulfilled.
