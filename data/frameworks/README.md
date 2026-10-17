# Framework mappings

CoSAI is the canonical source for components, risks, controls, personas, and its own framework
mappings. Nothing in this layer replaces CoSAI controls or changes CoSAI's NIST AI RMF crosswalk.

| File | What it holds |
| --- | --- |
| `entries.yaml` | Titles and descriptions for the framework identifiers CoSAI and the authored frameworks map to. |
| `nist-csf.yaml` | All 22 NIST CSF 2.0 categories, and an authored crosswalk from CoSAI controls onto them. |
| `../overlay/frameworks-authored.yaml` | OWASP Agentic Top 10, OWASP LLM Top 10 2026 and OWASP MCP Top 10 mappings onto CoSAI risks and controls. |

## NIST CSF 2.0

`nist-csf.yaml` maps 34 of CoSAI's 35 controls at category level, each with a rationale. A
mapping means the control may contribute to the category's outcome; it is not a compliance or
subcategory-level claim. CoSAI's User Transparency and Controls has no CSF mapping; it is not
forced into generic awareness or access control. Four categories have nothing mapped to them
and remain visible on the Frameworks page as findings. `scripts/lib/control-crosswalks.ts`
compiles the file into `authoredMappings`.

## Verification

Run `npm run data` and `npm run test:capabilities`. The build validates every framework entry
reference and rejects unknown controls, missing rationales and duplicate mappings.
