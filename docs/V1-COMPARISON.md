# Compared with version 1

Version 1 is the risk-first app as it was deployed before the restructure, kept on the `v1`
branch. This is the check that moving to patterns did not drop anything along the way. It was
last run on 2026-11-16 and can be run again:

```bash
git show v1:src/data/generated/dataset.json > /tmp/v1.json
npx tsx scripts/compare-v1.ts /tmp/v1.json            # a table, then every difference
```

## Result

Nothing version 1 held is missing from the data. One thing version 1 showed on the page had
been lost and is restored. Everything else is either unchanged, deliberately reworded, or new.

## The data

The script compares every pattern field by field: components and their sub-components, flows,
zones, control and risk pins, the order of controls (which sets the chip numbers), walks step by
step, examples, deviations, sources, guidance, tools with their settings and control rows, cloud
mappings, and the catalogues behind them. "Changed" allows for the one deliberate rewording,
archetype to pattern.

| | Version 1 | Now |
| --- | --- | --- |
| Patterns | 18 | 18 |
| Components | 301 | 301 |
| Sub-components | 425 | 425 |
| Flows | 198 | 198 |
| Control pins | 294 | 299 |
| Risk pins | 229 | 229 |
| Walks, and their steps | 95, 731 | 95, 731 |
| Guidance items | 127 | 128 |
| Tools, and their settings | 52, 1,243 | 54, 1,274 |
| Cloud settings | 236 | 238 |
| Cloud component bindings | 246 | 246 |
| Incidents | 20 | 20 |
| Risks, CoSAI controls, components | 36, 35, 23 | 36, 35, 23 |
| Controls in the catalogue | 76 | 76 |

- **Dropped: none.** No component, sub-component, flow, pin, walk step, guidance item, tool,
  setting, cloud binding, incident or catalogue entry is gone. The script lists two items as
  dropped because their titles changed: the sandbox's first guidance item (no longer "VM-backed")
  and the local runtime's deviation about its undrawn egress. Both are still there.
- **Chip numbers: unchanged.** No pattern's controls were reordered. The four patterns that
  gained a control gained it at the end, so every existing chip keeps its number.
- **Changed: 60 passages of text.** Forty-three are from the prose review: notes, one flow
  label's note, walk steps and two example notes brought into line with the rest of their own
  file or with the vendor's page. The rest are the two decisions made on 2026-11-16: the
  sandbox defined without naming a technique, and the local runtime's outbound calls filtered
  at the proxy. [PATTERN-FINDINGS.md](PATTERN-FINDINGS.md) lists them.
- **Added:** five control pins (two of them outbound traffic filtering on the local runtime)
  and the cloud settings that deliver the first three; one guidance item; five control-plane
  notes on agent federation; five walk notes on persistent managed agents; one deviation; two
  tools (Google ADK, Inspect) and a vendor. Not counted by the script because version 1 had no
  such fields: a one-liner on all 301 components, a few words on 33 zones, and what each of 101
  boundary-crossing flows passes through.

## The pages

| Version 1 showed | Now |
| --- | --- |
| Landing page: the three-phase framing, a four-step path, reference links, data sources | The home page is the pattern finder. The framing and the data sources are on the Reference index; the four destinations are all in the navigation. |
| Risk map | Reference › Risk map, unchanged |
| Capabilities matrix and detail | Controls, grouped by NIST CSF category, with the CoSAI grouping one switch away. The detail gained the control's CSF category. |
| Architecture header: surface, title, examples, **summary** | Pattern header: situation, title, use-when line, **summary**, examples. The summary was missing after the restructure and has been put back; a test now fails without it. |
| The drawing: components with their sub-components and icons, flows, control chips, risk tags, cloud relabelling, export | Two drawings of the same data. **Boundaries** (the default) shows each component with a one-line description; its sub-components appear when you point at it. **Detailed** is version 1's drawing, unchanged. |
| Overview tab: how it works, why it is its own archetype, sources | How it works: the same three, plus the examples with their notes and the recorded deviations, which were in the data and never shown. |
| Sequence flows tab: the walks, with risk tags on the drawing | Risks & flows: the same, plus the pattern's risks as a list and the boundary-crossings table. |
| Enable tab: foundations, surface baseline, use-case additions, tools | Enable: "What to do", then enterprise controls by CSF category, then tool settings. Every row and every setting is still there. |
| Incidents, Risks, Controls (CoSAI), Components, Personas, Frameworks | Unchanged. Risks, CoSAI controls, components, personas and frameworks moved under Reference; incidents also appear on their pattern. |
| The experimental drawings | Removed on purpose: one of them became the Boundaries drawing. |

Every address version 1 used is forwarded to its new one.

## What the default drawing no longer shows at a glance

This is the one deliberate trade. Version 1's drawing printed all 425 sub-components on the
canvas, which is what made it hard to read at laptop size. The Boundaries drawing replaces them
with one line per component. By a word-matching count, about 120 sub-components are not named
in their component's one-liner: for example "Computer use" under the personal agent's native
tools, "Skills catalogue" under several AI gateways, "A2A peer agents" under tool services.

They are not lost. Each is listed in the component's hover card on the Boundaries drawing, and
all are drawn with their icons and notes on the Detailed drawing. But a reader who looks only at
the default drawing and never points at a box will not see them.
