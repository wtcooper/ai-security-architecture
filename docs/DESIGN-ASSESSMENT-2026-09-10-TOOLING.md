# Design assessment — organisation layer and AI tooling, 2026-09-10

An objective read of what was built in one day, against the framing that emerged at the end of
it: **a reference architecture is a category of tool.** Its drawing pins the controls every
product of that kind needs; a named product inherits that set and only records how its vendor
implements each control. Two perspectives follow — a category with its variants side by side,
and a vendor across categories — and onboarding a product is, first of all, saying which
category it belongs to.

## What held up

- **The data model was already built this way.** A tool must name one architecture, may only
  write control rows for capabilities pinned on it, and the build fails otherwise. The
  reference set is derived, never authored per product. Twenty-five products across five
  vendors were verified against 402 vendor URLs and every one addresses its full inherited set.
- **The organisation layer is text-only, safe to pull over, and reaches every surface.** An
  adopter's standard becomes a framework like OWASP; its ids appear on cards, rails, hover
  cards and in the tooling views without special cases. `local/` never conflicts with upstream.
- **One encoding everywhere.** Status is the tint, vendor coverage is the glyph, and the four
  posture tints are the ones the Capabilities matrix already uses.
- **The skills work.** Both were dry-run by fresh agents; the tooling one produced a complete,
  build-clean fifth vendor.

## What drifted, and the correction

| Built | Problem against the framing | Correction |
| --- | --- | --- |
| Catalogue as the landing view | A wall of text per product; the inherited set was buried in a table below three paragraphs | The product record is reached from a matrix or a vendor row, never as the first thing seen |
| Vendor and surface-class filter rows, then four views | Three taxonomies competed for "what kind of tool is this" (vendor, surface class, architecture); each view re-derived the category | One switch: **by category** or **by vendor**. Surface classes stay as facts on the record |
| Union matrix across architectures, hatched "n/a" cells | Rows from two drawings are not comparable; hatching explained an artefact of the layout | Rows always come from one architecture's pins; the vendor perspective is the cross-category view |
| Coverage bars (C) and scorecards (B) as peers of the matrix | Three ways to say one thing; C solved a column-count problem the category view does not have (≤9 columns) | Dropped. The scorecard bars survive as the per-product line in the vendor perspective |
| `secondaryArchitectures` on a product | Let one product straddle two categories, which is exactly what inheritance forbids; produced the confusing "secondary" cells | Removed. A product with two runtimes is two entities (Cowork local vs cloud is the open case) |
| Tools tab on the drawing as a selector plus a long inline brief | Duplicated the catalogue's text on the architecture page | The Tools tab is the category matrix itself, identical to the AI Tooling view for that category |
| "Only controls in your standard" checkbox | A second definition of "key controls" beside the drawing's pins | Dropped. The pins are the key controls; the row-label switch shows your ids on them |

## The two perspectives, as shipped

**By category.** Pick a reference architecture. A one-line header states the inheritance
("21 reference controls inherited from the drawing, 6 products rated against them"). The
matrix has the pinned capabilities as rows grouped by CoSAI category, the products as columns
grouped by vendor with the organisation's adoption decision under each name, and a row-label
switch between CoSAI names and the organisation's control ids (an organisation row aggregates
the capabilities it maps; the worst status wins). A cell opens the vendor's operator steps.

**By vendor.** Pick a vendor. Its products are grouped under the architectures they
instantiate, and each product carries the adoption pill and two bars against its inherited set:
vendor coverage (native → none) and the organisation's status (enabled → gap). A category
heading jumps to that category's matrix; a product name opens its record.

**The drawing.** The Tools tab on every reference architecture is the category matrix for that
drawing, so the drawing, its reference set and its products read as one page.

## Two audiences, one switch

The pages are information first. With nothing switched on, a general consumer sees the
reference set a category needs, every vendor's products in it, how far each vendor documents
each control (native · partial · external · none · unverified), and a link to the vendor's own
page on the product and on every operator step. Nothing on that view is anyone's posture.

An organisation that has recorded its answers in `data/org` switches the **organisation
overlay** on — one switch, in the footer of every page and beside the matrices, remembered
per browser, on by default when `data/org/local` exists and off on the shipped example. The
same views then gain small status pills on the cells, the organisation's control ids beside the
CoSAI names (and a row-label switch to lead with them), the status column on the product
record, and the organisation's badges on the risk, control and capability cards and the drawing
rails. Adoption decisions appear only on the product record under the overlay; the matrices are
never about decisions.

## Round two: words instead of glyphs, and three shapes to choose from

The half-circle glyphs carried a judgement with no words and no action, and the per-product
bars compressed it further. Coverage is now a plain phrase in a colour — **Settable · Partly ·
3rd-party · Not offered · Unverified** — answering one question, "can an administrator switch
this on in this product?", and every settable or partly settable cell carries ↗, the vendor's
own page for doing so. The same reference set is offered in three shapes, switchable on the AI
Tooling tab and on each drawing's Tools tab, so the one that reads best for leadership can be
kept and the others removed:

1. **Control checklist** — one row per reference control, every product as a chip on the line;
   a row opens to the vendor steps for all products at once.
2. **Grid** — controls × products, each cell a coloured word with its link.
3. **Product cards** — a runbook per product: every reference control, the word, the link. The
   same card grouped by architecture is the vendor perspective.

On the drawing, the tab formerly called *Capabilities* is now **Controls** (the chips are the
control technologies that implement CoSAI controls; each row names them), and the separate
*Controls guidance* tab is folded into it: a control row opens to its pin notes, its CoSAI
controls, the guidance items that cite it, and the products that can switch it on.

## Round three: placements, a browser architecture, and the enterprise layer

**Placements.** Claude Code was always on *Third-party coding & desktop agents*; nothing moved
it. Claude Cowork had been placed on the personal autonomous agent by the research pass, on the
grounds that it works unattended on the user's files. That was the wrong axis: the personal
agent drawing is the OpenClaw class — a self-hosted harness with a bearer-secret serve port and
no vendor control plane. Cowork is a vendor desktop app driven by a present user with the same
managed-settings tier as Claude Code, so it now sits on the desktop-agent drawing and is rated
against its 21 controls. Claude in Chrome was a stretch on the personal agent for the same
reason and now has a category of its own.

**Browser AI agents & extensions** (`archAgenticBrowser`, endpoint rank 5) is the drawing for
agentic browsers and AI browser extensions: an agent that reads pages served by whoever owns
them and acts through the sessions the user is already signed in to. Its distinctive controls
are the browser profile as credential isolation, the secure web gateway as the SSE, site
allowlists as tool scoping, browser detection & response, and extension-store supply chain.
Products in this category so far: Claude in Chrome; the ChatGPT built-in browser, Edge Copilot
Mode, Comet and Dia are exemplars awaiting entries.

**The enterprise layer.** Every control on a product has two halves, and the views had shown
only one. *The product half* is what the vendor lets an administrator set in the tool; that is
the coloured word and the ↗. *The enterprise half* is what the organisation deploys around the
tool — the MDM that delivers a managed-settings file, the endpoint DLP agent that inspects a
prompt the product never sees, the SSE that enforces egress, the SIEM that receives the audit
stream. The reference architecture already encodes this half: each capability is pinned to a
block (the AI gateway, the managed endpoint, the governance plane), and the capability's own
entry names the technology classes it is bought as. So the enterprise half is derived, not
authored per product:

- Under every control, one line — **Enforced at**: the drawing's blocks for that control, dotted
  by who operates them (managed endpoint, enterprise cloud, vendor platform, governance). In the
  grid it is a column of its own. Hovering a block shows the pin's note; opening the control
  shows the notes in full and the classes the capability is bought as.
- With the overlay on, the organisation's **own technology and status for that surface** join the
  line, from a new `data/org/<profile>/capabilities.yaml` (per capability, per surface:
  status, technology, note). This is also the text-file home for the Capabilities tab's posture,
  which had only a browser-side drawer; the drawer still wins in that browser.

The consumable read is therefore: *this control is needed (row) → the product can or cannot set
it (word + link) → it is enforced here in the architecture (blocks) → and we do it with this
(technology + status)*. Nothing is added to a row that a reader has not asked for: the general
view shows the blocks only; the technology and status appear only under the overlay.

What is deliberately not done: no attempt to compute an "effective" combined score from the
two halves. A partly settable product control plus an in-place enterprise control is a judgement
the organisation makes, not one a formula should.

## What onboarding now means

Adding a product is choosing its category and then answering, for each inherited control, how
the vendor exposes it. The `tooling-onboard` skill enforces that order, and the audit lists any
inherited control a product entry has not answered.

## Open items, deliberately left

- Split Claude Cowork into a local (personal agent) and a cloud (managed runtime) entity; the
  cloud rows need their own research pass.
- OpenClaw and Hermes carry no control rows; they predate the registry and are listed as
  unaddressed in the audit.
- The example organisation's status covers three products; a real `data/org/local` makes the
  tints carry the story. The coverage glyphs already do on their own.
- Whether the four posture tints should be stronger for a leadership audience is a one-token
  decision in `src/components/capabilities/status.ts`; nothing else changes.
