# Second opinion on RECOMMENDATIONS.md — 2026-10-03

Every finding was checked against the current working-tree YAML, the canonical capability and
risk definitions, and the owner's standing decisions:

1. Nothing in the External band connects into our bands. Vendors reach enterprise services
   only through tunnel → AI gateway → Tool services.
2. Drawings are pruned: one pin per control concept per location. Don't add pins or
   components just to fill gaps.
3. Strict standard vocabulary: same titles and the same item packs everywhere.
4. Simpler is better, but never cut content unasked.
5. Every pin must match its canonical definition.

The review's fingerprints match commit f45883b, so no finding is stale.

**Rechecked 2026-10-04 against commit 003a60d** ("Refresh architecture examples and add
persistent managed agents"). The recommendation documents are unchanged since 2026-10-03
17:08, and the commit changes no pin, edge, block, walk or deviation in the 16 existing
drawings. It contains:

- the example refresh on all 16 drawings;
- prose cuts on the four SaaS drawings. Descriptions shrank by 52–65%: hosted sessions
  610→238 words, managed runtime 681→250, chat 233→100, low-code 281→135;
- the new persistent-agents drawing and its tooling records.

So MV-01–04, MV-06 and GROK-01–06 are done, and every other finding is still open. The
verdicts below stand unchanged.

**Implemented 2026-10-04.** Every Agree and Partly verdict below is applied as its note
describes, and every stretched pin is removed rather than reworded. That takes the catalogue
from 518 to 485 pins. The browser guidance was added. Shared tooling and org example records
were merged or re-keyed to match. The audit now counts 4 risks pinned nowhere: the stale-binding
and cross-tenant risks were only ever pinned as stretches. PLAT-03, CC-04, the challenge in
CC-05, and CA-24 (which adds requirements rather than fixing a false claim) were not applied.

## Owner direction, 2026-10-04 (supersedes the roll-back list below)

- **Examples.** Give a couple of predominant, mainstream products per architecture, not a
  catalogue. The refresh's pruning stands; restore nothing that isn't mainstream. One fix
  remains: the Rovo A2A Gateway link points to the MCP page.
- **Prose.** Condensing is fine unless vital information was lost.
  - Checked: hosted sessions, managed runtime and enterprise chat keep their security facts
    in pin and edge notes. These include the write-capable allowlisted hosts, the initiator's
    approval not counting, the credential placeholder and edge tenant restriction.
  - One contradiction to fix: low-code's description (:15) and zone note (:90) recommend
    staged rollout and deployment pipelines. Its edge note (:306) and walkthrough (:505)
    still say no pipeline is involved.
- **Pins.** Simplify: keep only pins that directly fit their definition. Where a finding says
  a pin is stretched, remove it rather than reword it. These move from Partly to "Agree —
  remove the stretched pin":
  - EP-01 (CTS on the coding drawings), EP-03 (MAN for bind/Origin)
  - CA-03 (action-agent CTS), CA-19 (MAN as authentication)
  - PLAT-01 (chat MFA and AA)
  - LOW-04 (cap-* pins the exported data cannot support)

  EP-04, CA-20, HS-01, MR-02, CHAT-01, PLAT-02, INF-01 and TRAIN-01/02 were already Agree;
  carry them out as removals.
- **Persistent agents.** Rewritten onto the standard vocabulary on 2026-10-04:
  - Tool services and Downstream services are now the standard packs in the External band,
    matching the enterprise chat drawing's connectors.
  - MCP client was added to Managed runtime, and Shell commands to Native tools.
  - Every pin and walk carried over.
- **Unchanged pushbacks.** Don't add pins or blocks, relax packs, or let another service
  replace the AI gateway. The simplification goal reinforces all three.

| Report | Agree | Partly | Disagree | Done |
| --- | ---: | ---: | ---: | ---: |
| Endpoint (EP-01–19) | 10 | 9 | 0 | 0 |
| Cloud agents (CA-01–22) | 7 | 15 | 0 | 0 |
| Platform (INF, TRAIN, PLAT, CHAT, LOW) | 10 | 11 | 1 | 0 |
| Cross-catalogue, hosted, managed, variants (CC, HS, MR, MV, GROK) | 12 | 11 | 0 | 11 |

"Partly" almost always means: the defect is real, but fix it by rewording the note or moving
the existing pin, not by adding a pin, block or band.

## Do these — the review is right

- **Pin meanings (item 1).** These pins say something their canonical definition doesn't:
  - SSO pinned as D3-MFA: EP-02, PLAT-01, MR-02, HS-01.
  - D3-CTS used for filesystem isolation: EP-01, CA-03.
  - riskStaleAgentIdentityBinding and riskCrossTenant used for grants or row filters:
    EP-04, CA-20, CHAT-01, HS-01.
  - Registry withdrawal pinned as a kill switch: TRAIN-01.
  - KV cache pinned as AML.M0031 agent memory: INF-01.
  - Memorisation mapped to riskInferredSensitiveData: TRAIN-04.
- **Normal flows that break their own pins (item 4).**
  - Walks go model → gateway → tool with no harness step: CA-09, EP-18.
  - The chat agent's scheduled write skips the approval it pins: CA-02. Suspend it at the
    gateway; don't remove the scheduler.
  - The local-inference walk bypasses its own wrapper: EP-11.
  - The managed runtime's custom-tool path has no route. Draw it through the AI gateway:
    MR-01, CC-03.
- **Protocol facts.**
  - A2A v1.0 paths and push bodies are wrong, and there is no standard skill selector:
    CA-12, CA-13.
  - "A CLI's TLS session can't be inspected" is wrong, confirmed against vendor docs: EP-06,
    CHAT-02.
  - The guidance credits the gateway on routes that bypass it: MR-03, CA-01 (prose only).
- **Missing browser guidance:** EP-15.
- **Stale deviations:** INF-05, CHAT-04, CA-11 (only the Skills-catalogue deviation).

## Push back — conflicts with a standing decision

- **The AI gateway may be replaced by a receiving service or a data gateway:** PLAT-03,
  LOW-01 (that clause) and item 7. This conflicts with decision 1. LOW-01's fact is right,
  though: the Copilot Studio data gateway connects on stored credentials, not the invoker's
  identity. Record that in the note.
- **CC-05 challenges "nothing external reaches back".** Reject it; the rule is deliberate.
- **Relaxing item packs to subsets, or making A2A, skills and the sandbox optional:** CC-04,
  CA-11, HS-07, LOW-05 and item 8. This conflicts with decision 3.
- **New pins, blocks or bands.** These conflict with decision 2. Relocate an existing pin or
  rewrite its note instead:
  - CA-01 (local pins), CA-04, CA-08 (M0036), CA-15 (data access), CA-19 (AML.M0033), CA-21
  - MR-05 (output encoding), TRAIN-03 (evaluator pins)
  - LOW-02 (re-adding M0029, which the owner pruned in b4eed27), INF-04
  - EP-09 (move the relay to a vendor band) and EP-13 (local workspace block) are owner calls.
- **EP-10 "pick one inference mode"** reverses the owner's 2026-09-03 decision recorded in
  deviation TP:1064. Fix only the direction of the hosted reach-back edge and add its tunnel.
- **EP-14:** don't rename the browser drawing's gateway. "Secure web gateway" was registered
  for exactly this case on 2026-09-10.
- **CA-16:** don't swap to parent AML.M0014. Move the existing cap-* pin to `gateway` so it
  covers both peers.
- **Acceptance criteria** such as stop rehearsals and tested routes are operational tests.
  Don't turn them into pins.

## Earlier roll-back list (superseded by the owner direction above)

Each item below was re-confirmed in 003a60d. Text and examples cut by that commit can be
restored from f45883b.

- **Prose rewrites that cut content no finding asked for.**
  - Shortened by about 40%: hosted sessions (−92/+62 lines), managed runtime (−103/+52),
    enterprise chat and low-code.
  - Lost text includes the incident narrative and the three-identity paragraph. Also lost:
    the escape-hatch analysis, the "aggregate nobody computes" thesis, the M365 zero-click
    anchor, and the credential-inheritance thesis.
  - The low-code rewrite creates a new contradiction: its zone note now says "use supported
    deployment pipelines", but its edge note and walkthrough say there is no pipeline.
  - Recommendation: restore the text and fix only the sentences that are false.
- **Example refresh: 32 removed, 29 added.**
  - Fine: replacing category rows with named products, such as "Terminal CLIs" becoming
    Claude Code, Codex, Copilot and Cursor.
  - Real losses:
    - Comet, Dia and ChatGPT's built-in browser (owner placements from 2026-09-10).
    - Hermes, still referenced in the tooling registry and PA sources.
    - vLLM and SGLang, Axolotl, Zapier and Temporal.
    - The A2A v1.0 and ID-JAG entries.
    - The notes that carried security facts, such as Ollama's cloud-offload warning and
      vLLM's trust-remote-code risk.
  - The new Rovo A2A Gateway link points to the Rovo MCP page. Checked 2026-10-04: that page
    describes only the MCP server.
  - Hermes is still referenced in the personal-agent guidance tools and sources. Goose and
    the desktop apps are still cited in the coding-agent sources.
  - Cowork and ChatGPT Work Cloud are listed on the hosted-sessions drawing, whose walk is
    pull-request-only.
- **UI.** The examples moved above the drawing; nothing was cut. Two things were lost: the
  "dated illustrations, not the taxonomy — the architecture stays vendor-neutral" caveat and
  the count badge. Restore the caveat. The new panel was never checked visually.
- **New persistent-agents drawing.**
  - Its 14 pins are all canonical, and it follows decision 1.
  - It breaks decision 3:
    - Tool services has one item instead of the standard pack.
    - It has two Downstream services blocks, one of them in the Vendor band.
    - The runtime has no MCP client item.
    - Native tools has no Shell commands.
  - It is only weakly distinct from hosted sessions; its topology is a subset of that drawing.
    Consider scoping it as "hosted general-work agents", where approval comes at dispatch
    rather than at a pull request. That would also give Cowork and Work Cloud a correct home.

## Per-finding verdicts

**Endpoint.**

| ID | Verdict |
| --- | --- |
| EP-01 | Partly. Fold the coding notes into the D3-EI pin and drop CTS there. |
| EP-02 | Agree. LI's MFA pin becomes D3-AA. |
| EP-03 | Agree. Merge with the EP-02 fix as one D3-AA pin on the API. |
| EP-04 | Agree. Remove four stretched risk pins and three deviations. |
| EP-05 | Agree, notes only. |
| EP-06 | Agree; verified. |
| EP-07 | Agree, notes. |
| EP-08 | Agree. Move the guardrails to aiGateway. |
| EP-09 | Partly. Owner call. |
| EP-10 | Partly. Edge direction and tunnel only. |
| EP-11 | Agree. |
| EP-12 | Agree. |
| EP-13 | Partly. Prefer note and walk edits. |
| EP-14 | Partly. Keep the name; the internal apps' band is right. |
| EP-15 | Partly. Add the guidance. |
| EP-16 | Partly. Keep the loader risk. |
| EP-17 | Partly. Gateway limits do bound iterations. |
| EP-18 | Agree. |
| EP-19 | Partly. |

**Cloud agents.**

| ID | Verdict |
| --- | --- |
| CA-01 | Partly. Prose and note only. |
| CA-02 | Agree. |
| CA-03 | Partly. Fix the action-agent note. |
| CA-04 | Partly. |
| CA-05 | Agree. Move the pin, don't add one. |
| CA-06 | Partly. |
| CA-07 | Partly; minor. |
| CA-08 | Partly. |
| CA-09 | Agree. |
| CA-10 | Agree. |
| CA-11 | Partly. Delete the stale deviation only. |
| CA-12 | Agree. |
| CA-13 | Agree. |
| CA-14 | Partly. |
| CA-15 | Partly. Move screening and redaction to `gateway`. |
| CA-16 | Partly. |
| CA-17 | Partly. Reword. |
| CA-18 | Partly. One clause. |
| CA-19 | Partly. |
| CA-20 | Agree. |
| CA-21 | Partly. |
| CA-22 | Partly. The route-hijack charge is wrong. |

CA-23 to CA-25 were not assessed.

**Platform.**

| ID | Verdict |
| --- | --- |
| PLAT-01 | Partly. |
| PLAT-02 | Agree. Prune the chat vendor guardrail pin. |
| PLAT-03 | Disagree. |
| INF-01 | Agree. |
| INF-02 | Agree. |
| INF-03 | Agree, notes. |
| INF-04 | Partly. |
| INF-05 | Agree. |
| TRAIN-01 | Agree, and update the guidance in the same change. |
| TRAIN-02 | Agree. |
| TRAIN-03 | Partly. |
| TRAIN-04 | Agree. |
| TRAIN-05 | Partly. |
| CHAT-01 | Agree. |
| CHAT-02 | Agree. |
| CHAT-03 | Partly. |
| CHAT-04 | Partly. |
| LOW-01 | Partly. |
| LOW-02 | Partly. |
| LOW-03 | Partly. |
| LOW-04 | Partly. |
| LOW-05 | Partly. |

**Cross-catalogue, hosted, managed, variants.**

| ID | Verdict |
| --- | --- |
| CC-01 | Agree, as a checklist; no schema change. |
| CC-02 | Agree. The global D3-AA mapping is the owner's call. |
| CC-03 | Agree. Route through the gateway. |
| CC-04 | Partly. Reject the pack relaxation. |
| CC-05 | Partly. Reject the challenge to decision 1. |
| CC-06 | Agree. Relabel, don't delete. |
| CC-07 | Agree. |
| CC-08 | Agree. One sentence. |
| HS-01 | Agree. |
| HS-02 | Partly. |
| HS-03 | Partly. |
| HS-04 | Agree. |
| HS-05 | Agree; half done. |
| HS-06 | Partly. |
| HS-07 | Partly. |
| MR-01 | Agree, via the gateway. |
| MR-02 | Agree. |
| MR-03 | Agree. |
| MR-04 | Partly. Keep Computer use and relabel. |
| MR-05 | Partly. Add M0036 only. |
| MR-06 | Partly. |
| MR-07 | Partly. |
| MV-01–04 | Done. The general-work profile is still open. |
| MV-05 | Partly. |
| MV-06 | Done. AWS's OpenAI preview is not recorded. |
| GROK-01–06 | Done. |
