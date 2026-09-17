---
name: tooling-onboard
description: Add, refresh or re-verify a named AI product (an agent, coding assistant, IDE extension, cloud agent, chat SaaS, browser or Office add-in, SDK or managed runtime) in this repository's AI tooling registry under data/tooling/, mapped to a reference architecture with per-control operator steps and vendor doc links. Use this whenever someone mentions adding a tool, vendor or product to the registry or to a reference architecture's Tools tab, updating a stale entry, "onboard <product>", "what controls does <product> support", "add Gemini CLI / Windsurf / Devin / Jules", "re-verify Claude Code", or asks how a vendor's admin settings map to the reference controls — even if they do not say "registry" or "data/tooling".
---

# Onboard a named product into the AI tooling registry

The registry (`data/tooling/<vendor>/<family>.yaml`) is the one place this repository names
products. Each entity is one product on one reference architecture, and the architecture fixes
the **reference control set**: the capabilities pinned on that drawing. The entry's job is to say,
for each of those, whether the vendor lets an administrator switch it on and exactly where.

The registry renders in exactly one place: the **Tools** tab of the drawing the product
instantiates (a grid of that drawing's controls × its products, with the product's full record
beneath it). Nothing in the taxonomy links back to a product, so an entry earns its place by
being right about that drawing's controls, not by being cross-referenced elsewhere.

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
- **Honest coverage.** `none` and `external` are findings leadership needs; `notApplicable`
  is for a control the product has no surface for (not a gap — say whose objective it is);
  `unknown` is the honest answer when a page would not resolve. Never upgrade a guess to
  `native`.
- **One rule per capability, every vendor.** Before rating a row, read how the same capability
  is rated on the other products of that architecture and apply the same rule; write the rule
  into the `note` when it decides the word ("rated partial on the same rule as X because …").
  The 2026-09-15 control audit found the same mechanism rated differently across vendors.
- **A related setting is not the control.** Retention is not DSPM; a settings readback API is
  not SSPM; a server allowlist admits servers but does not verify what they serve; a file deny
  keeps a path out but inspects nothing; an SDK hook is an attach point until something is
  attached; a merge gate approves the output, not the actions that produced it; revoking
  future access does not stop a running process. Credit the contribution, name what is
  missing.
- **Every row states its boundary.** Controlled asset or action; enforcing actor (vendor
  server-side, product policy on the device, the deployer's code, a product around it);
  product variant or platform it holds on; bypass and uncovered paths (remote MCP servers,
  browser tools, unsandboxed commands, the host process); and, for a compound capability,
  which sub-objective is claimed (storage versus ephemeral issuance; versioning versus
  progressive rollout; encryption versus key custody; emission versus non-repudiation). For a
  kill switch, the cessation delay and whether active work stops. For human approval, whether
  a person, an AI reviewer or a merge gate decides, and at what point.

## Workflow

1. **Enumerate the surfaces** from the vendor's own docs index. Decide entity vs variant: one
   entity per product × architecture; UI shells (CLI, IDE extension, desktop app) are
   `variants`. A shell becomes its own entity when its architecture differs (a cloud-hosted
   variant) or its admin mechanism differs materially. A companion extension that only bridges
   the product into an IDE (no engine of its own) is a variant, or a `facts` line if it adds
   no admin surface.
2. **Choose the architecture** by what runs where:
   - coding shell driven by a present developer with a vendor control plane (managed settings,
     vendor identity, an admin console) → `archCodingAgentThirdParty`. Being open source does
     not change that: Codex CLI and Gemini CLI are third-party here. `archCodingAgentFirstParty`
     is only for harnesses with no vendor control plane at all — the developer supplies the
     model key and nothing an administrator can switch on ships with the tool.
   - the vendor's coding or desktop agent run on the vendor's compute — cloud sessions started
     from the local harness, the vendor's web, mobile or chat surfaces, a repository event or a
     schedule, CI reviewers and PR bots, finishing in a branch and a draft pull request →
     `archHostedAgentSessions` (Claude Code on the web, Cowork in the cloud, Cursor Cloud
     Agents, Codex cloud, Copilot cloud agent)
   - a programmatic managed runtime driven from the customer's own application over an API or
     SDK — agent, environment, session, vault objects; custom tools executed by customer code →
     `archManagedAgentRuntime` (Claude Managed Agents, the OpenAI Agents API, AgentCore harness)
   - SDK / runtime the customer hosts → `archAgentWorkflow`
   - vendor chat, Office add-in, chat/connector integration → `archEnterpriseAiChat`
   - browser extension or agentic browser acting in the user's logged-in sessions →
     `archAgenticBrowser`
   - autonomous personal agent the user self-hosts and reaches over a chat channel (the
     OpenClaw class) → `archPersonalAgent`

   Placements already settled, so do not relitigate them: Claude Code and Claude Cowork are
   third-party coding & desktop agents; Claude in Chrome is browser AI; OpenClaw and Hermes are
   personal agents.

   **On a personal agent the admin is the user.** Nobody pushes policy to it, so `native` means
   the person running it can set it in the product's own config (a settings key, a policy file,
   a CLI flag) and `external` means the docs tell them to rely on the OS sandbox, a firewall or
   a password manager instead. Write the steps in those terms.
3. **Fetch the admin documentation**: managed-settings / policy files, MDM keys, admin console
   pages, org/enterprise policies, network/proxy pages, audit-log and data-retention pages, the
   security or trust page, and 2025–26 advisories. Keep a list of every URL that redirected or
   failed; it goes in the file's header comment as a short fetch log, so the next re-verification
   knows which pages moved. When two vendor pages disagree (a default stated both ways), record
   both in the row's `note`, prefer the settings reference, and tell the operator to set the key
   explicitly. A vendor without a product trust portal gets its corporate compliance page as
   `trust`. The rules in **Verifying a link** below apply to every URL you are about to write.
4. **Write the entity.** For every pinned capability, one `controls[]` row: `coverage`,
   `mechanism`, `verified`, and for `native`/`partial` rows 1–4 `steps` (title, one-sentence
   body naming the exact key or toggle, url). Rows rated `none`, `external`, `notApplicable`
   or `unknown` carry a `note` saying what the organisation should do instead and an
   `evidence` entry (title, url) naming the page the claim was checked against — usually the
   vendor's docs index plus any page the note cites; the build fails on a row with neither a
   step url nor evidence. Then `summary`
   (what it is, where inference runs, what leaves the device), `facts` with the canonical labels
   from `references/schema.md`, `variants` with urls, `riskNotes` for the pinned risks this
   product changes the shape of, `advisories`, `sources`. Add the vendor to `vendors.yaml` if new.
5. **Seed the organisation's justification text.** The Tools grid shows, on hover over each
   cell, the organisation's `note` for that control from `data/org/<profile>/tooling-status.yaml`
   (`example/` upstream, `local/` in an adopter's clone). That file is the template an
   organisation edits, so a product is not finished until it has a block there: `available`,
   and under `controls` one row per pinned capability with a `status` and a `note` written as
   the justification an administrator would give — the setting or change that backs the status
   (`permissions.deny and allowManagedPermissionRulesOnly in managed-settings.json`), or for a
   `gap` why it is not in place (`sandbox.enabled pending bubblewrap packaging`; `Vendor offers
   nothing; kept in the governance register`). Derive each note from the row's `mechanism` so it
   names the real key or console path. Rows rated `none` still get a note saying what stands in.
   Upstream, the example organisation runs a handful of products; set `available: true` only if
   it plausibly would, otherwise `false` — the notes are still the adopter's starting text.
6. **Validate.** `npx tsx scripts/build-data.ts` from the repo root (`npm run data` runs the same
   script); fix every error naming your file. Then `npm run audit` and read section 5b of
   `docs/AUDIT.md`: the "Unaddressed" column should be empty for your entity.
7. **Look at it.** `npm run dev`, open `/reference?archetype=<arch>&tool=<id>`: the drawing's
   Tools tab with your product as a column and its record open beneath the grid. Check that the
   coverage word in each cell links to the page an administrator would actually use, expand a
   few rows for the steps, and switch **Show status** on and hover a few cells: every one should
   show the note you seeded, none should say "nothing recorded yet". Without a browser, confirm the compiled entry instead:
   `node -e 'const d=require("./src/data/generated/dataset.json");console.log(d.tools.find(t=>t.id==="<id>"))'`.
   Deliberate exclusions go in the file header comment and under "Exclusions" in
   `data/tooling/README.md`.

## Verifying a link

A registry entry is only as good as its URLs, and a whole-registry pass on 2026-09-10 found
about ninety wrong ones (`docs/VALIDATION-2026-09-10-TOOLING.md`). What it learned:

- **A 200 is not a good link.** docs.github.com and several vendors silently redirect renamed
  pages, so a stale URL still resolves. Follow redirects and write the URL you land on:
  `curl -sIL -o /dev/null -w '%{http_code} %{url_effective}\n' <url>`.
- **The step's URL must document the setting**, not the concept. If the page does not contain
  the key, file path or console path your step names, find the settings reference or admin
  how-to that does. The first step's URL is what the grid's coverage word links to, so it is the
  page an administrator lands on.
- **Anti-bot walls are not broken links.** help.openai.com, the vendor trust portals and some
  support sites refuse automated fetches; leave the URL and say in the report that the claim
  behind it is unverified. Do not silently keep a claim a page never made — soften it instead.
- **Advisories belong to the vendor that assigned them.** One writeup covering four products
  usually carries one vendor's CVE; the others have the same class of bug and no id. Say so in
  the title rather than implying every vendor has that CVE.
- To sweep the whole registry, run `npm run links` (`scripts/check-links.ts`): it fetches every
  URL under `data/tooling/` and in `data/overlay/capabilities.yaml` once and reports non-200s,
  hosts known to wall or client-render (listed in the script — atlas.mitre.org answers 404 for
  every route and renders client-side, so its deep links are fine), and redirects whose path
  changed. A 200 is reachability, not relevance: the page must still document the claim.

## Refreshing an existing entity

Re-fetch every URL in the entity under the rules above. Update facts that changed, bump `asOf`
and each row's `verified`, and record retired surfaces as exclusions rather than deleting history
silently. If a mechanism changed, reread the organisation's `note` for that control in
`tooling-status.yaml` — it names the old key. Keep the id — guidance documents and the organisation's `tooling-status.yaml` reference
it, and that file says `available: true|false` per product plus a status per control, so a renamed
id silently drops an organisation's posture.
