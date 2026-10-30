# The recommended baseline

Every setting row in the registry (`settings:` on a tool, and on a cloud implementation in
`data/clouds/`) carries one **recommended** value. This file is the rubric those values come from,
so the same intent gets the same recommendation for every vendor.

## Who the baseline is for

A large professional-services firm: tens of thousands of staff, client-confidential data in
everyday work, a central IT and security function with MDM, an identity provider and a SIEM, and
a business that wants people using AI tools productively. It is **not** a regulated-trading or
defence posture. The test for every value: *would a sensible security team at a firm like that
turn this on by default, without it costing people the reason they use the tool?*

So the baseline:

- **Turns on what is cheap and closes a real path.** SSO, audit export, no training on our data,
  MCP and extension allowlists, the vendor's sandbox where it exists.
- **Keeps the useful thing useful.** Web search stays on; connectors to the firm's own systems
  are allowed through admin approval; agents may edit and run commands with the vendor's
  standard approval prompts.
- **Leaves the strict version as a note, not the value.** Where a regulated team would go
  further (no web access, no third-party connectors, every tool call approved), the row's
  reason says so in one clause.

## The values, by area

| Area | Baseline |
| --- | --- |
| **Identity & access** | SSO through the corporate IdP required; MFA enforced at the IdP; SCIM provisioning and de-provisioning on; sign-in pinned to the organisation's tenant on managed devices; personal accounts and personal API keys blocked on managed devices; admin roles held by a named few. |
| **Data & retention** | No training on organisation data (contractual default on enterprise plans — confirm, don't assume). Retention as the vendor's enterprise default or shorter where the setting exists — 30 days is reasonable; zero-data-retention only where a client contract asks for it. Inference routed to the organisation's approved provider or region. Sharing outside the organisation off; public links off. |
| **Tools & extensions** | MCP servers, plugins, extensions and connectors: allowlist, admin-approved; user-added ones off. Built-in sandbox on where the product has one. Approval prompts left on for file writes and commands; the "skip all approvals" mode disabled. Deny rules for credential and secret paths. Auto-run of repository-supplied hooks and config off until the workspace is trusted. |
| **Network** | Web search and fetch allowed (it is why people use the tool). Egress from sandboxed or cloud agents limited to an allowlist the organisation maintains; package registries through the organisation's mirror where one exists. Corporate proxy and TLS inspection supported. |
| **Audit & monitoring** | Audit and usage logs exported to the SIEM; per-tool-call telemetry (OpenTelemetry or equivalent) on, prompt text redacted by default; admin activity logged; compliance or eDiscovery API enabled where the plan includes it. |
| **Sharing & collaboration** | Org-internal sharing allowed; external sharing and publishing off; remote and mobile control of local sessions off unless a team has a reason. |

## Rules for writing a row

1. **One value.** "On", "Off", an allowlist, a number — never "consider". If the right value
   depends on something, pick the baseline and put the dependency in `why`.
2. **Say the default.** A row whose default already equals the baseline still earns its place
   when the setting is security-relevant: it tells the reader not to weaken it.
3. **`why` is one line** and names the path it closes: "stops a cloned repository's hooks running
   before the folder is trusted", not "improves security".
4. **Security-relevant only.** A setting is in scope when it changes who can use the tool, what
   data leaves or is kept, what the agent can reach or run, or what the organisation can see
   afterwards. Feature toggles with no security effect are left out.
5. **Sourced.** The setting's exact name as on the vendor's page, a `url` that resolved on the
   `verified` date, and the plan it needs in `requires` when it is not on every plan.
