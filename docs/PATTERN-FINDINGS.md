# Pattern findings, 2026-11-15

What turned up while every pattern was brought to [the pattern standard](PATTERN-STANDARD.md),
and what was done about it. Nothing here fails the build.

Thirty-seven inconsistencies were reported inside the pattern files while their one-liners and
crossings were written. Each was then checked against its file. Eighteen were real and fixed
with a prose-only edit, twelve need a design decision and are listed below with their options,
and seven were not issues. Onboarding a product for two patterns raised two more decisions,
one of which (the sandbox technique) is now settled. No pin, block, flow or zone was changed by that pass.

## Closed

| Gap | What was done |
| --- | --- |
| Self-hosted inference: Secrets & key management owned no control | Credential Hardening pinned on it; AWS, Azure and Google Cloud each have a setting that delivers it. |
| Training pipeline: Observability & response owned no control | AI Telemetry Logging pinned on it. Azure and Google Cloud gained one setting each, checked against the vendor's page on 2026-11-15; AWS reuses CloudTrail data events. |
| First-party coding agents: Identity services owned no control | Multi-factor Authentication pinned on it, with a deviation recording that the identity provider is a call-out, not a block, here. |
| Five controls belonged to no control-plane group | Retrieval grounding checks and output encoding joined Policy & authorization; sanitize training data and data inventory joined Supply-chain assurance; message authentication joined Identity services. Each is cited on the boxes of the patterns that pin it. |
| Source-control crossing read two ways | The vendor runtime's flow to our source control is "nothing of ours in the path" on all three hosted patterns, as on the third-party coding agent. |
| Persistent managed agents: five walk steps had no note | Written. |
| Remote MCP server: callers drawn inside our cloud | Callers stand outside it; three inbound crossings authored. |
| Agent federation and agent sandbox had no catalogued product | Google ADK (12 settings) and Inspect (19 settings) onboarded, every row read on the vendor's page on 2026-11-15. Neither covers every pinned control: five of federation's 13 and four of the sandbox's 11 have no row, because the vendor pages did not support one. The two patterns' example notes were corrected to match the vendors' pages. |
| Version 1's header summary was missing from the pattern page | Restored. See [V1-COMPARISON.md](V1-COMPARISON.md). |
| Agent sandbox: the drawing asserted a microVM round each rollout, which its example does not provide | The sandbox is now technique-neutral: compute locked down in a contained space, fresh per task, by whichever technique the operating system or provider offers. Kata Containers and gVisor stay as examples of techniques, and each cloud's mapping still names that cloud's own. |

## By design, not gaps

- **Isolation controls have no control-plane box.** Execution Isolation, Network Isolation,
  Hardware-based Process Isolation and Application Configuration Hardening are enforced where
  the workload runs, so they show where they are pinned and not in the control-plane band.
- **The local model runtime draws two control-plane boxes.** Its zone note says why: there is no
  gateway, vendor or identity on the data path. The four controls whose function has no box
  there are shown where they are pinned.
- **Agent sandbox: Secrets & key management is drawn empty.** Its own note says it is kept out
  on purpose. This is the one open question the audit still reports, and it is settled.
- **Low-code builder and persistent managed agents: people reach the vendor directly.** No
  managed endpoint is drawn, and their crossings read "governed by the vendor", which is true.

## Needs your decision

Each would change what a pattern claims, so nothing was changed.

| Pattern | Question | Options |
| --- | --- | --- |
| Local model runtime | The data-handling risk and a deviation rely on a device firewall and a local-only switch, but no egress control is pinned. | Pin an egress or network-isolation control on the runtime; or keep it as target-state configuration and soften the risk note. |
| Personal autonomous agent | Egress control and Execution Isolation are pinned on the sandbox, so the tools-to-open-web crossing shows no control. | Keep them on the sandbox and accept the empty row (or have the table inherit from the enclosing box); or pin egress control on the tools, as the coding-agent patterns do. |
| Enterprise AI chat | Identity services describes domain capture, but its only pin is admin consent on the vendor's connectors. | Add an access-policy pin for domain capture; or leave it as a vendor-tenant setting and reword the box to lead with admin consent. |
| Persistent managed agents | The source-control note relies on the vendor's git proxy holding the credential, but credential scoping is pinned only on the connector flow. | Pin credential scoping for the repository credential; or treat it as vendor-internal and soften the note to "verify per product". |
| Agent federation | Tool services carries an "A2A peer agents" item, while a deviation says peers are blocks. | Drop the item from this pattern; or keep the standard item set and say so in the deviation. |
| Agent federation | Risk and control pins differ between the two peers, though the notes say most apply to both. | Keep one pin per risk on the peer where it bites hardest and record that; or pin each shared risk on both peer flows. |
| Agent federation | Nothing is pinned at the front end, so the user's crossing is "through the person", unlike the chat agent. | Leave it, since the pattern's subject is identity between agents; or pin the user-grant control there as the chat agent does. |
| Agent federation | The harness-to-gateway label reads "inference, MCP & skills" and does not name A2A. The label is a registered vocabulary term. | Leave it and rely on the corrected note; or register an A2A variant of the label in the vocabulary. |
| Agent sandbox | No sign-in or approval control is pinned on the researcher or the orchestrator. | Pin one on the researcher's flow; or record that operator access to the cluster is outside this drawing. |
| Agent sandbox | The kill switch is pinned on Observability & response, though the orchestrator enforces the stop. | Keep it there, as every other pattern does; or move it to the orchestrator. |
| Self-hosted inference | Observability & response's note describes the serving inventory and red teaming, which Supply-chain assurance owns, and not its own pin, the request log. | Rewrite the note around the log; or keep red teaming as an Observability duty and pin a control for it. |
| Training pipeline | Agent Authentication is pinned only on job-to-storage, though it is also checked at the corpus store. | Keep the one pin as representative; or add a second on the corpus flow. |
| Agent federation | Atlassian's Rovo A2A Gateway, a named example, authenticates the user by OAuth with PKCE, not the per-agent key or mTLS identity the pattern draws. | Keep it as an example and note the difference; or drop it. |

## Fixed in the prose

One line each; the commit history has the before and after.

- **First-party coding agents:** skills are admitted by the gateway's catalogue and pulled from
  the mirror, not "delivered through the crossing"; the External zone no longer says "no
  agreement" of a provider reached on our own key.
- **Third-party coding agents:** the same External zone wording.
- **Browser AI:** page extraction does not strip hidden content, as the guardrails pin already
  said.
- **Personal autonomous agent:** skill bytes come from the mirror, not through the gateway;
  computer use is the exception to "all inside the sandbox"; the remote device is messaging
  apps only.
- **Enterprise AI chat:** the browser note no longer offers a desktop app as a second path.
- **Hosted agent sessions:** instruction files from source control are not classified on the
  way in.
- **API/SDK managed agent runtime:** Identity services no longer says nothing is pinned;
  threads do not arrive "screened".
- **Persistent managed agents:** nine passages carried over from the session patterns now speak
  of an agent that continues, not a session; the same "screened" correction.
- **Single agent workflow:** the trigger is classified on its first crossing, not before it
  enters the loop.
- **Multi-agent workflow:** the operator flows speak of workflow state and a suspended step.
- **Agent federation:** the harness-to-gateway note names tool calls as well as inference and
  A2A tasks.
- **Remote MCP server:** Policy & authorization's note and one-liner cover per-tenant data
  scoping.
- **Self-hosted inference:** the ingest tooling is the promotion pipeline's.
- **Training pipeline:** base models are "as published upstream, before our mirror admits
  them"; Observability & response's note leads with the run log.

## Not issues

The browser AI gateway-to-downstream crossing is thin but says so itself. The personal agent's
read-only workspace is the stated decision beside the shipped behaviour. The chat agent's
front-end crossing names exactly the controls pinned there. The sandbox's open-web crossing says
pages are not screened and the pattern relies on the sandbox walls. The MCP server's Identity
services note covers scope decisions, which its own pins own. The "Grok Bot" example's links
resolve to that product's documentation. Execution Isolation's lack of a control-plane box is by
design.
