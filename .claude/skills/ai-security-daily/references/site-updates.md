# Changes to the site a feed item implies

An item's `update` records the change to the site it implies and where that stands. The run
makes two kinds of change by itself and proposes the rest. Proposals are **not on the site**: no
panel, no status line, no approve line. They live in the repository (the items' `update`,
`data/feed/decisions.yaml`), `npm run queue` lists them, and the digest numbers them so the owner
can answer in the run's session. A change the run made simply appears where it belongs: a row in
a product's settings, a tool under a control.

| `action` | What changes | Who | Done with |
| --- | --- | --- | --- |
| `settings` | A product's settings row, new or changed | the run (`applied`) | `tooling-onboard`'s settings format and checks |
| `toolOption` | A security tool listed under a control | the run (`applied`), at most three a run | `data/security-tools/<id>.yaml` |
| `onboard` | A new product on an existing pattern | proposed; the owner approves | `tooling-onboard`, end to end |
| `newControl` | A control the catalogue lacks | proposed | `data/overlay/specializations.yaml` (a `cap-*` under its MITRE parent) |
| `newPattern` | A new kind of AI system | proposed | `pattern-research`, then `pattern-author` |
| `controlGuidance` | A control's recommended practice (its implementation scope, what to do and why) | proposed | the control's catalogue text in `data/overlay/` |

`status` is `applied`, `proposed`, `declined` or `watch`. `watch` is for a change the run cannot
judge yet (the docs do not show the setting, the tier is empty until a report lands): its note
says what to recheck and when, with a date, and `daily-index.mjs` lists it when it is due. Every
change, applied or carried out on approval, goes through the gate ([gate.md](gate.md)) before it
is committed.

## Applying a settings row (`settings`)

Only for a product already in `data/tooling/`, and only when the vendor's own page documents the
setting today. Open `tooling-onboard`'s `SKILL.md` and `references/schema.md`, and
`data/tooling/README.md` for the row format; the rules there all apply:

- the row names the setting exactly as the vendor's page does, `where` it is set, `setVia` (how
  it can really be set: a managed settings file or MDM is not an admin console, and a key any
  settings file can set is not admin-only), `area`, the `default` (per plan or sign-in method
  where the page splits it), the `recommended` value (one that works under the setting's own
  rules: how sources combine, which wins), a one-line `why` that states no inference, the
  `mitigations` it delivers (each pinned on the product's pattern: `reference-set.mjs <pattern
  id>` lists them), `requires` where a version, plan or licence is needed or a configuration
  excludes it, the `url` of the page that documents it (followed to where it lands), and
  `verified` as today;
- take the version from the docs and say the changelog's too where they differ; "in a future
  release, on or after" is not a date;
- carry a pitfall the page names (an older version rejecting a whole policy; a key that also
  removes other tools; a client where it does not apply);
- a changed setting is edited in place, its `verified` bumped; a retired one is removed and the
  removal noted in the file's header comment;
- quote a value that is a bare number or true or false;
- if the setting delivers a control the product's `controls[]` rates `none` or `unknown`, re-rate
  that row on the rule the other products of the pattern use, and say so in its `note`.

A setting that delivers a control the pattern does not pin is not a row: propose a pin
(`controlGuidance`) instead. If the page does not say what the item says, the update is
`proposed` or `watch`, not applied. The item is a brief in its product's weekly roll-up story
unless it stands alone ([bar.md](bar.md)). Its update reads `{ action: settings, status: applied,
target: data/tooling/<vendor>/<family>.yaml, note: "<what changed>" }`.

## Adding a security tool (`toolOption`)

At most **three** a run, and only under the new-tool rule ([bar.md](bar.md)): a first release
inside the window (from its registry or repository, not a Show HN or blog date), maintained,
documented, and clearly delivering a control the patterns already pin. A fourth, or one whose fit
is a judgment call, is proposed. A prototype is a `research` item and gets no file.

`data/security-tools/<id>.yaml`, named after its id:

```yaml
id: tencent-ai-infra-guard            # kebab-case; the file is <id>.yaml
name: "AI-Infra-Guard"                # <= 80
by: Tencent                           # the vendor or project, <= 80
kind: open                            # open | commercial
url: https://github.com/Tencent/AI-Infra-Guard   # its own page or repository; https
what: "Scans MCP servers and agent skills for poisoned tools and risky permissions before install."   # <= 160
controls: [cap-mcp-tool-integrity, cap-agent-tool-registry]   # 1 to 4 catalogue controls it helps deliver
status: ga                            # ga | preview | beta, as the project itself says
released: 2026-11-10                  # its FIRST release (registry or repository), inside the window
feed: tencent-ai-infra-guard-mcp-skills   # the feed item that announced it
```

Neutral, as the registry is: `what` says what it does, never that it is the best, and a tool is
one option among several, never the control itself. If the project calls itself alpha and the
schema has no such word, the tool waits (`watch`) rather than being filed as beta. The item's
update reads `{ action: toolOption, status: applied, target: <tool id>, note: "Lists <name> under
<control>." }`.

## Proposing (`onboard`, `newControl`, `newPattern`, `controlGuidance`)

Write the item's `update` with `status: proposed`, the `target` it would change (the product id
to be, the control id, the pattern's working name, the control whose guidance changes) and a
`note` that lets the owner decide from the digest alone: what would change, and where, in one
line. Point at the right target: a product that its nearest tooling file excludes is an
`onboard` of its own; review of agent-written code belongs on a code-review control, not a
model-promotion gate. Do not change the site for it.

## The owner's replies, and carrying out an approved change

The owner answers in the run's session, by the digest's numbers ("approve 2, decline 3", with a
reason if they give one). Match each number to the digest's **Waiting for you** list (also in
the log), then:

1. **Record** each answer in `data/feed/decisions.yaml` (`- { id, decision, note }`), and keep
   the line: it is the record.
2. **Declined**: set the item's `update.status` to `declined`; keep the owner's reason in the
   decision's `note`.
3. **Approved**: carry it out, then set `update.status` to `applied` and point `target` at what
   changed:
   - **`onboard`**: run `tooling-onboard` for the product, end to end, with its link checks; put
     the new tooling id in the item's `products`; `target` becomes the new tooling file.
   - **`controlGuidance`**: change that control's catalogue text (its implementation scope, what
     to do and why) in `data/overlay/`, as the item's source supports, citing it. `target` stays
     the control's id.
   - **`newControl`**: add the `cap-*` specialisation under its MITRE parent in
     `data/overlay/specializations.yaml`, with its sources, and pin it where the item showed it
     is needed (`pattern-author`'s rules for a pin). `target` becomes the new control's id.
   - **`settings`** or **`toolOption`** left proposed: apply it by the rules above, if its page
     now supports it.
   - **`newPattern`**: only when the session can take it to the pattern standard
     (`pattern-author`); otherwise it stays approved and the log says it waits.
4. **Verify** every change through the gate, exactly as the daily run does: lint, the brief, a
   fresh verifier in the foreground, resolve, the gate passes.
5. **Log, build, test, commit and push**, and answer with a short digest of what was done.

An approval the session cannot finish stays `proposed` with its `approve` line recorded;
`daily-index.mjs` lists it, and the next daily run carries out at most one such change, the
oldest first. The build fails on a decision whose item has no `update`, so a stray line is
caught.
