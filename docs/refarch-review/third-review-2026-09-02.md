# Third review (2026-09-02) — independent pass, dispositions

**Status: APPLIED** on branch `refarch-review-updates`, one commit per family. This pass ran
after the layout and walk rework of the same day (engine-placed governance band, boxless
call-outs, condensed grids, connected sequence walks) and reviewed every architecture
against the products it models. Findings were produced by five independent reviewers, one
per family, told to surface only what the two earlier passes ([review-summary.md](review-summary.md))
had not already fixed. Each finding below is applied unless marked **Declined**, with the
reason.

## Cloud agent trio (`e56e32a`)

| # | Finding | Disposition |
| --- | --- | --- |
| S1 | Approval gate has no approver on the drawing | Applied — `operator` actor, escalation edge, "A refund above the threshold escalates" scenario; HITL cited from Policy |
| S2 | Guidance omits pinned credential isolation | Applied |
| S3 | `Search index` vs siblings' `Vector index`; no RAG security | Applied |
| S4 | External-return injection pinned on external→external edge | Applied — risk and defense on `gateway->extTools`, all three |
| S5 | Registry tampering locus differs from siblings | Applied |
| S6 | No post-admission tool integrity | Applied — `capabilityMcpToolSecurity` on Supply-chain, all three |
| M1 | Walkthrough delegates before the supervisor has a plan | Applied — reordered, and the event scenario with it |
| M2 | Temporal exemplar wrong about journal custody | Applied — exemplar, journal note, payload encryption pinned |
| M3–M7 | Guidance gap, index poisoning, injection note, enforcement locus, secrets note | Applied |
| C1–C6 | Approval binding unenforced, no mid-turn brake, RAG security mis-placed, walkthrough never returns, credential isolation, uploads | Applied — external legs became "An approved action lands outside the company" |
| Family | `Sandboxed tools` item only on the multi-agent drawing | **Declined for now** — code execution is common to all three; adding it everywhere is a family decision worth its own change, not a side effect of this pass |

## Coding agents (`38fad90`)

| # | Finding | Disposition |
| --- | --- | --- |
| TP1 | Gateway claims a model path the drawn baseline lacks | Applied — pack dropped, tools and skills listed, edge notes rewritten |
| TP2 | "Only governance is the vendor's" under a drawn governance band | Applied |
| TP3 | Hosted @-mentions and bot-token channel plugins conflated | Applied |
| TP4 | Hooks/settings are executed configuration, carried only in a note | Applied — `Hooks & settings` item registered and drawn in both siblings, with risk and control |
| TP5 | Walkthrough routes a registry fetch through third-party tools | Applied as note fix. **Declined** the new `aiGateway->downstream` "proxied fetches" edge: the mirror *is* the drawn fetch path |
| TP6–TP10 | Zone-2 enforcement, stale-binding reinterpretation, unattended loops, harness port wording, CI-hosted form | Applied (TP7 as a recorded deviation) |
| FP1–FP8 | Gateway CVE stream, mistyped transport risk, mistyped registry risk, vendor remnant, remote admission pin, IGA absorption, kill switch, install label/AI BOM | Applied |
| Family | Vendor = provider collapse | Applied — provider note |

## MCP server, self-hosted inference, training pipeline (`454826a`)

| # | Finding | Disposition |
| --- | --- | --- |
| A1 | Protected Resource Metadata absent | Applied — item, walkthrough discovery step, IGA note |
| A2 | Consent surface contradicts itself | Applied — normative PKCE flow drawn, enterprise profile as the variant |
| A3 | Incident 02's SDK/gateway flaws unpinned here | Applied — risks on `gateway->service` and `gateway`, vuln management cited. The incident's `archetype` stays on the consuming coding agent; both sides are true |
| A4–A8 | Elicitation as the lever, per-scope tool lists, external caller edges, long-lived streams, header/body mismatch scenario | Applied |
| B1 | Serve-time adapter/weight endpoints bypass the gate | Applied |
| B2 | Self-trained artifact enters from the external band | Applied — `Model registry` drawn in our custody, `registry->storage` |
| B3–B7 | Double gating, unpinned network isolation, cache directory, unverified hub-signing claim, prefix-probe scenario | Applied (B5 as loader deserialization, not cache poisoning) |
| C1 | Joined incident's mechanism absent | Applied — mirror CVE stream, read-only-to-jobs, job egress. **Declined** `riskPromptResponseCachePoisoning` on the mirror: the risk is about inference caches |
| C2–C7 | Load-leg deserialization, workload identity, withdrawal, RL rollouts, storage↔registry link, HITL wording | Applied |

## Personal agent and local model runtime (`79535ad`)

| # | Finding | Disposition |
| --- | --- | --- |
| PA1 | The reply is an uninspected second egress | Applied |
| PA2 | Remote Control UI routed over the messaging relay | Applied as removal — edge and item dropped, tunnel path recorded as a deviation rather than a new block (no grid room without breaking the gateway's routes) |
| PA3 | Listening surface attributed to bridges, outside the boundary | Applied — `Local API server` item on the harness, bridges inside the sandbox, pins and scenario re-anchored |
| PA4–PA8, PA10 | Browser control, absorptions, enforcement on every leg, skill prerequisites, rules item, guidance | Applied |
| PA9 | Family drift | Applied for `riskInsecureModelOutput` and the agent registry. **Declined** moving `riskSensitiveDataDisclosure`: on this drawing tool traffic leaves on `harness->gateway`, so the locus is right |
| LI1–LI8 | CORS mechanism, cloud offload, exposed pull, template execution, AI BOM locus, stale note, IGA citation, vLLM | Applied |

## SaaS trio (`c590521`)

| # | Finding | Disposition |
| --- | --- | --- |
| EC1 | Admin-granted corpus has no path | Applied as an item on the vendor block (`Tenant corpus`, registered) with the injection risk, access governance and DSPM. **Modified**: a separate block under the vendor breaks both of the vendor's downward routes |
| EC2–EC7 | Admin consent on our tenants, browser-side detection locus, custom agents, deviation names both pins, gallery provenance, kill switch | Applied |
| LC1–LC7 | Public publication, identity locus, grounding injection, knowledge upload, description sentence, credential isolation, provider band note | Applied |
| MR1 | Vendor-side hosted tools bypass our gateway, undrawn | Applied as an item on the runtime (`MCP & connectors`) with the provenance risk and default-deny policy, recorded as a deviation. **Modified**: no edge — it would cross the front end |
| MR2–MR7 | Tool-gateway item, registry re-registered, tunnel by reference, spend ceilings, delegation at the front end, coding-agent exemplar | Applied |
| Family | Kill switch, vendor assurance, injection convergence, tunnel deviations cross-referenced | Applied. **Declined** adding a low-code incident: the incident catalogue is its own change |

## Effects on the build

- `npm run data` clean after every family; `docs/AUDIT.md` unpinned counts unchanged (2 risks, 3 capabilities).
- New registrations in `vocabulary.yaml`: `Hooks & settings` (Memory & state), `Resource metadata` (MCP service), `Tenant corpus` (Vendor chat service); `Managed runtime` re-registered to what is drawn (`Agent loop`, `Memory store`, `Sandboxed tools`, `MCP & connectors`).
