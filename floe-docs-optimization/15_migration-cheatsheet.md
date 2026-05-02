# Migration Cheatsheet — Existing Pages

What to do with each page that's already in the docs. Pair this with the new files in this package.

---

## Existing pages — action by page

| Existing page | Action | Why |
|---|---|---|
| `/` (Introduction) | **Replace** with `01_introduction.md` | Reframes from "P2P lending on Base" to "credit layer for AI agents" — matches deck positioning |
| `/getting-started/quick-start` | **Keep, light edits.** Add a banner at top: "Building an agent? See [Quick Start (Agents)](./quick-start-agents.md)." | Existing flow is good for humans |
| `/getting-started/quick-start-agents` | **NEW** — `04_quickstart-agents.md` | Mirrors human Quick Start for agent operators |
| `/getting-started/core-concepts` | **Replace** with `02_core-concepts.md` | Reframes mechanics around three credit tiers + bureau; keeps all existing technical content |
| `/why-floe` | **NEW** — `03_why-floe.md` | Positioning page; deck content adapted |
| `/agents/credit-for-agents` | **NEW** — `05_credit-for-agents.md` | Top of agent operator funnel |
| `/agents/three-credit-tiers` | **NEW** — `06_three-credit-tiers.md` | Detailed tier mechanics |
| `/agents/x402-deferred-settlement` | **NEW** — `07_x402-deferred-settlement.md` | Tier 3 deep-dive |
| `/agents/cot-underwriting` | **NEW** — `08_cot-underwriting.md` | Bureau + CoT scoring |
| `/agents/pricing-limits` | **NEW** — TODO (template included in `06_three-credit-tiers.md`'s "Pricing snapshot" section) | Indicative ranges per profile |
| `/user-guides/lend` | **Keep** — no changes | Works for current Tier 1 users |
| `/user-guides/borrow` | **Keep** — no changes | Works for current Tier 1 users |
| `/user-guides/risk-liquidations` | **Keep** — light edit: add note that this applies to Tier 1 only; Tiers 2/3 use sweep mechanic | Disambiguates as tiers expand |
| `/user-guides/credit-scores` | **Keep, light edit.** Add cross-link: "For agent credit scoring (Tier 3), see [CoT Underwriting & the Credit Bureau](../agents/cot-underwriting.md)." | Disambiguates Cred Protocol scores from Floe Bureau |
| `/user-guides/lendr-ai` | **Keep** — add brief mention of MCP server as the agent equivalent | Cross-link |
| `/protocol/architecture` | **Keep** — add diagram showing where Tier 2 sweep contracts and Tier 3 facilitator sit (when those launch) | Architectural completeness |
| `/protocol/orderbook-matching` | **Keep** — no changes | Mechanics unchanged |
| `/protocol/oracles-conditions` | **Keep** — no changes | Mechanics unchanged |
| `/protocol/flash-loans` | **Keep** — no changes | Mechanics unchanged |
| `/protocol/security` | **Keep, light edit.** Add per-tier risk summary at top (cross-references Tier 2/3 risk frameworks). | Risk completeness |
| `/protocol/credit-bureau` | **NEW** (optional, advanced) | Could host the technical bureau scoring spec |
| `/developers/run-solver-bot` | **Keep** | OK as-is |
| `/developers/run-liquidation-bot` | **Keep** | OK as-is |
| `/developers/agentkit/` (and TS / Python sub-pages) | **Keep, light edits.** Add intro paragraph emphasizing Floe is a *credit primitive*, not just a lending tool. Add cross-link to Quick Start (Agents). | Frames AgentKit page as the credit-protocol entrypoint |
| `/developers/agent-working-capital` | **Keep** — note that Tier 3 (Q3) extends this | Forward reference |
| `/developers/credit-api` | **Keep, expand.** Add bureau endpoints (profile, score, CoT submission) per `08_cot-underwriting.md` schema | Critical surface for agent integrations |
| `/developers/mcp-server` | **NEW** — `11_mcp-server.md` | Currently MCP is mentioned in the deck but not surfaced as a top-level developer surface in docs |
| `/reference/networks` | **Keep** | OK |
| `/reference/roadmap` | **NEW** — `12_roadmap.md` | Surfaces Q3 launches publicly |
| `/reference/general` (FAQ) | **Keep, expand.** Add agent-economy FAQ entries (see additions below). | Cover Tier 2/3 questions early |
| `/reference/glossary` | **Keep, expand** with `13_glossary-additions.md` | Adds agent-economy terms |
| `/reference/changelog` | **Keep** | OK |
| `/llms.txt` (root) | **NEW** — `14_llms.txt` | First-class agent discovery |

---

## FAQ additions (drop into existing FAQ page)

**Q: What's the difference between Floe Tier 1 and Aave?**
A: Aave is pool-based with variable rates. Floe Tier 1 is intent-based with fixed rates and per-loan isolated escrow — bad debt doesn't spread between loans. See [How Floe Differs from Aave/Compound](../developers/agentkit/#how-floe-differs-from-aave-compound).

**Q: My agent doesn't have any onchain history. Can it borrow?**
A: Yes — on Tier 1 (secured). Post WETH or cbBTC as collateral and you can borrow today regardless of history. Tier 1 is also how agents *build* the bureau profile that unlocks Tier 3 (uncollateralized) credit when it launches in Q3.

**Q: When does Tier 3 (uncollateralized) launch?**
A: Q3 2026. Identity (ERC-8004) is the gating requirement. Repayment history on Tier 1 is the strongest signal entering Tier 3 launch.

**Q: Is Floe regulated?**
A: Tier 1 is a non-custodial smart-contract protocol on Base. Tier 2 institutional vehicles are structured under a Wilmington Trust-backed wrapper, with permissioned KYB onboarding. Tokenization structure under legal review.

**Q: Can I lend to specific agents?**
A: On Tier 1 today, you set lend intent terms — any borrower meeting them can match. On Tier 2/3 (Q3), permissioned pools will allow LPs to underwrite specific cohorts (e.g., voice agents, browser agents, merchants in a given vertical).

**Q: What happens if my agent burns through credit on a bad task?**
A: Floe's policy engine sets per-loan limits. CoT feasibility checks reduce the chance of underwriting an obviously money-losing task. Smart-contract spend caps (EIP-7702 / ERC-7579) on the wallet side enforce hard ceilings. Persistent overruns affect bureau scoring.

**Q: How do I become an LP?**
A: For institutional capital → [Institutions Overview](../institutions/overview.md). For permissionless lending on Tier 1 today → [How to Lend](../user-guides/lend.md).

**Q: How does Floe make money?**
A: Borrower servicing (~2.86% of credit financed at typical terms), origination (0.1%), and credit scoring as a service (0.01%). Targeting ~$29.7M revenue per $1B credit financed.

---

## Voice / style notes

- Use **Floe** as the protocol name, third person, in reference + protocol pages.
- Use **you** in tutorials and developer docs (Quick Starts, AgentKit pages).
- Avoid "we" except in the institutional / business pages (where it reads more like B2B copy).
- Mark every Tier 2/3 reference with `Q3 2026` until launch.
- Code blocks for procedures > prose with click-here. Especially in agent-facing pages — agents read tokens, not button labels.
- Mermaid diagrams render natively in GitBook. Use them for flows; don't embed PNGs unless screenshots of the actual UI.

---

## Information architecture note

The current sidebar mixes audiences. The proposed sidebar (in `00_OPTIMIZATION_PLAN.md`) groups by audience first:

```
Introduction
Why Floe
Getting Started     ← Quick Start (Humans), Quick Start (Agents), Core Concepts
For Agent Operators ← NEW SECTION
For Users           ← today's User Guides
For Merchants       ← NEW (Q3)
For Institutions    ← NEW (Q3)
Developers          ← keep, add MCP top-level
Protocol            ← keep
Reference           ← add Roadmap
```

This means a developer or operator landing on the docs immediately sees a section labeled for them. Today they have to read the whole sidebar and infer where their use case fits.
