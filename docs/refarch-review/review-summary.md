# Reference architecture review summary

## Endpoint

- **Third-party coding & desktop agents:** Pick one model path; move controls to enforceable loci; separate AI from general egress; remove stale deviations; complete guidance.
- **First-party coding & desktop agents:** Fix copied vendor claims; redraw package delivery and remote admission; correct egress/control loci; reassess guidance mode and sources.
- **Personal autonomous agent:** Remove obsolete `flows`; make sandbox containment truthful; add the missing skill registry; fix identity, approval, and messaging paths.
- **Local model runtime:** Fetch to quarantine, scan before load; separate governance from endpoint enforcement; correct model/risk claims; add named exemplars.

## Cloud & hosted

- **Single agent workflow:** Eliminate or draw in-process gateway bypasses; move management/egress controls; fix normal trigger and approval flow; reconsider incident assignment.
- **Multi-agent workflow:** Resolve logical-vs-workload identity contradiction; remove duplicate pins; correct delegation/credential controls; add opacity/route-hijack risks and full durable flow.
- **Chat agent with tools:** Show the actual approval round trip; remove unattended triggers; correct tool bypass and external-edge controls; fix memory/retrieval risks.
- **Remote MCP server:** Correct caller ownership and OAuth flow; replace artifact-as-service tool definitions; add real secrets/egress enforcement and more scenarios.
- **Self-hosted model inference:** Add independent artifact promotion; fix source/load direction and management pins; complete inference walkthrough; add extraction and rollback coverage.
- **Fine-tuning/model registry pipeline:** Restore curation, scanning, evaluation, and model-registry gates; separate signing from training; add privacy/adapter/benchmark risks and scenarios.

## Third-party SaaS

- **Enterprise AI chat:** Remove obsolete `flows`; resolve retired tenant-assistant scope; make inspection claims honest; fix vendor connector controls, return flow, and stale-credential coverage.
- **UI/low-code managed runtime:** Remove vendor-internal model topology and obsolete `flows`; govern the tunnel path; separate publication from runtime approval; fix scenarios and lifecycle controls.
- **API/SDK managed runtime:** Add the customer front end; choose a coherent agent-identity model; split declarative vs custom-code variants; relocate management/approval controls and complete scenarios.

---

# Second review (2026-09-01)

An independent second pass over all thirteen architectures plus a cross-catalogue sweep. Every first-review finding now carries a **Second review** verdict column in its recommendations file; additional findings are appended per file; cross-catalogue findings are in `recommendations/cross-catalogue.md` (new).

**Adjudication of the first review: 125 Agree, 35 Modify, 4 Disagree** across 164 findings. The first review holds up well; most Modifys sharpen the fix (usually: resolve at vocabulary/family level rather than in one file, or use a recorded deviation rather than redrawing). The four Disagrees:

- **CA-02** (chat agent): keep the scheduled-trigger edge — scheduled runs coexist with conversation in real deployments, so it is not a banned either/or edge; the defect is that the path is unpinned and unwalked (CA-A1), not that it is drawn.
- **PA-10** (personal agent): do not split the bundled AI gateway — the vocabulary registers exactly that bundle as the catalogue-wide canonical component; splitting it in one drawing is itself the rule-9 family defect.
- **LC-02** (low-code builder): keep the `provider` block — the three-zone rule forbids drawing vendor *internals*, not the vendor's egress to a third party; the edge anchors a real risk and model choice is customer-configurable on real platforms.
- **MCP-04** (remote MCP server): keep `Tool definitions` as a block — it is a registered vocabulary component with a recorded deviation, and the catalogue draws content stores as blocks throughout (Training corpus, Storage); the provenance-test objection would condemn those too.

**54 additional recommendations** (A-series IDs per file), themes in priority order:

1. **Paths that exist only in prose.** The personal agent's enterprise-data chain — "the flow the deployment exists for" — has zero pins and no walk (PA-A1); the managed runtime's hosted browser reaches the open web with no vendor-side egress edge drawn (MR-A1); the first-party coding agent's defining exposure (direct hit on the listening port) has no edge or walk (FP-A3); local inference's headline incident class (routable bind, internet exposure) has no actor or edge and the external band claims "Nothing out here calls in" (LI-A1); the self-hosted inference drawing never draws the "Self-trained model" input both it and the training pipeline promise as their meeting point (SHI-A1).
2. **Risks asserted in notes but pinned nowhere**, and controls pinned with no risk they answer — chat agent's scheduled path, MCP server's SSRF surface at the auth server, delegation-chain opacity on the multi-agent workflow, prompt injection absent from enterprise AI chat despite EchoLeak/ShadowLeak being its cited sources.
3. **Walks that skip the hop where the story happens** — poisoned content "teleporting" into memory (CA-A4), the MCP description-delivery direction never walked (MC-A2), the self-update scenario skipping the delivery legs (FP-A2), a phone-steering scenario using a path its own deviation says is disabled (TP-A1).
4. **Stale grammar surviving the rebuild** — dead `flows:` sections in three files, the repudiated sandbox-frame deviation repeated on three drawings (one now factually false about its own file), decayed third-party coding-agent deviations, denylisted names in notes.
5. **Family drift outside `distinguishedBy`** — copy-pasted vendor language in the first-party file, pin loci differing between siblings without argument, the `aiGatewayTraffic` pack asserting a Model proxy on three gateways that broker no inference.

**Cross-catalogue verdicts on the two known-open items:** of the 7 unpinned risks, 4 are genuine gaps (delegation-chain opacity, benchmark manipulation — which reveals the training pipeline's missing evaluation gate — adapter/PEFT injection, route hijacking) and 3 correctly absent; of the 12 unpinned capabilities, 6 are gaps (staged rollout, vendor assurance/SSPM, drift detection, AI detection & response, model hardening, EDR), 2 lean-gaps, 4 correctly absent.

**Highest-leverage fixes:** restore the evaluation gate to the training pipeline (closes a risk gap, an orphaned vocabulary pair, and a title/drawing mismatch at once); resolve the sandbox-frame deviation triple against ONTOLOGY §4a's own ruling; purge the dead `flows:` sections and stale deviations; fix the `aiGatewayTraffic` pack lie once at vocabulary level; pin and walk the personal agent's enterprise-data chain.
