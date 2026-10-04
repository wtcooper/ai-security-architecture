# Platform, training and workforce SaaS architecture review

Reviewed 2026-10-03. Scope: four active architectures and their paired guidance. Recommendations only; no architecture, vocabulary, capability, or guidance changes made.

## Verdict and scope

The basic component chains are useful and should largely survive. The most important corrections are semantic: several real security requirements were attached to capabilities that mean something else, and several risk notes describe a different risk from their canonical identifier. The low-code design additionally forces a transport and model-provider topology that its product class does not universally provide.

| Architecture file under `data/reference/architectures/` | Blocks (including governance) | Edges | Capability pins | Risk pins | Verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| `cloud-self-hosted-inference.yaml` | 12 | 6 | 15 | 15 | Retain topology; repair cache isolation, hardware isolation and storage claims. |
| `cloud-training-pipeline.yaml` | 14 | 9 | 16 | 11 | Retain pipeline; repair promotion binding, withdrawal semantics and several pin substitutions. |
| `saas-enterprise-ai-chat.yaml` | 14 | 8 | 17 | 12 | Retain customer tool chain; repair identity/risk semantics and browser assumptions. |
| `saas-low-code-agent-builder.yaml` | 14 | 8 | 14 | 10 | Simplify provider boundary; make actual connector transport and runtime authorization explicit. |

All **62 capability pins and 48 risk pins** are dispositioned below. Repeated pins are separate rows. Governance `mitigations` references were also checked as implementing-service callouts; they are not counted again as pins. Source hashes at the end define the reviewed snapshot.

Method: read the rubric, `data/ONTOLOGY.md`, `data/PROVENANCE.md`, existing review guide, architecture/guidance YAML, relevant vocabulary component definitions and packs, the selected mitigations overlay, authored specializations, checksum-pinned MITRE ATLAS and D3FEND definitions, and all referenced CoSAI risk definitions. Local naming rules are repository conventions, not external standards. MITRE provides capability semantics; NIST provides guidance; vendor documentation proves particular implementation behavior, not a requirement to purchase its topology.

**Disposition key:** Pass = placement and mechanism fit; Change = the current claim or mapping should change; Conditional = keep only with the stated implementation evidence. “Supporting” explicitly means assurance/inventory/detection, not prevention. No recommendation below treats an unused capability as automatically required.

## Shared findings

### PLAT-01 — P1, defect: do not turn identity administration into authentication

**Evidence:** chat `pins.mitigations[D3-MFA]@browser->vendor` promises domain verification, forced consolidation and SSO, without requiring a second factor. Chat `D3-AA@vendor` promises connector grant inventory and expiry. Low-code `D3-AA@platform` promises principal creation, ownership transfer and revocation. Training `D3-AA@corpus->trainJob` largely describes identity issuance and authorization. Canonical D3-MFA requires multiple independent authentication factors; D3-AA verifies an agent's identity. The local mitigation overlay itself says issuance, inventory, authorization and revocation require separate evidence.

**Why / smallest change:** retain all those operational requirements, but describe actual identity verification at the receiving service if retaining D3-AA. For chat, either genuinely require MFA at the IdP and state that, or remove D3-MFA from the tenant-consolidation claim. Keep tenant access policy under D3-APA and its real runtime enforcement. Do not use “standing grants are identities” literally: a grant authorizes a client/principal and can outlive a user.

**Parity:** revise the corresponding identity guidance and governance callouts together; check SaaS siblings for the same substitution.

**Acceptance:** each authentication row names the receiver, evidence verified and rejected condition; provisioning/revocation/SSO alone are never reported as MFA or agent authentication.

### PLAT-02 — P2, conditional defect: vendor guardrails must be configurable and actually block

**Evidence:** chat `cap-input-guardrails@vendor` and low-code `cap-input-guardrails@platform` say the customer can switch on vendor returned-content classification, without naming a customer setting or its scope. Their guidance treats vendor internals as untestable, despite recommending black-box testing elsewhere. The specialization requires screening untrusted text before context assembly and blocking/stripping/quarantining failures.

**Why / smallest change:** keep the pin where a tenant-admin setting really enables and tests that behavior. Otherwise represent it as supplier assurance under the existing `cap-ai-vendor-assessment` and acknowledge residual injection risk. Do not add vendor-internal boxes. Guardrails are probabilistic and cannot replace access or action boundaries.

**Acceptance:** every zone-2 technical pin has a documented customer setting, covered content classes, failure action and a black-box probe; unconfigurable vendor protections carry assurance rather than customer-enforcement claims.

### PLAT-03 — P2, design judgment: show one real SaaS connector transport, not a compulsory product pattern

**Evidence:** both SaaS drawings use vendor-to-tunnel bidirectional edges labelled “outbound-only”; low-code explicitly equates an on-premises data gateway with the same tunnel as chat. Ontology requires an AI gateway on every customer crossing, while product-native connectors may already enforce authorization at the service.

**Why / smallest change:** retain the AI gateway where it actually provides common admission/inspection. Do not require a separate box if the receiving API/tool service enforces the same boundary. A tunnel can reduce public exposure; it does not intrinsically outperform a properly authenticated HTTPS endpoint. If the drawing is a logical request graph, say the tunnel arrow is application traffic and the connector initiates the transport. If arrows encode connection initiation, reverse to `tunnel->vendor` with `outbound: true`, then walk vendor requests as work delivered over that established channel. Keep a single concrete target state and describe alternate deployment requirements outside its principal flow.

**Acceptance:** the chosen transport is implementable by the stated exemplar; a reader can separately identify who opens the connection and whose request is being executed. No assertion that IP allowlisting alone secures a public alternative remains. The pattern rule permits a real receiving enforcement tier to absorb gateway duties.

## 1. Self-hosted model inference

Source: `data/reference/architectures/cloud-self-hosted-inference.yaml`; paired guidance: `data/reference/guidance/cloud-self-hosted-inference.yaml`.

### Components, flows and minimal baseline

Keep `consumers -> gateway -> api -> runtime`, artifact `sources/registry -> storage -> runtime`, and the five governance callouts. API/runtime separation is useful as a logical boundary even if they share a deployment; do not claim they necessarily are separately operated tiers. `Model registry` is already drawn, so the deviation saying it was folded into Storage is obsolete. Scanning/evaluation absorption is a reasonable simplification, but its deviation incorrectly names a private package registry that does not exist here. The new-checkpoint scenario concatenates the independent hub and internal-registry inputs as if one checkpoint takes both; split those admissions into two scenarios or state explicitly that they are separate inputs.

The smallest credible baseline is authenticated admission and per-tenant authorization/limits at the gateway; no direct tenant route to serving management interfaces; safe artifact admission plus trusted promotion verification; secure cache namespace selection; isolated serving network; scoped artifact access; privacy-aware telemetry and patch ownership. Hardware separation is an optional sensitivity-specific extension. No GPU/cache boxes need to be added.

### Findings

#### INF-01 — P1, defect: cache isolation is neither agent memory hardening nor “one flag”

**Evidence:** `AML.M0031@runtime` promises tenant-scoped cache keys. Canonical ATLAS Memory Hardening addresses durable agent memories, histories, summaries and experience stores; this design shows ephemeral inference KV/prefix cache. The local overlay's extension to “cache state” is broader than that canonical definition. The prefix-probe scenario says the risk is closed by one configuration flag and the answer is always no.

**Why / change:** the required control is valid, but use application hardening/access mediation at the runtime and bind cache namespace to authenticated tenant context at the gateway. Remove client-provided namespace overrides, fail closed when tenant binding is missing, and test different users within a tenant if they are separate confidentiality domains. vLLM's actual mechanism accepts a per-request secret salt, not simply a tenant-isolation switch. The salt must be unpredictable and present on every request. [Official vLLM security guide](https://docs.vllm.ai/en/stable/usage/security/#prefix-cache-timing-side-channel-mitigation-cache-salting).

**Parity:** replace the memory-hardening citation in the tenancy guidance; keep the cache risk and scenario with an explicit gateway-to-runtime binding.

**Acceptance:** changing/omitting a caller-supplied salt cannot select another tenant's namespace; tests use identical prefixes from two isolated principals; text does not claim all hardware/timing leakage disappears.

#### INF-02 — P1, defect: hardware process isolation does not promise accelerator side-channel protection

**Evidence:** `D3-HBPI@runtime`, `riskAcceleratorAndSystemSideChannels@runtime`, and guidance “Tenancy is a configuration review” present hardware-backed isolation as the answer when shared silicon is unacceptable. D3-HBPI prevents one process from writing another process's memory. It does not establish separate silicon, confidentiality against timing inference, encrypted memory or attestation. [MITRE D3FEND definition](https://next.d3fend.mitre.org/technique/d3f%3AHardware-basedProcessIsolation/).

**Change:** keep D3-HBPI only for demonstrated process/address-space isolation. Describe dedicated accelerators/hosts or a platform-specific assessed isolation mechanism as an optional high-sensitivity deployment requirement, with remaining side-channel risk. Do not manufacture a generic pin that promises more.

**Acceptance:** the pin says what hardware prevents; a separate note makes the sharing/side-channel decision explicit and no longer equates virtualization with elimination of side channels.

#### INF-03 — P1, defect: split overloaded controls and bind the promotion decision

**Evidence:** `AML.M0005@storage` claims encryption, ACLs and integrity digests, but the canonical capability is access control. `D3-AVE@govObservability` claims patching and configuration drift, but its definition is vulnerability enumeration. `cap-output-guardrails@gateway` claims injection classification although the authored split assigns instruction-injection detection to `cap-input-guardrails`. `AML.M0014@storage->runtime` is correctly placed, but prose sometimes treats the digest alone as proof of promotion.

**Change:** narrow each pin to its direct function. Keep artifact encryption explicitly under encryption if it is a target-state requirement; patching under the patch process; injection screening under the existing input specialization if actually deployed. Verification must compare to a protected, authorized release record, not to a digest an attacker can replace beside the weights. The serving identity cannot alter that record. State signer/issuer trust and accepted promotion policy for signed artifacts.

**Acceptance:** one row never claims three unrelated capabilities; replacing artifact and adjacent digest is rejected; a merely valid but unapproved signature cannot authorize loading. Update promotion and patch guidance accordingly.

#### INF-04 — P2, defect: telemetry and runtime configuration need concrete limits

**Evidence:** `AML.M0024@govObservability` says “Every request and completion recorded,” qualified only by “privacy-consciously.” `riskMaliciousLoaderDeserialization@runtime` explicitly identifies writable compile caches, but the hardening pin does not address their ownership. The inference-only baseline leaves media URL fetching and tool/demo features unspecified.

**Change:** default to security metadata, bounded/redacted content capture, retention and access limits; record `riskExcessiveDataHandlingDuringInference` if content logging remains a first-class flow. Extend existing hardening notes to non-shared, non-user-writable runtime caches. For a text-inference baseline, disable remote-media/tool execution features; if enabled, document their egress and limits using existing runtime/network controls. vLLM documents media URL SSRF and cache-file execution risks. [Official security guide](https://docs.vllm.ai/en/stable/usage/security/).

**Acceptance:** the logging policy has explicit collection and deletion behavior; tenants cannot write executable caches; unsupported side paths are disabled or described. No extra component required.

#### INF-05 — P3, defect: remove stale registry and admission prose

**Evidence/change:** `deviations[The model registry is folded into Storage and the promotion gate]` conflicts with `blocks.registry`; the admission deviation refers to absent `Private pkg registry` and says both pins are on an ingest edge although D3-FA is on `storage`. Align the two descriptions with the actual graph, and separate the two input stories in the new-checkpoint scenario.

**Acceptance:** every named enforcer exists and the artifact walkthrough explains one feasible release path. Guidance remains free to distinguish reused training evaluation from serving-specific compatibility tests.

### Exhaustive capability pin audit

| Capability @ locus | Disposition; enforcer, operation and directness |
| --- | --- |
| `AML.M0014 @ storage->runtime` | Conditional — loader verifies digest/signature against protected approved release record; directly rejects changed artifacts. Integrity alone does not approve a release (INF-03). |
| `AML.M0023 @ govSupplyChain` | Pass, supporting — supply-chain record identifies model/dependencies/provenance for investigation; no admission or behavior guarantee. |
| `AML.M0024 @ govObservability` | Change — gateway emits attributable inference events; collection is direct telemetry, not threat detection; bound content/retention (INF-04). |
| `D3-FA @ storage` | Conditional — ingest/promotion worker scans files before load and rejects disallowed formats; retain absorption, distinguish safe format policy from scanner assurance (INF-05). |
| `AML.M0008 @ sources->storage` | Pass — promotion evaluator tests version behavior before eligibility; detects tested regressions, cannot prove absence of backdoors. |
| `cap-staged-rollout-gate @ storage->runtime` | Conditional — deployment controller versions/canaries/rolls back approved releases; add regression trigger and actual automated rollback owner, rather than just retaining an old file. |
| `D3-AA @ gateway` | Conditional — gateway verifies calling workload credentials; explicitly say issuer/audience/tenant checks, not only identity issuance (PLAT-01). |
| `AML.M0004 @ consumers->gateway` | Pass — gateway enforces authenticated per-tenant request/concurrency ceilings; directly reduces resource exhaustion, only raises extraction cost. |
| `cap-output-guardrails @ gateway` | Change — gateway harm/policy classifier can gate both request and response; instruction-injection claims belong to input specialization (INF-03). Output handling safety in consuming applications remains outside this pin. |
| `AML.M0031 @ runtime` | Change — transient KV namespace isolation falls outside durable agent-memory definition; keep real isolation using the appropriate hardening/access control (INF-01). |
| `D3-HBPI @ runtime` | Change — retain only demonstrated hardware address-space isolation; does not answer accelerator side channels or dedicated silicon (INF-02). |
| `D3-AVE @ govObservability` | Change — vulnerability service inventories known vulnerable versions; detection/supporting only, not patching/configuration drift (INF-03). |
| `AML.M0005 @ storage` | Change — storage IAM directly limits artifact reads/writes; remove encryption/integrity from this pin's claimed capability (INF-03). |
| `D3-ACH @ api` | Pass with scope clarification — operator disables mutation/admin endpoints and unsafe runtime features; directly reduces exposed attack surface. Put executable cache permissions on runtime hardening (INF-04). |
| `D3-NI @ runtime` | Pass — platform network policy isolates distributed channels and prevents bypass; explicitly cover tenant-to-API bypass as well as inter-node access. |

### Exhaustive risk pin audit

| Risk @ locus | Disposition and responding mechanism / residual risk |
| --- | --- |
| `riskSensitiveDataDisclosure @ api` | Change note — unauthenticated model access is not automatically another tenant's data disclosure. State extraction of sensitive memorized data or accessible session state; otherwise describe unauthorized service use. Authentication/segmentation bound it. |
| `riskModelSourceTampering @ sources` | Pass — altered source weights/code enter here; admission, integrity and evaluation contribute distinct protection. Publisher identity alone is insufficient. |
| `riskMaliciousLoaderDeserialization @ storage->runtime` | Pass — loader execution is the right locus; safe formats, scanning and permissions matter; valid digest does not neutralize malicious bytes. |
| `riskModelExfiltration @ storage` | Pass — artifact theft; scoped storage access and encryption are separate protections. |
| `riskModelDeploymentTampering @ storage->runtime` | Pass — altered serving artifact; trusted release binding/load verification (INF-03). |
| `riskInsecureIntegratedComponent @ runtime` | Pass — vulnerable serving software; enumeration supports actual remediation, not a substitute. |
| `riskInsecureIntegratedComponent @ gateway` | Pass — vulnerable privileged gateway; same patch ownership applies. |
| `riskAcceleratorAndSystemSideChannels @ runtime` | Pass risk; Change coverage — hardware shared substrate is correct; HBPI is not sufficient (INF-02). |
| `riskSensitiveDataDisclosure @ runtime` | Conditional — explicit prompt recovery via observable prefix timing is credible, though the canonical risk focuses on disclosure via querying the model. Name the API side-channel mechanism; do not conflate with hardware side-channel R24. Cache isolation is the direct response (INF-01). |
| `riskModelReverseEngineering @ api` | Pass — behavior extraction through queries; rate limits slow it, telemetry can reveal it; no prevention guarantee. |
| `riskDenialOfMLService @ consumers->gateway` | Pass — costly requests exhaust capacity; admission/quota/request-cost limits. |
| `riskInsecureModelOutput @ gateway` | Pass — unvalidated response crosses here; content classifier supplies partial coverage, not downstream HTML/code sanitization. |
| `riskAdapterPEFTInjection @ api` | Pass — runtime adapter-loading entry; disabling or restricting mutation endpoints directly blocks this entry. |
| `riskModelDeploymentTampering @ api` | Pass — administrative mutation entry; isolate/disable endpoints. |
| `riskMaliciousLoaderDeserialization @ runtime` | Pass risk; incomplete response — compile/cache file execution requires explicit non-user-writable cache isolation (INF-04). |

## 2. Fine-tuning and model registry pipeline

Source: `data/reference/architectures/cloud-training-pipeline.yaml`; paired guidance: `data/reference/guidance/cloud-training-pipeline.yaml`.

### Components, flows and minimal baseline

The two ingest chains, candidate store, evaluator and registry are justified. Retain them. A read-only corpus does not need a bidirectional data arrow; either use a one-way artifact/data movement arrow (`corpus->trainJob`) or draw a job-initiated read (`trainJob->corpus`, outbound/request+reply semantics) consistently. Curation and evaluation are real processing tiers and not removable merely because their names describe control functions.

The minimal baseline is curated authorized data, immutable versioned inputs, admitted dependencies, a least-privileged isolated job, an isolated evaluator, independent promotion/signing bound to evaluated bytes, and a serving consumer that checks approved and non-withdrawn release status. RL/agentic rollouts are an extension requiring additional isolation; a conventional supervised fine-tune should not imply it always executes model-generated actions.

### Findings

#### TRAIN-01 — P1, defect: withdrawing a registry version is not an immediate kill switch

**Evidence:** `cap-agent-kill-switch@registry` says withdrawing a release fails verification “everywhere it serves” and a stage transition is the stop. Its canonical parent D3-PT terminates running processes; the specialization expressly requires immediate external termination and cancellation of delegated/queued work. The serving sibling only verifies artifacts at load. A running process can continue using already-loaded weights; a valid historic signature also does not spontaneously become invalid after a registry stage edit.

**Change:** describe registry withdrawal as preventing *future admission* through current eligibility/revocation checking. Remove the kill-switch pin from registry unless a real deployment controller stops/drains running instances and cancels queued jobs. Cross-reference the serving response owner rather than adding a box to this training-only graph.

**Acceptance:** a withdrawal scenario distinguishes a newly requested load from a currently serving instance and states how/when each stops. Offline signature verification alone is never claimed to check live withdrawal status. Guidance is updated in both training and inference.

#### TRAIN-02 — P1, defect: several training controls are mapped to inference/agent capabilities

**Evidence:** `cap-data-access-governance@corpus` and `@storage` are used for ordinary dataset/candidate IAM; the authored specialization means user-entitlement-preserving retrieval into an assistant context. `AML.M0029@evaluation->registry` means approval of AI agent actions, but no agent proposes promotion here. `AML.M0024@govObservability` logs training job provenance while the canonical entry logs deployed model/agent inputs, outputs and actions. The last guidance item cites `AML.M0008, D3-EI` for differential privacy, de-identification and adversarial training: neither capability implements those transforms or hardening recipes.

**Change:** use the existing general model/data access capability `AML.M0005` for the two storage surfaces, with per-run IAM. Keep independent human promotion as a genuine pipeline policy, without calling it agent HITL; D3-APA/actual release authorization are a closer fit. Keep build/audit evidence but distinguish it from inference telemetry. Remove or correctly map optional privacy/adversarial training advice; do not add capabilities solely to preserve a paragraph. If a future agent actually requests promotion, AML.M0029 becomes applicable at that agent action boundary.

**Acceptance:** each remaining pin meets its actual definition; privacy transforms have their own applicability and enforcement evidence; guidance cannot borrow evaluation or execution isolation as coverage for them.

#### TRAIN-03 — P1, conditional defect: bind evaluation and signature to immutable bytes and isolate the evaluator

**Evidence:** job can write `storage`; evaluation reads it; `storage->registry` supplies the digest; promotion signs. No note states immutable candidate versions or that the evaluated digest and signed digest must be identical. `evaluation` loads attacker-influenced artifacts but only `trainJob` has execution/network isolation. Benchmark custody is mentioned, but evaluator credential separation from signing is not.

**Why / change:** if the job can replace a candidate after evaluation, separate signing identity still signs unchecked bytes. Snapshot/content-address the candidate; record evaluated digest plus trusted evaluation result; authorize signature only for that exact immutable digest. Give evaluation a read-only artifact identity, isolated execution/network, protected benchmarks, and no signing/registry mutation authority. Express these on existing store/evaluator/edge notes and pins, with no new gate box. The general secure-development basis is [NIST SP 800-218A](https://csrc.nist.gov/pubs/sp/800/218/a/final); the concrete race and isolation correction is this review's architectural inference.

**Acceptance:** replacing the candidate between evaluation and signing fails; compromise of evaluator cannot mint a release; malformed/unsafe candidate loads do not reach signing secrets or writable benchmark answers.

#### TRAIN-04 — P1, defect: memorization is mapped to the wrong privacy risk

**Evidence:** `riskInferredSensitiveData@evaluation` describes extracting memorized training examples. CoSAI's definition is inferring sensitive facts *not contained in training data*. `riskExcessiveDataHandling@corpus` only describes broad reader access, whereas its definition concerns collection/retention/processing beyond permitted boundaries.

**Change:** use `riskSensitiveDataDisclosure` for memorization/extraction tests. Retain Excessive Data Handling only with explicit data minimization, authorized purpose and retention/deletion conditions; describe unauthorized corpus reads under an access threat rather than calling access control the entire response to excessive handling.

**Acceptance:** privacy risk notes distinguish source data authorization, permitted lifecycle, memorized disclosure and inference of new sensitive facts. Corresponding guidance tests the intended mechanism.

#### TRAIN-05 — P2, defect: custody and research claims overstate the design

**Evidence:** `dataOrigins` and `upstreamArtifacts` put internal records and self-trained checkpoints in the external ownership band; the deviation knowingly overrides the ontology's ownership axis. Description says a poisoned example influences every inference and cannot be removed without retraining. Guidance generalizes a few hundred samples across all model sizes.

**Change:** keep external input blocks external and show internal inputs using existing cloud source/registry concepts, converging on the *same* curation/admission tiers; no duplicate chain is needed. Alternatively narrow the reference drawing to external origins and describe internal ingestion separately. Qualify poisoning influence and recovery; cite the actual study bounds. The referenced study tested 600M–13B models and a narrow gibberish-trigger behavior; it explicitly leaves larger models and more harmful behaviors open. [Primary Anthropic research](https://www.anthropic.com/research/small-samples-poison).

**Acceptance:** ownership bands describe operators consistently; there is still one curation and one admission stage; prose makes neither “every inference” nor universal poisoning/recovery claims.

### Exhaustive capability pin audit

| Capability @ locus | Disposition; enforcer, operation and directness |
| --- | --- |
| `AML.M0007 @ curation` | Pass — filtering job removes unwanted/poisoned examples before training; imperfect detection with residual backdoors. |
| `AML.M0025 @ curation` | Pass, supporting — ingest captures source/modification history, enabling trace-back; provenance alone does not authorize use or detect poisoning. |
| `cap-data-access-governance @ corpus` | Change — store IAM for training data is real but not user-scoped assistant retrieval; use general model/data access (TRAIN-02). |
| `D3-FA @ pkgRegistry` | Pass — admission scanner inspects weights/dependencies; combine with format policy and safe scanning environment; no behavioral-backdoor guarantee. |
| `AML.M0029 @ evaluation->registry` | Change — separated human release decision is valuable but no AI agent action exists (TRAIN-02). |
| `AML.M0013 @ evaluation->registry` | Conditional — independent signer signs exact evaluated digest; downstream verifier enforces trusted release acceptance. Signature creation alone does not stop load (TRAIN-03). |
| `AML.M0008 @ evaluation` | Pass — evaluator probes behavior and gates release; protect evaluator/benchmark custody (TRAIN-03). |
| `cap-data-access-governance @ storage` | Change — candidate artifact ACLs are ordinary model access, not retrieval entitlement preservation (TRAIN-02). |
| `AML.M0012 @ govSecrets` | Pass with placement clarification — KMS manages keys; object-store encryption protects candidate/checkpoint bytes. Callout supports storage enforcement, not arbitrary logged-in read prevention. |
| `AML.M0023 @ govSupplyChain` | Pass, supporting — BOM/lineage links dataset/base/code/run to artifact for incident scoping. |
| `AML.M0024 @ govObservability` | Change — currently build/job audit rather than deployed-model telemetry; name actual evaluation inference I/O if retained, otherwise use an appropriate audit mechanism (TRAIN-02). |
| `cap-model-documentation @ govObservability` | Conditional — current note promises a traveling document only. Specialization also requires versioned lineage/evaluation/approval and promotion eligibility; locate ownership at registry/release record, with governance as supporting callout. |
| `D3-NI @ trainJob` | Pass — platform network policy allows only approved data/artifact/mirror services; prevents arbitrary egress. Apply proportionate isolation to evaluator too (TRAIN-03). |
| `D3-AA @ corpus->trainJob` | Conditional — corpus verifies workload identity on dataset read; issuance and permitted dataset scope need separate IAM enforcement (PLAT-01). |
| `cap-agent-kill-switch @ registry` | Change — registry eligibility is not process termination or queued-work cancellation (TRAIN-01). |
| `D3-EI @ trainJob` | Conditional — execution isolation is direct for generated-code/RL rollouts and untrusted loaders; mark RL applicability and bounded resources; it is not differential privacy/adversarial training (TRAIN-02). |

### Exhaustive risk pin audit

| Risk @ locus | Disposition and responding mechanism / residual risk |
| --- | --- |
| `riskDataPoisoning @ dataOrigins->curation` | Pass — poisoned training input; curation plus integrity/lineage/evaluation reduce or detect it. Provenance does not certify benign behavior. |
| `riskUnauthorizedTrainingData @ corpus` | Pass — unlicensed/unconsented/uncleared use; require an actual use-eligibility decision, not just recorded provenance or reader IAM. |
| `riskExcessiveDataHandling @ corpus` | Change note/response — collection, permitted purpose and retention matter; broad reader access alone describes a different failure (TRAIN-04). |
| `riskModelSourceTampering @ upstreamArtifacts->pkgRegistry` | Conditional — explicitly state malicious alteration of base/dependency; an inherently executable format alone is loader risk, not proof of tampering. |
| `riskInsecureIntegratedComponent @ trainJob` | Pass — vulnerable training dependency with corpus access; isolation, patching and admitted inputs reduce consequence. |
| `riskModelExfiltration @ storage` | Pass — candidate/adapter theft; correct storage IAM/encryption and network controls. |
| `riskEvaluationBenchmarkManipulation @ evaluation` | Pass — poisoned/leaked gate inputs; require custody and protected evidence, beyond running more tests (TRAIN-03). |
| `riskInferredSensitiveData @ evaluation` | Change — replace with memorized sensitive-data disclosure; canonical inferred-sensitive-data is about new inferred facts (TRAIN-04). |
| `riskAdapterPEFTInjection @ registry` | Pass — malicious adapter admitted/approved for base; sign exact adapter/base compatibility and evaluate combination. Registry inventory alone cannot detect behavior. |
| `riskInsecureIntegratedComponent @ pkgRegistry` | Pass — vulnerable mirror software; patch/least privilege/outbound restrictions are needed; artifact scanning does not patch the scanner/registry. |
| `riskMaliciousLoaderDeserialization @ pkgRegistry->trainJob` | Pass — unsafe input executes in job; safe format/loader/isolation are direct, digest pinning alone is not. Extend same risk reasoning to evaluator without necessarily duplicating the tag. |

## 3. Enterprise AI chat with connectors

Source: `data/reference/architectures/saas-enterprise-ai-chat.yaml`; paired guidance: `data/reference/guidance/saas-enterprise-ai-chat.yaml`.

### Components, flows and minimal baseline

Keep the employee/client/vendor chain and the distinct vendor-to-SaaS connector path. Keep customer `tunnel -> aiGateway -> internalTools -> orgData` when the product supplies that transport. Customer grant enforcement at the target SaaS tenant is correctly recognized even though customer packets never traverse that path. `extTools` mixes customer-contracted tenants with unassessed services in a band defined as outside an agreement; move contracted services to a vendor ownership band or narrow the depicted class. They can retain the same `Tool services` title.

The `Browser` registry entry currently means either a web browser or a native desktop app. Those have materially different inspection and tenant-restriction capabilities; a canonical name should not erase that distinction. Prefer one managed-browser baseline here and describe native-client prerequisites separately; any registry correction should be made across siblings.

The smallest baseline is managed-client tenant restriction and actual MFA; endpoint DLP where claimed; least-privilege connector enrollment and user-authorized retrieval; exact-action write approvals; a verified and scoped customer API/tool boundary; audit export, inventory and grant revocation. Vendor internal injection controls remain assurance unless actually configurable.

### Findings

#### CHAT-01 — P1, defect: two risk identifiers describe unrelated mechanisms

**Evidence:** `riskStaleAgentIdentityBinding@vendor->extTools` describes dormant connector grants after a user leaves. Its canonical definition is unchanged agent credentials after underlying model artifact replacement. `riskCrossTenantCredentialPropagation@tunnel` describes theft of a single runtime credential without cross-tenant scope. The canonical risk requires cross-tenant credential pools, validity or identity-layer propagation. `riskSensitiveDataDisclosure@browser->vendor` describes upload/oversharing, whereas the canonical risk concerns disclosure through model queries.

**Change:** replace upload oversharing with `riskExcessiveDataHandlingDuringInference` where it exceeds purpose/authorization; keep sensitive-data disclosure where connector data is actually exposed through model responses. Describe orphaned grants as lifecycle exposure under the applicable shadow-agent/unauthorized-access scenario, without redefining stale model-identity binding. Remove the cross-tenant pin unless its note states which tenant boundary the credential crosses and how. Keep credential hardening even when its risk pin is removed.

**Acceptance:** each risk note contains the causal mechanism in the canonical definition, not merely a shared word such as “stale,” “credential,” or “sensitive.”

#### CHAT-02 — P1, defect: managed-client controls rely on false universal TLS and logging claims

**Evidence:** `browser->vendor`, risk note and contract-paste scenario treat approved browser sessions as necessarily certificate-pinned/unreadable and say the paste creates no queryable record. Yet the architecture has vendor Session audit export. The DLP pin at `employee->browser` describes classification “before the material leaves the person,” without an enforcing software action. The guidance repeats that browser records are the only records the path will ever produce. `D3-OTF@browser` also assumes network destination admission can distinguish corporate and personal sessions at the same host.

**Change:** say inspection availability depends on actual client and supported deployment. Apply endpoint/browser DLP at submission before network transmission, with block/mask behavior. Describe vendor audit-export coverage and retention explicitly; it may be incomplete, but it is not universally nonexistent. Tenant restriction requires a supported managed-client/session/header mechanism; a hostname allowlist alone cannot select the enterprise tenant. OpenAI distinguishes web from desktop-app certificate issues rather than establishing a universal browser-pinning rule. [Official network guidance](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps).

**Acceptance:** test a personal session to the same host; test pasted text and uploaded files; demonstrate the stated enforcement/logging behavior on the chosen client. Pairing “classification” with a redaction capability requires a documented block/redact result.

#### CHAT-03 — P2, conditional defect: action approval must be enforceable, with a non-elicitation fallback

**Evidence:** `AML.M0029@aiGateway->internalTools` assumes MCP elicitation in the vendor client provides exact-action approval. Elicitation is a negotiated client capability; server requests and a generic response are not by themselves a trusted authorization decision. [MCP elicitation specification](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation).

**Change:** keep the pin, but specify that the gateway binds authenticated approver, exact normalized action/resource/arguments, expiry and one-time execution. Unsupported clients must fail closed for writes or use an independent supported approval channel. The principal walkthrough may stay read-only. Explicitly bound external connector writes by vendor-supported approval settings; the customer gateway does not cover them.

**Acceptance:** changing arguments after approval, replaying approval, or calling through a client without elicitation cannot execute the write. No new component is necessary to explain the contract.

#### CHAT-04 — P2, defect: repair stale deviations and mixed ownership

**Evidence:** the final deviation says “No customer MCP gateway is drawn” while `aiGateway` is drawn; it then sends custom-connector readers to another architecture. `extTools` explicitly mixes our SaaS tenants and unassessed parties in `external`. `govSecrets` promises customer-managed keys and a feature-loss tradeoff without an encryption pin or current product-specific source in guidance.

**Change:** say no customer gateway sits on the *native SaaS-to-SaaS connector* path, while the custom internal path uses one. Preserve operator-based custody by moving assessed SaaS endpoints to vendor or narrowing the external block. Remove incidental BYOK tradeoffs from the baseline unless needed; if retained, label optional, verify exact vendor/edition and map encryption honestly.

**Acceptance:** the text and drawing describe the same two connector paths; ownership has one meaning; optional encryption is not attributed to credential hardening.

### Exhaustive capability pin audit

| Capability @ locus | Disposition; enforcer, operation and directness |
| --- | --- |
| `D3-MFA @ browser->vendor` | Change — domain capture/SSO/consolidation is not multiple-factor authentication; add actual IdP MFA or remap (PLAT-01). |
| `D3-OTF @ browser` | Conditional — managed-browser/network filter restricts outgoing destinations; personal-tenant blocking needs a supported session/tenant mechanism (CHAT-02). |
| `cap-sensitive-data-redaction @ employee->browser` | Change — endpoint/browser DLP inspects submission and blocks/masks detected content; human classification alone is not this capability (CHAT-02). |
| `cap-ai-vendor-assessment @ vendor` | Pass, supporting — accountable onboarding/reassessment decision documents vendor controls/residual risk; no direct injection/tenant-isolation enforcement. |
| `AML.M0029 @ aiGateway->internalTools` | Conditional — gateway refuses exact write without authenticated bound approval; negotiate elicitation or require fail-closed alternative (CHAT-03). |
| `cap-input-guardrails @ vendor` | Conditional — only if customer configurable and blocks/quarantines untrusted content before vendor context assembly (PLAT-02). |
| `D3-AA @ vendor` | Change — grant inventory/expiry is not verification of agent identity; state actual authenticator or retain as lifecycle policy (PLAT-01). |
| `D3-DI @ orgData` | Change scope — data inventory identifies schemas/formats/volumes/locations; classification and remediation of oversharing are separate requirements. Keep inventory as supporting discovery. |
| `D3-CH @ tunnel` | Conditional — host protects tunnel/runtime credentials at rest and use; retain distinction from downstream OAuth, and verify real lifetime/rotation support. |
| `AML.M0028 @ aiGateway->internalTools` | Pass — gateway/tool service enforces caller-scoped server/operation/resource permissions. Ensure untrusted caller cannot self-assert user or tenant context. |
| `cap-agent-tool-registry @ govSupplyChain` | Conditional, supporting — inventory is valid; specialization additionally expects owner/version/approval/reconciliation and consultation by admission, not a list alone. |
| `AML.M0024 @ govObservability` | Pass, direct telemetry — vendor export plus gateway logs support reconstruction; content visibility depends on export fields, not assumed complete. |
| `cap-shadow-ai-discovery @ govObservability` | Pass, detection — customer endpoint/browser/network observations discover unregistered use; no claim discovery blocks it. |
| `cap-data-access-governance @ vendor` | Pass — permission-preserving indexing/query/ACL filtering is directly the specialization; require revocation/freshness behavior for indexed content. |
| `D3-APA @ extTools` | Pass, policy administration — customer target-tenant consent policy decides allowable app grants; actual authorization checks remain required and external unowned targets are outside customer enforcement. |
| `cap-agent-kill-switch @ govObservability` | Conditional — disable future execution plus revoke grants and verify active/scheduled work stops; revocation alone is not immediate process termination. |
| `cap-input-guardrails @ aiGateway` | Conditional — gateway must actually screen instruction injection on returning records and block/quarantine; “classified” alone is ambiguous. Does not prove records authorized or nonsensitive. |

### Exhaustive risk pin audit

| Risk @ locus | Disposition and responding mechanism / residual risk |
| --- | --- |
| `riskSensitiveDataDisclosure @ browser->vendor` | Change — excessive upload/context transfer is inference data handling; model-query disclosure needs an explicit response mechanism (CHAT-01). |
| `riskShadowAndUnknownAgents @ browser->consumerTenant` | Conditional — personal account use fits catalogue examples of shadow AI; specify ungoverned agent/connector authority rather than every personal login being an agent. Discovery/tenant restriction are direct. |
| `riskAgenticDelegationConfusedDeputy @ tunnel` | Change locus/detail — the forwarding tunnel is not normally the deputy authorization decision. Put the risk at gateway/tool grant use or explain any privileged credential the tunnel itself substitutes. AML.M0028 is the direct boundary control. |
| `riskExcessiveDataHandlingDuringInference @ aiGateway->internalTools` | Pass — excessive retrieval/retention versus task needs; entitlements alone do not minimize authorized but unnecessary reads. |
| `riskPromptInjection @ vendor->extTools` | Pass — untrusted connector results reach model context; provider screening/approval/permissions reduce consequences, with residual vendor-path exposure. |
| `riskStaleAgentIdentityBinding @ vendor->extTools` | Change — orphaned user grants do not establish model-artifact substitution (CHAT-01). |
| `riskToolSourceProvenance @ vendor->extTools` | Pass — gallery/server tool descriptions and provenance are explicitly the mechanism; inventory alone cannot establish authenticity. |
| `riskRogueActions @ internalTools->orgData` | Pass — consequential writes; permissions plus exact-action approval directly reduce risk. |
| `riskPromptInjection @ internalTools->orgData` | Pass — malicious internal records return via tools; customer return screening plus constrained actions. |
| `riskRetrievalVectorStorePoisoning @ vendor` | Pass — persistent poisoned indexed content; governed source writes and permission-preserving index access, vendor assurance for internal integrity. |
| `riskCrossTenantCredentialPropagation @ tunnel` | Change — single-host token theft lacks cross-tenant mechanism (CHAT-01). |
| `riskPromptInjection @ vendor` | Pass — admin-attached corpus content enters inference; separate from the persistent index modification risk. |

## 4. UI/low-code managed agent runtime

Source: `data/reference/architectures/saas-low-code-agent-builder.yaml`; paired guidance: `data/reference/guidance/saas-low-code-agent-builder.yaml`.

### Components, flows and minimal baseline

Retain builder/consumer actors, one opaque platform, a customer receiving boundary/tool/data chain, external connectors and governance callouts. Remove the baseline's separately drawn vendor model if it is a vendor-internal implementation detail. This reduces complexity and restores parity with enterprise chat and managed-runtime siblings. If a separately contracted model is essential, choose that explicit deployment and correctly identify ownership and key custody; do not put three mutually different cases in one block note.

The smallest credible baseline is authenticated audience and invocation, maker/publisher separation where consequential, per-invoker or explicitly constrained service grants, connector allowlisting/permission rules, risk-based approvals on writes, versioned publication/rollback, and correlated export/inventory/decommissioning. Managed code execution and direct-network paths should be product-specific options, not presumed internals.

### Findings

#### LOW-01 — P1, defect: an on-premises data gateway is not a passive MCP tunnel

**Evidence:** `dataGateway` says it is the platform's on-premises data gateway, relays connector and MCP calls to the AI gateway, and “does not authenticate for us.” It nevertheless caches connection credentials. Microsoft's gateway documentation says the gateway decrypts those credentials and connects to data sources using them. [Microsoft gateway architecture](https://learn.microsoft.com/en-us/data-integration/gateway/service-gateway-onprem-indepth).

**Change:** choose a documented supported transport for this target state. If a generic outbound HTTP/MCP relay is intended, identify that class and avoid inheriting all data-gateway credential/limit claims. If the Microsoft-style gateway is intended, describe its actual connector execution, credential use and supported destination; prove the proposed gateway-to-MCP/AI-gateway chain for the exemplar rather than assuming an arbitrary protocol proxy. The data gateway's directly scoped source access can be a valid boundary implementation; a further AI gateway is not automatically mandatory.

**Acceptance:** one trace shows cloud request, relay protocol, receiving connector, authenticated principal, downstream operation and response. The vendor's actual documentation supports every hop. Secrets guidance matches whether the host stores tunnel credentials, source credentials, or both.

#### LOW-02 — P1, defect: publication policy and inventory do not enforce safe runtime actions

**Evidence:** `riskRogueActions@internalTools->orgData` has a server/tool permissions pin but no risk-based action approval. The public-link scenario admits calls “like any run” because the catalogue does not know who asks, despite `cap-data-access-governance@orgData` promising invoker-scoped reads. `D3-APA@consumer->platform` describes publication authentication and credential mode as if policy administration performs the runtime check. `AML.M0028@platform->extTools` describes connector classification/publish blocking as the only runtime control.

**Change:** require tool/API/data enforcement of authenticated invoker or explicitly approved service role plus operation/resource scope. Missing invoker identity must fail closed for private user data. Connector group policies prevent forbidden combinations but do not authorize every record or action. Keep publication controls; add action-bound approval on consequential writes at the existing customer tool boundary, and vendor-configured approval on native connector writes where supported. For a simpler reference, explicitly make the baseline read-only and remove write/rogue-action claims; do not add an approval tier solely for the drawing.

**Acceptance:** a public anonymous invocation cannot read private user records using an agent/maker token; a logged-in unauthorized consumer also fails. A high-impact write requires the documented approval or is unavailable in the read-only baseline. Attack scenarios clearly identify a deliberately disabled/bypassed control rather than presenting an unprotected target state.

#### LOW-03 — P2, defect: provider custody, inference sequence and disclosure pins disagree

**Evidence:** `provider` sits in External while note calls it the vendor's own model, under the same agreement, or a BYO-provider variant; edge says customer holds no key while note allows customer keys. The principal walk calls the model before retrieval, then returns a “grounded” answer without another model call. `riskExcessiveDataHandlingDuringInference@platform->provider` refers to grounding leaving on a call that happens before grounding is fetched.

**Change:** for the smallest opaque-platform baseline, absorb model inference into platform and put the data-handling risk there. If retaining a distinct external provider, choose and document one actual custody/key model and add the post-retrieval inference exchange before the final answer. Assess permitted use/retention/subprocessors rather than treating every contracted model transfer as excessive handling.

**Acceptance:** every claimed grounded answer is computed after the relevant grounding arrives; ownership/key custody are singular and consistent; no unused provider box remains.

#### LOW-04 — P2, conditional defect: DLP, tracing and rollback pins need their stated implementations

**Evidence:** `cap-sensitive-data-redaction@builder->platform` says “classification before knowledge is attached,” but no managed endpoint or upload enforcement setting is identified. `cap-agent-tracing@govObservability` promises run history, although the specialization requires correlated per-step tool/retrieval/delegation events. `cap-staged-rollout-gate@platform` promises limited audience and unpublish, whereas the specialization includes reviewed evaluation and automated return to a known-good version. Guidance says all vendor controls are population controls and that execution/guardrail claims cannot be tested; vendor runtime settings and black-box boundary tests contradict that blanket statement.

**Change:** identify supported upload block/redaction and its enforcer, otherwise use a pre-publication data-approval process without claiming inline DLP. Keep full tracing/rollout pins only if exported fields and actual release/rollback behavior satisfy them; otherwise narrow to telemetry and a publication policy. State which vendor internals require assurance and which observable policies can be tested.

**Acceptance:** a sensitive test upload is blocked/masked; a trace links consumer, agent version, tool call and result; rollback restores a tested version or the recommendation explicitly describes the weaker unpublish response.

#### LOW-05 — P2, defect: keep vendor facts and failure scenarios out of universal target-state claims

**Evidence:** `govIdentity` says end-user credentials are the default and safe; summary/description say maker credentials are typical. `govPolicy` asserts every violating agent cannot publish and exemptions were removed, applying a particular product's behavior to all exemplars. `builder` says no review/pipeline, while the reference promises a publication gate. External-tool pack includes A2A peers; guidance assumes discovery on by default without a corresponding distinct delegation flow or direct scope limit.

**Change:** describe desired behavior (“require invoker authorization,” “block publication on policy failure”), with actual defaults in dated exemplar/tooling notes. Do not assume agent-to-agent discovery is universal; remove it from the minimum baseline unless a tested delegation path and authorization constraints are in scope. Label scenarios as control-failure variants explicitly. Per-platform data policy can be useful without being universal. [Copilot Studio data-policy documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-data-loss-prevention).

**Acceptance:** baseline notes never simultaneously claim an enforcement point exists and that no such point exists; defaults are vendor/edition-specific; unsupported extra traffic classes are absent.

### Exhaustive capability pin audit

| Capability @ locus | Disposition; enforcer, operation and directness |
| --- | --- |
| `cap-sensitive-data-redaction @ builder->platform` | Conditional — identify managed endpoint or vendor upload DLP that blocks/masks sensitive knowledge before acceptance; classification/review alone is not redaction (LOW-04). |
| `D3-APA @ consumer->platform` | Change scope — tenant admin sets audience/credential policies; platform and downstream service must enforce authenticated invocation and user rights (LOW-02). |
| `D3-AA @ platform` | Change — principal minting/ownership transfer is not authentication; require verified agent credentials at tool/resource use (PLAT-01). |
| `cap-agent-tool-registry @ platform` | Conditional, supporting — platform registry inventories owner/connectors/approval and reconciles unknowns; listing alone does not prevent runs. State admission consultation. |
| `cap-staged-rollout-gate @ platform` | Conditional — customer release process must bind evaluation, version, limited rollout and known-good rollback; unpublish alone is weaker (LOW-04). |
| `cap-input-guardrails @ platform` | Conditional — customer setting enforces injection screening/blocking on connector and knowledge returns; otherwise vendor assurance (PLAT-02). |
| `cap-ai-vendor-assessment @ platform` | Pass, supporting — onboarding/change review of runtime, isolation, connectors and terms; no runtime enforcement claim. |
| `AML.M0028 @ platform->extTools` | Conditional — tenant connector policy can directly limit tools; additionally require principal/operation/resource permission enforcement, since grouping/publish checks alone do not narrow each call (LOW-02). |
| `D3-CH @ dataGateway` | Conditional — protect actual cached source/tunnel credentials and verify rotation support; lifetime is product-dependent; fix credential use model (LOW-01). |
| `AML.M0028 @ aiGateway->internalTools` | Pass with explicit authorization contract — gateway/tool permissions protect entry; include invoker/agent/tenant intersection rather than only server allowlist (LOW-02). |
| `cap-input-guardrails @ aiGateway` | Conditional — return-path classifier blocks/strips/quarantines instruction attacks; “classified” without action is insufficient. Does not authenticate content. |
| `cap-data-access-governance @ orgData` | Pass mechanism; inconsistent scenario — source query enforces invoker entitlement; govern writes too. Anonymous service-principal retrieval must not silently bypass this (LOW-02). |
| `cap-agent-tracing @ govObservability` | Conditional — vendor exports correlated agent/consumer/tool/retrieval events; ordinary run list is telemetry, not full per-step tracing (LOW-04). |
| `cap-agent-kill-switch @ govObservability` | Conditional — external admin disables agent, revokes relevant grants and confirms live/scheduled work cessation; blanket app disable or credential revocation alone may miss in-flight jobs. |

### Exhaustive risk pin audit

| Risk @ locus | Disposition and responding mechanism / residual risk |
| --- | --- |
| `riskAgenticDelegationConfusedDeputy @ platform` | Pass — maker privilege lent to weaker invoker is precise; invoker-scoped downstream authorization is the direct response. |
| `riskShadowAndUnknownAgents @ platform` | Pass — unmanaged agent population with lasting grants; registration/admission/lifecycle plus discovery. |
| `riskRogueActions @ internalTools->orgData` | Pass risk; incomplete control — arbitrary writes need constrained actions and risk-based approval or a read-only baseline (LOW-02). |
| `riskRetrievalVectorStorePoisoning @ orgData` | Pass — poisoned grounding source persists into indexed knowledge; source write governance plus vendor index assurance. |
| `riskPromptInjection @ platform->extTools` | Pass — tool/grounding returns become instructions; screening is partial, authority confinement limits damage. |
| `riskSensitiveDataDisclosure @ dataGateway` | Change mechanism/locus — cached credential theft/host compromise is not itself disclosure through model queries. Describe unauthorized data returned to the assistant or an integrated-component/credential threat appropriate to actual behavior. |
| `riskExcessiveDataHandlingDuringInference @ platform->provider` | Conditional — excessive/unauthorized sharing or retention, not mere external model processing. Move with opaque model boundary or repair sequence (LOW-03). |
| `riskSensitiveDataDisclosure @ consumer->platform` | Pass — unauthenticated querying exposes grounding; runtime audience and data authorization are direct responses (LOW-02). |
| `riskPromptInjection @ internalTools->orgData` | Pass — malicious folder content returns into model; governed writes, screening, permissions and action approval reduce risk. |
| `riskSensitiveDataDisclosure @ builder->platform` | Change — bulk knowledge upload is excessive data handling when beyond authorized purpose; subsequent unauthorized model-query disclosure is a different point (LOW-03/CHAT-01). |

## Cross-architecture mapping and simplification decisions

1. **Keep canonical names, correct their semantics.** `AI gateway`, `Tool services`, `Enterprise data`, `Inference API`, `Inference runtime`, `Storage` and `Model registry` are useful shared concepts. Fix `Browser` and `Tunnel connector` registry descriptions when their current breadth hides real enforcement differences. A name being registered does not make its contents correct.
2. **Separate ownership from content origin.** Internal training records do not become externally operated because they are untrusted; contracted SaaS does not become uncontracted External because packets bypass our network. Two source blocks can converge on one ingest chain.
3. **Remove false directness instead of adding boxes.** Vendor assessment, BOM, provenance, inventory and vulnerability enumeration remain useful supporting controls. Their pins must not claim runtime prevention, patch installation or cryptographic approval they do not perform.
4. **Do not turn family consistency into a mandatory appliance.** The same authorization boundary may be a tool/API receiving service or an AI gateway, and the same outbound connection may carry HTTP tunnelling or a product connector protocol. Normalize meanings before forcing names/chains.
5. **Keep a small truthful baseline.** Remove low-code's unnecessary provider box; retain storage and registry where they have separate data/decision roles; keep governance callouts; avoid adding separate cache/GPU/approval/KMS components solely to host pins.
6. **Correct crosswalks with the pin fixes.** `AML.M0031` overlay cache wording, `D3-HBPI` risk coverage, retrieval-specific specializations applied to training, and overloaded D3-AA/D3-MFA notes should be checked across the catalogue. A valid parent mapping cannot widen the actual MITRE definition. Compare mitigation `risks` mappings to direct protection, supporting evidence and residual risk separately.

## Recommended remediation order

- First: PLAT-01, INF-01/02/03, TRAIN-01/02/03/04, CHAT-01/02, LOW-01/02. These affect the truth of the stated protection or essential flow.
- Next: conditional vendor settings, action-approval contract, provider custody/sequence, metadata/telemetry scope and source ownership.
- Last: obsolete deviations, duplicated prose, product default generalizations and simplifying optional variants.

After edits, run the repository data build, inspect the pin/crosswalk and guidance diffs, and replay the specific acceptance cases above. A green build validates identifiers and shape; it cannot prove that a different capability's definition now means the intended control. Render the four diagrams and sequence views once to confirm the changed flow semantics remain legible.

## Evidence sources and limits

Canonical definitions reviewed locally in `data/mitre/atlas/2026.09/ATLAS.yaml`, `data/mitre/d3fend/1.6.0/d3fend.json`, `data/overlay/specializations.yaml`, and `data/cosai/risks.yaml`. Findings cite stable block/edge/pin IDs so line shifts do not break the audit trail. Primary web sources were consulted on 2026-10-03:

- [NIST SP 800-218A](https://csrc.nist.gov/pubs/sp/800/218/a/final): secure development guidance; not a prescribed component naming standard.
- [MITRE D3FEND Hardware-based Process Isolation](https://next.d3fend.mitre.org/technique/d3f%3AHardware-basedProcessIsolation/): exact technical scope of D3-HBPI.
- [vLLM security](https://docs.vllm.ai/en/stable/usage/security/) and [prefix-cache design](https://docs.vllm.ai/en/latest/design/prefix_caching/): implementation evidence; architecture-wide claims should remain vendor-neutral and conditional.
- [Microsoft on-premises data gateway architecture](https://learn.microsoft.com/en-us/data-integration/gateway/service-gateway-onprem-indepth): credential handling and real connector flow.
- [MCP elicitation specification](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation): optional client capability and request protocol, not automatic end-to-end write authorization.
- [OpenAI network guidance](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps): web/app network behavior.
- [OpenAI Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels) and [Anthropic MCP tunnels](https://claude.com/docs/connectors/mcp-tunnels/overview): evidence that an outbound tunnel is a concrete chat implementation, not proof it is universal for low-code platforms.
- [Microsoft Copilot Studio data policies](https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-data-loss-prevention): specific product policy behavior.
- [Anthropic poisoning study](https://www.anthropic.com/research/small-samples-poison): research scope and limits.

No live tenant or deployment was available; conditional findings ask for implementation evidence rather than asserting an unseen configuration is insecure. This review does not revalidate every incident or every exemplar marketing claim. Architecture claims depending on unverified vendor defaults are explicitly called out rather than assumed true.

## Completion fingerprints

SHA-256 values below were computed after the report was drafted; recheck changed files before accepting a remediation. Architecture/guidance counts and table row counts were checked against parsed YAML.

| File | SHA-256 |
| --- | --- |
| `data/reference/architectures/cloud-self-hosted-inference.yaml` | `914decc774425b7b214b24deba75ef86bc5f3a3f3fc385e7d3531fe593e44431` |
| `data/reference/guidance/cloud-self-hosted-inference.yaml` | `647bad1c25b6cad8e00d24c9659f53d8d5d44968f9ad73a4e2398a65161cc9ff` |
| `data/reference/architectures/cloud-training-pipeline.yaml` | `a8b62f67fa5d64c05354d3d2075e87919e9b0b5e58ca4b489f1dc4eebeb14d61` |
| `data/reference/guidance/cloud-training-pipeline.yaml` | `0a93c3b4c7c66b891cba384ac92a1168c5b4895444c95c3da43ee829c525ffc9` |
| `data/reference/architectures/saas-enterprise-ai-chat.yaml` | `1d35ea96c74822fb5eb609b2e3929ac986d32b9491d909a41428abef0ad9e0fd` |
| `data/reference/guidance/saas-enterprise-ai-chat.yaml` | `c0aa427beeaa5e1d0ea0c73890cebfdc3c0d6e916bbfe9869ef655adf1f20b52` |
| `data/reference/architectures/saas-low-code-agent-builder.yaml` | `deb65c0916b2a8ef35ee8887475b51cd84ef859f73b14a74055747172b34d7cb` |
| `data/reference/guidance/saas-low-code-agent-builder.yaml` | `eeca98543fe77492ddf4b02c39cfbf704668d130de4b9c5f06f69e2e937da351` |
| `data/reference/vocabulary.yaml` | `8b699f6387ec1bf5c8e9a55942ebb0a61fd4f4cbecded5c20e9e4e62afa236d5` |
| `data/overlay/mitigations.yaml` | `b56eb2e01c328ac2739db6279dd52c70bed0a3aecc78418a25ed4fba8477edcb` |
| `data/overlay/specializations.yaml` | `2b760c6568fbe7e3bed4d11e4a34be599b7e151d0818468b16757cd04a48c476` |
| `data/cosai/risks.yaml` | `f555670dd51f65360aee32e0b0a0e6284598804f6e0f987a8b8f462a353cf6a8` |
| `data/mitre/atlas/2026.09/ATLAS.yaml` | `935efa93e28294432d3e2f537eb94991ef8d1f8c58341cd360ea3321ddb66688` |
| `data/mitre/d3fend/1.6.0/d3fend.json` | `e1546d432c6aa64d45b62dd9e9484b0774ae84de7ff3605ff9dd4e20278957bf` |
| `data/ONTOLOGY.md` | `0cf7e6b007b4acdc71fb3a59a1f073d95c2fcecf01434a5360a3811fbaec588e` |
| `data/PROVENANCE.md` | `34495a3849c4567a507c97d5e4201abe7459f3b027706ef8a5e80fed43e26a93` |
