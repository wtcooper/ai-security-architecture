---
name: ai-security-daily
description: Run the one scheduled daily sweep of the feed (/feed/): six kinds of item (incidents, product updates, security tools, launches, guidance, research) from primary sources of the last seven days, each a short weighted item, in a story when it continues one, saying why it matters and what it changes on the site; today's and this week's overviews; settings rows and up to three security tools applied, the rest proposed. Every new or changed entry passes feed-lint and an independent verifier subagent before anything is committed; then log, build, test, push, and end with the digest. Also carries out the owner's replies ("approve 2, decline 3") under the same gate, and audits last week's items on Mondays. Use it whenever the daily run fires, or someone asks for the daily, "what changed in AI security this week", a product-update or security-tool sweep, or replies to a digest. Incidents go to incident-research's daily run; onboarding to tooling-onboard; a new pattern to pattern-research and pattern-author.
---

# ai-security-daily: the day's AI security, checked, on the site by evening

The feed at `/feed/` is a live feed the owner reads every day and others read after them. It
carries six kinds of item, all in `data/feed/<YYYY-MM>.yaml`, each a few lines a reader takes in
at a glance:

| `kind` | What it is |
| --- | --- |
| `incident` | A real attack on an AI system, or by one, including campaign threat intelligence; filed under an incident pattern |
| `productUpdate` | A vendor ships or changes a security control in an AI product |
| `tool` | A tool that protects AI systems, first released inside the window, maintained and documented |
| `launch` | A new AI product or feature that changes where data goes or what an organisation can control |
| `guidance` | How to secure AI in practice: a lab's or vendor's account of its own deployment, a standard, agency guidance |
| `research` | Findings and results: studies, measurements, technical discoveries, prototypes |

**No slop.** Every line on the feed must be true, new, placed right and said no more strongly
than its source says it. The first runs failed in ten ways, and this skill is built to stop each:
two events merged into one item; versions and defaults wrong; an item filed under the wrong
product; a tool that was not new (the Show HN date taken as its release); a prototype filed as a
tool; inferences stated as facts; follow-ups not grouped; leads found and never read; single
settings each made their own item; and every text written to its length cap. So the run drafts,
then a deterministic lint and an **independent verifier** check everything before a line is
committed, and what fails is fixed or left out.

The run leaves: new and corrected items in `data/feed/`, with their stories
(`data/feed/stories.yaml`) and today's and this week's overviews (`data/feed/overviews.yaml`);
the incident lane's deep dives and incident patterns (by `incident-research`'s rules); at most
three new files in `data/security-tools/`; the settings rows it applied in `data/tooling/`; at
most one approved onboard or control change; and its section in this week's log,
`docs/research/daily/<this week's Monday>.md`. Proposals are never on the site: they live in the
items' `update` and in `data/feed/decisions.yaml`, `npm run queue` lists them, and the digest
numbers them for the owner.

Three words to keep apart: an **incident pattern** is a kind of attack (`/incidents/`); a
**pattern** is a reference architecture (`/patterns/`); a **control** is an entry in the control
catalogue (a MITRE mitigation or a `cap-*` specialisation). Never write "archetype" in prose.

## The order, which does not change

1. Fix the date, the window and the base (§1); on Mondays, audit last week (§2).
2. Act on the owner's decisions and the watch items that are due (§3).
3. Sweep the lanes (§4) and read every lead you keep (§5).
4. **Draft**: items, stories, settings rows, tools, deep dives, overviews (§6).
5. **Lint**: `feed-lint.mjs` until it reports no errors (§7).
6. **Verify**: one fresh verifier subagent, started in the foreground; wait for it (§8).
7. **Resolve**: fix each finding or drop the entry; lint again; the gate must pass (§9).
8. **Log** (§10), then `npm run data`, `npm test`, `npm run build` (§11).
9. **Commit and push** (§11).
10. **Digest**, the final message, written only now and only of what passed (§12).

Verification is part of this run, in this session, not a task scheduled apart from it. Start the
verifier in the foreground and wait for it; never run one in the background, and never commit or
finish while one is still running. If the verifier fails, returns nothing usable or does not
finish, nothing new is published: the run commits only its log section, which says verification
did not complete, and the digest says so under **Problems**.

## 1. Fix the date, the window and the base

Your training data is older than today. Decide nothing about "new" from memory.

```bash
git pull --ff-only origin main
npm run data
node .claude/skills/ai-security-daily/scripts/daily-index.mjs
```

Start from `main` as it is on GitHub: the lint, the brief and the gate compare the working tree
with origin/main, and a stale checkout would show other people's work as if this run had undone
it (`feed-lint` refuses). `daily-index.mjs` prints today's date (UTC), the window, the **base
commit** (origin/main as the run starts: write it down, the digest is built against it), this week's log file, what the window already
holds with weights and stories, the stories to join, whether today's and this week's overviews
exist, the decisions and watch items to act on, and the security tools on file. **The window is
the last seven days to today**; anything already in the feed is skipped (`--urls` lists every
source already cited, of every kind). Put the dates in your queries ("November 2026", "Nov 20
2026"); a search without them returns what ranks, not what is new.

## 2. Mondays: the weekly self-audit

On a Monday (`daily-index.mjs` says so), before the sweep, give a **fresh verifier** a random
sample of ten of last week's items: `verify-brief.mjs --audit --out <file>`, then start it as in
§8 with that brief. Fix what it finds the same way (§9): a wrong item is corrected or, if it
cannot be, removed and the removal logged. The corrections join today's diff, so today's
verifier checks them again with the rest. Log the audit's findings under `### Weekly audit`, and
list the corrections in the digest.

## 3. Act on the owner's decisions first

The owner answers in the run's session (§13). What is left over from earlier answers,
`daily-index.mjs` lists:

- **Approved, not yet carried out**: carry out **at most one** a run, the oldest first, under the
  rules in [references/site-updates.md](references/site-updates.md). A change that would take
  most of the run waits: a missed day of news cannot be recovered and a waiting approval can.
- **Declined, not yet marked**: set the item's `update.status` to `declined`.
- **Watch items due**: recheck each against its source; it becomes `applied` (by the run's own
  rules), `proposed`, `declined`, or `watch` again with a new date in its note.

Each of these changes is in the diff, so the verifier checks it with the day's work.

## 4. Sweep the lanes, on a budget

About **40 searches** a run, about half of them for incidents. Spend them where news breaks:

| Lane | Searches | Where to look |
| --- | --- | --- |
| **Incidents** | ~20 | Hand to `incident-research`'s **Daily run** (its last section) with this run's window. Campaign threat intelligence (a vendor's or agency's report of attacks happening) is an incident lead. It shares this run's log and gate, and leaves committing to this run. |
| **Product updates** | ~8 | The security pages, release notes and changelogs of the vendors in [references/sources.md](references/sources.md), and of every product in `data/tooling/`. |
| **Security tools** | ~5 | GitHub releases and trending, package registries, vendor launches, Show HN as a lead. |
| **Launches** | ~3 | New AI products and features that move data or control. |
| **Guidance and research** | ~4 | Labs' and vendors' security writing, research blogs, standards bodies and agencies. |

Hacker News and newsletters are **leads only**: read them to learn what to look for, then cite
the vendor, the project, the agency or the standards body. If you can run subagents for the
sweep, give each lane to one with the window and [references/bar.md](references/bar.md); ask for
leads with addresses and dates, and do the judging yourself. Log every query with the number of
new leads it gave.

## 5. Read every lead you keep

**A lead you keep is read; a lead you could not read is not filed.** For each lead the sweep
turns up, open its primary source with the fetch tool, today, and judge it against the bar in
[references/bar.md](references/bar.md): the six kinds and where each line falls, the weights and
their caps, stories, the new-tool rule, campaign threat intelligence to the incident lane, and
shorter text. A lead you turn down gets one line in the log saying why; a lead whose page would
not load is named in the log under **could not be verified**, for the next run. Read long pages
from the raw page (the `.md` of a docs page, the raw changelog), not only a fetch tool's
summary, which can miss an entry that is there.

## 6. Draft

- **Items** follow [references/feed-kinds.md](references/feed-kinds.md): one event, one item;
  attributed as the source attributes it; `weight` on every item; a `story` when it continues
  one; title, summary and why well under their limits. Every new item gets **`added: <today,
  UTC>`**, the day the run filed it, beside `date`, the day it came to light. Never change an
  existing item's `added`.
- **Settings rows and security tools** the run applies follow
  [references/site-updates.md](references/site-updates.md), with `tooling-onboard`'s format and
  checks for a row. A single new setting is a row plus a brief item in its product's weekly
  roll-up story; it stands alone only when a default flips or the change opens a new way for code
  to run or data to leave.
- **Stories**: add or extend the story a follow-up belongs to in `data/feed/stories.yaml`.
- **Overviews**: write or update **today's day overview**, keyed by `added` (what this run filed
  today, which the page shows under **Latest**), and **this week's overview**, keyed by the Monday
  of the items' `date`, in `data/feed/overviews.yaml` ([references/bar.md](references/bar.md) says
  what each says).
- **Incidents**: by `incident-research`'s Daily run.

Run `npm run data` as often as you like while drafting; fix what it names before linting.

## 7. Lint

```bash
node .claude/skills/ai-security-daily/scripts/feed-lint.mjs
```

It compares the working tree with origin/main and fails on: duplicate source pages across the
feed, a title too close to an existing one, single-setting product updates for one product in
one week without their roll-up story, more than three headlines on a day, no overview for today
or this week, a tool whose first release is outside the window, text over its limit, a missing
kind, weight or `added` (a new item's must be today, and no item's may be before its `date`), a lead cited as the source, an update marked applied with nothing behind it, and
more than three new security tools. Fix every **error** and run it again; the verifier starts
only on lint-clean work. Its **checks** are judgements it cannot make (a possible follow-up, a
shared changelog, a product update filed standalone); they go to the verifier with their
entries. Pass `--standalone <id,…>` for product updates you judged to stand alone. Its **notes**
are writing advice: text near its ceiling is cut.

## 8. Verify: an independent verifier, before anything is committed

[references/gate.md](references/gate.md) has the procedure; in short:

1. Write the brief: `node .claude/skills/ai-security-daily/scripts/verify-brief.mjs --out
   <scratch>/brief.md`. It lists, from `git diff` against origin/main, every new or changed item,
   story, overview, tooling row, security tool, catalogue entry, decision and incident file, with
   its sources and lint checks, highest stakes first.
2. Start **one verifier subagent with the Agent tool, in the foreground** (`run_in_background:
   false`), with the prompt in gate.md. It is given only the brief and
   [references/verification.md](references/verification.md), never your notes, log or reasoning.
   It opens every source and checks every claim: facts, attribution, placement, the bar, the
   text; and returns its findings as JSON. With more than about 20 entries, split the brief
   (`--part 1/2`, `--part 2/2`) between two or three verifiers started in the same message, all in
   the foreground.
3. **Wait for it.** Do nothing that commits while it runs.

**No Agent tool in this session?** Do the same check yourself, as a separate pass after drafting
is finished: follow verification.md entry by entry, re-open every source (never rely on your
memory of a page, never reuse a fetch from drafting), write the same JSON with `"verifier":
"self-check"`, and say in the log and the digest that the check was **not independent**.

**Short of time?** The brief is in priority order: headline and notable items, then every tooling
and control change, then incident files, stories and overviews, then briefs. A brief item that
was not verified is dropped, not published.

## 9. Resolve: fix it or drop it

For each finding: fix it as the verifier's evidence supports, or drop the entry. An item or row
with an unresolved finding is **not published**: it comes out of the diff and the log names it.
Record each resolution in the findings JSON (gate.md says how), lint again, then:

```bash
node .claude/skills/ai-security-daily/scripts/verify-brief.mjs --gate <scratch>/findings.json
```

The gate passes only when every entry still in the diff has a verdict, every blocking finding is
fixed, nothing marked dropped is still there, and nothing changed after its check without a
recorded finding. A fix that adds a claim the finding's evidence does not carry goes back to a
fresh verifier (`--only <ref>`), once; if it fails again, drop it.

## 10. Log

This week's file, `docs/research/daily/<this week's Monday>.md`. The first run of the week
creates it with a line saying which week it covers; each run appends `## <today> (daily)`:

- **Window**, **base commit** and **searches** (how many, by lane).
- **Applied**: each settings row and security tool, with its item and file.
- **Proposed**: each update left for the owner, with its item; and the digest's numbered
  **Waiting for you** list, so a reply's numbers can be matched later. Once the gate has passed,
  print it with `daily-index.mjs --digest --base <the base commit>` (§12) and copy it here.
- **Decisions acted on**: what was carried out, marked or rechecked; what waits.
- **Added**: a table of the items (date, kind, weight, story, id, what it touches); the incident
  lane's own section as `incident-research` writes it.
- **Verification**: independent or self-check; the entries checked; the gate's table of findings
  and how each was resolved; what was dropped. On Mondays, **Weekly audit** too.
- **Turned down**, with a reason each; **could not be verified**; **late finds**.
- **Search log**: every query, with its new leads.

A run that finds nothing still writes its section: the window, the queries and "nothing new".

## 11. Build, test, commit, push

```bash
npm run data && npm test && npm run build
```

All three must pass. Then commit the files under `data/` (feed, stories, overviews, decisions,
security tools, tooling, catalogue, incidents, incident patterns) and the log, in one commit
whose message names what was added, applied and proposed, and push to `main`. Never commit
`src/data/generated/` or `public/data/feed/`: they are generated and ignored. If the build or the
tests fail and the fix is not plainly yours to make, commit only the log section, saying what
failed, and stop. If the push is refused because `main` moved, rebase onto it, build and test
again, and push; if the rebase changed any entry the verifier checked, run the gate again first.
With a browser, open `/feed/`: today's items under **Latest**, each story's items together, the
overviews showing, no proposal visible anywhere.

## 12. The digest

The run's final message is the digest: the owner reads it as an email and a notification. Its
skeleton comes from what passed the gate, compared with the base commit:

```bash
node .claude/skills/ai-security-daily/scripts/daily-index.mjs --digest --base <the base commit>
```

Its headlines and notables are the items whose `added` is today. Print it once the gate has
passed (the log takes its numbered list) and again after the push, then fill in **Problems** and
tighten the lines. The order is fixed: the date line; today's
overview; headlines, then notables, by kind, one line each with its link; **On the site**;
**Waiting for you**, numbered; **Problems**; and the closing line. It reports only what passed
the gate. [references/digest.md](references/digest.md) has the format.

## 13. The owner's replies

When the owner replies in the run's session with lines such as "approve 2, decline 3", match
each number to the **Waiting for you** list of the digest they answered (it is in the log), and:

1. Record each decision in `data/feed/decisions.yaml` and set the item's `update.status`
   (`declined` at once; `applied` when the change is made).
2. Carry out each approved change under the same rules as the daily run: onboarding through
   `tooling-onboard`, end to end; control guidance in the control's catalogue text; a settings
   row or security tool by [references/site-updates.md](references/site-updates.md). One that
   cannot be finished to its standard in this session stays approved and waits for the next run.
3. Verify it the same way: `feed-lint`, the brief, a fresh verifier in the foreground, resolve,
   the gate (§7 to §9).
4. Log it under `## <today> (replies)`, build, test, commit and push, and answer with a short
   digest: what was done, what was declined, what waits, and any problem.
