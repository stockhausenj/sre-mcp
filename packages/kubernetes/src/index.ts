#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { KubeManager } from "./kube-manager.js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = new Server(
  {
    name: "kube-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
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

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "file:///kubectl-troubleshooting",
        name: "kubectl Troubleshooting Guide",
        description: "Comprehensive Kubernetes troubleshooting commands and workflows",
        mimeType: "text/markdown",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === "file:///kubectl-troubleshooting") {
    try {
      const docsPath = resolve(__dirname, "../docs/kubectl-troubleshooting.md");
      const content = readFileSync(docsPath, "utf-8");

      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to read kubectl troubleshooting guide: ${error}`);
    }
  }

  throw new Error(`Unknown resource: ${uri}`);
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
  console.error("Resources available: kubectl Troubleshooting Guide");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
