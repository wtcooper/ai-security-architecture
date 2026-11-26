# Where the daily run looks

Every lead is read on its primary source before it becomes an item; a lead whose page will not
load is not filed. The lists below are where leads come from; the source cited is always the
vendor, the project, the agency, the standards body or the researcher. Lists change: when a
source moves or a new one matters, update this page.

## Product updates (about 8 searches)

Read the window's entries on each vendor's own security page, release notes or changelog. A
search of the form `site:<docs host> <product> security <month year>` or `"<product>" changelog
<month year>` finds most of them. Read the raw page where there is one (the `.md` of a docs page,
the raw `CHANGELOG.md` on raw.githubusercontent.com): summaries miss entries. Cite the entry's
own anchor where the page has one, so two items from one changelog cite two entries.

| Vendor | Products to sweep |
| --- | --- |
| Anthropic | Claude Code (settings, managed settings, changelog), the Claude apps (Team and Enterprise admin, release notes), the API and the Agent SDK, Claude for Chrome |
| OpenAI | ChatGPT Enterprise and Business (admin and compliance), Codex (CLI, cloud), the API and the Agents SDK |
| Microsoft | Foundry (guardrails, agent service), Microsoft 365 Copilot and Copilot Studio, Entra (agent identity), Purview (AI data security), Defender for Cloud (AI threat protection), GitHub (Copilot, its coding agent, secret scanning) |
| Google Cloud | Vertex AI, Agent Engine, Model Armor, Security Command Center (AI protection), Gemini Enterprise, Gemini CLI, Workspace admin |
| AWS | Bedrock, Bedrock Guardrails, AgentCore, Security Hub, Quick; AWS What's New |
| Others | Cursor, xAI, Meta, Mistral, Salesforce (Agentforce), ServiceNow |
| On the site | Every product in `data/tooling/` (`daily-index.mjs --products`): a setting on its page in the window is a settings row and, usually, a brief in that product's weekly roll-up |

A lead found in the sweep and left unread is a miss: the reviews of the first runs found product
updates in the window on AWS What's New that were never opened. Open each, then judge.

## Security tools (about 5)

- GitHub releases and trending in the window for: MCP scanner, skills scanner, agent guardrails,
  prompt injection detection, LLM red team, AI gateway, model scanning, AI SBOM.
- Vendor launches from AI security companies (the research blogs below).
- Hacker News "Show HN" with those terms: a lead, never the source, and never the release date.

For every tool, find its **first release** before filing: the package registry
(`https://registry.npmjs.org/<package>` and its `time.created`; `https://pypi.org/pypi/<package>/json`
and its earliest upload), or the repository's releases and tags (the oldest), or its first
commit. A tool first released before the window is not new, whatever the post's date. A library
that merely calls a model is not a security tool; a prototype or research artifact is research.

## Launches (about 3)

New AI products and features that change where data goes or what an organisation can control:
private or regional inference, new agent runtimes and hosted sessions, connectors and memory,
computer and browser use, agent identity, new admin consoles. Labs' and clouds' announcement
pages; the security angle must be in the source, not inferred.

## Guidance and research (about 4)

- **Guidance**: labs' and vendors' accounts of how they secure their own AI systems (how they
  red-team, evaluate, sandbox and run agents; AI-native secure development and code scanning);
  standards and agencies: OWASP GenAI (LLM Top 10, Agentic, MCP Top 10), MITRE ATLAS releases,
  NIST (AI RMF profiles, SP 800 series), CoSAI, CSA, CISA, NCSC and their peers' joint guidance.
  Read the document, and what changed from its last version, before filing.
- **Research**: security research blogs (Wiz, Palo Alto Unit 42, Google Threat Intelligence,
  Microsoft Threat Intelligence, Trail of Bits, Check Point, Snyk and Invariant Labs,
  HiddenLayer, Zenity, Pillar, Lasso, Noma, Legit, JFrog, Socket, Koi), AI safety institutes, and
  papers with measured results.

An attack write-up or campaign report from these blogs (actors, intrusions, detections for a live
campaign) is an **incident** lead: hand it to the incident lane, even when it comes with hunting
queries.

## Incidents (about 20)

`incident-research`'s lanes, by its **Daily run**: trackers, vendor disclosures, vulnerabilities,
agencies and security press.

## Leads only

Hacker News (front page and Show HN, searched with AI security terms), newsletters (TLDR AI,
tl;dr sec and their like), aggregators, social posts and roundups. Read them for what to look
for; never cite them when the primary source exists (`feed-lint` fails a lead cited as the
primary). If the primary source does not exist or will not load, there is no item.
