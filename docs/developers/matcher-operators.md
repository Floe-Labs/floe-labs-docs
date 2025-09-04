# Matcher Operator Guide

**Prereqs:** Node 18+, DB cache, RPC.

**Flow:** subscribe → compute pairings → simulate → submit → collect fee.

**Config:** feeBps, oracleMaxAge, gasTipPolicy, collateralWhitelist, maxSlippageBps.

**Reliability:** retries with sim, reorg backoff, MEV‑protect submission.
