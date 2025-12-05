# Ollama MCP Client

An interactive chat client that connects your local Ollama LLM with MCP (Model Context Protocol) servers, enabling your offline AI to use tools like SSH command execution and Kubernetes management.

## Features

- **Local LLM**: Uses Ollama for fully offline AI inference
- **Tool Calling**: Automatic tool/function calling with Qwen2.5, Mistral, Llama 3.1/3.2
- **MCP Integration**: Connects to any MCP server (SSH, Kubernetes, etc.)
- **Conversation Memory**: Maintains full conversation history within each session
- **Interactive CLI**: Simple readline-based chat interface

## Prerequisites

1. **Ollama installed and running**
   ```bash
   # Install Ollama (macOS)
   brew install ollama

   # Pull a model with good tool calling support
   ollama pull qwen2.5:latest
   # or
   ollama pull mistral:latest
   ```

2. **MCP servers built**
   ```bash
   # From the sre-mcp root directory
   npm install
   npm run build
   ```

## Installation

```bash
cd packages/ollama-client
npm install
npm run build
```

## Configuration

Create a configuration file named `.ollama-mcp.json` or `config.json` in your working directory.

**Configuration templates:**
- `config.example.json` - Basic configuration with SSH and Kubernetes
- `config.example-with-web-search.json` - Configuration with web search enabled

**Important**: Use absolute paths in the configuration file.

## Usage

### Basic Usage

```bash
npm start
# or
node build/index.js
```

### With Specific Model

```bash
npm start -- --model mistral:latest
```

### Interactive Commands

- Type your questions and requests naturally
- Use `clear` to reset conversation history
- Use `exit` to quit the client

## Conversation Memory

The client maintains full conversation history within each session:
- All messages (user, assistant, tool calls, tool results) are stored
- The LLM can reference previous interactions
- Use `clear` command to reset the conversation
- History is lost when you exit the client

## Supported Models

Models with good tool calling support:
- **qwen2.5:latest** - Excellent tool calling, recommended
- **mistral:latest** - Good tool calling support
- **llama3.1** or **llama3.2** - Native tool calling via Ollama

## Troubleshooting

### "No config file found"
Create a `.ollama-mcp.json` file in your current directory. See `config.example.json`.

### "Error connecting to MCP server"
- Ensure MCP servers are built: `npm run build` from sre-mcp root
- Check that paths in config are absolute paths
- Verify SSH/Kubernetes credentials are correct

### "Model not found"
Pull the model first:
```bash
ollama pull qwen2.5:latest
```

### "Tool calling not working"
- Some older models don't support tool calling
- Try qwen2.5 or mistral models
- Check Ollama version (needs 0.1.0+)

## Architecture Details

### Components

1. **MCPClientManager** (`mcp-client.ts`)
   - Manages connections to multiple MCP servers
   - Spawns server processes and communicates via stdio
   - Aggregates tools from all servers
   - Routes tool calls to the correct server

2. **OllamaAgent** (`ollama-agent.ts`)
   - Maintains conversation history
   - Converts MCP tools to Ollama's format
   - Implements the agent loop (chat → tool call → results → response)
   - Handles tool execution and error recovery

3. **Main CLI** (`index.ts`)
   - Configuration loading
   - Interactive readline interface
   - Lifecycle management

### Tool Calling Flow

1. User sends message
2. Agent adds message to history
3. Agent calls Ollama with conversation + available tools
4. If Ollama responds with tool calls:
   - Agent executes each tool via MCP
   - Agent adds results to conversation
   - Agent calls Ollama again (loop continues)
5. If Ollama responds with text (no tool calls):
   - Return response to user (loop ends)

## Development

```bash
# Watch mode during development
npm run dev

# Build
npm run build

# Run
npm start
```

## Limitations

- Conversation history is not persisted between sessions
- No streaming responses (waits for full completion)
- Limited to models supported by Ollama
- Tool calling quality depends on the model

## Future Enhancements

- Conversation persistence (save/load history)
- Streaming responses
- Multi-modal support (if Ollama adds it)
- Web UI
- Conversation branching
- Tool call approval/confirmation mode
