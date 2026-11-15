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
the cause is general, or with a grid cell (`col`, `row`, `rowSpan`) in its own file if it is
particular.

| Rule | What it means | How it is checked |
| --- | --- | --- |
| **L1 Size** | The drawing is at most 1440px wide and 980px tall, so on a 1366px laptop it shows at no less than 90% and without scrolling sideways. | Audit |
| **L2 Boundaries are respected** | An arrow never runs through a trust boundary that neither of its ends is in. A flow from a person to the vendor goes round our cloud, not through it. | Audit |
| **L3 Containers are respected** | An arrow never runs through a container (a box that holds others) that neither of its ends is in. | Audit |
| **L4 Words are clear** | Every labelled flow shows its label, and no label sits on a box, on another label, or across another arrow. | Audit |
| **L5 Nothing is cut short** | No title, one-liner or flow label ends in "…". | Audit |
| **L6 No wasted space** | A container is no taller than its contents need (under 70px spare), and a boundary has no empty row above its first box or below its last (under 110px). | Audit |
| **L7 Arrows are simple** | An arrow turns at most four times and never runs through a box that is not one of its ends. | Audit |
| **L8 It reads as a picture** | The eye can follow each flow from end to end; related boxes sit together; nothing looks accidental. | By eye |

## Structure: every drawing is built the same way

These hold for all patterns because the engine draws them, and are covered by the drawing tests.

| Rule | What it means |
| --- | --- |
| **S1 Zones** | Each zone is a labelled outline carrying its canonical name: Managed endpoint, Enterprise cloud, Vendor platform, External. Ours are dashed grey, the vendor's violet, External red-tinted. |
| **S2 People** | People stand at the left, outside every boundary. |
| **S3 Control plane** | The security and governance control plane is one band beneath everything. Each of its boxes shows the controls it owns. A control-plane box that owns no control on a pattern is a finding about that pattern (rule C5). |
| **S4 External** | External parties sit in a band beneath the trust boundaries, each under what reaches it. The band is tagged "no agreement" only when nothing in it is reached under contract. |
| **S5 One numbering** | Purple circles are controls, numbered as on the Enable tab. Red tags are risks. Dark squares are the steps of a walk. Nothing else is numbered. |
| **S6 Type accent** | A box's left edge says what it is: application, model, data, control point, person. |
| **S7 Same data, two views** | The Boundaries view and the Detailed canvas carry the same blocks, flows, pins and cloud relabelling. |

## Content: what a pattern's file must carry

| Rule | Field | What it must be |
| --- | --- | --- |
| **C1 One-liner** | `summary` on every block | One line saying what the box holds or does on this pattern, in the reader's words. Lower case, no full stop, " · " between parallel items. At most 78 characters, and it must show uncut (L5): a container shows one line, so keep its one-liner to about 40. It does not repeat the title, and it does not list every item: the Detailed view does that. |
| **C2 Gloss** | `gloss` on every endpoint, cloud and vendor zone that holds a block | A few words on what the zone is on this pattern ("developer's machine", "our network", "the vendor's cloud"). At most 40 characters. |
| **C3 Crossings** | `crossing` on every flow whose ends are in different zones | `kind`: `brokered` (through a control point we run), `vendor` (governed by the vendor), `person` (through the person present) or `direct` (nothing of ours in the path). `via`: one line naming what the flow passes through on our side, and for `direct`, starting "Nothing between:" and naming the only thing that does apply. It must agree with the controls pinned on that flow and its ends. |
| **C4 When it applies** | `useWhen` in `data/overlay/patterns.yaml` | One sentence in the reader's words, plus the search words a reader might use. |
| **C5 Control plane is used** | `mitigations` on control-plane blocks | Every control-plane box drawn owns at least one control the pattern pins, or the pattern's file says why it is drawn empty. |
| **C6 Notes** | `note` on every block and flow | The hover text: what it is and why it matters here. |
| **C7 Walks** | `walkthrough` and `scenarios` | One complete walk and at least two scenario walks, every step on a real flow. |
| **C8 Guidance** | `data/reference/guidance/<slug>.yaml` | An overview and at least four action-titled items, each citing controls the pattern pins. |
| **C9 Tools** | `data/tooling/`, `data/clouds/` | At least one catalogued product with settings, and for a pattern you build, its mapping onto each cloud. Where no product exists yet, the Enable tab says so. |

C1 to C3 are the fields the boundary drawing added, and the audit counts them. C4 to C9 predate
it; the build already enforces C4, C7 and C8, and the inventory below records C5, C6 and C9.

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

A pattern is signed off when its audit row is clean and its drawing has been looked at in the
browser in three states: at rest with control chips, on Risks & flows with a walk running, and,
for a pattern you build, drawn as one cloud.

| Pattern | Audit clean | Viewed | Notes |
| --- | --- | --- | --- |
| Third-party coding & desktop agents | | | |
| First-party coding & desktop agents | | | |
| Browser AI agents & extensions | | | |
| Local model runtime | | | |
| Personal autonomous agent | | | |
| Enterprise AI chat with connectors | | | |
| Coding & desktop session managed agent runtime | | | |
| UI/low-code managed agent runtime | | | |
| API/SDK managed agent runtime | | | |
| Persistent managed agents | | | |
| Single agent workflow | | | |
| Multi-agent workflow | | | |
| Chat agent with tools | | | |
| Agent-to-agent federation across platforms | | | |
| Agent sandbox for RL & evaluation | | | |
| Remote MCP server you publish | | | |
| Self-hosted model inference | | | |
| Model training & release pipeline | | | |
