# Verification of the reference architectures, 2026-11-21

Every pattern was checked by an independent reader against current sources: the vendors' own
pages, the MCP and A2A specifications, MITRE ATLAS and D3FEND, and each incident's sources. The
readers changed nothing; they reported findings with evidence and an exact proposed change, and
each change was then applied, adjusted or skipped on its evidence.

## What was checked

On each of the 20 patterns:
- **Data flows:** every walkthrough and scenario step follows a real arrow, in the order these
  systems work today; labels and notes are accurate and plain.
- **Enable:** each pinned control belongs on the pattern and sits on the right box or arrow; its
  "do" says concretely what to do and its "why" what it prevents; nothing important is missing.
- **Control currency:** each pinned id still exists and means the same in the vendored
  catalogues; no step is stale against a specification or vendor change.
- **Settings:** a spot check of three or four settings per product and platform against the
  vendor's current page (about 240 settings in all).
- **Incidents:** facts against sources; the incident is on the right pattern; its steps follow
  real boxes and arrows; its "where it breaks" controls are pinned where the chain passes.
- **Text:** wrong, stale, confusing or padded wording.

| Group | Patterns | Flow steps | Pins | Settings | Incidents | Findings |
|---|---|---|---|---|---|---|
| Endpoint | 5 | 170 | 157 | 80 | 4 | 50 |
| SaaS | 5 | 189 | 84 | 54 | 7 | 48 |
| Hosted agents | 5 | 265 | 104 | 56 | 6 | 40 |
| Other hosted | 5 | not counted | not counted | about 48 | 4 | 36 |
| Catalogues | all | | | | | 26 |

## Catalogues

- **MITRE ATLAS** moved from 2026.09 to **2026.10** (released 2026-10-28). Three pinned controls
  were renamed and redefined: "Maintain an AI Bill of Materials" (AML.M0023), "AI Telemetry
  Logging and Monitoring" (AML.M0024) and "Enforce Access Controls for AI Agent Tools"
  (AML.M0028); the authored profiles now match the new definitions. The new **AML.M0043**, for
  the resources an agent creates or acquires, is pinned on the software factory and on persistent
  managed agents. Two specialisations were re-parented onto the ATLAS entries that now cover them.
  AML.M0040 (adaptive response degradation) and AML.M0041 (privacy-preserving training) are left
  unpinned as optional.
- **MITRE D3FEND** 1.6.0 is still the latest release.
- **CoSAI Risk Map**: the snapshot (afa43cd, 2026-08-07) is behind the latest change
  (a2935926, 2026-10-14), which adds two controls (model and tool registry integrity) and 19
  components. A refresh breaks the build in four places (a superseded-framework check, the band
  rules, the risk-map layout for the new components, and mappings for the new controls) and is
  left as a separate decision.

## What changed

- **136 exact text fixes** applied mechanically, each only where the old text matched exactly
  once, then checked by the build and tests. Three that carried a reviewer's instruction inside
  the replacement text were found and repaired.
- **New pins** (appended, so existing chip numbers did not move): tool permissions, human approval
  and input screening on enterprise AI chat's own connector path; human approval and input
  screening on the low-code agent builder's platform; execution isolation on persistent managed
  agents; authority expansion and journal encryption on the multi-agent workflow; a per-requester
  rate limit on the single agent workflow; spend limits on browser AI and the third-party coding
  agent; a second sign-in factor for the owner's approval on the software factory.
- **Incidents**: McKinsey Lilli moved to the chat agent with tools (McKinsey's own platform); the
  AI-key platforms to the third-party coding agent; the Medicare case to the agent sandbox; the
  ransomware operators to the first-party coding agent. Duplicated GitHub Actions steps left
  incident 04 for incident 10. A new incident, BragJack, is the browser AI pattern's first.
  Breaks now name controls pinned where each chain passes; dead sources were replaced and dates
  and figures corrected (Reprompt in January 2026, the Klue intrusion about a day, the LiteLLM
  KEV entry belonging to Trivy).
- **Settings**: ChatGPT's connected-app approvals (default "Allow low-risk actions"); Claude Code
  on the web's None, Limited and Full network levels; OpenAI dots on by default from 18 November
  2026; Copilot in Edge's CopilotBrowserUse lists; AWS AgentCore Gateway's MCP protocol versions;
  Azure's AKS firewall row; opencode policies; and others.
- **Specification currency**: the remote MCP server pattern follows MCP 2026-07-28 (tool lists
  marked `cacheScope: private`, the gateway refusing requests older than the revision);
  federation dates A2A 1.0 to March 2026 under the Linux Foundation and treats per-skill
  authorisation as the specification's MAY.

## Left open

- AML.M0030 on the chat agent and AML.M0038 on the multi-agent workflow: no existing setting
  delivers either, so they are not pinned yet.
- AML.M0013 (signed releases) on self-hosted inference: the clouds' gateways are managed services
  with no release to sign.
- The CoSAI Risk Map refresh (above).
- The design review in `DESIGN-REVIEW-2026-11-21.md`, for the owner to choose from.

## Neutrality pass, 2026-11-24

The owner asked that the site stop forcing technologies and designs where an organisation
chooses (rules in `NEUTRALITY.md`). Three inventories, five research passes (each checked by a
second reader where it set product facts) and a set of fixes followed:

- **Base patterns:** 80 of 82 opinionated items reworded (designs as outcomes with options,
  environments made general, one mechanism as an example). On four SaaS patterns the tunnel is
  a note on the vendor's arrow, not a box; on the low-code builder the relay likewise; browser
  AI's "AI gateway" is a web inspection point; the multi-agent workflow's supervisor is an
  orchestrator.
- **On-premises:** every box names its role. Options per box, open source and commercial, and
  nine packs: six platform packs (upstream open source on Kubernetes, Red Hat OpenShift AI,
  NVIDIA AI Enterprise, VMware Private AI Foundation, Canonical Charmed Kubeflow, HPE Private
  Cloud AI) and three add-ons (Kong, Gravitee, GitLab Ultimate). The model provider is a choice
  between self-hosted and a hosted API.
- **AWS, Azure, Google Cloud:** the provider's services stay in the boxes, with options where the
  cloud offers several ways and packs (the cloud's own, open source on its Kubernetes service,
  and add-ons). 1,373 options and 26 packs across the four platforms; 267 settings rows tagged
  with the product they belong to, hidden when a chosen pack does not use it.
- **The ≠ marks are gone.** The 482 notes they stood for moved to where a reader acts on them:
  about 257 into settings (with 29 rows added), about 134 into product `watch` notes, opinions
  into options, and 50 differences in shape drawn on that platform's drawing by a new engine
  (insert, move, drop, reroute, rename, add; checked against the layout rules on every changed
  drawing). Two remain as prose because they cannot be drawn honestly: Apigee playing both
  gateway and authorisation server on Google Cloud federation, and Azure Artifacts outside the
  network on the software factory.
