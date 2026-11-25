---
name: incident-research
description: Search the web, as of today's date, for real security incidents involving AI systems that this repository's feed does not yet have, verify each against its sources, file every one that qualifies as a short feed item under its incident pattern, write the few that meet the deep-dive test as step-by-step walk-throughs replayed on the pattern they happened on, and add a new incident pattern when loose items show one is missing. Use this whenever someone asks to update, refresh or check the incidents or the feed, asks "any new AI incidents", "what has happened since the last update", "add the X breach / CVE / attack to the incidents page", wants an incident sweep (including the scheduled daily run), or shares a link to an AI security incident and asks whether it belongs — even if they do not say "incident research". It both researches and writes the feed items, deep dives and incident pattern files; a pattern the incident needs but the catalogue lacks is handed to pattern-research and pattern-author.
---

# incident-research: bring the incidents and the feed up to today

The site keeps real AI security incidents in three layers. The **feed**
(`data/feed/<YYYY-MM>.yaml`, shown at `/feed/`) is every real AI security incident we track,
each in two or three lines, newest first: the daily review. The **incident patterns**
(`data/incident-patterns/`, shown at `/incidents/`) are how AI systems are being attacked: each
says what the attack is and what stops it, and every feed item and deep dive is filed under one
by its `category`. The **deep dives** (`data/incidents/`, shown at `/incidents/<id>/`) are the
few incidents that teach something new, each told as a sequence of sourced steps and replayed on
the drawing of the pattern it happened on, ending at the controls that would have broken the
chain; they are the exemplars of their incident pattern. All three are only useful while they are
current and while every line on them can be traced to a source. This skill finds what is new
since the last update, checks it, and writes it in the form the site builds.

Two words that must not be mixed: an **incident pattern** is a kind of attack; a **pattern** is
a reference architecture (`/patterns/`), the drawing an incident replays on. Never write bare
"pattern" for the first.

It leaves up to four things: new items in `data/feed/`; at most two new deep dives or `alsoSeen`
entries in `data/incidents/`; at most one new incident pattern in `data/incident-patterns/`; and
the log, one file per week, `docs/research/incidents/<this week's Monday>.md`, that records what
was searched, what was added and what was turned down and why. The log matters as much as the
files: it is how the next run knows where to start, and how a reader knows a missing incident was
considered and not missed.

The scheduled run is daily and follows **Daily run** at the end, which shortens the steps below;
everything else here still applies to it.

## 1. Fix the date and the window

Your training data is older than today. Do not decide what is "new" from memory.

```bash
npm run data
node .claude/skills/incident-research/scripts/incident-index.mjs
```

This prints today's date (UTC), this week's log file, the newest feed item and deep dive on file,
the next free file numbers, every incident pattern with its deep dives and feed items, every deep
dive with its "also seen" entries, every feed item, the incident patterns and patterns with no
deep dive yet, and the loose items of the last 60 days. The window runs from seven days before
the newest feed date to today: disclosures surface late, and anything already in the feed is
skipped, so the overlap costs nothing. With an empty feed, it runs from the first day of the
newest deep dive's month to today; with no deep dive either, start one month back, because
disclosures lag events. Write the window down and put the month and year in your queries.

`incident-index.mjs --urls` lists every source address already cited, in the deep dives and in
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
| **By incident pattern** | One pass per incident pattern, in its own words: its name, its one-liner and, where written, its How it works (`incident-index.mjs` lists them). Incident patterns with no deep dive yet are where a find is most valuable. |
| **By pattern** | One pass per pattern, naming its products (`pattern-map.mjs` lists patterns; the index shows which have no deep dive yet). |

## 3. Decide what belongs

A lead earns a **feed item** when all four of these hold:

- **It happened.** A real system was attacked, or a chain was demonstrated end to end against a
  real, named product and the vendor confirmed, patched or assigned an identifier. A lab
  demonstration against a toy, a theoretical paper or a prediction does not qualify.
- **The AI system is what was attacked, or what did the attacking.** A breach at an AI company
  that did not touch an AI system is ordinary security news.
- **It is a security incident.** The incident patterns are the scope. Harms such as bias,
  hallucinated advice or deepfake fraud belong to other catalogues.
- **It is inside the window**, by the date it came to light.

Every lead that meets the four gets a feed item: the feed is the record of everything that
happened.

A feed item earns a **deep dive** when any of these holds:

- it is the **first exemplar** for an incident pattern, or for a pattern that has no deep dive
  (`incident-index.mjs` lists both);
- it shows a **new chain** the deep dives do not, not a repeat of one on file;
- it is **confirmed large**: exploited in the wild and on CISA's catalogue of known exploited
  vulnerabilities, or 10,000 or more people or organisations affected;
- it drew **wide attention**: a national agency's advisory, or three or more independent outlets.

A find that meets the test but repeats a chain already told belongs as an `alsoSeen` entry on that
deep dive, not as a new file. Write **at most two** deep dives and `alsoSeen` entries a run, and
only with every source read (section 5); the rest wait, named in the log as candidates for the
next run, which takes them first. Each deep dive and `alsoSeen` entry gets a feed item that points
at it. That keeps the deep dives to distinct lessons, the feed complete, and each event findable
from both.

**The source bar.** At least one primary source (the vendor, the affected organisation, the
researcher who found it, an agency) and, where one exists, an independent second. An account
resting on a single report, or on figures nobody else has confirmed, can still be filed, but
a deep dive must carry a `caveat` saying exactly that, and a feed item's `evidence` is then
`reported`.

Record every lead you turn down in the log with a one-line reason. "Considered and rejected"
is information; silence is not.

## 4. Choose the incident pattern

The incident pattern names how the chain *started*, not where it ended or who was hurt.

| `category` | Incident pattern | Filed here when |
| --- | --- | --- |
| `promptInjection` | Prompt injection and agent hijack | Content the agent read steered it. |
| `supplyChain` | Poisoned supply chain | Something the AI system trusts (a package, model, plugin, skill, extension or release) arrived with the attacker's code in it. |
| `identity` | Stolen AI credentials and LLMjacking | Keys, tokens or accounts that reach AI systems were stolen, resold or spent. |
| `exposed` | Exposed by default | A service or store was reachable because its default (or its deployer) asked no one who was calling; nothing had to be exploited. |
| `exploitedSoftware` | Exploited AI software | An attacker used a flaw (a CVE or a vendor-confirmed bug) in AI software: serving engines, AI gateways, MCP servers and SDKs, agent frameworks, an AI platform's own code. |
| `aiMadeExposure` | AI-made exposure | The AI system's own output created the exposure: a generated app with open data or no sign-in, a key an agent committed, secrets an agent saved to a shared file, a page an agent published. |
| `breakout` | Agent escape and overreach | The organisation's or vendor's own agent left its sandbox or its brief. |
| `aiAttacker` | AI-run intrusions | The attacker's own AI agents ran the intrusion (`perspective: weapon`). |

`incident-index.mjs` prints the list as the data holds it, which is the one to trust if it has
grown. Each incident pattern's page (`/incidents/<slug>/`) says where its line with its
neighbours runs, under "Not the same as".

When an item belongs nowhere better but does not sit well where it is (the chain started in a way
its incident pattern does not describe, or the controls that would stop it are not the ones that
incident pattern lists), file it there anyway with `fit: loose` and a `fitNote` naming the
mechanism. Do not stretch an incident pattern's words to fit it, and do not invent a new one for
a single item: three loose items are the signal (section 9).

## 5. Verify before you write

Read every source you will cite, with the fetch tool, on the day you cite it. For each step of
the chain, be able to point to the sentence that supports it. Take dates, counts, names,
versions and identifiers from the page, never from memory or from a search snippet. Where two
sources disagree, say so in the narrative or the caveat instead of picking one silently.

If a page will not load, do not cite it. If the only source for a step will not load, the step
is not verified and the deep dive waits for the next run; note it in the log. A deep dive is
written only when every source it cites has been read.

## 6. Choose the pattern

A feed item names the patterns it would replay on, at most three. A deep dive replays on exactly
one: the one whose drawing the chain actually ran across.

```bash
node .claude/skills/incident-research/scripts/pattern-map.mjs                # list them
node .claude/skills/incident-research/scripts/pattern-map.mjs <id-or-slug>   # boxes, flows, controls
```

Pick by where the decisive steps happened and who ran those parts, not by the vendor's name.
If the chain crosses two patterns, use the one where it could have been stopped, and say in a
comment above `archetype:` why, as the existing files do. These choices are what an incident
pattern's "Where it lands" counts, so make them with care.

If no pattern can carry the chain (you would have to invent a box or a flow to tell the
story), do not force it. That is a finding about the catalogue: stop, record it in the log,
and hand it to `pattern-research`. An incident on a system the catalogue cannot draw is the
best evidence there is for a new pattern.

## 7. Write the feed items

Add one item per qualifying lead to `data/feed/<YYYY-MM>.yaml`, the month of the day it came to
light, newest first within the file; create the month's file if it is not there. Follow
[references/feed-item.md](references/feed-item.md) for every field. The parts that need
judgment:

- **`category`** is the incident pattern's id (section 4), with `fit: loose` and a `fitNote`
  when the fit is loose.
- **`evidence`** is the strongest the sources you read support: in the wild, confirmed,
  demonstrated, or a single report. No stronger.
- **`patterns`** are the ones the chain would replay on, at most three; `[]` when none fits.
- **`incident`** points at the deep dive that tells it, whether as its own walk-through or as an
  `alsoSeen` entry. Every deep dive and `alsoSeen` entry written in this run gets an item that
  points at it.
- **`summary`** is one to three plain past-tense sentences: who, what, the result.

The item is read in a few seconds, so it says what happened and stops. Read the primary source
before you write it, as for a deep dive.

## 8. Write the deep dive

For an incident that meets the deep-dive test, create `data/incidents/<NN>-<id>.yaml` with the
next number. Follow [references/incident-file.md](references/incident-file.md) for every field,
and open the two most recent files in the folder to match their voice. The parts that need
judgment:

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

Write for a security architect who has ten minutes. Use the site's words: pattern, incident
pattern, control, risk. The tests reject "archetype" in prose.

To add an `alsoSeen` entry instead, append it to the existing deep dive with its own source.

## 9. A new incident pattern

Add one only when **three or more feed items within 60 days are marked `fit: loose`, share a
mechanism, and the controls that stop them differ from the nearest incident pattern's**.
`incident-index.mjs` lists the loose items of the last 60 days by where they are filed; read
their fit notes together. Three items that are loose for three different reasons are not a
new incident pattern.

When the test holds, and **at most one a run**:

1. Write `data/incident-patterns/<NN>-<slug>.yaml` in full, following
   [references/incident-pattern-file.md](references/incident-pattern-file.md): every field, not
   only the required ones, with the controls that stop it taken from the catalogue.
2. Move those items to it: set their `category` to its id and remove `fit` and `fitNote`. Move
   any deep dive whose chain started the same way.
3. Write one deep dive if one of the moved items meets the deep-dive test, within the run's two.
4. Say in the log what moved, from where, and why the controls differ.

The owner can merge or rename it later; a new incident pattern is drawn in grey until the owner
gives it a colour.

## 10. Build, test, look

```bash
npm run data      # every rule about incident patterns, paths, breaks, risks, dates and feed items; fix each error it names
npm test
npm run dev       # then open /feed/, the incident pattern you touched (/incidents/<slug>/) and each new deep dive (/incidents/<id>/)
```

Step through each new deep dive in the browser: each step should light the boxes and arrows the
narrative describes, and the last step should light the breaking controls. A path that builds
but lights the wrong part of the drawing is the mistake the build cannot catch. On the feed,
check that each new item sits under the right week, that its chip opens the right incident
pattern and that its **Deep dive →** opens the deep dive it names.

## 11. Log and report

The log is one file per week, `docs/research/incidents/<this week's Monday>.md`
(`incident-index.mjs` names it and says whether it exists). Each run appends a section headed
with its date: the window; a table of the deep dives added (file, date, incident pattern,
pattern, sources); what was added as "also seen"; a table of the feed items added (id, date,
incident pattern, evidence, patterns, deep dive), loose ones marked; any incident pattern added
and what moved to it; candidates for a deep dive that wait for the next run; what was rejected
and why; what could not be verified; anything that fits no pattern; and the search log.

Then tell the person, briefly: the window, what was added, what was rejected and anything that
needs their decision. Commit only if asked to, or if the run's instructions say to.

## Daily run

The scheduled run happens once a day and keeps the feed, the deep dives and the incident
patterns current. It is the steps above, narrowed:

1. **Window.** The last seven days to today (from seven days before the newest feed date, if
   that is earlier). Skip anything already in the feed or already cited
   (`incident-index.mjs --urls`); a find that came to light inside the window but was missed by
   earlier runs is added like any other. A find older than the window that no one has filed is
   added too, under the day it came to light, once its primary source is read; the log marks it
   as a late find.
2. **Sweep.** The trackers, vendor disclosures, vulnerabilities, agencies and security press
   lanes, with the window's dates in the queries. Add the by-incident-pattern and by-pattern
   passes when the window is longer than a week.
3. **Read the primary source of each item before adding it**, with the fetch tool, on the day.
   A lead whose primary source will not load waits for the next run, noted in the log.
4. **Add feed items** for every lead that meets the four tests, each filed under its incident
   pattern (section 4), with `fit: loose` and a `fitNote` when the fit is loose.
5. **Write deep dives only when the deep-dive test holds** (section 3), at most two deep dives
   and `alsoSeen` entries a run, every source read; candidates from the last run's log come
   first. Most daily runs add feed items and no deep dive; that is the expected result, not a
   thin one.
6. **Check the loose items.** When three or more of the last 60 days share a mechanism whose
   controls differ, add the incident pattern (section 9), at most one a run.
7. **Log** in this week's file, `docs/research/incidents/<date of this week's Monday>.md`. The
   first run of the week creates it with a line saying which week it covers; each run appends a
   section `## <today>`: the window, the number of searches, each item added, any deep dive or
   incident pattern written, the candidates that wait and the leads turned down. A run that
   finds nothing still writes its section: the window, the queries and "nothing new", so the
   next run knows this stretch was searched.
8. **Build, test, commit, push** as the run's instructions say: `npm run data` and `npm test`
   must pass before anything is committed; commit the feed, deep dive and incident pattern files,
   the log and the rebuilt dataset, unless the instructions say otherwise; push only to the
   branch they name. If the build or the tests fail and the fix is not plainly yours to make,
   commit nothing, say what failed in the log, and stop.
