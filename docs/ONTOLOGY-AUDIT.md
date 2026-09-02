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
- Bands replace frames; `rf-config.ts` was deleted once every drawing carried them.
- Check `npm run audit` after any fold: dropping a block can orphan a risk pinned nowhere else,
  which is how `riskCovertChannelsInModelOutputs` was nearly lost from the catalogue, and how
  `riskRetrievalVectorStorePoisoning` was caught during the low-code rebuild.

## The rebuild (2026-08-30)

The migration above put every drawing on the grammar. The rebuild that followed asked a harder
question of each one — whether it is *true* — and rewrote all thirteen against research rather
than against the previous drawing. Three rules changed as a result, and each change was made
because a drawing showed the rule was wrong, not because a drawing was inconvenient.

**The crossing rule was removed.** It required a component at every band crossing, and the
catalogue satisfied it four times by inventing an `Egress control` box — a control wearing a
component's name, which is exactly what the rest of the ontology forbids. The rule was
manufacturing the violations it was meant to prevent. It is replaced by an observation that
reports crossings with no inline control pinned; that count is currently zero, so nothing was
lost by removing the coercion.

**The provenance test replaced it, and is now an error.** A component must be a tier somebody
runs. "No controls as components" cannot be taken literally — it would delete the AI gateway,
which is a real tier running real software — so the test is provenance, not vocabulary. The
denylist (`controlBlockTitles`) fails the build; the rebuild took it from six drawn controls to
zero.

**Nesting is unlimited.** `parent:` on a block, at any depth, with `kind: boundary` for pure
containment and `kind: origin` for an anonymous edge source. The sandbox came back on the
personal autonomous agent — the archetype where it is the point — without needing a special
case, and band spans exclude nested blocks because a nested `col` is parent-local.

**Two more checks became errors** once the backlog they tracked reached zero: the provenance
test above, and the pin-placement check. The latter was rewritten first: it demanded an
edge-anchored pin's midpoint fall inside some band, and fired on all four of the catalogue's
band crossings — the one place a control most belongs. It now requires only that the pin sit
within the run its own edge covers, which is what its comment always claimed.

**One pattern gained a precondition.** `patternModelPath` now carries `requiresItem: Model
proxy`. The low-code builder is the single architecture where our gateway brokers no inference
— the vendor calls its own model — and the honest signal for that is the gateway's contents
rather than an exception list.

| | After migration | After rebuild |
| --- | --- | --- |
| Distinct block titles | 68 — 48 used once | **57 — 36 used once** |
| Distinct item labels | 111 — 78 used once | **84 — 47 used once** |
| Controls drawn as components | 6 | **0, and a build failure** |
| Crossings with no inline control | not measured | **0** |

## The review remediation (2026-09-01)

The two-pass architecture review (`docs/refarch-review/`) surfaced rule-level items alongside
the per-drawing fixes. Recorded here as they land:

**The sandbox-frame deviation triple is resolved.** Three drawings carried a deviation whose
stated reason — "a frame inside a band reads as a second boundary of the same kind" — is the
exact claim §4a repudiates. The personal agent's copy was also false about its own file, which
draws the Sandbox frame; it is deleted. The two coding agents keep the item form, but for the
ontology's own reason: their sandbox is a contained execution path inside one application
(harness and shell run as the user; only tool execution is contained, conditionally), which is
the §4 criterion for the **Sandboxed tools item**, not the frame. The deviations now say that.

**Unknown top-level keys in an architecture file now fail the build.** Three files carried the
retired `flows:` mechanism as silently ignored data for a month after its deletion; the
load-bearing prose was migrated into walks and the rest deleted. Retired grammar is deleted,
not ignored.

**A gateway's items must match the traffic it actually brokers.** Three drawings displayed the
`aiGatewayTraffic` pack's Model proxy on gateways with no model anywhere behind them; a fourth
(self-hosted inference) displayed MCP and skills brokers on an inference-only gateway. Each now
lists its real traffic classes with a recorded deviation, the pack's `when:` says so, and the
`patternModelPath` comment no longer claims the low-code builder is the unique case.

**The band-order exception list is now truthful.** Four drawings break left-to-right band
order — the training pipeline (external first, ingest), and all three SaaS drawings (vendor
before our cloud, because the user or maker reaches the vendor first). All four now record it
in `deviations:`; the review guide previously claimed only two did.

**Vocabulary registrations either serve a drawing or carry a pointer.** The review revived four
orphans the drawings had wrongly dropped (Curation & filtering, Evaluation & red teaming,
Model registry, the sources' Self-trained model item) and deprecated seven that duplicated
surviving names or violated the three-zone rule (Chat surface & uploads, Connected systems,
User-connected systems, Serving & consumers, Managed memory/sandbox/tool gateway). The
`capabilityModelScanning` embodiment was re-pointed from the never-registered "Artifact
scanning" to the Private pkg registry, and `capabilityStagedRollout` now applies on the SaaS
surface for customer-owned agent definitions.

## The layout and walk pass (2026-09-02)

- **Governance band geometry moved into the engine.** The band is now derived from the
  content, not from its members: exactly as wide as the ownership bands together, one band
  gutter (12px) beneath them, call-outs spaced across it in authored order and wrapped when
  the drawing is narrower than five call-outs. It had been overlapping the bands above on
  every drawing, overhanging the narrow ones and falling short of the wide ones.
- **Governance call-outs are boxless.** A control is not a component, so the call-out is a
  title tab, an icon and its chip numbers. Capabilities pinned directly on a call-out join its
  chip row rather than hanging from a border it no longer draws.
- **The governance path class is gone.** No live architecture drew one; the legend entry and
  the dotted style were noise. `PathClass` is `primary | external`.
- **Walks are connected by construction.** The build now fails a walkthrough or scenario
  whose step touches nothing the walk has already reached (containment counts). Every walk
  was rewritten as one contiguous sequence with its return legs, so the sequence diagram
  reads as a sequence and the numbered drawing has no orphaned arrows.
- **Grids condensed.** Tool surfaces sit directly beneath the gateway they hang off; the
  external band is one column; the coding agents lost a column each, the cloud trio one, the
  personal agent one column and a row, the training pipeline one column, self-hosted
  inference one row. Risk tags on vertical runs moved off the tab of the block they enter.
