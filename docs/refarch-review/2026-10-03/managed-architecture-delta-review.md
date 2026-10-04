# Managed architectures — update verification

## Result

**The hosted coding/desktop and API/SDK managed-runtime versions currently in this checkout were already included in the completed review.** Both architectures and both paired guidance files are byte-identical to `review-final.json` and the isolated review workspace. No newer local version is available to assess, and no finding is resolved by a source change since that review.

This follow-up checks the user's update against the actual reviewed content. It does not assert that a separate agent has finished or that another branch/worktree has been synchronized.

**Assessment amendment:** unchanged source preserves the factual findings, but new product research refines HS-07's design choice. The [coverage supplement](managed-runtime-variants.md) recommends coding/general-work task profiles plus a persistent hosted-agent sibling, and adds API browser coverage. This amendment does not represent an additional source revision.

## Exact comparison

The completed manifest was captured at **2026-10-03 19:23:30 UTC**. The latest commit touching these files in this checkout is `f45883b2081cef6f10f27287d3bbdd5d14e00ba1`, dated **2026-10-03 19:09:29 UTC**, before that manifest. Its subject is “Reference architectures: nothing external reaches back into the enterprise.” There are no uncommitted changes to these four source files.

Comparison source: `/var/folders/bh/yt908vzd1sxcps9yh89bffn00000gn/T/refarch-review-Vuaefa`, located through `/private/tmp/refarch-review-workspace-path`.

| File | Current SHA-256 | Compared with completed review and isolated snapshot |
| --- | --- | --- |
| `data/reference/architectures/saas-hosted-agent-sessions.yaml` | `c5338522f6acbce4e3084d51110d278cf483638b0b815fd678289d8dbfb2ea57` | Identical; zero changed bytes |
| `data/reference/guidance/saas-hosted-agent-sessions.yaml` | `1c0cdc72e1ef119700c300462496b1c76916fd6e920abaef00e0f299f6494443` | Identical; zero changed bytes |
| `data/reference/architectures/saas-managed-agent-runtime.yaml` | `4a70f6a7b48018db1fdaea3ebbadef603b444c703c5732d8095f771c37668691` | Identical; zero changed bytes |
| `data/reference/guidance/saas-managed-agent-runtime.yaml` | `ecae5d5c10552dde2d1f62432503659fa27201d51f4000c962f045ee5de95db4` | Identical; zero changed bytes |

**Exact modifications since the completed assessment:** none in these four files. Therefore there are no added/removed blocks, edges, pins, scenarios or guidance requirements to attribute to a new revision. This result is based on file contents, not modification timestamps.

## What the existing review already accounted for

The [hosted-session assessment](hosted-sessions-review.md) reviewed the 19-block, 15-edge design, including local handoff, remote/channel initiation, schedules, the vendor control plane and hosted runtime, native tools, public package sources, source control and the customer tunnel/gateway. It explicitly recognized that merge review comes after execution and cannot approve or undo the preceding tool effects. It also read the self-hosted worker scenario and the deviation describing the omitted vendor-direct connector path.

The [managed-runtime assessment](managed-runtime-review.md) reviewed the 17-block, 11-edge design, including the visible `managedRuntime->extTools` direct connector route, the application-owned custom-tool handler, closed sandbox egress/disabled web-tool policy, and the customer-owned tunnel/gateway route. Its concerns were assessed against those features, rather than against an earlier design lacking them.

## Hosted-session findings: current disposition

“Keep” below means the prior finding still describes the present source. Conditional findings and design judgments retain those labels; unchanged source does not turn them into universal defects.

| Finding | Disposition | Current-source evidence / remaining action |
| --- | --- | --- |
| **HS-01 — Authentication and risk identities** | **Keep** | `D3-AA@managedRuntime` still describes inventory/owner/expiry; `riskStaleAgentIdentityBinding` still describes orphaned user/App grants rather than model substitution. The tunnel cross-tenant risk still needs two identified tenants and a credential-propagation mechanism. Generic dependency/instruction provenance remains distinct from tool-discovery metadata provenance. |
| **HS-02 — Artifact admission** | **Keep** | `nativeTools->sources` and `riskToolSourceProvenance` still describe dependencies vetted by nobody. The normal reference needs an identified setup/admission verification and rejection step; a destination allowlist alone is insufficient. |
| **HS-03 — Connector bypass** | **Keep** | The deviation “The vendor's own connector path to third parties is recorded, not drawn” remains. `vendorService` may call third-party connectors directly, but only the customer-brokered external route is drawn. Either disable the direct route in the reference baseline or show its actual crossing and separate coverage. |
| **HS-04 — Ownership and flows** | **Keep** | “Source control is drawn in our band whether we host it or rent it” remains. The worker scenario still relocates vendor-zone execution to our worker and calls public `sources` our mirror. The vendor control-plane/runtime request/response representation still needs an explicit consistent abstraction. |
| **HS-05 — Requirements versus product facts** | **Keep** | Guidance still requires a verified human trigger while the design includes automation. The repository-credential headline remains absolute although the body acknowledges products without a proxy. Universal provider/worker/inference statements remain broader than a vendor-neutral requirement. |
| **HS-06 — Precise pin operations** | **Keep** | Input screening still mixes CODEOWNERS/change approval; CTS still mixes recipient scoping with redaction/deletion. Vendor isolation remains conditional on selectable controls versus assurance. Merge approval still does not authorize a live privileged internal tool call, and injection screening still does not establish resource authorization. |
| **HS-07 — Optional feature scope** | **Keep as design judgment** | The same union of coding, desktop, schedules, remote handoff and self-hosted variants remains. Preserve the intended coding/desktop scope if that is the product decision, but provide a desktop-specific completion/approval flow; narrowing to coding is an option, not a factual requirement. The recommendation to avoid unsupported default A2A/optional features still applies. |

No HS finding is marked resolved. HS-07's optional narrowing should not be interpreted as an instruction to remove desktop support without a scope decision; its acceptance criterion is a coherent normal flow for each claimed mode.

## API/SDK managed-runtime findings: current disposition

| Finding | Disposition | Current-source evidence / remaining action |
| --- | --- | --- |
| **MR-01 — Application custom-tool dispatch** | **Keep** | `entry.items.handlers` and the custom-tool scenario remain, but `entry` still lacks a dispatch edge to `aiGateway`/`internalTools` and a local action-policy pin. The stream round trip alone does not show the resource operation or its authorization. |
| **MR-02 — Identity capabilities and risks** | **Keep** | `D3-MFA@entry` still states identity binding without a second factor; `D3-AA@managedRuntime` still states inventory. Stale-model-identity and cross-tenant propagation tags still do not match the credential-lifecycle/theft examples. |
| **MR-03 — Direct connector coverage** | **Keep** | The visible `managedRuntime->extTools` route was already acknowledged positively. Its tool-source pin still says “vetted by nobody”; guidance still says all returned connector/browser content is classified at our crossing, despite vendor-direct traffic and disabled browser tools. |
| **MR-04 — Egress and deployment posture** | **Keep** | The architecture still declares sandbox egress closed while the egress pin allows named package registries/MCP endpoints. Environment items and variants still mix self-hosted/unrestricted options into the otherwise fixed baseline. |
| **MR-05 — Bounds and output consumption** | **Keep as conditional defect** | Session budgets remain in guidance without a workload-bounds pin; output returns through `entry` without a stated inert-rendering or interpreter-specific validation rule. Required controls depend on the actual output consumer and supported runtime limits. |
| **MR-06 — Memory, credentials and vendor policy** | **Keep** | The memory note still says scope setting is the “whole control”; deterministic per-action vendor enforcement still needs precise evidence; existing-session/queued/custom-handler cancellation is not established by alias rollback or credential inventory. |
| **MR-07 — Provider-neutral decomposition** | **Keep as design judgment** | Workspace-vault, credential-substitution, sandbox and provider maturity details remain in generic prose. Retain common component roles, with provider-specific interfaces/availability in dated exemplars. The tool-only AI gateway remains an appropriate canonical role. |

No MR finding is marked resolved. The existing positive assessment of the direct MCP route, opaque vendor loop and tool-only customer gateway remains valid.

## Follow-up acceptance

When a newer revision becomes available in this checkout, compare its content against the four hashes above, then reassess only affected findings and their guidance/flow dependencies. A finding is resolved by satisfying its acceptance criterion, not by renaming a component or citing the same capability at a new location.

This follow-up changed only this new report. Architecture files, paired guidance, review manifests and earlier reports were not edited. No new external technical claims were introduced; the check used current source and the previously completed assessments.
