# The feed: AI security daily

Every real AI security incident we track, and the product updates, security tools, launches,
guidance and research that change how AI is secured, each in two or three lines, weighed and,
where it belongs to one, grouped under a story. It is shown at `/feed/`. Incidents are filed
under the site's incident patterns and the patterns they would replay on. The files in
`data/incidents/` are the **deep dives**: the few incidents that teach something new, told step
by step on a pattern's drawing. An incident links to the deep dive that tells it, when there is one.

The folder may be empty: the build then makes an empty feed and the page says so.

| `kind` | What it is |
| --- | --- |
| `incident` | A real attack on an AI system, or by one, filed under an incident pattern (`category`). Campaign threat intelligence (reports of attacks happening) is an incident too. The default: an item written without a `kind` is an incident. |
| `productUpdate` | A vendor ships or changes a security control in an AI product. |
| `tool` | A new open-source or commercial tool that protects AI systems. |
| `launch` | A new AI product or feature that changes where data goes or what an organisation can control. |
| `guidance` | How to secure AI in practice: practice posts from labs and vendors, standards, agency guidance. |
| `research` | Findings and results: studies, measured results, technical discoveries. |

| `weight` | When |
| --- | --- |
| `headline` | A reader would be poorly served not knowing it today: a major vendor default flip, a confirmed large incident, a widely covered launch with security consequences. **At most three a day.** |
| `notable` | Worth reading this week. |
| `brief` | Worth a line; folded by default behind "+N briefs". |

## Files

- `data/feed/<YYYY-MM>.yaml`: the items, one file per month of their `date`.
- `data/feed/stories.yaml`: the stories items are grouped under.
- `data/feed/overviews.yaml`: each day's and each week's major events, in plain sentences.
- `data/feed/decisions.yaml`: the owner's answers to proposed site updates.

### Items: `data/feed/<YYYY-MM>.yaml`

An `items:` list, newest first:

```yaml
items:
  - id: mittwald-mcp-server             # unique across all feed files; kebab-case
    weight: headline                    # headline | notable | brief
    date: 2026-11-07                    # the day it came to light (YYYY-MM-DD), inside the file's month
    added: 2026-11-08                   # the day the run filed it (YYYY-MM-DD)
    title: "Mittwald's own MCP server breached: customers' session tokens read"
    summary: >
      One to three plain past-tense sentences: who, what, the result.
    category: exploitedSoftware         # incidents only: the incident pattern id (data/incident-patterns/)
    perspective: target                 # incidents only: target = an AI system was attacked; weapon = an AI agent ran the attack
    evidence: exploited                 # incidents only: exploited | confirmed | demonstrated | reported
    patterns: [archRemoteMcpServer]     # 0 to 3 pattern ids it would replay on; [] when none fits
    incident: mittwald-mcp-server       # optional, incidents only: the deep dive that tells it
    cves: [CVE-2026-0000]               # optional
    sources:                            # 1 to 3; the primary first
      - title: "The page's own title"
        url: https://...
        publisher: mittwald
        date: 2026-11-07

  - id: claude-code-otel-endpoint-setting
    kind: productUpdate                 # productUpdate | tool | launch | guidance | research
    weight: notable
    story: settings-toolClaudeCode-2026-w47   # optional: a story in stories.yaml
    date: 2026-11-20
    added: 2026-11-20
    title: "Claude Code lets administrators pin where its traces go"
    summary: >
      The TL;DR: what was announced, in one to three sentences.
    why: "One line: why it matters for security."
    vendor: Anthropic                   # optional: who announced it
    products: [toolClaudeCode]          # optional: tooling ids (data/tooling/)
    controls: [cap-agent-tracing]       # optional: catalogue ids it delivers or changes
    patterns: [archCodingAgentThirdParty]
    update:                             # optional, never shown on the site: the change to the site it implies
      action: settings                  # settings | toolOption | onboard | newControl | newPattern | controlGuidance
      status: applied                   # applied | proposed | declined | watch
      target: data/tooling/anthropic/claude-code.yaml   # the file it changes, or the id it names
      note: "Adds the tracing endpoint setting under agent tracing."
    sources:
      - title: "Claude Code settings"
        url: https://...
        publisher: Anthropic
        date: 2026-11-20
```

| Field | Rule (`npm run data` checks each, naming the file and the item) |
| --- | --- |
| `id` | Kebab-case, unique across every feed file. It is the item's anchor on the page (`/feed/#<id>`), which is where search, the RSS feed and the home page land. |
| `kind` | One of the six above; left out, `incident`. |
| `weight` | Required: `headline`, `notable` or `brief`. At most three headlines a day; a fourth fails, naming the three already there. |
| `date` | A real day, `YYYY-MM-DD`, inside the month the file is named for: the day it came to light or was first announced. The feed groups items under the ISO week (Monday to Sunday) of this date. |
| `added` | Required. A real day, `YYYY-MM-DD`: the day the run filed the item, which may be later than `date` (an item found late). **Latest** on `/feed/` is the items filed on the newest `added` day; "new since your last visit" and the home page's list go by it too. It may fall after the file's month. |
| `title` | At most 90 characters. |
| `summary` | At most 280 characters. |
| `why` | At most 160 characters: why it matters for security, in one line. Required for every kind but an incident, which may have one. |
| `vendor` | Optional, at most 80 characters: who announced it. |
| `products` | Optional. Tooling ids from `data/tooling/` (`toolClaudeCode`), each once. Each tag opens that product's settings on its pattern. |
| `controls` | Optional. Catalogue ids (a MITRE mitigation or a `cap-*` specialisation), each once. Each tag opens the control in `/controls/`. |
| `story` | Optional. A story id in `stories.yaml`. An item in a settings roll-up (`settings-<toolId>-<YYYY>-w<NN>`) must be a `productUpdate` that names that product in `products` and is dated in that ISO week. |
| `category` | Incidents only, and required there. One of the incident pattern ids in `data/incident-patterns/`: `promptInjection`, `supplyChain`, `identity`, `exposed`, `exploitedSoftware`, `aiMadeExposure`, `breakout`, `aiAttacker`. It names how the chain started, not where it ended. |
| `fit` | Incidents only. Optional, `loose` only: the item fits its incident pattern only loosely. Needs `fitNote`. |
| `fitNote` | With `fit`, at most 160 characters: why the fit is loose. Three or more loose items in 60 days sharing a mechanism whose controls differ are the case for a new incident pattern. |
| `perspective` | Incidents only, and required there: `target` or `weapon`. |
| `evidence` | Incidents only, and required there: `exploited` (shown as **In the wild**), `confirmed` (by the vendor, the victim or an agency), `demonstrated` (against a real product, then patched or given a CVE) or `reported` (**Single report**: one report, unconfirmed). |
| `patterns` | Zero to three pattern ids that exist (`data/reference/architectures/`). |
| `incident` | Incidents only. Optional. An incident id in `data/incidents/`: the file that tells it, or the file that lists it under `alsoSeen`. |
| `cves` | Optional. `CVE-YYYY-NNNN` identifiers. |
| `update` | Optional. `action`, `status` and `target` from the lists above, and a `note` of at most 200 characters (for `watch`, what to look for and when to check again). An applied update must name a file that exists, or an id of the kind its action names. **Review material: no page and not `/feed.xml` shows it, and the build strips it from every file the site serves.** |
| `sources` | One to three, the primary first, each with the page's own `title`, an `https://` `url` and a `publisher`; `date` (`YYYY-MM-DD`) where the page has one. |

No other field is accepted. Write in the site's words (pattern, control, risk; never
"archetype" in prose, which the build rejects) and use no adjective the sources do not support.

### Stories: `data/feed/stories.yaml`

Items in one story are shown together, newest first, under the story's title.

```yaml
stories:
  - id: artex
    title: "ARTEX: one public agent framework, many attackers"   # <= 90
    incident: artex-campaigns          # optional: the deep dive it belongs to
  - id: settings-toolClaudeCode-2026-w48
    title: "Claude Code settings, week of 23 November 2026"
```

- A storyline (`artex`, `cyberstrikeai`) gathers the follow-ups of one event or campaign.
- A settings roll-up gathers one product's single-setting updates in one ISO week:
  `settings-<toolId>-<YYYY>-w<NN>`, titled "<Product> settings, week of <Monday>". A product update
  stands alone only when a default flips or the change opens a new way for code to run or data to leave.

`npm run data` checks that ids are unique (kebab-case, or the roll-up form), that a title is at
most 90 characters, that `incident` is a deep dive, that a roll-up names a product on the site
and a real ISO week, and that every item's `story` is listed here. Each problem names the file and the story.

### Overviews: `data/feed/overviews.yaml`

```yaml
days:
  - date: 2026-11-26     # a day the run filed items on (their `added`): Latest's overview
    overview: >     # <= 400: the day's major events in two or three plain sentences
      ...
weeks:
  - week: 2026-11-23     # the Monday that starts the ISO week
    overview: >     # <= 600: the week's major events, most important first; updated each day
      ...
```

Every filing day and every week that has items should have one. A day listed must be a day the
run filed items on (some item's `added`), a week one that items are dated in, named by its
Monday; each is listed once. Where a day or week has none, the page lists the titles of its
headlines (or, with none, its notable items) in its place.

### Decisions: `data/feed/decisions.yaml`

The owner's answers to proposed updates, one line per item:

```yaml
- { id: xai-private-inference, decision: approve }
- { id: some-research-post, decision: decline, note: "No change to the control." }
```

Each `id` must be an item in the feed with an `update`, decided once; `decision` is `approve` or
`decline`; `note` is at most 200 characters. The daily run carries out at most one approved
onboard or control change a run, sets the item's `update.status`, and removes the line.

## Reviewing what waits: `npm run queue`

The site shows no review material: no proposed-updates panel, no "site update" line on an item,
no approve line. The proposals stay in the repository (the items' `update`, `decisions.yaml` and
the run logs in `docs/research/daily/`), and `node scripts/review-queue.mjs` (`npm run queue`)
prints every item whose update is `proposed` or `watch`, grouped by action, with its id, date,
target, note and the line that approves it (or the owner's answer, if there is one), for review
in a chat session.

## Security tools: `data/security-tools/<id>.yaml`

A tool a `tool` item announced, listed under the controls it helps deliver. Optional: no folder
is no tools.

```yaml
id: tencent-ai-infra-guard
name: "AI-Infra-Guard"
by: Tencent                   # vendor or project
kind: open                    # open | commercial
url: https://...              # its own page or repository
what: "..."                   # <= 160
controls: [cap-mcp-tool-integrity, cap-agent-tool-registry]   # 1 to 4 catalogue controls it helps deliver
status: ga                    # ga | preview | beta
released: 2026-11-10
feed: tencent-ai-infra-guard-mcp-skills   # optional: the feed item that announced it
```

`npm run data` checks every field, that each control is in the catalogue, and that `feed`, if
given, is an item in the feed; each problem names the file and the tool.

## Where it shows

- `/feed/`: kind chips at the top (`?kind=`), which apply to every section; then **Latest** (the
  items filed on the newest `added` day, "Today's feed" when that is today, "Latest feed · <day>"
  otherwise; always open), **This week** and each week before it by `date`, newest first, each
  folded until opened. Every section shows its count after the chips and its overview. An open
  section lists its stories (title, then items newest first) and standalone items by weight then
  date; briefs fold behind "+N briefs". "N new since your last visit" (by `added`) is counted in
  the header and in each section. The page is built with its newest seven days by `date` and
  everything filed in its newest seven days, and loads older months when a week is opened or a
  link names an older item. An old address with
  `?category=`, `?pattern=`, `?evidence=` or `?incident=` goes to the Incidents page's report list
  with the same filters (or, when it names an item, stays on the feed at that item).
- `/incidents/`: **Recent incident reports**, the feed's incidents newest first, with the
  incident pattern, pattern and evidence filters (`?category=`, `?pattern=`, `?evidence=`, and
  `?incident=` for the reports one deep dive tells).
- `/feed.xml`: the newest 100 items as RSS 2.0.
- The home page's **Today in AI security**, up to 12: the headline and notable items filed on the
  newest `added` day, then the other headline and notable items newest by `date`, then briefs.
- A pattern's **Incidents** tab: the five newest incidents that name the pattern, after its deep
  dives, and a link to all of them in the report list.
- A deep dive's page: "In the feed: N reports", when items name it in `incident`.
- A control's page: **Tools that deliver it**, from `data/security-tools/`.
- Site search, by title.

The build keeps the feed out of the JavaScript every page loads: it writes
`src/data/generated/feed.json` (the items and the overviews, read only when pages are built) and,
under `public/data/feed/`, one file per month, an index (the months, the Latest day and every week
with its counts and overview) and the titles search uses. All are generated and never committed.

The `ai-security-daily` skill (`.claude/skills/ai-security-daily/`) adds items of every kind, and
hands incidents to `incident-research` (`.claude/skills/incident-research/`): every lead that
meets the bar gets one item.
