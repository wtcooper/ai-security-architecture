# The digest

The run's final message. The owner reads it as an email and as a notification, so the first two
lines must stand alone, and every line after is one the owner can act on or skip. It is written
**after** the gate passed and the push went through, and it reports only what was published.

## Build it

```bash
node .claude/skills/ai-security-daily/scripts/daily-index.mjs --digest --base <the base commit from §1>
```

prints the skeleton from what changed since the base: today's overview, the new headline and
notable items with their links, what went on the site, and the waiting proposals, numbered. Then:

- fill in **Problems**;
- turn the **Corrected** line into a line per correction (what was wrong, what it says now);
- shorten any line that wraps twice; keep the order and the numbers as printed.

The links are `https://wtcooper.github.io/ai-security-architecture/feed/#<id>` (the deploy sets
the base path `/ai-security-architecture`). Copy the numbered **Waiting for you** list into the
log, so a reply's numbers can be matched later.

## The order

1. **The date line**: `AI security daily · Thursday 26 November 2026`.
2. **Today's overview**, as written in `data/feed/overviews.yaml`.
3. **Headlines**, then **Notable**: one line each, by kind (incident, product update, tool,
   launch, guidance, research), as `- <Kind>: <title> <link>`, with the story's title in brackets
   when the item is in one. Briefs are a count: "And 6 briefs on the site."
4. **On the site**: the changes applied (settings rows, security tools, deep dives, new incident
   patterns, approved changes carried out, corrections), one line each with its file or id.
5. **Waiting for you**: the proposals, **numbered**, newest first, each a one-line description
   and its id in brackets.
6. **Problems**: what the owner should know went wrong or was held back: verification that was
   not independent or did not complete; entries dropped at the gate, and why, in a few words;
   pages that would not load; a build or test failure; "None." when there were none.
7. The closing line: `To act on a proposal, reply in this session: approve 2, decline 3.`

## Example

```text
AI security daily · Thursday 26 November 2026

Google will require AI agents to reach Workspace through its MCP servers or CLI from 1 February,
and NebuSec showed a saved page taking Meta Muse to root past its egress guard. Two more agency
reports describe AI-run intrusions.

Headlines
- Incident: NebuSec takes Meta Muse from a saved page to root in its VM https://wtcooper.github.io/ai-security-architecture/feed/#nebusec-meta-muse-escape
- Launch: Workspace agents must use Google's MCP servers or CLI from 1 February https://wtcooper.github.io/ai-security-architecture/feed/#google-workspace-agents-mcp-required

Notable
- Incident: Unit 42 times agent-run intrusions at 1.4 seconds between commands (AI-run intrusions: CyberStrikeAI) https://wtcooper.github.io/ai-security-architecture/feed/#unit42-agentic-attack-campaigns
- Guidance: Microsoft's detections and hunting queries for ARTEX intrusions https://wtcooper.github.io/ai-security-architecture/feed/#microsoft-artex-defender-guidance

And 4 briefs on the site.

On the site
- Settings row: Claude Code disableDirectMcpSkills (data/tooling/anthropic/claude-code.yaml)
- Corrected: wiz-artex-harvester now tells ARTEX-Harvester only; the EKS intrusion is its own item

Waiting for you
1. Onboard: Claude Ship on the agentic software factory (claude-ship-beta)
2. Control guidance: AML.M0038, evaluate monitors across several attack policies (aisi-monitor-evaluations-attack-policy)
3. Onboard: Vercel AI Gateway as a product of its own; the AI SDK's file excludes it (vercel-ai-gateway-audited-zdr)

Problems
- Two briefs dropped at the gate: a tool whose first release was in March, and a guidance item whose PDF would not load.

To act on a proposal, reply in this session: approve 2, decline 3.
```

## After a reply

The answer to the owner's reply is a short digest of the same shape: the date line; **Done**
(each approved change, with its file); **Declined**; **Still waiting** (with the numbers they
had); **Problems**.
