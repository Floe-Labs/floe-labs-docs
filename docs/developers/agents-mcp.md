# MCP/Agent Integration

- Resources: markets, positions.
- Tools: `intent.create`, `loan.repay`, `position.topup`.
- Elicitation: structured inputs mid‑tool; auth via SiWE/ERC‑1271.

**NL Example:** “Borrow 20k USDC for 90d against 15 ETH, max 5% APR.” → sign → post → settle → monitor → repay.
