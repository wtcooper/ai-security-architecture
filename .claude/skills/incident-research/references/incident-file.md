# The deep dive file

One file per deep dive: `data/incidents/<NN>-<id>.yaml`. `NN` is the next two-digit number
(`incident-index.mjs` prints it); it only orders the folder. The page address is
`/incidents/<id>/`, the same segment as the incident patterns' slugs, so the id must not be one
of them. The page shows the breadcrumb **Incidents › <incident pattern> › <title>**, and the
deep dive is listed as an exemplar on its incident pattern's page. The build (`npm run data`)
checks everything marked **checked** below and names the file and field when something is wrong.

Write one only when the deep-dive test in the skill's section 3 holds, at most two a run
(`alsoSeen` entries included).

A deep dive is never the only record. The incident it tells, and each of its `alsoSeen`
entries, also gets a feed item in `data/feed/` whose `incident:` is this file's `id`
([feed-item.md](feed-item.md)); the deep dive's page then links to them.

## Skeleton

```yaml
id: short-kebab-id                 # unique; becomes the address, so never "feed" or an incident pattern's slug. checked
title: "Who or what: what happened, in one line"
subtitle: >
  One or two sentences telling the whole story. The list row and the page header lead with it.
date: 2026-11                      # YYYY-MM of the latest event or disclosure; the list sorts on it. checked
dateRange: 3 – 14 November 2026    # free text, as a reader would say it
category: promptInjection          # an incident pattern id (data/incident-patterns/). checked
perspective: target                # target = the AI system was attacked; weapon = an AI agent ran the attack
# One comment line: why this pattern and not a neighbouring one.
archetype: archCodingAgentThirdParty   # a pattern id from pattern-map.mjs. checked
caveat: >                          # only when the account rests on one report or unconfirmed figures
  What exactly is unconfirmed, and by whom.
breaks:                            # 1–6 controls pinned on that pattern. checked
  - control: cap-agent-egress-control
    how: "One line: where in the chain this control bites."
summary:                           # two or three short paragraphs
  - >
    First paragraph.
  - >
    Second paragraph.
patterns:                          # optional: short names of the attack patterns seen
  - Indirect Prompt Injection
cves: []                           # identifiers, if any
risks:                             # risk ids this incident is about. checked
  - riskPromptInjection
steps:
  - n: 1
    title: Short title of the step
    phase: introduced              # introduced | exposed | mitigated. checked
    narrative: >
      What happened in this step, in plain past tense, from the sources.
    path: [developer->harness, harness->localTools]   # flows and boxes on the pattern. checked
    risks:                         # optional; each must also be in the list above. checked
      - riskPromptInjection
    sources:
      - title: "The page's own title"
        url: https://example.org/post
        publisher: Who published it
        date: 2026-11-05           # the page's date
  # ... more steps ...
  - n: 5
    title: What would have stopped it
    phase: mitigated               # the last step must be this one. checked
    narrative: >
      The controls that break the chain and where each one bites, as advice.
    path: [developer->harness, govObservability]
    sources: [...]
alsoSeen:                          # optional: related events that repeat this chain; each also gets a feed item with incident: <this id>
  - title: "Another event with the same chain"
    date: 2026
    note: >
      One or two sentences on how it relates.
    sources:
      - title: "..."
        url: https://...
sources:                           # every source for the incident, at least one. checked
  - title: "..."
    url: https://...
    publisher: ...
    date: 2026-11-05
```

Older files also carry `components:` on each step and a top-level `controls:` list. Both are
optional now; new files can leave them out.

## Category: the incident pattern

`category` is the id of the incident pattern the deep dive is an exemplar of, the one that names
how the chain *started*. The skill's section 4 has the rule and the eight; `incident-index.mjs`
lists them with how many deep dives each has. An incident pattern with no deep dive yet is where
a first one is most valuable.

An incident that fits none of them is not a reason to stretch one: file its feed item with
`fit: loose`, and let the new-incident-pattern test (the skill's section 9) decide. A new incident
pattern is a file in `data/incident-patterns/` ([incident-pattern-file.md](incident-pattern-file.md)),
not a change to code.

## Phases

- **introduced**: where the weakness or the hostile input enters. Usually the first step or two.
- **exposed**: where it is acted on and the damage is done.
- **mitigated**: the final step, written as what stops it. The page lights the `breaks` here.

## `path`: placing a step on the drawing

Run `pattern-map.mjs <pattern>` and use what it prints.

- A **flow** is written `from->to`, exactly as listed. The reverse direction is accepted only
  where the listing says "reverse allowed".
- A **box** is written as its id alone, for something that happens inside it.
- A step is **one movement**: every flow after the first must touch a box the step has already
  reached. If a step needs two unconnected flows, it is two steps.
- The mitigated step usually names the flows where the breaking controls sit and the
  control-plane boxes (`gov…`) that own them.

## `breaks`

Each `control` must be a control pinned on the chosen pattern (`pattern-map.mjs` lists them
with their chip numbers). If the control that would really have stopped the incident is not
pinned on the pattern, that is worth saying in the log: either the pattern is the wrong one, or
the pattern is missing a control.

## Risks

Use ids from `data/cosai/risks.yaml` and the authored risks; the pattern's own pinned risks
(`pattern-map.mjs`) are the natural candidates. The build rejects an unknown id.

## Wording

- The reader's words are pattern, control and risk. The tests fail on "archetype" in prose.
- Quote figures with their source in the sentence when they are the source's own estimate.
- Titles of sources are the page's titles, not your summary of them.
