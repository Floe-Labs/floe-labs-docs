---
icon: chart-radar
---

# Credit Scores

Floe integrates with [Cred Protocol](https://cred.xyz) to display on-chain credit scores, giving lenders and borrowers transparency into counterparty creditworthiness.

## What Are Credit Scores?

Credit scores are computed by Cred Protocol based on your on-chain lending and borrowing history across DeFi protocols. They reflect your track record of repaying loans, maintaining healthy collateral ratios, and avoiding liquidations.

Scores are **read-only** — Floe displays them but does not compute them. Your score is the same across all protocols that integrate Cred.

## Where Scores Appear

### Dashboard Radar Chart

Your credit profile is visualized as a radar chart on the dashboard, showing multiple dimensions of your on-chain activity:

* Repayment history
* Collateral management
* Protocol diversity
* Activity volume
* Account age

### Loan Book Badges

When browsing the loan book, each intent displays a credit tier badge for the counterparty. This helps lenders assess borrower reliability and helps borrowers identify established lenders.

### Credit Tiers

| Tier | Description |
|------|-------------|
| Excellent | Strong on-chain track record, minimal liquidations |
| Good | Solid history with occasional risk events |
| Fair | Limited history or some negative events |
| New | Insufficient on-chain history to score |

## Sharing Your Score

You can share your credit score as a card image on social media. The share feature generates a tier-aware template with your score visualization, optimized for X/Twitter and other platforms.

1. Go to the Dashboard
2. Click the share button on your credit score card
3. Copy the link or download the image

## How Scores Affect Usage

Credit scores are **informational only** — they do not gate access to any Floe features. Any wallet can lend, borrow, and interact with the protocol regardless of score.

However, scores are visible to counterparties in the loan book, which may influence matching decisions when users manually select intents to match with.
