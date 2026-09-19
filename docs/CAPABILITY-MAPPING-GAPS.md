# Technology category mapping gaps

> **Note (2026-09-19).** A capability is a MITRE mitigation or a `cap-*` specialisation of one (`data/overlay/specializations.yaml`) and status is authored only on capabilities, so a mitigation without a technology category is not a status gap; the tables below are historical detail on the category ↔ mitigation crosswalk.

Current catalogue: **25 sourced technology categories**, linked to **38 of 59 MITRE mitigations**.
The 21 mitigations below have no technology category mapping. This is a gap in the repository crosswalk, not a statement that no relevant technology exists. No new categories or forced mappings were added.

Organization records are authored against capabilities (MITRE mitigations or their `cap-*` specialisations), which support CoSAI controls directly; technology categories are the technology dimension of a capability and map to mitigations as sourced detail. The Controls page stays organization-neutral until **Show org data** is on. These gaps do not remove MITRE methods or CoSAI controls from the catalogue.

## Mapping review — 2026-09-18

Four implementation mappings were added to existing categories. These are authored relationships supported by product documentation, not universal requirements of the source taxonomy or claims about deployed organization products. Each mapping includes scope limits and source links in its capability detail.

| Technology category | MITRE mitigation | Implementation evidence and limit |
| --- | --- | --- |
| AI Security Posture Management (AI-SPM) | AI Bill of Materials (AML.M0023) | [Snyk Labs](https://labs.snyk.io/resources/future-aispm/) describes AI discovery producing a BOM of models, datasets, agents and dependencies. Verify inventory completeness, export fields and refresh. |
| AI Security Posture Management (AI-SPM) | Data Inventory (D3-DI) | [Cortex Cloud discovery](https://docs.paloaltonetworks.com/ai-runtime-security/administration/agent-discovery/ai-agent-discovery-with-cortex-cloud) inventories AI datasets. Inventory alone does not establish provenance or sanitization. |
| Access Management | System Configuration Permissions (D3-SCP) | [Azure App Configuration RBAC](https://learn.microsoft.com/en-us/azure/azure-app-configuration/concept-enable-rbac) restricts configuration reads and writes through resource roles. Files outside that access boundary need separate protection. |
| Cloud Workload Protection Platforms (CWPP) | File Integrity Monitoring (D3-FIM) | [Prisma Cloud filesystem monitoring](https://docs.prismacloud.io/en/enterprise-edition/rn/prisma-cloud-release-info/features-introduced-in-2025/features-introduced-in-may-2025) supports configured host paths and runtime policies. File change detection does not establish signature validation or recovery. |

## Remaining mitigation gaps

| Mitigation | Identifier | Related CoSAI controls |
| --- | --- | --- |
| Maintain AI Dataset Provenance | AML.M0025 | Training Data Management; Model and Data Inventory Management |
| Sanitize Training Data | AML.M0007 | Training Data Sanitization; Training Data Management |
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
| Generative AI Guidelines | AML.M0021 | Input Validation and Sanitization; Output Validation and Sanitization |
| Restrict AI Agent Tool Invocation on Untrusted Data | AML.M0030 | Agent Permissions; Agent Execution Bounds |
| Memory Hardening | AML.M0031 | Agent Integrity Management; Retrieval and Vector System Integrity Management |
| Limit AI Service Query Volume and Rate | AML.M0004 | Agent Execution Bounds |
| Limit AI Workload Resource Consumption | AML.M0036 | Agent Execution Bounds |
| Credential Transmission Scoping | D3-CTS | Agent Credential Isolation |
| Token Binding | D3-TB | Agent Credential Isolation; Inter-Component Transport Security |
| System File Analysis | D3-SFA | Threat Detection; Agent Observability |
| Software Update | D3-SU | Vulnerability Management |

## Controls with no capability path

Historical: before the capability layer, 6 of 35 CoSAI controls had no path from any technology category. They are process or governance requirements, and each is now met by process rather than by a pinned capability; do not force technology mappings to hide that distinction.

- Privacy Enhancing Technologies for Model Training (controlModelPrivacyEnhancingTechnologies)
- Training Data Management (controlTrainingDataManagement)
- Training Data Sanitization (controlTrainingDataSanitization)
- User Transparency and Controls (controlUserTransparencyAndControls)
- User Policies and Education (controlUserPoliciesAndEducation)
- Internal Policies and Education (controlInternalPoliciesAndEducation)

Mapping presence describes possible support. It is not proof that a capability implements every function of a broad mitigation, or that a control is fulfilled.
