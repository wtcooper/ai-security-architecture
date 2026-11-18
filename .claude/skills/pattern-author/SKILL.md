---
name: pattern-author
description: Create a new pattern (a reference architecture for one kind of AI tool or application) in this repository, or restructure an existing one, so that it meets the pattern standard — the trust-boundary drawing, one-liners, boundary crossings, pinned controls and risks, sequence flows, guidance and finder entry — and passes the build, the drawing audit and the tests. Use this whenever someone asks to add, draw, create or author a pattern or reference architecture, to turn a pattern-research finding into a pattern, to "add a pattern for X", to split one pattern into two, or to fix a pattern that fails the drawing audit — even if they call it a diagram, an architecture or a blueprint. Not for adding a product to an existing pattern (tooling-onboard), for deciding whether a new pattern is warranted (pattern-research), or for recording an organisation's control status (org-taxonomy-customize).
---

# pattern-author: add a pattern that meets the standard

A pattern is the unit this site is built on: one kind of AI tool or application, drawn with its
trust boundaries, with the controls an organisation needs numbered onto the drawing where each
one goes. Readers pick a pattern and act on it, so a pattern that is vague, inconsistent with
its neighbours or unreadable on a laptop costs them more than a missing one.

Nothing here is drawn by hand. You author data; the site lays the drawing out, and three
checks tell you whether it is good: the build (is it consistent?), the drawing audit (is it
readable?) and the tests (does it meet the standard?). The work is a loop against those three
until they are clean, followed by looking at the result.

Read these before authoring. They are the rules; this skill is the route through them.

- `docs/PATTERN-STANDARD.md`: what a complete pattern must meet (layout L1–L8, structure
  S1–S7, content C1–C9).
- `data/ONTOLOGY.md` §4 to §7: how things are represented, the fourteen rules, the families
  that must stay in step, and the authoring checklist.
- `data/reference/vocabulary.yaml`: the registered names for boxes, items, labels and
  boundaries. Reuse before you create.

## 1. Be sure it is a pattern

A new pattern is justified when its drawing differs from every existing one: who runs each
part, where the agent or model runs and what it reaches, what crosses a trust boundary and
through what, or where the controls go and who holds them. A new product, vendor or model that
leaves those four answers unchanged is an example or a tool of an existing pattern, and
belongs to `tooling-onboard`.

```bash
npm run data
node .claude/skills/pattern-author/scripts/pattern-map.mjs                 # every pattern
node .claude/skills/pattern-author/scripts/pattern-map.mjs <id-or-slug>    # one, in full
```

If a `pattern-research` report recommended this pattern, start from its entry. If the person
described it in conversation, state the four answers back to them and name the nearest
existing pattern before writing anything. That one exchange prevents most wasted patterns.

Settle three things now, because everything else follows from them:

- **Where it belongs:** `surfaceEndpoint` (tools on your devices), `surfaceSaas` (AI services
  you subscribe to) or `surfaceCloud` (AI you host yourself: agents, model inference, MCP servers). This picks the drawing's
  template and the file's prefix.
- **Its family and nearest sibling.** Patterns in a family share most of their drawing by
  rule (ONTOLOGY §6, "Families that must stay in step"). Your pattern should differ from its
  sibling only where it really differs, so a reader flipping between them sees the difference
  and nothing else.
- **Its one sentence:** "Use this pattern when …", in the reader's words.

## 2. Start from the nearest sibling

Copy the sibling's file to `data/reference/architectures/<surface>-<slug>.yaml` (prefix
`endpoint-`, `saas-` or `cloud-`; the file name is the page address) and change it into the
new pattern. Starting from a sibling is what keeps shared structure identical: the same box
names, the same chain to data, the same control-plane boxes, the same positions.

[references/pattern-file.md](references/pattern-file.md) describes every field, what the
build requires of it and how to word it. The judgment calls:

- **Boxes are things somebody runs.** If you cannot name the class of product that sits there,
  it is not a box. A control is never a box unless data flows through it; it is a pin.
- **Names come from the vocabulary.** Search `vocabulary.yaml` (`components:`, `itemPacks:`,
  `patterns:`) first. A new name is registered there in the same change, with a line saying
  why no existing name fits.
- **Boundaries say who operates a thing, nothing else.** People stand outside every boundary.
  Anything the organisation holds an agreement for is in the vendor boundary; the external
  band keeps the open web and public sources.
- **Risks pin where they materialise; controls pin where they are enforced.** Every control
  must be one the catalogue says applies on this pattern's surface. Add new controls at the
  end of the list so that sibling patterns' chip numbers are not what you are thinking about,
  and so that a later edit never renumbers this one.
- **Every flow that crosses a boundary states what it passes through** (`crossing`), and that
  statement must agree with the controls pinned on the flow and its two ends. A `direct`
  crossing ("nothing of ours in the path") is a finding to show, not a mistake to hide.
- **Vendor internals are assured, not drawn.** What a vendor does inside its own boundary gets
  an assessment control on the vendor's box and no more.
- **Write the notes.** Every box, flow and pin has a `note`: what it is and why it matters
  *here*. They are the hover text and the How it works list; a pattern without them is a
  picture, with them it is an argument.
- **Every control pin says what to do and why, in plain words.** `do` is one sentence that
  starts with a verb and names the thing and the place ("Give the session a token that
  reaches one repository and one branch and cannot push to the main branch, approve or
  merge."). `why` is what goes wrong without it ("The session can then propose a change but
  cannot ship it."). They are the headline of the control's row on Enable, read by whoever
  has to put the pattern in place, who is usually not a security architect: write "identity
  provider" not "IdP", "outbound connections" not "egress", "the agent" not "the harness",
  and spell out what an abbreviation means or leave it out. Say only what the `note` says;
  the `note` keeps the precise version for the architect.

## 3. Write what surrounds the drawing

A pattern is not complete with its drawing alone. In the same change:

1. **Finder entry**: add the pattern to `data/overlay/patterns.yaml` with its `useWhen`
   sentence and the search words a reader might type that its text does not contain. The
   build fails without it.
2. **Guidance**: `data/reference/guidance/<surface>-<slug>.yaml`: an overview and at least
   four items whose titles are actions ("Hold the crossing's keys, and scope what the product
   may reach"), each citing controls the pattern pins. It is shown under How it works, as the
   reasoning behind the controls; Enable itself carries no prose.
3. **Sequence flows**: one complete `walkthrough` and at least two `scenarios`, one of them
   adversarial. Every step follows a real flow. Every risk pinned on a flow must be visited by
   some walk.
4. **Examples and sources**: dated `exemplars` (real products, each with a note and an
   `asOf` month) and `sources`. Read each page before citing it; do not cite from memory.
5. **For a pattern the organisation hosts** (`surfaceCloud`): its mapping onto each platform
   in `data/clouds/aws.yaml`, `azure.yaml`, `gcp.yaml` and `onprem.yaml` (the organisation's own
   data centre): which service or software plays each box, and a setting that delivers every
   pinned control. Read the vendor's current page for every service and setting you name, and
   record what you read: `verified` (the day), `sources` (block id to the page), `differences`
   (each flow or box where that platform does not follow the drawing, in plain words, with the
   page that shows it: does the model call really pass the gateway, is search a feature of the
   model platform, does the sandbox have a network at all), `alsoNeeded` (identity, network,
   keys, secrets, registry, logging and ingress services that are not boxes) and `quickstart`
   (the vendor's own starting point). Do not write commands that create or change anything; a
   setting may carry a read-only `check` taken from the vendor's command reference. If the
   mapping is out of scope for now, say so plainly when you report; the Enable tab will show
   the pattern without platform settings.
6. **At least one catalogued product** via `tooling-onboard`, or a plain statement that none
   is catalogued yet.

## 4. Loop until the three checks are clean

```bash
npm run data                                  # consistency: fix every error it names, then read the warnings
npm run drawing:audit -- <surface>-<slug>     # readability: every finding, spelled out
npm test                                      # the standard, for all patterns
```

The build's errors each name the file, the field and usually the fix. The audit's findings are
rule codes; [references/layout.md](references/layout.md) explains how the drawing is laid out
from your `col`, `row` and boundaries, and what to change for each code. Fix causes, not
symptoms: an arrow that runs through a box is almost always two connected boxes placed too far
apart, and moving one is better than any routing trick.

The audit must end at **0 findings**. Items it lists as "open" are questions about the pattern
(a control-plane box that owns no control, for example): resolve each, or record in the
pattern's `deviations` why it stands.

Then run the sibling check: print the sibling with `pattern-map.mjs` beside yours and confirm
that everything the two share is named, ordered and placed the same way.

## 5. Look at it

The checks cannot judge whether the drawing reads as a picture (rule L8).

```bash
npm run dev      # open /patterns/<surface>-<slug>/
```

At a 1366px-wide window, check: the eye can follow each flow end to end; related boxes sit
together; no label is ambiguous about which arrow it belongs to; every tab works (Enable shows
a chip for every control, Risks a tag for every risk, Flows numbers each walk); the pattern
appears on the home page finder and is found by its own title and by the words a reader would
use. If the pattern has platform mappings, set **Built on** to each cloud and to On-premises
and confirm: no service name is cut on the drawing, every ≠ mark sits on the flow or box it is
about, How it works lists the differences and the supporting services, and every control row
names an option for that platform.

## 6. Finish the paperwork

- Add the pattern's row to the sign-off table in `docs/PATTERN-STANDARD.md` (size, scale at
  1366px, notes from the viewing).
- Update the pattern counts and the pattern table in `README.md`, and the family table in
  `data/ONTOLOGY.md` if the pattern joins or founds a family.
- Run `npm run audit` to regenerate `docs/AUDIT.md`.
- Anything you decided against the rules goes in the pattern's `deviations`, with the reason.

Report to the person: the pattern's address, its size on the drawing audit, what it shares
with its sibling and where it differs, and every open question or deviation, stated plainly.
Commit only if asked to.

## Changing an existing pattern

The same loop applies. Two extra cautions: a change to a structure a family shares lands in
every member in the same change, and controls are only ever appended, because existing chip
numbers are cited in guidance, incidents and people's own notes.
