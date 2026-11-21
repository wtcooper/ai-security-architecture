# Cloud mappings: what was checked, corrected and left open

Each hosted pattern is mapped onto AWS, Azure and Google Cloud in `data/clouds/`. On 18 November
2026 every one of the 24 pattern-and-cloud mappings was checked against the vendor's current
documentation: each component row (does the service exist under that name, and does it play that
role), each flow on the drawing (does traffic on that cloud go the way the drawing says), the
supporting services a builder also needs, and a sample of at least ten settings per mapping.
This file is the record. The on-premises mapping (`data/clouds/onprem.yaml`) was authored the
same day, each row from the project's own documentation, and is listed at the end.

## How to read the result

- **The drawing is shared by every cloud, and that was the right call.** The trust boundaries,
  the controls and where each control goes do not change with the vendor. No component row
  named a service that does not exist.
- **A renamed box is not the whole story.** On every cloud some flows do not run the way the
  drawing shows unless the builder makes a deliberate choice: the model call goes direct by
  default, web search is a feature of the model platform that bypasses the gateway, the code
  sandbox is a separate service with no outbound network. Each mapping now lists these as
  `differences`; the drawing marks each with ≠ and How it works lists them.
- **A builder needs more than the boxes.** Identity, network and egress, keys, secrets,
  registries, logging and ingress are listed per mapping as `alsoNeeded`.
- **Settings drift.** Rows verified three weeks earlier had already moved: products renamed,
  features retired or limited to some regions or editions, and several rows that claimed more
  than the vendor's page supports. Those rows were corrected and re-dated.

## What was checked

### AWS

| Pattern | Components | Confirmed | Outdated | Wrong | Differences recorded | Also needed | Setting rows questioned |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Single agent workflow | 11 | 10 | 1 | 0 | 3 | 10 | 4 |
| Agent-to-agent federation across platforms | 12 | 12 | 0 | 0 | 8 | 10 | 5 |
| Agent sandbox for RL & evaluation | 12 | 12 | 0 | 0 | 7 | 8 | 6 |
| Multi-agent workflow | 13 | 13 | 0 | 0 | 8 | 11 | 6 |
| Chat agent with tools | 12 | 12 | 0 | 0 | 8 | 11 | 6 |
| Remote MCP server you publish | 6 | 6 | 0 | 0 | 10 | 11 | 5 |
| Self-hosted model inference | 7 | 7 | 0 | 0 | 9 | 12 | 6 |
| Model training & release pipeline | 9 | 9 | 0 | 0 | 6 | 8 | 4 |

### Azure

| Pattern | Components | Confirmed | Outdated | Wrong | Differences recorded | Also needed | Setting rows questioned |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Single agent workflow | 11 | 10 | 1 | 0 | 7 | 10 | 5 |
| Agent-to-agent federation across platforms | 12 | 11 | 1 | 0 | 6 | 10 | 5 |
| Agent sandbox for RL & evaluation | 12 | 12 | 0 | 0 | 7 | 9 | 3 |
| Multi-agent workflow | 13 | 12 | 1 | 0 | 9 | 10 | 6 |
| Chat agent with tools | 12 | 11 | 1 | 0 | 8 | 11 | 6 |
| Remote MCP server you publish | 6 | 5 | 1 | 0 | 8 | 7 | 5 |
| Self-hosted model inference | 7 | 7 | 0 | 0 | 7 | 10 | 4 |
| Model training & release pipeline | 9 | 9 | 0 | 0 | 8 | 10 | 4 |

### Google Cloud

| Pattern | Components | Confirmed | Outdated | Wrong | Differences recorded | Also needed | Setting rows questioned |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Single agent workflow | 11 | 11 | 0 | 0 | 6 | 10 | 7 |
| Agent-to-agent federation across platforms | 12 | 12 | 0 | 0 | 10 | 10 | 1 |
| Agent sandbox for RL & evaluation | 12 | 12 | 0 | 0 | 9 | 10 | 8 |
| Multi-agent workflow | 13 | 13 | 0 | 0 | 11 | 10 | 4 |
| Chat agent with tools | 12 | 12 | 0 | 0 | 8 | 10 | 5 |
| Remote MCP server you publish | 6 | 6 | 0 | 0 | 6 | 8 | 4 |
| Self-hosted model inference | 7 | 7 | 0 | 0 | 7 | 9 | 6 |
| Model training & release pipeline | 9 | 8 | 0 | 1 | 8 | 9 | 3 |

## What was corrected

Every finding was traced to a row and the row rewritten from the page cited; each corrected row
carries `verified: "2026-11-18"`. Where a vendor feature does less than the row claimed, the row
now says so and says what the builder adds.

### AWS (`data/clouds/aws.yaml`): 26 rows corrected

- `archActionAgent/planner`: The note called Amazon Bedrock Agents a current managed alternative; it now says AgentCore harness is the managed alternative and Bedrock Agents is Agents Classic, in maintenance mode and closed to new sign-ups (the cited harness page does not say this, the Bedrock agents page does). ([page](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html))
- `gatewayRateLimits`: The row said 'calls per minute on tools' and only that limits fail open; it now names requests per minute per target and tool and tokens per minute on inference targets, and says limits fail open, are skipped when a dimension cannot be resolved and are approximate at low rates, so they are not a security boundary (also covers the first '?' finding). ([page](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-rate-limits.html))
- `agentRegistryApproval`: The row claimed only approved records become gateway targets; it now says approval only makes a record searchable, that the target gate is your pipeline plus IAM on CreateGatewayTarget, and that the registry sits under the agent-registry namespace with the preview bedrock-agentcore namespace ending 30 October 2026 (also covers the second '?' finding). ([page](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/registry-create-manage.html))
- `policyEngineEnforce`: The row named Cedar only; it now says policies are written in Cedar or in Dogwood, because the page keeps Cedar as the policy language and adds Dogwood as a second supported language rather than renaming it (third '?' finding). ([page](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy.html))
- `policyGuardrailPromptAttack`: The row promised checks on every request everywhere; it now says guardrails in policies run in seven Regions only and that elsewhere the builder calls Bedrock Guardrails from an interceptor or agent code. ([page](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-guardrails-in-policies.html))
- `policyGuardrailOutput`: Same Region limit added: seven Regions only, not Frankfurt, Ireland or Paris, with the builder's fallback stated. ([page](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-guardrails-in-policies.html))
- `gatewayOboExchange`: The row implied the gateway performs the exchange against any issuer; it now says AgentCore Identity only brokers it, the authorization server must support the token-exchange or JWT-bearer grant (Microsoft is preconfigured), and Cognito's token endpoint takes neither, so the exchange runs against the corporate IdP. ([page](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/on-behalf-of-token-exchange.html))
- `cognitoResourceBinding`: The row did not say binding works only through managed login; it now says so and that machine-to-machine clients such as peer agents cannot be bound and are limited by app client and scopes instead. ([page](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-define-resource-servers.html))
- `privateLinkEndpoints`: The row named bedrock-runtime and bedrock-agentcore for every pattern and linked the Bedrock-only page; it now asks for an endpoint per service the workload calls, lists the AgentCore, Bedrock, VPC-mode runtime and SageMaker cases, says OAuth callers of AgentCore need Principal * in the endpoint policy, and links the general PrivateLink page. ([page](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/vpc-interface-endpoints.html))
- `containmentRedTeam`: The row had agents attack platform services under the AWS policy; it now scopes the red team to your own configuration and says the policy forbids assessing AWS services, lists AgentCore under services prohibited for outbound testing and does not permit SageMaker, so those need agreement from AWS Support first. ([page](https://aws.amazon.com/security/penetration-testing/))
- `codeArtifactOrigin`: The row treated the repository with an external connection as a fixed mirror; it now states the real defaults (public packages get Upstream ALLOW, so new versions enter on request), adds package group origin controls, and says to set Upstream to BLOCK after review for a fixed mirror. ([page](https://docs.aws.amazon.com/codeartifact/latest/ug/package-origin-controls.html))
- `networkFirewallDomains`: The row said anything not listed is dropped; it now says a plain Allow list trusts the stated server name or Host header, drops other HTTP and HTTPS only under default action order and leaves other protocols alone, and recommends adding the AWS_ROUTE_53_RESOLVED_DOMAIN target type and rules for other protocols. ([page](https://docs.aws.amazon.com/network-firewall/latest/developerguide/stateful-rule-groups-domain-names.html))
- `runtimeStopSession`: The row said the runbook stops every live session; it now says StopRuntimeSession stops one session by ID, no API lists a runtime's live sessions, so the application must record session IDs, and browser and code interpreter sessions are stopped separately. ([page](https://docs.aws.amazon.com/bedrock-agentcore/latest/APIReference/API_Operations.html))
- `runtimeExecutionRole`: The row named gateway, memory and model actions for every pattern; it now starts from the documented role (ECR pull, logs, X-Ray, metrics), adds only what the workload calls, and says to remove the sample's bedrock:InvokeModel on all foundation models unless the agent calls Bedrock directly. ([page](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-permissions.html))
- `lambdaInvokePolicy`: The row asked for a resource-based statement for the SQS mapping; it now asks for one statement for the EventBridge rule only and says Lambda polls the queue with the function's execution role, so the queue and mapping creation are what to restrict. ([page](https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-configure.html))
- `agentWorkloadIdentity`: The row implied tokens are fetched for the agent; it now says nothing delivers workload access tokens on Lambda, so each step calls GetWorkloadAccessTokenForJWT (or ForUserId) itself, with setVia gaining code and the link moved to the token page. ([page](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/get-workload-access-token.html))
- `runtimeVpcMode`: The link covered VPC mode but not enforcement; the row now names both condition keys and the four operations the SCP denies, and links the condition keys page. ([page](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/security-vpc-condition.html))
- `cognitoTokenLifetime`: The row recommended 15 minutes for all clients; it now recommends one hour for managed login user clients, because a shorter value does not shorten the one-hour sign-in cookie, 15 minutes for machine clients, and sending signed-out users to the logout endpoint (refresh token rotation was confirmed on the refresh tokens page). ([page](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-access-token.html))
- `gatewayInboundJwt`: The row said allowedScopes per tool and denied only NONE; it now says allowed scopes are one list for the whole gateway with per-tool checks in the policy engine or an interceptor, that allowedAudience applies only where tokens carry aud, and that the SCP denies both NONE and AUTHENTICATE_ONLY. ([page](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-inbound-auth.html))
- `runtimeInboundJwt`: The row set allowedAudience for all callers; it now says Cognito puts aud only in user tokens that asked for resource binding, so runtimes called by machine-to-machine clients are limited by allowedClients and allowedScopes instead. ([page](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-define-resource-servers.html))
- `gatewayResponseInterceptor`: The row had the RESPONSE interceptor log request, completion and tenant; it now has the REQUEST interceptor log the request and tenant and the RESPONSE interceptor the completion, and states the buffered-mode and 6 MB limits, with the link moved to the interceptor types page. ([page](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-interceptors-types.html))
- `vllmApiKey`: The row recommended --load-format safetensors and cited the security page for flags it does not cover; it now keeps --trust-remote-code at its default of off (confirmed on the CLI page), drops the load-format advice because the flag takes one value and S3 streaming uses it, and lists the path prefixes the key covers and the ones it leaves open. ([page](https://docs.vllm.ai/en/latest/usage/security.html))
- `releaseDigestCheck`: The row implied S3 holds a SHA-256 checksum and a model signature; it now says S3's default checksum is CRC64NVME, SHA-256 must be requested at upload, and signature verification is entirely the loader's code. ([page](https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity.html))
- `smConditionStep`: The row named an evaluation step type that does not exist; it now says the evaluation is a Processing step whose report one Condition step reads, and that condition steps cannot be nested. ([page](https://docs.aws.amazon.com/sagemaker/latest/dg/build-and-manage-steps-types.html))
- `smTrainingKms`: The row attributed inter-container traffic encryption to the storage encryption page; it now limits name and where to the volume and output keys and says traffic between nodes is a separate job setting, EnableInterContainerTrafficEncryption, which can lengthen training. ([page](https://docs.aws.amazon.com/sagemaker/latest/dg/encryption-at-rest-nbi.html))
- `comprehendPii`: The row said Comprehend scans and redacts every record; it now says detection covers English and Spanish only, the real-time call only locates entities in documents up to 100 KB so the curation job redacts the spans itself, and Comprehend's own redaction is an asynchronous batch job. ([page](https://docs.aws.amazon.com/comprehend/latest/dg/how-pii.html))

### Azure (`data/clouds/azure.yaml`): 30 rows corrected

- `archActionAgent/events`: Service named Event Grid as a trigger; it now reads Azure Service Bus queues and Container Apps jobs, with a note that event-driven jobs run per queue message and scheduled jobs cover timers. ([page](https://learn.microsoft.com/en-us/azure/container-apps/jobs))
- `archAgentFederation/memory`: Service used the old product name; it now reads Azure Cosmos DB and Foundry IQ (formerly Azure AI Search), with a note that the role is unchanged. ([page](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq))
- `archAgentWorkflow/state`: Service and note used the old product name; they now name Foundry IQ as the new name for Azure AI Search (service shortened to fit under 70 characters). ([page](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq))
- `archChatAgent/memory`: Service used the old product name; it now reads Azure Cosmos DB and Foundry IQ (formerly Azure AI Search), with a note that the role is unchanged. ([page](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq))
- `archRemoteMcpServer/authServer`: Note said clients are only pre-registered; it now gives the oauth21/2026-08 authorization server address and says clients are pre-registered or, in public preview, named by a Client ID Metadata Document that Entra fetches (service kept, the long correction went into the note). ([page](https://learn.microsoft.com/en-us/entra/agent-id/client-id-metadata-documents))
- `groundednessDetection`: Row did not mention retirement; name, recommended and why now say the feature retires on 30 April 2027 and point to Foundry evaluation tooling or your own grounding check. ([page](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/groundedness))
- `apimMcpServers`: Row promised per-tool policies; it now says policies apply to all tools of an MCP server and that per-tool rules need separate MCP servers or checks in the tool server (also covers the unnamed finding on archActionAgent). ([page](https://learn.microsoft.com/en-us/azure/api-management/mcp-server-overview))
- `searchDocumentAccess`: Row used the old product name and assumed a user was always present; it now names Foundry IQ (Azure AI Search), REST API 2026-10-01, and says the filter needs a delegated user token so unattended runs need their own index or security filters in code (also covers the unnamed finding on archActionAgent). ([page](https://learn.microsoft.com/en-us/azure/search/search-document-level-access-overview))
- `agentOperatorApproval`: Unnamed finding matched to this row: the name gave only the C# function; name and recommended now give ApprovalRequiredAIFunction for C# and approval_mode on the @tool decorator for Python. ([page](https://learn.microsoft.com/en-us/agent-framework/agents/tools/tool-approval))
- `apiCenterInventory`: Row asked for registration with an owner; it now gives the Assets registration path and says the form has no owner field, so the owner goes in a custom metadata property. ([page](https://learn.microsoft.com/en-us/azure/api-center/register-discover-mcp-server))
- `apimA2aApis`: Row claimed per-skill policies on each operation; it now says policies sit at the whole A2A agent API, only JSON-RPC agents are supported, and per-skill authorization is done in your agent code. ([page](https://learn.microsoft.com/en-us/azure/api-management/agent-to-agent-api))
- `a2aPayloadRedaction`: Row claimed returned artifacts are redacted in policy and used the old service name; it now names Azure Language, limits gateway redaction to task requests and says response artifacts must be redacted in agent code because response bodies cannot be deserialized. ([page](https://learn.microsoft.com/en-us/azure/api-management/agent-to-agent-api))
- `apimQuotaByKey`: Row did not mention tier limits; it now says the policy page lists only the classic tiers and tells the builder to confirm on a v2 tier or fall back to rate-limit-by-key, and gives the A2A Policies path. ([page](https://learn.microsoft.com/en-us/azure/api-management/quota-by-key-policy))
- `entraAppRoles`: Url pointed at a page that does not cover member types or assignment; it now points at the identity platform app roles page, with the Create app role and API permissions assignment path and a note to define roles only for app-only access. ([page](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-app-roles-in-apps))
- `entraAgentIdentity`: Button label was wrong; where now reads New agent identity (Preview). ([page](https://learn.microsoft.com/en-us/entra/agent-id/create-delete-agent-identities))
- `firewallEgress`: Row described only a Container Apps subnet; where and recommended now also cover the AKS node subnet with outbound type userDefinedRouting and the AzureKubernetesService FQDN tag, so it is true on the sandbox pattern too (url kept on the Container Apps page used by three patterns). ([page](https://learn.microsoft.com/en-us/azure/aks/limit-egress-traffic))
- `appInsightsOtel`: Row named the Azure Monitor OpenTelemetry Distro; name and where now name the Microsoft OpenTelemetry Distro (microsoft-opentelemetry) for new apps, with the Azure Monitor distro kept for Java and existing apps. ([page](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable))
- `aksWorkloadIdentity`: Row asked for a service account per rollout; it now asks for one per trust group or namespace and states the limit of 20 federated identity credentials per managed identity and the propagation delay. ([page](https://learn.microsoft.com/en-us/azure/aks/workload-identity-overview))
- `piiRedaction`: Service was called Azure AI Language; name and where now say Azure Language (in Foundry Tools). ([page](https://learn.microsoft.com/en-us/azure/ai-services/language-service/personally-identifiable-information/overview))
- `artifactsUpstream`: Row implied the default limits what enters the feed; default, recommended and why now say it only blocks public versions of names that already have a private version, and that the Collaborator role must be held only by a reviewed admission pipeline. ([page](https://learn.microsoft.com/en-us/azure/devops/artifacts/concepts/upstream-behavior))
- `wafRateLimit`: Url and location were for Azure Front Door; they now point at Application Gateway WAF v2 rate limit rules, with the engine requirement and approximate thresholds stated. ([page](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/rate-limiting-overview))
- `entraApplicationIdUri`: Row named requestedAccessTokenVersion and a canonical-URL rule the page no longer gives; it now says to set a URI that uniquely identifies the server, repeat it as the metadata resource value, v2.0 tokens only, and gives the oauth21/2026-08 authorization server. ([page](https://learn.microsoft.com/en-us/entra/agent-id/secure-mcp-server-with-entra-id))
- `entraApiScopes`: Row presented per-operation scopes and Admins only consent as vendor guidance; it now says Microsoft only asks for the delegated scopes clients need (example mcp.access) and that scope splitting and consent rules are your own design. ([page](https://learn.microsoft.com/en-us/entra/agent-id/secure-mcp-server-with-entra-id))
- `apimValidateToken`: Row said the gateway checks the role each operation needs; it now says one role check covers a whole MCP server and per-tool role checks belong in the tool server's handlers. ([page](https://learn.microsoft.com/en-us/azure/api-management/expose-existing-mcp-server))
- `apimRateLimitByKey`: Row keyed the counter on appid and was located under MCP servers only; it now uses the v2.0 azp claim, covers the model API as well, and notes no Consumption tier and the v2 token bucket algorithm. ([page](https://learn.microsoft.com/en-us/entra/identity-platform/claims-validation))
- `servingModelRecord`: Row read as if Azure enforced the registry reference; it now says the reference is your own convention that nothing in AKS or KAITO enforces, so the release pipeline must reject manifests without one. ([page](https://learn.microsoft.com/en-us/azure/machine-learning/how-to-manage-models))
- `aksGpuNodeTaints`: Row did not cover KAITO; it now says taints apply to node pools you create and that Microsoft does not document taints on the pools KAITO provisions, so check them or run vLLM on your own tainted pools. ([page](https://learn.microsoft.com/en-us/azure/aks/use-node-taints))
- `defenderMalwareScanning`: Row did not mention limits; it now says blobs over 50 GB are not scanned and long scans can time out, so large weight, checkpoint and dataset files need a check in your own promotion step. ([page](https://learn.microsoft.com/en-us/azure/defender-for-cloud/introduction-malware-scanning))
- `foundryRedTeaming`: Row implied portal or cloud runs against your own endpoint; it now says to use the local Azure AI Evaluation SDK run (preview) with a callback, needs a Foundry project in a supported region, and the url points at the local-run page. ([page](https://learn.microsoft.com/en-us/azure/foundry/how-to/develop/run-ai-red-teaming-cloud))
- `aksPodSandboxing`: Row did not fit the training pattern or mention Defender; it now says it is an AKS setting on Azure Linux node pools that in a training pipeline covers only model-generated-code steps run on the sandbox's node pools, and that Defender for Containers cannot assess Kata pods (kept on archTrainingPipeline because the build needs it for D3-EI). ([page](https://learn.microsoft.com/en-us/azure/aks/use-pod-sandboxing))

### Google Cloud (`data/clouds/gcp.yaml`): 28 rows corrected

- `archTrainingPipeline/evaluation`: The binding named Agent Platform model evaluation, which scores only predictive image and tabular models; it now names the Gen AI evaluation service in a pipeline step, and the note says red teaming is builder-supplied. ([page](https://docs.cloud.google.com/gemini-enterprise-agent-platform/machine-learning/evaluation/introduction))
- `modelEvaluationGate`: The row cited the predictive model evaluation page; it now names the Gen AI evaluation service (renamed Gemini Enterprise Agent Platform Evals), links its overview, and says memorisation tests and red teaming are not features of the service and must be supplied. ([page](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/evaluation-overview))
- `agentEvaluation`: Finding ? (rename) and the workflow finding: the name now gives Gemini Enterprise Agent Platform Evals with the former name, and where names the SDK and agents-cli the page documents instead of a console path. ([page](https://docs.cloud.google.com/gemini-enterprise-agent-platform/vertex-ai-name-changes))
- `arVirtualRepoPriority`: Finding ? (upstream policies) and two others: dropped the term 'upstream policies', said each upstream has a priority value and the higher number wins, that clients read only from the virtual repository, and moved the url to the virtual repository overview. ([page](https://docs.cloud.google.com/artifact-registry/docs/repositories/virtual-overview))
- `arPackageScanning`: Finding ? (scanning flag) and the sandbox finding: url moved to the page that documents --allow-vulnerability-scanning, and the row now says packages are scanned on push, only up to 100 files, and that scanning of remote-repository caches is not stated by Google. ([page](https://docs.cloud.google.com/artifact-analysis/docs/enable-automatic-scanning))
- `apigeeVerifyIam`: Finding ? (hybrid) and two others: the row now says Google-hosted Apigee only, not Apigee hybrid, and not addable through the Apigee Operator on a GKE Gateway, where one proxy handles all traffic and callers are checked with VerifyAPIKey or OAuthV2. ([page](https://docs.cloud.google.com/apigee/docs/api-platform/reference/policies/verify-iam-policy))
- `modelArmorFloorSettings`: The row gave one set of names; it now gives the gcloud and REST names side by side (VERTEX_AI and AI_PLATFORM, INSPECT_AND_BLOCK and inspectAndBlock), the INSPECT_ONLY default, and says only generateContent is covered, screening is skipped when Model Armor is unreachable and file uploads are not screened. ([page](https://docs.cloud.google.com/model-armor/model-armor-vertex-integration))
- `swpEgress`: The overview page supported neither URL lists nor Direct VPC egress; where now uses the Cloud Run console wording and flag, the url points at the policies and rules page that covers gateway security policies and URL lists, and the row says Google has no guide joining Cloud Run to a next-hop proxy so the route must be tested. ([page](https://docs.cloud.google.com/secure-web-proxy/docs/policies-and-rules-overview))
- `cloudRunServiceIdentity`: The row implied Google recommends one account per service; it now says Google recommends a user-managed account with minimal permissions and that one per service is this mapping's choice. ([page](https://docs.cloud.google.com/run/docs/securing/service-identity))
- `modelArmorSanitizeApi`: The row implied Model Armor de-identifies the payload; it now says Model Armor returns masked text in deidentifyResult.data.text for the caller to substitute, and that streaming methods and file-based prompts are not de-identified. ([page](https://docs.cloud.google.com/model-armor/sanitize-prompts-responses))
- `workloadSeparation`: The row presented a node pool per trust group as the wall between rollouts; it now presents it as an extra layer under GKE Sandbox and quotes Google's warning that it is not a primary security boundary. ([page](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/workload-separation))
- `fqdnNetworkPolicy`: The row had FQDN policies allow the in-cluster offline web; it now limits them to names outside the cluster, sends in-cluster Services to label-based NetworkPolicy, gives the v1alpha1 API, and notes shared-address and DNS limits. ([page](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/fqdn-network-policies))
- `agentSandboxPolicy`: The row did not say the policy is optional and gVisor-only; default and recommended now say it is not applied by default, rejects microVM sandboxes until edited, and that rejections for claims and warm pools show only in controller logs. ([page](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/how-install-agent-sandbox))
- `gkeNetworkPolicy`: The recommended text spoke only of a gateway and serving nodes; it now covers both patterns and says Agent Sandbox's per-template policy allows internet egress and must be replaced in the SandboxTemplate, since a namespace default-deny does not remove it. ([page](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/agent-sandbox))
- `workloadIdentityGke`: The row omitted two conditions; it now says the sandbox's network policy must allow the GKE metadata server and that a warm pool shares one ServiceAccount, so one identity per run means one template and pool per run or no pool. ([page](https://docs.cloud.google.com/kubernetes-engine/docs/concepts/machine-learning/agent-workloads))
- `disableServiceAccount`: The row assumed an IAM service account on every pattern; it now says the page covers IAM service accounts only and that a Kubernetes ServiceAccount identity is stopped by removing its IAM binding or deleting it, and it drops the unstated 'at once'. ([page](https://docs.cloud.google.com/iam/docs/service-accounts-disable-enable))
- `runAutoStop`: Named in the disableServiceAccount finding: the stop now removes the IAM bindings of the run's Kubernetes ServiceAccounts instead of disabling service accounts that do not exist. ([page](https://docs.cloud.google.com/iam/docs/service-accounts-disable-enable))
- `adkRemoteConfirmation`: The row ignored ADK's known limitations; it now says VertexAiSessionService and DatabaseSessionService are not supported, a custom store must be tested, the reply is a FunctionResponse to /run or /run_sse, and with resume on it must carry the invocation ID. ([page](https://adk.dev/tools-custom/confirmation/))
- `adkToolConfirmation`: The row now says the database and Agent Platform session services are unsupported so confirmation must be tested with the custom Firestore store, and that the feature is experimental in TypeScript, Go and Kotlin. ([page](https://adk.dev/tools-custom/confirmation/))
- `apigeeMcpDiscoveryProxy`: The row put the Discovery Proxy in front of your own MCP servers; it now says your servers sit behind an ordinary Apigee proxy with the server as target, the Discovery Proxy is only for REST APIs turned into tools, and tool definitions behind an ordinary proxy must be reviewed and pinned by you. ([page](https://docs.cloud.google.com/apigee/docs/api-platform/apigee-mcp/apigee-mcp-overview))
- `authManager3lo`: The row gave an unverified console path and implied Cloud Run support; it now says Google describes the auth manager only with Agent Runtime, gives no console path, and that Cloud Run needs Agent Platform features (Preview) with Agent Identity, to be confirmed before relying on it. ([page](https://docs.cloud.google.com/iam/docs/auth-manager-overview))
- `apigeeVerifyAccessToken`: The row put VerifyAccessToken first and cited the Discovery Proxy quickstart; it now puts ParsePayload first and the token check second, and cites the page that covers a proxy in front of your own MCP server. ([page](https://docs.cloud.google.com/apigee/docs/api-platform/apigee-mcp/manage-mcp-tool-access))
- `apigeeRevokeTokens`: The row named the InvalidateToken operation and a revoke API; it now names the RevokeOAuthV2 policy, requires tokens issued with AppEndUser, and says a revoked token can still pass for up to 180 seconds. ([page](https://docs.cloud.google.com/apigee/docs/api-platform/security/oauth/enable-retrieval-and-revocation-oauth-20-access-tokens-end-user-id-app-id-or-both))
- `apigeeMessageLogging`: MessageLogging is unsupported through the Apigee Extension Processor; the row now says to use the load balancer's HTTP access logging (GCPBackendPolicy per InferencePool) on GKE Inference Gateway and keeps the policy for ordinary proxies. ([page](https://docs.cloud.google.com/apigee/docs/api-platform/service-extensions/extension-processor-overview))
- `apigeeSpikeArrest`: The row described only a per-proxy PreFlow; it now adds that on a GKE Gateway SpikeArrest is a Kubernetes resource added through the Apigee Operator on the one proxy that handles all traffic, and that Quota is not addable there. ([page](https://docs.cloud.google.com/apigee/docs/api-platform/apigee-kubernetes/apigee-apim-operator-add-policies))
- `vpcServiceControls`: The scope was written for agents and the url was the Agent Platform page; where now covers agent and self-hosted serving projects, the url is the VPC Service Controls overview, and the row says to check each service against the supported products list. ([page](https://docs.cloud.google.com/vpc-service-controls/docs/overview))
- `modelVersionAliases`: The row had serving read the default alias; it now says only Agent Platform deployments fall back to it and that for vLLM on GKE the rollout step must resolve the alias to a bucket path. ([page](https://docs.cloud.google.com/gemini-enterprise-agent-platform/machine-learning/model-registry/model-alias))
- `gcsUniformAccess`: The wording fitted only the serving pattern; where and recommended now cover weights, checkpoint, corpus and candidate buckets and their identities, and say public access prevention is a separate setting the linked page does not describe. ([page](https://docs.cloud.google.com/storage/docs/uniform-bucket-level-access))

## Still open

What the checks could not confirm from a vendor page. Treat each as a question to settle before
relying on that part of the mapping.

### AWS

- *Single agent workflow:* EventBridge, SQS and Lambda as an AWS-documented way to start AgentCore Runtime.
- *Agent-to-agent federation across platforms:* Whether a Policy in AgentCore policy can authorize individual A2A skills on a passthrough target: documented examples authorize by target name, HTTP method and path, and screen named request fields.
- *Agent-to-agent federation across platforms:* AWS pages do not state outright that gateway calls to public peers bypass the customer VPC; this is inferred from the gateway VPC egress page.
- *Agent-to-agent federation across platforms:* The two a2a-protocol.org pages load and the specification names AgentCardSignature, but they are not AWS documentation; the peer assessment checklist items were not found on the enterprise page.
- *Agent-to-agent federation across platforms:* The peer agents themselves (vendor platform and partner) are outside AWS and could not be checked.
- *Agent sandbox for RL & evaluation:* Whether a VPC-mode Runtime or Browser microVM resolves names through the VPC resolver, which is what makes Route 53 Resolver DNS Firewall apply; the VPC page only says DNS resolution must be enabled in the VPC.
- *Agent sandbox for RL & evaluation:* Whether the AWS-managed browser (aws.browser.v1) can ever run in VPC mode; the Browser fundamentals page mentions only public network mode while the VPC page shows VPC mode on a custom browser.
- *Agent sandbox for RL & evaluation:* Whether IAM 'Revoke sessions' reaches credentials already vended to running microVMs through the metadata service; the IAM page describes the general mechanism only.
- *Agent sandbox for RL & evaluation:* The Prescriptive Guidance page 'Simulation and test-bed agents' loaded but names RoboMaker, ECS, EC2, Bedrock and SageMaker reinforcement learning; it does not mention AgentCore Runtime or HyperPod, so it does not confirm this mapping's service choices.
- *Agent sandbox for RL & evaluation:* No AWS reference architecture was found that combines HyperPod with AgentCore Runtime sessions for reinforcement-learning rollouts; the mapping is assembled from separate service pages.
- *Multi-agent workflow:* No AWS page was found that shows a Strands Agents graph running inside a Lambda durable function; the Lambda pages name agentic AI as a use, but the combination is the repository's design.
- *Multi-agent workflow:* Whether Code Interpreter in Sandbox mode can reach a CodeArtifact repository: the documentation only says Sandbox mode reaches Amazon S3.
- *Multi-agent workflow:* AWS pages do not state outright that gateway calls to public targets bypass the customer VPC; this is inferred from the gateway VPC egress page.
- *Multi-agent workflow:* The Strands multi-agent pages loaded but were only checked to exist, not read in detail.
- *Chat agent with tools:* Whether Code Interpreter in Sandbox mode can reach a CodeArtifact repository: the documentation only says Sandbox mode reaches Amazon S3.
- *Chat agent with tools:* AWS pages do not state outright that gateway calls to public targets bypass the customer VPC; this is inferred from the gateway VPC egress page, which describes VPC entry only for private endpoints.
- *Chat agent with tools:* The OWASP cheat sheet address for outputSanitisation loads, but it is not vendor documentation and its content was not checked against the row.
- *Chat agent with tools:* The Strands interrupts page loads and names BeforeToolCallEvent and event.interrupt; the approval-queue behaviour for unattended runs is the builder's design and has no AWS page.
- *Remote MCP server you publish:* Whether allowedWorkloadConfiguration also holds when the Runtime is attached as an MCP server target; the docs describe it for AgentCore Runtime (HTTP) targets, which cannot sit on an MCP-protocol gateway.
- *Remote MCP server you publish:* Whether the Runtime or Gateway JWT authorizer checks Cognito token revocation; the pages list signature and claim checks only.
- *Remote MCP server you publish:* Whether IAM Identity Center itself issues identity-assertion grants (ID-JAG); one search of AWS sites found only the Okta example.
- *Remote MCP server you publish:* The sample repository page on github.com returned 403 through the proxy; its README was read from raw.githubusercontent.com instead. The guidance's PDF architecture diagram was not opened.
- *Remote MCP server you publish:* The Prescriptive Guidance page 'Tool-based agents for servers' loaded but names API Gateway, App Runner, Lambda and ECS, not AgentCore, so it does not support this mapping's service choices either way.
- *Self-hosted model inference:* Whether an inference provider target accepts a privateEndpoint (VPC Lattice) to a private vLLM address: AWS pages list only MCP and OpenAPI targets for private endpoints, and MCP, OpenAPI and HTTP passthrough for private certificate authorities.
- *Self-hosted model inference:* Whether response interceptors and suppressOutput guardrails work on streamed completions from inference targets: the pages say buffered mode only and do not describe streaming for this target type.
- *Self-hosted model inference:* The gateway's token limit policy (the page on gateway policies) was not opened; tokens-per-minute rate limits were confirmed.
- *Self-hosted model inference:* The vLLM OpenAI-compatible server page redirected to a new address that was not opened; cache_salt and --api-key were confirmed on the vLLM security and CLI pages.
- *Self-hosted model inference:* The statement that the vLLM security page omits --trust-remote-code and --load-format comes from a summarised read of the page, not a line-by-line check.
- *Self-hosted model inference:* Whether GuardDuty Malware Protection for S3 detects unsafe model file formats such as pickle was not stated on the pages opened; its object size limit is 100 GB.
- *Self-hosted model inference:* The Hugging Face Hub documentation and the GitHub implementation guide for the AWS EKS guidance were not opened.
- *Self-hosted model inference:* The CloudTrail data events page was read only up to its first 100,000 characters.
- *Model training & release pipeline:* Whether SageMaker Clarify foundation model evaluations (or the fmeval library) can run inside a pipeline step against a candidate read from S3: the page opened describes Studio jobs, JumpStart models and deployed endpoints.
- *Model training & release pipeline:* Whether CodeArtifact's package formats could hold model checkpoints was not checked; the overview page names npm, Maven, NuGet and PyPI tooling.
- *Model training & release pipeline:* SageMaker HyperPod was confirmed from the SageMaker training overview, not from its own page.
- *Model training & release pipeline:* The two Well-Architected lens pages cited are short index pages; their best-practice sub-pages were not opened.
- *Model training & release pipeline:* Whether GuardDuty Malware Protection for S3 detects unsafe model file formats such as pickle was not stated on the pages opened; its limits are 100 GB per object and 25 protected buckets per Region.
- *Model training & release pipeline:* Whether training job and model approval calls appear as CloudTrail management or data events was not checked; the data events table lists SageMaker jobs, training sessions and endpoints.
- *Model training & release pipeline:* The CloudTrail data events page was read only up to its first 100,000 characters.

### Azure

- *Single agent workflow:* Event Grid as a trigger for Container Apps.
- *Single agent workflow:* A Microsoft page that hosts Agent Framework on Container Apps.
- *Agent-to-agent federation across platforms:* Whether API Management A2A agent APIs support streamed tasks: the page opened does not mention streaming.
- *Agent-to-agent federation across platforms:* Whether API Management serves an imported agent card from a stored copy or fetches it from the peer on each request.
- *Agent-to-agent federation across platforms:* Whether quota-by-key and send-request are supported inside A2A agent API policies specifically: the A2A page does not list supported policies.
- *Agent-to-agent federation across platforms:* Preview or general-availability status of the separate Azure AI Gateway product: the page opened only says it is a distinct resource type from API Management.
- *Agent-to-agent federation across platforms:* How a partner in another organisation registers as a client in our Entra tenant with its own certificate: not covered by the pages opened.
- *Agent sandbox for RL & evaluation:* Whether Cilium network policy, FQDN filtering and Azure Monitor container log collection behave the same for Kata pods; those pages do not mention Pod Sandboxing.
- *Agent sandbox for RL & evaluation:* Whether Azure Artifacts offers a private endpoint; found no page saying so, and the allow-list page gives only public addresses.
- *Agent sandbox for RL & evaluation:* A Microsoft page about vLLM by itself; only the AKS AI toolchain operator pages mention it (a guessed kaito-vllm address returned 404).
- *Agent sandbox for RL & evaluation:* Whether a rollout pod can read an Azure Artifacts feed with a Workload ID token end to end; the documentation says Azure DevOps accepts managed identities but this was not tested.
- *Multi-agent workflow:* Whether Azure Artifacts can pin packages by digest: the pages opened describe immutable versions and saved upstream copies, not digest pinning.
- *Multi-agent workflow:* Whether the dynamic sessions pool endpoint can be reached privately: the pages opened only show the public dynamicsessions.io address.
- *Multi-agent workflow:* Preview or general-availability status of the separate Azure AI Gateway product: the page opened only says it is a distinct resource type from API Management.
- *Multi-agent workflow:* Whether one Container Apps process can keep each agent's Entra agent identity apart: the pages opened show the blueprint's managed identity obtaining tokens for its child identities.
- *Multi-agent workflow:* Whether Event Grid can deliver directly to a self-hosted Container Apps worker: not checked beyond the Event Grid overview.
- *Chat agent with tools:* Whether Azure Artifacts can pin packages by digest: the pages opened describe immutable versions and saved upstream copies, not digest pinning.
- *Chat agent with tools:* Whether the dynamic sessions pool endpoint can be reached privately: the pages opened only show the public dynamicsessions.io address.
- *Chat agent with tools:* Preview or general-availability status of the separate Azure AI Gateway product: the page opened only says it is a distinct resource type from API Management.
- *Chat agent with tools:* Release status of Microsoft Agent Framework: the overview page still installs the .NET Foundry package with a prerelease flag.
- *Chat agent with tools:* The OWASP cheat-sheet link for outputSanitisation loads but is not vendor documentation, so its content was not checked against Azure.
- *Remote MCP server you publish:* ID-JAG: found no Microsoft Learn page saying Entra issues or accepts identity-assertion grants; a Microsoft Tech Community post on the subject returned HTTP 403 and could not be opened.
- *Remote MCP server you publish:* Whether an API Management policy can read the tool name from the request body to authorize per tool; the documentation only says policies apply to all tools.
- *Remote MCP server you publish:* Whether App Service's preview metadata document follows forwarded host headers when the app sits behind API Management; the page does not say.
- *Remote MCP server you publish:* Portal paths in the settings were checked against documentation only, not in a live portal.
- *Self-hosted model inference:* Whether the KAITO managed add-on can schedule onto existing, pre-tainted GPU node pools instead of provisioning its own; the Microsoft Learn pages opened only describe automatic provisioning.
- *Self-hosted model inference:* Whether a KAITO workspace can be given a Blob-mounted model path while keeping the vLLM runtime; no Microsoft Learn page opened describes this.
- *Self-hosted model inference:* The Well-Architected 'Architecture pattern for AI workloads' page loaded but does not describe this AKS, KAITO and API Management combination specifically; it is generic guidance.
- *Model training & release pipeline:* Whether disabling shared key access on the workspace's own default storage account needs extra workspace configuration; the shared-key page opened does not cover Azure Machine Learning.
- *Model training & release pipeline:* The exact host names Azure Artifacts needs in a managed network outbound rule; the managed network page only gives pypi.org as its example.
- *Model training & release pipeline:* Whether one compute cluster with several user-assigned identities can give different jobs different identities; the page opened only says a cluster supports multiple user-assigned identities.

### Google Cloud

- *Single agent workflow:* Firestore as a session store for the agent kit.
- *Single agent workflow:* Whether Apigee can front self-hosted tool servers.
- *Single agent workflow:* Preview or general-availability status of Apigee's tool-server support and Agent Registry.
- *Agent-to-agent federation across platforms:* No Apigee documentation page describing A2A-specific proxies or policies was found; the only Google page found shows an A2A agent behind a general Apigee proxy with OAuth. The Apigee AI solutions marketing page did not load its body.
- *Agent-to-agent federation across platforms:* How a user's SAML or OIDC assertion from Cloud Identity would be attached to an outbound A2A call: no Google page opened describes it.
- *Agent-to-agent federation across platforms:* Whether the Agent Identity auth manager's 3-legged OAuth for A2A agents applies to agents on Cloud Run: seen only in search results, not on a page opened.
- *Agent-to-agent federation across platforms:* Pages were read through a summarising fetch tool, so launch stages of Agent Registry and Sessions could not be read from the page text.
- *Agent-to-agent federation across platforms:* The ADK pages imply, but do not state in one sentence, that model calls go direct to the model platform when ApigeeLlm is not used.
- *Agent sandbox for RL & evaluation:* Launch stage of GKE Sandbox microVMs and of FQDN network policies: neither page states Preview or GA.
- *Agent sandbox for RL & evaluation:* Whether FQDN network policies are enforced for Pods running in GKE Sandbox (gVisor or microVM): the FQDN page does not mention GKE Sandbox.
- *Agent sandbox for RL & evaluation:* Whether Artifact Analysis scans Python and npm packages that arrive through a remote repository cache rather than a push.
- *Agent sandbox for RL & evaluation:* How vLLM picks up a new checkpoint (policy reload): no Google page I opened describes reloading weights into a running vLLM server.
- *Agent sandbox for RL & evaluation:* The brief's line that Google publishes no reference for RL environments is now only partly true: no Architecture Center page was found, but Google has an RL blog for Agent Sandbox (30 Sept 2026), verl and NeMo RL tutorials and an RL monitoring guide. The NeMo RL tutorial was not opened.
- *Agent sandbox for RL & evaluation:* The 'RL Sandbox' capability announced in preview at Next '26: no documentation page for it was found, so I could not tell whether it differs from Agent Sandbox.
- *Multi-agent workflow:* Pages were read through a summarising fetch tool, so launch stages (Preview or GA) of Code Execution, Agent Registry and the Agent Identity auth manager could not be read from the page text.
- *Multi-agent workflow:* Whether a custom role narrower than roles/aiplatform.user is enough for Code Execution and Sessions while still blocking direct model calls: no page opened states this.
- *Multi-agent workflow:* Whether Grounding with Google Search works inside a VPC Service Controls perimeter: the grounding and VPC Service Controls pages opened do not say (only Web Grounding for Enterprise states support).
- *Multi-agent workflow:* The ADK pages imply, but do not state in one sentence, that model calls go direct to the model platform when ApigeeLlm is not used.
- *Multi-agent workflow:* Google's multi-agent reference does not say whether coordinator and subagents share one process; the one-process layout is this mapping's choice.
- *Multi-agent workflow:* Whether a Pub/Sub push subscription can reach a Cloud Run service whose ingress is set to internal: not checked on a page opened in this session.
- *Chat agent with tools:* Pages were read through a summarising fetch tool, so launch stages (Preview or GA) of Code Execution, Agent Registry and the Agent Identity auth manager could not be read from the page text.
- *Chat agent with tools:* Whether a custom role narrower than roles/aiplatform.user is enough for Code Execution and Sessions while still blocking direct model calls: no page opened states this.
- *Chat agent with tools:* Whether Grounding with Google Search works inside a VPC Service Controls perimeter: the grounding and VPC Service Controls pages opened do not say (only Web Grounding for Enterprise states support).
- *Chat agent with tools:* The ADK pages imply, but do not state in one sentence, that model calls go direct to the model platform when ApigeeLlm is not used.
- *Chat agent with tools:* Whether an Agent Runtime instance must exist as the parent of a Code Execution sandbox: the ADK page says a sandbox can be created from an agent engine resource name but the overview page does not spell it out.
- *Remote MCP server you publish:* Whether Apigee's token endpoints can bind a token to this server (a resource or audience parameter) or support PKCE: the OAuthV2 policy reference I read mentions neither; binding appears to rest on the API product naming the proxy.
- *Remote MCP server you publish:* Who must publish the protected-resource metadata document when the proxy fronts your own Cloud Run server: the troubleshooting page names the path and the 404 but not the set-up steps.
- *Remote MCP server you publish:* The exact value of the Cloud Run flag: the tutorial and Agent Platform guide use --functional-type=mcp-server, the 'Host MCP servers' page prints MCP_SERVER, and the GA 'gcloud run deploy' reference page did not show the flag (guides use 'gcloud beta').
- *Remote MCP server you publish:* Customer-managed keys for Apigee: the page I tried returned 404, so the keys role was not checked.
- *Remote MCP server you publish:* Cloud Armor in front of Apigee: the networking page I opened describes the load balancer but does not mention Cloud Armor.
- *Remote MCP server you publish:* The brief's statement that IAP and Agent Gateway serve only internal callers: the pages describe Google-identity and IAM-based access but do not state the caller scope in those words.
- *Self-hosted model inference:* modelSignatureVerify: openssf.org/projects/model-signing loaded only its title, so the Sigstore and key-signing claims were not checked.
- *Self-hosted model inference:* Whether a VerifyIAM policy works inside an Extension Processor proxy configured outside the Apigee Operator: the Extension Processor page neither lists it as supported nor as unsupported.
- *Self-hosted model inference:* Whether Apigee and Model Armor must share one traffic extension resource: the Apigee page states a maximum of one traffic extension per load balancer, but no page opened shows the combined manifest.
- *Self-hosted model inference:* The reference architecture page does not name vLLM, Cloud Storage or Model Registry; those bindings were checked on separate product pages, not against the reference.
- *Self-hosted model inference:* Launch stage of GKE Inference Gateway is not stated on its overview page.
- *Self-hosted model inference:* Page titles: the fetch tool returned page text without titles; quickstart titles come from the brief and from search results for the same addresses.
- *Model training & release pipeline:* modelSigningAtPromotion: openssf.org/projects/model-signing loaded only its title, so the Sigstore and Cloud KMS key-signing claims were not checked.
- *Model training & release pipeline:* Whether Model Registry copies imported artifacts into Google-managed storage or keeps reading the original bucket: the import page states neither.
- *Model training & release pipeline:* Whether the blueprint promotes a model by copying the artifact or by re-running the pipeline in production: the page does not say.
- *Model training & release pipeline:* Dataflow calling Sensitive Data Protection: seen only in search results for Google's provided Dataflow template; that page was not opened.
- *Model training & release pipeline:* The --allow-vulnerability-scanning flag in arPackageScanning: the linked overview does not mention it; a second page confirmed only that Python and npm scanning is off by default and virtual repositories are not scanned.
- *Model training & release pipeline:* Page titles: the fetch tool returned page text without titles; quickstart titles come from the brief and from search results for the same addresses.

## On-premises (`data/clouds/onprem.yaml`)

The on-premises mapping is the same eight patterns run in the organisation's own data centre, where
the organisation deploys and operates everything. It was authored on 18 November 2026 from each
project's own documentation. The reference stack is this catalogue's choice for each role, not the
only one: Kubernetes on your own servers with the NVIDIA GPU Operator, LiteLLM Proxy as the AI
gateway, vLLM for inference, Keycloak, HashiCorp Vault or OpenBao, Cilium and a Squid outbound
proxy, Envoy Gateway, Harbor, a package mirror (Pulp or Nexus), Ceph Object Gateway, MLflow,
Kubeflow, Temporal, PostgreSQL with pgvector, gVisor or Kata Containers, Presidio, Trivy, ModelScan,
Sigstore and OpenSSF Model Signing, and an OpenTelemetry, Loki and Langfuse logging stack.

| Pattern | Components | Settings | Differences recorded | Also yours to run |
| --- | ---: | ---: | ---: | ---: |
| Chat agent with tools | 12 | 31 | 7 | 11 |
| Single agent workflow | 11 | 29 | 7 | 12 |
| Multi-agent workflow | 13 | 30 | 7 | 12 |
| Remote MCP server you publish | 6 | 28 | 6 | 11 |
| Self-hosted model inference | 7 | 30 | 7 | 12 |
| Model training & release pipeline | 9 | 26 | 6 | 11 |
| Agent sandbox for RL & evaluation | 12 | 30 | 7 | 11 |
| Agent-to-agent federation across platforms | 12 | 25 | 7 | 11 |

98 settings in all, 20 of them controls the organisation builds itself because no product setting provides them.

### What the documentation showed that the stack table did not assume

- **LiteLLM Proxy.** Several gateway controls need the Enterprise licence: JWT or OIDC sign-in of callers against an identity provider, the built-in Vault secret manager, key regeneration and scheduled rotation, route restrictions, audit logs and per-key guardrails. The rows that depend on one say so under *Requires*, and the mapping uses virtual keys, secrets synced from the vault and checks at the ingress where the open-source build has no equivalent. Out of the box the proxy also makes outbound requests (cost map, release lookup, tokeniser downloads) until offline mode is set.
- **vLLM.** No authentication unless `--api-key` is set, and the key covers only some paths; anonymous usage statistics are on by default; given a Hub model id it downloads weights at start. Network policy is the control, the key a second lock.
- **Ingress NGINX** was retired in March 2026, so incoming traffic is bound to Envoy Gateway.
- **MinIO's** community repository was archived on 25 April 2026, so object storage is bound to Ceph Object Gateway.
- **Sonatype Nexus Community Edition** is capped at 40,000 components and 100,000 requests a day, and malware detection is a separate paid product; Pulp is named beside it.
- **HashiCorp Vault:** the PKCS#11 hardware security module seal is Enterprise-only; OpenBao offers it as a plugin.
- **Kyverno:** `verifyImages` in a ClusterPolicy is deprecated in favour of `ImageValidatingPolicy`.
- **Presidio** is no longer a Microsoft project; its documentation moved.
- **Langfuse:** audit logs and retention policies are Enterprise features.
- **Temporal:** the default authoriser allows every request until one is configured.
- **Keycloak:** resource indicators, client ID metadata documents and identity assertion grants are experimental.

### Could not be confirmed from a project's page

- *Chat agent with tools:* Whether LiteLLM's MCP OBO token exchange works when the caller presents a virtual key: the page describes the caller's bearer token as the token that is exchanged, and checking a Keycloak token at the gateway (JWT auth) is an Enterprise feature. If it does not, the agent must do the Keycloak token exchange itself and pass the narrowed token in a per-server header.
- *Chat agent with tools:* LLM Guard's maintenance status: its documentation was last updated in May 2025 and the GitHub repository could not be opened from here (403 through the proxy).
- *Chat agent with tools:* Whether Sonatype Nexus Community Edition includes routing rules: the routing rules page does not state an edition. The Community Edition page gives the caps (40,000 components, 100,000 requests a day) and names high availability, SAML and SSO as Pro only.
- *Chat agent with tools:* Physical security of the data centre and a named SIEM product: no single authoritative page applies, so neither has a documentation link.
- *Chat agent with tools:* A LiteLLM guardrail page for Llama Guard was not found in the current documentation; the input guardrail row therefore names a custom guardrail or detect_prompt_injection with llm_api_check pointed at a classifier model you serve.
- *Single agent workflow:* Whether LiteLLM's MCP OBO token exchange works when the caller presents a virtual key: the page describes the caller's bearer token as the token that is exchanged, and checking a Keycloak token at the gateway (JWT auth) is an Enterprise feature. If it does not, the agent must do the Keycloak token exchange itself and pass the narrowed token in a per-server header.
- *Single agent workflow:* LLM Guard's maintenance status: its documentation was last updated in May 2025 and the GitHub repository could not be opened from here (403 through the proxy).
- *Single agent workflow:* Whether Sonatype Nexus Community Edition includes routing rules: the routing rules page does not state an edition. The Community Edition page gives the caps (40,000 components, 100,000 requests a day) and names high availability, SAML and SSO as Pro only.
- *Single agent workflow:* Physical security of the data centre and a named SIEM product: no single authoritative page applies, so neither has a documentation link.
- *Single agent workflow:* A LiteLLM guardrail page for Llama Guard was not found in the current documentation; the input guardrail row therefore names a custom guardrail or detect_prompt_injection with llm_api_check pointed at a classifier model you serve.
- *Multi-agent workflow:* Whether LiteLLM MCP OBO token exchange can be used when the caller is admitted with a virtual key: the page says the caller's bearer token becomes the subject_token, and JWT-based auth at the gateway is Enterprise only.
- *Multi-agent workflow:* Llama Guard and LLM Guard are not listed on LiteLLM's guardrail providers page; the row therefore reaches a self-hosted classifier through the Generic Guardrail API or a custom guardrail, which was not tested.
- *Multi-agent workflow:* The LiteLLM tool permission guardrail page gives MCP-style tool names but does not state that calls routed through the MCP gateway are covered; allowed_tools and mcp_tool_permissions are the documented MCP controls.
- *Multi-agent workflow:* Temporal Worker Versioning (ramping a new Worker Deployment Version) was read but not bound: the page gives minimum versions (Server v1.29.1) and not the commands.
- *Multi-agent workflow:* The default value of Keycloak's Access Token Lifespan and the minimum expirationSeconds of a projected service account token were not found on the pages read, so the rows give no number for them.
- *Multi-agent workflow:* Pulp as the alternative package mirror was not opened; only Sonatype Nexus Repository pages were read.
- *Remote MCP server you publish:* LiteLLM: no page was found that states whether the full arguments of an MCP tool call are written by the logging callbacks; the OpenTelemetry page only lists metadata.mcp_tool_call_metadata as an attribute. The MCP service should log inputs itself.
- *Remote MCP server you publish:* Keycloak: the guide does not say that Keycloak refuses private or internal addresses when it fetches a client ID metadata document or a JWKS URL; the block is therefore mapped to network policy and the outbound proxy.
- *Remote MCP server you publish:* Keycloak: the default value of Access Token Lifespan is not stated on the page read, so no default is given.
- *Remote MCP server you publish:* Keycloak: the console tab that holds the Standard token exchange switch is not named on the token exchange page.
- *Remote MCP server you publish:* Kyverno: the examples read show validationActions: [Audit]; the enforcing value was not seen on the page, so the row says 'enforced' without quoting it.
- *Self-hosted model inference:* LiteLLM: what the proxy does when no master key is set. The Virtual Keys page does not say, so the default is described only as 'not available until a master key and database are configured'.
- *Self-hosted model inference:* LiteLLM usage telemetry: the settings reference lists LITELLM_TELEMETRY_DISABLED and related variables, but the telemetry page (docs.litellm.ai/docs/observability/telemetry) returned no content, so what is sent by default is not stated here.
- *Self-hosted model inference:* LiteLLM: /key/block and key expiry are not labelled Enterprise on the Virtual Keys page, but the page does not say outright that they are open source.
- *Self-hosted model inference:* vLLM: the absence of any signature or digest check at load is my reading of the serve reference and the security guide, not a statement the documentation makes.
- *Self-hosted model inference:* Ceph Object Gateway STS: Ceph documents Keycloak as the tested OpenID Connect provider. Whether it accepts Kubernetes service account tokens from the cluster's own issuer directly was not confirmed, so the row names Keycloak.
- *Self-hosted model inference:* Ceph Object Lock: the Bucket Operations page documents bucket-level Object Lock configuration (mode, days or years); per-object retention and legal hold operations are not listed on that page.
- *Model training & release pipeline:* Ceph Object Gateway STS: Ceph documents Keycloak as the tested OpenID Connect provider. Whether it accepts Kubernetes service account tokens from the cluster's own issuer directly was not confirmed, so the row names Keycloak.
- *Model training & release pipeline:* Ceph Object Gateway encryption: the Encryption page describes SSE-KMS and the bucket encryption API for SSE-S3 but states no default, and calls 'rgw crypt default encryption key' a testing-only option, so no default is given and that option is not recommended.
- *Model training & release pipeline:* Nexus Repository: the Routing Rules page does not say which editions include routing rules; the edition table does not list them either.
- *Model training & release pipeline:* Nexus Repository: how clients are pointed at a Hugging Face proxy repository is on a separate 'Configure Hugging Face with Nexus' page that was not opened.
- *Model training & release pipeline:* ModelScan: the README lists H5, Pickle and SavedModel formats and does not mention safetensors or GGUF, so the row refuses pickle formats for serving instead of relying on the scan.
- *Model training & release pipeline:* garak: the probe families suited to backdoor and memorisation testing are not named on the pages opened, so the row names no probe and adds the organisation's own tests.
- *Agent sandbox for RL & evaluation:* Tetragon: the pages read do not say what Tetragon sees of processes inside a Kata guest or a gVisor sandbox. The row therefore claims monitoring of the host under the sandboxes only, not of activity inside a guest kernel.
- *Agent sandbox for RL & evaluation:* Kata Containers: katacontainers.io/docs returned 404 and the project's GitHub documentation could not be opened, so the RuntimeClass set-up is cited from the Kubernetes and agent-sandbox pages, not from Kata's own installation guide.
- *Agent sandbox for RL & evaluation:* Pulp: that rollouts cannot write to a repository through the distribution's content URL is inferred from the content guard and sync pages; no page read states it as a rule.
- *Agent sandbox for RL & evaluation:* Nexus Repository: the name of the Blocked option was confirmed only through the repository state 'Online - Remote Manually Blocked'; the form field itself was not seen.
- *Agent sandbox for RL & evaluation:* PyRIT: azure.github.io/PyRIT now redirects to microsoft.github.io/PyRIT and its documentation is a script-rendered page that could not be read, so no PyRIT setting is cited for the containment red team.
- *Agent sandbox for RL & evaluation:* Ceph Object Gateway: object lock and versioning for checkpoints were not checked, so no such setting is listed.
- *Agent-to-agent federation across platforms:* How guardrails are configured for A2A traffic in LiteLLM: the Agent Gateway page says message/send and message/stream go through the A2A client that handles guardrails, with no configuration detail, so screening is also done with /guardrails/apply_guardrail in the agent.
- *Agent-to-agent federation across platforms:* Whether a peer can be admitted to LiteLLM with its Keycloak token in the open-source edition: JWT-based auth is Enterprise only, so the mapping gives each peer a virtual key and keeps Keycloak tokens for the agent and tool side.
- *Agent-to-agent federation across platforms:* How LiteLLM enforces the Agent Card securitySchemes it lists as supported, and how it authenticates to a peer with an OAuth client credential: the headers page documents static, forwarded and convention headers, and minted credentials only for Databricks and Microsoft Entra.
- *Agent-to-agent federation across platforms:* Keycloak external-to-internal exchange with the JWT Authorization Grant was read only in the comparison table of the token exchange page; its configuration steps were not opened.
- *Agent-to-agent federation across platforms:* Whether LiteLLM's agent features need an Enterprise licence: the pages do not label them, except that the kill switch audit log does.
- *Agent-to-agent federation across platforms:* The default value of Keycloak's Access Token Lifespan was not found in the section read, so the row gives no number.

## Hosting options, and how they were validated

On 18 November 2026 each of the four agent patterns (single agent workflow, chat agent with
tools, multi-agent workflow, agent-to-agent federation) gained its hosting options on every
platform: your own cluster, the platform's own runtime, and the managed agent service.
The options are compared on the same ten rows and not ranked; a variant on the same pattern
states only the components and settings that change.

| Platform | Mapped option | Variants | Managed agent service (another pattern) |
| --- | --- | --- | --- |
| AWS | Amazon Bedrock AgentCore Runtime; AWS Lambda durable functions for the multi-agent workflow | Amazon EKS; AgentCore Runtime for the multi-agent workflow | Amazon Bedrock AgentCore harness |
| Azure | Azure Container Apps | Azure Kubernetes Service | Microsoft Foundry Agent Service |
| Google Cloud | Cloud Run | Google Kubernetes Engine | Agent Runtime on Gemini Enterprise Agent Platform |
| On-premises | Kubernetes on your own servers | Knative Serving, for the chat agent and federation only | None: a managed service is by definition a vendor's |

**Two people, one claim.** Every claim was written by one researcher from the vendor's current
pages and then re-checked by a second, who was given the claims without the first one's
sources and had to find their own evidence. A claim the second could not support was corrected
to what the page says, with the page recorded as a source.

| What was checked | Claims | Confirmed | Tightened | Wrong | Could not be checked |
| --- | ---: | ---: | ---: | ---: | ---: |
| Azure, single agent workflow (three options compared, AKS variant) | 65 | 59 | 6 | 0 | 0 |
| Azure, other three agent patterns (AKS variants) | 60 | 46 | 13 | 0 | 1 |
| AWS, single agent workflow and chat agent | 75 | 69 | 6 | 0 | 0 |
| AWS, multi-agent workflow and federation | 62 | 54 | 8 | 0 | 0 |
| Google Cloud, four agent patterns | 104 | 100 | 4 | 0 | 0 |
| On-premises, four agent patterns | 90 | 85 | 5 | 0 | 0 |
| Microsoft Foundry Agent Service, as a catalogued product | 68 | 51 | 17 | 0 | 0 |
| Who may start a sandbox run: one setting each on AWS, Azure and Google Cloud | 3 | 0 | 3 | 0 | 0 |
| **Total** | **527** | **464** | **62** | **0** | **1** |

The one claim that could not be checked is a statement about this catalogue's own mapping, not
about a vendor. What the second check changed, in the terms a builder would feel:

- **Azure.** Statements true only of AKS Standard (outbound through a load balancer by
  default, local accounts on, upgrades and add-ons yours to run) now say so; AKS Automatic
  preconfigures most of them. The Agent Framework self-hosting, A2A hosting and durable
  workflow packages are prerelease and marked so. Filtering outbound traffic by name with
  Cilium needs a paid networking add-on. On Foundry Agent Service a hosted agent's session
  files stay in Microsoft-managed storage even with your own storage configured, and a private
  endpoint can be added later while the outbound network cannot.
- **AWS.** The default metadata hop limit depends on how nodes are created. Moving off
  AgentCore Runtime does not mean replacing the other AgentCore services. A runtime request
  still times out at 15 minutes; only asynchronous jobs run for hours. A run started straight
  from an SQS queue is capped at 15 minutes on Lambda durable functions too. With the
  supervisor's steps on Step Functions, the permission that resumes an approval cannot be
  scoped to one resource and the agents' roles need it as well, so the approval rests on
  keeping the task token from the agents.
- **Google Cloud.** Automatic base image updates on Cloud Run cover services, not jobs or
  worker pools. `adk deploy gke` uses the default namespace and ServiceAccount, so a dedicated
  identity needs your own manifests. Eventarc's GKE destinations are Preview and need a public
  endpoint.
- **On-premises.** Knative behind Envoy Gateway needs the request-timeout feature listed, or
  every request ends at 15 seconds. Knative's cluster-local address is shared and routes by
  hostname, so network policy can only limit who reaches that gateway. Temporal's serverless
  workers are preview and cloud-only. The single agent workflow and the multi-agent workflow
  offer no Knative variant, because it would replace the durable workflow that holds approvals.
- **Who may start a sandbox run.** All three rows named the right setting but claimed too
  much: none of them, alone, limits run access to the named groups. Each now says what else
  can grant the same access and must be closed: on AWS other access entries, the cluster
  creator's admin entry and the older config-map mappings; on Azure local accounts, in-cluster
  bindings and inherited assignments, and that the built-in writer role also reads Secrets; on
  Google Cloud project-level IAM roles, which bypass in-cluster bindings.
- **Foundry Agent Service as a product.** Two settings are set by CLI, REST or SDK and not in
  the portal; a tracing flag was only for early enablement and has been replaced; a running
  prompt agent can be cancelled. No coverage grade changed: 7 controls native, 8 partial, 1
  external.

**What this does not cover.** The comparison is for the four agent patterns. The other four
hosted patterns (remote MCP server, self-hosted inference, training pipeline, agent sandbox)
ask a different question ("who runs the server or the job") and are not yet compared. Nothing
here was deployed or run: every statement rests on a vendor's or a project's documentation.


## Hosting options for the other four hosted patterns

On 18 November 2026 the remote MCP server, self-hosted model inference, the training pipeline
and the agent sandbox gained their hosting options on every platform, so all eight hosted
patterns now have them. The rows are the same ten, worded for what each pattern hosts (the MCP
server, the model server, the training job, the sandbox). A managed option here is a service
where the provider runs that thing for you; no other pattern draws it, so the option says what
the service offers and what choosing it means.

| Pattern | AWS | Azure | Google Cloud | On-premises |
| --- | --- | --- | --- | --- |
| Remote MCP server | **AgentCore Runtime**; EKS; Lambda with API Gateway; managed: AgentCore Gateway | **App Service**; Functions; Container Apps; AKS; managed: API Management | **Cloud Run**; GKE; managed: MCP in Apigee | **Kubernetes**; Knative Serving |
| Self-hosted inference | **EKS**; SageMaker AI real-time inference; managed: Bedrock Custom Model Import | **AKS with KAITO**; Azure Machine Learning managed online endpoints; managed: Foundry Models | **GKE with Inference Gateway**; Agent Platform endpoints; Cloud Run with GPUs; managed: Model Garden models as a service | **Kubernetes**; KServe |
| Training pipeline | **SageMaker AI training jobs**; EKS; SageMaker HyperPod; managed: SageMaker AI serverless model customization | **Azure Machine Learning compute cluster**; Azure Machine Learning on AKS; managed: Foundry training | **Agent Platform serverless training**; GKE with Kueue; managed: open model tuning | **Kubernetes**; Slurm |
| Agent sandbox | **AgentCore Runtime**; EKS isolated pods; Lambda MicroVMs; managed: AgentCore Code Interpreter | **AKS Pod Sandboxing**; Container Apps dynamic sessions (custom container); managed: dynamic sessions code interpreter | **Agent Sandbox on GKE**; Cloud Run sandboxes; managed: Agent Platform sandboxes | **Kubernetes on Kata Containers**; Kubernetes on gVisor |

Bold is the option each mapping's components and settings describe. The same two-person
method applied: one researcher per platform, then a second who saw the claims without the
sources.

| What was checked | Claims | Confirmed | Tightened | Wrong | Could not be checked |
| --- | ---: | ---: | ---: | ---: | ---: |
| AWS, MCP server and inference | 130 | 126 | 4 | 0 | 0 |
| AWS, training and sandbox | 158 | 151 | 7 | 0 | 0 |
| Azure, MCP server | 103 | 96 | 7 | 0 | 0 |
| Azure, inference, training and sandbox | 180 | 166 | 14 | 0 | 0 |
| Google Cloud, four patterns | 234 | 222 | 12 | 0 | 0 |
| On-premises, four patterns | 141 | 131 | 8 | 2 | 0 |
| **Total** | **946** | **892** | **52** | **2** | **0** |

What the second check changed, in the terms a builder would feel:

- **On-premises.** The two wrong claims were one fact: gVisor's own guide pairs it with Falco
  for runtime monitoring, but Falco removed its gVisor engine in 0.44.0 (26 May 2026), so only
  Falco 0.43 or earlier, or a receiver of your own, can read gVisor's trace points. gVisor's
  KVM platform is advised on bare metal for performance and is not presented as a stronger
  wall. Knative's default networking layer is Istio; Kourier is the suggested choice.
- **AWS.** On most GPU instance types a SageMaker endpoint's KMS key does not cover the local
  NVMe disk the weights sit on; that disk is hardware-encrypted. The bearer-token invoke
  permission cannot be scoped to one endpoint. EKS Auto Mode patches nodes for you and
  replaces them within 21 days, which bounds a long training job or sandbox. AgentCore
  Gateway has its own payload limit (6 MB by default).
- **Azure.** App Service unloads an idle app after 20 minutes unless Always On is set.
  Container Apps' 240-second limit is an idle limit that premium ingress can raise to 30
  minutes. Built-in MCP authorisation on Functions and programmatic management of API
  Management MCP servers are preview. Managed online endpoints never scale to zero. Training on
  AKS needs a changed scheduler configuration before nodes can autoscale.
- **Google Cloud.** Cloud Run sandboxes can now run from their own images (sandbox templates,
  16 November 2026). Several open models and Provisioned Throughput for them are Preview.
  Chat Completions on dedicated endpoints is listed for Model Garden deployments only.

Two candidates changed during research, both from the vendor's own pages: AWS's managed
fine-tuning route is SageMaker AI serverless model customization, not Bedrock model
customisation; and Lambda MicroVMs was added for the sandbox because AWS documents it for
reinforcement-learning environments.


## The managed agent service in your cloud

On 18 November 2026 the three cloud agent services (Microsoft Foundry Agent Service, Amazon
Bedrock AgentCore, and Agent Runtime on Google's Gemini Enterprise Agent Platform) moved from
the subscribed "API/SDK managed agent runtime" pattern to a hosted pattern of their own. The
rule is tenancy: a service that runs inside a cloud account the organisation governs belongs
with the AI it hosts, because the organisation wraps its own cloud controls around it; a
service in another company's tenancy stays with the AI it subscribes to (Claude Managed
Agents, OpenAI Agents API).

The pattern is mapped onto the three clouds and not onto the on-premises data centre, where
nobody runs the agent loop for you. On each cloud the service's own settings (its product
record) and the cloud's surrounding rows are one list, and together they deliver all 21
pinned controls. A setting of the service itself lives in the product file; a setting of the
gateway, network, identity, keys, policy, logs or stores lives in the platform's file.

| Cloud | The service | The gateway in front of your tools | Platform rows | Rows added to the service | Claims | Confirmed | Tightened | Wrong |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Azure | Microsoft Foundry Agent Service, standard setup with private networking | Azure API Management (MCP servers), internal | 21 | 8 | 55 | 43 | 12 | 0 |
| AWS | Amazon Bedrock AgentCore harness | AgentCore Gateway with Policy in AgentCore | 22 | 7 | 57 | 47 | 10 | 0 |
| Google Cloud | Agent Runtime on Gemini Enterprise Agent Platform | Agent Gateway (Google hosts its proxy) | 22 | 5 | 55 | 50 | 4 | 1 |
| **Total** | | | | | **167** | **140** | **26** | **1** |

Where each cloud does not follow the drawing, in the terms a builder would feel:

- **Azure.** Tool calls are not forced through the gateway: each tool endpoint is pointed at
  it by hand. State is in your own stores only with standard setup, chosen when the project is
  created. The endpoint is public by default and network injection is fixed at creation. Web
  search and Grounding with Bing use public endpoints and leave the compliance boundary.
  Prompt agents run on Microsoft's loop; hosted agents run your code. Several agent policy
  definitions are preview.
- **AWS.** The gateway is an AWS-run service whose public endpoint cannot be closed, so the
  private path is PrivateLink plus policy conditions. Resource-based policies are documented
  for runtimes, gateways and memory, not for a harness. State sits in AgentCore Memory, not in
  stores you bring. A model allowlist on Bedrock's invoke actions does not cover calls made
  through the newer inference endpoint, which needs its own deny. An invoke call can override
  the deployed definition.
- **Google Cloud.** You supply the agent loop: Agent Runtime hosts code or a container you
  deploy, and the configuration-only Managed Agents API is pre-release. An agent has no private
  endpoint of its own; only a VPC Service Controls perimeter closes the public API. State stays
  in the service (Sessions and Memory Bank), under your key only if it was set at creation.
  Once a gateway is bound, model, session and memory calls cross it too. Grounding with Google
  Search supports none of data residency, your own keys or the service perimeter. Policy
  constraints on the agent resource are Preview.

The one wrong claim was on Google Cloud: Access Transparency does list Agent Runtime as
supported, which the first draft denied. Two further points the checks could not settle either
way are stated as such in the rows: on AWS, whether a harness accepts a resource-based policy;
on Google Cloud, whether the organisation-wide key constraint covers an agent instance.


### Azure AI Search is now Foundry IQ

Microsoft renamed Azure AI Search to Foundry IQ in November 2026; the name reads "Foundry IQ
(Azure AI Search)" in the portals and the documentation, and the service is unchanged
([What's new](https://learn.microsoft.com/en-us/azure/search/whats-new)). On 18 November 2026
every row of the Azure file and of the Foundry Agent Service record that named the service was
brought into line: seven component names and notes, three setting locations and four
comparison cells. Two things keep the old name on purpose, because Microsoft's page says they
do: the built-in policy definitions ("Azure AI Search services should disable public network
access" and "…should use customer-managed keys to encrypt data at rest", checked against the
[policy list](https://learn.microsoft.com/en-us/azure/search/policy-reference)) and the
resource names a builder types (the `Microsoft.Search/searchServices` resource type, the
`searchService` private endpoint sub-resource, the Search roles and the REST API).


## The agentic software factory

On 21 November 2026 the agentic software factory gained its mappings onto all four platforms,
each with its hosting options for the factory's coding agent and a short recommended value on
every setting. One researcher per platform wrote the mapping and a second, shown no sources,
checked it.

| Platform | Coding agent (mapped) | Pipeline and gate | App hosting | Claims | Confirmed | Tightened | Wrong |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| AWS | AgentCore Runtime | GitHub, CodePipeline with an approval only the owner answers | One Control Tower account per app, ECS behind Cognito sign-in | 109 | 98 | 11 | 0 |
| Azure | Container Apps Sandboxes | GitHub Actions, a production environment the owner's team approves | One subscription per app, Container Apps behind Entra sign-in | 107 | 93 | 13 | 1 |
| Google Cloud | A Cloud Run job per build | Secure Source Manager, Cloud Build, Cloud Deploy approval | One project per app, Cloud Run behind IAP | 102 | 91 | 11 | 0 |
| On-premises | agent-sandbox on gVisor or Kata | GitLab CI, Argo CD manual sync by the owner's group | One namespace per app behind Keycloak | 85 | 74 | 11 | 0 |
| **Total** | | | | **403** | **356** | **46** | **1** |

What the checks changed, in the terms a builder would feel:

- **Azure.** CodeQL cannot run inside a GitHub ruleset workflow (the one wrong claim), so it runs
  by default setup and merges wait on its results. Sandbox egress needs full traffic inspection,
  or non-web traffic leaves despite a default deny.
- **AWS.** The guardrail policy must exempt the role ECS uses to shift canary traffic, or every
  canary fails. A Cognito sign-in in front of a preview admits anyone the pool signs in, so the
  pool federates only to an app assigned to the requester and the owner.
- **Google Cloud.** Anyone who can deploy can break glass past Binary Authorization unless an
  organisation policy denies the annotation. Secure Source Manager can gate merges only on
  triggers-file triggers.
- **On-premises.** The template step that creates the agent's GitLab token defaults to Maintainer,
  which can merge; the setting asks for Developer. A sandbox claim cannot mount secrets.

Box names on the drawing were shortened where they would have pushed it past 1080 pixels; each
box's note keeps the full description.

## Keeping it current

A mapping is only as good as its last check. `verified` on each mapping and each setting says
when that was. To re-check one: read the vendor's current page for every component and setting,
update `sources`, `differences`, `alsoNeeded` and `quickstart`, correct what moved and re-date
it. The `pattern-author` skill describes the fields; the tests fail a mapping with no date, a
named component with no source page, or a difference that points at a flow the pattern does not
have.
