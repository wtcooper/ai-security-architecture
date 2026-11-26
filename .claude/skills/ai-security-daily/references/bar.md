# The bar

An item is worth the reader's minute only if it would change what a security architect does or
decides this week. Everything below follows from that. When a lead is borderline, it goes in the
log as turned down, with its reason; the feed is not the record of everything that was published.
Incidents are the exception: every real incident that meets `incident-research`'s tests gets an
item, as a brief if it teaches nothing new.

## The tests: all of them, or no item

1. **Security is the point.** It changes an attack, a control, how data is handled, or who can
   reach what. Funding, generic model launches, features with no security angle, policy options
   for a legislature and evaluation methodology with no security consequence are out, however
   loud.
2. **New.** Its first announcement falls inside the window. A re-post of last month's news is not
   new; a late find of something nobody filed is, and the log marks it late. For a tool, new
   means its **first release** is inside the window (below).
3. **Primary source, read.** The vendor's blog, changelog or docs; the project's repository or
   release; the agency; the standards body; the researcher. Hacker News, newsletters and
   aggregators are leads only. **Read every lead you keep; a lead you could not read is not
   filed.** A standard or guidance release is read in the document itself, not its landing page:
   an item that cannot say what changed waits until it can.
4. **Connected** to something on the site: a product in `data/tooling/`, a pattern, a control, an
   incident pattern or a tool category. A `launch`, `guidance` or `research` item need only be AI
   security.

## The six kinds

The kind is what the event *is*, not where it was found.

| Kind | Files it | Not this |
| --- | --- | --- |
| `incident` | A real attack on an AI system, or by one; **campaign threat intelligence** (a vendor's or agency's report of attacks happening: actors, intrusions, detections for a live campaign) | A vendor's patch for it is part of the incident's item, not a product update |
| `productUpdate` | A vendor ships, changes or removes a security control in an AI product: a setting, a policy, a log, a guardrail, an admin control | A feature with no control in it |
| `tool` | A new tool whose job is protecting AI systems (a scanner, a guardrail, a gateway, a red-team kit, a monitor), under the new-tool rule | A prototype, a research artifact, an alpha, an unmaintained proof of concept: that is `research` |
| `launch` | A new AI product or feature that changes where data goes or what an organisation can control | A model launch with no data or control angle |
| `guidance` | **How to secure AI in practice**: a named lab's or vendor's account of how it runs its own systems (with the controls named), a standard or framework released or revised (with its change list read), agency guidance with concrete actions | Vendor thought leadership that restates known principles: log it, do not file it |
| `research` | **Findings and results**: a study, a measured result, a technical discovery, a prototype that shows something is possible | An opinion piece; a report of attacks happening (that is an incident) |

Where a post is two things, file it once, under what a security reader most needs to know, and
put the other side in `why`. Where a post holds two events (two intrusions, two products), it is
two items, or one story.

## The new-tool rule

A `tool` item, and a file in `data/security-tools/`, need all of:

- **a first release inside the window**: the first version in its package registry (npm's
  `time.created`, PyPI's first upload) or the repository's first release or tag (its first
  commit if it has neither). The date of a Show HN post, a blog post or a new version of an old
  tool is not a first release. `released` in the security-tool file is that first release;
- **maintained**: recent commits or releases, and no "research artifact: not maintained";
- **documented**: a README or docs that say how to install and use it;
- a **credible maintainer** and a control on the site it clearly helps deliver, in a way the
  tools already listed under that control do not. A self-scored benchmark is not evidence.

An old tool's big new version can be a `productUpdate` if it is on the site, or nothing. A
prototype is `research`. The run adds at most three security tools a run; a fourth is proposed.

## Weights

Every item has one. Weigh it against the rest of the day, not on its own.

| Weight | When | Cap |
| --- | --- | --- |
| `headline` | A reader would be poorly served not knowing it today: a major vendor's default flips, a confirmed large incident, a widely covered launch with security consequences | **At most three a day** (`feed-lint` fails on a fourth) |
| `notable` | Worth reading this week | Not a cap, a test: if more than half the day is notable, the bar has slipped |
| `brief` | Worth a line; folded by default | Settings roll-up items are usually briefs |

## Stories

Items in one story are shown together, newest first, under the story's title, so a reader sees
one thread, not five repeats. Stories live in `data/feed/stories.yaml`.

- **Storylines.** A follow-up (a new report on a campaign, framework, actor, vulnerability or
  product already in the feed in the last month) joins that item's story; create the story if
  there is none yet, and put the earlier items in it too. One story per thread: ARTEX and
  CyberStrikeAI are two stories, because the sources keep them apart. A story may point at the
  deep dive it belongs to (`incident:`).
- **The weekly settings roll-up.** Single-setting product updates for one product in one ISO week
  share the story `settings-<toolId>-<YYYY>-w<NN>`, titled "<Product> settings, week of <Monday>"
  (for example `settings-toolClaudeCode-2026-w48`, "Claude Code settings, week of 23 November").
  Put the first single setting of the week in it too, so later ones join it. Each is a brief
  item; the settings row is the real change.
- **When an update stands alone.** Only when **a default flips** or the change **opens a new way
  for code to run or data to leave** (a new execution path, a new data flow, a new principal), or
  it closes a named attack path. Otherwise it is in the roll-up.

## One event, one item, as the source tells it

- Two cases in one post are two items (or one story), never one item mixing their figures.
- Attribute as the source attributes it: keep "at varying confidence", "we assess", "names as
  examples". Do not link an item to a deep dive the source does not tie it to.
- Mark whose a claim or figure is: the vendor's own, the researcher's, an attacker's leaked logs.
- Take versions, defaults, plans and dates from the page; where docs and changelog differ, say
  both. "In a future release, on or after" is not a date.

## Shorter text

| Field | Limit | Aim for |
| --- | --- | --- |
| `title` | 90 | about 70: what happened, with the product's name, one figure at most |
| `summary` | 280 | about 200: one to three plain sentences |
| `why` | 160 | about 110: one line on what it changes for an attack, a control, data or access |
| day overview | 400 | two or three sentences |
| week overview | 600 | the week's main events, most important first |
| story title | 90 | the thread, in the reader's words |

The limit is a ceiling, not a target. No adjective the source does not support; no unexplained
internal name; no inference stated as fact (if it is your reading, it is not in the item, or it
says whose reading it is). An incident item gets a `why` too: what a defender should check or do.

## Overviews

In `data/feed/overviews.yaml`. Each run writes or updates:

- **today's day overview** (`days: - date: <today>`): the day's main events, in two or three
  plain sentences, most important first: what came to the feed today, whatever day each came to
  light. It opens the digest;
- **this week's overview** (`weeks: - week: <Monday>`): the week's main events so far, most
  important first, rewritten each day as the week grows;
- the overview of an earlier day the run filed items under, when those items belong among that
  day's main events.

An overview says only what its items say. A day with no new items gets no day overview.
