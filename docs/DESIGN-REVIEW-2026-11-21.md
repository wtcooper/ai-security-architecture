# Design review, 2026-11-21

An independent review of the whole application's look and feel, made against a static build at
1440×900 and 390×844 with Playwright: hovering, keyboard use, opening rows, switching tabs,
zooming and expanding the drawing, picking walks and searching. Recommendations are prioritised
P1 (do now), P2 (worth doing) and P3 (polish), each with an effort of S, M or L. Screenshot names
(d- at 1440 wide, m- at 390 wide) refer to the review's working set and are not committed.

## Verdict

The information design is strong and worth keeping: a trust-boundary drawing generated from the
data with numbered control chips tied to the rows below; one Enable story (the controls, how you
build it, then set it); disciplined tokens (ink, mist and paper neutrals, saturated colour only
for risk phases, purple only for control chips); plain group names ("Check your suppliers", "Be
able to stop it"); and a URL for every view, with Back restoring the open row.

What holds it back:
- The drawing pushes the tabs 1,300 to 1,850px down a pattern page, and the drawing and the
  Enable list are never on screen together.
- The secondary grey (`--ink-3`) fails WCAG AA and is used 175 times.
- Shared parts are drawn many ways: "selected" eight ways, folds three ways, settings three
  ways, text in 23 arbitrary sizes.
- On a phone the page scrolls sideways, setting names are clipped and search results are
  unreadable; the drawing's chips are hidden from screen readers.
- There is no dark theme: `globals.css` defines `:root` only.

## P1: do now

**P1-1. Get the tabs into the first screen of a pattern page.** Every `/patterns/<slug>/`;
`reference/ArchetypeView.tsx`, `drawing/PatternDrawing.tsx`, `drawing/layout.ts`. At 1440×900 the
tab strip starts at 1,302px (enterprise AI chat), 1,690px (software factory) and 1,849px (chat
agent); the drawing is fitted to the page width at scales from 0.99 to 1.36, so box text is about
37 per cent larger on one pattern than another, and there is an empty band of about 90px above
the first zone. Readers come for Enable and nothing on the first screen shows the tabs exist.
Change: cap the scale at `min(fit, 1)` and centre the drawing; fit it within
`max-h-[calc(100svh-15rem)]` on both axes (zoom, pan or Expand for more); trim the margins
`layout.ts` adds; add an "Enable →" jump beside "Built on". Target: the tab strip within 900px.
Effort M.

**P1-2. Keep the drawing in view while working the Enable and Data flows lists.**
`ArchetypeView.tsx`, `enable/EnablePanel.tsx`, `enable/ControlTable.tsx`. Opening row 3 lights
chip 3 about 1,500px above, off screen; "See it on the drawing" leaves the row behind; picking a
chip leaves the drawing behind. The row-to-chip link is the site's central idea and the reader
never sees both halves. Change: at xl and up, on Enable and Data flows, two columns
(`xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(480px,42%)]`): the panel left, the drawing right in
`xl:sticky xl:top-[7.25rem] xl:h-[calc(100svh-8rem)]`, fitted, panning to the lit chip or the
walk's boxes. How it works stays full width. Below xl, a "Drawing" button in the sticky strip
opens the expanded view zoomed to the lit chip. Effort L.

**P1-3. Raise the secondary text colour to pass AA.** `globals.css` (`--ink-3`), every
`opacity-60` count (tabs in `ArchetypeView` and `PatternFinder`, the `Section` in
`ArchetypeDetail`, `rail-lists.tsx`, `CataloguePage.tsx`), `StatusPill.tsx` (notSet),
`enable/labels.ts` (notEnabled), exposed tags in `BoxDiagram.tsx` and `PatternDrawing.tsx`.
Measured: ink-3 #7b8798 is 3.65:1 on paper and 3.46:1 on mist; counts at opacity 60 are 1.96:1;
notSet #8792a2 is 3.15:1; R-code tags #d92d20 on #fee9e7 are 4.15:1; mitigated on mitigated-soft
is 3.77:1. All fail AA at 9 to 13px. Change: `--ink-3: #5f6b7c` (5.41:1 on paper, 5.13:1 on
mist, still lighter than ink-2); replace `opacity-60` on counts with `text-ink-3`; notSet and
notEnabled text in `var(--ink-3)`; add `--exposed-ink: #b42318` (5.64:1) for text on soft red;
show copyable paths and commands in ink-2 (`.ident` sets ink-3 today). Effort S.

**P1-4. Fix overflow and clipping on phones.** `cloud/CloudSwitch.tsx`, `SettingsTable` in
`enable/ProductSettings.tsx`, `ControlTable.tsx`, `Step` in `EnablePanel.tsx`, the tabs in
`PatternFinder.tsx`. Every hosted pattern is 459px wide on a 390px screen (the "Built on" group
is `flex gap-1` with no wrap); `permissions.disableBypassPermissionsMode` is clipped and rows
start at x≈118; the finder tabs are cut at "AI services you subscribe t" with the third hidden.
Change: the "Built on" group `flex max-w-full gap-1 overflow-x-auto` (or wrap, or a select below
sm); `[overflow-wrap:anywhere]` on setting names and value chips; below md, row `pl-8` to `pl-3`,
no Step body inset, the chip inline before the name; an edge fade on every horizontal strip
(`[mask-image:linear-gradient(to_right,#000_88%,transparent)]`). Effort S.

**P1-5. Rebuild the search result row.** `shell/SearchPalette.tsx`. On a phone titles shrink to
"Agent san…", "C." or nothing and hints run off the edge; on desktop one row shows no title (the
hint is `shrink-0`). Change: hint `min-w-0 max-w-[45%] truncate`; below sm, stack the title then
"kind · hint" at 11.5px; a short tag instead of the 88px mono kind column; group results
(Patterns, Products, Controls, Incidents, Risks), at most five a group, with "show all". Effort S.

**P1-6. Make the drawing usable by keyboard and screen reader.** `drawing/BoxDiagram.tsx` (svg
root, `chip`, `tag`, `differMark`), `PatternDrawing.tsx`. The svg has `role="img"` yet contains
chips with `role="button"`: children of an img are presentational, so screen readers do not see
the chips, while the chat-agent drawing still puts 41 tab stops before the tab strip, faded chips
included. Chips are 17px wide (14px at the 0.82 minimum scale) and adjacent ones touch, below the
24px target of WCAG 2.5.8. Change: svg `role="group"` with `aria-labelledby` on the h1 and a
hidden summary; the drawing as one tab stop with a roving tabindex (arrows move through chips in
number order, Enter opens the control); a "Skip the drawing" link; `tabIndex={-1}` on faded
chips; a transparent `<circle r={12}>` behind each chip as its hit area. Effort M.

**P1-7. Collapse the controls catalogue's filter wall.** `controls/ControlsBrowser.tsx`,
`controls/StackFilter.tsx`, `FilterPill` in `browse/RisksBrowser.tsx`. Seven filters in five
styles before the matrix starts at y≈750 (about 1,150px of filters on a phone); the only black
table header on the site; a status legend shown while no status is recorded. Change: one bar
under the h1 (search, "On pattern", a "Filters" button opening a popover or a bottom sheet on
phones with risk category, stack layer, source, surface and group-by); active filters as
removable chips with "Clear all"; the standard table header (`bg-mist/60 text-[11px] uppercase
text-ink-3`), sticky at `top-14`; the status legend only when a status is recorded. Effort M.

## P2: worth doing

**P2-8. Adopt a type scale and enlarge the text readers act on.** 23 arbitrary sizes, most used
13px (83), 12px (60), 12.5px (59), 13.5px (37), 11px (37), 11.5px (29), 10.5px (25), the rest
from 9 to 40px. What to do and why in an open row is 12.5px; the h1 is 40px on home, 34px on
section pages and 26px on a pattern page. Change: tokens `--text-2xs` 11, `xs` 12, `sm` 13,
`base` 14, `md` 15, `lg` 17, `xl` 21, `2xl` 28, `3xl` 36, codemodded to the nearest step; prose
and open-row bodies at 14px, table meta at 12px, nothing interactive below 11px; one h1 size.
Effort M.

**P2-9. Give sections real headings.** `Section` in `ArchetypeDetail.tsx`, `Step` in
`EnablePanel.tsx`, the group bands in `ControlTable.tsx`, `controls/ControlDetail.tsx`,
`app/reference/page.tsx`. Fold titles are 10.9px mono uppercase ink-3, the weakest text in the
panel; a control's page uses seven eyebrows as titles; Reference has a third heading style; a
pattern page exposes only its h1 to assistive technology. Change: fold buttons inside an `<h3>`
styled `display text-[15px] font-semibold text-ink` with the count in `font-normal text-ink-3`;
`<h2>` for step titles and `<h3>` for group bands; `.eyebrow` only as a kicker above the h1.
Effort S/M.

**P2-10. One container and one left edge.** `PageHeader` in `Panel.tsx` (`max-w-5xl`),
`CataloguePage` (1400px), pattern pages (1500px), the incidents list. The title sits at x=232 and
the content at x=24 on Patterns, 232 and 44 on Controls, 232 and 232 on Incidents, 24 and 24 on a
pattern. Change: one `<Container>` (`mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8`, a 16px
gutter on phones) used by `PageHeader`, the lead at `max-w-[68ch]`; reading pages narrow an inner
column, never the header. Effort S.

**P2-11. One way to show "selected" for each kind of control.** `SiteHeader`, `PatternFinder`,
`CloudSwitch`, `FilterPill`, `ProductPills`, the `ChooseBuild` cards, `WalkList`, `MasterDetail`,
the `ArchetypeView` tabs. Selected is drawn eight ways (solid ink, accent fill, a ring with
offset on product pills, a 2px ink border on cards, a green fill on the selected walk, a 3px left
bar, an underline), and the same AWS choice is a segmented button above the drawing and a dot
pill in step 2. Change: segmented controls and pills solid ink; list rows `bg-mist` with a 3px
ink bar; cards `border-ink ring-1 ring-ink` with a check; tabs underlined; reuse `CloudSwitch`
in step 2. Effort M.

**P2-12. Use green only for "mitigated" and "enabled".** `ValueChip` in `SettingParts.tsx`,
`WalkList`, the CoSAI pills in `ControlDetail.tsx`, the hex in `STATUS_STYLE` and
`ADOPTION_META`. Every recommended value is a green chip and reads as "enabled"; the selected walk
and the CoSAI pills are green too, and will clash with the real status column. Change: values as
code (`rounded border border-line bg-mist px-1.5 font-mono text-[12px] text-ink`); neutral CoSAI
pills with a group dot; the two duplicate status palettes into `--status-*` tokens and one `Pill`.
Effort S.

**P2-13. Make the Enable control table scannable.** `ControlTable.tsx`, `EnablePanel.tsx`, and
the copies of `number = new Map(archetype.mitigations.map(...))` in `ControlTable`,
`SettingsTable`, `BoxDiagram`, `PatternRisks` and `CrossingsRegister`. Reading down the table the
chips go 20, 1, 3, 4, 5, 6, 7, 17, 19, 8 and so on; a closed row shows only the name, so a reader
opens 23 rows to learn what to do; 11 of 23 rows carry an "Every deployment" badge in 10px ink-3;
in plain mode about 700px of space sits between the name and "Where it goes"; an open row runs
about 190 characters a line. Change: one `chipNumbers(archetype)` helper numbering chips in the
table's group order so the table reads 1 to 23; the first "do" sentence in the middle column of
each closed row; a glyph instead of the badge, with "Hide the 11 every deployment needs"; open-row
text at `max-w-[72ch]`. Effort M.

**P2-14. One way to show a setting, with identifiers set as identifiers.** `SettingsTable`,
`SettingCard` in `SettingParts.tsx`, `cloud/CloudViews.tsx`, the "On each cloud" section of
`ControlDetail.tsx`, `cloud/CloudsBrowser.tsx`. Keys such as `allowManagedMcpServersOnly` are in
bold sans and the control name repeats on every row; the path is 11px ink-3 mono with no copy
button; two more layouts show the same thing elsewhere. Change: one `SettingRow` everywhere: the
name in mono when it is a key and sans when it is a UI label; the value chip (P2-12) then the
via tags; the path in ink-2 mono with Copy (reuse `SettingCheck`'s); the "why" at 14px; in the
pattern table, settings grouped under their control as sub-rows. Effort M.

**P2-15. One disclosure component, closed by default.** `Section`, `Step`, the native
`<details>` in `ProductSettings.tsx`, `ChooseBuild.tsx` (`<details open>`),
`IncidentWalkthrough.tsx`, `FrameworksBrowser.tsx`, `ComponentsBrowser.tsx`. Three fold styles
(a native triangle on the left, a chevron on the right, step cards); the hosting comparison (ten
rows by three columns, about 1,000px) opens by default above the framework choice, followed by
"Sources: 1↗ 2↗ … 45↗". Change: one `<Disclosure>` (rotating chevron, heading, count); the
comparison closed by default; sources in a "45 sources" disclosure listed by title. Effort S.

**P2-16. Carry context in the sticky tab strip.** `#pattern-tabs` in `ArchetypeView.tsx`. In a
58-row settings table the strip shows only the tabs; the pattern, platform and framework have
scrolled away. Change: while stuck (an IntersectionObserver), show the pattern title (13px
semibold, truncated), the chosen product chips ("AWS · Strands Agents ✕") and "Drawing ↑", with a
hairline shadow. Effort S.

**P2-17. Pattern → control → product → back.** `/controls/?control=` (`ControlsBrowser.tsx`,
`ControlDetail.tsx`), `controlHref` in `src/lib/routes.ts`. "Full definition →" opens the
catalogue with the control as a panel under the matrix and no sign of where you came from; the
per-cloud settings and "Seen in these patterns" come last, by short pattern names. Change: each
control its own page, `/controls/[id]/`, with a breadcrumb ("Controls / Platform Security /
Execution Isolation"); `controlHref` takes `?from=<slug>&cloud=` and shows "← Back to Chat agent
with tools (control 23)"; order: definition, "On your patterns" (title, where it goes, chip
number), settings per platform or product in tabs, mappings, sources. Effort M/L.

**P2-18. One name for each thing, one number for each count.** `patterns/labels.ts`, the
`PatternPage.tsx` breadcrumb, `ControlsBrowser` chips, copy in `app/page.tsx` and
`SiteFooter.tsx`, `data/incidents/*.yaml`. The breadcrumb says "Cloud & hosted" where the eyebrow
and finder say "AI you host yourself"; the matrix says "Kill Switch" and "Rollout Gate" where
patterns say "Agent Kill Switch and Quarantine" and "Staged Rollout and Rollback Gate"; control
counts disagree (76 on home and footer, 66 on Controls, 59 + 17 on Reference); eight internal ids
leak into prose, for example "(archCodingAgentFirstParty)" in an incident. Change: one label per
surface; full control names (or the full name as a tooltip); reconciled or labelled counts ("76
in the catalogue · 66 used on a pattern"); a build check rejecting `\barch[A-Z]\w+` in prose.
Effort S.

**P2-19. Data flows: fit the sequence and let readers step through it.**
`reference/FlowSequence.tsx`, the flows tab. The sequence diagram overflows its card at 1440 and
lifelines past "AI gateway" are cut with no scroll cue; every step is numbered on the drawing at
once. Change: lifeline width `max(112, min(168, (width-48)/n))`, sticky lifeline headers and an
edge fade; a stepper ("Step 3 of 20 ← →", arrow keys) that highlights one arrow, its path on the
drawing and its note, reusing the incident stepper. Effort M.

**P2-20. Incident page: make the drawing readable at each step.**
`incidents/IncidentWalkthrough.tsx`, `DrawingLegend` in `PatternDrawing.tsx`. The drawing sits in
a ~970px column at about 0.65 scale (box text about 7px, about 5px on a phone, where the toolbar
wraps a lone "−" onto its own line); the legend says "select to open it on Enable" on a page with
no Enable tab; the bottom grid leaves an empty block. Change: fit the view to each step's lit
boxes with a "Whole drawing" toggle (animated only when reduced motion is off); a contextual
legend; the bottom in a single column. Effort M.

**P2-21. Give the clouds page a map.** `/reference/clouds/`, `cloud/CloudsBrowser.tsx`. The page
is 31,159px tall at 1440 (55,200px on a phone) with no in-page navigation, and pattern cards carry
paragraphs of about ten lines. Change: a sticky table of contents at lg (patterns, then controls
by NIST category with counts); categories closed by default unless deep-linked; a pattern filter;
card blurbs clamped to three lines. Effort M.

**P2-22. Keyboard and ARIA for tabs, search and skipping.** Tabs in `ArchetypeView` and
`PatternFinder`, `ProductPills`, `SearchPalette`, `app/layout.tsx`. Arrow keys do nothing on the
pattern tabs and there is no `aria-controls` or `aria-labelledby`; `ProductPills` and the finder
claim `role="tab"` with no tabpanel; the search input is not a combobox, so the active result is
silent; there is no skip link (nine Tabs to reach the pattern picker); the finder and search
inputs use `focus:outline-none`; `scrollIntoView({behavior:"smooth"})` ignores reduced motion.
Change: a roving tabindex with Arrow, Home and End and ids linking tabs to panels; `radiogroup` or
`aria-pressed` for pills that are not tabs; a combobox with `aria-activedescendant`; "Skip to
content" visible on focus; the focus ring back on inputs; a `scrollToEl()` helper that respects
reduced motion. Effort M.

**P2-23. Empty and dead-end states.** `app/not-found.tsx` (missing), `SearchPalette`,
`data-choose-first` in `ProductSettings`, `CataloguePage`. The 404 is the default Next page with
no way back; the empty search shows only key hints; step 3 says "In the step above, pick…".
Change: a not-found page with a heading, search, links to Patterns, Controls and Incidents and
the most-used patterns; suggestions on an empty search; a "Choose in step 2 ↑" button that opens
and scrolls to step 2. Effort S.

## P3: polish

**P3-24. Phone: let the finder lead, and label Reference in the menu.** `app/page.tsx`, the
mobile menu in `SiteHeader.tsx`. The hero and three steps fill 806px, so the first pattern
appears at about y=820; the Reference links are flat in the menu, so "Overview" reads as a site
overview. Change: below sm, fold the steps into one line with a disclosure; a "Reference" label
before its links. Effort S.

**P3-25. Drawing toolbar and legend polish.** `PatternDrawing.tsx`, `map/RiskMap.tsx`. Disabled
"−" and "Fit" nearly vanish; the legend sits under a 900 to 1,400px drawing and lists "Step of a
flow" when none is shown; Expand keeps the inline zoom and opens off-centre; the risk map has its
own +/−. Change: show the zoom percentage; disabled buttons `opacity-40 cursor-not-allowed`;
Expand opens fitted; the legend in a "Key" popover listing only the marks present; one toolbar
for both drawings. Effort S.

**P3-26. Finder preview: show something readable.** `Preview` in `PatternFinder.tsx`. The
drawing is at about 0.3 scale (text about 4px). Change: a readable summary (a boundary strip with
box names, the three top risks as tags, "18 controls · 9 products"), or the drawing with box
titles only at a legible size. Effort M.

**P3-27. Take repository instructions out of the reading flow.** `data-status-hint` and
`data-settings-status-hint`. "No status recorded yet: list your own controls in
data/org/controls.yaml…" sits above every table. Change: an info tip beside the count, or one
dismissible note a page. Effort S.

**P3-28. Prepare the tokens for a dark theme.** `globals.css`, `StatusPill.tsx`,
`enable/labels.ts`, `reference/flow-style.ts`, `BoxDiagram.tsx` (#FFF4D6, #B7791F, #8A5A0B,
`fill="#fff"`), `DefenseMatrix.tsx`, `SettingParts.tsx`. No dark theme, and about 25 hard-coded
hex values outside the tokens. Change: move every hex into tokens and set `color-scheme: light`;
then overrides under `prefers-color-scheme` and `[data-theme]` with a toggle (suggested paper
#0f1420, mist #151b28, ink #e6e9ef, ink-2 #b4bcc8, ink-3 #8b95a5, line #263042). Effort M for the
tokens, L for the theme.

## What not to change

- The drawing: trust boundaries generated from data, with numbered chips linked both ways to
  rows. Keep the link and keep it on screen (P1-2).
- The palette: saturated colour only for risk phases, purple only for chips, the ink, mist and
  paper tokens.
- The Enable story: controls, then choose, then set; on hosted patterns where it runs, how it is
  hosted and what you build with stay separate choices.
- Plain group names with the NIST name beside them.
- "Check it: a command that only reads", with Copy and "A pass looks like": the best component
  on the site; extend its Copy to paths and values.
- A URL for every view: tab, cloud, tool and `#control-` all survive Back.
- The incident stepper: reuse it on Data flows.
- The fonts: Space Grotesk, IBM Plex Sans and IBM Plex Mono, with mono only for identifiers.
- The 2px focus ring, the reduced-motion CSS rule and ⌘K search.
- No loading states: the site is static.
