# The pattern standard

What every pattern must meet before it is called complete. A pattern is one file under
`data/reference/architectures/`, its guidance file, and whatever the registry holds for it.
The standard has three parts: how the drawing is laid out, what the drawing shows, and what the
pattern's file must contain.

Most of it is measured. `npm run drawing:audit` prints one row per pattern with a count per
rule, `npm run drawing:audit -- <slug>` spells out every finding for one pattern, and
`scripts/drawing.test.tsx` asserts the same numbers, so a pattern that slips fails the build.
The rules a script cannot judge are checked by eye, per pattern, and recorded in the sign-off
table at the end.

## Layout: the drawing is readable

The boundary drawing is laid out by `src/components/drawing/layout.ts` from the pattern's own
data. No pattern has coordinates in code. A pattern that reads badly is fixed in the engine if
the cause is general, or in its own file if it is particular, with a `cell` on a block: its
grid cell on the drawing, where that should differ from its authored `col` and `row`. Nine patterns use it, on one convention: Enterprise data sits under the Tool services
that read it, so our cloud is two columns wide.

| Rule | What it means | How it is checked |
| --- | --- | --- |
| **L1 Size** | The drawing is at most 1440px wide, so on a 1366px laptop it shows at no less than 90% and never scrolls sideways, and at most 1080px tall, so the expanded view fits a 1080p screen. | Audit |
| **L2 Boundaries are respected** | An arrow never runs through a trust boundary that neither of its ends is in. A flow from a person to the vendor goes round our cloud, not through it. | Audit |
| **L3 Containers are respected** | An arrow never runs through a container (a box that holds others) that neither of its ends is in. | Audit |
| **L4 Words are clear** | Every labelled flow shows its label, and no label sits on a box, on another label, across another arrow, or past the edge of the drawing. | Audit |
| **L5 Nothing is cut short** | No title, one-liner or flow label ends in "…", including the cloud service names a box shows when the pattern is drawn as AWS, Azure or Google Cloud. | Audit |
| **L6 No wasted space** | A container is no taller than its contents need (under 70px spare), and a boundary has no empty row above its first box or below its last (under 110px). | Audit |
| **L7 Arrows are simple** | An arrow turns at most four times and never runs through a box that is not one of its ends. | Audit |
| **L8 It reads as a picture** | The eye can follow each flow from end to end; related boxes sit together; nothing looks accidental. | By eye |

## Structure: every drawing is built the same way

These hold for all patterns because the engine draws them, and are covered by the drawing tests.

| Rule | What it means |
| --- | --- |
| **S1 Zones** | Each zone is a labelled outline carrying its canonical name: Managed endpoint, Enterprise cloud, Vendor platform, External. Ours are dashed grey, the vendor's violet, External red-tinted. |
| **S2 People** | People and outside callers stand at the left, outside every boundary, whichever zone their block names, and their flows count as boundary crossings. |
| **S3 Control plane** | The security and governance control plane is one band beneath everything. Each of its boxes shows the controls it owns. A control-plane box that owns no control on a pattern is a finding about that pattern (rule C5). |
| **S4 External** | External parties sit in a band beneath the trust boundaries, each under what reaches it. The band is tagged "no agreement" only when nothing in it is reached under contract. |
| **S5 One numbering** | Purple circles are controls, numbered as on the Enable tab. Red tags are risks. Dark squares are the steps of a walk. Nothing else is numbered. |
| **S6 Type accent** | A box's left edge says what it is: application, model, data, control point, person. |
| **S7 One drawing** | The boundary drawing is the only drawing of a pattern. It shows one kind of marker at a time (controls, risks, or a flow's steps), names each component's service when the pattern is read as built on a cloud, and replays incident steps. What a box holds is in its hover card and listed in full under How it works. |

## Content: what a pattern's file must carry

| Rule | Field | What it must be |
| --- | --- | --- |
| **C1 One-liner** | `summary` on every block | One line saying what the box holds or does on this pattern, in the reader's words. Lower case, no full stop, " · " between parallel items. At most 78 characters, and it must show uncut (L5). In practice a box shows three lines of about 25 characters; a container's heading shows two lines of about 33. It does not repeat the title, and it does not list every item: How it works does that. |
| **C2 Gloss** | `gloss` on every endpoint, cloud and vendor zone that holds a block | A few words on what the zone is on this pattern ("developer's machine", "our network", "the vendor's cloud"). At most 40 characters, and short enough not to widen its boundary by more than 64px: a zone that holds one box has room for about 20. |
| **C3 Crossings** | `crossing` on every flow whose ends are in different zones | `kind`: `brokered` (through a control point we run), `vendor` (governed by the vendor), `person` (through the person present) or `direct` (nothing of ours in the path). `via`: one line naming what the flow passes through on our side, and for `direct`, starting "Nothing between:" and naming the only thing that does apply. It must agree with the controls pinned on that flow and its ends. |
| **C4 When it applies** | `useWhen` in `data/overlay/patterns.yaml` | One sentence in the reader's words, plus the search words a reader might use. |
| **C5 Control plane is used** | `mitigations` on control-plane blocks | Every control-plane box drawn owns at least one control the pattern pins, or the pattern's file says why it is drawn empty. |
| **C6 Notes** | `note` on every block and flow | The hover text and the architect's version: what it is and why it matters here. |
| **C7 Walks** | `walkthrough` and `scenarios` | One complete walk and at least two scenario walks, every step on a real flow. |
| **C8 Guidance** | `data/reference/guidance/<slug>.yaml` | An overview and at least four action-titled items, each citing controls the pattern pins. |
| **C9 Tools** | `data/tooling/`, `data/clouds/` | At least one catalogued product with settings, and for a pattern you host, its mapping onto each cloud and onto an on-premises data centre. On a hosted pattern a catalogued tool is what a box is built with, not an alternative to where it runs: it names the box it `fills`, as does every example. Where no product exists yet, the Enable tab says so. |
| **C10 Platforms** | `data/clouds/<cloud>.yaml` | For a pattern you host: on each cloud and on-premises, a service (or "you build this") for every component, and at least one of the platform's own settings for every pinned control, each read on the vendor's page. Each mapping also carries the date it was checked (`verified`), the page each named component was checked against (`sources`), every place where that platform does not follow the drawing (`differences`, marked ≠ on the drawing), the supporting services that are not boxes (`alsoNeeded`) and the vendor's own starting point (`quickstart`). A setting may carry a read-only `check`; the build refuses one that changes anything. A mapping may list its `hosting` options, each answering the same ten comparison rows from the vendor's pages with no ranking: one is the mapping itself, a variant on the same pattern states only the components and settings that change and must still deliver every pinned control, and a managed agent service names the other pattern it is drawn as. The tests check all of this for every pattern-and-platform pair. |
| **C11 Plain instruction** | `do` and `why` on every control pin | `do`: what to put in place at that spot, as one plain sentence that starts with a verb ("Require a second sign-in factor at your identity provider…"). `why`: what goes wrong without it, in one or two short sentences. Written for whoever has to enable the pattern, not for a security architect: no abbreviations or security terms a general reader would stop at, no dashes, at most 260 and 220 characters. They are the headline of the control's row on Enable and the chip's hover on the drawing; the precise wording stays in `note`. The build requires both and the tests check the wording. |

C1 to C3 are the fields the boundary drawing added, and the audit fails on them. C4 to C11
predate it: the build already enforces C4 and C8, and the audit reports C5, C6, C7 and C9 as
open questions in its last column without failing, because closing one is a decision about the
pattern, not a fix to the drawing.

## Writing the one-liners and crossings

Read the block's `note`, its `items` and the flows that touch it, then write what a security
architect would say the box is for on this pattern.

| Instead of | Write |
| --- | --- |
| "Agent loop · Context assembly · MCP client" (the item list) | "the vendor's app: loop, context, MCP client" |
| "Approved packages" (the title again) | "approved packages, pinned by digest" |
| "Identity services" with nothing under it | "IdP and device posture" |
| A sentence with a full stop | A phrase without one |

For a crossing, look at what is pinned on the flow and its two ends. If a control point we run
(an AI gateway, a registry, a tunnel connector, an identity provider) is one end, it is
`brokered` and `via` names it and what it does there ("AI gateway: vaulted key, allowlisted
provider"). If the flow never touches anything we run, it is `vendor` ("The vendor's own call:
assured, not inspected"). If the only thing in the path is the person at the device, it is
`person`. Otherwise it is `direct`, and `via` says what little does apply ("Nothing between:
the endpoint egress allowlist only"). A `direct` crossing is not a mistake to hide: it is the
finding the table exists to show.

## Sign-off

A pattern is signed off when its audit row is clean and its drawing has been looked at.

Signed off 2026-11-15, and on 2026-11-18 for the managed agent service in your cloud, added
that day. For all 19 the audit reports no finding on any rule (L1 to L7, C1 to
C3). Each drawing was viewed by eye at rest, at laptop width. The other states were checked in
the browser for every pattern (no sideways scroll at 1366px; every control has a chip; on Risks
& flows every pinned risk has a tag and every step of the walkthrough is drawn; each cloud's
relabelling renders without error) and two were viewed by eye: the third-party coding agent
with a walk running, and the chat agent drawn as Azure. Open questions about the patterns
themselves are in [PATTERN-FINDINGS.md](PATTERN-FINDINGS.md).

| Pattern | Size | Scale at 1366px | Notes from the viewing |
| --- | --- | --- | --- |
| Third-party coding & desktop agents | 1382×915 | 93% | Cloud folded to two columns. The vendor flows run over the top of our boundaries. |
| First-party coding & desktop agents | 1104×798 | 100% | Identity services is drawn empty (open question). |
| Browser AI agents & extensions | 1348×950 | 96% | Glosses shortened so the single-box cloud and vendor boundaries do not overlap. |
| Local model runtime | 1192×565 | 100% | Two control-plane boxes only, as authored. |
| Personal autonomous agent | 1369×1051 | 94% | The tallest drawing. Sandbox folded to one column; the workspace mount loops round the sandbox. |
| Enterprise AI chat with connectors | 1281×796 | 100% | Clean. |
| Coding & desktop session managed agent runtime | 1310×913 | 99% | Vendor zone folded to one column. Three vendor flows run down through the vendor's own boundary to External. |
| UI/low-code managed agent runtime | 1057×906 | 100% | People reach the vendor over the top of our cloud, not through it. |
| API/SDK managed agent runtime | 1056×939 | 100% | Folded from five rows to four. The deploy flow steps round Source control. |
| Persistent managed agents | 1264×913 | 100% | One label ("browser action / page") sits a little off its arrow. |
| Single agent workflow | 1006×810 | 100% | The escalation flow runs under the harness to the operator. |
| Multi-agent workflow | 1232×877 | 100% | Same escalation route; the harness holds three boxes. |
| Chat agent with tools | 1006×973 | 100% | Registry moved under Enterprise data so the cloud is two columns. |
| Agent-to-agent federation across platforms | 1334×925 | 97% | Clean. |
| Agent sandbox for RL & evaluation | 1054×975 | 100% | Secrets & key management is drawn empty, by the pattern's own note. |
| Remote MCP server you publish | 958×647 | 100% | Callers now stand outside our cloud; three inbound crossings added. |
| Self-hosted model inference | 1252×692 | 100% | Secrets & key management is drawn empty (open question). |
| Model training & release pipeline | 1006×706 | 100% | Training content comes in up the outside of the boundary. Observability & response is drawn empty (open question). |
| Managed agent service in your cloud | 1304×925 | 99% | The provider's hosted connectors sit beside the runtime, so the web flow drops straight to External and no arrow crosses another. The deploy flow steps round Memory & state and runs close above the session flow. Viewed at rest, with risks lit and with the walkthrough running. Not yet mapped onto a cloud (open question). |

A drawing narrower than the page is shown larger than 100%, up to the page width.
