# Pin mapping review — 2026-10-05

Independent review of every risk pin, capability pin and governance call-out on all 17 reference
architectures. The question for each was:

- Is it at the component or connection where the threat enters, or where the control is enforced?
- Does the capability match its formal MITRE ATLAS, D3FEND or catalogue definition?
- Is it a duplicate or a stretch?
- Is its note accurate?

## Method

- Six reviewers each audited two or three related drawings, judging every pin individually.
- A seventh reviewer audited cross-drawing consistency: the same capability or risk across all 17
  drawings.
- Each pin was resolved to readable blocks and edges with their bands, plus the formal
  definitions of the risks and capabilities used.
- I then checked each flagged finding against the pin text and the source YAML, and confirmed the
  proposed targets exist.
- Per-pin verdict lines (the audit trail) are in [`raw/`](raw/). G1–G6 are per drawing; G7 is
  cross-drawing.

| | Count |
|---|---|
| Pins and call-outs inspected | 690 |
| Judged correct as they stand | 594 (86%) |
| Flagged by drawing reviewers | 96 |
| Gaps proposed | 33 |
| Cross-drawing findings | 30 |

**Overall:** most placements are sound. The problems fall into five groups:

1. **Copied or stale text.** Notes carried from a sibling drawing, or left behind by recent
   pattern changes. Eleven items.
2. **Duplicates and stretches.** The same concept pinned twice, or a risk on a hop where it
   cannot occur.
3. **Vendor-internal controls pinned as ours.** These contradict ONTOLOGY rule 8.
4. **Capabilities used for something adjacent to their definition.** The tracing, egress, rate
   limit and data-access governance capabilities are the main cases.
5. **Placement conventions not applied the same way everywhere.** Human approval, agent identity,
   and which governance group lists each capability.

---

## Decisions for you

| # | Question | Options | Recommendation |
|---|---|---|---|
| D1 | Where does **human approval (AML.M0029)** sit? | (a) On the write it gates. This is the current ONTOLOGY convention: "downstream write → HITL". (b) Where the person approves: the harness prompt, phone or chat client. | **(a)**: the auditable fact is that this write cannot happen without an approval, and approval surfaces vary (some are vendor surfaces). Align the chat agent, the one outlier. Rejects six "move to the human" findings. |
| D2 | Where does **agent identity (D3-AA)** sit? | (a) On the agent block, as on the single-agent, multi-agent and chat-agent drawings. (b) On the crossing where it is verified, as on A2A, MCP and self-hosted. | **(b)**: agent → AI gateway on the three cloud agent drawings. D3-AA is the verification of an agent's identity, and that happens at the gateway. |
| D3 | **Vendor sandbox isolation (D3-EI)** on hosted sessions and the API/SDK runtime. | Keep, or remove. | **Remove.** The hosted-sessions note itself says "a provider guarantee we verify by assessment, not a setting we toggle". Rule 8 covers it with the vendor assessment pin, and persistent agents already has none. This is the "Agent Sandbox Isolation" chip from your screenshot. |
| D4 | **Catalogue normalisation** (section 3). | Do it now, later, or never. | **Do it as a second pass, after section 2**: it changes classifications in the vocabulary, which touches every drawing. |
| D5 | **Build check.** The absorption check passes on any deviation containing "absor", "drawn as", "folded" or "control on the", so unrelated deviations satisfy it. | Tighten it or leave it. | **Tighten it**: require the deviation to name the capability id. |

---

## 1. Text errors — fix regardless (verified)

1. **Persistent agents summary** says the agent "reaches our code and data only down the tunnel
   we run". That contradicts the GitHub App crossing; source control is never behind the tunnel.
2. **API/SDK runtime**, runtime → Source control edge note: "the events that start or steer
   work". This was copied from hosted sessions; sessions here start at our front end.
3. **API/SDK runtime and persistent agents**, the D3-APA note on Source control: "trigger policy
   admits … to start or steer a session". Also copied from hosted sessions. Reword to "who may
   write the threads and instruction files the session reads".
4. **First-party and third-party coding agents**, the riskToolRegistryTampering note on Native
   tools reads "Configuration admits the whole native tools". The text was garbled by a block
   rename; rewrite it.
5. **First-party and third-party coding agents**, the cap-agent-egress-control note on Native
   tools says the endpoint reaches "nothing else". It omits the direct git path to our Source
   control added on 2026-10-05, and on third-party also the vendor service.
6. **Third-party coding agents**: cap-agent-kill-switch is pinned on Observability & response but
   missing from that block's call-out list.
7. **Six drawings**: the D3-FA note on the package-mirror ingest edge claims "digest and
   signature verification". That is AML.M0014 and AML.M0013. Keep only the malware and
   typosquat scanning.
8. **Single-agent and multi-agent drawings**, Observability & response block notes.
   - Single agent: drop the "approval threshold" clause, which belongs to the Policy group.
   - Multi-agent: "trail recorded by the gateway" contradicts its own pins, since inter-agent
     messages never cross the gateway. Say the trail is assembled from both.
9. **Self-hosted inference**, the riskInsecureIntegratedComponent note on the AI gateway: "holding
   every tenant's brokered credentials" was copied from drawings where the gateway brokers
   provider calls. Here it carries inference only.
10. **Enterprise chat and low-code**, cap-agent-kill-switch notes.
    - Enterprise chat: "Disable the app in the tenant" doesn't stop the personal-account scenario
      the note cites.
    - Low-code: the stop is to unpublish or quarantine the one agent, not the platform.
11. **First-party coding agents**, Identity services note: the "enterprise agreement" wording was
    copied from third-party; there is no vendor on this drawing.

## 2. Pin fixes — recommended (verified)

### Remove: duplicates, stretches and vendor-internal controls

| Drawing | Pin | Why |
|---|---|---|
| First-party coding agents, Third-party coding agents | riskSensitiveDataDisclosure @ Native tools → AI gateway | This edge ends at our own brokered servers. Shell exfiltration is already pinned on the open-web edge. |
| Personal agent | riskCovertChannelsInModelOutputs @ AI gateway → Model provider | A stretch against an allowlisted, brokered provider. No sibling has it and no control answers it. |
| Hosted sessions, API/SDK runtime, Persistent agents | cap-input-guardrails @ Managed runtime → Source control | The vendor runs this filtering inside its session; nothing of ours is on that path. The vendor assessment pin covers it. |
| Single agent | cap-input-guardrails @ Triggers → Agent harness | Duplicates the gateway's screening pin and nothing classifies on that edge. Widen the gateway pin's note to cover the trigger payload, and drop the "trigger ingress absorbs" deviation. |
| Chat agent | riskRogueActions @ Triggers → Agent harness | No action runs on the trigger edge; the rogue write is already pinned on the write edge. |
| Browser AI | riskSensitiveDataDisclosure @ Agent harness → AI gateway | The same concept as the excessive-data pin on that path. |
| Browser AI | cap-input-guardrails @ Agent harness, and its absorption deviation | The vendor implements this and offers no org setting; the vendor assessment covers it. |
| Browser AI | cap-agent-action-policy-enforcement @ Vendor service, and its Policy call-out | The admin tier offers only the on/off switch and site lists, which are already pinned. *The vendor-documentation claim was not independently re-checked.* |
| Training pipeline | riskInsecureIntegratedComponent @ Private pkg registry | Generic, duplicates the training-job pin, and no control answers it. |
| Training pipeline | D3-AA @ Training corpus → Training job, and its Identity call-out | Duplicates the corpus access-control pin, and the training job is not an agent. |
| Enterprise chat | Policy call-out D3-APA | The same capability is already listed under Identity services. |
| A2A federation | Secrets call-out D3-CTS | No vault takes part; it is already listed under Identity. |

### Move

| Drawing | Pin | From → to | Why |
|---|---|---|---|
| Enterprise chat, Hosted sessions, API/SDK runtime, Persistent agents | riskAgenticDelegationConfusedDeputy | Tunnel connector → **Tunnel → AI gateway** | The tunnel only carries traffic and authenticates nothing. The vendor's request meets our authority where the gateway admits it and issues the grant. |
| Hosted sessions | riskShadowAndUnknownAgents | Remote device → Vendor service edge → **Vendor service** | Schedules and automations live in the control plane. This matches persistent agents. |
| First-party coding agents, Third-party coding agents | cap-mcp-tool-integrity | Native tools → AI gateway → **Native tools → Private pkg registry** | The note describes version pinning at the mirror. This matches the personal agent. |
| Personal agent | riskToolSourceProvenance | Private pkg registry block → **Native tools → Private pkg registry** | Puts the risk on the install edge where its control sits, matching the siblings. |
| Personal agent | cap-agent-egress-control | Native tools → **Sandbox** | The note describes the microVM's network policy, which also covers the channel bridges. |
| Personal agent | cap-agent-kill-switch call-out | Identity → **Observability & response** | It is a response capability, and Observability & response is where every other drawing lists it. |
| Enterprise chat | cap-sensitive-data-redaction | Employee → Browser → **Browser → Vendor chat service** | DLP acts on what leaves for the vendor, and this puts it beside the excessive-data risk. |
| Remote MCP server | riskPromptInjection | AI gateway → MCP service → **MCP service → Enterprise data** | The current note repeats the description-tampering risk. Re-scope it to third-party-authored records returned as tool results. |
| Remote MCP server | riskInsecureIntegratedComponent (the SDK) | AI gateway → MCP service edge → **MCP service** | The vulnerable SDK is inside the service. |
| Remote MCP server | D3-CR | Observability & response → **Authorization server** (call-out under Identity) | Revocation and introspection are enforced at the authorization server. |
| Remote MCP server | D3-AVE (pin and call-out) | Observability & response → **Supply-chain assurance** | Vulnerability enumeration sits beside D3-SYSVA, which is already there. |
| Local runtime | cap-staged-rollout-gate and cap-ai-threat-modeling (pins and call-outs) | Observability & response → **Supply-chain assurance** | Neither is observability or response; the cloud drawings list the rollout gate there. |
| Self-hosted inference | AML.M0005 call-out | Secrets → **Policy & authorization** | Access control on models at rest is authorization. |
| Training pipeline | cap-model-documentation (pin and call-out) | Observability & response → **Model registry** block, call-out under **Supply-chain assurance** | It is the model registry, and the drawing has a Model registry block. |
| Browser AI | cap-agent-tool-registry | Browser → **Open web → Browser** | The drawing's own deviation says admission is pinned on the store-to-host edge. |

### Retarget: wrong capability or risk for the note

| Drawing | From | To | Why |
|---|---|---|---|
| Enterprise chat | cap-agent-tracing (pin and call-out) | **AML.M0024** | A vendor export plus our gateway log is input and output logging, not per-step agent tracing. |
| Low-code builder | riskSensitiveDataDisclosure @ Tunnel connector | **riskAgenticDelegationConfusedDeputy** | "Reads with each connection's stored credential whoever is asking" is the definition of a confused deputy. |
| Remote MCP server | cap-agent-egress-control @ Authorization server (pin and call-out) | **D3-OTF** | The authorization server is not an agent; blocking its fetches from private addresses is plain outbound filtering. |
| Remote MCP server | cap-data-access-governance @ MCP service → Enterprise data | **D3-AMED** | This is per-tenant authorization on reads and writes, not retrieval for RAG. |
| A2A federation | AML.M0004 @ AI gateway → partner (pin and call-out) | **AML.M0036** | The edge is outbound-only and we are the caller. Bounding streams, retries and fan-out is AML.M0036. |
| Third-party coding agents | riskToolSourceProvenance @ Native tools → Private pkg registry | **riskInsecureIntegratedComponent** | The note describes package names picked by the model, not tool metadata. This matches the first-party pin on the same edge. |
| Chat agent | riskSensitiveDataDisclosure @ Native tools → Memory & state | **riskExcessiveDataHandlingDuringInference** | The note describes over-accumulation within the user's own entitlement, not disclosure to someone else. |

### Fix the note (location and capability are right)

- **Personal agent**
  - riskPromptInjection on the relay: it calls pairing "the only thing" between senders and the loop, but input screening is pinned at the relay.
  - cap-output-guardrails: "both legs" is vague. Say completions are classified before they reach the loop.
- **Third-party coding agents:** riskRunawayAgentToolLoops says "the stop is the credential", but the kill-switch pin names three stops.
- **Hosted sessions:** AML.M0028 on Vendor service: drop "the network access level", which is egress policy and already pinned.
- **API/SDK runtime:** AML.M0028 on the vendor connectors edge: drop "approval policy", which is already the action-policy pin.
- **Persistent agents:** D3-CH on the runtime: keep only what the org sets (credential lifetimes, rotation, revocation, clearing saved logins).
- **Enterprise chat:** D3-DI on Enterprise data: keep it to inventory. Oversharing analysis is the data-access governance pin.
- **Remote MCP server**
  - D3-CTS: keep only the audience binding.
  - D3-CH: drop "never the caller's token forwarded", which is D3-CTS.
- **Single agent and multi-agent:** AML.M0028 notes should be about least-privilege per-tool grants.
  - Single agent currently describes catalogue design.
  - Multi-agent currently repeats delegation narrowing, which is its D3-CTS pin.
- **A2A federation**
  - riskEconomicDenialOfWallet: reframe as oversized or endless partner artifacts inflating our context and inference spend.
  - D3-CTS: drop the token-binding sentence, which is D3-TB.
- **Training pipeline:** riskModelSourceTampering: describe tampered weights and packages. The current note describes execute-on-load, which is the deserialization pin.
- **Self-hosted inference**
  - riskSensitiveDataDisclosure on the inference API: state the actual disclosure.
  - D3-HBPI: it describes generic OS isolation and disclaims the one risk it answers. Restate it as confidential computing or dedicated accelerators.
- **Browser AI:** AML.M0029: qualify "skip-all-approvals mode removable by the admin tier". The reviewer reports users choose the approval mode. *Not independently re-checked.*

### Add: high-confidence gaps only

Each one is either described by the drawing's own walks or notes, or already pinned on a sibling.

| Drawing | Add | Why |
|---|---|---|
| First-party coding agents, Third-party coding agents | riskPromptInjection @ Native tools → Open web | The walkthrough's "pages into context" step has no injection pin; the personal sibling pins it. |
| Single agent, Chat agent | D3-EI @ Native tools | Both have a Sandboxed tools item running generated code; the multi-agent sibling pins D3-EI there. |
| Hosted sessions | riskPromptInjection @ Managed runtime → Tool services | Connector results reach the loop through nothing we run; both siblings pin it. |
| API/SDK runtime | D3-APA @ End user → Application front end, cited under Identity | The front end's identity binding decides who a session runs for, yet Identity cites nothing. |
| Local runtime | AML.M0014 @ Model weights → Inference runtime | The edge note says integrity-checked artifacts load, but the model-swap risk has no check pinned; self-hosted pins it on the same edge. |
| A2A federation | riskToolRegistryTampering @ AI gateway → Peer agent (vendor) | The drawing's "card changes after admission" walk is exactly this risk. Without it, the tool-integrity pin answers no risk. |

**Not recommended now:** 25 lower-confidence gaps, listed in `raw/` with each reviewer's
confidence. They would add pins against your "only absolutely relevant" rule. One worth knowing
about: the push/PR edge on the laptop coding drawings names branch protection and review, but no
control is pinned there. Under D1 the approval pin stays on the tool-write edge rather than
adding a second one.

## 3. Catalogue normalisation — recommended second pass (D4)

The cross-drawing reviewer found that several inconsistencies come from the vocabulary's
**enforcement classes**, the inline, embedded or management class assigned to each capability,
rather than from the drawings.

- **cap-agent-kill-switch** is classed two ways, as embedded and as management.
- **cap-data-access-governance** is classed inline at the AI gateway, but none of its six pins is
  on a gateway.
- **cap-mcp-tool-integrity** is classed management, but all 8 drawings that pin it put it on the
  data path.
- **D3-APA** is inline at identity components, but 10 of its 14 pins are elsewhere.
- **Call-out groups** aren't applied the same way everywhere.
  - D3-CTS is listed under Identity on two drawings and Secrets on the rest.
  - cap-model-documentation, D3-AVE and cap-ai-threat-modeling sit under Observability on some
    drawings.
  - Input guardrails are pinned on 13 drawings and cited in a call-out on none.

The fix is a single **capability → governance group** map and corrected enforcement classes, then
applying both to every drawing. G7 section E5 has a proposed map. This touches every drawing, so
it should follow section 2, not run alongside it.

## Findings I rejected

| Finding | Why I disagree |
|---|---|
| Enterprise chat: remove riskPromptInjection on the vendor's tenant corpus | It is a separate path: the admin-granted corpus, where the zero-click incidents ran. The connector-path pin doesn't cover it. |
| Low-code builder: remove riskRetrievalVectorStorePoisoning on Enterprise data | Persistent poisoning of the indexed source is a separate risk from the transient injection pin. |
| Low-code builder: move cap-staged-rollout-gate to the builder → platform edge | The gate lives in the platform's environments and pipelines, so the block is right. |
| Six moves of AML.M0029 to the human's edge | Decided by D1. |
| Cross-drawing #9: put cap-mcp-tool-integrity on harness → AI gateway everywhere | It conflicts with the endpoint drawings, where the note is about mirror pinning. Left to the section 3 pass. |

---

## Applied — 2026-10-05

Sections 1 and 2 and decisions D1, D2, D4 and D5 are applied, and D3 was reversed. The build, all
six test suites, the org-record check and the typecheck pass. All 17 drawings render with no page
errors.

### Where the implementation departed from the plan, and why

Each item below reversed or changed a recommendation because the repo's researched tooling
ledger (`data/tooling/`) or org records contradicted the reviewer's premise.

| Item | Plan | Done instead | Evidence |
|---|---|---|---|
| D3: sandbox isolation on hosted sessions and the API/SDK runtime | Remove | **Kept on both, with corrected notes** | The ledger records isolation as a product capability with real differences: Cursor reuses a VM for follow-up runs, Copilot lets the org choose the runner type, AgentCore is microVM-only with session lifetimes, and Vertex uses per-session code sandboxes. The hosted-sessions note was wrong to say there is nothing to set. |
| Enterprise chat: cap-agent-tracing → AML.M0024 | Retarget | **Kept, with an accurate note** | M365 Copilot, ChatGPT and Claude exports carry agent IDs, tool calls and results, and the resources accessed: per-step agent tracing. |
| MCP server: cap-data-access-governance → D3-AMED | Retarget | **Kept** | The cross-drawing reviewer judged it correct at the data edge, and the GitHub MCP server row cites it. |
| Browser AI: input screening and action policy | Remove | **Kept, with corrected notes** | Inference hooks let the org's own screening server rule on requests and tool results. Org allow and block lists are enforced by the extension. The old notes overstated admin control; the new ones say what is and isn't settable. |
| Training: D3-AA on the corpus read | Remove | **Moved to Training job → Storage** | The MLflow row shows a per-job workload identity scoped to its own experiment and candidate. That is the separation the drawing rests on, and no longer a duplicate of the corpus access control. |
| A2A federation: D3-CTS call-out | Identity only | **Secrets only** | Decision D4's map puts D3-CTS under Secrets everywhere. |

### Follow-on changes the build required

- **Tooling and guidance references.**
  - The Vercel AI SDK risk row moved from sensitive-data disclosure to excessive data handling (telemetry records every input and output).
  - The GitHub MCP server's egress row, and the MCP guidance item citing it, moved to D3-OTF.
  - The A2A federation guidance now cites AML.M0036.
- **Hosted sessions walk.** The "nobody at the machine" scenario gained a connector-read step, so the new connector-injection risk is walked.
- **Obsolete deviations removed.**
  - Personal agent: "kill switch cited from Identity", which had called the old placement deliberate.
  - Single agent: "trigger ingress absorbs inbound classification".
- **D5 surfaced 13 pins** that had passed only on unrelated deviation text.
  - Five were access-policy pins, fixed by reclassifying D3-APA as embedded.
  - Eight were local-inference, training and self-hosted controls with no gateway or sandbox block. Their existing absorption deviations now name the capability IDs.

### D4 as applied

- **Enforcement classes.**
  - cap-agent-kill-switch moved from embedded to management.
  - D3-APA, cap-data-access-governance, cap-retrieval-grounding-checks and cap-mcp-tool-integrity are now embedded.
  - The redaction and output-encoding embodiment lists were widened.
- **Governance groups.** 61 citations added and 4 wrong-group citations removed. The map is now
  `governanceGroups` in vocabulary.yaml, and the build checks it.

### Side effects

- **"Covert channels in model outputs"** is now pinned on no drawing; the audit shows 5 unpinned risks.
- **New build observation:** hosted sessions' local-app hand-off to the runtime crosses into the vendor band with no inline control at either end. It is an observation, not an error.

### Not done

- Cross-drawing #8: re-identifying the gateway allowlists as AML.M0028, and the personal agent's registry as discovery.
- Cross-drawing #20: moving tracing and shadow-AI discovery pins to Observability on the endpoint drawings.
- The remaining placement-family items: #17–19 and #23.
- The 25 lower-confidence gaps.
