# Where the daily run looks

Every lead is checked against its primary source before it becomes an item. The lists below are
where leads come from; the source cited is always the vendor, the project, the agency or the
standards body. Lists change: when a source moves or a new one matters, update this page.

## Product updates (about 8 searches)

Read the window's entries on each vendor's own security page, release notes or changelog. A
search of the form `site:<docs host> <product> security <month year>` or `"<product>" changelog
<month year>` finds most of them.

| Vendor | Products to sweep |
| --- | --- |
| Anthropic | Claude Code (settings, managed settings, changelog), the Claude apps (Team and Enterprise admin), the API and the Agent SDK, Claude for Chrome |
| OpenAI | ChatGPT Enterprise and Business (admin and compliance), Codex (CLI, cloud), the API and the Agents SDK |
| Microsoft | Foundry (guardrails, agent service), Microsoft 365 Copilot and Copilot Studio, Entra (agent identity), Purview (AI data security), Defender for Cloud (AI threat protection), GitHub (Copilot, its coding agent, secret scanning) |
| Google Cloud | Vertex AI, Agent Engine, Model Armor, Security Command Center (AI protection), Gemini Enterprise, Gemini CLI |
| AWS | Bedrock, Bedrock Guardrails, AgentCore, Security Hub |
| Others | Cursor, xAI, Meta, Mistral, Salesforce (Agentforce), ServiceNow |
| On the site | Every product in `data/tooling/` (`daily-index.mjs --products`): a setting on its page in the window is a `productUpdate` and, usually, an applied settings row |

## Security tools (about 5)

- GitHub releases and trending in the window for: MCP scanner, skills scanner, agent guardrails,
  prompt injection detection, LLM red team, AI gateway, model scanning, AI SBOM.
- Vendor launches from AI security companies (the research blogs below).
- Hacker News "Show HN" with those terms: a lead, never the source; cite the repository.

A tool is filed when it has shipped (a tagged release, a GA or public preview announcement) and
its job is protecting AI systems. A library that merely calls a model is not a security tool.

## Launches (about 3)

New AI products and features that change where data goes or what an organisation can control:
private or regional inference, new agent runtimes and hosted sessions, connectors and memory,
computer and browser use, agent identity, new admin consoles. Labs' and clouds' announcement
pages; the security angle must be in the source, not inferred.

## Research and standards (about 4)

- Security research blogs: Wiz, Palo Alto Unit 42, Google Threat Intelligence, Microsoft Threat
  Intelligence, Trail of Bits, Check Point, Snyk and Invariant Labs, HiddenLayer, Zenity, Pillar,
  Lasso, Noma, Legit, JFrog, Socket, Koi, and the labs' own security and safety writing (how they
  red-team, evaluate and run agents securely; AI-native secure development and code scanning).
- Standards and agencies: OWASP GenAI (LLM Top 10, Agentic, MCP Top 10), MITRE ATLAS releases,
  NIST (AI RMF profiles, SP 800 series), CoSAI, CSA, CISA, NCSC and their peers' joint guidance.

An attack write-up from these blogs is an incident lead: hand it to the incident lane.

## Incidents (about 20)

`incident-research`'s lanes, by its **Daily run**: trackers, vendor disclosures, vulnerabilities,
agencies and security press.

## Leads only

Hacker News (front page and Show HN, searched with AI security terms), newsletters (TLDR AI,
tl;dr sec and their like), aggregators, social posts and roundups. Read them for what to look
for; never cite them when the primary source exists. If the primary source does not exist or
will not load, there is no item.
