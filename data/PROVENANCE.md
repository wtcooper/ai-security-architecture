# Data provenance

## CoSAI Risk Map (CoSAI-RM)

`data/cosai/*.yaml` is a verbatim snapshot of the `risk-map/yaml/` directory from:

- **Repository:** https://github.com/cosai-oasis/secure-ai-tooling
- **Pinned commit:** `afa43cd605674bcbaa5b1420f7b018ee23b4e8d6` (2026-08-07)
- **License:** Apache License 2.0
- **Copyright:** © Google LLC, contributed to the Coalition for Secure AI (CoSAI), an OASIS Open Project.

Refresh with `npm run fetch:cosai` (see `scripts/fetch-cosai.ts`), which rewrites the
snapshot from the commit recorded in that script. Bump the SHA there and here together.

The upstream JSON Schemas that describe these files live at `risk-map/schemas/` in the
same repository and were used to derive `src/lib/types.ts`.

## SAIF tour seed

`data/overlay/saif-tour-seed.json` records, for each of the 15 risks in Google's original
public SAIF Map, which component boxes were highlighted during the Introduced / Exposed /
Mitigated steps of the tour.

- **Source:** https://saif.google/secure-ai-framework/saif-map
- **Extracted from:** `https://www.gstatic.com/marketing-cms/reviewed-scripts/prod/saif-1.3.14-318a3a1/styles/default/All.min.js`
- **Extracted on:** 2026-08-10 by `scripts/extract-saif-tour.ts`

This is factual mapping data (risk → component identifiers), used only as a seed for our
own `data/overlay/risk-components.yaml`. No SAIF prose or artwork is redistributed here —
all displayed descriptions come from the Apache-2.0 CoSAI-RM snapshot above.

## Framework entry reference text

`data/frameworks/entries.yaml` gives every external-framework identifier CoSAI maps onto a
name and a one-sentence description. CoSAI publishes bare identifiers only, so without this
the Frameworks tab shows `AML.M0003` with nothing to read. Each block records its own source:

- **MITRE ATLAS** — `dist/ATLAS.yaml` at tag `v5.0.1`, the version CoSAI's mappings declare.
  Labels are ATLAS names verbatim; descriptions are the first sentence of the ATLAS
  description. Two identifiers CoSAI stamps `@5.0.1` (`AML.T0034.002`, `AML.M0028`) were not
  defined until later; their text comes from `v5.6.0` and each carries a note saying so.
- **OWASP Top 10 for LLM 2025** — the opening of OWASP's own Description section for each
  entry, from the project's `2_0_vulns/` source files, trimmed to the definitional sentences.
- **STRIDE** — Microsoft's own wording for each category, from the Threat Modeling Tool
  documentation, with the security property each category threatens.
- **NIST AI RMF 1.0** — subcategory text verbatim from the NIST AI RMF Playbook
  (`airc.nist.gov`). The short labels are ours; NIST publishes the subcategories without one.
- **ISO/IEC 22989:2022** — clause 5 ecosystem roles. The standard's text is not openly
  licensed, so these describe each role as the standard defines it rather than quoting it.
  The only block here that is not the framework's own words.

`npm run data` fails if CoSAI maps to an identifier with no entry, and reports any entry
nothing maps to — except for OWASP and STRIDE, where the full published list is shown on
purpose so unmapped entries read as gaps in CoSAI's cross-reference.

## Overlay

`data/overlay/risk-components.yaml` is original work in this repository. Each entry records
`source: saif` (translated from the seed above) or `source: authored` (written for the 21
risks CoSAI added after the SAIF donation, derived from each risk's own `tourContent`
prose, `lifecycleStage`, and mapped controls).

## Incidents

`data/incidents/*.yaml` is original work. Every incident and every flow step carries its own
`sources` list of public reporting; those links are rendered in the UI.
