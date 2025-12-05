# Web Search MCP Server

An MCP server that provides web search capabilities using the Brave Search API.

## Features

- **Web Search**: Search the web for current information, documentation, GitHub issues, Stack Overflow answers, and error solutions
- **News Results**: Includes recent news articles relevant to the search query
- **Formatted Results**: Returns clean, markdown-formatted search results

## Setup

### 1. Get a Brave Search API Key

Sign up for a free API key at https://brave.com/search/api/

### 2. Install Dependencies

```bash
cd packages/web-search
npm install
npm run build
```

## Usage

### As MCP Server

```bash
# Using API key flag
node build/index.js --api-key YOUR_BRAVE_API_KEY

# Using environment variable
export BRAVE_API_KEY=YOUR_BRAVE_API_KEY
node build/index.js
```

### With Ollama Client

Add to your ollama-client `config.json`:

```json
{
  "mcpServers": [
    {
      "name": "web-search",
      "command": "node",
      "args": [
        "/absolute/path/to/sre-mcp/packages/web-search/build/index.js",
        "--api-key", "YOUR_BRAVE_API_KEY"
      ]
    }
  ]
}
```

**Important**: When using web search, add `--disable-resources` flag to SSH and Kubernetes servers to prevent the model from preferring local documentation over current web search results:

```json
{
  "mcpServers": [
    {
      "name": "ssh-server",
      "command": "node",
      "args": [
        "/path/to/ssh/build/index.js",
        "--host", "192.168.1.100",
        "--username", "pi",
        "--key", "~/.ssh/id_rsa",
        "--disable-resources"
      ]
    },
    {
      "name": "kubernetes-server",
      "command": "node",
      "args": [
        "/path/to/kubernetes/build/index.js",
        "--disable-resources"
      ]
    },
    {
      "name": "web-search",
      "command": "node",
      "args": [
        "/path/to/web-search/build/index.js",
        "--api-key", "YOUR_API_KEY"
      ]
    }
  ]
}
```

## Tool Reference

### `web_search`

Search the web for information.

**Parameters:**
- `query` (string, required): The search query. Be specific and include relevant keywords.

**Example queries:**
- "kubernetes CrashLoopBackOff github issues"
- "cert-manager DNS01 challenge failing"
- "FluxCD kustomization not reconciling"
- "nginx ingress 502 bad gateway error"

**Returns:**
Markdown-formatted search results including:
- Web page titles, URLs, and descriptions
- Recent news articles (if relevant)

## How It Works

1. The LLM determines it needs current information
2. It calls the `web_search` tool with a specific query
3. The server queries Brave Search API
4. Results are formatted as markdown
5. The LLM interprets the results and responds to the user

## Brave Search API

This server uses the Brave Search API which provides:
- Fast, privacy-focused search results
- No rate limiting on free tier for personal use
- Independent index (not relying on Google/Bing)
- Free tier: 2,000 queries/month

## Environment Variables

- `BRAVE_API_KEY`: Your Brave Search API key (alternative to `--api-key` flag)

## Tips for Better Results

1. **Be specific**: Include relevant technical terms and context
2. **Use error messages**: Search exact error text in quotes
3. **Add context**: Include technology names (e.g., "kubernetes", "docker", "nginx")
4. **Combine with tools**: Use SSH/Kubernetes tools to gather info, then search for solutions

## Troubleshooting

### "Brave Search API error: 401"
- Invalid API key. Check that your key is correct.

### "Brave Search API error: 429"
- Rate limit exceeded. Free tier allows 2,000 queries/month.

### No results returned
- Try making your query more specific or using different keywords.
