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
| Landing page: the three-phase framing, a four-step path, reference links, data sources | The home page opens with how to read a pattern, then the pattern finder: one situation at a time, a short list and a preview with the drawing. The framing and the data sources are on the Reference index. |
| Risk map | Reference › Risk map, unchanged |
| Capabilities matrix and detail | Controls, grouped by NIST CSF category, with the CoSAI grouping one switch away. The detail gained the control's CSF category. |
| Architecture header: surface, title, examples, **summary** | Pattern header: situation, title, use-when line, **summary**, examples. The summary was missing after the restructure and has been put back; a test now fails without it. |
| The drawing: components with their sub-components and icons, flows, control chips, risk tags, cloud relabelling, export | One drawing, the trust-boundary view: each component with a one-line description, and its sub-components in its hover card. Version 1's canvas was kept as a second "Detailed" view until 2026-11-16 and then retired; the icons went with it. |
| Overview tab: how it works, why it is its own archetype, sources | How it works: the same three, plus every component listed with everything it holds and each item's note, the examples with their notes, and the recorded deviations. |
| Sequence flows tab: the walks, with risk tags on the drawing | Two tabs. Risks: the pattern's risks as a list, tagged on the drawing. Flows: the walks numbered onto the drawing, the sequence diagram and the boundary-crossings table. |
| Enable tab: four folded steps (foundations, surface baseline, use-case additions, tools) | Enable: two folded steps. Enterprise controls under plain headings that follow the NIST CSF categories, each row leading with what to do and why in plain words (new: version 1 showed the control's name and definition), then the same list as the settings of the product you run, in the same row shape under the same headings, each naming the control it delivers. With a product chosen, each control names that product's settings. The component table for a cloud moved to How it works. The governance guidance moved to How it works. Every row and every setting is still there. |
| Cloud patterns: a "Drawn as" relabelling of the drawing, and each cloud's settings as a product on Enable | The same data, brought to the front. One **Built on** switch (Generic, AWS, Azure, Google Cloud) names every component's service on the drawing, lists that cloud's own setting beside every control, names what plays each component under How it works, and compares the three clouds under How it works. A new Reference › Clouds page turns it round: one cloud, its patterns and its option for every control. Since 2026-11-18: a fifth option, **On-premises** (the pattern run in the organisation's own data centre, `data/clouds/onprem.yaml`); every mapping is dated, links each named component to the vendor page it was checked against, states where that platform does not follow the drawing (marked ≠) and lists the supporting services that are not boxes; a setting may carry a read-only check; and an organisation can record what it runs in place of a reference component (`docs/CLOUD-VERIFICATION.md`). The category is now "AI you host yourself". On a hosted pattern the settings step offers two separate choices, where it runs and what it is built with, in place of one row that mixed clouds with frameworks. |
| Incidents, Risks, Controls (CoSAI), Components, Personas, Frameworks | Unchanged. Risks, CoSAI controls, components, personas and frameworks moved under Reference; incidents also appear on their pattern. |
| The experimental drawings | Removed on purpose: one of them became the drawing. |

Every address version 1 used is forwarded to its new one.

## What the drawing no longer shows at a glance

This is the one deliberate trade. Version 1's drawing printed all 425 sub-components on the
canvas, each with an icon, which is what made it hard to read at laptop size. The drawing now
shows one line per component. By a word-matching count, about 120 sub-components are not named
in their component's one-liner: for example "Computer use" under the personal agent's native
tools, "Skills catalogue" under several AI gateways, "A2A peer agents" under tool services.

They are not lost. Each is listed in the component's hover card on the drawing, and all 425
are listed with their notes under **How it works › Components**, which a test checks for every
pattern. What is gone is the icon beside each one, the standalone HTML export of the old
canvas, and the Tools index page (every tool is still reached from its pattern and from
search).
