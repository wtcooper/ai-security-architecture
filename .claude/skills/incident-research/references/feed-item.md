# The feed item

Every incident that passes the first four tests in the skill's section 3 gets one feed item,
whether or not it also earns a deep dive. Items live in `data/feed/<YYYY-MM>.yaml`, one file per
month of the item's `date`, newest first within the file. The page is `/feed/`, the daily
review. The build (`npm run data`) checks everything marked **checked** below and names the
file and the item when something is wrong. `data/feed/README.md` is the same format, for readers
of the data.

## Skeleton

```yaml
items:
  - id: mittwald-mcp-server             # unique across all feed files; kebab-case. checked
    date: 2026-11-07                    # the day it came to light, inside the file's month. checked
    title: "Mittwald's own MCP server breached: customers' session tokens read, 56 projects taken"   # <= 120 characters. checked
    summary: >                          # <= 420 characters. checked
      One to three plain past-tense sentences: who, what, the result.
    category: exploitedSoftware         # an incident pattern id (data/incident-patterns/). checked
    perspective: target                 # target | weapon. checked
    evidence: exploited                 # exploited | confirmed | demonstrated | reported. checked
    fit: loose                          # optional: only when it fits its incident pattern loosely. checked
    fitNote: "<= 160: what about it the incident pattern does not cover"   # with fit: loose, and only then. checked
    patterns: [archRemoteMcpServer]     # 0 to 3 pattern ids it would replay on; [] when none fits. checked
    incident: mittwald-mcp-server       # optional: the deep dive that tells it. checked
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
- **`category`** is the incident pattern that names how the chain *started* (the skill's section
  4 has the rule and the eight). `incident-index.mjs` lists the ids.
- **`fit: loose`** is for an item that belongs nowhere better but does not sit well where it is:
  the chain started in a way its incident pattern's overview does not describe, or the controls
  that would stop it are not the ones its incident pattern lists. Say why in `fitNote`, naming
  the mechanism, so a later run can see three of them share one. Leave both out when the item
  fits; most do.
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
  These are what an incident pattern's "Where it lands" counts.
- **`incident`** links the item to the deep dive that tells it. Set it when you write a deep dive
  for the incident, and when you add it to a deep dive as an `alsoSeen` entry (point at that
  file). An existing deep dive or `alsoSeen` entry with no feed item gets one the next time a run
  touches it. The item then shows **Deep dive →**.
- **`summary`** is the incident in plain past tense: who, what, the result. No adjectives the
  sources do not support; a figure that is the source's own estimate says so.
- **`sources`** are the pages you read, the primary first. A single-source item is fine; its
  `evidence` is then `reported` unless the one source is the vendor, the victim or an agency.

## Words

The reader's words are pattern, incident pattern, control and risk. The build rejects
"archetype" in a title, a summary or a fit note.
