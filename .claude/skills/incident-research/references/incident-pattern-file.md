# The incident pattern file

An incident pattern is how AI systems are being attacked: a clustering of real incidents, with
an overview, the controls that stop it and its exemplars. One file each:
`data/incident-patterns/<NN>-<slug>.yaml`. `NN` is the next two-digit number
(`incident-index.mjs` prints it, with the next `order`); it only orders the folder. The page is
`/incidents/<slug>/`, laid out like a pattern page. The build (`npm run data`) checks everything
marked **checked** below and names the file and the field when something is wrong.

The incident patterns are the source of truth for `category`: every deep dive and feed item
names one by its `id`, and the build fails on any other. The reader's word for one is
"incident pattern", never bare "pattern"; "pattern" is a reference architecture.

A run adds one only when the test in the skill's section 9 holds, at most one a run. The owner
can merge or rename it later.

## Skeleton

```yaml
id: exploitedSoftware        # camelCase; the key feed items and deep dives carry in `category`. checked: unique
slug: exploited-ai-software  # kebab-case; its address, /incidents/<slug>/. checked: unique, never a deep dive's id, never "feed",
                             #   and the file is named <NN>-<slug>.yaml
order: 5                     # where it sits on the index and in the filters. checked: unique whole number from 1
name: "Exploited AI software"                # <= 60. checked
short: "One line: what happens."             # <= 140. checked
since: 2026-11-25                            # the day the incident pattern was added (YYYY-MM-DD). checked
overview: >                                  # <= 700. checked
  What it is, why it happens to AI systems in particular, and what is at stake.
howItWorks:                                  # 3 to 5 steps, each <= 160: the chain in general terms. checked
  - The first link of the chain, as it usually goes.
  - ...
signs:                                       # optional; 2 to 4, each <= 140: what it looks like when it happens. checked
  - ...
stops:                                       # 2 to 6 controls from the catalogue. checked: each exists
  - control: cap-agent-egress-control        # a MITRE mitigation (AML.M…), a D3FEND technique (D3-…) or a cap-* specialisation
    how: "<= 160: where it bites for this incident pattern"
risks: [riskPromptInjection]                 # risk ids, CoSAI and authored. checked: each exists
owasp: [LLM01:2026, ASI01, MCP05:2025]       # optional: as the threat models write them; LLM01 reads as LLM01:2026. checked
atlas: [AML.T0051.001]                       # optional: technique ids in the vendored ATLAS release. checked
notSameAs:                                   # 1 to 3: the nearest incident patterns and the line between them. checked
  - pattern: exposed                         # an incident pattern id
    why: "<= 160: which side of the line an incident falls on, and how to tell"
```

`id`, `slug`, `order`, `name`, `short` and `since` are required. The rest are checked when
present and simply not shown when absent, so a new incident pattern can start with the required
six and grow. No other field is accepted: its deep dives, its feed items and the patterns it
lands on are derived by the build from the deep dives and the feed, never written here.

## The fields that need judgment

- **`name`** says what happens, in the reader's words, not the attacker's jargon: "Exposed by
  default", not "Unauthenticated endpoint exposure".
- **`short`** is the one line on its card and on every chip's hover. One sentence: what happens.
- **`overview`** covers three things in that order: what it is, why it happens to AI systems in
  particular, and what is at stake. Plain present tense, no adjectives the incidents do not
  support.
- **`howItWorks`** is the chain in general terms, three to five steps, each one movement, the
  way a deep dive's steps are, but true of every incident filed here, not of one.
- **`signs`** are what a defender would see: a log line, a bill, an alert, a behaviour.
- **`stops`** are the controls that break this chain wherever it happens, chosen from the
  catalogue (`/controls/`), each with where it bites. Prefer the ones the deep dives' `breaks`
  name again and again; that is the evidence they stop it.
- **`notSameAs`** draws the line to the nearest incident patterns: the test a reader would apply
  to an incident that could go either way. The classification rule applies: the incident pattern
  names how the chain *started*.

## When a run adds one

Write the file in full (every field, not only the required six), then:

1. Move the loose items that triggered it: set each one's `category` to the new `id` and remove
   its `fit` and `fitNote`, since it now fits.
2. Move any deep dive whose chain started the new way: set its `category` to the new `id`.
3. Write one deep dive if one of the moved items meets the deep-dive test, within the run's two.
4. Say in the log which items and deep dives moved, from which incident pattern, and why the
   controls that stop them differ from the nearest incident pattern's.

A new incident pattern is drawn in grey until it is given a colour of its own in
`src/lib/incident-categories.ts`; that is code, so leave it to the owner and say so in the log.

## Wording

- "Incident pattern" for this kind, "pattern" for a reference architecture, "deep dive" for an
  incident told step by step. The tests fail on "archetype" in prose.
- Name the controls by what they do; the page shows their catalogue names beside the line.
