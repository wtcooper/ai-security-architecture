# Framework and technology mappings

CoSAI is the canonical source for components, risks, controls, personas, and its own framework
mappings. Nothing in this layer replaces CoSAI controls with NIST controls or changes CoSAI's
NIST AI RMF crosswalk.

## Technology profile

`technology-sources.yaml` contains selected source entries; `../overlay/technology-categories.yaml`
contains 25 technology categories and their explicit many-to-many mappings to source entries
and MITRE mitigations. `scripts/lib/technology-categories.ts` compiles these into the existing
framework index. A technology category is the technology dimension of a capability — a MITRE
mitigation in `../overlay/mitigations.yaml` or a `cap-*` specialisation of one in
`../overlay/specializations.yaml`; categories map to the MITRE parent and a specialisation
inherits them — and it carries no surfaces and no status. The five additional lenses are:

| Lens | Adopted source | Identity and scope |
| --- | --- | --- |
| OWASP AI Solutions | [Solutions Reference Guide Q2/Q3 2025](https://genai.owasp.org/resource/owasp-genai-security-project-solutions-reference-guide-q2_q325/), printed p. 38 | Five explicitly published AI solution categories. Local entry keys; no official category IDs. |
| ENISA ECSMAF | [v3.0, March 2026](https://www.enisa.europa.eu/publications/enisa-cybersecurity-market-analysis-framework-ecsmaf-v3-0), Annex G Table 4, pp. 77–79 | Selected conventional technology categories. Local entry keys. European market-analysis reference, not a global control standard. |
| ECSO Market Taxonomy | [2021 taxonomy](https://ecs-org.eu/wp-content/uploads/2022/10/605de1e3a768a.pdf), Table 2, level 3 | Alternate category references and the Sandboxing naming source. Local entry keys. |
| CISA TIC Capabilities | [Volume 3 v3.3, July 2025](https://www.cisa.gov/sites/default/files/2025-07/CISA%20TIC%203.0%20Security%20Capabilities%20Catalog%20v3.3%20%28Volume%203%29.pdf) | Selected operational functions using official identifiers, including separate file/web DLP. Technology-to-function support links, not category equivalence. |
| NIST CSF | [CSF 2.0](https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf), Appendix A | All 22 official categories; authored category-level links from technologies and 34 CoSAI controls. No subcategory-level or compliance claim. |

The OWASP guide's five category names are pinned intentionally. Later landscape editions
exist but reorganize material at different levels. Descriptions in this profile are authored
summaries, not verbatim upstream definitions. Source labels and document locations are retained
alongside readable display names, e.g. ENISA's “Prevention of enterprise data loss” displayed
as “Data Loss Prevention (DLP)”. OWASP source content is credited under its published
CC BY-SA 4.0 terms; ECSO permits reproduction with source acknowledgement; follow each
publisher's terms when redistributing more than this selected reference material.

All `tech-*` IDs are repository keys. Framework entry slugs such as `dlp` are also repository
keys when `identifierKind: repository-key`; they must never be presented as official IDs.
The UI shows names first, labels local keys explicitly, and retains real CISA/NIST IDs.

## Relationship contract

- `same-category`: terminology alignment with a published technology category; this does not
  claim products in that category have identical functions.
- `narrower`: the technology category covers a subset of the referenced source category.
- `supports`: a possible contribution to a function or outcome, subject to implementation.
- `mitigationMappings`: possible implementations of selected MITRE defensive methods, each
  with its own scope/rationale. Mitigations keep native D3FEND/ATLAS identifiers.

Technology → mitigation → CoSAI control is a navigational path. It never establishes transitive
control fulfillment. For example, DLP may implement only the sensitive-data part of Generative
AI Guardrails. That does not confer all of that broad mitigation's injection, retrieval, or
agent-action protections. Guardrails and LLM firewalls overlap; they are not additive coverage.

Technology categories have no page of their own. They appear as pills on a capability's
detail and beside each pinned capability row on an architecture's Tools tab. Incident links
derive from CoSAI controls.
No product, organization status, architecture pin, or incident evidence is created by these
category associations; status is authored on capabilities only. The existing mitigation pins
and product evidence remain authoritative for those views.

## NIST coexistence and gaps

NIST AI RMF stays in `data/cosai/controls.yaml` exactly as published by CoSAI. New NIST CSF
mappings live only in `technology-sources.yaml`, with per-control rationales, and compile into
`authoredMappings`. The Controls page displays both; the Frameworks page distinguishes
CoSAI mappings from authored ones. CoSAI's User Transparency and Controls has no selected
CSF category mapping; it is not forced into generic awareness or access control. Three CSF
categories currently have no selected mapping and remain visible.

This is a selected profile, not a complete import of every source. Unrepresented technology
areas remain gaps (e.g. a separate DSPM category, model registries, AI gateways, and AI governance
platforms). The underlying MITRE methods and CoSAI controls remain available. Add a category
only with an explicit naming source and scoped mapping; never invent an official identifier.

## Verification

Run `npm run data`, `npm run test:capabilities`, `npm run test:technology`, and `npm run build`.
The tests compare compiled CoSAI core entities to their vendored YAML, check both NIST lenses,
exercise forward/reverse mappings and reject unknown sources, missing rationales, duplicate
identities, and dangling MITRE references. The build validates every framework entry reference.
`/capabilities?capability=<MITRE id or cap-*>` opens an entry, and retired custom-ID links
resolve to their replacement; `/capabilities?category=tech-…` opens it on the
capabilities that category realises — the MITRE parents it maps to and their specialisations —
since a category has no page of its own.
