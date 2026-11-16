---
name: pattern-research
description: Scan the web, as of today's date, for kinds of AI tool or application that this repository's pattern catalogue does not yet cover, and write a dated research report that sorts every finding into "new pattern", "change to an existing pattern", "product of an existing pattern" or "watch". Use this whenever someone asks what is new in AI that the patterns are missing, wants the catalogue checked for gaps or brought up to date, asks "do we need a pattern for X", mentions a horizon scan, landscape review or pattern refresh, or wants to know whether a newly launched AI product, agent type, protocol or form factor fits an existing pattern — even if they never say "pattern research". It researches and recommends; it does not draw patterns (that is pattern-author) or onboard products (tooling-onboard).
---

# pattern-research: find the AI the catalogue does not cover yet

The catalogue under `data/reference/architectures/` holds one pattern per *kind* of AI tool or
application. New kinds appear every few months, and a catalogue that misses one sends a reader
to the wrong drawing. This skill sweeps the web up to today's date, compares what it finds with
what is already drawn, and leaves a dated report that a person can act on.

It produces one file, `docs/research/patterns/<today>.md`, and changes nothing else. Drawing a
new pattern is `pattern-author`'s job, filing a product under an existing pattern is
`tooling-onboard`'s, and an incident found along the way goes to `incident-research`. Keeping
research separate from authoring is deliberate: the decision to add a pattern is the owner's,
and they should see the evidence before anything is drawn.

## 1. Fix the date and the window

Your training data is older than today, and the whole point of this skill is what happened
since. Do not reason about "recent" from memory.

```bash
npm run data                                            # so the catalogue below is current
node .claude/skills/pattern-research/scripts/catalogue.mjs
```

The first lines give today's date (UTC) and the date of the last scan on record. The window is
from the last scan to today. With no scan on record, use the last six months and say so in the
report. Write the window down before searching, and put the month and year in your queries
("November 2026"), because a search without a date returns whatever ranks best, not whatever
is new.

## 2. Read the catalogue you are comparing against

The same script prints every pattern: when to use it, what it is, who runs which part, how it
differs from its neighbours, and the products already filed under it.
`catalogue.mjs --names` lists only the product names, to check a find against quickly.

Read the whole output once. You cannot judge whether something is new without knowing what
"not the same as" already says about each pattern's neighbours.

## 3. Sweep every lane

"Exhaustive" here means something checkable: every lane below is searched, each with several
differently worded queries, and each lane continues until two searches in a row turn up
nothing you have not already seen. Log every query in the report as you go, with the number of
new leads it gave. The log is what lets the next reader trust that a gap is a real gap and not
a lane nobody searched.

Use the web search tool for discovery and the fetch tool to read pages. If you can run
subagents, give each lane to one, with the catalogue output and this section; ask them for
leads with addresses and dates, not for verdicts, and do the classifying yourself so one test
is applied throughout.

| Lane | What you are looking for |
| --- | --- |
| **Model labs** | New product *surfaces* from the labs that ship frontier models: a new way their models are packaged, hosted or given tools. List the current labs by searching first; the list changes. |
| **Cloud platforms** | New managed AI services on the major clouds: agent runtimes, gateways, memory stores, hosted browsers, sandboxes, evaluation services. Read each cloud's "what's new" for the window. |
| **Business software** | Agents embedded in the systems companies already run (CRM, ITSM, ERP, HR, productivity suites, collaboration, source control). The question is where the agent runs and what it can reach. |
| **Developer tools and open source** | Coding agents, agent frameworks, local runtimes, orchestration layers, trending repositories. New *ways of running* an agent matter; a new framework for an existing way does not. |
| **Protocols and standards** | Agent-to-tool, agent-to-agent, agent-to-user, agent payment and agent identity protocols. A protocol that reaches general use often creates a boundary nobody drew. |
| **Form factors and modalities** | Voice agents, computer-use and browser agents, operating-system assistants, on-device models, wearables, robotics and other physical systems, real-time and multimodal services. |
| **Security and standards bodies** | New categories named by OWASP GenAI, CoSAI, MITRE ATLAS, NIST, CSA, ENISA and national cyber agencies. If they have named a system type the catalogue has no pattern for, that is a lead. |
| **Launch events and market maps** | Vendor conferences and keynotes inside the window, analyst market maps, funding rounds that name a category. Good for discovering names to chase; never evidence by themselves. |
| **Incidents** | Security incidents inside the window on systems that fit no pattern. An attack on something the catalogue cannot draw is the strongest signal there is. |

For each lane, vary the wording: the vendor's term, the generic term, and the term a security
team would use are often three different phrases for one thing.

## 4. Chase each lead to its source

A lead becomes a finding only when you have read a primary page for it: the vendor's
documentation or launch post, the specification, the repository. Record for each finding the
address, the publisher, the page's own date, and whether the thing is generally available, in
preview, or announced only. Drop anything you cannot date inside the window, unless it is
older and the catalogue simply missed it, in which case keep it and say so.

Never fill a gap from memory. If a page will not load, say that in the report and mark the
finding unverified; a report that mixes read facts with remembered ones cannot be trusted line
by line, which is the only way it will be used.

## 5. Sort every finding with the pattern test

A pattern is a drawing, so the test is whether the drawing would change. A new product name,
vendor or model is never enough. Ask four questions of the finding and of its nearest existing
pattern:

1. **Who runs each part?** The organisation's device, the organisation's cloud, a vendor under
   contract, or nobody under any agreement.
2. **Where does the agent or model run, and what can it reach from there?**
3. **What crosses a trust boundary, and through what?** A control point the organisation runs,
   the vendor's own governance, the person at the device, or nothing.
4. **Where would the controls go, and who would hold them?** If at least one control would sit
   somewhere else or belong to someone else, the drawing differs.

Then file it under exactly one heading:

- **New pattern.** The answers differ from every existing pattern, and the kind is real: at
  least two independent products ship it, or one generally available product from a major
  vendor does. Name the nearest pattern and state the difference in one sentence per question.
- **Change to an existing pattern.** The pattern exists but its drawing is now wrong or
  incomplete: a new component, a new flow, a boundary that moved. Say what would change.
- **Product of an existing pattern.** The answers match. Record which pattern, and whether the
  product is already listed. This is the most common outcome and a useful one.
- **Watch.** Plausibly new but not yet real: one preview, an announcement, a specification
  with no shipping implementation. Say what evidence would promote it.

A finding that needs "it depends on how it is deployed" to answer the questions is usually two
findings. Split it. The catalogue's own rule is that a variant needing an either/or flow is its
own pattern.

While you are reading, note anything in the existing catalogue that the web shows is stale: a
product renamed, withdrawn or merged, an example whose "as of" date is more than a year old.
List these separately; they are cheap to fix and easy to miss.

## 6. Write the report

Write `docs/research/patterns/<today>.md` using the structure in
[references/report-template.md](references/report-template.md). Lead with the answer: how many
findings fell under each heading and which new patterns you recommend, most strongly evidenced
first. A reader who stops after the first screen should know what to do.

Every claim about a product carries its address and the page's date. Every recommendation
names the next step and the skill that takes it.

## 7. Report back

Tell the person, in a few lines: the window you covered, the count under each heading, the new
patterns you recommend and why, and anything you could not verify. Offer the next step and do
not take it unasked: drawing a pattern is a decision about what the catalogue claims.

Commit the report only if asked to.
