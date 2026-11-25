# The feed item, of every kind

Items live in `data/feed/<YYYY-MM>.yaml`, one file per month of the item's `date`, newest first
within the file. `npm run data` checks everything marked **checked** and names the file and the
item when something is wrong. `data/feed/README.md` is the same format, for readers of the data;
an incident's own fields are in `incident-research`'s
[references/feed-item.md](../../incident-research/references/feed-item.md).

## Skeleton

```yaml
items:
  - id: claude-code-otel-endpoint-setting   # unique across all feed files; kebab-case. checked
    kind: productUpdate                     # incident | productUpdate | tool | launch | research; left out, incident. checked
    date: 2026-11-20                        # its first announcement, inside the file's month. checked
    title: "Claude Code lets administrators pin where its traces go"   # <= 120. checked
    summary: >                              # <= 420: the TL;DR. checked
      One to three plain sentences: what was announced or happened, and the result.
    why: "An agent's traces are the record an investigation relies on; pinning their destination keeps them from the user."  # <= 200; every kind but an incident. checked
    vendor: Anthropic                       # optional, <= 80: who announced it. checked
    products: [toolClaudeCode]              # optional: tooling ids (daily-index.mjs --products). checked
    controls: [cap-agent-tracing]           # optional: catalogue ids it delivers or changes. checked
    patterns: [archCodingAgentThirdParty]   # 0 to 3 pattern ids it touches. checked
    update:                                 # optional: the change to the site it implies. checked
      action: settings                      # settings | toolOption | onboard | newControl | newPattern | controlGuidance
      status: applied                       # applied | proposed | declined
      target: data/tooling/anthropic/claude-code.yaml   # the file it changes, or the id it names
      note: "Adds the tracing endpoint setting under agent tracing."   # <= 200: what changes
    sources:                                # 1 to 3, the primary first; https only. checked
      - title: "The page's own title"
        url: https://...
        publisher: Anthropic
        date: 2026-11-20
```

`category`, `perspective`, `evidence`, `fit`, `fitNote` and `incident` belong to incidents
only; the build rejects them on any other kind. `cves` may go on any kind. No other field is
accepted.

## Each kind

| Kind | Files it | Must say in `why` | Usually touches |
| --- | --- | --- | --- |
| `productUpdate` | A vendor shipped, changed or removed a security control in an AI product: a setting, a policy, a log, a guardrail, an admin control | Which attack, control or data path it changes, and for whom | `products`, `controls`, and the product's pattern; an `update` with `action: settings` when the product is on the site |
| `tool` | A new open-source or commercial tool whose job is protecting AI systems: a scanner, a guardrail, a gateway, a red-team kit, a monitor | Which control it helps deliver, and where today there is a gap | `controls` (one to four), `patterns`; an `update` with `action: toolOption` and a file in `data/security-tools/` |
| `launch` | A new AI product or feature that changes where data goes or what an organisation can control | Where data now goes, or what an administrator can now control | `patterns`; an `update` with `action: onboard` (proposed) when it fits a pattern, or `newPattern` when it fits none |
| `research` | How leading teams secure AI; a standard, framework or agency guidance released or revised | The practice it changes, and which control or pattern reads differently now | `controls`, `patterns`; an `update` with `action: controlGuidance` (proposed) when a control's what to do or why should change |
| `incident` | `incident-research`'s, by its rules | Optional | as `incident-research` says |

## The fields that need judgment

- **`date`** is the first announcement: the vendor's post, the release, the advisory, whichever
  came first. A changelog entry dated earlier than the post that announced it takes the
  changelog's date.
- **`title`** says what happened, with the product's name, in the reader's words, not the
  vendor's ("Copilot Studio adds a tenant-wide block on unauthenticated agents", not "Introducing
  enhanced governance").
- **`summary`** is the TL;DR. Plain, specific, no adjectives the source does not support. A
  figure that is the vendor's own claim says so.
- **`why`** is one line: what it changes for an attack, a control, data or access. It is the line
  the owner reads if they read nothing else.
- **`products`** are tooling ids (`toolClaudeCode`, not `claude-code`; the build suggests the id
  when it can). A product not yet on the site is not a `products` entry: name it in the title and
  propose onboarding it.
- **`controls`** are catalogue ids: a MITRE mitigation (`D3-MFA`, `AML.M0020`) or a `cap-*`
  specialisation. Name a control only when the source shows the item delivers or changes it.
- **`patterns`**: at most three, the ones the item touches, from `pattern-map.mjs`.
- **`update`** follows [site-updates.md](site-updates.md). `target` is a path from the repository
  root when the change is to a file, or the id it names (a tooling id, a control id, a security
  tool id, a proposed product id). An applied update's target must exist; the build checks.

## Decisions (data/feed/decisions.yaml)

The owner answers a proposed update with one line per item:

```yaml
- { id: xai-private-inference, decision: approve }
- { id: some-research-post, decision: decline, note: "No change to the control." }
```

The build checks that each id is an item in the feed that proposes an update, that each is
decided once, and that `decision` is `approve` or `decline` (`note` at most 200). The panel on
`/feed/` shows the decision on the item until a run carries it out and removes the line.

## Words

The reader's words are pattern, incident pattern, control, risk and setting. The build rejects
"archetype" in a title, summary, why or note.
