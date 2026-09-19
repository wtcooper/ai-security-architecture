# Capability layer: three questions, three pages

Date: 2026-09-19. Branch: `capability-layer`. Revised the same day after review: the first cut
added a 16-entry abstract catalogue between controls and the pins. That duplicated the controls
and was dropped. This is the model that stands.

## Why

The three questions the app must answer, in order:

1. What types of control does the business need against AI risk, and what is our status in
   delivering them?
2. Where are the gaps, and what capability do we need to procure or build?
3. For each kind of AI application, on which surface, where in the data flow must a control be
   enforced, and how do named products (Claude Code, Cursor) of that kind fare?

The SAIF/CoSAI story is introduced, exposed, mitigated. The reference architectures show where
a risk is exposed for one archetype and which capability pins there. The organisation overlay
colours that pin enabled, in progress or gap.

## Target model

| Layer | Source | Role | Status? |
| --- | --- | --- | --- |
| Risks | CoSAI | Threat side | no |
| Controls | CoSAI | The function the business needs ("Agent Execution Bounds") | rolled up |
| **Capabilities** | MITRE D3FEND + ATLAS, plus authored specialisations | The actionable countermeasure at a place in the data flow ("Outbound Traffic Filtering on the sandbox egress"); the pins on every drawing | **yes, the only authored status** |
| Technology categories | OWASP, ENISA, ECSO | How a capability is bought: the technology dimension of its realisation | no |
| Tools | registry | Named products; each an instance of one reference architecture | per capability |

A capability is a MITRE mitigation. The 59 MITRE entries are the citable vocabulary. Where one
MITRE entry is too coarse to report on, an authored **specialisation** carries a local `cap-*`
id and exactly one MITRE parent: Generative AI Guardrails (AML.M0020) splits into prompt
injection screening, sensitive-data redaction, output policy enforcement and retrieval grounding
checks. Specialisations are the pin unit where they exist; they inherit the parent's controls,
surfaces and definition unless they override them, and they restore the pre-MITRE capabilities
the migration collapsed.

In data and code the record is still called `mitigation`, because its identifier is MITRE's.
The app calls the layer **Capabilities**. That is deliberate and documented; a data-level rename
would churn every architecture, guidance and tool file for no gain.

Status is authored in exactly two places, both keyed by capability id (MITRE or `cap-*`):

- `data/org/<profile>/capabilities.yaml`: per capability and surface (enterprise layer).
- `data/org/<profile>/tooling-status.yaml`: per product and capability (tool layer).

A parent's status is the rollup of its own records and its specialisations'. Control status is
the rollup of the capabilities that support it. Nothing else carries status.

## Navigation

- **Risk map** unchanged.
- **Controls**: 35 CoSAI controls as a grouped list beside one entry, with a rolled-up status
  pill under the overlay. The detail lists the capabilities that deliver the control.
- **Capabilities** (top-level): the pin catalogue as a matrix, control group by surface,
  coloured by status, with a gaps-only toggle. The detail shows the MITRE definition, the
  authored implementation scope, where it is pinned, the technology categories that realise it,
  any process items, and the organisation's records.
- **Architectures** unchanged in role. The rail lists pinned capabilities under their control
  group. The Tools tab has one row per pinned capability, technology-category pills beside it,
  product columns with vendor coverage and org status.
- **Incidents** unchanged.
- **Reference** dropdown: Components, Risks, Personas, Frameworks. Mitigations are no longer a
  separate page; `/mitigations` redirects into Capabilities.

## Data changes

1. `data/overlay/technology-categories.yaml` (was technology-capabilities): ids stay `tech-*`,
   type `TechnologyCategory`, no surfaces, mitigation and framework mappings unchanged.
2. New `data/overlay/specializations.yaml`: 17 `cap-*` specialisations, each with one MITRE
   parent, a `legacy` list of the retired ids it restores, an authored implementation, and
   optional overrides of controls, surfaces, examples, risks and process items. Compiled into
   the mitigation list at build time; the MITRE-id rule applies to parents only.
3. Data migration (`scripts/specialize-capabilities.mts`, one-off, idempotent): re-point pins,
   guidance items, enforcement vocabulary and tool rows from a parent to the specialisation
   wherever the retired id they were migrated from is in that specialisation's `legacy` list.
   Tool rows split back into the original rows with their original coverage and verified date.
   The shipped org example is regenerated from the archived originals on the same rule.
4. `data/org/*/capabilities.yaml` entries map `capability:` to a MITRE id or a `cap-*` id.
5. Build validation: specialisation parents exist, controls are subsets, surfaces well-formed;
   pinned ids resolve to a capability that applies on the architecture's surface; org records
   only on applicable surfaces; per-tool records name a capability pinned on the tool's
   architecture (itself, its parent or a specialisation).

## Phases

- **Phase 1, data**: types, specialisation loader, migration script, org example, tests green.
- **Phase 2, UI**: Capabilities page, Controls detail, Tools tab rows, search, navigation.
- **Phase 3, docs and skills**: README, data/org/README, ONTOLOGY, PROVENANCE, both skills.

## Out of scope

Renaming `mitigation` keys in data. An ATLAS technique lens on risks. A workflow model for
process items; they are prose.
