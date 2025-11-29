#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { KubeManager } from "./kube-manager.js";

const server = new Server(
  {
    name: "kube-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const kubeManager = new KubeManager();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_pods",
        description: "Get list of pods in a namespace",
        inputSchema: {
          type: "object",
          properties: {
            namespace: {
              type: "string",
              description: "Kubernetes namespace (default: default)",
            },
          },
        },
      },
      {
        name: "get_nodes",
        description: "Get list of nodes in the cluster",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "kubectl",
        description: "Execute kubectl command",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "kubectl command to execute (e.g., 'get pods -n default')",
            },
          },
          required: ["command"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_pods": {
        const namespace = (args?.namespace as string) || "default";
        const result = await kubeManager.getPods(namespace);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_nodes": {
        const result = await kubeManager.getNodes();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "kubectl": {
        const command = args?.command as string;
        if (!command) {
          throw new Error("Command is required");
        }
        const result = await kubeManager.executeKubectl(command);
        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Kubernetes MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
