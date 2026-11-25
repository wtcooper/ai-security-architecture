---
name: incident-research
description: Search the web, as of today's date, for real security incidents involving AI systems that this repository's Incidents section does not yet have, verify each against its sources, give every one that qualifies a short item in the incident feed, and write the ones that teach something new as step-by-step walk-throughs replayed on the pattern they happened on. Use this whenever someone asks to update, refresh or check the incidents or the feed, asks "any new AI incidents", "what has happened since the last update", "add the X breach / CVE / attack to the incidents page", wants a daily, weekly or monthly incident sweep (including a scheduled routine run), or shares a link to an AI security incident and asks whether it belongs — even if they do not say "incident research". It both researches and writes the feed items and incident files; a pattern the incident needs but the catalogue lacks is handed to pattern-research and pattern-author.
---

# incident-research: bring the Incidents section up to today

The Incidents section has two views. The **feed** (`data/feed/<YYYY-MM>.yaml`, shown at
`/incidents/feed/`) is every real AI security incident we track, each in two or three lines,
newest first. The **catalogue** (`data/incidents/`, shown at `/incidents/`) is the few that
teach something new, each told as a sequence of sourced steps and replayed on the drawing of
the pattern it happened on, ending at the controls that would have broken the chain. Both are
only useful while they are current and while every line on them can be traced to a source.
This skill finds what is new since the last update, checks it, and writes it in the form the
site builds.

It leaves three things: new items in `data/feed/`, new or extended files in `data/incidents/`,
and a dated log, `docs/research/incidents/<today>.md`, that records what was searched, what was
added and what was turned down and why. The log matters as much as the files: it is how the
next run knows where to start, and how a reader knows a missing incident was considered and not
missed.

A scheduled run (daily or weekly) follows **Routine run** at the end, which shortens the steps
below; everything else here still applies to it.

## 1. Fix the date and the window

Your training data is older than today. Do not decide what is "new" from memory.

```bash
npm run data
node .claude/skills/incident-research/scripts/incident-index.mjs
```

This prints today's date (UTC), the last scan on record, the newest feed item and the newest
incident on file, the next free file number, every incident already there with its "also
seen" entries, every feed item, and which patterns have no incident yet. The window runs from
the newest feed date to today. With an empty feed, it runs from the earlier of (last scan,
first day of the newest incident's month) to today; with no scan on record either, start one
month before the newest incident, because disclosures lag events. Write the window down and
put the month and year in your queries.

`incident-index.mjs --urls` lists every source address already cited, in the catalogue and in
the feed. A search result that is already in that list is not a new incident.

## 2. Sweep every lane

Search each lane with several wordings, and keep going in a lane until two searches in a row
give nothing new. Log each query with the number of new leads. If you can run subagents, give
each lane to one and ask for leads with addresses and dates; do the verifying and judging
yourself.

| Lane | Where to look |
| --- | --- |
| **Incident trackers** | The AI Incident Database, the OECD AI incidents monitor, MITRE ATLAS case studies, AVID, and any tracker a search for "AI security incident tracker" turns up this year. |
| **Vendor disclosures** | Security advisories, post-mortems and trust-centre notices from model labs, clouds, and the vendors of agents, gateways, runtimes and AI features in business software. |
| **Vulnerabilities** | CVE and GitHub advisory entries in the window for agent frameworks, coding agents, MCP servers, model runtimes, AI gateways, vector stores and model file formats. A CVE alone is a vulnerability; it becomes an incident with exploitation or a demonstrated chain against a real product. |
| **Security research** | Write-ups from security research teams and independent researchers, and talks from the security conferences inside the window. |
| **Security press** | The security news outlets, for leads and for the independent second source. |
| **Agencies** | National cyber agencies and CERTs: advisories and joint guidance that describe real campaigns. |
| **By attack type** | One pass per category the page uses: prompt injection, supply chain, identity and credentials, exposed by default, agent breaks out, AI as the attacker. |
| **By pattern** | One pass per pattern, naming its products (`pattern-map.mjs` lists patterns; the index shows which have no incident yet). Patterns with no incident are where a find is most valuable. |

## 3. Decide what belongs

A lead earns a **feed item** when the first four of these hold, and a **catalogue file** when
all five do:

- **It happened.** A real system was attacked, or a chain was demonstrated end to end against a
  real, named product and the vendor confirmed, patched or assigned an identifier. A lab
  demonstration against a toy, a theoretical paper or a prediction does not qualify.
- **The AI system is what was attacked, or what did the attacking.** A breach at an AI company
  that did not touch an AI system is ordinary security news.
- **It is a security incident.** The page's six categories are the scope. Harms such as bias,
  hallucinated advice or deepfake fraud belong to other catalogues.
- **It is inside the window**, by the date it came to light.
- **It teaches something the catalogue does not already show**: a new chain, a pattern with no
  incident yet, or a case materially larger or better documented than the one on file.

Every lead that meets the first four gets a feed item, even when it does not earn a catalogue
file: the feed is the record of everything that happened, the catalogue the record of what it
taught. A find that repeats a chain already on file belongs as an `alsoSeen` entry on that
incident, not as a new file, and gets a feed item that points at that incident. A new
catalogue file gets a feed item too, pointing at itself. That keeps the catalogue to distinct
lessons, the feed complete, and each event findable from both.

**The source bar.** At least one primary source (the vendor, the affected organisation, the
researcher who found it, an agency) and, where one exists, an independent second. An account
resting on a single report, or on figures nobody else has confirmed, can still be filed, but
it must carry a `caveat` saying exactly that.

Record every lead you turn down in the log with a one-line reason. "Considered and rejected"
is information; silence is not.

## 4. Verify before you write

Read every source you will cite, with the fetch tool, on the day you cite it. For each step of
the chain, be able to point to the sentence that supports it. Take dates, counts, names,
versions and identifiers from the page, never from memory or from a search snippet. Where two
sources disagree, say so in the narrative or the caveat instead of picking one silently.

If a page will not load, do not cite it. If the only source for a step will not load, the step
is not verified and the incident waits for the next run; note it in the log.

## 5. Choose the pattern

Every incident replays on exactly one pattern: the one whose drawing the chain actually ran
across.

```bash
node .claude/skills/incident-research/scripts/pattern-map.mjs                # list them
node .claude/skills/incident-research/scripts/pattern-map.mjs <id-or-slug>   # boxes, flows, controls
```

Pick by where the decisive steps happened and who ran those parts, not by the vendor's name.
If the chain crosses two patterns, use the one where it could have been stopped, and say in a
comment above `archetype:` why, as the existing files do.

If no pattern can carry the chain (you would have to invent a box or a flow to tell the
story), do not force it. That is a finding about the catalogue: stop, record it in the log,
and hand it to `pattern-research`. An incident on a system the catalogue cannot draw is the
best evidence there is for a new pattern.

## 6. Write the catalogue file

For an incident that earns one, create `data/incidents/<NN>-<id>.yaml` with the next number.
Follow [references/incident-file.md](references/incident-file.md) for every field, and open the
two most recent files in the folder to match their voice. The parts that need judgment:

- **Steps** are the chain in order, usually four to seven. Each is one movement: something
  goes from one place to another, or something happens inside one box. The last step is always
  the `mitigated` one: what would have stopped it.
- **`path`** places each step on the drawing, using the flow keys and box ids
  `pattern-map.mjs` prints. This is what lights up on the page, so it must be what the
  narrative says. The build rejects a flow that does not exist and a step whose flows do not
  connect.
- **`breaks`** are one to six controls *pinned on that pattern* that would have broken the
  chain, each with a line saying where it bites. Choose the ones that would have stopped this
  incident, not every control that is generally a good idea.
- **Narrative** is plain past tense, specific, and no longer than it needs to be: who did
  what, to what, with what result. No adjectives the sources do not support.

Write for a security architect who has ten minutes. Use the site's words: pattern, control,
risk. The tests reject "archetype" in prose.

To add an `alsoSeen` entry instead, append it to the existing incident with its own source.

## 6a. Write the feed items

Add one item per qualifying lead to `data/feed/<YYYY-MM>.yaml`, the month of the day it came to
light, newest first within the file; create the month's file if it is not there. Follow
[references/feed-item.md](references/feed-item.md) for every field. The parts that need
judgment:

- **`evidence`** is the strongest the sources you read support: in the wild, confirmed,
  demonstrated, or a single report. No stronger.
- **`patterns`** are the ones the chain would replay on, at most three; `[]` when none fits.
- **`incident`** points at the catalogue file that tells it, whether as its own walk-through
  or as an `alsoSeen` entry. Every catalogue file and `alsoSeen` entry written in this run gets
  an item that points at it.
- **`summary`** is one to three plain past-tense sentences: who, what, the result.

The item is read in a few seconds, so it says what happened and stops. Read the primary source
before you write it, as for a catalogue file.

## 7. Build, test, look

```bash
npm run data      # every rule about paths, breaks, risks, dates and feed items; fix each error it names
npm test
npm run dev       # then open /incidents/<id>/ and step through it, and /incidents/feed/
```

Step through the walk-through in the browser: each step should light the boxes and arrows the
narrative describes, and the last step should light the breaking controls. A path that builds
but lights the wrong part of the drawing is the mistake the build cannot catch. On the feed,
check that each new item sits under the right week and that its **Step by step →** opens the
incident it names.

## 8. Log and report

Write `docs/research/incidents/<today>.md`: the window; a table of what was added to the
catalogue (file, date, category, pattern, sources); what was added as "also seen"; a table of
the feed items added (id, date, category, evidence, patterns, catalogue incident); what was
rejected and why; what could not be verified; anything that fits no pattern; and the search log.

Then tell the person, briefly: the window, what was added, what was rejected and anything that
needs their decision. Commit only if asked to, or if the run's instructions say to.

## Routine run

A scheduled run, daily or weekly, keeps the feed current between full sweeps. It is the steps
above, narrowed:

1. **Window.** From the newest feed date (`incident-index.mjs` prints it) to today. Nothing
   older is swept; a find older than the window that no one has filed is recorded in the log
   for the next full sweep, not added.
2. **Sweep.** The trackers, vendor disclosures, vulnerabilities, agencies and security press
   lanes, with the window's dates in the queries. The by-type and by-pattern passes are for the
   full sweep; run them only when the window is longer than a week.
3. **Read the primary source of each item before adding it**, with the fetch tool, on the day.
   A lead whose primary source will not load waits for the next run, noted in the log.
4. **Add feed items** for every lead that meets the first four tests, and **write catalogue
   files only for distinct lessons**: a new chain, a pattern with no incident yet, or a case
   materially larger than the one on file. A repeat becomes an `alsoSeen` entry and a feed item
   pointing at it. Most routine runs add feed items and no catalogue file; that is the
   expected result, not a thin one.
5. **Log** under `docs/research/incidents/<today>.md`, as in section 8. A run that finds
   nothing still writes the log: the window, the queries and "nothing new", so the next run
   knows this stretch was searched.
6. **Build, test, commit, push** as the run's instructions say: `npm run data` and `npm test`
   must pass before anything is committed; commit the feed and incident files, the log and the
   rebuilt dataset, unless the instructions say otherwise; push only to the branch they name.
   If the build or the tests fail and the fix is not plainly yours to make, commit nothing,
   say what failed in the log, and stop.
