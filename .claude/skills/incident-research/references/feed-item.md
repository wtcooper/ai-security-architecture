# The feed item

Every incident that passes the first four tests in the skill's section 3 gets one feed item,
whether or not it also earns a catalogue file. Items live in `data/feed/<YYYY-MM>.yaml`, one
file per month of the item's `date`, newest first within the file. The page is
`/incidents/feed/`. The build (`npm run data`) checks everything marked **checked** below and
names the file and the item when something is wrong. `data/feed/README.md` is the same format,
for readers of the data.

## Skeleton

```yaml
items:
  - id: mittwald-mcp-server             # unique across all feed files; kebab-case. checked
    date: 2026-11-07                    # the day it came to light, inside the file's month. checked
    title: "Mittwald's own MCP server breached: customers' session tokens read, 56 projects taken"   # <= 120 characters. checked
    summary: >                          # <= 420 characters. checked
      One to three plain past-tense sentences: who, what, the result.
    category: identity                  # one of the six categories. checked
    perspective: target                 # target | weapon. checked
    evidence: exploited                 # exploited | confirmed | demonstrated | reported. checked
    patterns: [archRemoteMcpServer]     # 0 to 3 pattern ids it would replay on; [] when none fits. checked
    incident: mittwald-mcp-server       # optional: the catalogue incident that tells it. checked
    cves: [CVE-2026-0000]               # optional. checked
    sources:                            # 1 to 3, the primary first; https only. checked
      - title: "The page's own title"
        url: https://...
        publisher: mittwald
        date: 2026-11-07
```

No other field is accepted.

## The fields that need judgment

- **`date`** is the day it came to light: the first public account, the vendor's notice or the
  agency's advisory, whichever came first. Not the day the attack began. A November disclosure
  of a September attack goes in `2026-11.yaml`.
- **`evidence`** says how well it is established, from the sources you read:
  - `exploited`: used against real systems (shown as **In the wild**);
  - `confirmed`: the vendor, the victim or an agency confirmed it;
  - `demonstrated`: a chain shown end to end against a real, named product that was then
    patched or given an identifier;
  - `reported`: one report nobody else has confirmed (shown as **Single report**).
  Take the strongest the sources support, and no stronger.
- **`patterns`** are the patterns the incident would replay on, as `pattern-map.mjs` lists them:
  the one whose drawing the chain ran across first, then at most two more it would equally run
  on. `[]` is right when none fits; record that in the log as a finding for `pattern-research`.
- **`incident`** links the item to the catalogue file that tells it. Set it when you write a
  catalogue file for the incident, and when you add it to a catalogue file as an `alsoSeen`
  entry (point at that file). An existing catalogue file or `alsoSeen` entry with no feed item
  gets one the next time a run touches it.
- **`summary`** is the incident in plain past tense: who, what, the result. No adjectives the
  sources do not support; a figure that is the source's own estimate says so.
- **`sources`** are the pages you read, the primary first. A single-source item is fine; its
  `evidence` is then `reported` unless the one source is the vendor, the victim or an agency.

## Categories

The same six as the catalogue (`references/incident-file.md` has the table): pick the one that
names how the chain started.

## Words

The reader's words are pattern, control and risk. The build rejects "archetype" in a title or a
summary.
