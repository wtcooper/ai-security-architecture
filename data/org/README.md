# Your organisation's layer

Everything the site says about *your* organisation lives here, in text files, and is compiled
into the app by `npm run data` like every other dataset. Nothing is edited in the UI.

```
data/org/
├── example/                shipped upstream; renders with an "example" label
│   ├── frameworks.yaml     your control standard(s) and risk register, cross-mapped to CoSAI
│   └── tooling-status.yaml your posture per tool × capability
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

**`tooling-status.yaml`** records, per tool in `data/tooling/`, an adoption decision and a
status per capability. Only capabilities pinned on the tool's reference architecture may carry a
status, because that pinned set *is* the reference control set the AI Tooling tab compares
against.
