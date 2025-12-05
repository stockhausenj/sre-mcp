# SRE MCP Servers

A collection of Model Context Protocol (MCP) servers for SRE tasks including SSH command execution and Kubernetes cluster management.

## Packages

- **[ssh](packages/ssh/README.md)** - MCP server for remote SSH command execution
- **[kubernetes](packages/kubernetes/README.md)** - MCP server for Kubernetes cluster management
- **[web-search](packages/web-search/README.md)** - MCP server for web search using Brave Search API
- **[ollama-client](packages/ollama-client/README.md)** - Interactive chat client that connects local Ollama LLMs with MCP servers

## Installation

```bash
npm install
npm run build
```

## Quick Start

### For Claude Code Users

See individual package READMEs for configuration:
- [SSH Server Configuration](packages/ssh/README.md#using-with-claude-code)
- [Kubernetes Server Configuration](packages/kubernetes/README.md#using-with-claude-code)

### For Local LLM (Ollama) Users

See the [Ollama Client README](packages/ollama-client/README.md)

## Local Documentation (Offline Knowledge)

Some MCP servers (SSH and Kubernetes) maintain local documentation resources for offline troubleshooting when web search is not available. These packages include a `docs/sources.md` file that lists authoritative sources for documentation updates.

### Packages with Local Documentation

- **SSH Server**: Includes network troubleshooting guide (`packages/ssh/docs/`)
- **Kubernetes Server**: Includes kubectl troubleshooting guide (`packages/kubernetes/docs/`)

**Note:** The web-search server does not maintain local documentation - it fetches current information from the web. The ollama-client is not an MCP server but a client that connects to MCP servers.

### How It Works

The `sources.md` files provide:
- **Prioritized source lists** - PRIMARY sources that must always be checked
- **Context for each source** - What to look for (API changes, best practices, etc.)
- **Verification checklists** - Ensuring documentation stays accurate and complete

### When to Use Local Documentation vs Web Search

**Use local documentation (without web search):**
- Offline environments
- When you want curated, stable troubleshooting guides
- For scenarios where API costs are a concern

**Use web search (disable local documentation):**
- When you need current information and latest solutions
- To find recent GitHub issues and Stack Overflow answers
- For discovering breaking changes and updates
- Add `--disable-resources` flag to SSH/Kubernetes servers (see [WEB_SEARCH_INTEGRATION.md](WEB_SEARCH_INTEGRATION.md))

### Updating Documentation with AI

When you need to update local documentation for SSH or Kubernetes servers, use prompts like these:

**For comprehensive updates:**
```
Update the Kubernetes MCP server documentation by:
1. Reading packages/kubernetes/docs/sources.md
2. Checking all PRIMARY sources for changes
3. Performing additional web searches for recent updates
4. Verifying against the checklist
5. Updating the README and any relevant docs
```

**For targeted updates:**
```
Check if the SSH MCP server documentation is current:
- Read packages/ssh/docs/sources.md
- Verify the ssh2 library API usage is current
- Check for new MCP protocol features
- Update tool descriptions if needed
```

**For new features:**
```
I want to add a new tool to the Kubernetes MCP server.
Before implementing, check packages/kubernetes/docs/sources.md
and verify the best practices for MCP tool definitions and
Kubernetes client-node API usage.
```

### Source Files

- **SSH Server**: `packages/ssh/docs/sources.md`
- **Kubernetes Server**: `packages/kubernetes/docs/sources.md`

### Adding New Sources

To add a new authoritative source to local documentation:

1. Edit the appropriate `docs/sources.md` file
2. Add the URL under the relevant priority section (PRIMARY/SECONDARY/REFERENCE)
3. Include context about what to check (e.g., "Check for API changes, deprecations")
4. Update the verification checklist if needed

This approach ensures documentation stays accurate and up-to-date with minimal manual effort.
