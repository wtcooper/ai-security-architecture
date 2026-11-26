# The feed item, of every kind, and the files beside it

Items live in `data/feed/<YYYY-MM>.yaml`, one file per month of the item's `date`, newest first
within the file. `npm run data` checks the format and names the file and the item when something
is wrong; `feed-lint.mjs` adds the run's own rules (marked **lint**). `data/feed/README.md` is the
same format, for readers of the data; an incident's own fields are in `incident-research`'s
[references/feed-item.md](../../incident-research/references/feed-item.md). What passes the bar
is in [bar.md](bar.md).

## Skeleton

```yaml
items:
  - id: claude-code-otel-endpoint-setting   # unique across all feed files; kebab-case; its anchor /feed/#<id>
    kind: productUpdate                     # incident | productUpdate | tool | launch | guidance | research; left out, incident
    weight: brief                           # headline | notable | brief; required; at most 3 headlines a day (lint)
    story: settings-toolClaudeCode-2026-w47 # optional: a story id in data/feed/stories.yaml
    date: 2026-11-20                        # its first announcement, inside the file's month
    title: "Claude Code lets administrators pin where its traces go"   # <= 90; aim for ~70
    summary: >                              # <= 280; aim for ~200: the TL;DR
      One to three plain sentences: what was announced or happened, and the result.
    why: "Traces are what an investigation relies on; pinning their destination keeps them from the user."  # <= 160
    vendor: Anthropic                       # optional, <= 80: who announced it
    products: [toolClaudeCode]              # optional: tooling ids (daily-index.mjs --products)
    controls: [cap-agent-tracing]           # optional: catalogue ids it delivers or changes
    patterns: [archCodingAgentThirdParty]   # 0 to 3 pattern ids it touches
    update:                                 # optional: the change to the site it implies
      action: settings                      # settings | toolOption | onboard | newControl | newPattern | controlGuidance
      status: applied                       # applied | proposed | declined | watch
      target: data/tooling/anthropic/claude-code.yaml   # the file it changes, or the id it names
      note: "Adds the tracing endpoint setting under agent tracing."   # <= 200: what changes, in one line
    sources:                                # 1 to 3, the primary first; https only; never a lead (lint)
      - title: "The page's own title"
        url: https://...
        publisher: Anthropic
        date: 2026-11-20
```

`category`, `perspective`, `evidence`, `fit`, `fitNote` and `incident` belong to incidents
only. `cves` may go on any kind. No other field is accepted.

## Each kind

| Kind | Must say in `why` | Usually touches |
| --- | --- | --- |
| `productUpdate` | Which attack, control or data path it changes, and for whom | `products`, `controls`, the product's pattern; `update.action: settings` when the product is on the site; the week's roll-up `story` unless it stands alone |
| `tool` | Which control it helps deliver, and the gap it fills | `controls` (one to four), `patterns`; `update.action: toolOption` and a file in `data/security-tools/` whose `released` is its first release |
| `launch` | Where data now goes, or what an administrator can now control | `patterns`; `update.action: onboard` (proposed) when it fits a pattern, `newPattern` when it fits none |
| `guidance` | The practice it sets or changes, and which control or pattern reads differently now | `controls`, `patterns`; `update.action: controlGuidance` (proposed) when a control's what-to-do or why should change |
| `research` | What it found, and what that means for a control or a pattern | `controls`, `patterns`; rarely an update |
| `incident` | What a defender should check or do (recommended) | as `incident-research` says |

## The fields that need judgment

- **`date`** is the first announcement: the vendor's post, the release, the advisory, whichever
  came first. A changelog entry dated earlier than the post that announced it takes the
  changelog's date. A tool's item is dated by its announcement; its first release must be in the
  window too.
- **`weight`**: [bar.md](bar.md). Weigh it against the day, not on its own.
- **`story`**: a follow-up joins its thread's story; a single setting joins its product's weekly
  roll-up, `settings-<toolId>-<YYYY>-w<NN>` (`isoWeek` in `scripts/lib.mjs` computes the week).
- **`title`** says what happened, with the product's name, in the reader's words, not the
  vendor's ("Copilot Studio blocks unauthenticated agents tenant-wide", not "Introducing enhanced
  governance"). At most one figure.
- **`summary`** is the TL;DR. Plain and specific. A figure that is the vendor's own claim says so;
  a stage (beta, preview, GA) is stated; what is only "coming soon" is kept apart.
- **`why`** is one line: what it changes for an attack, a control, data or access. It is the line
  the owner reads if they read nothing else, so it states no inference as fact.
- **`products`** are tooling ids (`toolClaudeCode`, not `claude-code`). Name a product only when
  the item is about a control on *that* product: check the tooling file's header for what it
  excludes. A product not yet on the site is not a `products` entry: name it in the title and
  propose onboarding it.
- **`controls`** are catalogue ids: a MITRE mitigation (`D3-MFA`, `AML.M0020`) or a `cap-*`
  specialisation. Name a control only when the source shows the item delivers or changes it.
- **`patterns`**: at most three, the ones the item touches, from `pattern-map.mjs`.
- **`update`** follows [site-updates.md](site-updates.md). `target` is a path from the repository
  root for a file, or the id it names (a tooling id, a control id, a security tool id, a proposed
  product id). An applied update's target must exist, and in this run's diff (lint). A `watch`
  note says when to look again, with a date.

## Stories: `data/feed/stories.yaml`

```yaml
stories:
  - id: artex                                   # kebab-case, or settings-<toolId>-<YYYY>-w<NN> for a roll-up
    title: "ARTEX: one public agent framework, many attackers"   # <= 90
    incident: artex-campaigns                   # optional: the deep dive it belongs to
  - id: settings-toolClaudeCode-2026-w48
    title: "Claude Code settings, week of 23 November"
```

A roll-up holds only product updates for its product, dated in its week (lint).

## Overviews: `data/feed/overviews.yaml`

```yaml
days:
  - date: 2026-11-26
    overview: >     # <= 400: the day's main events in two or three plain sentences
      ...
weeks:
  - week: 2026-11-23     # the Monday that starts the ISO week
    overview: >     # <= 600: the week's main events, most important first; rewritten each day
      ...
```

Newest first in each list. [bar.md](bar.md) says what each says.

## Decisions: `data/feed/decisions.yaml`

The record of the owner's answers, one line per item, written by the run when the owner replies
(or by the owner directly):

```yaml
- { id: xai-private-inference, decision: approve }
- { id: some-research-post, decision: decline, note: "No change to the control." }
```

Each `id` is an item with an `update`, decided once; `decision` is `approve` or `decline`; `note`
at most 200 characters. The line stays as the record after the change is carried out; the item's
`update.status` says where it stands. None of it is shown on the site.

## Words

The reader's words are pattern, incident pattern, control, risk and setting. The build rejects
"archetype" in a title, summary, why or note.
