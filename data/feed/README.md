# The incident feed

Every real AI security incident we track, newest first, each in two or three lines, filed under
the site's incident categories and the patterns it would replay on. It is shown at
`/feed/`. The files in `data/incidents/` are the **deep dives**: the few incidents that
teach something new, told step by step on a pattern's drawing. A feed item links to the
catalogue incident that tells it, when there is one.

The folder may be empty: the build then makes an empty feed and the page says so.

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
    category: exploitedSoftware         # the incident pattern id: how the chain started (data/incident-patterns/)
    perspective: target                 # target = an AI system was attacked; weapon = an AI agent ran the attack
    evidence: exploited                 # exploited | confirmed | demonstrated | reported
    patterns: [archRemoteMcpServer]     # 0 to 3 pattern ids it would replay on; [] when none fits
    incident: mittwald-mcp-server       # optional: the catalogue incident that tells it
    cves: [CVE-2026-0000]               # optional
    sources:                            # 1 to 3; the primary first
      - title: "The page's own title"
        url: https://...
        publisher: mittwald
        date: 2026-11-07
```

| Field | Rule (`npm run data` checks each, naming the file and the item) |
| --- | --- |
| `id` | Kebab-case, unique across every feed file. It is the item's anchor on the page (`/feed/#<id>`), which is where search lands. |
| `date` | A real day, `YYYY-MM-DD`, inside the month the file is named for. The feed groups items under the week (Monday to Sunday) of this date. |
| `title` | At most 120 characters. |
| `summary` | At most 420 characters. |
| `category` | One of the eight incident pattern ids in `data/incident-patterns/`: `promptInjection`, `supplyChain`, `identity`, `exposed`, `exploitedSoftware`, `aiMadeExposure`, `breakout`, `aiAttacker`. It names how the chain started, not where it ended. |
| `fit` | Optional, `loose` only: the item fits its incident pattern only loosely. Needs `fitNote`. |
| `fitNote` | With `fit`, at most 160 characters: why the fit is loose. Three or more loose items in 60 days sharing a mechanism whose controls differ are the case for a new incident pattern. |
| `perspective` | `target` or `weapon`. |
| `evidence` | `exploited` (shown as **In the wild**), `confirmed` (by the vendor, the victim or an agency), `demonstrated` (against a real product, then patched or given a CVE) or `reported` (**Single report**: one report, unconfirmed). |
| `patterns` | Zero to three pattern ids that exist (`data/reference/architectures/`). |
| `incident` | Optional. An incident id in `data/incidents/`: the file that tells it, or the file that lists it under `alsoSeen`. |
| `cves` | Optional. `CVE-YYYY-NNNN` identifiers. |
| `sources` | One to three, the primary first, each with the page's own `title`, an `https://` `url` and a `publisher`; `date` (`YYYY-MM-DD`) where the page has one. |

No other field is accepted. Write in the site's words (pattern, control, risk; never
"archetype" in prose, which the build rejects) and use no adjective the sources do not support.

## Where it shows

- `/feed/`: every item under its week, with filters for incident pattern, reference pattern and
  evidence (`?category=`, `?pattern=`, `?evidence=`).
- A pattern's **Incidents** tab: the five newest items that name the pattern, after its
  catalogue incidents, and a link to all of them in the feed.
- A catalogue incident's page: "In the feed: N reports", when items name it in `incident`.
- Site search, by title.

The `incident-research` skill (`.claude/skills/incident-research/`) adds items: every lead that
meets its bar gets one, whether or not it earns a catalogue file.
