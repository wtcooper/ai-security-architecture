# Report template

Write the report to `docs/research/patterns/<YYYY-MM-DD>.md`, where the date is the day the
scan ran. Keep these headings in this order. The file name's date is what the next scan reads
to know where to start, so do not rename it.

```markdown
# Pattern scan, <YYYY-MM-DD>

Window: <from> to <to>. Compared against <N> patterns.

## Summary

<Two or three sentences: what to do. Then the counts.>

| Outcome | Count |
| --- | --- |
| New pattern | n |
| Change to an existing pattern | n |
| Product of an existing pattern | n |
| Watch | n |

## New patterns recommended

### <Working title, in the reader's words>

- **What it is:** <one or two sentences>
- **Use it when:** <one sentence, as it would read on the pattern finder>
- **Evidence:** <product, status (GA / preview / announced), publisher, page date, address> (one line per product)
- **Nearest pattern:** <title> — and how this differs:
  - Who runs each part: <difference>
  - Where the agent or model runs and what it reaches: <difference>
  - What crosses a boundary, through what: <difference>
  - Where the controls go and who holds them: <difference>
- **Where it belongs:** <tools on your devices / AI services you subscribe to / applications you build>
- **Confidence:** <high / medium / low, and why>
- **Next step:** draw it with `pattern-author`.

## Changes to existing patterns

| Pattern | What changed in the world | What would change on the drawing | Evidence |
| --- | --- | --- | --- |

## Products of existing patterns

| Product | Vendor | Pattern it belongs to | Already listed? | Status | Evidence | Next step |
| --- | --- | --- | --- | --- | --- | --- |

"Next step" is `tooling-onboard` for a product worth cataloguing, "add as an example" for one
worth naming only, or "none".

## Watch

| What | Why it is not a pattern yet | What would promote it | Evidence |
| --- | --- | --- | --- |

## Stale in the catalogue

| Pattern | Item | What is out of date | Evidence |
| --- | --- | --- | --- |

## Could not verify

<Pages that would not load, claims found only in secondary sources, anything left open.>

## Search log

| Lane | Query | New leads |
| --- | --- | --- |

<One row per query actually run. A lane with no rows was not searched: say so above.>

## Sources

<Every address cited above, once, as a list: title, publisher, date.>
```

Rules of thumb:

- Dates are the page's own date, not the day you read it.
- "GA", "preview" and "announced" are different facts; never round up.
- If two findings are the same kind of thing from two vendors, they are one row with two lines
  of evidence, not two rows.
- An empty heading stays, with "None this scan." A missing heading reads as an omission.
