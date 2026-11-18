# Patterns first: restructure the app around what a reader is enabling

Date: 2026-11-14. Branch: `patterns-first` (cut from `ccr-6a653524-mevo2m`, which carries the
two-step Enable tab). Status: accepted and built; see "As built" at the end for what changed
along the way. The risk-first app is kept on the `v1` branch.

## Why

The app grew from a SAIF/CoSAI risk map into reference architectures, and it still reads in the
order it was built: risks, then capabilities, then architectures, then Enable. A reader has to
learn three taxonomies before reaching the part they came for. The question they arrive with is
"we want to roll out X, or build Y: what has to be in place?"

The restructure makes the reference architecture, called a **pattern**, the front door and the
unit everything hangs from. Risks, the CoSAI and SAIF material and the framework crosswalks keep
every word they have today and move to a Reference section a reader turns to when they want the
reasoning.

The one-sentence explanation the app should support:

> Pick the pattern for what you are enabling. It shows the controls your organisation needs and
> the settings of the product you chose. Everything else is the evidence behind those two lists.

## Principles

1. **Nothing is deleted.** Every page, section and field that renders today has a named home in
   the content inventory below. A phase is not done until its rows are ticked.
2. **The pattern is the unit.** Controls, tools, risks, flows and incidents are all reached from
   a pattern first, and from their own catalogue second.
3. **Four words for the reader:** pattern, control, setting, risk. Framework identifiers appear
   as small "maps to" tags, never as the name of a thing.
4. **Three taxonomies, one job each.** NIST CSF groups. MITRE D3FEND and ATLAS identify. CoSAI
   and SAIF explain, in Reference.
5. **Old links keep working.** The site is a static export, so every retired path gets a client
   redirect of the kind `/enable` and `/examples` already use.
6. **Data ids do not change.** `archetype`, `mitigation` and `control` stay as they are in YAML,
   types and code. Only what the reader sees is renamed. The app already works this way
   (`mitigation` in data, "capability" on screen).

## Vocabulary

| Reader sees (new) | Reader sees (today) | In data and code (unchanged) | Source |
| --- | --- | --- | --- |
| **Pattern** | Reference architecture, architecture, archetype | `archetype` | Authored here |
| **Control** | Capability; also countermeasure, mitigation | `mitigation` | MITRE D3FEND and ATLAS, plus `cap-*` specialisations |
| **Control family** | Security domain (the seven I wrote), control category | new field, see below | NIST CSF 2.0 category |
| **Setting** | Setting | `ProductSetting` | Vendor documentation |
| **Tool** | Product, tool | `tool`, `cloud` | Registry |
| **Risk** | Risk | `risk` | CoSAI |
| **CoSAI control** (Reference only) | Control | `control` | CoSAI |

The awkward one is "control", which today means a CoSAI control. After the change the bare word
always means the MITRE-level item, and the CoSAI layer is always written "CoSAI control". This is
decision 1 below.

## Taxonomy: what each framework does after the change

| Framework | Role | Where the reader meets it |
| --- | --- | --- |
| **NIST CSF 2.0** | Groups controls into families on every pattern and in the control catalogue | Band headings, catalogue filters |
| **MITRE D3FEND / ATLAS** | Names and identifies each control | A tag on each control row; the control's detail page |
| **CoSAI Risk Map** | Risks, CoSAI controls, components, personas | Reference; "maps to" lines on a control and a pattern's risk list |
| **Google SAIF** | The introduced / exposed / mitigated walk | Reference › Risk map |
| OWASP, ATLAS techniques, STRIDE, NIST AI RMF, ISO, EU AI Act | Crosswalks | Reference › Frameworks, unchanged |

### Grouping by CSF

The seven home-made domains in `data/overlay/enablement.yaml` are replaced by CSF categories,
shown in CSF function order (Govern, Identify, Protect, Detect, Respond), which also reads as a
sensible order to put things in place. Each control gets exactly one primary CSF category.

CSF publishes no mapping to D3FEND or ATLAS, and the repository today maps CSF categories only to
CoSAI controls (`data/frameworks/nist-csf.yaml`). So the control-to-category mapping is authored
here and needs review. The draft for the 49 controls pinned on a pattern:

| CSF category | Controls |
| --- | --- |
| **GV.SC** Cybersecurity Supply Chain Risk Management | AI Vendor Risk Assessment, Tool and MCP Server Integrity, Verify AI Artifacts, Code Signing, AI Bill of Materials, Maintain AI Dataset Provenance |
| **ID.AM** Asset Management | Agent and Tool Registry, Shadow AI Discovery, Model Registry and Documentation, Data Inventory |
| **ID.RA** Risk Assessment | AI System Threat Modelling, System Vulnerability Assessment, Asset Vulnerability Enumeration, Validate AI Model |
| **PR.AA** Identity Management, Authentication, and Access Control | Multi-factor Authentication, Access Policy Administration, Agent Authentication, Credential Hardening, Credential Transmission Scoping, Credential Revocation, AI Agent Tools Permissions Configuration, Agent Action Policy Enforcement, Human In-the-Loop for AI Agent Actions |
| **PR.DS** Data Security | Sensitive Data Detection and Redaction, Data Access Governance for Retrieval, Retrieval Trust and Grounding Checks, Memory Hardening, Control Access to AI Models and Data at Rest, Encrypt Sensitive Information, Sanitize Training Data, Message Authentication, Input Screening Guardrails, Output Content Safety Guardrails |
| **PR.PS** Platform Security | Execution Isolation, Hardware-based Process Isolation, Application Configuration Hardening, Output Encoding and Safe Rendering, Staged Rollout and Rollback Gate |
| **PR.IR** Technology Infrastructure Resilience | Network Isolation, Agent Egress Control, Outbound Traffic Filtering, Limit AI Service Query Volume and Rate, Limit AI Workload Resource Consumption |
| **DE.CM** Continuous Monitoring | Agent Execution Tracing, AI Telemetry Logging, Process Analysis, File Analysis, Web Session Activity Analysis |
| **RS.MI** Incident Mitigation | Agent Kill Switch and Quarantine |

Known weak fits, flagged so they are decided on purpose:

- **Guardrails** (input and output) have no clean CSF home. Data Security is the draft; Platform
  Security is the alternative.
- **Agent permissions, action policy and human approval** fold into PR.AA, which makes it the
  largest band (up to nine rows on a pattern). CSF has no category for "what an agent may do".
- **Staged rollout** and **Validate AI Model** are release controls; CSF spreads these across
  PR.PS and ID.RA.

The 27 catalogue controls not pinned on any pattern also need a category so the catalogue can be
grouped the same way. That mapping is part of phase 1.

What survives from today's Enable tab: the "Every AI deployment" tag and its `baseline` list, the
per-surface wording where a family reads differently on a device than in a cloud, pin order
within a band, and the rule that the build fails if a pinned control has no family.

## Site map

### Navigation

| Today | After |
| --- | --- |
| Risk map · Capabilities · Architectures · Incidents · Reference ▾ (Risks, Controls, Components, Personas, Frameworks) | **Patterns · Controls · Tools · Incidents · Reference ▾** (Risk map, Risks, CoSAI controls, Components, Personas, Frameworks) |

### Routes

| New route | Content | Replaces | Redirect kept |
| --- | --- | --- | --- |
| `/` | Pattern finder (home) | Landing page | — |
| `/patterns/` | Same finder, as the section index | `/reference` with nothing chosen | `/reference` |
| `/patterns/<slug>/` | One pattern | `/reference?archetype=<id>` | `/reference?archetype=…&tab=…&tool=…`, `/enable?…` |
| `/controls/` | Control catalogue by CSF family | `/capabilities` | `/capabilities?capability=…` |
| `/tools/` | Tool index (new page, existing data) | — | — |
| `/incidents/`, `/incidents/<id>/` | Unchanged | — | `/examples` (already) |
| `/reference/risk-map/` | SAIF walk | `/map` | `/map` |
| `/reference/risks/` | Risks | `/risks` | `/risks?risk=…` |
| `/reference/cosai-controls/` | CoSAI controls | `/controls` | `/controls?control=<CoSAI id>` is forwarded by the new `/controls` page; a bare `/controls` now opens the catalogue (decision 2) |
| `/reference/components/` | Components | `/components` | `/components` |
| `/reference/personas/` | Personas | `/personas` | `/personas` |
| `/reference/frameworks/` | Crosswalks | `/frameworks` | `/frameworks` |
| `/reference/` | Reference index: what each page is and when to use it | Landing page's Reference and "where the data comes from" blocks | — |

Each pattern gets its own static page (`generateStaticParams`, as incidents already do), so a
pattern has a clean URL to share and a real page title. The slug is the pattern's data file name,
for example `/patterns/endpoint-coding-agent-third-party/`. Tab, tool and open control stay in
the query string and hash as they are now.

## Page designs

### Home: the pattern finder

Replaces a landing page that leads with frameworks and "Start with the risks".

- One line of purpose, then a search box that matches pattern titles, example products, tools,
  clouds and a short synonym list (RAG, chatbot, assistant, copilot, M365, MCP).
- Three columns, one per surface, worded as the reader's situation: **Tools on your devices**
  (endpoint), **AI services you subscribe to** (SaaS), **AI you host yourself** (cloud or on-premises; first named "Applications you build").
- One card per pattern: title, a one-line "use this when…", three or four example products, a
  buy / build tag (from the guidance file's `mode`, authored for all 18 and not shown today),
  and counts of controls and tools.
- Beneath: a short "how to read a pattern" strip (pattern → controls → settings), a link to
  incidents, and a link to Reference.
- The framework lineage and "where the data comes from" move to the Reference index.

New authored content: one "use this when…" line per pattern (18 lines), and the synonym list.

### Pattern page

Same content as today's architecture page, reordered so the answer comes first.

1. **Header brief.** Surface and buy / build tag, title, "use this when…", example products.
   The catalogue header and picker shrink to one line once a pattern is open.
2. **Drawing**, unchanged, with its numbered control chips, the cloud relabelling switch and the
   legend.
3. **Tabs, in this order:**

   | Tab | Content | Today |
   | --- | --- | --- |
   | **Enable** (default) | Step 1 controls by CSF family, step 2 tool settings | Enable (third tab) |
   | **How it works** | The overview prose, "why this is its own pattern", deviations, sources | Overview (default) |
   | **Risks & flows** | The pattern's risk list, then the sequence flows with risk tags on the drawing | Sequence flows; the risk list exists in data but has no view |
   | **Incidents** | The incidents that happened on this pattern, linking to their walk-throughs | Only reachable from the Incidents page |

4. The "How to govern this" guidance moves from the foot of step 1 to the top of the Enable tab
   as a short "What to do" lead, since it is the plainest playbook text in the app.

A link that names a tab, tool or control scrolls to it on arrival.

### Controls catalogue

Today's Capabilities page, regrouped.

- Rows are CSF families in function order; the columns stay the three surfaces, tinted by status.
- Filters kept: source (D3FEND, ATLAS, specialisations), stack layer, risk category, gaps only,
  text search. Added: filter by pattern.
- A control's detail keeps everything it has (MITRE definition, implementation scope, example
  technologies, where it is pinned, per-surface responsibility, sources) and gains two lines:
  its CSF family and "Maps to CoSAI: …", which links into Reference.
- The CoSAI category matrix that organises the page today moves to Reference › CoSAI controls,
  so the view is kept, not dropped.

### Tools index

New page built from data that already exists, so a reader who knows only a product name has a
way in. One row per tool or cloud: vendor, what it ships as, the pattern it belongs to, number of
catalogued settings, last verified date and the organisation's adoption status. A row opens the
tool's settings on its pattern. No new data.

### Incidents

Unchanged, apart from links pointing at the new pattern URLs, and each incident appearing on its
pattern's Incidents tab.

### Reference

An index page that says what each reference page is for, then the six pages with their content
unchanged: Risk map, Risks, CoSAI controls, Components, Personas, Frameworks. The footer's CoSAI
commit line and the source credits live here too.

## Content inventory: where everything goes

| Today | Content | New home |
| --- | --- | --- |
| Landing: headline and phase legend | Introduced / exposed / mitigated framing | Reference index and Reference › Risk map |
| Landing: four-step path | Risks → capabilities → architectures → enable | Replaced by the "how to read a pattern" strip; the four destinations are all still in the nav |
| Landing: Reference pills | Links and counts | Reference index |
| Landing: where the data comes from | CoSAI, SAIF, MITRE credits | Reference index |
| `/map` | 36 risks × 3 phases over the component map | Reference › Risk map |
| `/capabilities` matrix and filters | 76 capabilities by CoSAI category × surface | `/controls`, regrouped by CSF; the CoSAI grouping moves to Reference › CoSAI controls |
| `/capabilities` detail | Definition, scope, examples, pins, surfaces, sources | `/controls` detail, plus CSF family and CoSAI mapping lines |
| `/reference` picker | 18 architectures by surface, search, experimental entries | Pattern finder cards; a compact switcher stays on the pattern page; experimental entries move behind a flag (decision 4) |
| `/reference` header | Surface tagline, title, examples, summary, "Enable this securely" | Pattern header brief |
| `/reference` drawing | Blocks, flows, chips, risk tags, cloud relabelling, legend, export | Pattern page, unchanged |
| `/reference` Overview tab | Description, distinguished-by, exemplars with notes, deviations, sources | Pattern › How it works |
| `/reference` Sequence flows tab | Walk list, sequence diagram, risk tags | Pattern › Risks & flows |
| `/reference` Enable tab, step 1 | Controls, placement notes, guidance items, risks reduced, status, baseline tag, baseline footnote | Pattern › Enable, step 1, bands become CSF families |
| `/reference` Enable tab, step 2 | Product pills, settings tables, cloud bindings, fallback tool record | Pattern › Enable, step 2, unchanged |
| Guidance overview | "How to govern this" disclosure | Pattern › Enable lead |
| Guidance `mode` | build / use / hybrid, not shown | Buy / build tag on cards and pattern header |
| Pattern `risks` list | 6–13 risks per pattern, not shown as a list | Pattern › Risks & flows |
| `/incidents`, `/incidents/<id>` | List, filters, walk-throughs | Unchanged; also on Pattern › Incidents |
| `/risks` | 36 risks with facets and mappings | Reference › Risks |
| `/controls` | 35 CoSAI controls, status rollup | Reference › CoSAI controls |
| `/components` | 23 components | Reference › Components |
| `/personas` | 8 personas | Reference › Personas |
| `/frameworks` | Crosswalks, including CSF | Reference › Frameworks |
| Global search | Risks, controls, capabilities, architectures, tools | Kept; adds clouds, example products and synonyms; tool results name their pattern |
| Footer | Build date, CoSAI commit, counts, "under review" badge | Kept; counts lead with patterns, controls and tools |
| `/enable`, `/examples` | Redirects | Kept, retargeted |

## Data and build changes

| Change | File | Note |
| --- | --- | --- |
| Control → CSF category | `data/overlay/enablement.yaml` (groups keyed by CSF id) | Reuses category names from `data/frameworks/nist-csf.yaml` so there is one source for them |
| CSF for unpinned controls | same file | So the catalogue groups all 76 |
| Build checks | `scripts/lib/enablement.ts` | Every control has exactly one category, and the id exists in the CSF framework file |
| "Use this when…" line | `data/reference/architectures/*.yaml`, new `useWhen` | 18 authored lines |
| Pattern slug | derived from the file name at build | No authoring |
| Search synonyms | small new list beside the search index | Authored |
| CSF crosswalk page | `data/frameworks/nist-csf.yaml` | Gains control-level mappings generated from the enablement file, so Frameworks and Enable cannot disagree |

No change to tooling, clouds, incidents, risks, CoSAI data or `data/status.yaml`.

## Phases

Each phase ends with the app working, tests green, and its inventory rows ticked. Phases 1 and 2
are independent of each other; 3 onward build on 2.

| # | Phase | What ships | Checks |
| --- | --- | --- | --- |
| 1 | **CSF families** | Enable step 1 grouped by CSF category; all 76 controls mapped; build checks | Enable tests updated; every pinned control in one family; mapping reviewed by you |
| 2 | **Routes and navigation** | `/patterns/<slug>/` static pages, new nav, Reference section, all redirects | A test that every old URL form lands on the right new page; link checker clean; base-path build works |
| 3 | **Pattern page** | Enable as default tab, renamed tabs, risk list, Incidents tab, header brief, scroll-to on arrival | Every field of the old Overview and Flows tabs still renders, asserted per pattern |
| 4 | **Home: pattern finder** | Cards by surface, "use this when…", buy / build tags, search over products, clouds and synonyms | "copilot", "azure", "rag", "chatbot" each return a pattern |
| 5 | **Controls catalogue and Tools index** | `/controls` by CSF, CoSAI matrix moved to Reference, `/tools` | Matrix tests updated; every tool listed once and linking to its pattern |
| 6 | **Vocabulary sweep** | "Control", "pattern", "CoSAI control" everywhere a reader sees them; page titles; one set of counts | A test that fails on the retired words in rendered pages |
| 7 | **Docs and skills** | README, `data/ONTOLOGY.md`, `data/PROVENANCE.md`, the three skills | Read-through; skill instructions match the new page names |

Verification on every phase: `npm run data`, `npm test`, `npm run lint`, `npm run links`, a static
export build, and a browser walk of one pattern per surface at laptop and phone width.

## Not in this restructure

Raised by the usability review and worth doing, but separate from the restructure:

- Must-have / should-have tiers and a "you have this when…" check per control.
- A printable per-pattern checklist and a print stylesheet.
- Per-team or per-surface status instead of one global value in `data/status.yaml`.
- A sticky or simplified drawing so a control row and its chip are on screen together.

## Decisions

All six were accepted as drafted on 2026-11-14:

1. The MITRE-level items are **controls**; the CoSAI layer is always "CoSAI control".
2. `/controls` is the new catalogue. A link that names a CoSAI control is forwarded to
   Reference; a bare `/controls` opens the catalogue.
3. The CSF mapping table above stands, weak fits included.
4. The experimental boundary drawing becomes the standard for all 18 patterns (phase 8 below),
   replacing "hide or keep".
5. Incidents stays in the top navigation.
6. "Pattern" is the word.

## Phase 8: the boundary drawing

Added after the review of the experimental drawing. The trust-boundary format replaces the
column canvas as the default drawing on every pattern, with the canvas kept as a "Detailed"
view so item-level detail is not lost.

| Requirement | Check |
| --- | --- |
| Wording comes from the pattern files, not code | Box titles are block titles; one-liners fall back to item labels |
| Canonical surface names on boundaries | Boundary label is the zone title |
| Control-plane boxes show the controls they own | Per-pattern test |
| Risk tags on the Risks & flows tab | Per-pattern test that every risk pin is drawn |
| Component-type accent with a legend | Browser check |
| Cloud relabelling ("Drawn as AWS / Azure / Google Cloud") | Browser check on a cloud pattern |
| One numbering scheme | No enforcement discs; chips are controls, walk steps their own style |
| Zoom, pan and export | Browser check |
| Three layout templates by surface, no hand-laid coordinates | Layout test: no overlapping boxes, every box inside its boundary |
| Crossings register as a table | Lists every boundary-crossing flow once |

## As built

Differences from the plan above:

- **No buy / build tag.** Dropped at the owner's request: these are common patterns for
  enabling a tool, whether it is a third party's or one you build, not things that are bought.
- **Tab ids are unchanged** (`overview`, `flows`, `enable`, plus `incidents`); only their
  labels and order changed, so old `?tab=` links keep their meaning.
- **The CoSAI grouping of the catalogue stayed on `/controls`** as a "Group rows by" switch
  instead of moving to Reference, so the two groupings can be compared in place.
- **Use-when lines and search words live in `data/overlay/patterns.yaml`**, not in each
  pattern's own file.
- **"Archetype" was replaced by "pattern" in the authored prose** of the patterns, guidance and
  incidents (73 lines), since it is the retired word a reader would otherwise still meet.
- **The tab strip sits above the drawing**, not beneath it, so a reader sees the four tabs on
  the first screen; the tabs govern both the drawing's pins and the panel under it.
- **The boundary drawing is laid out by one engine**, with spacing and emphasis varying by
  surface, not three separate templates. Only the third-party coding agent has authored box
  one-liners and crossing notes; the other 17 show item labels and derived crossings. The
  decorative Sandbox frame was dropped because it had no data behind it.
- **Phases 2 to 6 landed as one change**, because the pattern page, the routes and the wording
  touch the same files.

## Changed after review, 2026-11-16

Four things in the plan above were reversed once the site was live and read by its owner.

- **One drawing.** The "Detailed" canvas is retired, with its layout engine, its build checks
  and its HTML export. Incident replays moved onto the boundary drawing. Every component and
  everything it holds is listed under How it works, so nothing depends on hovering.
- **Tabs under the drawing.** The strip sits beneath the drawing again, sticks under the site
  header once scrolled past, and brings the drawing back into view when a tab is chosen from
  there.
- **Risks and Flows are separate tabs.** Risks carries the risk tags and the risk list; Flows
  carries the walks, the sequence diagram and the boundary-crossings table.
- **No Tools page.** `/tools/` and its navigation entry are gone. A tool is reached from its
  pattern's Enable tab and from search.

The landing page was also redesigned: how to read a pattern comes first, and the finder shows
one situation at a time as a short list with a preview, in place of eighteen cards.

