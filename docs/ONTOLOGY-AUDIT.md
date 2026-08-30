# Ontology conformance audit — 2026-08-29

One-time audit of all 12 architectures against `data/ONTOLOGY.md` at its adoption, combining
the build's vocabulary warnings with an analytical pass. Ongoing drift is caught by
`npm run data` (vocabulary warnings); this document is the remediation worklist for the
findings that existed at adoption. Status is updated as waves land.

## Findings

| # | Architecture | Finding | Rule | Wave | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | endpoint-coding-agent | One diagram carries an either/or model path (vendored vs OSS edge) | either/or edges banned | A | done (Wave A, 2026-08-29) |
| 2 | endpoint-personal-agent | Owner's remote path lacks the Remote device component other agent architectures now draw | vocabulary / consistency | A | done (Wave A, 2026-08-29) |
| 3 | saas-managed-agent-runtime | Vendor tool gateway flows into org data with no customer-owned inline component | zone-3 invariant | B | done (Wave B, 2026-08-29) |
| 4 | saas-enterprise-ai-chat | Vendor connector broker flows into user-connected systems with no customer-owned inline component | zone-3 invariant | B | done (Wave B, 2026-08-29) |
| 5 | saas-low-code-agent-builder | Platform connector framework flows into connected systems with no customer-owned inline component | zone-3 invariant | B | done (Wave B, 2026-08-29) |
| 6 | endpoint-coding-agent (vendored) | Managed/cloud sessions' connector path back into org systems is not drawn at all | zone-3 invariant | B | done (Wave B, 2026-08-29) |
| 7 | saas-enterprise-ai-chat, saas-managed-agent-runtime | BYOK/CMEK (zone 2) unpinned where vendors support it | zone-2 rule | B | done (Wave B, 2026-08-29) |
| 8 | cloud-training-pipeline | capabilityModelScanning pinned on base-checkpoint edge with no Artifact scanning component or recorded absorption (build warning) | inline rule | C | done (Wave C, 2026-08-29) |
| 9 | cloud-action-agent, cloud-chat-agent, cloud-agent-workflow | Egress control is chip-only; the AI gateway blocks lack the Egress allowlist item the personal agent's gateway carries | inline rule / consistency | C | done (Wave C, 2026-08-29) |
| 10 | endpoint-personal-agent | Item "APIs & connectors" icon globe; vocabulary says plug (build warning) | icon table | C | done (Wave C, 2026-08-29) |
| 11 | saas-enterprise-ai-chat | Item "Identity provider" icon key; vocabulary says person (build warning) | icon table | C | done (Wave C, 2026-08-29) |
| 12 | saas-managed-agent-runtime | Front-end item "User identity" should be canonical "Identity binding" (build warning surfaces as missing IGA embodiment) | vocabulary | C | done (Wave C, 2026-08-29) |
| 13 | cloud-chat-agent | Internet-facing front end absorbs Service-edge duties (rate limiting chip on entry) without a recorded absorption | absorption rule | C | done (Wave C, 2026-08-29) |

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

## Wave record

- Wave A (endpoint split): findings 1-2. Wave B (zone-3 components + BYOK): findings 3-7 —
  finding 4 resolved as a recorded absorption per the ontology's option-B rule, since no
  customer component can sit on a SaaS-to-SaaS grant path. Wave C (inline/naming/icons):
  findings 8-13. `npm run data` reports vocabulary: conformant as of Wave C.

## Migration complete (2026-08-30)

The grammar decision recorded above is made and executed. The zone/flow grammar is promoted
out of research preview into `data/ONTOLOGY.md` §4a and §4b, `data/ONTOLOGY-SPIKE.md` is
deleted, and **all 13 architectures are on it with zero conformance warnings**. The
controls-drawn-as-items backlog is closed: all 31 instances were cleared as part of the
architecture that carried them, so the work was done once rather than twice.

### What the exercise was actually about

| | Before | After |
| --- | --- | --- |
| Architectures | 15 (two were duplicates in a second grammar) | 13 |
| Distinct block titles | 78 — **51 used exactly once** | 68 — **48 used once** |
| Distinct item labels | 174 — **123 used exactly once** | 111 — **78 used once** |
| On the zone grammar | 2 of 15 | **13 of 13** |
| Conformance warnings | 165 | **0, and now a build failure** |

Every build prints the census line, so the number stays visible. It should only go down.

### What the build now enforces

- **`zones:` is mandatory.** A drawing without bands is unfinished, not older.
- **Conformance is a failure, not a warning.** An unregistered block title or item label, a
  control drawn as an item, icon drift, or a retired name all fail the build and name the
  surviving alternative.
- **Pattern conformance.** If a drawing has the blocks a registered pattern requires, it must
  draw that pattern's legs with the registered path class, direction and label. This is
  ONTOLOGY rule 9 mechanised. It enforces meaning, not routing — `route` is a layout hint for
  collision avoidance, and enforcing it would set the registry against the collision checker.
- **Bands may not overlap.** A band's rect comes from the min..max column of its members, so
  non-contiguous columns make bands draw on top of each other.

### Conventions with recorded exceptions

- **Left-to-right band order** is a strong convention, not a law. The training pipeline draws
  external on the left because it is an ingest architecture — the outside world is its source,
  not its destination — and the low-code builder draws the vendor band left of our cloud band
  because the maker reaches the platform before anything of ours. Forcing either to canonical
  order would make the drawing lie about direction.
- **Evaluation & red teaming stays a block** in the training pipeline: candidates flow through
  it. Everywhere else evaluation gates change rather than data and is a call-out.
- **Enterprise chat's connector path has no crossing** because it never touches our network.
  The deviation is recorded rather than papered over.

### Reuse decisions worth remembering

Reused rather than coined: a supervisor's loop is an `Agent loop`; a policy-and-records
retrieval index is a `Search index`; `App & API surface` became `App & API endpoint`.

Registered deliberately, with the reason in the vocabulary entry: `Triggers & schedules` (drawn
as an actor, but it is infrastructure we operate, and the endpoint agents' nearest equivalent
is a heartbeat inside the harness rather than a thing that calls it), `Consuming applications`
and `Local applications` (both drawn as actors, both software), `Local API server`, `Case
state`, and the training pipeline's lifecycle vocabulary.

Retired, each carrying its replacement so the build says what to do rather than only what is
wrong: `Governance plane` and its Tenant/Maker/Customer variants → `patternGovernanceBand`;
`Internal MCP & APIs` and `Remote tool services` → `Tool services`; `Enterprise systems`,
`Tenant data` and `Attached knowledge` → `Enterprise data`; `Enterprise IdP` and `Identity &
entitlements` → `Identity services`.

### Constraints learned during the migration

- Columns must give each band a contiguous run — now build-enforced.
- Bands replace frames; `RF_CONFIG` is empty by design.
- Check `npm run audit` after any fold: dropping a block can orphan a risk pinned nowhere else,
  which is how `riskCovertChannelsInModelOutputs` was nearly lost from the catalogue.
- `Egress control` went from registered-but-unused to four uses. When the crossing rule bit on
  an artifact fetch, the honest answer was already in the registry — which is the reuse rule
  working rather than a coincidence.
