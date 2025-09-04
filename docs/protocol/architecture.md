# Architecture

```
Users/DAOs/Agents ──sign EIP‑712──▶ Off‑Chain Intent Orderbook ─▶ Matcher Network
                                                         │
                                                         └─▶ Execution Bundle ─▶ On‑Chain Settlement (Isolated Loan)
                                                                                  │
                                                                                  └─▶ Hooks (optional)
```
- Off‑chain: capture/validate/search; MEV‑resistant; gasless until settlement.
- On‑chain: minimal, auditable, per‑loan isolation.
