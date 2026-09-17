# Hosted agent sessions: market survey and catalogue recommendation — 2026-09-17

> **Status: proposal. No drawing, guidance, tooling or vocabulary file has been changed.**
> Research was done against vendor documentation on 2026-09-17; every claim below carries a
> source, and the items nobody could confirm are listed in §8 so they are not enforced by
> accident.

## 1. Recommendation

**Add one new reference architecture — *Vendor-hosted coding & desktop agent sessions* — and
narrow the existing *API/SDK managed agent runtime* to the programmatic runtimes it was drawn
for.** Do not widen either existing drawing to absorb the other case.

The single-architecture-with-two-surfaces framing leadership is asking for is correct, and the
survey confirms it is how every vendor has built the product: one hosted harness in the
vendor's cloud, reachable from (a) the developer's local harness by hand-off, (b) the vendor's
web, mobile and chat surfaces, (c) source-control events and schedules, and (d) an API. Those
are concurrent ingress paths to one session runtime, not variants, so they belong on one
drawing. What they do **not** share with the API/SDK runtime is the customer-owned application
front end, the engineer-authored agent definition, and the tool-handler return path that the
API/SDK drawing is built around. That difference is graph-level (blocks appear and disappear,
not just notes), which under `data/ONTOLOGY.md` §2 rule 6 makes it a second architecture rather
than a conditional edge.

Why this matters for the hardening work: today the five hosted coding products in the registry
(Claude Code on the web, Cursor Cloud Agents, Copilot cloud agent, Codex cloud, Grok Bot) are
assessed against a drawing whose entry path they do not have, so their control rows cannot say
anything about the paths that actually carry their risk — the issue/PR-comment ingress, the
scoped git proxy, the draft-PR merge gate, the "approve and run workflows" gate, the setup
phase that has network before the agent does, and the chat-channel admission decision. Every
2026 incident in the hosted-loop class (§7) landed on exactly those paths.

## 2. What the market looks like (September 2026)

### 2.1 Hosted modes of the endpoint coding and desktop agents

| Product | Launch surfaces for a hosted run | Where the loop runs | Egress default | Repo credential | Acts as | Org off-switch |
| --- | --- | --- | --- | --- | --- | --- |
| Claude Code cloud sessions | claude.ai/code, mobile, Desktop (Cloud), `claude --cloud`, routines (cron / API / GitHub events), Claude Tag in Slack, Copilot Agent HQ | Anthropic VM; or self-hosted runners (Team/Enterprise beta) with control plane and inference still at Anthropic | Allowlist ("Trusted") per environment; None / Full / Custom; GitHub proxy, MCP connectors and the Anthropic API bypass it | GitHub App or uploaded `gh` token; git proxy keeps the credential outside the VM | The user (commits, PRs, auto-fix replies); Claude Tag runs as the org's shared identity | `allow_remote_sessions`, Routines, Remote Control + trusted devices, self-hosted toggle; ZDR orgs cannot use any of it |
| Claude Cowork cloud | Web, mobile, Desktop (Cloud), scheduled tasks, Dispatch | Anthropic sandbox; local sessions run the loop on the device inside a Linux VM | Org network-access policy ("no access" default on Enterprise); mandatory proxy | Connector tokens stay server-side | The user's connectors | Org Cowork toggle; "Run Cowork in the cloud" (Enterprise: role-gated) |
| Cursor Cloud Agents | Desktop dropdown, CLI `&` prefix, web, iOS/PWA, Slack, GitHub/Bitbucket, Linear, Teams, Cloud Agents API, Automations | Firecracker microVM in a dedicated AWS account; Self-Hosted Machines / Team Pools move execution only | **Allow all** by default; Default + allowlist / Allowlist only; Enterprise can lock | Cursor GitHub App; "only repositories the triggering user could already reach"; Protected Git Scopes | HSM-signed bot commits, draft PRs; team automations run as `cursor`; private ones as the user | "Don't enable Cloud Agents"; MCP allowlist; audit streaming |
| Codex cloud | chatgpt.com/codex, `codex cloud exec`, IDE "Delegate", Codex app, `@codex` on GitHub, Slack, Linear, schedules, SDK | OpenAI containers only; two-phase runtime | **Off** in the agent phase; None / Common dependencies / All plus GET-only method restriction | ChatGPT Codex Connector App respecting repo permissions and branch protection (short-lived installation tokens: search snippet only); secrets removed before the agent phase | `chatgpt-codex-connector[bot]`, or the connected GitHub account | Workspace permissions; per-environment internet; `requirements.toml` governs **local clients only** |
| Copilot cloud agent | github.com agents panel, issue assignment, `@copilot`, VS Code session target Cloud (Copilot / Claude / Codex), CLI `/delegate`, mobile, Slack/Teams/Linear/Jira | Ephemeral GitHub Actions job, 59 min; hosted, larger or self-hosted runners | Firewall **on** with recommended allowlist; org-level settings since 2026-04-03; MCP servers and setup steps are not firewalled | Actions token limited to one `copilot/` branch; cannot push default branch or merge | Copilot bot author, user co-author, signed | Enterprise policy (off → selected orgs); third-party agent toggles; `actor:Copilot` audit events |
| Google Jules | jules.google, Jules CLI, Gemini CLI `/jules`, `@jules`, Actions, API, schedules | Google VM per task | Internet on; no allowlist documented | Google Labs Jules App | Jules bot / co-author / user modes | None documented |
| Devin | Web, Desktop, CLI `/handoff`, Slack, Teams, Jira, Linear, API | Cognition cloud; Devbox in customer VPC; Outposts on customer machines (loop stays in Devin cloud) | Security-profile allowlist, enterprise-mandatory | Devin GitHub App | Devin App; API on-behalf-of users | RBAC, mandatory profiles |
| Amp, Factory Droid, JetBrains Air | Web, CLI, Slack (Amp); CLI, Slack/Linear/Jira (Factory); Air desktop, browser, IntelliJ (JetBrains) | Vendor VMs ("Orbs", "Droid Computers", JetBrains containers) | Not documented (Amp, JetBrains); managed sandbox policy (Factory) | Vendor App | Factory: service account for channels, personal identity for DMs | Amp: admin can disable orbs; Factory: org-authoritative settings |

Cross-cutting facts that decide the drawing:

- **Every product is one hosted runtime with several doors.** The local harness hands off
  (Claude Desktop "Continue in the cloud", Cursor `&`, Codex IDE delegate, Copilot `/delegate`,
  Devin `/handoff`, Gemini CLI `/jules`); the web/mobile app and chat channels start the same
  session; source-control events and schedules start it unattended; an API starts it from code.
  Claude Code can also teleport a cloud session back to the terminal.
- **The hosted loop's inference never crosses a customer gateway.** Claude Code forbids
  Bedrock/Vertex/Foundry/LLM-gateway routing for cloud sessions, including self-hosted runners;
  Cursor, Codex and Copilot document no BYOK for the hosted agent; Factory and Devin restrict
  BYOK to local. This is the same conclusion the API/SDK drawing already records.
- **"Bring your own compute" exists everywhere, and in every case except Copilot self-hosted
  runners the control plane and inference stay with the vendor.** Claude Code self-hosted
  environments, Claude Managed Agents self-hosted sandboxes, Cursor Team Pools, Devin Outposts,
  OpenAI Agents API self-hosted executor: all outbound-only workers we
  run, all with tool inputs and outputs still crossing the vendor.
- **The repository token stays outside the sandbox in the better products.** Claude Code's git
  proxy substitutes a scoped credential; Codex strips secrets before the agent phase; Copilot's
  token can reach one branch; Cursor's runtime secrets are redacted from transcripts and commits.
  Jules documents nothing.
- **Egress defaults diverge**: Codex and Copilot deny or allowlist by default; Claude Code
  allowlists ("Trusted"); Cursor, Jules and the Anthropic Managed Agents API default are
  allow-all. In every product some traffic bypasses the environment allowlist (MCP connectors,
  the vendor's own web tools, the git proxy, the inference API).
- **Identity is three different things**: the user (Claude Code, Cursor private automations), a
  bot or App with co-author attribution (Copilot, Codex connector, Jules), or an explicit
  service identity for shared channels (Claude Tag, Cursor team automations, Factory channel
  delegations).

### 2.2 Provider-hosted managed agent runtimes (API/SDK)

| Runtime | Who runs the loop | Sandbox | Egress default | Credentials | Per-agent identity | Policy on tool calls | Model path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Claude Managed Agents (beta since 2026-04-08) | Anthropic | Ubuntu container per session, 8 GB / 10 GB, checkpointed 30 days; self-hosted sandbox option | `unrestricted` from the API; `limited` deny-by-default with `allowed_hosts`; web tools bypass it | Vaults substituted at an egress proxy: MCP OAuth, static bearer, env-var; git proxy | None; caller is API key, service account or WIF | `always_allow` / `always_ask` / server-evaluated `auto` (2026-09-10); dollar budgets | Anthropic only; Claude Platform on AWS |
| OpenAI Agents API (**public beta 2026-09-10**); ChatGPT Workspace Agents (GA 2026-05-22, trigger API) and ChatGPT Work cloud (2026-07-09) reuse the same Codex harness | OpenAI (Codex harness, subagents) | Hosted Linux, deleted after 1 h idle; self-hosted executor option | `enabled` by default; `restricted` = up to 100 exact hosts | Vaults for MCP credentials (secrets never returned to the agent); env vars injected into the sandbox; executor key can only connect environments | None in the API; service accounts and workload identity federation on the Codex/ChatGPT side | Function-tool pause (`requires_action`); MCP `require_approval` documented for Responses, not confirmed for the Agents API | OpenAI only; US-only, no ZDR |
| Google Managed Agents API (preview 2026-05-19) | Google (Antigravity harness) | Managed container, 7-day TTL | **Deny-by-default** on the Cloud surface; allow-all on the Gemini API surface | Downscoped GCS tokens; header transforms inject credentials at the egress proxy | Agent Identity (SPIFFE) on Agent Runtime, not documented here | `.agents/hooks.json` pre/post tool hooks; Model Armor on Agent Gateway | Gemini only |
| AWS AgentCore harness (GA 2026-06-17; Bedrock Agents Classic closed 2026-07-30) | AWS (Strands loop) or customer code on Runtime | Firecracker microVM per session, 8 h (14 days on Instances) | PUBLIC mode: no native allowlist; VPC mode: no internet by default | AgentCore Identity token vault, OAuth 2LO/3LO, OBO, Secrets Manager refs | Workload identity per agent | **Cedar / Dogwood policy at the Gateway**, argument-level, default-deny | Any |
| Microsoft Foundry hosted agents (GA ~2026-07-09) | Microsoft (prompt agents) or customer container | Per-session micro VM, `$HOME` persisted, 30-day idle delete | BYO VNet; FQDN egress rules in preview (fail-closed, TLS-inspecting proxy) | Project connections, Key Vault, OAuth passthrough | Entra Agent ID per agent, auto-created | MCP `require_approval`, Toolbox guardrails, Entra Conditional Access | Foundry catalogue incl. Claude |
| Vercel eve (beta 2026-06-17) | Customer code; Vercel runs durability, sandbox, channels, schedules | Firecracker; snapshots | `allow-all` default; `deny-all`; SNI/CIDR allowlists updatable live | Credentials brokered at the sandbox firewall; Vercel Connect OAuth | None | In-framework approvals | Any via AI Gateway (BYOK) |

Convergent shape, confirmed across all six: **versioned definition → durable session →
per-session microVM or container → credential broker outside the sandbox → outbound network
policy**, with a tool gateway as the enforcement point where one exists. Divergences worth an
exemplar note: only AWS, Google and Microsoft mint a per-agent principal; only AWS and Google
have a deterministic policy engine on tool calls; OpenAI is the compliance outlier (US-only,
no ZDR, 1-hour sandbox). The same sandbox providers (Modal, E2B, Daytona, Cloudflare, Vercel,
Runloop) sit under Anthropic's, OpenAI's and eve's self-hosted execution options.

## 3. How the catalogue treats this today

| Where | What it says | Why it is not enough |
| --- | --- | --- |
| `data/reference/architectures/saas-managed-agent-runtime.yaml` | Entry is a customer-owned **Application front end** with identity binding and tool handlers; the definition is authored by an engineer and deployed; the return path is the session stream or a tunnel to our gateway. | Five hosted coding products are mapped here and have none of those blocks. Their entry is the vendor's UI, CLI, chat channel or a repository event; their "definition" is repository content plus an admin-owned environment; their output is a branch and a draft PR. The 2026-09-01 review's MR-01 verdict already said the drawing must "state which exemplar class it models" because "the hosted-background-coding-agent exemplar genuinely is vendor-direct". It was never resolved. |
| `data/reference/architectures/endpoint-coding-agent-third-party.yaml` | Hosted sessions exist as the *Remote & scheduled sessions* item on **Vendor service** and as a note on *Chat channels* ("raises a session on the vendor's cloud"). | The hosted harness, its sandbox, its git proxy and its egress policy are not drawn. A reader cannot see that a hand-off moves the repository and the conversation into an environment with different custody, or that the merge gate is the human's only remaining approval point. |
| `data/tooling/*` | `toolClaudeCodeWeb`, `toolCursorCloudAgents`, `toolCopilotCloudAgent`, `toolCodexCloud`, `toolGrokBot` → `archManagedAgentRuntime`; Cowork's cloud variant is a note on the desktop entity. | Control rows can only be written for pins the drawing carries (README build rule). The 2026-09-15 audit F06 found exactly this and five pins were added to the managed runtime as a patch; the ingress, repo-write and merge-gate controls still have no locus. |
| `data/tooling/openai/codex.yaml` header and `data/tooling/README.md` exclusions | "OpenAI Managed Agents — nothing has shipped." | The **OpenAI Agents API** entered public beta on 2026-09-10 (a hosted Codex harness with sessions, hosted or self-hosted sandboxes, network `restricted` mode). It belongs on the API/SDK drawing as a new entity. |
| `data/incidents/04-coding-agent-hijack.yaml` | Joined to `archCodingAgentThirdParty`. | Its events are mostly hosted-loop attacks (comment-triggered CI agents, `claude-code-action`, Clinejection) and `archetype:` is singular. |

## 4. Options considered

| Option | Verdict | Deciding rule |
| --- | --- | --- |
| **A. New drawing, hosted sessions; API/SDK runtime narrowed** | **Recommended.** | Rule 6 (either/or edges banned): the customer front end vs the vendor front door is a variant needing conditional edges. Rule 9 lets the two drawings share the Managed runtime + Native tools block byte-for-byte, so the reader sees only the doors and the return paths differ. |
| B. Widen the API/SDK runtime to carry both entry paths | Rejected. | The 2026-09-01 review required the front end be drawn as *the* entry (MR-01). Adding a second, mutually exclusive entry re-creates the either/or the review removed. |
| C. Draw the hosted session on the endpoint coding-agent drawing | Rejected. | Two harnesses with opposite custody (machine holds SSH keys and browser sessions vs vendor microVM with scoped proxied credentials) on one drawing is the vendored/OSS mistake the first/third-party split fixed. |
| D. Also split the self-hosted execution worker into its own drawing | Not now. | Same reasoning as MR-03: the edges are the same, only which band executes the tools changes. Record it as a deviation plus a scenario step; revisit if an adopter actually deploys it. |

## 5. Proposed drawing

- `id: archHostedAgentSessions` · `surface: surfaceSaas` · `rank: 3` (API/SDK runtime moves to
  rank 4) · file `data/reference/architectures/saas-hosted-agent-sessions.yaml` · guidance
  `mode: use`.
- `title: Vendor-hosted coding & desktop agent sessions` · `abbrev: Hosted agent sessions`.

### 5.1 Zones and blocks (registered names unless marked NEW)

| Zone | Block | Items | Note to carry |
| --- | --- | --- | --- |
| user | **Developer** (actor) | — | Present at launch, absent during the run; the merge gate is where they return. |
| user | **Remote device** | Phone & web apps; Chat channels | Admission is the vendor account binding (web/mobile) or whoever the channel admits (chat). |
| endpoint | **Agent harness** | Agent loop | The hand-off origin only: pushes the branch and a conversation summary up, pulls the cloud branch back on teleport. *Deviation:* drawn without Native tools and Memory because nothing local executes on this drawing's path. |
| vendor | **Vendor service** | Managed settings; Session audit export; Remote & scheduled sessions | The control plane: server-managed settings and shared environments (the only settings that reach a hosted session; MDM does not), the org toggles, the relay behind mobile and chat, and the scheduler behind routines and automations. |
| vendor | **Managed runtime** | Agent harness; Model inference; Credential vault; MCP client | Byte-identical to the API/SDK drawing. Vault = the git proxy and runtime secrets; MCP client = hosted connectors that bypass the environment allowlist. |
| vendor | **Native tools** (parent: Managed runtime) | File & edit tools; Shell commands; Installed skills; Computer use | The sandbox: per-session microVM or container, reclaimed on idle; egress policy is the environment's. Two phases where the product has them — setup with network, agent without. |
| cloud | **Source control** (NEW) | Repositories & instruction files; Issues & PR threads; Pull requests & CI | The one tier that is ingress (events and comments as prompt input), egress (branch push, draft PR), definition (`CLAUDE.md` / `AGENTS.md`, setup scripts, environment config) and gate (review, merge, "approve and run workflows"). *Deviation:* drawn in our band because the policy that matters — App installation scope, branch protection, CODEOWNERS on agent config files — is ours whether we host it or rent it. |
| cloud | **Tunnel connector** · **AI gateway** (MCP & API gateway; no Model proxy) · **Tool services** (Remote MCP servers; APIs & connectors) · **Enterprise data** (Org data) | as in the API/SDK drawing | The path back into our systems, unchanged. |
| external | **Tool services** · **Downstream services** (Web & APIs) · **Public package sources** (Package registries; Skill & extension hubs) | — | Registries are the setup-phase dependency and the exfil channel every allowlist permits. |
| governance | the five standard call-outs | — | — |

Vocabulary registration needed: `Source control` (kind: service, `cosaiComponent:
componentDataSources`) with the three items above. Reason to record: three drawings' worth of
prose about issues, PR comments and instruction files as injection ingress has had no block to
pin on; the joined incident cannot be walked without it. Alternative if the registry should
not grow: extend **Enterprise data** with *Issues & PR threads* and *Pull requests & CI* items.
The dedicated block is more honest because the merge gate and the CI approval are enforced
there and nowhere else.

### 5.2 Edges (one walk, in this order)

1. `developer → harness` local session · 2. `harness ⇄ managedRuntime` **hand-off / teleport**
(branch + conversation up; cloud branch back) · 3. `developer → remoteDevice` away from the
machine · 4. `remoteDevice ⇄ vendorService` start & steer (web, mobile, @-mention) · 5.
`sourceControl → managedRuntime` issue, comment & CI events (unattended trigger) · 6.
`vendorService → managedRuntime` managed settings, environment & schedules · 7.
`managedRuntime ⇄ sourceControl` clone & push via scoped git proxy → draft PR · 8.
`sourceControl ⇄ developer` review, "approve and run workflows", merge · 9.
`nativeTools → sources` setup phase & package install · 10. `nativeTools → downstream` web
fetch under egress policy · 11. `managedRuntime → extTools` hosted MCP & connectors ·
12. `managedRuntime → tunnel → aiGateway → internalTools → orgData` brokered calls back into us.

Scenario steps to add after the walk: *auto-fix loop* (CI failure or review comment re-triggers
the session; any commenter is now a prompt author), *self-hosted execution* (steps 9–10 execute
on a worker we run; steps 2, 6, 7, 11 unchanged).

### 5.3 Pins

Risks: `riskPromptInjection` at 5, 10 and 11 · `riskSensitiveDataDisclosure` at 9 (exfil via
allowlisted write-capable hosts: github.com, registries) and at Managed runtime (transcripts,
session sharing, 90-day snapshots) · `riskRogueActions` at 7 (auto-fix replies firing
comment-triggered automation; automations approving PRs) · `riskToolSourceProvenance` at 9 and
11 · `riskShadowAndUnknownAgents` at 4 (channel admission; automations owned by people who left)
· `riskStaleAgentIdentityBinding` at Managed runtime (App installation tokens, `cursor`
service identity, user-bound sessions after the user leaves) · `riskCrossTenantCredentialPropagation`
at Tunnel connector.

Controls: keep the API/SDK drawing's set on Managed runtime and Native tools (sandboxing,
egress, runtime enforcement, credential isolation, MCP tool security, TPRM, vendor assurance,
key management, NHI) so the five moved entities keep their rows, and add: `capabilityToolPermissionScoping`
at 7 (single branch, no default-branch push, no merge, Protected Git Scopes, repo blocklist) ·
`capabilityHitlControls` at Source control (draft PR review, initiator cannot count as approver,
"approve and run workflows"; the note must say the gate approves the output, not the actions
taken to produce it, per audit F04) · `capabilityIga` at 4 (write-access-only triggers, trusted
devices, role-gated cloud enablement) · `capabilitySecretsManagement` at Vendor service
(environment secrets vs visible env vars) and Tunnel connector · `capabilityPromptInjectionDefense`
at 5 (hidden-character filtering, CODEOWNERS on `.claude/`, `.cursor/`, `.github/workflows/`,
hooks and MCP config) and at AI gateway · `capabilityAgentRegistry` on Supply-chain assurance
(routines, automations, scheduled tasks inventoried like agents) · `capabilityAuditLogging`,
`capabilityAgentObservability`, `capabilityKillSwitch` on Observability & response (kill-switch
note states the delay: revoking the App or seat does not stop a running session).

### 5.4 Deviations to record

Partial local harness (§5.1) · Source control in our band (§5.1) · two vendor blocks for one
vendor (control plane vs runtime, because a session is admitted by one and executed by the
other) · self-hosted execution as a scenario, not a drawing · band order if vendor is drawn
before cloud.

### 5.5 Exemplars (dated, sourced)

Claude Code on the web and Cowork cloud (Anthropic), Cursor Cloud Agents, Codex cloud, Copilot
cloud agent with Agent HQ third-party agents; noted as candidates outside the registry's vendor
scope: Jules, Devin, Amp, Factory Droid Computers, JetBrains Air.

## 6. Changes to existing files (for the implementation pass)

1. **`saas-managed-agent-runtime.yaml`**: keep as the API/SDK runtime. Add `distinguishedBy`
   against the new sibling; drop the "hosted background coding agents" phrase from the
   catalogue entry; refresh exemplars — AgentCore harness (GA 2026-06-17), Google Managed
   Agents API (preview), OpenAI Agents API (beta 2026-09-10), Foundry hosted agents (GA
   2026-07), Bedrock Managed Agents powered by OpenAI (limited preview 2026-04-28).
2. **`endpoint-coding-agent-third-party.yaml`**: point the *Remote & scheduled sessions* item
   note and the *Chat channels* note at the new drawing; add a `distinguishedBy` entry ("against
   the hosted sessions: same engine, vendor custody, human absent, merge gate is the approval").
   No graph change.
3. **Tooling registry**: move the five hosted entities to `archHostedAgentSessions`; add
   `toolClaudeCoworkCloud` (README rule: a cloud-hosted variant with a different runtime is its
   own entity); add `toolOpenaiAgentsApi` under `archManagedAgentRuntime` and delete the
   "nothing has shipped" exclusion; re-verify each moved entity's `controls[]` against the new
   pin set (rows for pins the new drawing lacks fail the build).
4. **Guidance** `data/reference/guidance/saas-hosted-agent-sessions.yaml`: items from §7.
5. **Incidents**: add a hosted-loop incident (RoguePilot, Comment and Control, `claude-code-action`
   bypass and unsandboxed Read, Clinejection, Codex branch-name injection) joined to the new
   drawing; leave `04-coding-agent-hijack` on the endpoint drawing for TrapDoor and CHAINDROP.
6. **Docs and skills**: `docs/full-ref-arch-catalog.md` (SaaS becomes 4), the review guide's
   counts, `tooling-onboard` step 3 mapping rule ("hosted coding sessions → hosted agent
   sessions; programmatic runtimes → API/SDK runtime"), `npm run audit` regenerate.
7. **`data/reference/vocabulary.yaml`**: register `Source control`.

## 7. What the drawing must say about hardening

Controls every vendor's own documentation converges on for a hosted loop, in the order the walk
meets them:

1. Trigger authorisation is a verified human with write access; Apps and bots cannot start a
   session (Copilot; the `claude-code-action` fix).
2. Cloud mode is an org decision: an off-switch, role-gated enablement, admin-owned shared
   environments, a locked network policy, MCP allowlist deny-by-default.
3. Per-session isolated VM or container, destroyed or reclaimed at the end; snapshots have a
   retention you chose.
4. Egress allowlist, admin-lockable, with the setup phase separated from the agent phase; treat
   allowlisted write-capable hosts (github.com, registries, `*.github.io`) as exfil channels and
   restrict methods, not just hosts (Codex GET-only; s1ngularity; Clinejection).
5. Repository credential never inside the sandbox: a proxy swaps a scoped placeholder; App
   installation tokens are short-lived and single-repo.
6. Secrets injected and redacted, never visible env vars; Team/Enterprise gaps named per product
   (Claude Code API credentials are Pro/Max only; Cursor runtime secrets readable via terminal).
7. The agent pushes to its own branch only; cannot push default, mark ready, approve or merge.
8. No self-approval: initiator and agent approvals do not count; watch Copilot code review's
   opt-in PR approval (2026-09-01) when combined with the cloud agent.
9. CI from agent PRs waits for "approve and run workflows"; agent replies must not fire
   comment-triggered automation (Atlantis, Terraform Cloud).
10. Agent config files under CODEOWNERS and required review — the "trust hand-off" escape class
    (hooks, tasks, venv, git config written now, executed later by an unsandboxed tool).
11. Signed, attributed commits with a link from every commit to the session log.
12. Audit export to our SIEM for runs, tool calls and blocked egress; confirm coverage per
    product (Claude Code cloud sessions are not listed in the Compliance API — unconfirmed
    either way).
13. Kill switch with a stated delay: revoking the App, seat or token does not stop a running
    session.
14. Rule of Two: never one loop with untrusted input, secret access and external side effects
    together (Microsoft's post-mortem of `claude-code-action`).

Risks that differ from the local loop, for the description and the risk notes: the loop is
unattended so injection runs to completion; the vendor holds the repo token and revocation is a
vendor action; egress policy is the vendor's, and corporate proxy, DLP and IP allowlists never
see the traffic (Anthropic-hosted sessions break org IP allowlisting); identity is a bot or a
shared org identity; insecure defaults vary by vendor; the sandbox is multi-tenant vendor
infrastructure whose isolation is asserted not inspectable; transcripts and snapshots persist
and can be shared; auto-fix and event loops make every commenter a prompt author; setup scripts
and caches run with network before the agent does; machine-speed lateral movement (the
Hugging Face intrusion: ~17,600 actions in 4.5 days).

## 8. Verify before enforcing

- Codex cloud: whether the internet-access setting is admin-lockable; explicit self-approval
  rules.
- Jules: any egress, secrets, admin, audit or PR restrictions (nothing documented).
- Claude Code cloud sessions in the Compliance API (secondary sources say excluded).
- Cursor BYOK or gateway routing for Cloud Agents (documented for the IDE only).
- Copilot: whether partner Claude/Codex agents execute on Actions or vendor infrastructure; a
  public "create session" API.
- Anthropic Managed Agents isolation technology (gVisor claim is third-party); no OTel export.
- OpenAI Agents API: MCP approval gate, trace retention, EU residency, sandbox isolation
  technology; the launch date and the DevDay "Managed Agents" sighting are third-party.
- Foundry hosted-agent egress default without VNet injection; Claude as a prompt-agent model.
- AWS AgentCore FedRAMP High for AgentCore specifically; native allowlist in PUBLIC mode (none
  found).
- Antigravity enterprise: whether scheduled tasks run on Google compute or the local machine.

## 9. Sources

Endpoint hosted modes: code.claude.com/docs/en/claude-code-on-the-web, /cloud-environments,
/self-hosted-environments, /remote-control, /routines, /desktop, /server-managed-settings;
support.claude.com Cowork architecture overview (14479288) and Team/Enterprise admin (13455879);
cursor.com/docs/cloud-agent (+ /security, /security-network, /self-hosted, /automations,
/api/endpoints); learn.chatgpt.com/docs/cloud, /cloud/internet-access,
/environments/cloud-environment, /enterprise/managed-configuration, /third-party/github;
docs.github.com copilot cloud-agent (about, firewall, risks-and-mitigations, enable-in-enterprise,
agentic-audit-log-events, about-third-party-coding-agents), github.blog 2026-04-03 org firewall
settings and 2026-09-01 code review approvals; jules.google/docs, developers.google.com/jules/api;
docs.devin.ai enterprise/deployment, security-profiles; ampcode.com/news/agents-anywhere;
docs.factory.ai; jetbrains.com/help/air/cloud-agents.

Managed runtimes: platform.claude.com/docs/en/managed-agents (overview, environments,
cloud-sandboxes-reference, self-hosted-sandboxes-security, vaults, permission-policies,
budgets, webhooks, scheduled-deployments); developers.openai.com/api/docs/guides/agents-api
(overview, environments/openai-hosted, environments/self-hosted, observability), openai.com
Agents API introduction; docs.cloud.google.com/gemini-enterprise-agent-platform (overview,
build/managed-agents, sandbox-environment, scale/runtime, govern/gateways, agent-identity),
ai.google.dev/gemini-api/docs (custom-agents, agent-environment, agent-hooks, triggers);
docs.aws.amazon.com/bedrock-agentcore (harness, runtime-how-it-works, runtime-security-best-practices,
agentcore-vpc, identity, policy, release-notes), aws.amazon.com What's New 2026-04-28 and
2026-08-06; learn.microsoft.com/azure/foundry/agents (hosted-agents, agents-networking-deep-dive,
add-hosted-agent-guardrails, agent-identity, mcp-authentication), microsoft-agent-365/overview,
entra/agent-id; vercel.com/docs/eve, /sandbox/concepts/firewall, /connect; eve.dev/docs/sandbox,
/concepts/security-model; modal.com/docs/guide/sandbox-networking; docs.e2b.dev/sandbox/internet-access;
daytona.io/docs/en/network-limits; developers.cloudflare.com/sandbox/guides/outbound-traffic.

Incidents and guidance: orca.security RoguePilot; CSA research notes (Comment and Control,
sandbox escapes 2026-07-22, OpenAI/Hugging Face 2026-07-23, CISA agentic AI); flatt.tech
claude-code-action; microsoft.com security blog 2026-06-05; adnanthekhan.com Clinejection and
cline.bot post-mortem; embracethered.com Jules and Devin; tracebit.com Gemini CLI; wiz.io
s1ngularity; unit42 AgentCore sandbox bypass; huggingface.co agent-intrusion timeline;
anthropic.com investigating-incidents-cybersecurity-evals; mintmcp.com CamoLeak; genai.owasp.org
Agentic Top 10 2026; coalitionforsecureai.org agentic principles and agentic IAM paper;
cisa.gov careful-adoption-agentic-ai-services.
