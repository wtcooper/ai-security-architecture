# Technology capability taxonomy options

Research date: 2026-09-18. **Decision implemented: OWASP-led, sourced technology categories with
ENISA/ECSO terminology and supplementary CISA/NIST mappings. CoSAI remains canonical.**

Implementation source check found ENISA ECSMAF **3.0 (March 2026)**, superseding the v2.0
candidate assessed below. The adopted ENISA entries use v3.0 Annex G, Table 4 (pp. 77–79),
which explicitly includes endpoint protection / EDR, SOAR and secure enclaves. OWASP naming
pins the explicit Q2/Q3 2025 category table; the later landscape releases are contextual
references, not silent category renames. See [the implemented contract](../data/frameworks/README.md).

The candidate comparison below records the research preceding selection.

The comparison uses the 56 original entries in `data/overlay/capabilities.yaml` at commit
`1347179`, before their replacement by MITRE functions. The current MITRE entries are now
called **Mitigations**. CoSAI remains the source of **Controls**. The **Technology
Capability** catalogue describes recognizable deployable technology categories.

## Findings

Published technology-category taxonomies do exist. However, a market taxonomy, a catalogue
of defensive functions, and a machine-readable format for implementation evidence solve
different problems. No reviewed source provides all 56 original concepts as equivalent
technology categories with maintained CoSAI and D3FEND/ATLAS crosswalks.

Our original list itself mixed platforms, mechanisms, engineering practices and artifacts.
Do not force every old row into the new technology layer. For example, an AI gateway is a
technology category; output encoding is a defensive mechanism; an AI bill of materials is
an artifact produced and consumed by tooling. Their relationships should remain explicit.

The judgments below are this repository's research assessment, not mappings published or
endorsed by the source organizations.

## Candidates

| Candidate | What it supplies | Identifiers and mappings | Fit and limitations |
| --- | --- | --- | --- |
| **ENISA ECSMAF v2.0, Annex 4** (March 2023) | A cybersecurity market value stack with recognizable software, hardware and service categories. Explicit entries include enterprise DLP, CASB, CSPM, application security testing, IAM/IGA/PAM and vendor risk management. | Named categories and table hierarchy; no MITRE-style identifier for each market category in the inspected table. No ready-made CoSAI/MITRE crosswalk. | Strong traditional technology-category base. Its age and market scope leave AI-specific categories absent. Do not relabel CSPM as AI-SPM or infer that an endpoint protection category equals every EDR function. |
| **ECSO Market Taxonomy** (2021 publication) | Three levels: NIST-style capability, solution category, and product/service group. Explicit groups include Data Leakage Prevention, CASB, sandboxing, encryption, vulnerability management and security testing. | Recognizable names nested under the five older NIST CSF functions. That organization is not a detailed control-implementation mapping. | A simpler product/service hierarchy. Related to ENISA's lineage, so these are alternative bases rather than independent catalogues to stack together. Limited modern AI specificity. |
| **OWASP GenAI Security Solutions Landscape** (Q2/Q3 2025 guide; Q2 2026 landscape updates) | Published emerging solution categories, lifecycle tasks, and solution-to-risk listings. The guide's category table explicitly includes AI Security Posture Management, LLM Firewall, LLM Guardrails, LLM Automated Benchmarking, and Agentic AI App Security. | Category names rather than a stable numbered category registry. Risk/lifecycle mappings are published, but product-directory claims are not proof of implementation or a category-to-CoSAI crosswalk. | Strongest open candidate for the AI-specific part. Still evolving; its categories and task labels differ in granularity. Traditional categories need another source. |
| **CISA TIC 3.0 Security Capabilities Catalog v3.3** (July 2025) | Named security capabilities with descriptions, organized into universal capabilities and enforcement-point families. | Official capability identifiers and NIST CSF 2.0 mappings. Examples: file DLP `3.PEP.FI.DLPRE`, web DLP `3.PEP.WE.DLPRE`, and secrets management `3.PEP.ID.SMANA`. | Strongest candidate when identifiers and government-published mappings matter. It mixes mechanisms, processes and technology functions, and repeats capabilities by enforcement point. Not a market-category catalogue covering AI-SPM/CASB-style platforms. |
| **CSA Enterprise Architecture + SECaaS categories** | Architecture/service capabilities and cloud security service categories. SECaaS explicitly names DLP as Category 2. | EA has hierarchy and relationships; SECaaS has numbered categories. The inspected public materials do not provide a current all-in-one AI technology catalogue with MITRE mappings. | Useful cloud architecture reference. EA guide is dated 2021 and the cited SECaaS DLP guide 2012; insufficient as the sole source for the original AI/agent list. |
| **Gartner market categories** | Buyer-facing technology terminology. Public 2026 research distinguishes AI application security, AI usage control, AI governance platforms and AI gateways; its market directory also recognizes DSPM. | Market names rather than an open, versioned capability-ID ontology or published CoSAI/MITRE crosswalk. | Strong commercial vocabulary, especially for emerging categories. An analyst market classification, not an open standard; suitable as a cited naming source, less convenient as a directly vendored authoritative catalogue. |

Sources: [ENISA publication](https://www.enisa.europa.eu/publications/enisa-cybersecurity-market-analysis-framework-ecsmaf-v2.0),
[ENISA Annex 4, printed pp. 57–62](https://www.enisa.europa.eu/sites/default/files/publications/ENISA%20Cybersecurity%20Market%20Analysis%20Framework%20%28ECSMAF%29_Updated.pdf),
[ECSO taxonomy, Table 2](https://ecs-org.eu/wp-content/uploads/2022/10/605de1e3a768a.pdf),
[OWASP guide, printed pp. 37–39](https://genai.owasp.org/resource/owasp-genai-security-project-solutions-reference-guide-q2_q325/),
[OWASP current initiative and releases](https://genai.owasp.org/initiatives/ai-security-solutions/),
[CISA catalogue, Tables 4, 6 and 15](https://www.cisa.gov/sites/default/files/2025-07/CISA%20TIC%203.0%20Security%20Capabilities%20Catalog%20v3.3%20%28Volume%203%29.pdf),
[CSA EA guide](https://cloudsecurityalliance.org/artifacts/enterprise-architecture-reference-guide-v2),
[CSA SECaaS DLP](https://cloudsecurityalliance.org/artifacts/secaas-category-2-data-loss-prevention-implementation-guidance/),
[Gartner's August 2026 market categories](https://www.gartner.com/en/newsroom/press-releases/2026-08-26-gartner-forecasts-the-market-for-securing-ai-will-reach-almost-5-billion-in-2027),
[Gartner DSPM market](https://www.gartner.com/reviews/market/data-security-posture-management).

## What these options mean for the original list

This is a fit assessment, not an adopted migration table. A broad source category can group
several original features without being equivalent to each of them.

| Original area | Best candidates to evaluate | What must remain explicit |
| --- | --- | --- |
| AI DLP, encryption/key management, IAM, secure service edge, endpoint protection, application testing, vulnerability management, third-party risk | ENISA/ECSO; CISA for operational functions | Preserve the AI deployment context and specific feature evidence. A general market category does not prove AI-specific protection. |
| AI-SPM, runtime guardrails, AI red teaming/evaluation, AI gateway | OWASP; Gartner for market naming | Preserve input/output/tool boundaries and separate posture assessment from runtime enforcement. Gateway functionality and gateway placement are distinct. |
| DSPM, AI governance platforms, shadow AI discovery | Gartner and OWASP's detailed solution/function listings | Check whether a term is an explicit category, a feature label, or a vendor description. A directory listing alone is insufficient to establish an authoritative category definition. |
| Non-human identities, secrets, authorization, credential isolation | CISA and CSA architecture references; OWASP agentic lifecycle guidance | Generic identity capability support is broader than agent-specific delegation or isolation. |
| Provenance/lineage, model scanning, confidential computing, privacy-enhancing technologies, content watermarking | Further category-specific sources needed for exact matches | The reviewed general catalogues do not establish a clean, complete set of equivalent named technology categories. Do not silently substitute encryption for confidential computation or privacy-preserving computation. |
| Output encoding, least agency, action authorization, human approval, rate limiting, kill switches | Primarily the Mitigations layer; implemented by one or more technology categories | These are often mechanisms or configuration requirements within products. Making each a peer of CASB would repeat the original granularity problem. |
| AI BOMs, model documentation, signed artifacts | Artifacts and features of registry, governance, and supply-chain tooling | Do not treat an artifact format or engineering output as if it were a product category. |
| Agent memory protection, behavioral drift, MCP supply-chain security, retrieval integrity | OWASP agentic guidance and MITRE functions | Published guidance exists, but that does not automatically establish a separate standardized technology market category for each mechanism. |

CASB was not its own row in the original 56-entry catalogue; the closest original grouping
was **Secure service edge for AI services**. Adding CASB as a separately sourced category
would therefore be a deliberate improvement rather than a literal restoration.

## Options for a decision

1. **ENISA + OWASP — initial recommendation before prioritizing OWASP recognition.**
   ENISA provides traditional technology categories; OWASP supplies published AI-specific
   categories. Use only entries actually named by the selected sources. Clearly identify
   repository keys and authored crosswalks. Accept explicit gaps instead of inventing new
   categories. This is a composite profile, not a new upstream standard.
2. **ECSO + OWASP — simpler hierarchical alternative.**
   Prefer ECSO's three-level product/service tree over ENISA's market value-stack structure.
   Retains recognizable categories but uses an older conventional security baseline.
3. **CISA TIC + OWASP — prefer official operational identifiers.**
   Gains capability identifiers and NIST mappings. Tradeoff: the technology layer stays
   closer to defensive functions and deployment points, with more conceptual overlap with
   Mitigations.
4. **Gartner-led market naming — prefer procurement vocabulary.**
   Most directly speaks to buying/platform decisions. Would require maintaining a sourced
   selection across reports and market definitions, rather than importing one open catalogue.
5. **One source only.**
   ENISA/ECSO alone favors conventional tooling; OWASP alone favors AI. Neither inspected
   source provides the desired breadth. Keep unmatched areas visibly absent.

## Data model after selection

**Technology capability → implements mitigation → supports CoSAI control**

These are many-to-many relationships. Keep the MITRE entity's original type
(`defensive-technique` or `mitigation`) even though the app groups both under Mitigations.
Do not include ATLAS adversary techniques in this defensive catalogue.

Technology entries should carry source name, source version, exact source category label,
source URL/location and a clearly local key when the source supplies no official ID.
Mappings need scope and rationale. Product-specific evidence should remain distinct from
the generic statement that a category can implement a mitigation. Do not infer product
coverage or completed controls transitively from category membership.

MITRE ATT&CK's [Data Loss Prevention (M1057)](https://attack.mitre.org/mitigations/M1057/)
is still a mitigation, despite sharing its name with a technology category. If added later,
it belongs in Mitigations with its ATT&CK provenance, linked to the separate DLP technology
category rather than substituted for it.

## Relevant standard that is not a naming catalogue

[NIST OSCAL's Component Definition model](https://pages.nist.gov/OSCAL/learn/concepts/layer/implementation/component-definition/)
can represent components, group them into capabilities, and document control support.
It addresses the desired implementation-to-control relationship, but does not supply an
enumerated DLP/CASB/AI-SPM category vocabulary. It could be a future interchange format;
adopting it would not resolve the source-selection decision.

Likewise, NIST CSF, SCF and CSA AICM are useful control/outcome references, not substitutes
for the missing product-category layer. No change to CoSAI Controls is proposed.

## Verification notes

- Inspected the original 56 titles directly from Git history.
- Read and visually checked the ENISA Annex 4 and ECSO Table 2 category tables.
- Downloaded CISA's original v3.3 PDF; its title page states July 2025 and its tables provide
  capability identifiers and NIST mappings. Some web search metadata reports different dates;
  the publication's own version/date is used here.
- Read OWASP's category table and the Q2 2026 initiative/release pages. The newer landscape
  publication does not imply every term in the older guide has a newly versioned definition.
- No claim of exhaustive worldwide absence: the conclusion is that no inspected candidate
  is an exact, complete replacement for the original list.
- The user selected an OWASP-led composite profile, with ENISA/ECSO/CISA/NIST views.
- `data/frameworks/technology-sources.yaml` records the exact adopted source entries.
- All 35 CoSAI controls and their existing NIST AI RMF mappings remain unchanged.
