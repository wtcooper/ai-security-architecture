# Ontology conformance audit — 2026-08-29

One-time audit of all 12 architectures against `data/ONTOLOGY.md` at its adoption, combining
the build's vocabulary warnings with an analytical pass. Ongoing drift is caught by
`npm run data` (vocabulary warnings); this document is the remediation worklist for the
findings that existed at adoption. Status is updated as waves land.

## Findings

| # | Architecture | Finding | Rule | Wave | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | endpoint-coding-agent | One diagram carries an either/or model path (vendored vs OSS edge) | either/or edges banned | A | open |
| 2 | endpoint-personal-agent | Owner's remote path lacks the Remote device component other agent architectures now draw | vocabulary / consistency | A | open |
| 3 | saas-managed-agent-runtime | Vendor tool gateway flows into org data with no customer-owned inline component | zone-3 invariant | B | open |
| 4 | saas-enterprise-ai-chat | Vendor connector broker flows into user-connected systems with no customer-owned inline component | zone-3 invariant | B | open |
| 5 | saas-low-code-agent-builder | Platform connector framework flows into connected systems with no customer-owned inline component | zone-3 invariant | B | open |
| 6 | endpoint-coding-agent (vendored) | Managed/cloud sessions' connector path back into org systems is not drawn at all | zone-3 invariant | B | open |
| 7 | saas-enterprise-ai-chat, saas-managed-agent-runtime | BYOK/CMEK (zone 2) unpinned where vendors support it | zone-2 rule | B | open |
| 8 | cloud-training-pipeline | capabilityModelScanning pinned on base-checkpoint edge with no Artifact scanning component or recorded absorption (build warning) | inline rule | C | open |
| 9 | cloud-action-agent, cloud-chat-agent, cloud-agent-workflow | Egress control is chip-only; the AI gateway blocks lack the Egress allowlist item the personal agent's gateway carries | inline rule / consistency | C | open |
| 10 | endpoint-personal-agent | Item "APIs & connectors" icon globe; vocabulary says plug (build warning) | icon table | C | open |
| 11 | saas-enterprise-ai-chat | Item "Identity provider" icon key; vocabulary says person (build warning) | icon table | C | open |
| 12 | saas-managed-agent-runtime | Front-end item "User identity" should be canonical "Identity binding" (build warning surfaces as missing IGA embodiment) | vocabulary | C | open |
| 13 | cloud-chat-agent | Internet-facing front end absorbs Service-edge duties (rate limiting chip on entry) without a recorded absorption | absorption rule | C | open |

## Accepted judgments (no change required)

- **Evaluation as block vs governance item** — training pipeline draws it inline because
  candidates flow through the gate; agent architectures keep it as a management control.
  Explained by the enforcement classification; both correct.
- **Sandboxing's three forms** (frame / Sandboxed tools item / Managed sandbox block) —
  codified in ONTOLOGY.md §4 with selection criteria.
- **"Identity & secure edge" (enterprise chat)** — a combined IdP + Service edge block;
  accepted as the embodiment of both capabilities on that drawing (vocabulary aliases it).
- **Zone-2 pins on provider blocks** (managed-runtime guardrails, enterprise-chat
  injection-defense notes) — customer configuration of a vendor surface, exempt from the
  inline rule by the provider-kind carve-out in the build check.

## Flip-to-error criterion

Vocabulary warnings become build failures when this table reaches zero open findings and
one full authoring cycle (one new architecture) has passed without a false positive.
