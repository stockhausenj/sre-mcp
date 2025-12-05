#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { SSHManager, SSHConfig } from './ssh-manager.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
function parseArgs(): { config: SSHConfig; disableResources: boolean } {
  const args = process.argv.slice(2);
  const config: Partial<SSHConfig> = {};
  let disableResources = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--host':
        config.host = args[++i];
        break;
      case '--port':
        config.port = parseInt(args[++i], 10);
        break;
      case '--username':
        config.username = args[++i];
        break;
      case '--password':
        config.password = args[++i];
        break;
      case '--key':
        config.privateKeyPath = args[++i];
        break;
      case '--passphrase':
        config.passphrase = args[++i];
        break;
      case '--disable-resources':
        disableResources = true;
        break;
      case '--help':
        console.error(`
SSH MCP Server - Execute commands on remote servers via SSH

Usage:
  ssh-mcp-server --host <host> --username <user> [options]

Required:
  --host <host>          Remote host IP or hostname
  --username <user>      SSH username

Authentication (choose one):
  --password <pass>      SSH password
  --key <path>          Path to SSH private key
  --passphrase <pass>   Passphrase for private key (optional)

Optional:
  --port <port>            SSH port (default: 22)
  --disable-resources      Disable documentation resources (use when web search is available)
  --help                   Show this help message

Examples:
  # Using password authentication
  ssh-mcp-server --host 192.168.1.100 --username pi --password raspberry

  # Using SSH key authentication
  ssh-mcp-server --host 192.168.1.100 --username pi --key ~/.ssh/id_rsa

  # With web search available (disable local docs)
  ssh-mcp-server --host 192.168.1.100 --username pi --key ~/.ssh/id_rsa --disable-resources
        `);
        process.exit(0);
        break;
    }
  }

  if (!config.host || !config.username) {
    console.error('Error: --host and --username are required');
    console.error('Use --help for usage information');
    process.exit(1);
  }

  if (!config.password && !config.privateKeyPath) {
    console.error('Error: Either --password or --key must be provided');
    console.error('Use --help for usage information');
    process.exit(1);
  }

  return { config: config as SSHConfig, disableResources };
}

// Initialize SSH connection
const { config, disableResources } = parseArgs();
const sshManager = new SSHManager(config);

// Create MCP server
const server = new Server(
  {
    name: 'ssh-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'exec',
    description: 'Execute a shell command on the remote server',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 60000)',
          default: 60000,
        },
      },
      required: ['command'],
    },
  },
];

// Handle tool list requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle resource list requests
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  // If resources are disabled (e.g., web search is available), return empty list
  if (disableResources) {
    return { resources: [] };
  }

  return {
    resources: [
      {
        uri: 'file:///network-troubleshooting',
        name: 'Network Troubleshooting Guide',
        description: 'Comprehensive Linux network troubleshooting commands and workflows',
        mimeType: 'text/markdown',
      },
    ],
  };
});

// Handle resource read requests
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === 'file:///network-troubleshooting') {
    try {
      // Read the network troubleshooting markdown file from the docs directory
      const docsPath = resolve(__dirname, '../docs/network-troubleshooting.md');
      const content = readFileSync(docsPath, 'utf-8');

      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: content,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to read network troubleshooting guide: ${error}`);
    }
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// Handle tool execution requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'exec') {
    const command = args?.command as string;
    const timeout = (args?.timeout as number) || 60000;

    if (!command) {
      throw new Error('command is required');
    }

    try {
      // Connect if not already connected
      if (!sshManager.isConnected()) {
        await sshManager.connect();
      }

      // Execute command
      const result = await sshManager.exec(command, timeout);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                exitCode: result.exitCode,
                stdout: result.stdout,
                stderr: result.stderr,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: errorMessage,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  sshManager.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  sshManager.disconnect();
  process.exit(0);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SSH MCP Server running on stdio');
  console.error(`Connected to: ${config.username}@${config.host}:${config.port || 22}`);
  if (!disableResources) {
    console.error('Resources available: Network Troubleshooting Guide');
  } else {
    console.error('Resources disabled (web search available)');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
