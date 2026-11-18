# Pattern findings, 2026-11-15

What turned up while every pattern was brought to [the pattern standard](PATTERN-STANDARD.md),
and what was done about it. Nothing here fails the build.

Thirty-seven inconsistencies were reported inside the pattern files while their one-liners and
crossings were written. Each was then checked against its file. Eighteen were real and fixed
with a prose-only edit, twelve needed a design decision, all since decided,
and seven were not issues. Onboarding a product for two patterns raised two more decisions,
one of which (the sandbox technique) is now settled, as is the local runtime's egress question. No pin, block, flow or zone was changed by that pass.

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
| Agent sandbox: the drawing asserted a microVM round each rollout, which its example does not provide | A sandbox is now defined by what it does: a boundary around running code, enforced from outside that code, that denies everything it does not explicitly grant. The technique sets its strength, not whether it is one. The definition is in the vocabulary and is used by the sandbox and personal-agent patterns; Kata Containers and gVisor stay as examples, and each cloud's mapping still names that cloud's own technique. |
| Local model runtime: a risk note and a deviation relied on a device firewall rule that no control pinned | Outbound Traffic Filtering is now pinned on the weight fetch and on the runtime, delivered by the organisation's existing egress proxy and not by a per-process firewall rule. Model sources are held to the internal mirror, so quarantine is the only way in, and the runtime vendor's cloud is refused, because a tool's own switch is the user's to change. The model itself makes no calls, and the calling harness's egress stays on its own pattern. Ollama, LM Studio and llama.cpp each gained a row, read on the vendor's page on 2026-11-16. |
| Personal autonomous agent: the tools-to-open-web crossing showed no control, because egress control and isolation are pinned on the sandbox round the tools | The pins stay on the sandbox. A crossing now inherits what is pinned on a boundary that encloses either end, in the crossings table and in the build's own observation. |
| Enterprise AI chat: Identity services described domain capture, but only admin consent on connectors was pinned | Access Policy Administration is pinned a second time, on the vendor's service, for domain capture. The same control, so no chip was renumbered. |
| Persistent managed agents: a note relied on the vendor's git proxy holding the credential, with nothing pinned there | Treated as vendor-internal, which the standard says is assured and not drawn. The note now says to confirm it per product in the vendor assessment. |
| Agent sandbox: no sign-in or approval control on who launches runs | Access Policy Administration is pinned on the researcher's flow and owned by Identity services. It is a new control on this pattern, added last (chip 12), with a setting on each platform read on the vendor's page on 2026-11-18. |
| Agent sandbox: the kill switch sits on Observability & response, though the orchestrator enforces the stop | Left as it is: every pattern places the kill switch there, and the pin's note says what enforces it. |
| Self-hosted inference: the Observability & response note described the serving inventory and red teaming, not its own pin | The box and its one-liner are now about the request log; inventory and testing stay with Supply-chain assurance. |
| Training pipeline: Agent Authentication was pinned only where the job writes, though it is also checked at the corpus store | A second pin of the same control on the corpus-to-job flow. |
| Agent federation: pins differed between the two peers, nothing was pinned at the front end, Tool services listed the peers again, the gateway label did not name A2A, and the Rovo example signs in the user and not the agent | Decided on 2026-11-18: both peers are equally untrusted. The five shared risks (injection, data disclosure, card tampering, cost, delegation opacity), the cost limit and the assessment are pinned on both peer flows; what stays different is whose identity travels. The user's grant is pinned at the front end. Tool services lists its other two standard items only. The label is the registered variant "inference, MCP, skills & A2A". The Rovo example is kept with a note. Replay protection is stated in the token-exchange control: single-use, short-lived assertions and a task refused the second time. No control was added, so no chip was renumbered. |

## By design, not gaps

- **Isolation controls have no control-plane box.** Execution Isolation, Network Isolation,
  Hardware-based Process Isolation and Application Configuration Hardening are enforced where
  the workload runs, so they show where they are pinned and not in the control-plane band.
- **The local model runtime draws two control-plane boxes.** Its zone note says why: there is no
  gateway, vendor or identity on the data path. The five controls whose function has no box
  there are shown where they are pinned.
- **Agent sandbox: Secrets & key management is drawn empty.** Its own note says it is kept out
  on purpose. This is the one open question the audit still reports, and it is settled.
- **Low-code builder and persistent managed agents: people reach the vendor directly.** No
  managed endpoint is drawn, and their crossings read "governed by the vendor", which is true.

## Needs your decision

Nothing is open. The seven questions that stood here were decided on 2026-11-18 and are in the
Closed table above.

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
