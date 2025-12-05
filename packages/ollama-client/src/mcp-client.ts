import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
}

export interface Tool {
  name: string;
  description?: string;
  inputSchema: any;
  serverName: string;
}

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();
  private tools: Tool[] = [];

  async connectServer(config: MCPServerConfig): Promise<void> {
    console.error(`Connecting to MCP server: ${config.name}...`);

    const client = new Client(
      {
        name: 'ollama-mcp-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Create transport that will spawn the MCP server process
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
    });

    await client.connect(transport);

    // Store the client
    this.clients.set(config.name, client);

    // List available tools from this server
    const toolsResult = await client.listTools();

    // Add server name to each tool for tracking
    const serverTools = toolsResult.tools.map((tool) => ({
      ...tool,
      serverName: config.name,
    }));

    this.tools.push(...serverTools);

    console.error(`Connected to ${config.name}: ${serverTools.length} tools available`);
  }

  async connectServers(configs: MCPServerConfig[]): Promise<void> {
    for (const config of configs) {
      await this.connectServer(config);
    }
  }

  getTools(): Tool[] {
    return this.tools;
  }

  async callTool(toolName: string, args: any): Promise<any> {
    // Find which server provides this tool
    const tool = this.tools.find((t) => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    const client = this.clients.get(tool.serverName);
    if (!client) {
      throw new Error(`Server not connected: ${tool.serverName}`);
    }

    // Call the tool
    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });

    return result;
  }

  async disconnect(): Promise<void> {
    // Close all client connections
    for (const [name, client] of this.clients) {
      try {
        await client.close();
      } catch (error) {
        console.error(`Error closing client ${name}:`, error);
      }
    }

    this.clients.clear();
    this.tools = [];
  }
}
