# Changes to the site a feed item implies

An item's `update` records the change to the site it implies and where that stands. The run
makes two kinds of change by itself and proposes the rest; the owner answers proposals in
`data/feed/decisions.yaml`, and each run carries out at most one approved onboard or control
change.

| `action` | What changes | Who | Done with |
| --- | --- | --- | --- |
| `settings` | A product's settings row, new or changed | the run (`applied`) | `tooling-onboard`'s settings format and checks |
| `toolOption` | A security tool listed under a control | the run (`applied`), at most three a run | `data/security-tools/<id>.yaml` |
| `onboard` | A new product on an existing pattern | proposed; the owner approves | `tooling-onboard`, end to end |
| `newControl` | A control the catalogue lacks | proposed | `data/overlay/specializations.yaml` (a `cap-*` under its MITRE parent) |
| `newPattern` | A new kind of AI system | proposed | `pattern-research`, then `pattern-author` |
| `controlGuidance` | A control's recommended practice (its implementation scope, what to do and why) | proposed | the control's entry in `data/overlay/` and the guidance that cites it |

`status` moves one way: `proposed` → `applied` or `declined`. An applied change is made in the
same run as the item that records it.

## Applying a settings row (`settings`)

Only for a product already in `data/tooling/`, and only when the vendor's own page documents the
setting today. Open `tooling-onboard`'s `SKILL.md` and `references/schema.md`, and
`data/tooling/README.md` for the row format; the rules there all apply:

- the row names the setting exactly as the vendor's page does, `where` it is set, `setVia`, `area`,
  the `default`, the `recommended` value, a one-line `why`, the `mitigations` it delivers (each
  pinned on the product's pattern: `reference-set.mjs <pattern id>` lists them), `requires` where
  a plan or licence is needed, the `url` of the page that documents it (followed to where it
  lands), and `verified` as today;
- a changed setting is edited in place, its `verified` bumped; a retired one is removed and the
  removal noted in the file's header comment;
- quote a value that is a bare number or true or false;
- if the setting delivers a control the product's `controls[]` rates `none` or `unknown`, re-rate
  that row on the rule the other products of the pattern use, and say so in its `note`.

A setting that delivers a control the pattern does not pin is not a row: propose a pin
(`controlGuidance`) instead. If the page does not say what the item says, propose; do not apply.
The item's update reads `{ action: settings, status: applied, target: data/tooling/<vendor>/<family>.yaml, note: "<what changed>" }`.

## Adding a security tool (`toolOption`)

At most **three** a run. Only when the tool clearly delivers a control the patterns already pin,
from its own page or repository, and has shipped (a release, a GA announcement, a public
preview). A fourth, or one whose fit is a judgment call, is proposed.

`data/security-tools/<id>.yaml`, named after its id:

```yaml
id: tencent-ai-infra-guard            # kebab-case; the file is <id>.yaml. checked
name: "AI-Infra-Guard"                # <= 80. checked
by: Tencent                           # the vendor or project, <= 80. checked
kind: open                            # open | commercial. checked
url: https://github.com/Tencent/AI-Infra-Guard   # its own page or repository; https. checked
what: "Scans MCP servers and agent skills for poisoned tools and risky permissions before install."   # <= 160. checked
controls: [cap-mcp-tool-integrity, cap-agent-tool-registry]   # 1 to 4 catalogue controls it helps deliver. checked
status: ga                            # ga | preview | beta. checked
released: 2026-11-10                  # YYYY-MM-DD. checked
feed: tencent-ai-infra-guard-mcp-skills   # optional: the feed item that announced it; must exist. checked
```

It appears on each of its controls' pages under **Tools that deliver it**, and on its feed item.
Neutral, as the registry is: `what` says what it does, never that it is the best, and a tool is
one option among several, never the control itself. The item's update reads
`{ action: toolOption, status: applied, target: <tool id>, note: "Lists <name> under <control>." }`.

## Proposing (`onboard`, `newControl`, `newPattern`, `controlGuidance`)

Write the item's `update` with `status: proposed`, the `target` it would change (the product id
to be, the control id, the pattern's working name, the control whose guidance changes) and a
`note` that lets the owner decide from the panel alone: what would change and why, in one line.
Do not change the site for it. The panel on `/feed/` shows the owner the line that approves it.

## Carrying out an approved change

`daily-index.mjs` lists approvals oldest first. Take the first that is an onboard or a control
change, and only one a run:

- **`onboard`**: run `tooling-onboard` for the product, end to end, with its link checks. Set the
  item's `update` to `{ status: applied, target: data/tooling/<vendor>/<family>.yaml }`, and put
  the new tooling id in its `products`.
- **`newControl`**: add the `cap-*` specialisation under its MITRE parent in
  `data/overlay/specializations.yaml`, with its sources, and pin it where the item showed it is
  needed (that is `pattern-author`'s rules for a pin). `target` becomes the new control's id.
- **`controlGuidance`**: change that control's implementation scope (or the guidance that cites
  it) as the item's source supports, citing it. `target` stays the control's id.
- **`newPattern`**: only when the run can take it to the pattern standard (`pattern-author`);
  otherwise it waits, and the log says so.

Then delete the item's line from `decisions.yaml`. For each **declined** item, set
`status: declined`, keep the owner's reason in the `note` if it gives one, and delete its line.
The build fails on a decision whose item proposes nothing, so a stale line is caught.
