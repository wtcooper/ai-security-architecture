# Reviewing the reference architectures

A briefing for an independent reviewer — human or AI — who is being asked to judge whether the
thirteen reference architectures are **right**, not whether the code that renders them is good.

The question you are answering is: *does this drawing describe a system somebody could actually
build, with the components that really exist, the paths data really takes, and the risks and
controls in the places they really belong?*

Everything a machine can check is already checked and passing. Your value is entirely in the
judgements a build cannot make. §5 tells you what not to bother re-checking; §6 is the actual
review.

---

## 1. What a reference architecture claims here

Each one is a **target state**, not a survey of what any particular organisation runs. It says:
*if you are doing this kind of thing, this is the shape it should have, these are the paths data
takes through it, this is where the controls sit, and these are the risks that surface where.*

Thirteen of them, across three surfaces:

| Surface | Count | Members |
| --- | --- | --- |
| Endpoint | 4 | Third-party coding & desktop agents, First-party coding & desktop agents, Personal autonomous agent, Local model runtime |
| Cloud & hosted | 6 | Single agent workflow, Multi-agent workflow, Chat agent with tools, Remote MCP server you publish, Self-hosted model inference, Fine-tuning and model registry pipeline |
| Third-party SaaS | 3 | Enterprise AI chat with connectors, UI/low-code managed agent runtime, API/SDK managed agent runtime |

They are deliberately **not** all distinct in shape. The three cloud agent architectures are one
drawing three times, differing only in their trigger and fan-out; the two coding-agent drawings
are identical apart from the vendor band. Where two drawings share a pattern, a difference
between them is either meaningful or a defect — there is no third option. That is the single
most productive thing to look for.

---

## 2. The principles

These are stated in full in [`data/ONTOLOGY.md`](../data/ONTOLOGY.md). The short version:

1. **A component is a tier somebody runs.** Not a control, not a checkpoint, not a policy. "AI
   gateway" is a component because it is real software on real infrastructure. "Egress control"
   is not — it is a check that runs somewhere. This is the *provenance test*, and it is the rule
   the catalogue has broken most often historically.

2. **A control is a pin, not a box.** Capabilities appear as numbered chips on the block or edge
   where they are enforced. Risks appear as coded tags where they surface. A control drawn as a
   component states one thing in two grammars and inflates the drawing.

3. **Bands measure who operates the environment, and nothing else.** Six ownership bands —
   `user`, `endpoint`, `cloud`, `vendor`, `external`, `governance` — drawn as full-height
   columns. Not trust level, not network zone, not data sensitivity. One axis only. A band a
   drawing does not need is simply absent.

4. **Reuse before you create.** Every block title and item label must already be registered in
   [`data/reference/vocabulary.yaml`](../data/reference/vocabulary.yaml), or be registered in
   the same change with a reason. Every build prints a census of distinct names; it is meant
   only to go down. Currently 56 block titles and 84 item labels across thirteen drawings.

5. **The three-zone responsibility rule.** What a vendor runs inside their own boundary is never
   drawn — it is assured by assessment (`capabilityAiTprm`) and recorded as one block. Drawing a
   vendor's internal orchestrator implies a visibility nobody has.

6. **Nesting is containment, at any depth.** `parent:` on a block. A sandbox holding a harness
   holding a supervisor and its subagents is three levels and needs no special case.

7. **A number on a drawing is a step you are on.** Sequence data flows are ordered walks over
   real edges. The resting drawing carries no numbers; selecting a walk numbers its steps.

Where a drawing must break a rule, it carries a `deviations:` entry with a stated reason. Those
are load-bearing — read them.

---

## 3. Where the data lives

Everything you need to review is YAML. **You do not need to run the app.**

```
data/
  ONTOLOGY.md                     the rules, in full, with the reasoning
  PROVENANCE.md                   sourcing and vendor-naming policy
  reference/
    vocabulary.yaml               the registry: canonical names, icons, item packs,
                                  edge patterns, control denylists, capability
                                  embodiment map
    architectures/*.yaml          the thirteen drawings — one file each
    guidance/*.yaml               the controls-guidance doc paired to each drawing,
                                  plus tools.yaml — the dated product entries those docs cite
    archive/                      retired drawings, kept intact, excluded from the build
  incidents/*.yaml                real incidents, joined to architectures by id
  cosai/, frameworks/, overlay/   the taxonomies the drawings are anchored to

docs/
  AUDIT.md                        generated — coverage tables, what is and is not pinned
  full-ref-arch-catalog.md        every architecture ever drawn, active and retired, with reasons
  ONTOLOGY-AUDIT.md               the record of rule changes and why each was made
  REBUILD-PLAN.md                 the instruction register from the 2026-08 rebuild
```

Rendering, for reference but not for review:

| Concern | File |
| --- | --- |
| Validation and the generated dataset | [`scripts/build-data.ts`](../scripts/build-data.ts) |
| Geometry — grid to pixels, band rects, pin placement | [`src/lib/flow-layout.ts`](../src/lib/flow-layout.ts) |
| On-screen diagram | [`src/components/reference/FlowDiagramRF.tsx`](../src/components/reference/FlowDiagramRF.tsx) |
| Sequence diagram | [`src/components/reference/FlowSequence.tsx`](../src/components/reference/FlowSequence.tsx) |
| Standalone HTML export | [`src/components/reference/export-html.ts`](../src/components/reference/export-html.ts) |

Run `npm run data` to validate, `npm run audit` to regenerate `docs/AUDIT.md`.

---

## 4. The data model, and what "correct" means for each field

An architecture file has these sections, in this order.

### Identity
`id`, `surface`, `rank`, `title`, `abbrev`, `summary`, `description`, `distinguishedBy`,
`exemplars`, `sources`.

- **`distinguishedBy`** is the argument that this deserves to be its own architecture rather
  than a variant of a neighbour. If you cannot tell two drawings apart after reading both, one
  of them should not exist. Retired candidates and the reason each was cut are in
  `docs/full-ref-arch-catalog.md`.
- **`exemplars`** are named real products, each with an `asOf` date. They are the only place
  vendor names are allowed (see `data/PROVENANCE.md`). Check they are current and honestly
  characterised.

### `zones`
The ownership bands, each with an `owner` from the six, and a `note` saying what the band means
*on this drawing*. Band order is left-to-right by convention, and two drawings deliberately
break it — the training pipeline (external on the left, because it is an ingest architecture)
and the low-code builder (vendor before our cloud, because a maker reaches the platform first).
Both have deviations recording it.

### `blocks`
The components. Each carries `kind`, `title`, `zone`, grid `col`/`row`, an optional `parent` for
nesting, an optional `cosaiComponent` anchor, a `note`, and `items`.

- **`title`** must be a registered canonical name. Titles repeat across bands on purpose —
  "Tool services" is the same component wherever it runs, and the band says whose it is.
- **`items`** are what is inside the tier. Often `pack: <name>`, which is a promise that this
  block is byte-identical to the same block elsewhere.
- **`note`** is where the actual thinking lives. This is the highest-value prose in the file and
  the place to concentrate review effort.

### `edges`
The paths. `from`, `to`, `path` (`primary` = a path we own, `external` = crossing outward,
`governance` = a control-plane relationship), `bidir`, `label`, `note`, and an optional `route`
hint for collision avoidance.

### `pins`
`risks` and `capabilities`, each anchored `at` a block id or an `a->b` edge ref.

- A **risk** answers *what can go wrong here*. Pin it where it surfaces, not where it is
  convenient.
- A **capability** answers *what control must apply here*. Pin it where it is enforced.
- Both carry a `note` explaining the placement. A pin with a generic note is a weak pin.

### `walkthrough` and `scenarios`
Ordered walks over real edges, each step with its own note. Identical in shape and behaviour;
the walkthrough is listed first because it is the complete walk through the architecture, and
the scenarios are the ways it goes wrong. A step's note beats the edge's note, which is how a
round trip means something different in each direction.

### `deviations`
Where the drawing breaks a rule, with the reason. Each is a decision somebody made. Re-litigate
them if you disagree — that is a legitimate review finding.

### Paired guidance
`data/reference/guidance/<same-filename>.yaml` — what to actually enforce, in `build`, `use` or
`hybrid` mode. Every item cites capabilities, and the build fails if a cited capability stops
being pinned on the drawing. **The guidance and the drawing must tell the same story**; a
guidance item with no home on the diagram is a finding either way.

---

## 5. What the build already guarantees — do not re-check these

`npm run data` fails on all of the following. If it passes, these are true.

**References resolve.** Every capability, risk, component, icon, zone, surface and CoSAI anchor
id exists. No duplicate block, edge, item or zone ids. No edge loops back on itself. Every pin's
`at` resolves to a real block or a real edge.

**The grammar holds.** Every block is zoned; band titles are canonical; bands occupy contiguous
column runs and cannot overlap. Every block title and item label is registered in the
vocabulary, carries its canonical icon and kind, and is not a retired name. Item packs resolve.
Registered edge patterns are drawn identically wherever both endpoints appear.

**Controls are not components.** The `controlBlockTitles` denylist and the `controlItemLabels`
denylist both fail the build. An inline capability pinned on an edge must have an embodying
component, or a recorded deviation saying why it was absorbed.

**Walks are real.** Every architecture has a walkthrough with a `moves` line. Every step of
every walk follows an edge that exists (reversing one requires `bidir: true`). Every edge
carrying a risk pin is visited by some walk.

**The drawing is legible.** No two blocks share a grid cell. No edge passes through a block. No
capability chip, risk tag or step badge lands on a block or runs off the canvas.

**Cross-document consistency.** Guidance files are named after their architecture, declare a
mode, carry attribution, and cite only capabilities pinned on the drawing. Ranks are unique
within a surface. Deviations have reasons. The SAIF and CoSAI cross-checks pass.

Two known-open items, both intentional and both reported by `npm run audit`: **7 risks and 12
capabilities are not pinned on any architecture**. Judging whether each of those is a genuine
gap or correctly absent is a reasonable thing to include in your review.

---

## 6. The review

This is the part that needs you. Work one architecture at a time; read the YAML file and its
guidance file together.

### 6.1 Components — is this the right set?

- **Is every block a tier somebody runs?** Apply the provenance test yourself. The denylist
  catches known offenders by name; it cannot catch a new one.
- **Is anything missing that a real deployment of this archetype has?** This is the most
  valuable finding available and the hardest for a machine. Think about what you would actually
  stand up.
- **Is anything drawn that would not exist?** Particularly: has a control been smuggled in
  wearing a component's name?
- **Is the band right?** The test is *who operates this environment* — not who owns the data,
  not how trusted it is. A block in the wrong band makes the whole drawing lie about custody.
- **Is nesting used where containment is real, and not used decoratively?**
- **Do the items match what the tier actually contains?** A pack means "identical to the same
  block elsewhere" — check that claim is true.

### 6.2 Data flows — do the paths make sense?

- **Does every edge describe a connection that would really exist?** Look especially for edges
  that exist to make the diagram tidy.
- **Is the direction right?** A one-way edge drawn as bidirectional overstates what comes back.
- **Is the `path` class right?** `external` should mean the traffic leaves what we operate.
- **Is anything missing?** A path a real system has and the drawing does not is a gap.
- **Do the walks describe what actually happens, in the order it happens?** Read the walkthrough
  as a story. Does it hold together? Would a practitioner recognise it?
- **Is the walkthrough really the normal case?** Three of these were written from scratch during
  the last review because the drawing could describe how the system fails but not how it works.
  That failure mode may not be fully cleared.
- **Do the scenarios earn their place?** Each should show something the walkthrough does not.

### 6.3 Risks — are they in the right places?

- **Is the pin where the risk actually surfaces?** Not on the nearest convenient block.
- **Does the note explain the mechanism**, or merely restate the risk's title?
- **Are risks missing?** Compare against the risk catalogue and against the incidents joined to
  this architecture.
- **Is a risk over-pinned?** The same risk on six blocks usually means it belongs on one.

### 6.4 Capabilities — are the controls right?

- **Is the pin where the control is actually enforced?** A capability pinned on a tier that
  cannot enforce it is the most common failure in this category.
- **Are the controls sufficient for the risks on the same drawing?** Every pinned risk should
  have something answering it, or an honest statement that nothing does.
- **Does the governance band carry what genuinely cannot be enforced inline?**
- **Does the guidance document match the drawing?** Read both. They should describe one system.

### 6.5 Across the catalogue

- **Family consistency.** Compare the three cloud agent architectures against each other, and
  the two coding-agent drawings against each other. Any difference outside what their
  `distinguishedBy` claims is a defect in one of them.
- **Name reuse.** Two names for one concept, or one name covering two concepts.
- **Deviations.** Read all of them at once. A deviation that appears on several drawings is
  usually a rule that needs changing rather than an exception that needs repeating.

### 6.6 Reporting

For each finding: the architecture, the field or block id, what is wrong, and what it should be
instead. Distinguish **defects** (a factual error about how these systems work) from
**judgements** (a defensible choice you would have made differently). Both are welcome; conflating
them is not.

---

## 7. Maintaining these

For anyone changing an architecture rather than reviewing one:

1. **Read `data/ONTOLOGY.md` first.** The rules carry their reasoning, including several rules
   that were removed because they were manufacturing the defects they existed to prevent.
2. **Search `vocabulary.yaml` before naming anything.** Reuse the canonical name if the concept
   matches. If it genuinely does not, register the new name in the same change with a one-line
   reason.
3. **A shared pattern changes everywhere at once.** If two drawings are a family, a change to
   one lands in both in the same commit.
4. **Update the guidance in the same change.** The build enforces the capability citations; the
   prose is on you.
5. **Run `npm run data` and read the tail, not a grep of the output.** A failed build still
   leaves the previous `dataset.json` in place, which has misled at least one author into
   believing a change had no effect.
6. **Run `npm run audit` and diff `docs/AUDIT.md`.** This is how a risk that quietly stopped
   being pinned anywhere gets caught. It has happened twice.
7. **Look at the drawing.** Collision checks prove nothing overlaps; they do not prove it reads
   well.
