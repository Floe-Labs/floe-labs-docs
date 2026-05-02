# Glossary Additions

These terms are not in the current glossary but are central to Floe's positioning. Merge into the existing `/reference/glossary` page.

---

**ACP — Agent Commerce Protocol.** Onchain protocol for agents to transact with each other and with services. Source of deterministic agent revenue Floe can underwrite against.

**Bureau (Floe Credit Bureau).** Floe's persistent trust and credit profile system for agents and merchants. Tracks revenue, repayment, counterparty quality, CoT score, and task success rate. Queryable via Credit REST API.

**CoT — Chain of Thought.** Structured reasoning emitted by an agent prior to or during execution. Floe uses CoT signals (planned tool calls, cost estimates, plan feasibility) as a forward-looking underwriting input.

**Deferred settlement.** Floe's mechanism for extending credit at the HTTP 402 boundary — Floe pays the resource server in USDC; the agent accumulates debt against its credit profile and repays via sweeps.

**Deterministic cashflow.** A future cashflow whose existence and amount can be programmatically verified — e.g. an x402 receipt stream, a signed ACP contract, a counterparty's recurring payment record. The basis for Floe's underwriting.

**ERC-8004.** Onchain identity standard for agents. Required for Tier 3 (uncollateralized) credit on Floe.

**Facilitator (x402 facilitator).** A service that processes x402 payments. Floe is a *credit-enabled* facilitator — the only one offering deferred settlement.

**Lien (Floe lien).** Onchain priority claim on a borrower's future inbound cashflow. The basis for Tier 2 and Tier 3 repayment mechanics.

**LP (Liquidity Provider).** An institutional or permissioned-pool participant providing capital to be deployed via Floe-originated credit.

**Origination.** The act of creating a new loan — at intent match (Tier 1) or via Floe's underwriting engine (Tier 2 / Tier 3).

**Policy engine.** Floe's underwriting decision system. Inputs: bureau profile, CoT, market conditions. Outputs: limit, advance %, sweep %, rate, term.

**Receivable.** A signed invoice or contractual right to future payment. Tier 2's pledged asset.

**Solver (matcher).** Permissionless off-chain bot that matches compatible lend + borrow intents and submits the match transaction onchain. Earns matcher commission.

**Sweep (lien sweep).** Automatic routing of a configured percentage of inbound USDC to repay a Floe advance, before the remainder reaches the borrower's operating wallet.

**Tier (1 / 2 / 3).** Floe's three credit tiers — Secured (collateral), Receivables-backed (lien on invoices), Uncollateralized agent credit (bureau-based).

**x402.** Open standard for HTTP-native USDC payments. Foundation for Tier 3 deferred settlement.
