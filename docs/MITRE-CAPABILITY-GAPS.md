# MITRE capability profile and CoSAI gaps

> The MITRE catalogue is now the **Mitigations** layer (`data/overlay/mitigations.yaml`, `/mitigations`). This assessment retains its historical filename. Technology-capability source selection is tracked in [the options assessment](TECHNOLOGY-CAPABILITY-TAXONOMIES.md).

Implemented 2026-09-18. **59 canonical MITRE capabilities; no custom capability IDs.**
35 D3FEND defensive techniques from 1.6.0 and 24 ATLAS mitigations from 2026.09.
CoSAI components, risks, controls, personas and existing framework mappings are unchanged.

## What is missing?

31 of 35 CoSAI controls have at least one supporting capability mapping. This is connectivity,
not a completeness or effectiveness score. The four with no mapping are model privacy-enhancing
technologies, user transparency/data controls, user education and internal policy/education.
The last two are deliberately outside a technology catalogue; ATLAS does include the
nontechnical mitigation AML.M0018 User Training.

The clearest technical vocabulary gap is privacy-preserving computation: the inspected pinned
releases do not explicitly name differential privacy, secure aggregation, secure multiparty
computation or homomorphic inference as capabilities. Generic encryption is not an equivalent.
Other gaps are properties or organizational requirements that cannot be inferred from a broad
MITRE function. They stay recorded against CoSAI controls without inventing capability names.

| CoSAI control | Mapping | Remaining requirement |
| --- | --- | --- |
| Privacy Enhancing Technologies for Model Training | unmapped — Encrypt Sensitive Information (`AML.M0012`) | No sufficiently explicit capability for differential privacy, secure aggregation, privacy-preserving federated training, or evaluated anonymization/synthetic-data privacy. Ordinary encryption and access control do not establish these guarantees. |
| Privacy Enhancing Technologies for Inference | partial — Generative AI Guardrails (`AML.M0020`), Encrypt Sensitive Information (`AML.M0012`) | Guardrails cover sensitive-data detection and redaction. Secure multiparty inference, homomorphic computation and privacy-preserving query mechanisms are not explicitly represented. Message/file encryption does not imply encrypted computation. |
| Isolated and Confidential Computing | partial — Hardware-based Process Isolation (`D3-HBPI`), Execution Isolation (`D3-EI`) | Hardware process isolation is represented. Confidential-memory guarantees, workload attestation, measurement-bound key release and side-channel protections require explicit implementation evidence beyond that technique. |
| User Data Management | partial — Generative AI Guardrails (`AML.M0020`), Memory Hardening (`AML.M0031`), Data Inventory (`D3-DI`), Access Mediation (`D3-AMED`) | Guardrails, inventory, access mediation and memory hardening cover constituent functions. End-to-end consent and purpose enforcement, user-data retention/deletion across all stores and provider copies, and proving those commitments remain outside these mappings. ATLAS Memory Hardening does include retention/deletion for agent memory. |
| Training Data Management | partial — Maintain AI Dataset Provenance (`AML.M0025`), Sanitize Training Data (`AML.M0007`) | Dataset provenance and sanitization contribute, but provenance does not establish legal authorization, consent or permitted purpose for training/evaluation data. Data-use approval and provenance interpretation remain explicit implementation and governance requirements. |
| User Transparency and Controls | unmapped | User-facing AI disclosures, consent choices and data-use controls have no sufficiently matching capability in this technical profile. Content filtering, authentication and human approval of agent actions are not substitutes for those experiences. |
| User Policies and Education | unmapped | Policy publication and user education remain people/process obligations. ATLAS AML.M0018 User Training is available as a nontechnical mitigation, but is deliberately excluded from the technology-capability catalogue. |
| Internal Policies and Education | unmapped | Internal policy authoring, publication and employee education remain people/process obligations. ATLAS AML.M0018 User Training is related but is not a technical capability. |
| Product Governance | partial — Validate AI Model (`AML.M0008`), Operational Risk Assessment (`D3-ORA`) | Model validation and operational risk assessment support governance. Ownership, policy approvals, supplier assurance, release authorization and accountable decisions are not implemented merely by deploying those capabilities. |
| Risk Governance | partial — Operational Risk Assessment (`D3-ORA`) | Operational Risk Assessment provides a standardized concept. Residual-risk acceptance, supplier evidence evaluation and ongoing governance workflows still need organizational processes and evidence; a tool does not fulfill them automatically. |
| Agent Observability | partial — AI Telemetry Logging (`AML.M0024`), System File Analysis (`D3-SFA`) | AI telemetry and system-file tampering analysis are represented. Immutable retention, non-repudiation and complete audit-chain guarantees need separate implementation evidence. Observable execution events do not reveal complete internal model reasoning. |
| Model and Data Integrity Management | partial — Code Signing (`AML.M0013`), Verify AI Artifacts (`AML.M0014`), File Integrity Monitoring (`D3-FIM`) | Code/artifact signing, verification and integrity monitoring are represented. Signed-media provenance interoperability (for example C2PA), watermark semantics and authenticity of generated media are not fully specified by these capabilities. Authenticity is not truth. |
| Orchestrator and Route Integrity | partial — System Configuration Permissions (`D3-SCP`), File Integrity Monitoring (`D3-FIM`), Message Authentication (`D3-MAN`) | Configuration permissions and integrity monitoring support route protection. Signed route manifests, binding responses to the chosen model, and end-to-end route/provenance checks must be verified as application-specific implementations. |

## Covered without new names

- **Guardrails:** AML.M0020 explicitly includes injection/jailbreak screening, sensitive-data
  detection/redaction, content policy, grounding, retrieval screening and action checks. These
  are separately verified implementation features, not separate capability identifiers.
- **Retrieval and state:** AML.M0020, AML.M0031, AML.M0033, dataset provenance, access mediation
  and artifact integrity cover constituent defenses. Memory Hardening explicitly includes
  memory retention, deletion and recovery; that is not all enterprise data lifecycle management.
- **Governance support:** D3-ORA Operational Risk Assessment and AML.M0008 Validate AI Model
  contribute to CoSAI governance. They do not replace supplier assurance or accountable approvals.
- **Audit and recovery:** AML.M0024 captures telemetry; D3-SFA detects system-file/log tampering.
  D3-RC/RS/RD restore configuration, software and databases. None alone establishes immutable
  audit storage or safe progressive rollout.

## Source and interpretation limits

The authoritative snapshots and license notices are under [data/mitre](../data/mitre/README.md).
[MITRE D3FEND 1.6.0](https://d3fend.mitre.org/ontologies/d3fend/1.6.0/d3fend.json) and
[ATLAS 2026.09](https://github.com/mitre-atlas/atlas-data/blob/v2026.09/dist/v6/ATLAS-2026.09.yaml)
supply the canonical definitions. This report's CoSAI crosswalk and gap judgments are authored
here. Claims about absence are scoped to those snapshots, not every future MITRE release.
The selection is an application profile, not the entire MITRE catalogue. Specialized predictive
AI, deception and media defenses remain available upstream when relevant to an architecture.

Native upstream entries vary in granularity and overlap (for example guardrails and specific
agent mitigations). The application must not interpret the number of entries as independent
defense coverage. A mitigation can include process work as well as deployable tooling.

## Migration and evidence

All active and disabled architecture sources, enforcement vocabulary, guidance, tooling and
example organization mappings use the new IDs. Historical architecture archives are unchanged.
Split pins retain their requirements and original notes; crowded active flows were reviewed
and requirements moved to enforcing components. The active diagrams have 583 capability pins.
Tool claims with changed scope are unknown pending reassessment; previously enabled posture
becomes inProgress. Original records remain in migration.original; no fresh verification date
is manufactured. Two former IDs have no selected replacement: PET tooling and content
provenance. Five reference records for these were archived, not silently attributed to a weak match.

Legacy capability URLs show all successors or explain retirement. The migration command is
idempotent and preserves retired evidence before removing live references. Forks must review
placement and evidence after running it; automatic ID translation is not security validation.

| Former capability ID | Native destinations |
| --- | --- |
| Data loss prevention for AI interactions (`capabilityAiDlp`) | Generative AI Guardrails (`AML.M0020`) |
| Data security posture management for AI (`capabilityDspm`) | Data Inventory (`D3-DI`) |
| Data access governance for retrieval (`capabilityDataAccessGovernance`) | Access Mediation (`D3-AMED`), Access Policy Administration (`D3-APA`) |
| Sensitive-data detection & redaction in AI I/O (`capabilityPromptRedaction`) | Generative AI Guardrails (`AML.M0020`) |
| Training data provenance & lineage (`capabilityDataProvenance`) | Maintain AI Dataset Provenance (`AML.M0025`) |
| Training data sanitization & poisoning detection (`capabilityDataSanitization`) | Sanitize Training Data (`AML.M0007`) |
| Privacy-enhancing technologies (`capabilityPetTooling`) | Retired; retain requirement under CoSAI gap assessment |
| Retrieval & vector store security (`capabilityRagSecurity`) | Generative AI Guardrails (`AML.M0020`), Input and Output Validation for AI Agent Components (`AML.M0033`) |
| AI security posture management (`capabilityAiSpm`) | Configuration Inventory (`D3-CI`), Asset Vulnerability Enumeration (`D3-AVE`) |
| AI bill of materials & artifact signing (`capabilityAiBom`) | AI Bill of Materials (`AML.M0023`), Code Signing (`AML.M0013`), Verify AI Artifacts (`AML.M0014`) |
| Model artifact scanning & safe deserialization (`capabilityModelScanning`) | File Analysis (`D3-FA`), Restrict Library Loading (`AML.M0011`) |
| Model weight protection (`capabilityModelWeightProtection`) | Control Access to AI Models and Data at Rest (`AML.M0005`) |
| Encryption & key management for AI assets (`capabilityEncryptionKeyManagement`) | Encrypt Sensitive Information (`AML.M0012`) |
| Confidential computing & trusted execution (`capabilityConfidentialComputing`) | Hardware-based Process Isolation (`D3-HBPI`) |
| Agent execution sandboxing (`capabilityAgentSandboxing`) | Execution Isolation (`D3-EI`) |
| AI gateway & tool-call broker (`capabilityAiGateway`) | Access Mediation (`D3-AMED`) |
| Network segmentation & egress control (`capabilityEgressControl`) | Outbound Traffic Filtering (`D3-OTF`), Network Isolation (`D3-NI`) |
| Secure service edge for AI services (`capabilitySse`) | Outbound Traffic Filtering (`D3-OTF`) |
| Non-human & agent identity management (`capabilityNhiManagement`) | Agent Authentication (`D3-AA`), Credential Revocation (`D3-CR`) |
| Secrets management & ephemeral credentials (`capabilitySecretsManagement`) | Credential Hardening (`D3-CH`), Credential Rotation (`D3-CRO`) |
| Inter-component & inter-agent transport security (`capabilityTransportSecurity`) | Message Authentication (`D3-MAN`), Message Encryption (`D3-MENCR`) |
| Secure ML pipeline & development environment (`capabilityMlSecureDefaults`) | Application Configuration Hardening (`D3-ACH`) |
| Staged rollout, versioning & rollback (`capabilityStagedRollout`) | Validate AI Model (`AML.M0008`), Restore Configuration (`D3-RC`), Restore Software (`D3-RS`), Restore Database (`D3-RD`) |
| Prompt injection & jailbreak detection (`capabilityPromptInjectionDefense`) | Generative AI Guardrails (`AML.M0020`) |
| Runtime content & policy guardrails (`capabilityModelGuardrails`) | Generative AI Guardrails (`AML.M0020`) |
| Output encoding & safe rendering (`capabilityOutputEncoding`) | Input and Output Validation for AI Agent Components (`AML.M0033`) |
| Groundedness & output verification (`capabilityGroundednessChecking`) | Generative AI Guardrails (`AML.M0020`) |
| Model hardening & adversarial training (`capabilityModelHardening`) | Predictive AI Model Hardening (`AML.M0003`), Generative AI Model Alignment (`AML.M0022`) |
| System prompt & instruction hierarchy management (`capabilitySystemPromptManagement`) | System Configuration Permissions (`D3-SCP`), Generative AI Guidelines (`AML.M0021`) |
| Content provenance & watermarking (`capabilityContentProvenance`) | Retired; retain requirement under CoSAI gap assessment |
| Agent observability & tracing (`capabilityAgentObservability`) | AI Telemetry Logging (`AML.M0024`) |
| Agent & tool registry (`capabilityAgentRegistry`) | Asset Inventory (`D3-AI`) |
| Tool permission scoping & least agency (`capabilityToolPermissionScoping`) | AI Agent Tools Permissions Configuration (`AML.M0028`) |
| Runtime action authorization (`capabilityAgentRuntimeEnforcement`) | Access Mediation (`D3-AMED`), AI Agent Authority Expansion Controls (`AML.M0037`), Restrict AI Agent Tool Invocation on Untrusted Data (`AML.M0030`), Input and Output Validation for AI Agent Components (`AML.M0033`) |
| Human-in-the-loop approval & escalation (`capabilityHitlControls`) | Human In-the-Loop for AI Agent Actions (`AML.M0029`) |
| Agent memory & context protection (`capabilityMemoryProtection`) | Memory Hardening (`AML.M0031`) |
| Agent behavioural & goal-drift detection (`capabilityBehavioralDriftDetection`) | AI Agent Scope Drift Detection (`AML.M0038`) |
| Rate limiting, quotas & spend controls (`capabilityRateLimiting`) | Limit AI Service Query Volume and Rate (`AML.M0004`), Limit AI Workload Resource Consumption (`AML.M0036`) |
| Agent credential isolation & delegation control (`capabilityCredentialIsolation`) | Credential Transmission Scoping (`D3-CTS`), Token Binding (`D3-TB`) |
| Tool & MCP supply-chain security (`capabilityMcpToolSecurity`) | Verify AI Artifacts (`AML.M0014`), File Integrity Monitoring (`D3-FIM`) |
| Kill switch, quarantine & decommissioning (`capabilityKillSwitch`) | Process Termination (`D3-PT`), Credential Revocation (`D3-CR`) |
| Identity & access management for AI applications (`capabilityIga`) | Multi-factor Authentication (`D3-MFA`), Access Policy Administration (`D3-APA`) |
| AI red teaming (`capabilityAiRedTeaming`) | AI Red Team (`AML.M0035`) |
| Model & agent evaluation harnesses (`capabilityModelEvals`) | Validate AI Model (`AML.M0008`) |
| AI-aware detection & response (`capabilityAiDetectionResponse`) | Resource Access Pattern Analysis (`D3-RAPA`) |
| Audit logging & non-repudiation (`capabilityAuditLogging`) | AI Telemetry Logging (`AML.M0024`), System File Analysis (`D3-SFA`) |
| Endpoint detection & response (`capabilityEdr`) | Process Analysis (`D3-PA`), Process Termination (`D3-PT`) |
| Browser detection & response (`capabilityBrowserDetectionResponse`) | Web Session Activity Analysis (`D3-WSAA`) |
| Application security testing for AI systems (`capabilityAppSecTesting`) | System Vulnerability Assessment (`D3-SYSVA`), Dynamic Analysis (`D3-DA`) |
| AI vulnerability & patch management (`capabilityAiVulnMgmt`) | Asset Vulnerability Enumeration (`D3-AVE`), Software Update (`D3-SU`) |
| SaaS security posture management for AI features (`capabilityVendorAssurance`) | Configuration Inventory (`D3-CI`) |
| AI governance platform (`capabilityAiGovernancePlatform`) | Operational Risk Assessment (`D3-ORA`) |
| Shadow AI discovery (`capabilityShadowAiDiscovery`) | Asset Inventory (`D3-AI`) |
| Third-party risk management platform for AI vendors (`capabilityAiTprm`) | Operational Risk Assessment (`D3-ORA`) |
| Threat modelling tooling for AI systems (`capabilityThreatModeling`) | Operational Risk Assessment (`D3-ORA`) |
| Model registry & documentation generation (`capabilityModelDocumentation`) | Operational Risk Assessment (`D3-ORA`), Asset Inventory (`D3-AI`) |

## Verification

Data validation, source-hash checks, nine capability/migration tests, TypeScript, lint (zero
errors; two pre-existing warnings), the generated audit and the production build passed.
All 571 original tool rows were checked against retained migration evidence at 909
destinations, and all 362 original active capability pins were accounted for. CoSAI source
files are unchanged. Browser verification could not run because no browser connection was
available in this session.

Cross-view follow-up: all 16 architecture export models resolve canonical capability names
and valid chip numbers; all 10 incident replays resolve their migrated architecture and
CoSAI controls; all 27 tool tables resolve the new capability set. A recursive scan of the
compiled dataset found no retired live capability references outside compatibility aliases
and preserved migration evidence. Stale authoring examples and architecture-tab wording were
updated as part of that check.
