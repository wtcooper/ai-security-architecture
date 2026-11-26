# The feed item

Every incident that passes the first four tests in the skill's section 3 gets one feed item,
whether or not it also earns a deep dive. Items live in `data/feed/<YYYY-MM>.yaml`, one file per
month of the item's `date`, newest first within the file. The page is `/feed/`. The build
(`npm run data`) checks the format and names the file and the item when something is wrong;
`ai-security-daily`'s `feed-lint.mjs` adds the run's rules (marked **lint**), and its verifier
checks every claim against the sources before anything is committed. `data/feed/README.md` is
the same format, for readers of the data.

## Skeleton

```yaml
items:
  - id: mittwald-mcp-server             # unique across all feed files; kebab-case; its anchor /feed/#<id>
    weight: notable                     # headline | notable | brief; required; at most 3 headlines a day, all kinds (lint)
    story: mittwald-mcp                 # optional: the thread's story in data/feed/stories.yaml, for a follow-up
    date: 2026-11-07                    # the day it came to light, inside the file's month
    title: "Mittwald's own MCP server breached: session tokens read, 56 projects taken"   # <= 90; aim for ~70
    summary: >                          # <= 280; aim for ~200
      One to three plain past-tense sentences: who, what, the result.
    why: "Check whether your MCP server accepts new accounts' tokens for other tenants."   # <= 160: what a defender should check or do
    category: exploitedSoftware         # an incident pattern id (data/incident-patterns/)
    perspective: target                 # target | weapon
    evidence: exploited                 # exploited | confirmed | demonstrated | reported
    fit: loose                          # optional: only when it fits its incident pattern loosely
    fitNote: "<= 160: what about it the incident pattern does not cover"   # with fit: loose, and only then
    patterns: [archRemoteMcpServer]     # 0 to 3 pattern ids it would replay on; [] when none fits
    incident: mittwald-mcp-server       # optional: the deep dive that tells it, when the source ties it there
    cves: [CVE-2026-0000]               # optional
    sources:                            # 1 to 3, the primary first; https only; never a lead (lint)
      - title: "The page's own title"
        url: https://...
        publisher: mittwald
        date: 2026-11-07
```

An incident may also carry the fields every kind of item may: `kind: incident` (the default, so
leave it out), `vendor`, `products` (tooling ids such as `toolClaudeCode`), `controls` (catalogue
ids) and `update` (the change to the site it implies, such as a correction to a product's row
the incident shows is wrong). `ai-security-daily`'s
[references/feed-kinds.md](../../ai-security-daily/references/feed-kinds.md) has their rules. No
other field is accepted.

## The fields that need judgment

- **`date`** is the day it came to light: the first public account, the vendor's notice or the
  agency's advisory, whichever came first. Not the day the attack began. A November disclosure
  of a September attack goes in `2026-11.yaml`.
- **One event per item.** A post that tells two cases is two items (or one story with two
  items). Never let one item carry figures from two cases.
- **`weight`**: `headline` for a confirmed large incident or one a reader would be poorly served
  not knowing today; `notable` for one worth reading this week; `brief` for a line. The fifth
  agency confirmation of a known trend, with no chain and no new technique, is a brief.
- **`story`**: a follow-up of a campaign, framework, actor or vulnerability already in the feed
  in the last month joins that thread's story (`feed-lint` flags items that share a deep dive or
  a distinctive name with recent ones and no story). Campaign threat intelligence about a known
  thread (a vendor's detections for it, an agency's confirmation, a new victim) is a follow-up.
- **`category`** is the incident pattern that names how the chain *started* (the skill's section
  4 has the rule and the eight). `incident-index.mjs` lists the ids.
- **`fit: loose`** is for an item that belongs nowhere better but does not sit well where it is:
  the chain started in a way its incident pattern's overview does not describe, or the controls
  that would stop it are not the ones its incident pattern lists. Say why in `fitNote`, naming
  the mechanism truly (AI software such as Langflow is not "ordinary web software"), so a later
  run can see three of them share one. Leave both out when the item fits; most do.
- **`evidence`** says how well it is established, from the sources you read:
  - `exploited`: used against real systems, including intrusions a vendor observed in its own
    telemetry (shown as **In the wild**);
  - `confirmed`: the vendor, the victim or an agency confirmed it;
  - `demonstrated`: a chain shown end to end against a real, named product that was then
    patched or given an identifier;
  - `reported`: one report nobody else has confirmed (shown as **Single report**).
  Take the strongest the sources support, no stronger, and no weaker than items already filed on
  the same kind of evidence.
- **`patterns`** are the patterns the incident would replay on, as `pattern-map.mjs` lists them:
  the one whose drawing the chain ran across first, then at most two more it would equally run
  on. `[]` is right when none fits; record that in the log as a finding for `pattern-research`.
  These are what an incident pattern's "Where it lands" counts.
- **`incident`** links the item to the deep dive that tells it. Set it when you write a deep dive
  for the incident, and when you add it to a deep dive as an `alsoSeen` entry (point at that
  file), and only when the source ties the case to that deep dive: an agency that names a
  framework as an example has not attributed its cases to it. An existing deep dive or `alsoSeen`
  entry with no feed item gets one the next time a run touches it. The item then shows **Deep
  dive →**.
- **`title`** says what happened, plainly, with at most one figure; the figure as the source
  gives it ("more than a dozen organisations, at varying confidence" does not become "a dozen
  organisations").
- **`summary`** is the incident in plain past tense: who, what, the result. No adjectives the
  sources do not support; a figure that is the source's own estimate says so, and a figure from
  an attacker's leaked logs says that.
- **`why`** is the one line a defender acts on: what to check, hunt for or change. It states no
  inference as fact.
- **`sources`** are the pages you read, the primary first. A single-source item is fine; its
  `evidence` is then `reported` unless the one source is the vendor, the victim or an agency.

## Words

The reader's words are pattern, incident pattern, control and risk. The build rejects
"archetype" in a title, a summary or a fit note.
