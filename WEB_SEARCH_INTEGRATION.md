# Web Search Integration for Ollama Client

## Overview

The web search MCP server has been added to enable the ollama-client to search the web for current information, GitHub issues, Stack Overflow solutions, and documentation.

## What Was Built

### 1. New Web Search MCP Server
Location: `/packages/web-search/`

**Features:**
- Uses Brave Search API for privacy-focused web search
- Returns formatted markdown results with web pages and news
- Designed specifically for technical troubleshooting queries

**Tool:** `web_search(query: string)`

### 2. Resource Optimization
Both SSH and Kubernetes MCP servers now support `--disable-resources` flag.

**Why this matters:**
- Previously, servers exposed local documentation (network troubleshooting, kubectl guides) as MCP resources
- With web search available, we don't want the model to prefer stale local docs over current web results
- The `--disable-resources` flag conditionally disables these resources when web search is available

## How to Use

### 1. Get Brave Search API Key
Sign up at: https://brave.com/search/api/
- Free tier: 2,000 queries/month
- No rate limiting for personal use

### 2. Configure Ollama Client

See `packages/ollama-client/config.example-with-web-search.json` for a complete example.

**Key points:**
```json
{
  "systemPrompt": "You are a helpful SRE assistant with access to SSH, Kubernetes, and web search tools.\n\nUse web search to find current information, GitHub issues, Stack Overflow solutions...",
  "mcpServers": [
    {
      "name": "ssh-server",
      "args": [..., "--disable-resources"]  // Important!
    },
    {
      "name": "kubernetes-server",
      "args": [..., "--disable-resources"]  // Important!
    },
    {
      "name": "web-search",
      "args": [
        "/path/to/web-search/build/index.js",
        "--api-key", "YOUR_BRAVE_API_KEY"
      ]
    }
  ]
}
```

### 3. Update System Prompt

The system prompt should guide the model when to use web search:

```
Use web search to find:
- Current information and documentation
- GitHub issues and solutions
- Stack Overflow answers
- Error message explanations
- Best practices and recent updates
```

## Architecture

### Before (No Web Search)
```
User asks: "Why is my pod crashing?"
  ↓
Ollama checks local resources
  ↓
Finds: "Network Troubleshooting Guide" (resource)
  ↓
Uses local doc (possibly outdated)
```

### After (With Web Search)
```
User asks: "Why is my pod crashing?"
  ↓
Ollama has access to web_search tool
  ↓
Searches: "kubernetes CrashLoopBackOff github issues 2024"
  ↓
Finds current GitHub issues and solutions
  ↓
Provides up-to-date answer
```

### Resource Optimization
```
# Without web search
ssh-mcp-server [...]
  → Exposes: Network Troubleshooting Guide

# With web search
ssh-mcp-server [...] --disable-resources
  → Exposes: (nothing)
  → Model uses web_search instead
```

## Example Queries

The model will automatically use web search for queries like:

1. **Error troubleshooting:**
   - "Why is my cert-manager failing DNS01 challenges?"
   - "FluxCD kustomization stuck reconciling"

2. **GitHub issues:**
   - "Are there known issues with Kubernetes 1.28 on k3s?"
   - "Is this a bug in nginx ingress controller?"

3. **Best practices:**
   - "What's the recommended way to handle secrets in FluxCD?"
   - "How should I structure Kustomization dependencies?"

4. **Documentation:**
   - "How do I configure external-dns for Route53?"
   - "What are the cert-manager ClusterIssuer options?"

## Benefits

1. **Current Information**: Always get the latest solutions and documentation
2. **Better Troubleshooting**: Find recent GitHub issues and discussions
3. **No Stale Docs**: Local documentation won't override fresh web results
4. **Smarter Agent**: Model can research solutions it doesn't know

## Files Changed/Created

### New Files:
- `packages/web-search/` - Complete web search MCP server package
- `packages/web-search/README.md` - Documentation
- `packages/ollama-client/config.example-with-web-search.json` - Example config

### Modified Files:
- `packages/ssh/src/index.ts` - Added `--disable-resources` flag
- `packages/kubernetes/src/index.ts` - Added `--disable-resources` flag

## Testing

1. **Build everything:**
   ```bash
   npm run build
   ```

2. **Test web search server:**
   ```bash
   cd packages/web-search
   node build/index.js --api-key YOUR_KEY
   ```

3. **Run ollama-client with web search:**
   ```bash
   cd packages/ollama-client
   # Edit config.json to add web search server with --disable-resources
   npm start
   ```

4. **Try queries:**
   ```
   > Find recent GitHub issues about Kubernetes CrashLoopBackOff
   > What are common causes of cert-manager DNS challenges failing?
   > Search for FluxCD dependency reconciliation issues
   ```

## Cost Considerations

Brave Search API:
- **Free tier:** 2,000 queries/month
- **Paid tier:** $5/month for 20,000 queries
- Each ollama conversation may use 1-5 searches depending on the task

## Future Enhancements

1. **Search result caching** - Cache results to avoid duplicate API calls
2. **Multiple search engines** - Support DuckDuckGo, Google Custom Search
3. **Search result filtering** - Focus on specific domains (GitHub, Stack Overflow)
4. **Cost tracking** - Monitor API usage
5. **Fallback to local docs** - Use local docs if search fails

## Notes

- The `--disable-resources` flag is optional but recommended when using web search
- Without it, the model might prefer local documentation over web results
- System prompt is critical - it guides the model when to search
- Model quality matters - qwen2.5:14b has excellent tool calling for this use case
