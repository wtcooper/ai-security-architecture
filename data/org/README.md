# Your organisation's layer

Everything the site says about *your* organisation lives here, in text files, and is compiled
into the app by `npm run data` like every other dataset. Nothing is edited in the UI.

```
data/org/
├── example/                shipped upstream; renders with an "example" label
│   ├── frameworks.yaml     your control standard(s) and risk register, cross-mapped to CoSAI
│   ├── capabilities.yaml   the enterprise layer: your technology and status per capability per surface
│   └── tooling-status.yaml your posture per tool × capability (the product's own settings)
└── local/                  yours. Preferred by the build when present; never shipped upstream
```

## Adopting it

1. Copy `example/` to `local/` and replace the content. `local/` is gitignored in the public
   repository; in your own clone run `git add -f data/org/local` once and commit it. Upstream
   pulls never touch that path.
2. Run `npm run data`. A dangling CoSAI id fails the build with the file and entry named. An
   entry that maps to nothing is allowed and shows as a gap on the Frameworks tab.
3. The `org-taxonomy-customize` skill under `.claude/skills/` walks through the mapping work,
   including how to search for the right CoSAI control, capability or risk id.

## What the files mean

**`frameworks.yaml`** holds any number of catalogues. Each becomes a framework on the
Frameworks tab, grouped under *Your organisation*, and its entry ids appear as badges on the
risk, control and capability cards and in the rails and hover cards of every reference
architecture. Entries are authored your way round: your id, your label, and the CoSAI
`controls`, `capabilities` and `risks` it corresponds to. Ids must exist in `data/cosai/` and
`data/overlay/capabilities.yaml`.

**`capabilities.yaml`** is the enterprise layer: per capability and per surface, the technology
you deploy around the AI tools (an endpoint DLP agent, an SSE, an MDM, a gateway guardrail) and
whether it is in place. This is where "we push managed settings with our MDM" lives: the
managed setting is the product's control, the MDM is the enterprise capability that delivers
it. It renders as the enterprise-capability modules beside every control on each architecture's
Tools tab and as the surface status on the Capabilities tab.

**`tooling-status.yaml`** records, per tool in `data/tooling/`, `available: true|false` — whether
people may install and use it at all — and a status per capability — the product's own settings — with a `note` (the justification: what
you configured) and `evidence` that appear when someone hovers that cell of the Tools grid. Only capabilities pinned on the tool's
reference architecture may carry a status, because that pinned set *is* the reference control
set the Tools tab compares against.

One status vocabulary serves every control in both files: `enabled`, `inProgress`, `gap`.
Nothing is "unassessed": once status is shown, anything not recorded is a gap. A product's own
`available` is deliberately not on that scale — either you provide it or you block it, and how
well an available product is secured is what its control statuses say. A tool not listed is not
available and renders greyed out.

Nothing from this directory renders until the **Show status** switch (beside the Capabilities and
Reference architectures titles) is on; it defaults on when `local/` exists.
