import ollama, { Message, Tool as OllamaTool } from 'ollama';
import { MCPClientManager, Tool } from './mcp-client.js';

export interface AgentConfig {
  model: string;
  systemPrompt?: string;
  maxIterations?: number;
}

export class OllamaAgent {
  private mcpManager: MCPClientManager;
  private config: AgentConfig;
  private conversationHistory: Message[] = [];

  constructor(mcpManager: MCPClientManager, config: AgentConfig) {
    this.mcpManager = mcpManager;
    this.config = {
      maxIterations: 10,
      ...config,
    };

    if (config.systemPrompt) {
      this.conversationHistory.push({
        role: 'system',
        content: config.systemPrompt,
      });
    }
  }

  private convertMCPToolsToOllama(mcpTools: Tool[]): OllamaTool[] {
    return mcpTools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
  }

  async chat(userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    const tools = this.convertMCPToolsToOllama(this.mcpManager.getTools());

    let iteration = 0;
    let finalResponse = '';

    while (iteration < this.config.maxIterations!) {
      iteration++;

      console.error(`\n--- Iteration ${iteration} ---`);

      // Call Ollama with current conversation and available tools
      const response = await ollama.chat({
        model: this.config.model,
        messages: this.conversationHistory,
        tools: tools,
      });

      // Add assistant's response to history
      this.conversationHistory.push(response.message);

      // Check if the model wants to use tools
      if (response.message.tool_calls && response.message.tool_calls.length > 0) {
        console.error(`Model wants to call ${response.message.tool_calls.length} tool(s)`);

        // Execute each tool call
        for (const toolCall of response.message.tool_calls) {
          console.error(`Calling tool: ${toolCall.function.name}`);
          console.error(`Arguments:`, JSON.stringify(toolCall.function.arguments, null, 2));

          try {
            // Call the MCP tool
            const result = await this.mcpManager.callTool(
              toolCall.function.name,
              toolCall.function.arguments
            );

            // Format the result - MCP returns {content: [{type: 'text', text: '...'}]}
            let toolResultText = '';
            if (result.content && Array.isArray(result.content)) {
              toolResultText = result.content
                .map((item: any) => {
                  if (item.type === 'text') {
                    return item.text;
                  }
                  return JSON.stringify(item);
                })
                .join('\n');
            } else {
              toolResultText = JSON.stringify(result);
            }

            console.error(`Tool result:`, toolResultText.substring(0, 200) + '...');

            // Add tool result to conversation history
            this.conversationHistory.push({
              role: 'tool',
              content: toolResultText,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Tool error:`, errorMessage);

            // Add error to conversation
            this.conversationHistory.push({
              role: 'tool',
              content: `Error executing tool: ${errorMessage}`,
            });
          }
        }

        // Continue the loop to let the model process tool results
        continue;
      }

      // No tool calls - this is the final response
      finalResponse = response.message.content || '';
      break;
    }

    if (iteration >= this.config.maxIterations!) {
      console.error('\nWarning: Max iterations reached');
      finalResponse = 'I apologize, but I reached the maximum number of steps. Please try a simpler request.';
    }

    return finalResponse;
  }

  getConversationHistory(): Message[] {
    return this.conversationHistory;
  }

  clearHistory(): void {
    const systemMessage = this.conversationHistory.find((m) => m.role === 'system');
    this.conversationHistory = systemMessage ? [systemMessage] : [];
  }
}
