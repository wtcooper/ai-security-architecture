# The gate: lint, an independent verifier, resolve

Nothing the run drafts reaches the site until a second reader, who did not write it, has opened
every source and checked every claim, and every finding is fixed or its entry left out. This
page is for the run. The verifier gets its own page, [verification.md](verification.md), and the
brief, and nothing else.

The verification is part of the daily run, not a task of its own: it happens in this session,
between drafting and the build, and the run waits for it.

## 1. Before the verifier: lint-clean

```bash
node .claude/skills/ai-security-daily/scripts/feed-lint.mjs [--standalone <id,…>]
```

Zero errors, or the verifier does not start (`verify-brief.mjs` refuses to write a brief while
the lint has errors). Its checks travel with the brief. If the lint says HEAD does not contain
origin/main, someone pushed to `main` during the run: commit the draft locally, `git pull --rebase
origin main`, and lint again, so the diff holds only this run's work.

## 2. Write the brief

Work in a folder outside the repository: the session's scratchpad if it has one, otherwise
`/tmp/ai-security-daily-<today>/`. Call it `<scratch>`.

```bash
node .claude/skills/ai-security-daily/scripts/verify-brief.mjs --out <scratch>/brief.md
```

The brief holds, from `git diff` against origin/main (untracked files included), every new or
changed feed item, story, day and week overview, tooling row, security tool, catalogue entry,
decision and incident file, and any removal; for each, its ref and hash, what it says (and, for a
change, what it said before), its sources, and the lint checks to rule on. It is ordered by
stakes: headline and notable items; tooling, control and decision changes and security tools;
incident files; stories and overviews; brief items. It carries none of your notes.

With more than about 20 entries, split it: `--part 1/2 --out <scratch>/brief-1.md` and `--part
2/2 --out <scratch>/brief-2.md` (or three parts), one verifier each.

## 3. Start the verifier, in the foreground

Use the **Agent** tool (in some sessions it is called Task) with:

- `subagent_type`: `general-purpose`;
- `run_in_background`: `false`. **Never** run a verifier in the background. With several parts,
  start all of them in one message, each in the foreground; the run waits for every one;
- `description`: `Verify today's feed`;
- `prompt`: the text below, with the two paths filled in, and nothing else: no summary of the
  day, no opinion on what is solid, no hint of what to look for.

````text
You are the independent verifier for an AI security feed that is published live. You did not
write any of this work and you have no stake in it passing: your job is to find what is wrong
before readers do.

Read exactly two files the run gives you:
  1. The checklist: <repo root>/.claude/skills/ai-security-daily/references/verification.md
  2. The brief: <scratch>/brief.md

For every entry in the brief, in its order, open every source it cites with your fetch tool, and
for a security tool its package registry or repository as well, and check every claim against
the checklist. You may read the repository's data to check placement (a product's file in
data/tooling/, a pattern's pinned controls with
`node .claude/skills/incident-research/scripts/pattern-map.mjs <pattern id>`, the control
catalogue in data/overlay/, the deep dives in data/incidents/). Do not read docs/research/daily/,
which is the run's own log. Change nothing: no edits, no new files in the repository, no git
commands that write.

Return only the JSON the checklist's last section describes, in one ```json block. Every entry
gets a result, even when it passes; an entry you could not finish goes in "unverified".
````

Then **wait**. While it runs, the run does nothing that writes to `data/` or commits; it may
read, or draft the log's search sections.

Save the JSON it returns as `<scratch>/findings.json` (`findings-1.json`, `findings-2.json` for
parts). If it returns prose around the JSON, keep only the JSON block.

### If it fails

If the Agent call errors, returns no parseable JSON, or the session cannot wait for it to finish,
verification **did not complete**: publish nothing new. Restore `data/` to origin/main (undo any
local commit of the draft with `git reset --mixed origin/main`, then `git checkout origin/main --
data/` and remove the run's new files under `data/`), write only the
log section, saying verification did not complete and naming the drafted items and their primary
sources as leads for the next run, build, test, commit the log alone and push. The digest says
so under **Problems**.

### If there is no Agent tool

Then the run checks its own work, as a **separate pass**, and says so:

1. Start the pass only once drafting is finished, the lint is clean and the brief is written.
2. Read [verification.md](verification.md) from the top, as the verifier would.
3. Take the brief's entries in order. For each, re-open every source with the fetch tool, now:
   never rely on your memory of a page, and never reuse a fetch from drafting. Check every claim
   against the checklist, line by line, and write its result.
4. Write the same JSON, with `"verifier": "self-check"`.
5. The log's **Verification** section and the digest's **Problems** both say: *verification was
   not independent: no Agent tool in this session*.

## 4. Resolve every finding

The verifier's findings are not advice: an entry with an unresolved blocking finding is not
published. For each finding, add a `resolution` to it in the JSON:

| Resolution | When | What you do |
| --- | --- | --- |
| `fixed: <what changed>` | The verifier's evidence (or the source, re-read) supports a correction | Make the correction, and only what the evidence supports |
| `fixed in <ref>: <what>` | The fix lives in another entry (an overview, a story, a row) | Make it there; that entry is checked too |
| `dropped: <why>` | It cannot be fixed from the sources, or fails the bar | Take the entry out of the diff (below) |
| `taken` / `left: <why>` | A `suggestion` | Optional; the log records it |

**Dropping** an entry: delete a new item, row, tool, story or overview entry; restore a changed
one to its text on origin/main. An item whose applied change (a row, a tool) was dropped is
dropped too, or its `update.status` becomes `proposed`, recorded as a finding of your own. A
dropped item named in an overview or a story is taken out of them too.

**Your own changes after the check** (an overview rewritten after a drop, a story whose items
moved) go in the JSON as findings of your own, `"by": "run"`, each with its resolution, so the
gate and the log show them. A fix or change that adds a claim the verifier never saw, or that the
finding's evidence does not carry, is checked again: write `verify-brief.mjs --only <ref,…> --out
<scratch>/recheck.md`, start a fresh verifier on it as above, and add its JSON to the gate. One
recheck; what fails it is dropped.

Then lint again, and run the gate:

```bash
node .claude/skills/ai-security-daily/scripts/feed-lint.mjs
node .claude/skills/ai-security-daily/scripts/verify-brief.mjs --gate <scratch>/findings.json[,<scratch>/findings-2.json,…]
```

The gate re-reads the diff and passes only when: the lint has no errors; every entry in the diff
has a result; no blocking finding is unresolved or resolved as anything but fixed; nothing marked
dropped is still in the diff; nothing marked fixed is unchanged; and nothing changed after it was
checked without a finding that says so. It prints the table the log takes. Do not build or
commit until it passes.

## 5. The time budget

Leave the verifier about a third of the run. If time runs short:

- the brief is in priority order, so the verifier reaches headline and notable items and every
  tooling or control change first;
- a **brief** item that was not verified is dropped, not published (it waits as a lead for the
  next run, named in the log);
- a headline or notable item, a row or a control change that was not verified is never published
  either; if the verifier could not reach those, verification did not complete (above).

Draft less rather than verify less: five checked items are worth more than fifteen unchecked.

## 6. In the log

Under `### Verification` in today's section:

- independent (how many verifiers, how many entries each) or self-check, and why;
- the gate's table: every entry with findings, each finding and its resolution;
- what was dropped, and why, in a line each;
- anything rechecked, and the result.

## 7. The Monday audit

```bash
node .claude/skills/ai-security-daily/scripts/verify-brief.mjs --audit --out <scratch>/audit.md
```

Ten items picked at random (the seed is today's date, so the pick can be repeated) from last
week's, Monday to Sunday, as they stand now. Start a fresh verifier on it exactly as in section 3
(the prompt is the same, with the audit brief's path), in the foreground, and wait. Resolve its
findings by correcting the items and the files they changed (a wrong settings row is a finding on
the item that applied it). Those corrections are changes in today's diff, so they go through
today's lint, verifier and gate with everything else. Log the sample, the findings and what was
corrected under `### Weekly audit`; the digest lists the corrections under **On the site**.
