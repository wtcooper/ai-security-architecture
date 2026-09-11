# data/tooling/ schema

The YAML block in `data/tooling/README.md` is the canonical schema; this page carries the rules
and conventions around it rather than repeating it.

## Layout

```
data/tooling/
├── README.md              schema, inclusion rule, research protocol, coverage status, exclusions
├── vendors.yaml           attribution + vendors: [{ id, name, url?, trust? }]
└── <vendor>/<family>.yaml one file per product family; vendor: and family: at file level, tools: inside
```

## Build rules (scripts/build-data.ts, checkTooling)

Vendor exists; id unique and `^tool[A-Z]`; name, family, asOf, summary, ≥1 surface class (all
known); each variant's class is in `surfaceClasses`; the architecture exists, and there is exactly
one per entity (no secondary architecture); every `controls[].capability` is pinned on that
architecture and listed once; coverage in enum; each step has title + body; each risk note names a
pinned risk; every link/source/advisory has title + url; ≥1 source. Steps are optional on a row; the convention is that `native` and
`partial` rows have them and `none` / `external` / `unknown` rows carry a `note` instead.

## Conventions

- **Coverage**: `native` the vendor ships an admin-settable control; `partial` part of it;
  `external` only via a third-party product placed around the tool; `none` nothing offered;
  `unknown` could not verify (say why in `note`). On a personal agent the "admin" is the person
  running it, so `native` means settable in the product's own config.
- **The first step's URL is the configure link.** In the grid the coverage word itself is the
  link (except `none`, which never links), so `steps[0].url` must be the page an administrator
  performs the step on. Coverage carries no colour of its own: colour on that screen means the
  organisation's status, from `data/org`.
- **Canonical `facts` labels**, in this order: `Plans`, `Inference & routing`,
  `Data leaving the device`, `Retention & training`, `Docs index`, then anything
  product-specific (`Network requirements`, `Vendor ownership`, …).
- **Dates**: `asOf: "2026-09"` (quoted, month precision) on the entity; `verified: "2026-09-10"`
  on each row; `advisories[].date` as `"2025-10"`.
- **Header comment** of each file: the two-line schema pointer, then exclusions specific to the
  family, then a short fetch log of URLs that redirected or failed during the last verification.
- **Ids are stable**: guidance documents and `data/org/*/tooling-status.yaml` reference them.
