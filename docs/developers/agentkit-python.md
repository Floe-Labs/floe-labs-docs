---
icon: python
---

# Python SDK

The `floe-agentkit-actions` package provides Coinbase AgentKit ActionProviders with **45 total actions** (30 in `FloeActionProvider` + 15 in `X402ActionProvider` — 6 credit delegation + 9 agent-awareness) for Python 3.10+ environments.

> **Parity note.** As of May 2026, the Python SDK has full parity with the TypeScript SDK: 30 Floe actions, 6 X402 credit-delegation actions, and 9 agent-awareness actions (45 total). The previously TS-only credit-facility actions (`instant_borrow`, `repay_and_reborrow`, `request_credit`, `manual_match_credit`, `check_credit_status`, `repay_credit`, `renew_credit_line`) and the v0.3.0 agent-awareness actions are all available in Python.

> **Naming convention:** All action names and parameters in the Python SDK use **snake_case** (e.g., `borrow_amount`, `max_interest_rate_bps`). The TypeScript SDK uses camelCase for the same fields. Code examples are not interchangeable between SDKs without adjusting case.

## Installation

```bash
# Core package
pip install floe-agentkit-actions

# With CLI support
pip install floe-agentkit-actions[cli]

# With LangChain integration
pip install floe-agentkit-actions[langchain]
```

## Quick Start

### As an AgentKit Provider

```python
from coinbase_agentkit import AgentKit, AgentKitConfig
from floe_agentkit_actions import floe_action_provider

agentkit = AgentKit(AgentKitConfig(
    wallet_provider=wallet_provider,
    action_providers=[floe_action_provider()],
))
```

### Standalone Usage

Call actions directly without an AI framework:

```python
from floe_agentkit_actions import floe_action_provider

floe = floe_action_provider()
result = floe.get_price(wallet_provider, {
    "collateral_token": "0x4200000000000000000000000000000000000006",  # WETH
    "loan_token": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",      # USDC
})
print(result)
```

## Framework Integrations

### LangChain

```python
from floe_agentkit_actions.integrations.langchain import get_floe_langchain_tools

tools = get_floe_langchain_tools(wallet_provider)
# Pass tools to a LangChain agent
```

### OpenAI Function Calling

```python
from floe_agentkit_actions.integrations.openai_agents import get_floe_openai_tools

tools = get_floe_openai_tools(wallet_provider)
# Pass tools to an OpenAI Agents SDK agent
```

## CLI: `floe-agent`

Interactive AI-powered DeFi agent with support for OpenAI, Claude, and Ollama.

```bash
# Install with CLI extras
pip install floe-agentkit-actions[cli]

# Run
floe-agent
```

The CLI prompts for wallet provider, AI provider, and RPC URL. Configuration is saved for reuse.

### Example Session

```
You: What markets are available?
  -> Lists all Floe lending markets with rates, LTV bounds

You: Post a lend intent for 100 USDC at 5% APR
  -> Auto-approves USDC, posts the lending offer on-chain

You: Check the health of loan #42
  -> Shows current LTV, liquidation threshold, buffer percentage
```

## Wallet Providers

| Provider | Use Case |
|----------|----------|
| `EvmWalletProvider` | **Development / scripting** — raw private key |
| `CdpWalletProvider` | **Production agents** — MPC-managed via CDP API |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Wallet private key (0x...) |
| `CDP_API_KEY_NAME` | Coinbase CDP API key name |
| `CDP_API_KEY_PRIVATE_KEY` | Coinbase CDP API secret |
| `OPENAI_API_KEY` | OpenAI API key (for CLI) |
| `ANTHROPIC_API_KEY` | Anthropic API key (for CLI) |
| `BASE_RPC_URL` | Custom Base RPC URL (recommended) |

## Development

```bash
# Install in editable mode with dev dependencies
pip install -e ".[dev]"

# Run tests
pytest
```

## Agent Awareness Actions (v0.3.0+)

The `X402ActionProvider` now includes 9 actions that let an agent reason about its own credit before committing capital. Configure `facilitator_api_key` to enable them:

```python
from floe_agentkit_actions import x402_action_provider, X402Config

x402 = x402_action_provider(X402Config(
    facilitator_url="https://credit-api.floelabs.xyz/v1",
    facilitator_api_key=os.environ["FLOE_AGENT_API_KEY"],  # floe_*
))
```

Action names: `get_credit_remaining`, `get_loan_state`, `get_spend_limit`, `set_spend_limit`, `clear_spend_limit`, `list_credit_thresholds`, `register_credit_threshold`, `delete_credit_threshold`, `estimate_x402_cost`. See [Agent Awareness](agent-awareness.md) for the decision-loop pattern.

## Source Code

GitHub: [Floe-Labs/agentkit-actions-py](https://github.com/Floe-Labs/agentkit-actions-py)
