#!/usr/bin/env node

import { MCPClientManager, MCPServerConfig } from './mcp-client.js';
import { OllamaAgent } from './ollama-agent.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import * as readline from 'readline';

interface Config {
  model?: string;
  systemPrompt?: string;
  mcpServers: MCPServerConfig[];
}

function loadConfig(): Config {
  const configPaths = [
    './.ollama-mcp.json',
    './config.json',
    resolve(process.env.HOME || '~', '.config/ollama-mcp/config.json'),
  ];

  for (const path of configPaths) {
    if (existsSync(path)) {
      console.error(`Loading config from: ${path}`);
      const content = readFileSync(path, 'utf-8');
      return JSON.parse(content);
    }
  }

  throw new Error(`No config file found. Checked: ${configPaths.join(', ')}`);
}

function parseArgs(): Partial<Config> {
  const args = process.argv.slice(2);
  const config: Partial<Config> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--model':
      case '-m':
        config.model = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Ollama MCP Client - Chat with local LLM that can use MCP tools

Usage:
  ollama-mcp [options]

Options:
  -m, --model <name>    Ollama model to use (default: from config)
  -h, --help           Show this help message

Configuration:
  Create a .ollama-mcp.json or config.json file in the current directory:

  {
    "model": "qwen2.5:latest",
    "systemPrompt": "You are a helpful SRE assistant with access to SSH and Kubernetes tools.",
    "mcpServers": [
      {
        "name": "ssh-server",
        "command": "node",
        "args": [
          "/path/to/sre-mcp/packages/ssh/build/index.js",
          "--host", "192.168.1.100",
          "--username", "pi",
          "--key", "~/.ssh/id_rsa"
        ]
      },
      {
        "name": "kubernetes-server",
        "command": "node",
        "args": [
          "/path/to/sre-mcp/packages/kubernetes/build/index.js",
          "--kubeconfig", "~/.kube/config"
        ]
      }
    ]
  }

Examples:
  # Use default model from config
  ollama-mcp

  # Use specific model
  ollama-mcp --model mistral:latest

  # Interactive chat
  > What pods are running in the default namespace?
  > Check the network connectivity on the remote server
  > exit
        `);
        process.exit(0);
    }
  }

  return config;
}

async function main() {
  console.error('Ollama MCP Client Starting...\n');

  // Load configuration
  let config: Config;
  try {
    config = loadConfig();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    console.error('\nRun with --help for usage information');
    process.exit(1);
  }

  // Override with command line args
  const cliConfig = parseArgs();
  config = { ...config, ...cliConfig };

  // Set default model if not specified
  if (!config.model) {
    config.model = 'qwen2.5:latest';
    console.error(`No model specified, using default: ${config.model}`);
  }

  // Initialize MCP client manager
  const mcpManager = new MCPClientManager();

  try {
    // Connect to all MCP servers
    await mcpManager.connectServers(config.mcpServers);

    console.error(`\nTotal tools available: ${mcpManager.getTools().length}`);
    console.error('Tools:', mcpManager.getTools().map((t) => t.name).join(', '));

    // Create Ollama agent
    const agent = new OllamaAgent(mcpManager, {
      model: config.model,
      systemPrompt: config.systemPrompt || 'You are a helpful SRE assistant with access to SSH and Kubernetes tools. Use the available tools to help users manage their infrastructure.',
    });

    console.error('\n=== Chat Started (type "exit" to quit) ===\n');

    // Start interactive chat
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> ',
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const input = line.trim();

      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        console.log('\nGoodbye!');
        await mcpManager.disconnect();
        process.exit(0);
      }

      if (input.toLowerCase() === 'clear') {
        agent.clearHistory();
        console.log('Conversation history cleared.\n');
        rl.prompt();
        return;
      }

      if (input.toLowerCase() === 'tools' || input.toLowerCase() === 'list') {
        const tools = mcpManager.getTools();
        console.log(`\nAvailable tools (${tools.length}):\n`);

        // Group tools by server
        const toolsByServer = new Map<string, typeof tools>();
        for (const tool of tools) {
          if (!toolsByServer.has(tool.serverName)) {
            toolsByServer.set(tool.serverName, []);
          }
          toolsByServer.get(tool.serverName)!.push(tool);
        }

        for (const [serverName, serverTools] of toolsByServer) {
          console.log(`${serverName}:`);
          for (const tool of serverTools) {
            console.log(`  - ${tool.name}: ${tool.description || 'No description'}`);
          }
        }
        console.log();
        rl.prompt();
        return;
      }

      if (input.toLowerCase() === 'help') {
        console.log(`
Available commands:
  help     - Show this help message
  tools    - List all available MCP tools and servers
  list     - Alias for 'tools'
  clear    - Clear conversation history
  exit     - Exit the client
  quit     - Alias for 'exit'

Or just ask a question to chat with the AI assistant!
`);
        rl.prompt();
        return;
      }

      if (!input) {
        rl.prompt();
        return;
      }

      try {
        // Get response from agent
        const response = await agent.chat(input);
        console.log(`\n${response}\n`);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
      }

      rl.prompt();
    });

    rl.on('close', async () => {
      console.log('\nGoodbye!');
      await mcpManager.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Fatal error:', error);
    await mcpManager.disconnect();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
