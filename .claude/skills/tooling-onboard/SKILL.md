---
name: tooling-onboard
description: Add, refresh or re-verify a named AI product (an agent, coding assistant, IDE extension, cloud agent, chat SaaS, browser or Office add-in, SDK or managed runtime) in this repository's AI tooling registry under data/tooling/, mapped to a reference architecture with per-control operator steps and vendor doc links. Use this whenever someone mentions adding a tool, vendor or product to the AI Tooling tab, updating a stale entry, "onboard <product>", "what controls does <product> support", "add Gemini CLI / Windsurf / Devin / Jules", "re-verify Claude Code", or asks how a vendor's admin settings map to the reference controls — even if they do not say "registry" or "data/tooling".
---

# Onboard a named product into the AI tooling registry

The registry (`data/tooling/<vendor>/<family>.yaml`) is the one place this repository names
products. Each entity is one product on one reference architecture, and the architecture fixes
the **reference control set**: the capabilities pinned on that drawing. The entry's job is to say,
for each of those, whether the vendor lets an administrator switch it on and exactly where.

Read `references/schema.md` first. Then run
`node .claude/skills/tooling-onboard/scripts/reference-set.mjs <architecture id>` to print the
pinned capabilities and risks you are allowed to write rows for (no argument lists the
architectures with their surface).

## Why the rules are strict

- **Dated and sourced.** Product configuration ages in weeks. Every entity carries `asOf`, every
  control row `verified`, and every step a URL you fetched today. `npm run audit` flags entries
  older than six months. A fact recalled from memory is a fact that will be wrong soon; fetch
  the page.
- **Only pinned capabilities.** A tool cannot claim, or disclaim, a control its drawing does not
  show. The build fails otherwise. If a real vendor control has no pin, the fix is a pin on the
  architecture (a separate change), not a row here.
- **Honest coverage.** `none` and `external` are findings leadership needs; `unknown` is the
  honest answer when a page would not resolve. Never upgrade a guess to `native`.

## Workflow

1. **Enumerate the surfaces** from the vendor's own docs index. Decide entity vs variant: one
   entity per product × architecture; UI shells (CLI, IDE extension, desktop app) are
   `variants`. A shell becomes its own entity when its architecture differs (a cloud-hosted
   variant) or its admin mechanism differs materially.
2. **Choose the architecture** by what runs where:
   - coding shell driven by a present developer, vendor-built → `archCodingAgentThirdParty`
     (open-source harnesses the developer runs with their own keys → `archCodingAgentFirstParty`)
   - vendor-hosted agent, CI reviewer, hosted sandbox → `archManagedAgentRuntime`
   - SDK / runtime the customer hosts → `archAgentWorkflow`
   - vendor chat, Office add-in, chat/connector integration → `archEnterpriseAiChat`
   - autonomous personal agent or browser agent acting with the user's sessions →
     `archPersonalAgent` (say in `summary` that it is a stretch when it is)
3. **Fetch the admin documentation**: managed-settings / policy files, MDM keys, admin console
   pages, org/enterprise policies, network/proxy pages, audit-log and data-retention pages, the
   security or trust page, and 2025–26 advisories. Keep a list of every URL and its HTTP status.
4. **Write the entity.** For every pinned capability, one `controls[]` row: `coverage`,
   `mechanism`, 1–4 `steps` (title, one-sentence body naming the exact key or toggle, url),
   `verified`. Then `summary` (what it is, where inference runs, what leaves the device),
   `facts` (Plans, Inference & routing, Data leaving the device, Retention/training, Docs index),
   `variants` with urls, `riskNotes` for the pinned risks this product changes the shape of,
   `advisories`, `sources`. Add the vendor to `vendors.yaml` if new.
5. **Validate.** `npx tsx scripts/build-data.ts` from the repo root; fix every error naming your
   file. Then `npm run audit` and read section 5b of `docs/AUDIT.md`: the "Unaddressed" column
   should be empty for your entity.
6. **Look at it.** `npm run dev`, open `/tooling?tool=<id>`, expand a few rows, then the
   architecture's Tools tab and the compare view. Deliberate exclusions go in the file header
   comment and under "Exclusions" in `data/tooling/README.md`.

## Refreshing an existing entity

Re-fetch every URL in the entity. Update facts that changed, bump `asOf` and each row's
`verified`, and record retired surfaces as exclusions rather than deleting history silently.
Keep the id — guidance documents and the organisation's `tooling-status.yaml` reference it.
