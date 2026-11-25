---
name: ai-security-daily
description: Run the one scheduled daily sweep that keeps this repository's feed (/feed/, "AI security daily") current with five kinds of item — incidents, product updates, security tools, launches and research — found on primary sources in the last seven days, each filed as a short feed item with why it matters and the change to the site it implies; apply the changes the run may make by itself (a product's settings row, up to three security tools), propose the rest, carry out at most one change the owner approved in data/feed/decisions.yaml, log the run, build, test, commit and push. Use this whenever the scheduled daily run fires, or someone asks for the daily, the AI security daily, today's AI security news, "what changed in AI security this week", a product-update or security-tool sweep, or to act on approved site updates — even if they do not say "daily". Incidents are handed to incident-research's daily run; onboarding a product is tooling-onboard's procedure; a new pattern is pattern-research's and pattern-author's.
---

# ai-security-daily: the day's AI security, on the site by evening

The feed at `/feed/` is the owner's daily read. It carries five kinds of item, all in
`data/feed/<YYYY-MM>.yaml`, each two or three lines a reader takes in at a glance:

| `kind` | What it is | Examples |
| --- | --- | --- |
| `incident` | A real attack on an AI system, or by one, filed under an incident pattern | Grok Build, MONAI Label |
| `productUpdate` | A vendor ships or changes a security control in an AI product | new Claude Code managed settings; Microsoft Foundry guardrails |
| `tool` | A new open-source or commercial tool that protects AI systems | Tencent's MCP and skills scanner; NVIDIA SkillSpector |
| `launch` | A new AI product or feature that changes where data goes or what an organisation can control | xAI private inference |
| `research` | How leading teams secure AI, new standards and agency guidance | a lab's security evaluations; OWASP and ATLAS releases |

An item is only worth the reader's minute if it is true, new and tied to something on the site.
So every item rests on a primary source read that day, falls inside the window, and says why it
matters and what it changes here: a product's settings, a control, a pattern, an incident
pattern. The site moves with the feed: a setting a vendor documents today is in that product's
settings table tonight, and a change the run may not make by itself waits, named, in the
**Proposed site updates** panel at the top of `/feed/` until the owner answers.

The run leaves: new items in `data/feed/`; the incident lane's deep dives and incident patterns
(by `incident-research`'s rules); at most three new files in `data/security-tools/`; the settings
rows it applied in `data/tooling/`; at most one approved onboard or control change; and its
section in this week's log, `docs/research/daily/<this week's Monday>.md`. Then it builds, tests,
commits and pushes to `main`.

Three words to keep apart: an **incident pattern** is a kind of attack (`/incidents/`); a
**pattern** is a reference architecture (`/patterns/`); a **control** is an entry in the control
catalogue (a MITRE mitigation or a `cap-*` specialisation). Never write "archetype" in prose; the
build rejects it.

## 1. Fix the date and the window

Your training data is older than today. Decide nothing about "new" from memory.

```bash
npm run data
node .claude/skills/ai-security-daily/scripts/daily-index.mjs
```

It prints today's date (UTC), the window, this week's log file, the newest item of each kind,
what the window already holds, the decisions waiting in `data/feed/decisions.yaml` and the
security tools on file. **The window is the last seven days to today.** Announcements surface
late and the overlap costs nothing, because anything already in the feed is skipped:
`daily-index.mjs --urls` lists every source already cited, of every kind, and a lead whose
primary source is in that list is not new. Put the dates in your queries ("November 2026",
"Nov 20 2026"); a search without them returns what ranks, not what is new.

## 2. Act on the owner's decisions first

`daily-index.mjs` lists the proposed updates the owner has answered. Before sweeping:

- **Declined:** set that item's `update.status` to `declined`, add the owner's note to the
  update's `note` if it says why, and delete the line from `decisions.yaml`. Do every one; it is
  bookkeeping.
- **Approved:** carry out **at most one** a run, the oldest first, and only if it is an onboard
  (`tooling-onboard`, end to end, with its checks) or a control change (`newControl` or
  `controlGuidance`: the catalogue files, `data/overlay/mitigations.yaml` and
  `specializations.yaml`, with their sources). Then set `update.status` to `applied`, point
  `target` at the file you changed, and delete the line. An approved `newPattern` is
  `pattern-author`'s work: it is the run's one change only when the run can finish it to the
  pattern standard; otherwise it waits, and the log says so. The rest wait for the next run, in
  order.

A change that would take most of the run's budget waits too: the sweep comes first, because a
missed day of news cannot be recovered and a waiting approval can.
[references/site-updates.md](references/site-updates.md) has the procedure for each.

## 3. Sweep the lanes, on a budget

About **40 searches** a run, about half of them for incidents. Spend them where news breaks:

| Lane | Searches | Where to look |
| --- | --- | --- |
| **Incidents** | ~20 | Hand to `incident-research`'s **Daily run** (`.claude/skills/incident-research/SKILL.md`, the last section) with this run's window: its trackers, vendor disclosures, vulnerabilities, agencies and security press lanes, deep dives and new incident patterns by its own tests. It shares this run's log and leaves building and committing to this run. |
| **Product updates** | ~8 | The security pages, release notes and changelogs of Anthropic, OpenAI, Microsoft (Foundry, Copilot, Copilot Studio, Entra, Purview, Defender for Cloud AI, GitHub), Google Cloud (Vertex AI, Agent Engine, Model Armor, Security Command Center, Gemini Enterprise), AWS (Bedrock, Guardrails, AgentCore, Security Hub), Cursor, xAI, Meta, Mistral, Salesforce, ServiceNow, and every product in `data/tooling/`. |
| **Security tools** | ~5 | GitHub releases and trending for AI security tools (MCP and skills scanners, guardrails, red-team kits), vendor launches, Show HN. |
| **Launches** | ~3 | New AI products and features that move data or control: private inference, new agent runtimes, connectors, memory, computer use. |
| **Research and standards** | ~4 | Security research blogs (Wiz, Unit 42, Google Threat Intelligence, Microsoft Threat Intelligence, Trail of Bits, Check Point, Snyk and Invariant, HiddenLayer, Zenity, Pillar, Lasso, Noma, Legit, JFrog, Socket, Koi…), labs' own security writing, OWASP GenAI, MITRE ATLAS, NIST, CoSAI, CSA, CISA, NCSC. |

Hacker News (the front page, and Show HN with AI security terms) and newsletters (TLDR AI,
tl;dr sec and their like) are **leads only**: read them to find what to look for, then cite the
vendor, the project, the agency or the standards body. [references/sources.md](references/sources.md)
has the addresses and the wordings that work. If you can run subagents, give each lane to one with
the window and the bar below; ask for leads with addresses and dates, and do the judging yourself
so one bar is applied throughout. Log every query with the number of new leads it gave.

## 4. The bar: all four, or no item

1. **Security is the point.** It changes an attack, a control, how data is handled, or who can
   reach what. Funding, generic model launches and features with no security angle are out,
   however loud.
2. **New.** Its first announcement falls inside the window. A re-post of last month's news is
   not new; a late find of something nobody filed is, and the log marks it as late.
3. **Primary source,** read today with the fetch tool: the vendor's blog, changelog or docs; the
   project's repository or release; the agency; the standards body. A page that will not load is
   not cited; its item waits for the next run, named in the log.
4. **Connected** to something on the site: a product in `data/tooling/`, a pattern, a control, an
   incident pattern or a tool category. A `launch` or `research` item need only be AI security.

Write down every lead you turn down, with a one-line reason. "Considered and rejected" is what
lets the next run, and the owner, trust a gap.

## 5. One item per event

One event, one item, of one kind: the kind is what the event *is*, not where it was found. A
vendor's blog post that ships a setting is a `productUpdate`; the same post announcing a new
scanner is a `tool`; a lab's paper on how it red-teams is `research`. An event that is two
things (a launch that also ships a control) is filed once, under what a security reader most
needs to know, and the other side goes in `why`. A vendor's patch for an attack goes in the
incident's item, not a product update of its own.

Each item follows [references/feed-kinds.md](references/feed-kinds.md). The parts that need
judgment:

- **`summary`** is the TL;DR: what was announced or happened, plainly, in one to three
  sentences, at most 420 characters. No adjective the source does not support.
- **`why`** is the one line a security architect needs: what it changes for an attack, a
  control, data or access. At most 200 characters. Every kind but an incident must have one.
- **`products`, `controls`, `patterns`** are what the item touches on this site, by id
  (`daily-index.mjs --products` lists the tooling ids; the catalogue's ids are in
  `data/overlay/`; `pattern-map.mjs` lists the patterns). Name only what the source supports.
- **`update`** is the change to the site the item implies, if any, and where it stands (section 6).
- **`sources`**: one to three, the primary first.

## 6. What the run changes on the site

| The item shows | The change | Who makes it |
| --- | --- | --- |
| A new or changed setting in a product already on the site, documented on the vendor's page | That product's settings row in `data/tooling/<vendor>/<family>.yaml`, in `tooling-onboard`'s format and with its checks | **This run** (`update.status: applied`) |
| A security tool that clearly delivers a control the patterns already pin | A file in `data/security-tools/<id>.yaml` under that control | **This run**, at most three a run (`applied`) |
| A new AI product that fits an existing pattern | Onboard it (`tooling-onboard`) | Proposed (`proposed`); the owner approves |
| A new kind of AI system, or a control the catalogue lacks | A new pattern (`pattern-research`, then `pattern-author`) or a new control | Proposed |
| Research or guidance that changes a control's recommended practice | That control's what to do and why | Proposed |
| An incident | Its feed item, deep dive and new incident pattern by `incident-research`'s rules | `incident-research` |

An applied change is made in the same run as its item, and the item says so:
`update: { action, status: applied, target: <the file>, note: <what changed> }`. A proposed one
names what would change and where, so the owner can approve it in one line: `- { id: <item id>,
decision: approve }` in `data/feed/decisions.yaml`, or by asking in the session. A fourth
security tool, or a setting whose vendor page does not say what the item says, is proposed, not
applied. [references/site-updates.md](references/site-updates.md) has the rules for each kind of
change and the security tool format.

## 7. Build, test, look

```bash
npm run data      # every rule on items, updates, decisions and security tools, naming the file and item; fix each error
npm test
npm run build     # /feed.xml and the feed's month files come out of the build
```

With a browser, open `/feed/`: the newest day is under **Latest**, each new item sits under the
right week with the right kind tag, its product and control tags open the right pages, and each
proposed update is in the panel. Open the control page of any security tool you added
(`/controls/?control=<id>`): it is under **Tools that deliver it**. For a settings row you
applied, open `/patterns/<slug>/?tool=<tool id>` and find it under its control.

## 8. Log

This week's file, `docs/research/daily/<this week's Monday>.md`. The first run of the week
creates it with a line saying which week it covers; each run appends `## <today> (daily)`:

- **Window** and **searches** (how many, by lane).
- **Applied**: each settings row and security tool, with its item and file.
- **Proposed**: each update left for the owner, with its item.
- **Decisions acted on**: what was approved and carried out, or declined and marked; what waits.
- **Added**: a table of the items (date, kind, id, what it touches); the incident lane's own
  section as `incident-research` writes it (deep dives, incident patterns, candidates).
- **Turned down**, with a reason each; **could not be verified**; **late finds**.
- **Search log**: every query, with its new leads.

A run that finds nothing still writes its section: the window, the queries and "nothing new".

## 9. Commit and push

`npm run data`, `npm test` and `npm run build` must pass first. Commit the files under `data/`
(feed, security tools, tooling, catalogue, incidents, incident patterns) and the log, in one
commit whose message names what was added, applied and proposed; push to `main`. Never commit
`src/data/generated/` or `public/data/feed/`: they are generated and ignored. If the build or
the tests fail and the fix is not plainly yours to make, commit nothing, say in the log what
failed, and stop.

## 10. Report

End with a short summary for the owner, in this order:

1. **Applied**: each change made to the site, by item and file ("Claude Code: tracing endpoint
   setting, `data/tooling/anthropic/claude-code.yaml`").
2. **Proposed**: each change waiting for a decision, with the line that approves it.
3. **Decisions carried out**, and those still waiting.
4. **Added**: how many items of each kind, and the two or three that matter most, in a line each.
5. **Anything that failed** or could not be verified.
