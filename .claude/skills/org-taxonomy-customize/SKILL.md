---
name: org-taxonomy-customize
description: Cross-map an organisation's own control standard, policy catalogue or risk register onto this repository's CoSAI taxonomy (risks, controls, capabilities) by editing text files under data/org/, and record the organisation's status per AI tool. Use this whenever someone wants to see their own control IDs, standards, requirements, "top risks" or posture on the Frameworks tab, the risk/control/capability cards, the reference architecture pages or the AI Tooling tab — including phrases like "map our controls", "add our standard", "our risk register", "cross-walk to CoSAI", "customise this for my company", "mark what we have enabled", "org profile", or "data/org". Also use it when an adopter has cloned the repo and asks how to make it theirs without touching the UI.
---

# Customise the taxonomy for an organisation

Everything the site says about an organisation lives in `data/org/<profile>/` as YAML. The
build (`npm run data`) compiles it into the app; nothing is edited in the UI. Your job is to get
the adopter's own catalogue into that shape, mapped onto real CoSAI ids, and rendering.

Read `references/schema.md` first. It is short and it is the contract.

## Why the shape is what it is

- The organisation authors **its way round**: its id, its label, and the CoSAI controls,
  capabilities and risks each entry corresponds to. The build inverts that into the same
  framework-side cross-reference the OWASP and ATLAS lenses use, so every badge, coverage count
  and "what this does not reach" list works for the org catalogue without new code.
- `data/org/local/` is the adopter's directory. Upstream ships only `example/`, and `local/` is
  gitignored upstream, so pulling new upstream releases never conflicts. In a private clone the
  adopter runs `git add -f data/org/local` once; after that the files are tracked normally.
- An entry that maps to nothing is allowed. It shows on the Frameworks tab as "not mapped",
  which is a finding about the standard (often a process requirement with no technology behind
  it). Do not invent a mapping to make the gap disappear.

## Workflow

1. **Find out what they have.** Ask for the catalogue: a spreadsheet export, a wiki page, a
   PDF, or a pasted list. You need per entry: an id (their numbering, e.g. `AIS-3.2`), a label,
   optionally a description, a group/domain, an owner, and a deep link. Ask whether there is
   more than one catalogue (a control standard and a risk register are the common pair) — each
   becomes one item under `frameworks:`.
2. **Set up the profile.** If `data/org/local/` does not exist, copy `data/org/example/` to it.
   Set `organisation.name` and `shortName`. Keep the example's comments; delete its entries.
3. **Map each entry to CoSAI ids.** Run `node .claude/skills/org-taxonomy-customize/scripts/cosai-index.mjs`
   (optionally with a keyword: `... mcp`) to list controls, capabilities and risks with titles
   and one-line descriptions. For each org entry pick:
   - `controls`: the CoSAI control(s) the requirement satisfies (the "what");
   - `capabilities`: the technology class(es) that implement it (the "with what") — this is
     what puts the org id next to the numbered chips on the architecture drawings;
   - `risks`: only for a risk register, or where a requirement is explicitly about a threat.
   Prefer one or two precise targets over five loose ones; a mapping is a claim the org will be
   measured against. When unsure, ask the adopter — they know what the requirement means.
4. **Record tool status if they want it.** In `tooling-status.yaml`, one item per tool id from
   `data/tooling/` (run `node .claude/skills/org-taxonomy-customize/scripts/cosai-index.mjs tools`
   to list them), with `adoption` and a `controls` map keyed by capability id. Only capabilities
   pinned on the tool's architecture may carry a status — the script prints each tool's
   reference set. Statuses are `inPlace` (shown as Enabled), `partial` (In progress), `gap`,
   `needsAssessment` (Unassessed); omit a key for "not applicable".
5. **Build and fix.** `npm run data`. A dangling id fails with the file, framework and entry
   named; fix the id (never the CoSAI file). Then `npm run audit` refreshes `docs/AUDIT.md`.
6. **Show them where it landed.** `npm run dev`, then: `/frameworks?fw=<framework id>` (their
   catalogue with coverage and the unmapped list), `/controls?control=<id>` and
   `/capabilities?capability=<id>` (their ids as badges), `/reference?archetype=<id>` →
   Capabilities tab, expand a row (their ids under the chip), `/tooling` (status per tool).

## Judgement calls worth stating

- CoSAI ids are stable and vendored; never edit `data/cosai/`. If a requirement has no CoSAI
  home, leave it unmapped and say so in its `description`.
- Ids inside one framework must be unique; framework ids must not collide with CoSAI's or the
  authored ones (`owasp-*`, `mitre-atlas`, `stride`, `nist-ai-rmf`, `iso-22989`, `eu-ai-act`).
  Prefix with `org-`.
- Keep the example profile untouched so upstream diffs stay clean; all edits go in `local/`.
- The Capabilities tab's browser-side "Assess your posture" drawer records posture per
  **surface** and round-trips through `data/overlay/capabilities.yaml`. Tool status here is per
  **tool**. They answer different questions; do not derive one from the other.
