#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { SSHManager, SSHConfig } from './ssh-manager.js';

// Parse command line arguments
function parseArgs(): SSHConfig {
  const args = process.argv.slice(2);
  const config: Partial<SSHConfig> = {};

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
  --port <port>         SSH port (default: 22)
  --help                Show this help message

Examples:
  # Using password authentication
  ssh-mcp-server --host 192.168.1.100 --username pi --password raspberry

  # Using SSH key authentication
  ssh-mcp-server --host 192.168.1.100 --username pi --key ~/.ssh/id_rsa

  # Using SSH key with passphrase
  ssh-mcp-server --host 192.168.1.100 --username pi --key ~/.ssh/id_rsa --passphrase mypassphrase
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

  return config as SSHConfig;
}

// Initialize SSH connection
const config = parseArgs();
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
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
