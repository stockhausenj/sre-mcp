#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let apiKey: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--api-key":
        apiKey = args[++i];
        break;
      case "--help":
        console.error(`
Web Search MCP Server - Search the web using Brave Search API

Usage:
  web-search-mcp-server --api-key <key>

Required:
  --api-key <key>    Brave Search API key (get from https://brave.com/search/api/)

Environment Variables:
  BRAVE_API_KEY      Alternative to --api-key flag
        `);
        process.exit(0);
    }
  }

  // Check environment variable if not provided via CLI
  apiKey = apiKey || process.env.BRAVE_API_KEY;

  if (!apiKey) {
    console.error("Error: Brave Search API key is required");
    console.error("Provide via --api-key flag or BRAVE_API_KEY environment variable");
    process.exit(1);
  }

  return { apiKey };
}

async function braveSearch(query: string, apiKey: string): Promise<any> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

function formatSearchResults(data: any): string {
  const results: string[] = [];

  if (data.web?.results) {
    results.push("# Web Results\n");
    for (const result of data.web.results.slice(0, 10)) {
      results.push(`## ${result.title}`);
      results.push(`URL: ${result.url}`);
      results.push(`${result.description}\n`);
    }
  }

  if (data.news?.results) {
    results.push("\n# News Results\n");
    for (const result of data.news.results.slice(0, 5)) {
      results.push(`## ${result.title}`);
      results.push(`URL: ${result.url}`);
      results.push(`${result.description}`);
      results.push(`Published: ${result.age}\n`);
    }
  }

  return results.join("\n");
}

async function main() {
  const config = parseArgs();

  const server = new Server(
    {
      name: "web-search-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "web_search",
          description:
            "Search the web for current information, documentation, GitHub issues, Stack Overflow answers, error solutions, or any information not in your training data. Returns relevant web pages and news articles. Use this when you need up-to-date information or solutions to specific problems.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description:
                  "The search query. Be specific and include relevant keywords (e.g., 'kubernetes CrashLoopBackOff github issues', 'cert-manager DNS01 challenge failing')",
              },
            },
            required: ["query"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "web_search") {
      const query = args?.query as string;
      if (!query) {
        return {
          content: [
            {
              type: "text",
              text: "Error: query parameter is required",
            },
          ],
          isError: true,
        };
      }

      try {
        const searchResults = await braveSearch(query, config.apiKey);
        const formattedResults = formatSearchResults(searchResults);

        return {
          content: [
            {
              type: "text",
              text: formattedResults,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error performing web search: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Unknown tool: ${name}`,
        },
      ],
      isError: true,
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Web Search MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
