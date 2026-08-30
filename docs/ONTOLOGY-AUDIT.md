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

## Migration tracker — the catalogue moves onto the zone grammar (2026-08-30)

The grammar decision recorded above is made: the zone/flow grammar is promoted out of research
preview into `data/ONTOLOGY.md` §4a and §4b, `data/ONTOLOGY-SPIKE.md` is deleted, and every
architecture migrates. The controls-drawn-as-items backlog is cleared per architecture as part
of its migration rather than as a separate sweep, so the work is done once.

**Baseline at Wave 0 (the number the exercise is about):** 78 distinct block titles of which
51 used once; 174 distinct item labels of which 123 used once. `npm run data` prints this
census on every build. It should only ever go down.

| Wave | Scope | State |
| --- | --- | --- |
| 0 | Promote the grammar; `itemPacks:` and `patterns:` registries; deprecation redirects; vocabulary self-check; band-overlap check; zone support in the HTML exporter | **done** |
| 1 | Endpoint family — third-party, first-party, personal agent, local inference | **done** |
| 2 | Cloud — **chat agent done**; action agent and agent workflow still to do (they are a family: bring them onto the chat agent's shape and land them together), then self-hosted inference, remote MCP server, training pipeline | in progress |
| 3 | SaaS — enterprise AI chat, low-code agent builder, managed agent runtime (one commit) | open |
| 4 | Flip enforcement to errors; close this tracker | open |

**After Wave 1:** 76 block titles (56 once), 166 item labels (125 once), 4/13 architectures
zoned, 0 warnings on the migrated four.

**Now:** 76 block titles (56 once), 165 item labels (126 once), 5/13 zoned, 0 warnings on the
migrated five. The once-used counts stay high because the un-migrated architectures still hold
their one-off names; they come down as each is migrated, not before.

**The cloud shape, established by the chat agent** — the other five cloud architectures copy
it rather than re-deriving it: user band holds the person; the cloud band holds the front end,
the harness, its state, the gateway, our Tool services and Enterprise data; the external band
holds the model provider, third-party Tool services and Downstream services. Columns run
user 0, cloud 1-4, external 5. `patternDataChain` and `patternExternalTools` are both drawn.

### What each remaining architecture needs

Every one needs `zones:`, numbered `flows:`, and the five governance call-outs in place of its
single "Governance plane"-style block. Beyond that:

| Architecture | Specific work |
| --- | --- |
| archActionAgent, archChatAgent, archAgentWorkflow | Split the bundled Tool services per band; `pack: aiGatewayTraffic` on the gateway; separate Enterprise data out of Downstream services so `patternDataChain` can be drawn; reclassify `Schedules & events` (kind `actor`, but it is cloud infrastructure) |
| archSelfHostedInference | `pack: aiGatewayTraffic`; reclassify `Consuming applications` and weight `Storage`, both mis-kinded |
| archRemoteMcpServer | Publisher perspective, so the band mapping inverts; `Service edge` is the crossing; retire `Enterprise IdP` and `Tenant data` per their redirects |
| archTrainingPipeline | The weakest fit — temporally ordered, no crossing component. Sparse bands (cloud, external, governance). `Evaluation & red teaming` stays a block: that is a recorded accepted judgment above, not drift. The `dataOrigins -> curation` edge needs a crossing decision |
| archEnterpriseAiChat, archLowCodeAgentBuilder, archManagedAgentRuntime | The vendor band carries these; §3's three-zone rule becomes geometry. Retire `Tenant/Maker/Customer governance`, `Identity & entitlements`, `Attached knowledge` per their redirects |

### Constraints learned in Wave 1 — do not rediscover these

- **Columns must be assigned left to right in band order.** A band's rect is derived from the
  min..max column of its members, so a band holding column 0 and column 4 stretches across the
  drawing and swallows its neighbours. The build now fails on this.
- **Bands replace frames.** `RF_CONFIG` is empty by design.
- **Check `npm run audit` §4 every wave.** Folding or dropping a block can orphan a risk that
  is pinned nowhere else — that is how `riskCovertChannelsInModelOutputs` was nearly lost.

## Flip-to-error criterion

Vocabulary warnings become build failures when the migration tracker reaches Wave 4 — every
architecture zoned and warning-free. Wave 1 supplied the authoring cycle that was the other
half of the original criterion.
