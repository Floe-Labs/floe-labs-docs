"""
Floe MCP + LangChain Example
Connects an AI agent to Floe's lending protocol via MCP.

Requirements:
    pip install langchain langchain-mcp-adapters langchain-openai
"""

import asyncio
import os
from langchain_mcp_adapters import MultiServerMCPClient
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

FLOE_API_KEY = os.environ["FLOE_API_KEY"]  # floe_live_...


async def main():
    async with MultiServerMCPClient(
        {
            "floe": {
                "url": "https://mcp.floelabs.xyz/mcp",
                "headers": {"Authorization": f"Bearer {FLOE_API_KEY}"},
            }
        }
    ) as client:
        tools = client.get_tools()
        print(f"Loaded {len(tools)} Floe tools")

        model = ChatOpenAI(model="gpt-4o")
        agent = create_react_agent(model, tools)

        # Example: browse lending markets
        result = await agent.ainvoke(
            {"messages": [{"role": "user", "content": "Show me the current lending markets on Floe and the best rates available"}]}
        )
        print(result["messages"][-1].content)


if __name__ == "__main__":
    asyncio.run(main())
