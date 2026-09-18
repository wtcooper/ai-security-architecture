# Vendored MITRE mitigation sources

- D3FEND 1.6.0: complete upstream JSON-LD distribution, including its ontology metadata.
- ATLAS 2026.09: complete release YAML. The bytes were also checked against the release tag.

See [sources.yaml](sources.yaml) for exact URLs, versions, retrieval dates and SHA-256 digests.
License notices accompany each source: [D3FEND](d3fend/LICENSE.md), [ATLAS](atlas/LICENSE).
MITRE D3FEND and MITRE ATLAS names and marks belong to MITRE. Use of the knowledge graph is
also described in the [D3FEND terms](https://d3fend.mitre.org/terms/). This repository's selection,
CoSAI crosswalk and implementation guidance are not endorsed or published by MITRE.

The build resolves only selected D3FEND descendants of DefensiveTechnique and ATLAS mitigation
records. It checks source hashes and rejects profile overrides of canonical names/definitions.
The complete snapshots are build inputs; only selected records enter the browser dataset.
No network request is needed during the data build. Analytical algorithms and offensive
techniques are not imported as defensive mitigations merely because they have IDs.

To update: download a specific release into a new version directory, preserve its notices,
update the source manifest with its real hash, and review changed definitions and all affected
mappings/evidence. Run data validation, mitigation tests, audit and the app build. Never silently
update CoSAI's historical ATLAS threat mappings along with this mitigation layer.
