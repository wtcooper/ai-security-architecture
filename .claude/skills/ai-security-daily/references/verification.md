# Verifying the daily feed: the checklist

You are checking another agent's work before it goes on a live feed that security architects
act on. You were not there when it was written. Assume nothing in the brief is right until a
source you opened today says so. Your findings decide what is published: an entry with a
blocking finding that is not fixed is left out.

The brief lists every new or changed entry, highest stakes first. Each has a **ref** and a
**hash** (copy both into your result), what it says, what it said before if it changed, its
sources, and **lint checks** a script raised that need a judgement.

## How to work

- **Open every source the entry cites**, with the fetch tool, now. Read the page itself, not a
  search snippet and not the brief's account of it. For a long page (docs, changelogs, release
  notes) read the raw page (the `.md` of a docs page, the raw `CHANGELOG.md`), because a fetch
  tool's summary can miss an entry that is there, or invent one that is not.
- **Find the sentence.** For each claim, find the sentence that supports it. Quote it in your
  finding when the entry gets it wrong. A claim no source supports is a finding, however
  plausible.
- A source that will not load, or loads something else, is a finding: the claims that rest only
  on it are unverified.
- Use the repository's data to check placement (a product's file in `data/tooling/`, a pattern's
  pinned controls with `node .claude/skills/incident-research/scripts/pattern-map.mjs <id>`, the
  catalogue in `data/overlay/`, the deep dives in `data/incidents/`). Do not read
  `docs/research/daily/`. Change nothing.
- Work in the brief's order. If you run short of time, stop at an entry boundary and list the
  rest under `unverified`; never pass an entry you did not check.

## 1. Every entry: five checks

### Facts

Every title, summary, why, note and row field matches the source:

- **Figures**: the number and its unit as the source gives them ("more than 100 weakened
  assertions", not "100+ weakened tests"; "at least two sectors", not "two sectors"); whose figure
  it is (the vendor's own, an attacker's leaked logs, the researcher's telemetry).
- **Dates**: `date` is the announcement or release date from the page (`added` is only the day
  the run filed it). "In a future release, on or after
  30 November" is not "from 30 November"; "expected by 8 December" is not "due 8 December".
- **Versions**: the version the docs give, and the changelog's if it differs; where they differ
  the text says both.
- **Defaults**: per plan, per sign-in method, per marketplace or source, as the page splits them.
  "Rolling out: off now, on when the rollout reaches you" is not "on".
- **Plans and eligibility**: the plan or licence it needs, and the configurations that exclude it
  (HIPAA-ready, zero data retention, customer-managed keys and the like) when the page names them.
- **Stage**: GA, preview, beta, alpha, "coming soon". What is GA and what is only announced are
  separated. A GA of something in preview for months is not new capability.
- **Options versus defaults**: "can run in a micro-VM" is an option, not the default.
- **Semantics a recommendation depends on**: how settings combine (deny wins; a user-level
  profile overrides group profiles), which source wins, which scope a key is read from. A
  recommendation that does not work under those rules is wrong.

### Attribution

- **One item, one event.** If the source tells two cases (two intrusions, two campaigns, a launch
  and a separate finding), an item that runs them together is wrong, even when every sentence is
  true of one of them. Name which sentences belong to which.
- **As the source attributes it.** "At varying confidence", "we assess", "names it as an
  example", "believes" must survive into the item. An agency that names two frameworks as
  examples has not said which was used; an item or deep-dive link that ties the case to one is
  wrong.
- **Who says it.** A vendor's claim about its own product ("within seconds") is marked as the
  vendor's. A researcher's account that the vendor patched is "the researcher says it was
  patched".
- **Evidence level** (incidents): `exploited` for real intrusions observed, `confirmed` by the
  vendor, victim or an agency, `demonstrated` against a real product then patched or given an
  identifier, `reported` for one unconfirmed report. Not stronger than the sources; not weaker
  than other items filed on the same kind of evidence.
- **A deep dive or also-seen entry** names the deep dive the source's own account supports. A
  case the source attributes to one actor or framework does not go on another's deep dive.

### Placement

- **Kind**: what the event *is*, not where it was found (the published bar, `bar.md` beside this
  file, has the full lines if you need them):
  - campaign threat intelligence (reports of attacks happening, with actors) is an `incident`,
    not research or guidance;
  - a prototype, research artifact, unmaintained proof of concept or alpha is `research`, not a
    `tool`;
  - `guidance` is how to secure AI in practice (a named organisation's own deployment, a standard,
    agency guidance); `research` is findings and results.
- **Weight**: `headline` only if a reader would be poorly served not knowing it today; at most
  three a day. `notable`: worth reading this week. `brief`: worth a line. Say when one is too high
  or too low.
- **Product**: each id in `products` is the product the item is about, and the change is a control
  *on that product*. Check the product's tooling file: its header may exclude what the item
  describes (a gateway that is a separate product from the SDK), and a helper that merely uses a
  coding agent is not a control on it.
- **Pattern**: each pattern fits how the thing is used (checking a third-party provider is not
  self-hosted inference).
- **Control**: each control is one the source shows the item delivers or changes. A weak mapping
  (an access policy filed as a kill switch; a retention audit filed as encryption; code review
  filed under a model-promotion gate) is a finding, with the better control if there is one.
- **Incident pattern** (incidents): how the chain *started*, and a `fitNote` that is true (AI
  software is not "ordinary web software").
- **Story**: a follow-up of an item in the last month is in that item's story; an item in a
  story belongs to it. A single-setting product update is in its product's roll-up for its week
  (`settings-<toolId>-<YYYY>-w<NN>`); one standing alone must flip a default or open a new way for
  code to run or data to leave.
- **Update**: `settings` targets the product's tooling file and the row is really there and
  right; `toolOption` targets the security tool's id; a proposed change names what would change
  and where, in one line; `applied` only when the change was made.

### The bar

- **New.** First announced inside the window (the brief's date line gives it), and not already
  in the feed under another id or title. For a **tool**: its *first* release in its package
  registry or repository (npm's `time.created`, PyPI's first upload, the repository's first tag
  or release, its first commit if it has neither) is inside the window. A Show HN post, a blog
  post or a new version of an old tool is not a first release. Report the first release date you
  found and where.
- **Maintained and documented** (tools): a README or docs that say how to install and use it,
  recent commits or releases, no "research artifact: not maintained". A self-scored benchmark is
  not evidence it works.
- **Security is the point**: it changes an attack, a control, data handling or who can reach
  what, and would change what an architect does or decides. Policy options for a legislature,
  evaluation methodology with no security consequence, and vendor thought leadership that
  restates known principles fail.
- **Read, not skimmed**: a standard or guidance release is described from the document, with
  what it changes; an item that admits it does not know what changed fails.
- **Not a duplicate, not a stray follow-up**: if it repeats or continues an item already in the
  feed, say which, and whether it belongs in that item's story or should not be filed.
- **Primary source**: the vendor, the project, the agency, the standards body or the researcher.
  A newsletter, Hacker News or an aggregator is never the source.

### Text

- **No inference stated as fact**, above all in `why`. "Claude helped with both" does not
  support "when the agent can edit the tests"; a setting that removes one path does not "sidestep
  review" if other checks still apply. Overstatement is an inference too ("gains write access"
  when write actions were in preview for months).
- **Nothing that misleads by omission**: a caveat the source puts next to the claim (only in one
  client; only one monitor and one agent tested; does not stop a second path) and without which
  the line would mislead, is blocking when missing. A detail that would merely be useful is a
  suggestion.
- **No adjective the source does not support.** No unexplained product-internal name (a
  component name, a code name) a reader cannot place.
- **Lengths**: title at most 90 characters, summary 280, why 160, note 200, story title 90, day
  overview 400, week overview 600, a security tool's `what` 160. Over the limit is blocking. Text
  within a few characters of its limit, or packed with figures, is a suggestion to cut.

## 2. By kind of entry

**Product update.** The setting's name exactly as the vendor's page spells it; where it is set;
the default; the version; the plan. Whether it stands alone or belongs in the week's roll-up.

**Settings row** (`data/tooling/…#tools/<tool>/settings/<id>`): `name` as the page spells it;
`where` and `setVia` match how it can actually be set (a managed settings file or MDM is not an
admin console; a key any settings file can set is not admin-only); `default`, `requires` and
`value` as in Facts; `recommended` works under the setting's own rules; `why` states no inference;
each of `mitigations` is pinned on the product's pattern and is a fair mapping; `url` lands on
the page that documents it (follow it); `verified` is today. Known pitfalls the page names (an
older version rejecting a whole policy, a key that removes other tools) are carried.

**Controls row** (`…#tools/<tool>/controls/<control>`): the coverage word and mechanism match
the pages cited, and the rule the other products of the pattern are rated by.

**Security tool** (`data/security-tools/<id>.yaml`): `released` is the first release (as in The
bar); `status` matches the repository or vendor (an alpha is not `beta`; if the schema has no
word for it, say so); `kind`, `by`, `url` are right; `what` is neutral and true; each control is
one it really helps deliver; it is maintained and documented.

**Catalogue entry** (`data/overlay/…`): the change is what the approved proposal said, and the
cited source supports the new text.

**Incident file** (`data/incidents/…`): each step is supported by the sources it cites, in order;
the deep dive is about one event; an also-seen entry belongs to this deep dive as the source
attributes it; dates and counts match.

**Story** (`story:<id>`): the title is true of all its items and within 90 characters; every item
belongs; no follow-up in the brief's items is left outside it.

**Overview** (`day:<added day>`, `week:<Monday>`): a day overview describes the items filed that
day (their `added`); a week overview the items dated in that week. Every claim is in one of the
items listed under it,
as they stand now; the most important come first; nothing from an item that is not in the feed;
no inference stated as fact; within its limit.

**Decision** (`decision:<id>`): the change carried out is the one the item proposed, and the
item's status matches the decision.

**Removal**: the entry was wrong or a duplicate, and nothing still depends on it.

**Audit entries** (the Monday brief): check them exactly as new ones, against the sources as they
read today. A page that changed since is a finding only if the item is now wrong.

## 3. The lint checks

Each lint check printed under an entry needs a word in your result: a finding if it is a real
problem, or a line in `checks` saying why it is fine ("different entries of one changelog";
"not a follow-up: a different campaign"). General checks at the top of the brief go in
`general`.

## 4. Severity

- **blocking**: wrong, unsupported, misattributed, misplaced, over a limit, misleading by
  omission, or failing the bar. The entry is not published until it is fixed.
- **suggestion**: true and placed right, but it could be shorter, clearer or more useful. The run
  may take it or leave it.

When unsure whether something is blocking, it is blocking: say what you could not confirm.

Your `verdict` for an entry is `pass` (no blocking finding), `fix` (blocking findings with a fix
the sources support) or `drop` (it cannot be fixed from the sources, or fails the bar).

## 5. What you return

Only this JSON, in one fenced `json` block:

```json
{
  "verifier": "independent",
  "brief": "<the brief's first line>",
  "results": [
    {
      "ref": "item:claude-skills-over-mcp-beta",
      "hash": "3f2a9c01de",
      "verdict": "fix",
      "sources": [
        { "url": "https://code.claude.com/docs/en/mcp.md", "read": true, "note": "raw page" }
      ],
      "checks": ["duplicate-source: different entries of one changelog"],
      "findings": [
        {
          "check": "facts",
          "severity": "blocking",
          "field": "requires",
          "issue": "The docs say v2.1.331 or later; the row says 2.1.332 and does not note the difference.",
          "evidence": "\"Requires Claude Code v2.1.331 or later\" (https://code.claude.com/docs/en/mcp.md)",
          "fix": "Claude Code v2.1.331 or later (the changelog lists it under 2.1.332)"
        }
      ]
    }
  ],
  "general": ["day:2026-11-25 overview: items dated that day, none new today; the page's fallback will do"],
  "unverified": [],
  "missed": ["Optional: a lead in one of these sources the run did not file and should have, with its address."]
}
```

- `check` is one of `facts`, `attribution`, `placement`, `bar`, `text`.
- `field` is the field the finding is about, where there is one.
- `evidence` quotes the source, with its address; for "not found", say where you looked.
- `fix` is the replacement text or value the evidence supports, or "drop".
- `sources` lists every page you opened for the entry, and whether it loaded.
