# Reference architecture review rubric — 2026-10-03

## Scope and method

Review all 16 active `data/reference/architectures/*.yaml` designs and their paired guidance. Disabled and archived designs are historical context, not current reference recommendations. Review current working-tree content; do not edit architectures, guidance, vocabulary, code, or existing reports. Another agent is updating `saas-managed-agent-runtime.yaml`; review that design last and record its final fingerprint.

Read `data/ONTOLOGY.md`, `data/PROVENANCE.md`, the existing reference architecture review guide, and relevant vocabulary definitions. Existing rules and reports are evidence of intent, not proof that a design is correct. Check the rules themselves if they force misleading components or mappings.

## Common checks for every architecture

1. **Component semantics:** canonical titles, roles, item packs, ownership, containment, and justified differences from siblings. A shared label must mean the same thing. Do not add boxes just to show controls.
2. **Real flows:** request, response, retrieval, tools/actions, memory, artifact supply and control-plane paths; correct direction, initiating actor, authorization context, trust crossings, and sequence. Flag missing enforcement or bypasses, while avoiding unnecessary infrastructure.
3. **Direct capability placement:** inspect every pin against its actual canonical definition in MITRE or its authored specialization and parent. State the enforcer, protected operation, and concrete failure it prevents, detects, or recovers from. A policy, assessment, encryption, signature, or generic monitoring pin must not imply protection it cannot deliver. Supporting assurance is valid when identified honestly; it must not stand in for an inline control.
4. **Risk semantics:** inspect every risk's actual definition, entry point and consequence. Do not treat all malicious context as training poisoning, all tampering as prompt injection, or all sensitive-data exposure as membership inference. Compare risk-to-capability mappings and acknowledge residual risks.
5. **Reference quality:** least privilege, per-request/session/tenant authorization, untrusted context handling, action approval where warranted, containment, provenance, secrets, observability, and recovery proportionate to the archetype. Identify the smallest credible secure baseline and optional extensions.
6. **Guidance parity:** pins, notes, walkthroughs, scenarios, deviations and paired guidance must describe the same system. Guidance citing a pinned ID is not enough if the pin's definition is wrong.
7. **Evidence:** cite exact file paths, stable block/edge/capability/risk IDs, and line numbers when useful. Consult current primary sources for technical standards and disputed claims. Separate normative standards, official guidance, product examples, and local conventions.

## Finding format

- Stable finding ID; priority P1 (misleading security claim or unsafe/missing essential flow), P2 (material ambiguity, inconsistency or overcomplexity), P3 (clarity/maintenance).
- Classification: defect, conditional defect (state the condition), or design judgment.
- Evidence: file + field/ID + precise current claim; authoritative source where relevant.
- Why it matters; smallest proposed change; impact on paired guidance/siblings.
- Acceptance criterion that a reviewer can check after remediation.

For each design provide a short verdict, inventory counts, pin audit (every pin, concise pass/change/conditional with a reason), risk review, flow review, and actionable findings. Avoid generic best-practice checklists. Preserve useful controls; remove stretched claims rather than manufacture more boxes. Record source SHA-256 hashes at review completion, and recheck if files change.
