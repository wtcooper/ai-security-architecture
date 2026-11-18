# The organisation's two files

`data/org/controls.yaml` and `data/org/products.yaml` are the only files an organisation edits
to record its position. Both ship empty. `data/org/README.md` says what each one changes on
the site, and the header comment of each file lists its fields.

## `data/org/controls.yaml`: the organisation's own controls

```yaml
controls:
  - id: SEC-014                      # the organisation's own identifier; never shown on a page
    name: Workforce sign-in with phishing-resistant MFA   # what pages show
    status: enabled                  # enabled | inProgress | gap; leave out if not assessed
    maps: [D3-MFA]                   # a MITRE id (data/overlay/mitigations.yaml)
    link: https://policies.example.com/sec-014   # optional: policy, standard or evidence
  - id: SEC-031
    name: Secure web gateway for AI traffic
    status: inProgress
    maps: [cap-agent-egress-control, D3-OTF]   # one of yours can map to several catalogue controls
    note: Rolled out to engineering; the rest of the company by Q2.   # optional: shown beside the name
  - id: SEC-032
    name: Agent sandbox network allowlist
    status: enabled
    maps: [cap-agent-egress-control]           # and several of yours can map to the same one
```

Rules the build enforces (`scripts/lib/enablement.ts`, `checkOrgControls`):

- `controls` is a list of rows;
- every row has an `id`, and no `id` is used twice;
- every row has a `name` that is not empty;
- `status`, if present, is `enabled`, `inProgress` or `gap`;
- `maps` lists one or more control ids in the catalogue (a MITRE id or a `cap-*`
  specialisation from `data/overlay/specializations.yaml`), none of them twice;
- `link`, if present, is an https address, and `note`, if present, is text;
- only `id`, `name`, `status`, `maps`, `note` and `link` are accepted.

A row may leave `status` out: the control is recorded and mapped but not yet assessed. Status
is one value per row, not per surface or per product. There is no status and no display name
on a catalogue control: pages show the catalogue control's own name, with the organisation's
controls listed beneath it by name. Ids, the organisation's and the catalogue's, are never
shown on a page.

Rollups (`scripts/lib/enablement.ts` for a catalogue control, `src/lib/data.ts` for the rest):

- a catalogue control takes the rollup of the rows mapped to it;
- a MITRE parent with no row mapped to it takes the rollup of its specialisations;
- a CoSAI control takes the rollup of the parent controls that support it;
- a rollup is Enabled only when every part is enabled, a Gap when every part is a gap or
  unset and at least one is a gap, and In progress otherwise. Nothing set at all reads Not set.

## `data/org/products.yaml`: the products the organisation uses

```yaml
products:
  toolClaudeCode:                    # a tool id (data/tooling/)
    status: enabled                  # enabled | testing | notEnabled
    note: Engineering only           # optional: shown on hover
    settings:
      requireSso: { status: enabled }
      sandboxEnabled: { status: testing, note: Pilot group only }
  cloudAzure:                        # or a platform id (data/clouds/)
    status: enabled
    settings:
      apimValidateToken: { status: enabled, link: "https://git.example.com/platform/terraform-ai-gateway" }
      foundryDisableLocalAuth: { status: testing, value: Off in two legacy projects, note: Being migrated }
    components:                      # platforms only
      gateway: { uses: Kong AI Gateway (platform team), link: "https://git.example.com/platform/ai-gateway" }
      archChatAgent/memory: { uses: Azure Database for PostgreSQL with pgvector, note: Approved store for chat history }
    hosting:                         # platforms only
      containerApps: { status: enabled }
      aks: { status: testing, note: Platform team pilot }
```

Rules the build enforces (`scripts/lib/products.ts`, `checkProductStatus`):

- every key under `products` is a tool id or a platform id;
- a product accepts only `status`, `note`, `settings`, `components` and `hosting`;
- every `status` is `enabled`, `testing` or `notEnabled`;
- every key under `settings` is a setting id that product lists; a setting takes `status`,
  `value`, `note` and `link` (https);
- `components` and `hosting` are accepted on a platform only. A `components` key is a
  component id, or `<pattern id>/<component id>` for one pattern, and its entry takes `uses`
  (required, at most 60 characters), `link` (https) and `note`. A `hosting` key is a hosting
  option id on a pattern mapped onto that platform, and its entry takes `status` and `note`.

Anything not listed reads "Not enabled".
