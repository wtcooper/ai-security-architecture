# Architecture examples and persistent agents — implemented 2026-10-03

**Presentation update, 2026-10-04:** product names now appear as a single opening sentence in
the description. The separate examples section and visible dates were removed; source dates
remain in the maintained data. The checks below record the original October 3 presentation.

## Result

All **17 reference architectures** now show their examples above the diagram, beneath the architecture summary. The catalogue contains **53 dated examples**, sourced from official provider/project documentation and checked for October 2026. Each entry names the relevant execution mode and briefly explains the fit. Architecture search includes example names and notes.

The existing `exemplars` records supply the visible introductions. The former collapsed example section has been removed, so each example is maintained and displayed once. The diagram's component names remain vendor-neutral.

## New persistent reference

Added `archPersistentManagedAgents` and its guidance, with **OpenAI Dots** and **Grok Bot** as the initial examples. It reuses all existing component titles and item labels: 12 blocks, six edges, 14 capability placements and ten risk placements. The normal flow produces a draft from approved records; a separate flow shows approval before a consequential browser action.

The reference distinguishes backend connectors from browser sessions, continuing context from task lifetime, and customer configuration from supplier assurance. Local execution, private-network routes and delegated agents require additional reviewed flows when enabled.

Added `toolOpenaiDots` and moved `toolGrokBot` to the persistent reference. Updated the OpenAI Agents API record for browser origin/sign-in approval semantics. Grok's Team Bot, tracing and lifecycle evidence now carries its scope explicitly. Unsupported claims remain unknown or partial: browser egress cannot be credited from a shell-network switch, and credential custody does not establish transmission scoping.

## Selection and maintenance

Examples favor recognizable providers and established projects. A beta or preview from a mainstream provider is labeled by its actual mode/status; selection does not claim measured market share or certify that the product implements the whole reference.

The endpoint/cloud [selection notes](exemplar-refresh-notes.md) document the 33 examples in those families. SaaS examples cover enterprise chat, visual builders, coding/general-work sessions, managed APIs and persistent agents. Dots, Grok and API capability evidence remains in the tooling records with its own verification dates.

Short examples do not imply a completed product control assessment. New example-only entries without detailed tooling records include Google ADK, Rovo A2A Gateway, NVIDIA NIM, Hugging Face Transformers, Gemini Enterprise app/Workflow Builder, Amazon Quick Automate and ChatGPT Work Cloud. Existing tooling exclusions remain documented in `data/tooling/README.md`.

`data/PROVENANCE.md` now calls for quarterly checks and updates when a launch, retirement or hosting change affects the example. Refresh the name, mode, note, URL and date together; do not copy provider lists into summary prose or blanket-update historical control verification dates.

## Verification

- Data compilation and generated audit pass: **17 architectures, 16 guidance documents, 42 tools**. Existing vocabulary remains conformant with **65 component titles and 128 item labels**.
- All **10 capability tests and six tooling-grid tests** pass, including canonical references, HTML-export pin resolution and product coverage handling.
- TypeScript and targeted ESLint checks pass. Production build succeeds.
- Server-rendered checks confirm all **53 examples appear above the diagram controls on all 17 pages**. Results: [exemplar-render-checks.json](exemplar-render-checks.json).
- Independent review checked new flows, pin meanings, product mappings and UI placement. The in-app browser was unavailable, so interactive visual validation remains unperformed.

The earlier review manifests describe the original 16-architecture snapshot. Broader remediation items in [RECOMMENDATIONS.md](RECOMMENDATIONS.md) remain a work queue; this change implements the exemplar refresh, visibility and persistent-agent reference, with related product corrections.
