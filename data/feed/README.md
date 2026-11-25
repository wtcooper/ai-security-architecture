# The feed: AI security daily

Every real AI security incident we track, and the product updates, security tools, launches and
research that change how AI is secured, newest first, each in two or three lines. It is shown at
`/feed/`. Incidents are filed under the site's incident patterns and the patterns they would
replay on. The files in `data/incidents/` are the **deep dives**: the few incidents that teach
something new, told step by step on a pattern's drawing. An incident links to the catalogue
incident that tells it, when there is one.

The folder may be empty: the build then makes an empty feed and the page says so.

| `kind` | What it is |
| --- | --- |
| `incident` | A real attack on an AI system, or by one, filed under an incident pattern (`category`). The default: an item written without a `kind` is an incident. |
| `productUpdate` | A vendor ships or changes a security control in an AI product. |
| `tool` | A new open-source or commercial tool that protects AI systems. |
| `launch` | A new AI product or feature that changes where data goes or what an organisation can control. |
| `research` | How leading teams secure AI, new standards and agency guidance. |

## Files

`data/feed/<YYYY-MM>.yaml`, one per month of the items' `date`, each holding an `items:` list,
newest first:

```yaml
items:
  - id: mittwald-mcp-server             # unique across all feed files; kebab-case
    date: 2026-11-07                    # the day it came to light (YYYY-MM-DD), inside the file's month
    title: "Mittwald's own MCP server breached: customers' session tokens read, 56 projects taken"
    summary: >
      One to three plain past-tense sentences: who, what, the result.
    category: exploitedSoftware         # incidents only: the incident pattern id (data/incident-patterns/)
    perspective: target                 # incidents only: target = an AI system was attacked; weapon = an AI agent ran the attack
    evidence: exploited                 # incidents only: exploited | confirmed | demonstrated | reported
    patterns: [archRemoteMcpServer]     # 0 to 3 pattern ids it would replay on; [] when none fits
    incident: mittwald-mcp-server       # optional, incidents only: the catalogue incident that tells it
    cves: [CVE-2026-0000]               # optional
    sources:                            # 1 to 3; the primary first
      - title: "The page's own title"
        url: https://...
        publisher: mittwald
        date: 2026-11-07

  - id: claude-code-otel-endpoint-setting
    kind: productUpdate                 # productUpdate | tool | launch | research
    date: 2026-11-20
    title: "Claude Code lets administrators pin where its traces go"
    summary: >
      The TL;DR: what was announced, in one to three sentences.
    why: "One line: why it matters for security."
    vendor: Anthropic                   # optional: who announced it
    products: [toolClaudeCode]          # optional: tooling ids (data/tooling/)
    controls: [cap-agent-tracing]       # optional: catalogue ids it delivers or changes
    patterns: [archCodingAgentThirdParty]
    update:                             # optional: the change to the site it implies
      action: settings                  # settings | toolOption | onboard | newControl | newPattern | controlGuidance
      status: applied                   # applied | proposed | declined
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
| `id` | Kebab-case, unique across every feed file. It is the item's anchor on the page (`/feed/#<id>`), which is where search and the RSS feed land. |
| `kind` | One of the five above; left out, `incident`. |
| `date` | A real day, `YYYY-MM-DD`, inside the month the file is named for: the day it came to light or was first announced. The feed groups items under the week (Monday to Sunday) of this date. |
| `title` | At most 120 characters. |
| `summary` | At most 420 characters. |
| `why` | At most 200 characters: why it matters for security, in one line. Required for every kind but an incident, which may have one. |
| `vendor` | Optional, at most 80 characters: who announced it. |
| `products` | Optional. Tooling ids from `data/tooling/` (`toolClaudeCode`), each once. Each tag opens that product's settings on its pattern. |
| `controls` | Optional. Catalogue ids (a MITRE mitigation or a `cap-*` specialisation), each once. Each tag opens the control in `/controls/`. |
| `category` | Incidents only, and required there. One of the incident pattern ids in `data/incident-patterns/`: `promptInjection`, `supplyChain`, `identity`, `exposed`, `exploitedSoftware`, `aiMadeExposure`, `breakout`, `aiAttacker`. It names how the chain started, not where it ended. |
| `fit` | Incidents only. Optional, `loose` only: the item fits its incident pattern only loosely. Needs `fitNote`. |
| `fitNote` | With `fit`, at most 160 characters: why the fit is loose. Three or more loose items in 60 days sharing a mechanism whose controls differ are the case for a new incident pattern. |
| `perspective` | Incidents only, and required there: `target` or `weapon`. |
| `evidence` | Incidents only, and required there: `exploited` (shown as **In the wild**), `confirmed` (by the vendor, the victim or an agency), `demonstrated` (against a real product, then patched or given a CVE) or `reported` (**Single report**: one report, unconfirmed). |
| `patterns` | Zero to three pattern ids that exist (`data/reference/architectures/`). |
| `incident` | Incidents only. Optional. An incident id in `data/incidents/`: the file that tells it, or the file that lists it under `alsoSeen`. |
| `cves` | Optional. `CVE-YYYY-NNNN` identifiers. |
| `update` | Optional. `action`, `status` and `target` from the lists above, and a `note` of at most 200 characters. An applied update must name a file that exists, or an id of the kind its action names. |
| `sources` | One to three, the primary first, each with the page's own `title`, an `https://` `url` and a `publisher`; `date` (`YYYY-MM-DD`) where the page has one. |

No other field is accepted. Write in the site's words (pattern, control, risk; never
"archetype" in prose, which the build rejects) and use no adjective the sources do not support.

## Decisions: `data/feed/decisions.yaml`

The owner's answers to proposed updates, one line per item:

```yaml
- { id: xai-private-inference, decision: approve }
- { id: some-research-post, decision: decline, note: "No change to the control." }
```

Each `id` must be an item in the feed with an `update`, decided once; `decision` is `approve` or
`decline`; `note` is at most 200 characters. The daily run carries out at most one approved
onboard or control change a run, sets the item's `update.status`, and removes the line.

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

- `/feed/`: **Latest** (the newest day's items, as headlines), **Proposed site updates** (every
  item whose update is proposed, with how to approve it), then every item under its week, with
  kind chips (`?kind=`) and the incident filters, which narrow incidents only: incident pattern,
  pattern and evidence (`?category=`, `?pattern=`, `?evidence=`). The page is built with its
  newest seven days and loads older months as the reader scrolls or filters.
- `/feed.xml`: the newest 100 items as RSS 2.0.
- A pattern's **Incidents** tab: the five newest incidents that name the pattern, after its
  catalogue incidents, and a link to all of them in the feed.
- A catalogue incident's page: "In the feed: N reports", when items name it in `incident`.
- A control's page: **Tools that deliver it**, from `data/security-tools/`.
- Site search, by title.

The build keeps the feed out of the JavaScript every page loads: it writes
`src/data/generated/feed.json` (read only when pages are built) and, under `public/data/feed/`,
one file per month, an index and the titles search uses. All are generated and never committed.

The `ai-security-daily` skill (`.claude/skills/ai-security-daily/`) adds items of every kind, and
hands incidents to `incident-research` (`.claude/skills/incident-research/`): every lead that
meets the bar gets one item.
