# Catalogue rebuild — instruction register and plan

Working document for the 2026-08-30 rebuild pass. Every instruction is numbered so nothing is
lost, and each carries its disposition. Items marked **CHALLENGE** are ones where I think the
instruction as stated conflicts with something else and needs a decision.

Status key: `todo` · `research pending` · `done` · `needs decision`

---

## Part 1 — Instruction register

### Endpoint · third-party coding & desktop agents

| # | Instruction | Disposition |
|---|---|---|
| E1 ✅ | Harness→gateway exists and is real (used for some Claude Code users), but **SSO-based harness→vendor service direct is the primary and recommended path** | todo — add direct edge, make it primary |
| E2 ✅ | Also keep harness→gateway→provider for inference on our own keys | todo — both paths coexist |
| E3 ✅ | **Every AI gateway must connect to a model provider, across the whole catalogue.** 3p gateway isn't even hooked up | todo — audit all 9 gateway architectures |
| E4 | Core flow: phone → vendor service → relayed back to agent harness | **done** (2026-08-30, commit ac821e5) |
| E5 ✅ | User straight to the agent in the application is fine | already drawn |
| E6 ✅ | Model on Claude Code and Cursor; research the web | research pending |

### Endpoint · sandbox

| # | Instruction | Disposition |
|---|---|---|
| E7 ✅ | The **sandbox was dropped** in the zone migration; it is the core recommendation for personal autonomous agents on managed endpoints. Restore it | **CHALLENGE-A** — needs a representation decision |
| E8 | ~~Add the sandbox to first-party coding agents too~~ | **DROPPED 2026-08-30.** Sandbox goes on the personal autonomous agent only — that is the worrisome category. Vendor coding agents ship built-in command-level sandboxing and the organisation is comfortable with that. See the note under Wave C. |
| E9 ✅ | Research and model on OpenClaw, Hermes, Docker microVM sandboxes | research pending |

### Endpoint · first-party coding & desktop agents

| # | Instruction | Disposition |
|---|---|---|
| E10 | Research whether remote control actually exists for OSS harnesses | research pending |
| E11 | **Remote must not connect directly to the agent harness — it has to go through something** | todo — my current drawing is wrong |
| E12 | If remote control isn't a real option for this category, remove it | research pending |
| E13 | Enterprise zone has large white space; layout engine may need work | **confirmed defect**, measured below |
| E14 | Model on opencode, LangChain deep agents, pi | research pending |

### Endpoint · local model runtime

| # | Instruction | Disposition |
|---|---|---|
| E15 | Governance zone sits far below the others — bad white space | **confirmed defect**, 222px gap |
| E16 | **Egress control drawn as a component violates our standards** | **confirmed, mine.** Remove |
| E17 | No controls as components; leave a zone empty if there is nothing to put in it | todo — see CHALLENGE-B |
| E18 | **Fully re-audit every architecture for controls-as-components** | todo — 4 confirmed instances |
| E19 | Model on HuggingFace weights loaded directly, Ollama, LM Studio | research pending |

### Cloud · single-agent and multi-agent workflow

| # | Instruction | Disposition |
|---|---|---|
| C1 | The harness has **its own local tool services** that do not go through the gateway | todo — new block or items |
| C2 | The gateway provides **approved model, MCP and plug-in connectors** | todo — sharpens the gateway's role |
| C3 | Single agent: keep "Agent harness", connect it to a tool services with connectors, still route MCP/plug-ins via the gateway | todo |
| C4 | **Rename "Durable multi-agent workflow" → "Multi-agent workflow"** | todo |
| C5 | Multi-agent: **nest supervisor→subagents inside the agent harness** | **CHALLENGE-C** — nesting has no edges |
| C6 | Multi-agent: harness may also reach remote agents through the AI gateway over A2A | todo |
| C7 | **Add A2A to all tool services on every AI gateway pattern, catalogue-wide** | **CHALLENGE-D** — not the local pack |
| C8 | Model on a LangChain/LangGraph tool-calling agent on containers | research pending |

### Cloud · chat agent

| # | Instruction | Disposition |
|---|---|---|
| C9 | Chat agent is essentially the single-agent workflow; **align the two fully** | agree on skeleton — **CHALLENGE-E** on merging |
| C10 | Chat agents now often have scheduled/triggered runs too | todo |
| C11 | The unique component is an **application layer the human uses via browser on the endpoint** | todo |
| C12 | Single/multi-agent are human-led *or* triggered by cron / message queue | todo |
| C13 | Model the chat app on self-hosted LibreChat | research pending |

### Cloud · MCP server

| # | Instruction | Disposition |
|---|---|---|
| C14 | Governance zone is far below the other zones | **confirmed defect**, 402px gap |
| C15 | **What is "Service edge" — control or component?** | answered below: control-shaped, remove |
| C16 | An MCP server is basically a FastAPI endpoint; maybe it isn't its own architecture | **CHALLENGE-F** — I argue keep |
| C17 | If kept, make it about the controls | agree |
| C18 | Research controls in the July 2026 MCP standard | research pending |
| C19 | Keep it; components may be very light; don't invent boxes | agree |
| C20 | Hosted in the Enterprise cloud zone | todo |
| C21 | Focus on create/host, not connection. AI gateway as entry on the left, **dotted line into the gateway as the starting place** | **CHALLENGE-G** — dotted means governance in our grammar |
| C22 | Model on FastMCP on containers | research pending |

### Cloud · self-hosted inference

| # | Instruction | Disposition |
|---|---|---|
| C23 | **Align with the local model runtime** — same except cloud location and gateway access | todo |
| C24 | Another egress-control-as-component here — remove | **confirmed, mine** |
| C25 | Model on GPU/throughput best practice for enterprise inference hosting; research | research pending |
| C26 | **Use the same terminology across endpoint-local and cloud-hosted inference** | todo |
| C27 | **Stop calling it "open weights"** — may be our own or fine-tuned weights | todo — rename |

### Cloud · fine-tuning

| # | Instruction | Disposition |
|---|---|---|
| C28 | Polluted with controls-as-components and processes-as-components | agree |
| C29 | Focus on what is unique: **GPU compute, base weights in, training data in, new weights out to storage** | todo — major simplification |
| C30 | Do not focus on inference | agree |

### Third-party · enterprise chat

| # | Instruction | Disposition |
|---|---|---|
| T1 | "Chat surface & uploads" and "Identity & secure edge" are controls/processes as components | **confirmed** |
| T2 | Components were added just to fill zones | **confirmed, mine** |
| T3 | Really it is a browser on the managed endpoint going to the vendor platform | todo |
| T4 | The endpoint component is just the browser — **don't call it a "surface"** | todo |
| T5 | **Never add a zone just to have it represented; drop unused zones** — catalogue-wide | todo — see CHALLENGE-B |
| T6 | Keep the Enterprise cloud zone here: AI gateway → tool services, so the 3p chat can reach our own MCP servers **over a secure tunnel** — vendor-supplied software the organisation runs to connect to its MCP | todo — terminology is *tunnel*, not *channel* |
| T7 | BYOK required in that scenario | todo — pin |
| T8 | Vendor service reaches **both** our cloud tool services **and** external tool services | todo |
| T9 | The vendor service stays a **single component**; don't model their internals | agree — matches rule 8 |
| T10 | Model on ChatGPT and claude.ai | research pending |

### Third-party · low-code builder

| # | Instruction | Disposition |
|---|---|---|
| T11 | An AI gateway in the vendor zone feeding the Enterprise zone is **not what we do** | **confirmed, mine.** Rebuild |
| T12 | Model on Copilot Studio; research | research pending |
| T13 | Follow the patterns established by the other architectures after this pass | todo — do this one late |

### Third-party · API/SDK managed runtime

| # | Instruction | Disposition |
|---|---|---|
| T14 | Too many components sitting in Enterprise cloud | **confirmed, mine** |
| T15 | The core is **a vendor hosting and managing the agent harness for us** | todo |
| T16 | User → vendor → back into Enterprise cloud for our tool services (MCP, GitHub Enterprise) | todo |
| T17 | Model on Anthropic managed agents (API/SDK), researched for 2026 | research pending |

### Plan-level success criteria

| # | Instruction | Disposition |
|---|---|---|
| P1 | **Inspect every architecture individually with Playwright** | todo — 13 screenshots, gate on each |
| P2 | No large gaps between zones | todo — layout work |
| P3 | Do not open a gap just to fit a control pin | todo — renderer work |
| P4 | Pins belong **inside a zone or on its edge** | todo — renderer work |
| P5 | A pin between two zones on a data flow makes no sense unless the control genuinely lives outside any zone | todo |

---

## Part 2 — Measured layout defects

Numbers from the built dataset, so these are facts rather than impressions.

**Vertical gap between the content bands and the governance band** (healthy is 42px):

| Architecture | Gap |
|---|---|
| remote MCP server, self-hosted inference, enterprise chat, low-code builder | **402px** |
| local runtime, training pipeline, managed runtime | **222px** |
| everything else | 42px |

Cause: the governance blocks are authored at a fixed row (5 or 6) while the content bands stop
at row 2 or 3. The gap is the unused rows. **The governance row must be derived, not authored.**

**Horizontal gap between bands** (healthy is 20px): several show **76px** between the user band
and the next one. Cause: an actor block is 108px wide against a 220px service block, so a band
containing only an actor produces a narrow rect and a visible gutter.

**Band width with sparse content**: the cloud band is 940px wide in four architectures because
it spans four columns while only two of them hold blocks on any given row.

These three are the whole of the "weird white space" and all three are fixable in the layout
code rather than by moving blocks around by hand.

---

## Part 3 — Challenges

### CHALLENGE-A — the sandbox, and what dropping it actually cost

You are right that it went missing, and here is exactly how. The zone migration emptied
`RF_CONFIG` because `endpoint-personal-agent-zones.yaml` carried a deviation saying *"a frame
inside a band reads as a second boundary of the same kind"*. I took that at face value. The
result is that the single most important control recommendation for this archetype — the
microVM boundary and its three openings — is now a sentence in a note.

That deviation was wrong, or at least too strong. A band answers *who operates this
environment*; a sandbox answers *what contains this process*. Those are different questions, and
a drawing can carry both. My recommendation is to **restore containment frames inside bands**,
which means reverting that deviation and re-keying `RF_CONFIG` for the personal agent and
first-party coding agent. The alternative — a nested sub-band — would collide with the rule that
bands measure exactly one axis.

### CHALLENGE-B — "no controls as components" cannot be a literal rule, or the AI gateway dies too

You have said this three times and you are right each time, but the rule as stated would also
delete the AI gateway, which you want everywhere. `capabilityAiGateway` and
`capabilityEgressControl` are both entries in our capability catalogue; `AI gateway` and
`Egress control` are both block titles. A naive "block titles may not be control names" check
fails nine architectures.

The distinction that actually holds is **provenance, not naming**: is this a tier the
organisation operates and would name in its own inventory, or did I invent a box because a rule
demanded one? LiteLLM is a real tier somebody runs, so the AI gateway stays. Nobody operates a
product called "Egress control" as a distinct hop in a local-inference story — I added it in
three architectures purely to satisfy the crossing rule.

**That is the root cause and it is worth naming: the crossing rule hard-fails the build, so when
an honest drawing had no crossing, inventing a box was the only way to make the build pass.**
The fix is two-sided — remove the invented components, and let the crossing rule be satisfied by
a recorded deviation so the pressure to invent one disappears.

Proposed test, mechanisable: a component that terminates a band crossing must be justified by a
named exemplar in its own architecture file. If you cannot name the product class, it is a pin.

On "leave the zone empty": bands are only drawn when they contain a block, so removing the
invented component makes the band disappear by itself. That is consistent with T5 and no
special handling is needed.

### CHALLENGE-C — nesting the supervisor has a cost you should choose knowingly

Nesting supervisor and subagents inside the harness matches how LangGraph actually works, and I
agree with it. But **items inside a block cannot have edges**, so the supervisor→subagent
delegation stops being an arrow and becomes two labels and a note. Today that delegation carries
its own risk pins (one confused agent propagating through the graph) and its own flow.

Three options: keep them as items and move those pins onto the harness block; keep two blocks
with a real edge and accept it isn't visually nested; or add nested-block support to the grammar
and the renderer. My recommendation is **items plus a note**, with the propagation risk pinned on
the harness — it costs one arrow and buys the correct reading that this is all one runtime.

### CHALLENGE-D — A2A on *remote* tool services only

Agreed for the cloud, vendor and external tool surfaces. But the endpoint tool pack is file
tools, shell and local MCP — A2A is a network protocol for reaching peer agents, and putting it
on a laptop's local tool surface would be wrong. I will add it to the `toolServicesRemote` pack,
which is exactly the packs hanging off an AI gateway.

### CHALLENGE-E — I would keep the chat agent as its own architecture

You are right that it is nearly the single-agent workflow, and they should share one skeleton. I
would still keep them separate, because the difference is graph-level rather than cosmetic: a
human sits *on the path* and in-thread approval is the primary gate, where the unattended
workflow has to fall back on compensating transactions. Our own rule 6 bans either/or edges —
"a human is present, or is not" cannot be one drawing with a conditional arrow.

So: same blocks, same chain, same names, with the browser application layer and the human as the
genuine additions. If you would rather merge them, say so and I will fold the chat agent into
the single-agent workflow and record it as a retirement.

### CHALLENGE-F — keep the MCP architecture, and let it be small

You are right that a FastMCP server is close to "just an API endpoint", and that is an argument
for fewer boxes rather than for deleting the page. I would keep it, because it is the only
architecture in the catalogue drawn from the **publisher's** side — everywhere else we consume
MCP, and the controls that matter when you *publish* one (audience-bound tokens, scope design,
tool-description integrity, confused-deputy prevention, multi-tenancy) have nowhere else to
live. It should be the smallest drawing in the catalogue with the densest pin set.

### CHALLENGE-G — the dotted line into the gateway

In our grammar dotted is the `governance` path class and means oversight rather than data. If
the gateway is the entry point for real traffic, that leg is data and should be solid. I would
convey "this is where the story starts" with position — leftmost in the cloud band — rather than
by overloading the path class. If you specifically want a visual distinction for "entry point",
that is a new path class and I would rather add one deliberately than reuse the governance one.

### CHALLENGE-H — "every gateway connects to a model provider" has two honest exceptions

Agreed as the default, and the third-party gateway not reaching a provider is a real gap. Two
architectures where I do not think it holds: the **MCP server**, where the gateway is the entry
point for inbound tool traffic and inference is not part of the story, and the **low-code
builder**, where the vendor runs the model. I will apply it everywhere else and flag those two
rather than drawing an edge that does not exist.

---

## Part 4 — Research findings

### Third-party coding agents — Claude Code and Cursor (E1–E6)

Your description is confirmed, and the research surfaced a constraint that changes the drawing.

**Claude Code has four inference topologies**, and in two of them the vendor is entirely out of
the path:
- Claude for Teams/Enterprise — CLI → `api.anthropic.com`. Marked *"Most organizations
  (recommended)"* in the docs, which supports your "this is the primary path".
- Cloud provider direct — CLI signs with the org's own AWS/GCP/Azure credentials and calls
  Bedrock / Vertex / Foundry itself. No Anthropic relay.
- Customer-operated LLM gateway — CLI → your LiteLLM-class gateway → provider.
- Claude apps gateway — an Anthropic-authored gateway the customer self-hosts.

**SSO confirms your point exactly.** Enterprise SSO happens at the claude.ai account layer, not
in the CLI: the client opens a browser, authenticates to claude.ai which federates to the org
IdP, and receives OAuth credentials. That path *requires the client to reach the vendor
directly*. The only way to route authentication through your own infrastructure is the Claude
apps gateway, where `forceLoginMethod: "gateway"` runs a device-code flow against your gateway
and your OIDC IdP, with Anthropic out of the flow entirely.

**Remote Control is a relay, and this is worth drawing precisely.** From the docs: *"Your local
Claude Code session makes outbound HTTPS requests only and never opens inbound ports... it
registers with the Anthropic API and polls for work. When you connect from another device, the
server routes messages between the web or mobile client and your local session."* That is
exactly the flow you described, and it confirms the fix already made.

**The finding that changes the architecture: the two paths are mutually exclusive for remote
control.** Remote Control *"is unavailable on Bedrock, Google Agent Platform, Microsoft Foundry,
or whenever `ANTHROPIC_BASE_URL` points at a non-Anthropic host"*. So an organisation that routes
Claude Code through its own gateway **cannot use Remote Control at all**. Gateway sessions also
lose server-side web search, the 1-hour prompt cache, and voice dictation.

That is a real security-architecture trade-off — route through your gateway and gain
credential control, egress policy and audit, but lose the vendor's relay-based remote surface —
and the drawing should carry it rather than showing both paths as freely composable.

**Cursor is the opposite and is worth a contrast note.** Every request transits Cursor's
backend by design, *"because all requests are routed through Cursor's servers for final prompt
building"* — including with BYOK, which additionally voids their zero-data-retention terms.
There is no supported client-side bypass. Cursor's self-hosted pool moves *execution* into your
network but explicitly keeps the loop out: *"The agent loop, including inference and planning,
runs in Cursor's cloud and sends tool calls over this connection."*

**Design consequences:**
1. Draw `harness → vendorService` as the primary path and keep `harness → aiGateway` as the
   documented alternative — both are real, so this is not a banned either/or edge.
2. Add `aiGateway → provider`, which is the customer-gateway path and is currently missing (E3).
3. Record the mutual exclusivity as a deviation, and pin the trade-off rather than implying an
   org gets both.
4. The `exemplars:` block should carry the Cursor contrast, because "all traffic transits the
   vendor" is a materially different posture from "the vendor can be removed from the path".

### The sandbox (E7–E9)

**Docker Sandboxes** (GA 2026-01-30) is the reference implementation and its mechanism is
specific: hypervisor microVM with its own kernel and its own Docker daemon; deny-by-default
egress through a **host-side forward proxy**; UDP and ICMP blocked entirely. One correction to
something I asserted earlier in this project — it is **not** a microVM per session. Sandboxes are
persistent until `sbx rm`.

The single highest-leverage control, and the one the drawing must carry: **credentials are
injected into HTTP headers by the host-side proxy, so raw key material never enters the
microVM**. An exfiltration-capable agent inside the sandbox cannot steal the model key, because
it never has it. That is the strongest argument for the boundary and it is currently absent from
our drawings entirely.

**The boundary has four documented openings**, and these are what the frame's note should name:
1. **Workspace mounted directly** at the same absolute path, read-write, changes propagating both
   ways. `--clone` makes it read-only. This is the biggest opening.
2. **Shared agent skills** — a persistent store shared *across* sandboxes, so a cross-sandbox
   contamination channel.
3. **Local stdio MCP servers run on the host, with host permissions, outside the isolation.**
4. **Egress through the host proxy**, whose allowlist ships with broad wildcards like
   `*.googleapis.com` that Docker's own docs tell you to prune.

**Finding that changes how I draw the frame:** opening 3 is not a Docker quirk — it is the same
gap in all three implementations. OpenClaw states plainly that *"the Gateway process always stays
on the host; only tool execution moves into the sandbox when enabled"*, and its sandbox mode is
**off by default**. Hermes documents that `execute_code`, MCP subprocesses, plugin loading, hook
dispatch and skill loading all sit outside its terminal-backend isolation. So a frame drawn
around the whole tool surface would be a lie: MCP servers and skills straddle it. I will draw the
frame and pin that gap as a risk rather than pretending the boundary is clean.

Hermes is also refreshingly honest about strength — *"deny rules are a guardrail against an
honest-but-wrong agent... not a sandbox against a deliberately adversarial process"* — which is
the right register for the frame's note.

Also worth adding to the catalogue: **Anthropic's `srt` sandbox-runtime** is an OS-level
alternative (macOS Seatbelt, Linux bubblewrap, Windows WFP) that removes the network namespace so
*all* traffic is forced through host-side proxies. Lower friction than a hypervisor on a managed
laptop, and a genuine second exemplar.

### First-party remote control (E10–E12) — it exists, and your instinct was right

Remote steering of OSS harnesses is **the normal 2026 deployment shape**, not a fringe pattern:
- **opencode** ships `opencode serve` and `opencode web`. Auth is **HTTP Basic or nothing**, and
  the docs say so: *"If `OPENCODE_SERVER_PASSWORD` is not set, the server will be unsecured."*
  No first-party relay — remote access is DIY Tailscale/Cloudflare/ngrok.
- **Goose** runs `goosed`, a server with a 103-endpoint REST+SSE API that mobile clients and
  Slack bots connect to over the network. Block drives a *fleet* of them from one Slack thread.
- **pi** has `remote-pi` (v0.7.0, 2026-08-12) — Unix socket locally, **WSS through a relay**,
  Ed25519 identity with QR pairing, and a **default third-party community relay** with no IP
  allowlisting. Also Paseo, a self-hosted app that drives pi, Claude Code, Codex and opencode.
- **LangChain deep agents** is *not* a remote-steering surface — it is a library, and its async
  subagents run against an Agent Protocol server. Agent-to-agent, not human-from-phone. I will
  not draw it as a remote surface.

**On E11 — "it would have to go through something":** mostly right, with one important
exception. Four of the five middle components are real (messaging bridge, self-hosted daemon,
relay/tunnel, orchestration server) — but **direct phone-to-listening-port on the laptop is also
real**, and it is the dangerous one. `opencode --mdns` binds `0.0.0.0` and advertises on the LAN;
the disclosed RCE write-up notes any machine on the same WiFi gained full access.

So: draw the **relay/tunnel** as the component on the remote path (target state), and pin the
direct-port case as the risk. That satisfies your instruction without deleting a real path.

**Two cross-cutting findings that belong in this architecture's prose**, because they are the
whole security story of the category:
1. **The control plane is consistently weaker than the sandbox.** These harnesses converged on
   decent execution isolation while their remote surfaces still ship HTTP Basic, no auth, or
   chat identity. The OpenClaw CVE and the opencode RCE were both *control-plane* failures, not
   sandbox escapes.
2. **The two layers are usually not composed.** Remote steering wired to a local execution
   backend means an internet-reachable prompt surface attached to host-privilege command
   execution. Hermes tracks this as an open issue, not a shipped feature.

### The inference pair (E19, C23–C27) — same five components, different scale

Ollama and LM Studio decompose identically, which is exactly the alignment you asked for:
**local HTTP API server** (OpenAI-compatible, `127.0.0.1:11434` and `:1234`), **inference
runtime**, **weight storage on disk** (content-addressed), **model catalogue/registry**, and a
**CLI/control plane**. LM Studio's `llmster` daemon is its headless server-native form.

The enterprise serving tier shares all five and adds a distinct set. That gives a clean rule for
the two drawings: **the same five blocks with the same names in both, and the cloud one adds the
scale-out lane.**

| Shared, drawn identically in both | Added only in the cloud tier |
|---|---|
| OpenAI-compatible API surface | AI gateway (LiteLLM-class) with virtual keys, budgets, tenant identity |
| Inference runtime / loader | Inference-aware router with prefix-cache-aware endpoint picking |
| Weight storage / node-local cache | Replica fleet with KV-utilisation-based autoscaling |
| Model catalogue or registry | Multi-GPU and multi-node parallelism |
| The same load-time execution risk class | Disaggregated prefill/decode and a KV transfer fabric |
| The same "no authentication by default" | Object storage → streaming weight loader |
| | Shared-GPU multi-tenancy (MIG) and the cross-tenant cache side channel |

**Terminology to standardise across the pair (C26):** `Local HTTP API` on the endpoint and
`Inference API` in the cloud are the same component — I will use **`Inference API`** in both.
`Inference runtime`, `Storage` and `Model sources` already match and stay.

**On the name (C27):** you are right that "open-weights" is wrong. Weights may be open, our own,
or fine-tuned on top of an open base. Proposed titles: **"Self-hosted model inference"** (cloud)
and **"Local model runtime"** (endpoint, unchanged).

**Three facts that should become pins rather than boxes:**
- **Ollama has no local API authentication at all** — the docs say so plainly — and LM Studio's
  API token is opt-in. The localhost bind is the entire trust boundary and it collapses the
  moment the bind address changes. That is the architecture's story, and it is a pin.
- **Weight fetch is the runtime's own job.** The runtime *is* the package manager
  (`ollama pull` → `registry.ollama.ai`). This confirms the direction fix already made, and
  means there is no separate fetch component to draw.
- **Format risk survives the "safe format" upgrade.** GGUF and safetensors remove
  deserialization-by-code-execution but not parser exploitation (CVE-2026-7482 in Ollama's GGUF
  quantization path), not embedded Jinja2 chat templates that execute at inference init, and not
  a poisoned model's behavioural payload. `trust_remote_code` is code execution by design, and
  vLLM shipped a CVE where it was not gated.

**Do not draw TGI.** HuggingFace archived `text-generation-inference` in March 2026 and its own
README now points at vLLM and SGLang. The 2026 exemplars are vLLM, SGLang and TensorRT-LLM.

**The sharpest cloud-only risk to pin:** cross-tenant **prefix-cache timing side channel** —
an attacker measures time-to-first-token to learn whether their prefix matches one cached from
another tenant's request. Active 2025–2026 literature and NVIDIA guidance both exist. Mitigation
is partitioning the cache by tenant. This compounds with disaggregation, because the KV cache
now crosses the network and lands on SSD and object storage.

**Weight integrity has a real answer now:** the OpenSSF Model Signing spec with Sigstore
bundles; NVIDIA has signed all NGC models since March 2025. In the drawing this is a
**verification gate between storage and the loader**, and it is the thing the fine-tuning
architecture's output should be signed with.

### Fine-tuning (C28–C30) — your narrowing is exactly right

The research independently arrives at your seven components: **training dataset store**, **base
model weights source**, **training job orchestrator**, **GPU compute pool**, **training
framework/technique**, **checkpoint store**, **output artifact store**. Its own summary line is
that *"a team can genuinely fine-tune with the seven components above and a spreadsheet."*

And it names explicitly what belongs to a *full MLOps platform* rather than to "we fine-tune a
model": data curation and labelling, dataset versioning, experiment tracking, automated
evaluation and regression harnesses, a governed registry with stage promotion, model cards and
lineage, drift monitoring, CI/CD retraining triggers.

**That settles a tension I flagged earlier.** `Evaluation & red teaming` as a block in this
architecture was previously recorded as an accepted judgment on the grounds that candidates flow
through it. The research says it is platform machinery, not fine-tuning machinery. I agree with
you — remove it, along with `Curation & filtering`, `Model registry` as a promotion gate, and
`Serving & consumers`, and record that we are deliberately overturning the earlier judgment.

One genuinely important detail for the drawing: **the technique determines the infrastructure
shape.** QLoRA collapses a multi-node job onto a single GPU; a full fine-tune needs FSDP or
DeepSpeed ZeRO-3 across nodes with a high-bandwidth interconnect. And **LoRA output is an adapter
directory of megabytes, not a model** — which is why the output store feeds the serving tier as
`--enable-lora` adapters rather than as a replacement model.

The **dataset is the highest-sensitivity artifact in the whole drawing** — proprietary, read by
every worker, and the injection point for poisoning. Its access control and provenance deserve
the densest pins on the page.

### Cloud agents (C1–C13) — LangGraph confirms both of your structural calls

**C1 is right, and the security framing is sharper than I expected.** In-process tools are the
*default and most common* pattern: a `@tool`-decorated function executing in the same address
space, under the same IAM identity, with the same egress and the same secrets as the graph. MCP
is an addition to that, not a replacement. The consequence for a security review is the line
worth putting in the drawing's prose: **the in-process tool set is invisible to any gateway;
only network-reached tool traffic is observable at a chokepoint.** That is exactly why the
harness needs its own tool block distinct from the gateway's.

**C5 is right, and it is the LangGraph default rather than a stylistic choice.** A subagent is
either a compiled graph used as a node (a subgraph) or a compiled graph wrapped as a tool. In
both cases supervisor and subagents are objects in the same process, dispatched by the internal
scheduler — *"no service boundary, no network hop, no separate deployment, and no separate
identity, unless you deliberately introduce one."* So nesting them inside the harness is the
accurate drawing, and a separate deployed agent is the thing that needs justifying.

**A component I had not planned to draw and now will:** the **checkpointer's database**. Anything
beyond in-memory durability forces Postgres into the picture, and it holds full conversation
state, every tool input and output, and any secret that leaked into state. That is a first-class
data store for classification and retention, not an implementation detail. The self-hosted Agent
Server also wants Redis, but only for ephemeral signalling, so it does not earn a block.

**A2A (C6–C7):** now under Linux Foundation governance, v1.0 added **Signed Agent Cards**. The
settled division is *MCP connects an agent to tools; A2A connects agents to each other*, and A2A
earns its keep when the counterpart is an independent system with its own ownership and trust
boundary. Gateway-mediated A2A is prevailing enterprise practice rather than a protocol mandate.

**One correction to C10.** LibreChat's scheduled and agent-triggered workflows are a **Q2 2026
roadmap item, not shipped** as of its 18 Feb 2026 roadmap. Chat agents *elsewhere* do have
scheduling, so the instruction holds generally — but if we model the chat agent on LibreChat
specifically, I will draw the trigger and record that it is roadmap for that exemplar.

**LibreChat's real component set** is heavier than expected and worth honouring: React client,
Node API server, **MongoDB** for conversations, **Meilisearch** for search, and **PGVector plus a
separate RAG API service** for retrieval. Two databases by design. LiteLLM in front is a
long-documented pairing.

### MCP server (C14–C22) — keep it, and the July 2026 spec makes it a controls page

**C15 answered: "Service edge" is control-shaped and goes.** Its items were WAF, rate limits and
routing — the name of a control tier, not a thing we run. Under the provenance test in
CHALLENGE-B it fails, exactly as Egress control does.

**C16 answered: yes, essentially an ASGI app.** FastMCP either runs its own HTTP server or
produces a standard ASGI app mounted into FastAPI. That argues for very few boxes, not for
deleting the page — which is CHALLENGE-F.

**Two operational facts that shape the drawing:**
- **Stateless mode is required to scale horizontally**, because *"sticky sessions do not work
  reliably with MCP clients."* So a replica set behind a load balancer is the honest shape.
- **FastMCP 3.x does not support the 2026-07-28 revision; FastMCP 4.x does but is still beta**
  (v4.0.0b5, 28 Aug 2026). Worth stating in the exemplar, because it means a spec-compliant
  Python server today is a beta dependency.

**C18 — the July 2026 revision is the largest since launch, and it is almost entirely controls:**
- **Statelessness.** Sessions, `Mcp-Session-Id` and the `initialize` handshake are all gone. New
  mandatory `server/discover`. Tool lists MUST NOT vary per connection but MAY vary by the
  **authorization presented on the request** — which is what makes scope-based tool filtering
  legitimate.
- **State handles replace sessions**, and the security burden moved from transport into your
  application: handles MUST NOT be treated as authentication, SHOULD be bound server-side to the
  authenticated principal, and rejected across principals. This is the most likely place for a
  self-hosted server to get it wrong.
- **Gateway routing headers (SEP-2243).** `Mcp-Method` and `Mcp-Name` are mandatory and mirror
  the body, so a gateway can route, meter and authorize **per tool name without parsing the
  body** — the first time MCP traffic is genuinely governable at a chokepoint. Critically,
  servers MUST reject header/body divergence with `-32020 HeaderMismatch`, because a gateway
  routing on the header while the server executes the body is a policy-bypass primitive.
- **Token passthrough is explicitly forbidden**: *"MCP servers MUST NOT accept any tokens that
  were not explicitly issued for the MCP server."* Audience binding per RFC 8707 is a MUST.
- **DCR deprecated in favour of Client ID Metadata Documents**, which creates a **new SSRF
  surface** — the authorization server now fetches a URL the client controls.
- **Enterprise-managed authorization (ID-JAG)** exists as an extension: corporate SSO assertion
  exchanged at the IdP for a short-lived grant, then for an access token, with no per-server
  consent screen and centralised revocation.
- **No tool-level version field exists in the spec.** "Component versioning" is a FastMCP
  framework feature. If we want tool-definition pinning it is something we build at the gateway,
  and the drawing should say so rather than implying the protocol provides it.

That is a dense, high-value pin set on a four-or-five block drawing, which is exactly the shape
you asked for.

### Third-party chat (T1–T10) — one correction you will want

**CORRECTED 2026-08-30 — OpenAI ships a tunnel, and it is real.** My first research pass got
this wrong because OpenAI's docs returned 403 to the fetcher. The component is **OpenAI Secure
MCP Tunnel**: `openai/tunnel-client`, an Apache-2.0 Go daemon the organisation runs inside its
own network. Topology is inverted and outbound-only — the client long-polls
`/v1/tunnels/{id}/poll` and posts responses back, so **no inbound firewall rule is required and
the MCP server stays on RFC1918**. The connector in ChatGPT targets an OpenAI-hosted URL
(`/v1/mcp/{tunnel_id}`), never ours. Auth is a runtime control-plane API key with optional mTLS.

Two things to pin, both from OpenAI's own architecture doc: choosing the tunnel *"does not make
MCP authentication or MCP data flow fully local"* — requests, responses and auth artifacts still
traverse OpenAI, so a private listener is not a local data plane — and the runtime API key on
the tunnel host is the load-bearing credential.

**The vendor asymmetry is the finding worth drawing.** OpenAI ships this; Anthropic's MCP
tunnels are explicitly *not* available for claude.ai. So the same architecture has an
outbound-only path for one vendor and a public-endpoint-plus-IP-allowlist path for the other.

The original, now-superseded finding was: claude.ai connects to a custom MCP server **from Anthropic's cloud
infrastructure, not from the user's device** — so *"servers hosted on a private corporate
network, behind a VPN, or blocked by a firewall won't connect."* The documented remedy is
**allowlisting the vendor's IP ranges to a publicly reachable endpoint**.

And the tunnel that would solve it is explicitly out of scope: *"MCP tunnels created through the
Console are not available as connectors in claude.ai."* Outbound-only tunnelling exists for
Managed Agents and the Messages API, **not** for the chat product. ChatGPT is the same shape —
remote HTTPS endpoint required, local servers must be hosted remotely first.

So the honest drawing for T6 is **an inbound path from the vendor's cloud to a
publicly-exposed endpoint of ours**, not a private secure channel. That changes what the
controls are: audience-bound tokens, per-user OAuth, IP allowlisting and rate limiting on an
internet-facing surface — not a tunnel. I would rather draw that than draw a channel that is not
available.

**T7 — BYOK has a severe trade-off worth pinning.** Anthropic Enterprise CMEK **disables
conversation history search, disables project-knowledge RAG, and disables audit log export**.
OpenAI's EKM is not documented as breaking compliance logging. If SIEM export is a hard
requirement that asymmetry is a genuine vendor decision point, and it belongs on the page.

**T9 confirmed** — vendor service stays one block; their harness internals are assured, not drawn.

**Also worth a pin:** tenant capture. Both vendors offer domain verification and forced account
consolidation, and OpenAI additionally supports a `ChatGPT-Allowed-Workspace-Id` network header.
Anthropic has no header equivalent. Neither governs an employee signing in with a personal Gmail
address — that remains a CASB/proxy problem, which is precisely the finding the drawing's
consumer-tenant path should carry.

### Low-code builder (T11–T13) — you were right, and here is the correct shape

**Everything runs in Microsoft's cloud.** Orchestrator, model calls, session state, the GitHub
Copilot harness sandbox, and **connector execution** all sit inside the Power Platform
environment. **The only customer-operated component in the entire architecture is the
on-premises data gateway** — a Windows service making outbound-only connections, with a hard
2 MB write payload cap.

So there is no AI gateway of ours anywhere in this picture, which is what made the current
drawing nonsense. Corrected shape: user band → vendor band (the platform, its connector runtime,
its sandbox) → our cloud containing only the **on-premises data gateway** and the systems behind
it.

**The crux you asked about — whose credentials — has four modes**, and the governance story is
the second one: **maker-provided credentials** mean every end user of an agent transitively
inherits the maker's access to that backend. That is ambient authority, it is opt-in, and it is
centrally auditable via the agent inventory's `connectionProvider: Maker` field. That single
fact is the architecture's headline risk and its headline control.

**A real publication gate exists**, unlike anywhere else in the catalogue: DLP policy violations
**grey out the Publish button**, and exemptions were removed in 2025 so all agents are subject to
enforcement. Worth drawing as a governance call-out with teeth.

**MCP is not a DLP bypass** — *"if a data policy regulates Power Platform connectors, it also
regulates access to the MCP server and its tools"* — and the MCP wizard requires a public HTTPS
endpoint, so private MCP servers are a gateway-plus-custom-connector workaround rather than a
supported path.

### API/SDK managed runtime (T14–T17) — Claude Managed Agents, announced 2026-04-08

Public beta, priced at token rates plus **$0.08 per session-hour**. Four resources: **Agent**
(model, prompt, tools, MCP servers, skills), **Environment** (where sessions run), **Session**,
**Events**. Defined declaratively over REST — not a container image.

**Three distinct paths back into our systems**, and they are genuinely different architectures:
1. **Remote MCP connector** — Anthropic's cloud calls our endpoint. Needs public exposure.
2. **MCP tunnels** — outbound-only via cloudflared plus an Anthropic-supplied proxy, with inner
   TLS terminated at our proxy so the transport provider cannot read payloads. **Research
   preview, explicitly "as-is" with no uptime or continuity commitment.**
3. **Self-hosted sandboxes** — orchestration stays with Anthropic, **tool execution moves to
   us**, via a worker that polls outbound-only. Tool inputs and outputs still cross back.

**Credentials are Vaults**, per-end-user. The `environment_variable` type is the interesting one:
the secret is stored in the sandbox as an opaque placeholder and **substituted at egress, so the
agent never sees the value**. Two things to pin: **vaults are workspace-scoped, so any API key
with workspace access can reference them**, and **if no credential matches, the connection is
attempted unauthenticated**.

**Two limitations that belong on the page:** cloud sandboxes are **not eligible for Zero Data
Retention or a HIPAA BAA**, and **vault credential values are excluded from customer-managed
encryption** — they sit under Anthropic-managed keys.

## Part 4b — Decisions (2026-08-30, second pass)

| Ref | Decision |
|---|---|
| CHALLENGE-A | **Sandbox restored, with unlimited nesting.** See the nesting design below. |
| CHALLENGE-B | **Confirmed.** The AI gateway is a real hosted tier (LiteLLM) and stays. The provenance test is the rule. |
| CHALLENGE-C | **Superseded** — nesting will carry edges, so nothing is lost. |
| CHALLENGE-D | **A2A goes on the cloud tool services too**, not just external — we may host an agent in our own cloud that the gateway reaches. It lands in `toolServicesRemote`, which covers cloud, vendor and external. |
| CHALLENGE-E | **Chat agent stays separate**, with the human, the browser application layer, *and* a scheduling trigger. |
| CHALLENGE-F | Keep the MCP page, small and pin-dense. |
| CHALLENGE-G | **Solid line, anonymous origin** — see the unbound-origin design below. |
| CHALLENGE-H | **Resolved, and I had it backwards.** In the low-code case our gateway is reached *for tools and data*, not for inference — the vendor calls its own model provider in the external band. So "every gateway reaches a provider" is not a rule; it is a common shape with real exceptions. |

### The crossing rule is removed

You asked what it was for. It came from the spike grammar: *any edge entering or leaving a band
we operate must terminate at a component marked `crossing: true`.* The intent was to force every
path in or out of our environments through a control point we run.

The intent is sound; the rule was not. It encoded an assumption you have now stated plainly is
false — that traffic flows through a **logical sequence of zones**. It does not. A managed
endpoint reaches our cloud, a vendor, or an uncontracted third party *directly*, and a vendor
reaches back into our cloud. Bands are locations, not a pipeline.

Worse, it was a hard build failure, so when an honest drawing had no crossing the only way to
make the build pass was to invent one. That produced four fabricated components across four
architectures. **A rule that renders a drawing dishonest in order to satisfy a layout constraint
is a broken rule.**

Removed: the enforcement, and `crossing: true` from the vocabulary. Kept as an **optional
report** — the build may note an edge leaving a band we operate without passing through a
component carrying an inline capability pin. Informational, never blocking.

### Nesting — proposed design

Requirement: unlimited depth, and nested blocks must still carry edges, pins and items.

**Add `parent: <blockId>` to a block. That is the whole primitive.**

1. A block with children renders as a **container**: a header tab and a padded bounding box
   around its children.
2. **Children are ordinary blocks.** They keep edges, pins, items and capability chips. Nothing
   about flows or arrows changes — this is the property that makes the approach work.
3. **Depth is unlimited and needs no special case.** Sandbox → harness → supervisor and
   subagents is three levels and uses one mechanism.

Two container flavours, distinguished by `kind`:
- **`kind: boundary`** — pure containment with no data path of its own. Dashed border, a label
  tab, no items. This is the sandbox, the vendor application, the shipped-product boundary.
- **A normal block with children** — keeps its solid border and its own items. This is the agent
  harness containing a supervisor and its subagents.

**Layout:** children are laid out on a grid local to their parent; the parent's rect is derived
from that plus padding and header; the parent is then placed on its own parent's grid. Recursion
falls out. Collision checking moves from global to per-container scope.

**Renderer:** React Flow already supports `parentId` — the retired frame code used it — so edges
between nested nodes work without new machinery.

**This replaces `RF_CONFIG` entirely.** Containment becomes data in the architecture file rather
than config in a TypeScript map, which is why it can nest and why the exporter gets it for free.

Cost: the layout engine needs recursive sizing, and the collision checker needs scoping. That is
real work, and it is Wave B.

### Unbound edge origins — proposed design

For the MCP page you want a solid line arriving at the gateway from **nothing** — no source
icon — to say "something calls this, and we are deliberately not naming it because it could be
any of several surfaces."

**Add `kind: origin`.** A block that occupies a grid cell for layout purposes and renders as
nothing. Edges, flows and pins reference it by id exactly like any other block, so no other part
of the grammar changes. The line appears to begin in empty space.

## Part 5 — Sequencing

Grammar and renderer first, because every architecture inherits them. Then the architectures in
dependency order, leaving the ones told to "follow the patterns established by the others" last.

### Wave A — ontology and build ✅ **complete 2026-08-30**

- **Remove the crossing rule** and `crossing: true`, replacing it with an optional non-blocking
  report. Must land first, or removing the invented components will fail the build.
- **Add the provenance test**: a component must be justified by a named exemplar — a tier we
  actually run. Report-only at first.
- **Retire `Egress control` and `Service edge`** from the vocabulary with `deprecated:` redirects.
- **Add A2A** to `toolServicesRemote` (cloud, vendor and external).
- **No gateway→provider rule.** Add the missing edge where it belongs case by case.
- **Nesting**: `parent` on blocks, `kind: boundary`, `kind: origin`; retire `RF_CONFIG`; revert
  the "frame inside a band" deviation.
- **Full controls-as-components audit** (E18) across all 13, using the provenance test as the
  instrument rather than my judgement.

### Wave B — renderer and layout

- **Recursive layout and per-container collision scoping** — the nesting engine.
- **Derive the governance row** from the tallest content band instead of authoring it. Fixes the
  402px and 222px gaps in seven architectures at a stroke.
- **Set a minimum band width** so an actor-only band does not leave a 76px gutter.
- **Pin placement (P3–P5)**: pins move onto the block or the band edge they belong to; no pin
  placed between two bands, and no layout gap opened to accommodate one.
- Re-measure all 13 and confirm every inter-band gap is uniform.

### Wave C — endpoint family

1. **Third-party** (E1–E6): direct SSO path primary, gateway path secondary, `aiGateway→provider`
   added, mutual exclusivity recorded as a deviation, Cursor contrast in exemplars.
2. **Sandbox** (E7, E9) — **personal autonomous agent only**: a `boundary` container, four
   openings named in its note, credential-injection-at-the-proxy pinned, and the
   MCP-servers-run-on-the-host gap pinned rather than hidden by drawing a clean boundary.
   *Scope note:* dropped from first-party per your decision. Recorded so the reasoning survives —
   the justification given (Claude Code, Cursor and Codex ship built-in command sandboxing)
   applies to the **third-party** category; the first-party OSS harnesses are the ones the
   research found weakest here (OpenClaw's `sandbox.mode` defaults to `off`; Hermes states its
   deny rules are *"not a sandbox against a deliberately adversarial process"*). Revisit if that
   category's posture changes.
3. **First-party** (E10–E14): relay/tunnel component on the remote path, direct-port case pinned
   as the risk, Local API server item, LangChain deep agents dropped as an exemplar.
4. **Local runtime** (E15–E19): egress control removed, band disappears, terminology aligned with
   the cloud inference page.

### Wave D — cloud

5. **Inference pair** (C23–C27): same five blocks in both, scale-out lane only in the cloud,
   renamed away from "open weights", prefix-cache side channel and model signing pinned.
6. **Fine-tuning** (C28–C30): narrowed to the seven honest components; curation, evaluation,
   registry-as-gate and serving removed; the earlier accepted judgment overturned in writing.
7. **Agent trio** (C1–C13): harness-local tool services, checkpointer database, supervisor and
   subagents **nested inside the harness as real blocks with edges**, A2A via the gateway, chat
   agent on the same skeleton plus human, browser application layer **and a scheduling trigger**,
   "durable" dropped from the name.
8. **MCP server** (C14–C22): rebuilt small — MCP service, authorization server, tool definitions,
   tenant data, with the gateway as the leftmost entry reached by a solid line from an
   **anonymous origin**. Dense pin set from the July 2026 spec.

### Wave E — third-party

9. **Enterprise chat** (T1–T10): browser block only on the endpoint, vendor as one component,
   our cloud reduced to gateway plus tool services, the MCP connector path drawn honestly as
   inbound-to-a-public-endpoint, CMEK trade-off pinned.
10. **API/SDK runtime** (T14–T17): vendor hosts the harness; three return paths; vaults and their
    two sharp edges pinned; ZDR/HIPAA ineligibility recorded.
11. **Low-code** (T11–T13) **last**: the agent is built and runs in the vendor's platform, which
    calls **its own** model provider in the external band; once built it reaches back into our
    cloud through **our AI gateway to our tool services and data** — so our gateway carries no
    inference here. Maker-credential ambient authority is the headline risk; the DLP publish
    gate is a governance call-out with real teeth. Pin that the vendor's MCP path needs a
    publicly reachable endpoint of ours.

### Wave F — enforcement and verification

- Flip the provenance test from report-only to error.
- Regenerate the audit, update the catalogue doc and the ontology audit.

---

## Part 6 — Task register

The thing to check against so nothing in this plan is forgotten. Tick as landed.

### Wave A — ontology and build ✅ **complete 2026-08-30**
- [x] A1 Removed the crossing rule and `crossing: true`; replaced with a non-blocking observation, which reports **zero** across the catalogue and `crossing: true`; replace with a non-blocking report
- [x] A2 Provenance test as `controlBlockTitles` (report-only; 6 in the rebuild backlog) for components (report-only), then error in Wave F
- [x] A3 `Egress control`, `Service edge`, `Identity & secure edge` and `Governance plane` on the control-block denylist with `deprecated:` redirects
- [x] A4 A2A into `toolServicesRemote` (cloud, vendor, external)
- [x] A5 Audit run — 6 instances found across 4 architectures, cleared per architecture in Waves C–E across all 13 using the provenance test
- [x] A6 Reverted; ONTOLOGY §4a now carries the nesting design and rule 4 is rewritten in ONTOLOGY.md

### Wave B — grammar and renderer ✅ **complete 2026-08-30**
- [x] B1 `parent:` on blocks — recursive containment, unlimited depth
- [x] B2 `kind: boundary` — dashed container, no items, not on the data path
- [x] B3 `kind: origin` — invisible anchor for an anonymous edge source
- [x] B4 Recursive layout sizing (children on a local grid, parent derived)
- [x] B5 Per-container collision scoping — cells, band spans, edge routing and pin checks all scoped
- [x] B6 Retire `RF_CONFIG` — file deleted, containment is data; containment becomes data
- [x] B7 Nested rendering — both renderers, proven to three levels with edges across every boundary in `FlowDiagramRF` **and** the standalone HTML exporter
- [x] B8 Derive the governance row from the tallest content band (fixes 402px / 222px gaps)
- [x] B9 Band width from grid columns so an actor-only band leaves no 76px gutter
- [x] B10 Pin placement — gutter **check** added (report-only; 7 existing violations fixed per architecture during rebuild, flips to error in Wave F). Auto-nudging was tried and abandoned: it moved pins onto blocks, and hiding a placement problem is worse than reporting it: inside a block or on a band edge; never between bands; never open a gap for a pin
- [x] B12 Grid constants retuned — row gap 116→68, column gap 64→44, margins trimmed. Mean ink density 14.5% → 19.6% with no collisions
- [x] B11 Re-measured all 13 in the browser; gaps uniform within every architecture; every inter-band gap uniform

### Wave C — endpoint
- [x] C-1 Third-party: SSO path drawn as primary, gateway path kept, `aiGateway→provider` added, exclusivity and the vendor contrast recorded as deviations, inference split into two flows
- [x] C-2 Personal agent: sandbox restored as a `boundary` container — four openings named, credential-injection-at-the-proxy pinned, MCP-straddle pinned as a risk rather than hidden
- [x] C-3 First-party: `Remote relay` on the remote path, direct-port case pinned, Local API server item added
- [x] C-4 Local runtime: egress control removed, cloud band gone with it, `Inference API` shared with the cloud page

### Wave D — cloud
- [x] D-1 Inference pair aligned — shared `Inference API`, renamed to "Self-hosted model inference", prefix-cache side channel and model signing pinned, egress control removed
- [x] D-2 Fine-tuning narrowed to five blocks — curation, evaluation, registry-gate and serving removed; guidance updated in the same change
- [ ] D-3 Agent trio: harness-local tools, checkpointer database, supervisor+subagents nested as real blocks, A2A via gateway, "durable" dropped
- [x] D-4 Chat agent: browser application layer kept, scheduling trigger added with the note that it removes the in-thread approval the page leans on
- [x] D-5 MCP server rebuilt: five blocks, anonymous origin into the gateway, 13-control pin set from the July 2026 revision

### Wave E — third-party
- [x] E-1 Enterprise chat rebuilt: browser only on the endpoint, vendor as one component, tunnel connector into our gateway, CMEK trade-off and tenant capture pinned, SSE absorption recorded instead of inventing a component
- [x] E-2 API/SDK runtime rebuilt: vendor hosts the loop, the definition is the contract, vault edges and ZDR/BAA ineligibility pinned
- [x] E-3 Low-code **last**: vendor calls its own provider externally; our gateway carries tools and data only; maker-credential ambient authority; DLP publish gate

### Wave F — enforcement and close-out
- [ ] F-1 Provenance test report-only → error
- [ ] F-2 `npm run audit` regenerated; catalogue doc and ontology audit updated
- [ ] F-3 Final Playwright pass over all 13 against the success criteria below

---

### How each architecture is signed off

**Playwright is opened on an architecture the moment it is touched, not at the end.** No
architecture counts as done until it has been screenshotted and read. Working through a wave
without looking is how the 402px gaps survived four commits.

Per architecture, in order:
1. Rebuild it, `npm run data` clean.
2. **Open it in Playwright and screenshot the canvas.** Read the picture, not the YAML.
3. Check it against the criteria below.
4. Only then move to the next one.

**Success criteria (P1–P5), gating each architecture individually:**

| Gate | Check |
|---|---|
| Build | `npm run data` conformant; `npx tsc --noEmit` clean; `npm run audit` diffed for orphaned risks |
| Layout | Playwright screenshot of **each** of the 13; inter-band gaps uniform; no gap between the content bands and the governance band; no band-width whitespace without content |
| **Density** | **Ink density ≥ 30%**, and the whole architecture legible in one glance. Blocks that talk to each other sit adjacent so the arrow between them is short and straight. A block two rows and two columns from the thing it connects to is a layout defect, not a style choice. Baseline before this work was 14.5%; the grid retune took it to 19.6%; the rest comes from re-authoring positions as each architecture is rebuilt. |
| Pins | Every pin inside a block or on a band edge; none floating between two bands |
| Standards | Zero controls-as-components under the provenance test; no zone present without content; no component invented to satisfy a rule |
| Fidelity | Each architecture's exemplars name the researched technology, and the flows match the topology the research established |
