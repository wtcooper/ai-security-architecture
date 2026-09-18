# Independent capability taxonomy assessment

Assessment date: 2026-09-18. Historical research recommendation.

Implementation decision: the user selected a MITRE-only catalogue with **no local capability IDs**. See [the implemented profile and gaps](MITRE-CAPABILITY-GAPS.md); the integration-profile recommendation below records the original assessment, not the final schema.

**Recommendation: retain CoSAI for components, risks, controls, and personas; adopt MITRE D3FEND as the primary vocabulary for technical defensive functions, supplemented by the technical mitigations in MITRE ATLAS for AI-specific functions. Keep a small, explicitly authored integration profile.** Use OWASP AISVS as the verification reference. Keep product categories and delivery mechanisms as a separate view over those functions.

There is no complete, direct replacement among the sources examined that preserves all 56 current entries at their current level of abstraction. D3FEND is the closest match to the *kind of thing* this layer should describe. ATLAS supplies useful AI-specific names and identifiers, but its mitigations also include organizational practices. Neither should be presented as a complete, normative standard for AI security capabilities. The integration and CoSAI crosswalk would remain this repository's work.

The existing catalogue has substantial functional breadth. Its main weakness is inconsistent granularity, followed by optimistic mapping semantics and overgeneralized applicability. Reducing the visible number of entries without fixing those problems would mostly hide them.

## Scope and method

Reviewed every capability's description, examples, mappings, sources, and surface notes in [capabilities.yaml](../data/overlay/capabilities.yaml), alongside the CoSAI controls, provenance record, capability types, build validation, and architecture ontology. Independently compared candidate vocabularies and implementation guidance from MITRE, OWASP, NIST, CSA, national cybersecurity agencies, standards projects, and cloud providers. Recommendations below are analytical judgments, not upstream-endorsed mappings.

Local baseline: commit `1347179a0c7067912d7b1acdb5049773e2fd05c0`; capability file SHA-256 `2a2c7dde3a7d2db370e83815c850ead88d4f036368338cdc1a9fac520a9d4bb4`.

| Measured property | Result |
| --- | ---: |
| Capability records | 56 |
| Capability → control edges | 169 |
| Capability → risk edges | 173 |
| Capability → component edges | 168 |
| CoSAI controls with at least one incoming capability edge | 35 / 35 |
| CoSAI risks with at least one incoming capability edge | 36 / 36 |
| Distinct cited URLs across the capabilities | 33 |
| Capabilities marked applicable on all three surfaces | 36 |
| Active architecture YAML files / capability pins | 16 / 362 |

These are connectivity counts, not evidence of effective protection. The current validator checks referential integrity, category membership, and surface completeness; it does not validate whether a tool actually implements the mapped control. The README's architecture count is not the current file count; this assessment uses the files.

This is a taxonomy and mapping-quality assessment, not a test of deployed tools or a complete recertification of all 510 control/risk/component edges. All 56 entries receive a disposition below; the most consequential mapping defects receive specific findings.

## Which external vocabulary fits?

| Candidate | What can be adopted directly | Fit and limitation | Recommended role |
| --- | --- | --- | --- |
| **MITRE D3FEND 1.6.0** | Versioned technique identifiers, canonical names, definitions, hierarchy, artifact relationships; JSON-LD, OWL, TTL and CSV | Explicitly describes cybersecurity technology functionality. Strong for inventory, authentication, access mediation, isolation, encryption, detection, eviction and restoration. Insufficient AI-specific granularity and limited coverage of governance tooling. | **Primary technical vocabulary.** Import upstream records intact and select relevant functions. |
| **MITRE ATLAS 2026.09** | AI mitigation IDs, definitions, categories, lifecycle and threat relationships | More directly describes AI defenses, including state protection and agent authority. Mixed abstraction: technical mechanisms, broad mitigation bundles, deployment choices and people/process practices. | **AI-specific supplement.** Select technical mitigations and preserve their upstream entity type. |
| **OWASP AISVS 1.0** | Versioned verification requirements; Appendix B groups defenses into 19 families | Strongest implementation/acceptance reference examined. Appendix B is explicitly non-normative and reorganizes requirements; its families overlap conceptually and are not an atomic technology ontology. | **Verification and gap checks.** Best alternative organizing view if a single AI-focused family list is preferred. |
| **OWASP AI Exchange** | Open threats/controls guidance and deep links | Broad treatment of predictive, generative and agentic AI; useful security semantics. Includes organizational controls and discussions rather than just deployable functions. | Definitions and scope review, especially beyond LLMs. |
| **OWASP AI Security Solutions Landscape, Q2 2026** | Lifecycle stages, SecOps tasks, solution references | Closest to a buying/building guide. Mixes lifecycle tasks and products; the examined resources do not provide an equivalent to D3FEND's formal, versioned defensive ontology. | Market and implementation view. |
| **CSA AICM v1.1** | 247 control objectives across 18 domains; responsibility/applicability dimensions | Comprehensive controls framework, including cloud and organizational obligations. Adopting it as capabilities would introduce another control layer beside CoSAI. | Completeness and shared-responsibility checks. |
| **NIST AI 100-2e2025** | Adversarial-ML terminology, attack hierarchy, mitigation discussions | Particularly useful for predictive-model evasion, privacy and extraction. Not a deployable technology catalogue. | Threat/defense terminology and specialized profiles. |
| **NIST SP 800-218A; AI RMF** | Development practices and risk-management outcomes | Useful requirements sources; not technology capability identifiers. | Assurance references. |
| **Gartner AI TRiSM; CSA market maps** | Market vocabulary and product groupings | Useful for procurement, but product boundaries change and overlap. Gartner's public material is not an openly vendorable capability ontology. | Aliases and product-category view; not canonical IDs. |
| **Cyber Defense Matrix** | Functional/asset dimensions for displaying security coverage | Useful simplification of the view; not a detailed AI capability catalogue. | Optional visualization lens. |
| **OWASP Agent Control Standard (ACS)** | Agent interception, policy and audit interoperability contracts | Newly incorporated into OWASP GenAI; scoped to agent runtime control. It cannot cover data, training, model supply chain, or enterprise assurance as a whole. | Implementation reference for runtime enforcement. |
| **OASIS OpenC2** | Standardized commands and actuator profiles for operating defenses | Standardizes communication with defensive technologies, not the complete inventory of their functions. | Possible response integration; not the taxonomy foundation. |

Sources: [D3FEND purpose and limitations](https://d3fend.mitre.org/faq/), [versioned ontology distributions](https://d3fend.mitre.org/resources/ontology/), [ATLAS release history](https://github.com/mitre-atlas/atlas-data/blob/main/CHANGELOG.md), [AISVS](https://owasp.github.io/www-project-artificial-intelligence-security-verification-standard-aisvs-docs/), [AISVS defense inventory](https://github.com/OWASP/AISVS/blob/main/1.0/en/0x91-Appendix-B_AI_Security_Controls_Inventory.md), [AI Exchange](https://owaspai.org/docs/ai_security_overview/), [OWASP Solutions initiative](https://genai.owasp.org/initiatives/ai-security-solutions/), [CSA AICM](https://cloudsecurityalliance.org/artifacts/ai-controls-matrix-v1-1), [NIST AML taxonomy](https://csrc.nist.gov/pubs/ai/100/2/e2025/final), [SSDF AI profile](https://csrc.nist.gov/pubs/sp/800/218/a/final), [Gartner public TRiSM explanation](https://www.gartner.com/en/articles/ai-governance-trism), [Cyber Defense Matrix](https://cyberdefensematrix.com/), [ACS](https://genai.owasp.org/resource/agent-control-standard-acs/), [OpenC2](https://openc2.org/index.html).

### What “use the standard directly” should mean here

Use an upstream identifier and definition directly **only for an entity that has that meaning**. A local bundle with a D3FEND link is still a local bundle. Preserve the distinction between an upstream record, our selection of it, an AI-specific specialization, and our mapping to CoSAI.

Do not translate the whole catalogue into generic MITRE terms just to achieve a high mapping percentage. For example, D3FEND `D3-CF` describes sanitizing file content. It is not an exact synonym for LLM content moderation, prompt-injection detection, or agent action authorization. D3FEND's inclusion of ATLAS offensive techniques also does not establish that every AI defense has a corresponding D3FEND technique. [D3FEND content-filtering definition](https://d3fend.mitre.org/technique/d3f:ContentFiltering/), [example ATLAS technique with no inferred defensive relationships](https://d3fend.mitre.org/offensive-technique/attack/AML.T0051.002/).

A strict single-source option is possible only with a scope change:

- **D3FEND only:** accept missing AI-specific distinctions and move unsupported entries outside the canonical vocabulary.
- **ATLAS only:** change the tab into a mitigation catalogue and accept people/process entries and broad bundles.
- **AISVS Appendix B only:** change the tab into an AI defense-family/requirements view, with conventional security and governance shown separately.

For this application's existing architecture and tooling use cases, the D3FEND + ATLAS profile preserves more useful meaning with less invented terminology. That is a recommendation, not a claim that the two sources form an official joint taxonomy.

## Resolve the guardrails question by function

**“Guardrails” is an umbrella. Input/output is a placement dimension. Neither should define mutually exclusive leaf capabilities.** The current `capabilityModelGuardrails` already says it filters both inputs and outputs; it is not an output-only counterpart to injection defense.

The current ATLAS mitigation `AML.M0020` explicitly encompasses content screening, injection checks, sensitive-data handling, grounding checks, structured validation, and tool/action checks. Use that as a parent or reference bundle, not an additional scored defense beside all its children. [ATLAS 2026.09 source](https://github.com/mitre-atlas/atlas-data/blob/main/dist/v6/ATLAS-2026.09.yaml).

| Function to assess independently | Question it answers | Existing records / proposed treatment |
| --- | --- | --- |
| Instruction-attack screening | Is untrusted material trying to redirect the model or bypass its behavioral constraints? | Retain injection/jailbreak screening; distinguish those attack types in tests. |
| Content-policy screening | Is the content disallowed by the application's content policy? | Narrow `capabilityModelGuardrails` to this function. |
| Sensitive-data inspection and response | Is disclosure allowed, and should sensitive material be blocked or transformed? | One DLP family, with separately assessable detection/blocking and redaction/tokenization functions. |
| Structural validation and safe consumption | Does content meet its contract, and can its consumer handle it without executing unintended commands? | Explicit schema/type/size validation; retain context-aware output encoding. |
| Evidence and task-consistency verification | Does a claim have supporting evidence; does the proposed action fit the task? | Separate grounding checks from action-policy enforcement. Grounding is not authorization. |
| Action authorization | May this principal execute this operation on this resource with these arguments now? | Combine permission-policy administration and runtime enforcement into one family with two assessable stages. Keep approval as a distinct gate. |

One platform can implement several functions. That is implementation consolidation, not evidence that the functions are duplicates. Conversely, buying an AI gateway does not establish that any of its optional defenses are configured.

This distinction matches actual provider packaging: Amazon Bedrock groups several independent policies under Guardrails; Google Model Armor separately screens attacks, sensitive data, unsafe content and URLs; Microsoft distinguishes user-prompt and document attacks. Those product boundaries are evidence of implementability, not canonical taxonomy boundaries. [Bedrock policies](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html), [Model Armor](https://docs.cloud.google.com/model-armor/overview), [Prompt Shields](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection).

Record the actual inspected boundaries: user prompt, retrieved document, tool response, memory write/read, model response, tool-call arguments, and inter-agent message. A tool response is an output from one component and an input to the next. Streaming and multimodal support also require explicit evidence. As one concrete example, the inspected Bedrock documentation says its prompt-attack filter does not evaluate `toolResult` content or tool definitions; “input guardrails enabled” therefore cannot establish complete indirect-injection coverage. [Bedrock prompt-attack scope](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-prompt-attack.html).

Prompt formatting and instruction hierarchies can reduce risk, but should not be described as a proven structural security boundary inside the model. Limit the consequences of a compromised model through independent authorization, isolation, and egress enforcement. [NCSC analysis](https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection).

## Simplifications with the highest value

1. **Separate functions from delivery platforms.** AI gateways, SSE, browser security, EDR, DSPM, AI-SPM and governance platforms package multiple functions. Retain these familiar names as implementation categories and architecture components, while recording their implemented functions separately. Fix “Secure service edge” to the conventional “Security service edge” when that alias is retained.
2. **Consolidate duplicate inventory work.** Agent/tool registry, model registry, shadow discovery, and discovery within AI-SPM/governance should share an asset-inventory family. Keep discovered assets, approved assets, model versions and identity records distinct within it. Discovery does not confer approval, and a registry does not discover unregistered assets by itself.
3. **Group related runtime functions without erasing differences.** DLP and redaction belong in one family; permissions and per-action authorization belong in one family; retrieval and persistent-memory integrity belong in one family with separate ingestion, retrieval and write-path checks.
4. **Remove objective-shaped siblings.** Model-weight protection is a protection profile composed of access control, encryption, isolation, export restrictions and extraction monitoring. It should not be counted again beside those mechanisms. The same principle applies to broad “secure ML environment” bundles.
5. **Separate distinct functions currently hidden in one entry.** AI BOM generation is different from signing and verification. Model malware scanning is different from prohibiting unsafe deserialization. Dataset lineage is different from media provenance. Observability is different from tamper resistance of the audit record.
6. **Consolidate assurance presentation.** Red-team tooling and evaluation harnesses can share an assurance family, while preserving exploratory adversarial testing versus reproducible regression evaluation. Drift detection can be a specialization of security monitoring; it is not a replacement for general detection and response.

Do not choose a target count first. A smaller set of navigable families with precise leaf functions is more useful than forcing all entries into 30 or 40 flat rows. Parent-family status should be derived from its required leaves, with partial coverage visible; a parent and its children must not all increase the coverage score.

## Gaps and under-specified functions

Most improvements can extend existing functions. Only create new leaves where an independently testable boundary is absent.

| Priority | Finding | Recommended change and verification |
| --- | --- | --- |
| P0 | Deterministic validation is dispersed across transport, encoding, gateway and guardrails entries | Make component I/O contract validation explicit: canonicalization, schemas, types, ranges, lengths, allowed resource identifiers and protocol fields. Reject malformed tool calls before execution; reject malformed results before context ingestion. Anchor to `AML.M0033`; use AISVS C2/C9/C10 for specific checks. |
| P0 | Untrusted-context handling lacks an explicit capability boundary | Add or explicitly model restrictions on tool use after untrusted content enters context (`AML.M0030`). Separate untrusted-content processing from privileged execution where practical. Test an allowed but attacker-steered tool call; a benign-looking input should not bypass the action gate. |
| P0 | Authority can change after initial permissions are assigned | Extend authorization and delegation to prevent runtime privilege growth, new credential acquisition, unauthorized targets and broader sub-agent authority (`AML.M0037`). Test scope escalation across a multi-step workflow. This is an extension of current capabilities, not necessarily a new top-level row. |
| P0 | Tenant/session isolation is scattered and prompt/response cache protection is mostly implicit | Extend data-access and memory profiles to conversation history, caches, embeddings, intermediate artifacts and shared serving state. Verify principal-aware cache keys and access checks; replay the same request under another tenant and session. |
| P0 | Approval and shutdown are described too broadly to assess | Require approval bound to the exact action, principal and current context; fail closed on expiry or changed arguments. Exercise cancellation across spawned work and queued actions; ensure a compromised agent cannot disable its own emergency stop. |
| P1 | Model theft is treated largely as weight-file access | Add an extraction-abuse detection and response leaf: correlated queries, identity changes, unusual output harvesting and response restriction. Put it within detection/response and model-protection profiles. Ordinary rate limiting does not establish coverage. |
| P1 | Dataset security is framed predominantly as training | Extend provenance, sanitation and integrity to evaluation sets, labels, feedback, reward models, fine-tuning corpora and retrieval ingest. A signed poisoned dataset is still poisoned. Verify contaminated holdouts and altered reward/evaluation artifacts are detected or fail promotion. |
| P1 | Retention and secure deletion are buried in DSPM and decommissioning | Make lifecycle enforcement assessable independently of data discovery. Verify deletion across memory, logs, caches, indexes and relevant replicas; document backup behavior and provider limitations. Do not equate deletion from a corpus with removal from trained weights. |
| P1 | Recovery is mostly model/prompt rollback | Extend recovery to persistent memory, retrieval indexes, policy bundles and workflow state. Test restoration plus safe resumption; prevent a restored workflow from repeating an already completed external action. |
| P1 | Text-first descriptions omit important attack carriers | Add modality/representation coverage to validation, injection tests and content inspection: images, audio, documents, OCR, hidden content and encoded material. Extend these functions rather than creating a generic “multimodal security” product bucket. |
| P2 | Deception is absent | Consider an optional honeypot/canary profile: `AML.M0039` plus relevant D3FEND decoy techniques. Useful for exposed services and detection programs; not a universal baseline requirement. |

Evidence anchors: [ATLAS release data](https://github.com/mitre-atlas/atlas-data/blob/main/dist/v6/ATLAS-2026.09.yaml), [AISVS agent requirements](https://github.com/OWASP/AISVS/blob/main/1.0/en/0x10-C09-Orchestration-and-Agentic-Action.md), [AISVS MCP requirements](https://github.com/OWASP/AISVS/blob/main/1.0/en/0x10-C10-MCP-Security.md), [AISVS chapter links](https://owasp.github.io/www-project-artificial-intelligence-security-verification-standard-aisvs-docs/), [MCP security guidance](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices), [national-agency agentic guidance](https://www.ncsc.govt.nz/assets/guidance/Documents/Careful-adoption-of-agentic-AI-services_FINAL.pdf). Priorities and proposed test cases are this assessment's judgments.

For predictive AI, do not exclude defenses merely because they are narrower or appear in one source family. NIST independently discusses predictive-model robustness, privacy and evasion defenses. Keep ensembles, sensor diversity, input restoration and output-disclosure reduction as optional model-specific profiles where applicable. They need not become universal LLM capability rows. Similarly, deepfake defenses belong in an identity/media workflow profile when that threat exists, rather than being categorically dismissed because the current CoSAI risk list lacks a matching leaf. [NIST AML taxonomy](https://csrc.nist.gov/pubs/ai/100/2/e2025/final).

## Specific semantic and applicability defects

| Existing claim or mapping | Assessment | Correction |
| --- | --- | --- |
| Shadow discovery → `controlUserPoliciesAndEducation` | Discovery does not publish policy or educate users. It can inform those activities. | Remove an implementation claim; retain only an explicitly typed supporting relationship if useful. |
| TPRM/threat-model tooling → `controlInternalPoliciesAndEducation` | Assessment tools do not themselves implement employee education. | Allow an honestly unmapped technology contribution. Track people/process fulfillment outside the technology catalogue. |
| Content filtering, safe rendering and IAM → `controlUserTransparencyAndControls` | Blocking content or authenticating a user does not establish disclosures or control over data use. | Require a concrete transparency/consent feature or remove the implementation edge. Approval and documentation can contribute, but do not automatically meet the whole control. |
| Injection detector → adversarial training/testing | A runtime detector is not a test harness or training mechanism. | Separate a detector's implementation role from its use as a test subject or source of test cases. |
| Evaluation harness → benchmark-manipulation risk | An evaluator can consume a contaminated benchmark without detecting it. | Require dataset provenance, protected holdouts, contamination checks and access controls for this risk claim. |
| Grounding → retrieval-poisoning mitigation | A poisoned source can produce an accurately grounded malicious answer. | Treat trusted-source qualification and retrieval integrity as prerequisites; do not claim grounding alone prevents poisoning. |
| Media provenance → covert-channel/output-safety mitigation | An authentic signed asset can still contain malicious or false content. | Limit to provenance/integrity claims. Remove unsupported prevention claims. |
| PET umbrella includes federated learning, synthetic data and local inference | These deployment/data-generation choices do not by themselves establish a privacy guarantee. | State the threat model and actual mechanisms; independently evaluate leakage. |
| Training-data lineage requires cryptography | Lineage records need not be cryptographically anchored to qualify as lineage. | Track lineage separately from integrity/authenticity protections. |
| Observability captures “reasoning steps” | Tool calls and exposed planning events are observable; complete internal reasoning is not generally available or a reliable security record. | Specify observable execution events and protect sensitive trace data. |
| “Every vendor,” “every major cloud,” “only capability,” “most common failure” | Strong market/universality claims are not established by the attached general-purpose sources. | Remove or replace with dated, specifically evidenced statements. |

The content-provenance distinction is explicit in [C2PA's explanation](https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html): provenance supports assessment of origin and tampering, not a determination of factual truth. Privacy mechanisms require their own guarantees; see [NIST's privacy-attack and mitigation treatment](https://csrc.nist.gov/pubs/ai/100/2/e2025/final). The remaining mapping judgments follow from the local capability and CoSAI control definitions.

**Surface applicability needs a responsibility model, not universal yes/no answers.** The current `applies` field mixes where a function executes, which asset it protects, whether the customer configures it, and whether a vendor happens to expose it. Preserve the three useful UI surfaces, but qualify the relationship per architecture/component.

Examples from the file:

- Data-access governance can protect local repositories and files; repositories are not inherently server-side.
- Endpoint training, local adaptation and evaluation are possible; “no training occurs on the consuming endpoint” is a chosen usage profile, not a structural limit.
- A SaaS customer may manage uploaded fine-tuning or retrieval data even when the provider's base corpus is inaccessible. Separate customer-controlled data from provider internals.
- SaaS retrieval, guardrails, retention and isolation vary by exposed tenant settings. “The vendor owns the index” does not prove the customer has no relevant configuration control.
- A customer-side egress policy protects the customer-to-vendor path; it does not constrain the vendor's subsequent tool traffic. Do not score those paths as equivalent.
- Confidential computing may be inherited from a provider or available in specialized edge hardware. Applicability depends on the workload and available attestation/configuration, not simply “cloud yes, endpoint/SaaS no.”

Use an explicit disposition such as `customer-operated`, `customer-configurable`, `provider-inherited`, `not-applicable`, or `unknown`, plus the protected asset and boundary. These are proposed local metadata values, not MITRE terminology. The repo already distinguishes vendor-internal and customer-configurable responsibilities in [ONTOLOGY.md](../data/ONTOLOGY.md); reuse that concept. Provider-inherited evidence should remain an assurance record under the existing drawing rules, rather than becoming a new customer-deployed chip.

CSA's AICM explicitly analyzes ownership/applicability, and AI Exchange distinguishes hosted consumption, running external models, and training/adaptation with shared responsibility. Those models support this correction. [CSA AICM](https://cloudsecurityalliance.org/artifacts/ai-controls-matrix-v1-1), [AI Exchange delivery-model discussion](https://owaspai.org/docs/ai_security_overview/).

## Disposition of all 56 existing capabilities

The identifiers below are existing local IDs, preserved for migration traceability. “Group” changes navigation/rollups while retaining assessable functions. “Reclassify” preserves useful content as a platform or protection profile. “Split” means that one implementation must no longer be assumed to supply every bundled function.

MITRE references are **candidate functional anchors**, not equivalence claims. Unless marked “close,” they cover only part of the current record or describe a broader mitigation. D3FEND references were checked against 1.6.0; ATLAS against 2026.09. A dash is deliberate: forcing a weak match would reduce accuracy. Supporting standards appear in the discussion above and below.

| Existing ID | Disposition | Proposed function or placement | Candidate anchors and boundary |
| --- | --- | --- | --- |
| `capabilityAiDlp` | Group | Sensitive-data inspection and enforcement | `AML.M0020` is broader. Keep blocking independently assessable from transformation. |
| `capabilityDspm` | Split / reclassify | Data discovery/classification and posture assessment; separate lifecycle enforcement | `D3-DI` covers inventory only. DSPM remains a platform category. |
| `capabilityDataAccessGovernance` | Group / clarify | Data entitlement analysis and retrieval authorization | `D3-AMED`, `D3-APA` are generic anchors. Keep permission review distinct from query-time enforcement. |
| `capabilityPromptRedaction` | Group / rename | Sensitive-data transformation | Under the DLP family; `AML.M0020` is broader. Transformation must cover the actual input/context/output paths. |
| `capabilityDataProvenance` | Broaden | Dataset provenance and lineage | Close to `AML.M0025`; include evaluation, labeling and retrieval data. Cryptographic verification is separate. |
| `capabilityDataSanitization` | Keep / broaden | Dataset screening and poisoning remediation | Close to `AML.M0007`; include active learning, feedback and evaluation-set handling where relevant. |
| `capabilityPetTooling` | Decompose within family | Differential privacy; cryptographic privacy mechanisms; minimized/local processing profiles | No single adequate MITRE equivalent. Use NIST/CoSAI terminology and mechanism-specific evidence. |
| `capabilityRagSecurity` | Group / narrow | Retrieval integrity and trust enforcement | `AML.M0033` partly supports validation. Share a family with memory; reference authorization and isolation functions instead of duplicating them. |
| `capabilityAiSpm` | Reclassify / decompose | AI posture platform implementing inventory, configuration assessment and exposure analysis | `D3-AI`, `D3-CI`, `D3-AVE` cover constituent functions, not the whole platform. |
| `capabilityAiBom` | Split | AI BOM generation; artifact signing and verification | `AML.M0023` for BOM; `AML.M0013` and `AML.M0014` for separate integrity mechanisms. |
| `capabilityModelScanning` | Split | Model-file malicious-content analysis; restricted artifact loading | `D3-FA` / `AML.M0016` for scanning; `AML.M0011` for loading restrictions. Neither proves freedom from behavioral backdoors. |
| `capabilityModelWeightProtection` | Reclassify | Model confidentiality / theft-protection profile | Compose `AML.M0005`, `AML.M0012`, isolation and extraction-abuse defenses. Remove duplicate standalone coverage credit. |
| `capabilityEncryptionKeyManagement` | Keep / clarify | Asset encryption and key lifecycle | `AML.M0012`, `D3-FE`; identify key custody separately. Reference transport mechanisms rather than duplicating them. |
| `capabilityConfidentialComputing` | Keep | Confidential workload execution and attestation | `D3-HBPI` is only a partial isolation anchor. Confidentiality, measurement and attestation need explicit requirements. |
| `capabilityAgentSandboxing` | Keep / generalize | Workload execution isolation | `D3-EI`, `D3-ABPI`, `D3-KBPI`; `AML.M0032` is broader. Cover model loaders and tools as well as agents. |
| `capabilityAiGateway` | Reclassify | Model/tool traffic broker as an enforcement location | `D3-AMED` covers some enforcement functions. Routing through a broker alone earns no credit for optional security features. |
| `capabilityEgressControl` | Split within family | Network isolation; outbound destination enforcement | `D3-NI`, `D3-OTF`. Separate lateral isolation from outbound filtering and specify whose network is controlled. |
| `capabilitySse` | Reclassify / rename | Security service edge platform | Compose access mediation, traffic filtering, content inspection and DLP. Retain as an implementation filter. |
| `capabilityNhiManagement` | Keep / clarify | Workload and agent identity lifecycle | `D3-AA` addresses authentication only. Identity inventory, issuance and revocation are additional functions. |
| `capabilitySecretsManagement` | Keep | Credential storage, issuance, scoping and rotation | `D3-CH`, `D3-CRO` are partial anchors. Keep secret values outside the model context. |
| `capabilityTransportSecurity` | Narrow | Authenticated and protected communications | `D3-MAN`, `D3-MENCR`, `D3-TB` cover constituent mechanisms. Move message-schema checks to validation; specify replay protection separately. |
| `capabilityMlSecureDefaults` | Reclassify | Secure development/training environment profile | Compose `D3-ACH`, isolation, trusted loading, signing and validation. Do not count the bundle again beside its functions. |
| `capabilityStagedRollout` | Keep / broaden | Controlled release and recoverable system state | `D3-RC`, `D3-RS`, `D3-RD` cover restoration only. Keep progressive release and recovery criteria distinct. |
| `capabilityPromptInjectionDefense` | Keep / rename | Prompt-injection and jailbreak screening | A specialization of broad `AML.M0020`; assess direct, indirect, encoded and multimodal attack paths. Detection is one layer of defense. |
| `capabilityModelGuardrails` | Narrow | Content-policy screening | `AML.M0020` is the broader parent, not a synonym for this leaf. Remove generic promises of all runtime protection. |
| `capabilityOutputEncoding` | Keep / clarify | Context-aware output encoding and safe consumption | Partly related to `AML.M0033`; preserve HTML/SQL/shell/URL consumer distinctions. This is not content moderation. |
| `capabilityGroundednessChecking` | Split | Evidence-grounding verification; task-consistency review | `AML.M0020` covers the bundle broadly; action decisions belong in authorization and scope-monitoring functions. |
| `capabilityModelHardening` | Split within family | Predictive-model robustness; generative-model alignment | `AML.M0003` and `AML.M0022` are separate upstream concepts. Match each to the relevant model and training process. |
| `capabilitySystemPromptManagement` | Split | Instruction/configuration integrity; model instruction hierarchy | `D3-SCP`, `D3-FIM` partially anchor integrity; `AML.M0021` covers model guidance. Do not equate prompts with external enforcement. |
| `capabilityContentProvenance` | Optional profile / clarify | Media provenance validation and marking | Use C2PA for provenance interoperability. Watermarks and signed credentials are distinct; neither establishes safe or truthful content. |
| `capabilityAgentObservability` | Group | AI execution telemetry capture and correlation | Close to `AML.M0024`; use OpenTelemetry conventions where applicable. Keep audit integrity a separate requirement. |
| `capabilityAgentRegistry` | Group | AI asset inventory, ownership and approval state | `D3-AI`, `D3-SWI` partially anchor inventory. Approval/admission is separate from discovery and identity authentication. |
| `capabilityToolPermissionScoping` | Group | Agent/tool authorization-policy administration | `D3-APA`; `AML.M0026`–`AML.M0028`. Pair with runtime enforcement; configured scopes alone are insufficient. |
| `capabilityAgentRuntimeEnforcement` | Group / extend | Per-action authorization and authority bounds | `D3-AMED`, `AML.M0037`. Include argument/resource checks and continuous limits on authority growth. |
| `capabilityHitlControls` | Keep / strengthen | Human approval and escalation enforcement | Close to `AML.M0029`; bind approval to exact execution context. Reviewer models can assist, not impersonate human approval. |
| `capabilityMemoryProtection` | Group / broaden | Persistent state and context-store integrity | Close to `AML.M0031`; share a family with retrieval integrity but preserve write, read, retention and recovery checks. |
| `capabilityBehavioralDriftDetection` | Group / align | Agent scope monitoring within security detection | Close to `AML.M0038`; distinguish authorized-objective drift from generic model performance drift. |
| `capabilityRateLimiting` | Split within family | Request admission limits; per-workflow resource budgets | `AML.M0004` and `AML.M0036` are complementary. Cover fan-out and aggregate spending, not just requests per second. |
| `capabilityCredentialIsolation` | Keep / clarify | Credential-bound delegation and audience isolation | `D3-CTS`, `D3-TB`, `AML.M0028` are partial anchors. Preserve caller authority across every hop and prohibit token passthrough. |
| `capabilityMcpToolSecurity` | Reclassify / decompose | Tool supply-chain integrity profile, with MCP-specific tests | Compose `AML.M0013`, `AML.M0014`, `D3-FIM`, inventory and admission. Include plugins, skills and non-MCP tools. |
| `capabilityKillSwitch` | Split | Emergency containment/termination; lifecycle decommissioning | `D3-PT`, `D3-CR`, `D3-NI` cover response mechanisms. Deletion and retirement are separate lifecycle tasks. |
| `capabilityIga` | Split / clarify | Human authentication; access policy; access review | `D3-MFA`, `D3-AA`, `D3-APA` cover parts. IAM and IGA are not interchangeable names for the entire bundle. |
| `capabilityAiRedTeaming` | Group / rename | Adversarial test tooling within AI security assurance | `AML.M0035` includes a people/process program; the deployable tooling is only its technical contribution. |
| `capabilityModelEvals` | Group / narrow | Repeatable security evaluation and regression gates | `AML.M0008`; retain security-relevant tests. General task-quality evaluation is optional context. |
| `capabilityAiDetectionResponse` | Keep as family | AI detection, investigation and response functions | Compose actual analytics and response functions; `AML.M0024` is telemetry, not proof of detection. Add extraction-abuse coverage. |
| `capabilityAuditLogging` | Group, distinct leaf | Tamper-evident security audit records | `AML.M0024` supports logging but does not establish every integrity/non-repudiation property. Preserve separate evidence. |
| `capabilityEdr` | Reclassify | Endpoint security implementation platform | `D3-PA`, `D3-NTA`, `D3-PT` are examples of constituent functions. Agent-tool interception must be verified per product/integration. |
| `capabilityBrowserDetectionResponse` | Reclassify | Browser/session enforcement implementation | `D3-WSAA` covers session analysis only. Map actual clipboard/upload, DLP, URL and session controls separately. |
| `capabilityAppSecTesting` | Keep as family | Code, dependency and application security testing | `D3-DA`, `D3-SYSVA`, `AML.M0016` are partial anchors. Preserve SAST/SCA/DAST distinctions as test methods. |
| `capabilityAiVulnMgmt` | Split within family | Vulnerability discovery/prioritization; remediation deployment | `D3-AVE`, `D3-SU`, `AML.M0016`. Scanning is not patching and patching is not behavioral revalidation. |
| `capabilityVendorAssurance` | Rename / reclassify | SaaS configuration assessment and evidence collection | `D3-CI`, `D3-ACH` only partially align. The description is SSPM; the ID suggests a broader supplier-assurance function. |
| `capabilityAiGovernancePlatform` | Reclassify / decompose | Governance implementation platform and evidence workflows | Inventory can reference `D3-AI`; ownership, risk acceptance and governance remain CoSAI responsibilities supported by tooling. |
| `capabilityShadowAiDiscovery` | Group | Unmanaged AI asset and usage discovery | `D3-AI`, `D3-SWI` are broad anchors. Reconcile against approved inventory; retain endpoint/browser/cloud sensors as implementation details. |
| `capabilityAiTprm` | Keep outside technical core | Supplier assessment/evidence workflow tooling | No direct MITRE technical equivalent. Useful governance support, not a substitute for vendor-internal controls or education. |
| `capabilityThreatModeling` | Keep outside technical core | Threat-model authoring and analysis tooling | `D3-ORA` is related at a broad assessment level, not an exact AI threat-model-tool equivalent. Do not force a direct import. |
| `capabilityModelDocumentation` | Split / group | Model asset/version registry; evidence/document generation | Inventory partly aligns with `D3-AI`; generated documentation belongs in assurance support. Preserve model-card interoperability. |

## Proposed repository model and migration

The existing separation of vendored CoSAI data, authored mappings and organization posture is a good foundation. Extend it rather than rebuilding the app around a generic knowledge graph.

The minimum conceptual relationship is:

```text
CoSAI control
    ← implemented or supported by: a defensive function
        ← delivered by: a platform/product feature
            ← configured at: a concrete architecture boundary
```

Each defensive function either references an unmodified upstream entity or is explicitly marked as a local specialization/composition. Product categories do not become extra defenses. Keep CoSAI's categories as a control lens; do not require them to be the native hierarchy of D3FEND techniques.

Suggested incremental work:

1. **Add versioned upstream sources and typed references.** Vendor selected D3FEND and ATLAS data with release/commit, URL, retrieval date, checksum and source notices. Keep source definitions separate from local summaries. Do not rewrite CoSAI's existing ATLAS mappings to a newer release without a separate crosswalk.
2. **Retain the 56 local IDs as compatibility IDs initially.** Add whether each record is a function, family, platform category or profile. Add upstream references with `exact`, `narrower-than`, `broader-than`, `partial`, or `related` semantics and a short rationale. Verify exact matches against the actual definition, not the title. Import upstream records under source-qualified IDs even while local aliases remain.
3. **Make functional and implementation views explicit.** Display leaf-function coverage in the former; retain familiar EDR/SSE/gateway names in the latter. Group guardrail functions, inventory, authorization, retrieval/state integrity and assurance. Never give the same implementation duplicate coverage credit at both levels.
4. **Correct weak mappings and responsibility assertions.** Change bare control links into implementation/support contributions with scope and evidence. Accept people/process-only control gaps. Keep provider assurance distinct from customer enforcement. Add the P0 functions/criteria above.
5. **Migrate pins and posture with explicit rules.** Update architecture pins, vocabulary enforcement classifications, guidance and org mappings together. The 362 pins mean this is not just a YAML-title cleanup. One old record may map to several new functions at different locations. Preserve aliases for deep links and exports; flag ambiguous posture for reassessment instead of copying `enabled` to every child.
6. **Verify the migration.** Run data validation, audit, lint and build when implementation occurs. Compare each architecture's protected boundaries and required functions before/after. Exercise representative endpoint, cloud-agent, SaaS and training views. Validate that every current ID is retained, aliased or explicitly retired, and no posture record silently disappears.

Do not build new schema machinery until the dispositions are accepted. A useful first implementation increment is upstream references, mapping roles, and responsibility metadata; it can deliver more trustworthy coverage before any visible consolidation.

### Acceptance criteria for individual function records

Each function should answer: what operation does it perform, on which artifact, at which boundary, against which failure, and what evidence proves it is active? Record detector behavior separately from enforcement action. Examples:

- A prompt-injection detector has adversarial test evidence for the specific content channels and languages it inspects; its presence is not a zero-risk claim.
- A tool-action gate denies disallowed arguments and unauthorized resources even when the model proposes them confidently; a changed action invalidates its prior approval.
- An integrity verifier rejects an altered artifact before load; an inventory entry alone does not pass this test.
- A memory guard prevents cross-tenant reads/writes and excludes quarantined state from retrieval; a logging hook alone does not pass.
- A shutdown mechanism stops queued and delegated work under failure conditions; changing a UI toggle without stopping execution does not pass.

Use AISVS requirement IDs to make these checks portable, but do not infer full AISVS compliance from a capability mapping. A detector, validator, policy engine and approval workflow may each satisfy only part of a requirement.

## Interoperability standards worth using beneath the taxonomy

| Function | Standard/reference to reuse | Boundary |
| --- | --- | --- |
| AI component inventory and model documentation | [CycloneDX ML-BOM](https://cyclonedx.org/capabilities/mlbom/) or [SPDX AI profiles](https://spdx.dev/learn/areas-of-interest/ai/) | Artifact schemas, not an overall defense taxonomy. Choose a supported format and version; BOM presence does not verify component trust. |
| Execution telemetry | [OpenTelemetry GenAI conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | Event/span interoperability; does not provide log integrity or security detection by itself. Pin convention maturity/version. |
| Agent runtime interception | [OWASP ACS](https://github.com/GenAI-Security-Project/agent-control-standard) | A control integration contract. Evaluate supported hooks and enforcement behavior; not proof that a policy is correct. |
| Tool authentication/delegation | [MCP security guidance](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices) and the linked authorization specification | MCP-specific implementation requirements, including audience separation and consent; not generic “MCP security” coverage. |
| Media provenance | [C2PA](https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html) | Origin/history integrity, not factual accuracy or malicious-content screening. |
| Defense orchestration | [OpenC2](https://openc2.org/index.html) | Interoperable actuation of supported defenses; optional for this application's present scope. |

## Evidence quality and maintenance

The original “two independent source families” rule is useful as a discovery heuristic, but it is too strong as an exclusion rule and too weak as proof. Standards, vendor documentation and market maps frequently cite or reflect each other. Two broad links do not establish two independently verified endorsements of a narrowly named technology class. Likewise, a legitimate specialized defense should not disappear because it does not vary by endpoint/cloud/SaaS placement.

Replace that inclusion test with: a clear security function, a realizable implementation, an explicit boundary, non-duplication at the chosen level, and a credible source. A strong specification plus demonstrated implementability can suffice; multiple sources increase confidence. Record which source supports the function, which establishes implementation availability, and which supports the CoSAI mapping. Do not attach all three meanings to a generic `sources` array.

Observed source updates matter:

- The capability header cites ATLAS 5.6.0 and 35 mitigations. The inspected release is **2026.09**, with **40 mitigations**. Its additions provide direct anchors for existing red-team/resource-limit/drift functions and a new optional deception profile. This is a dated-source issue, not grounds to overwrite historical CoSAI references. [ATLAS changelog](https://github.com/mitre-atlas/atlas-data/blob/main/CHANGELOG.md).
- The inspected D3FEND distribution is **1.6.0**. Its ontology contains analytical algorithms and offensive concepts as well as defenses. Select defensive-technique classes and hierarchy deliberately; do not treat every object with a name or identifier as a deployable capability. [D3FEND distributions](https://d3fend.mitre.org/resources/ontology/).
- AISVS's published project page identifies **1.0**, with **191 requirements**. The examined Appendix B is in the live `main/1.0` directory; freeze a commit before importing because a version-named directory is not itself immutable. It explicitly calls itself non-normative. [AISVS project](https://owasp.github.io/www-project-artificial-intelligence-security-verification-standard-aisvs-docs/), [Appendix B](https://github.com/OWASP/AISVS/blob/main/1.0/en/0x91-Appendix-B_AI_Security_Controls_Inventory.md).
- ACS is promising for implementation interoperability, but its recent OWASP incorporation and narrower remit do not justify calling it an established all-capabilities standard. [OWASP announcement/resource](https://genai.owasp.org/resource/agent-control-standard-acs/).

Research limitations: the exact Gartner reprint behind many local citations was not independently revalidated; public Gartner material was used for market-level comparison only. CISA's data-security landing page returned 403, so conclusions do not rely on unseen contents of that page. ATLAS's rendered mitigation pages were inaccessible through the browser fetch, so the public machine-readable release was inspected directly. This assessment does not establish the efficacy of any commercial implementation, or verify every claim in the previous research header. No paid ISO text was treated as inspected.

Downloaded research snapshots, used to verify identifiers and definitions (not installed as app dependencies):

| Snapshot | SHA-256 |
| --- | --- |
| [D3FEND 1.6.0 JSON-LD](https://d3fend.mitre.org/ontologies/d3fend/1.6.0/d3fend.json) | `e1546d432c6aa64d45b62dd9e9484b0774ae84de7ff3605ff9dd4e20278957bf` |
| [ATLAS 2026.09 YAML](https://raw.githubusercontent.com/mitre-atlas/atlas-data/main/dist/v6/ATLAS-2026.09.yaml) | `935efa93e28294432d3e2f537eb94991ef8d1f8c58341cd360ea3321ddb66688` |
| [AISVS Appendix B, retrieved 2026-09-18](https://raw.githubusercontent.com/OWASP/AISVS/main/1.0/en/0x91-Appendix-B_AI_Security_Controls_Inventory.md) | `67508073faa954c413f69ed40841d6e53b6cfc57c3458a54d317cc62a7223d63` |

The proposed adoption is therefore **CoSAI + a MITRE-backed defensive-function profile**, with OWASP verification and interoperable implementation formats. It reduces authored taxonomy work while keeping the remaining judgments visible and reviewable.
