# Design assessment — the whole site (2026-09-02)

A walk through every page as a first-time visitor would take it, at 1440px and at 390px,
after the reference page moved to the Focus layout. Recommendations are ranked within each
section; the last section sequences them.

## What already works

- One visual system throughout: mono-caps eyebrows, calm greys, three phase colours that mean
  the same thing on every page. Nothing looks bolted on.
- The map is reused honestly — Risk Map, Components, Frameworks and Incidents all light the
  same drawing — so a reader learns it once.
- Every page opens with a one-paragraph statement of what the page is for. Rare and valuable.
- Deep links exist on every browser (`?risk=`, `?control=`, `?capability=`, `?archetype=`).

## Site-wide

1. **The navigation hides the site's own argument.** The home page says the site is a ladder
   — risk map → taxonomy → capabilities → architectures — but the header shows three items,
   with six of the nine sections folded into a "Risk Map" dropdown and the Risk Map item lit
   on every taxonomy page. Recommend a header that *is* the ladder: `Risk map · Taxonomy ·
   Capabilities · Architectures · Incidents`, where Taxonomy opens the five taxonomy pages.
   Give each page header a small rung indicator ("Rung 2 of 4 · Taxonomy") so a reader always
   knows where they are and what is below.
2. **No search.** 36 risks, 35 controls, 56 capabilities, 23 components, 13 architectures and
   9 incidents, all named, and no way to type a name. A ⌘K palette over the built dataset
   (titles, codes like R23, abbreviations) that deep-links to the right page would be the
   single most useful addition for a returning reader. Static site; the index is already in
   `dataset.json`.
3. **No footer.** Nothing tells a reader which CoSAI commit the data is vendored from, when the
   dataset was generated, the licence, or how to report an error. A slim footer with
   `dataset generated <date> · CoSAI @ <short sha> · 13 architectures under review · GitHub`
   answers the trust question every page raises.
4. **"Under review" is a global state shown locally.** Each architecture and guidance doc carries
   its own amber pill with hover text. Say it once — in the footer or a dismissible banner — and
   keep the per-item pill only where an item's status differs from the rest.
5. **Back-links are uneven.** Components show "Seen in these architectures"; the reference lists
   link out to Risks and Capabilities. Make it symmetric everywhere: each risk, control and
   capability shows the architectures that pin it and the incidents that cite it; each incident
   step's risk chips link to the risk. The ontology already guarantees the data.
6. **Colour carries meaning alone in places.** Introduced/exposed/mitigated dots, red risk chips
   versus green control chips. Add a glyph or a one-letter prefix where colour is the only cue,
   and check the 10.5px grey (`--ink-3`) on white for contrast; it is used for every hint line.
7. **Phone width is an afterthought on the drawing pages.** Home, Risks and Personas read well
   at 390px. The reference drawing and the map are unreadable that small; the reference tab
   strip will wrap. Cheapest honest fix: on narrow screens show the drawing collapsed behind
   a "View the drawing" button and lead with the tabs, and let the tab strip scroll sideways.

## Page by page

### Home
- The hero is strong. The three buttons are equal weight; make "Start the tour" primary and
  demote the other two to links, or turn them into the ladder rungs.
- "The ladder" is a paragraph. Draw it: four rungs left-to-right with a count under each and a
  link on each — it doubles as the site map and replaces the nine-card Explore grid, which
  currently repeats the navigation a third time.
- "Where the data comes from" is four long cards on the landing page. Keep one sentence and a
  link; the full provenance belongs on an About page and in the footer.

### Risk map walkthrough
- Best page on the site. Keep the left rail as is.
- The 36-risk `<select>` is the only way to jump; a compact list with category headings (like
  the Frameworks left column) would make the catalogue browsable while stepping.
- Arrow keys step through risks but nothing on the page says so except a grey hint at top
  right; put "← → to step" next to the Previous/Next pair.

### Risks and Controls
- Two 3,500px accordion lists. Every item is closed, so the page shows 36 titles and one-line
  truncations and asks the reader to open each. Convert both to the master-detail pattern
  Personas already uses: sticky list on the left with category headings, one full item on the
  right, URL updated on selection. Relationships (components, controls, architectures,
  incidents) become visible without scrolling the whole list.
- "Expand all" would then go away; readers who want the full text can print the detail.

### Capabilities
- The matrix is the right shape and reads well. Two things get in a first-time reader's way:
  the Coverage legend and "Edit taxonomy · edited" state appear before anyone has assessed
  anything. Hide the coverage row until the reader opens the assessment drawer, and label the
  button "Assess your posture" rather than "Edit taxonomy".
- Chip labels are abbreviations ("DSPM", "SSE / CASB", "NHI / agent ID"); a hover title with the
  full name is enough, but it must exist on every chip.

### Components
- Good master-detail. The detail lists risks with phase dots and no labels; add the phase
  word on hover or as a legend at the top of the list.

### Personas
- Already the pattern the other taxonomy pages should adopt. "Is this you?" is a nice touch.
  The superseded card at the bottom could be a footnote.

### Frameworks
- Good. "not mapped" rows should say why in one line on the row itself (CoSAI has no matching
  risk, or the entry is a process control). The framework's "How much of CoSAI it reaches"
  counts would be stronger as a small bar.

### Reference architectures (post-Focus)
- The page is now calm. Next steps, in order:
  - Default the tab strip to Sequence flows with the walkthrough selected on first visit, so a
    reader sees the drawing numbered and the sequence beneath it without discovering the tab.
  - Move the surface pills and the picker into the page header row; the white picker box is
    the only card on the page and reads as a form.
  - Add a family comparison (third-party vs first-party coding agents; the three cloud agents;
    the three SaaS drawings) — a two-up view that highlights the blocks and pins that differ.
    The data already records what differs in `distinguishedBy`.
  - Export: PNG/SVG of the drawing beside Export HTML, and a print stylesheet that lays the
    drawing, the walkthrough and the capability list on one page.
  - Deep-linked titles: `<title>` should carry the architecture's name when `?archetype=` is
    set, and an OpenGraph image per architecture would make shared links legible.

### Incidents
- Now that every step carries an authored path, make the reference-architecture view the
  default and the component map the alternate; the drawing is where the story is specific.
- Dates are everywhere but never drawn. A thin timeline strip (May → July) with the current
  step marked would tell the pace of an incident better than the step pills.
- Join incidents to the taxonomy: a risk's page should list the incidents that name it; the
  incident's risk chips should link to the risk.
- The left panel scrolls past the map on a laptop; pin the step navigation (pills + Previous/
  Next) at the top of the panel.

## Sequence

1. Quick wins (each under a day): footer with data provenance; header as the ladder with a rung
   indicator; default tab and deep-linked titles on the reference page; incidents default to
   the architecture view; capability chip titles; hide the coverage legend until used.
2. Medium (two to three days each): ⌘K search over the dataset; master-detail for Risks and
   Controls; symmetric back-links across risks, controls, capabilities and incidents; phone
   layout for the drawing pages.
3. Larger: family comparison view; drawing export and print; incident timeline; OpenGraph
   images.

## Implementation status (same day)

Done, on `main`:
- Header is the ladder; every page header shows its rung. Incidents sit beside it.
- Footer with dataset build date, CoSAI commit, counts and the single under-review note;
  the per-architecture pill is gone.
- ⌘K / Ctrl+K search over risks (with codes), controls, capabilities (with abbreviations),
  components, personas, architectures and incidents.
- Risks and Controls are master-detail pages: sticky grouped list, arrow keys, URL-backed
  selection; risks list the incidents that name them.
- Reference page opens on the full resting drawing (reverted 2026-09-03 from the traced walkthrough at Wade's request), the picker sits in the header, the page
  title names the architecture; on phones the drawing folds behind a toggle and the tabs
  scroll sideways.
- Incidents open on the architecture view, accept `?incident=` links, and their risk chips
  open the risk.
- Capabilities hides the coverage legend until an assessment exists; the button says what it
  does.
- Home page draws the ladder as four linked rungs; secondary buttons are links; provenance is
  three cards, not four.

Corrected on inspection: back-links from risks, controls, capabilities and components to the
architectures already existed, and capability chips already carried full-name titles; the
assessment overstated both.

Still open, in the order I would take them: family comparison view; PNG/SVG export of the
drawing and a print stylesheet; OpenGraph images per architecture; a browsable risk list on
the Risk map walkthrough in place of the select; "not mapped" reasons on the Frameworks rows;
the incident timeline (needs per-step dates in the data); phone layout for the map pages.
