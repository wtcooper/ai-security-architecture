# Your organisation's layer

Everything the site says about *your* organisation lives here, in text files, and is compiled
into the app by `npm run data` like every other dataset. Nothing is edited in the UI.

```
data/org/
├── example/                shipped upstream; renders with an "example" label
│   ├── frameworks.yaml     your control standard(s) and risk register, cross-mapped to CoSAI
│   ├── mitigations.yaml   the enterprise layer: your technology and status per mitigation per surface
│   └── tooling-status.yaml your posture per tool × mitigation (the product's own settings)
└── local/                  yours. Preferred by the build when present; never shipped upstream
```

## Adopting it

1. Copy `example/` to `local/` and replace the content. `local/` is gitignored in the public
   repository; in your own clone run `git add -f data/org/local` once and commit it. Upstream
   pulls never touch that path.
2. Run `npm run data`. A dangling CoSAI id fails the build with the file and entry named. An
   entry that maps to nothing is allowed and shows as a gap on the Frameworks tab.
3. The `org-taxonomy-customize` skill under `.claude/skills/` walks through the mapping work,
   including how to search for the right CoSAI control, mitigation or risk id.

## What the files mean

**`frameworks.yaml`** holds any number of catalogues. Each becomes a framework on the
Frameworks tab, grouped under *Your organisation*, and its entry ids appear as badges on the
risk, control and mitigation cards and in the rails and hover cards of every reference
architecture. Entries are authored your way round: your id, your label, and the CoSAI
`controls`, `mitigations`, technology `capabilities` and `risks` it corresponds to. IDs must
exist in `data/cosai/`, `data/overlay/mitigations.yaml` or
`data/overlay/technology-capabilities.yaml`, respectively. Technology references use `tech-*`
repository keys. These are explicit mappings: an org mapping to a broad MITRE mitigation is
not automatically a mapping to every technology category that can implement it.

**`mitigations.yaml`** is the enterprise layer: per mitigation and per surface, the technology
you deploy around the AI tools (an endpoint DLP agent, an SSE, an MDM, a gateway guardrail) and
whether it is in place. This is where "we push managed settings with our MDM" lives: the
managed setting is the product's control, the MDM is the enterprise mitigation that delivers
it. It renders inside the Mitigations column on each architecture's Tools tab and as the surface
status on the Mitigations tab. Technology categories and CoSAI controls do not inherit a
fulfillment status from those associations.

**`tooling-status.yaml`** records, per tool in `data/tooling/`, `available: true|false` — whether
people may install and use it at all — and a status per mitigation — the product's own settings —
with a `note` (the justification: what you configured, or why a gap is a gap) and optional
`evidence` that appear when someone hovers that cell of the Tools grid. The shipped example has
a note on every control of every product it runs; it is the template — keep the products you
run and rewrite the notes. Only mitigations pinned on the tool's reference architecture may
carry a status, because that pinned set *is* the reference control set the Tools tab compares
against.

One status vocabulary serves every control in both files: `enabled`, `inProgress`, `gap`.
Nothing is "unassessed": once status is shown, anything not recorded is a gap. A product's own
`available` is deliberately not on that scale — either you provide it or you block it, and how
well an available product is secured is what its control statuses say. A tool not listed is not
available and renders greyed out.

Nothing from this directory renders until the **Show org data** switch (beside the Mitigations and
Reference architectures titles) is on; it defaults on when `local/` exists. The Tools grid
always keeps CoSAI controls, MITRE mitigations and technology capabilities in its first three
columns. Enabling the overlay adds org mappings below each standard name and appends product
columns with availability and status. There is no separate selector for org row names.

## Mitigation identifier migration

Use native MITRE identifiers such as `D3-EI`, `AML.M0020` and `AML.M0031`. The prior
`capability…` identifiers are retired. Run `npm run migrate:capabilities -- data/org/local`
for a preview, then append `--write` to migrate. Split/merged scope never inherits an
`enabled` assertion automatically: it becomes `inProgress` with the original record retained.
Reassess each function and update its status, note and evidence; clear `migration.reviewRequired`
only after review. Broad mitigations such as guardrails need feature and boundary evidence.

## Separate Mitigations schema

After the legacy-ID migration (if needed), run `npm run migrate:mitigations` to preview
renaming live `capability`/`capabilities` fields to `mitigation`/`mitigations` and the posture
file to `mitigations.yaml`. Add `-- --write` to apply. The conversion preserves
`migration.original` verbatim and is idempotent. Technology capabilities are a separate
OWASP/ENISA/ECSO category layer with CISA and NIST cross-references. They do not inherit
organization posture; keep assessment records against the actual MITRE methods and product
settings. See [the mapping contract](../frameworks/README.md).
