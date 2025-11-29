# SRE MCP Servers

A collection of Model Context Protocol (MCP) servers for SRE tasks including SSH command execution and Kubernetes cluster management.

## Installation

```bash
npm install
npm run build
```

## Configuration

Add these to your Claude Code MCP settings (typically `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

### SSH Server

```json
{
  "mcpServers": {
    "ssh-server": {
      "command": "node",
      "args": [
        "/path/to/sre-mcp/packages/ssh/build/index.js",
        "--host", "192.168.1.100",
        "--username", "pi",
        "--key", "~/.ssh/id_rsa"
      ]
    }
  }
}
```

### Kubernetes Cluster

```json
{
  "mcpServers": {
    "kubernetes-cluster": {
      "command": "node",
      "args": [
        "/path/to/sre-mcp/packages/kubernetes/build/index.js",
        "--kubeconfig", "~/.kube/config"
      ]
    }
  }
}
```

## Documentation Maintenance

Each package maintains a `docs/sources.md` file that lists authoritative sources for documentation updates. These files are optimized for AI-assisted documentation maintenance.

### How It Works

The `sources.md` files provide:
- **Prioritized source lists** - PRIMARY sources that must always be checked
- **Context for each source** - What to look for (API changes, best practices, etc.)
- **Verification checklists** - Ensuring documentation stays accurate and complete

### Updating Documentation with AI

When you need to update documentation for a package, use prompts like these:

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

To add a new authoritative source:

1. Edit the appropriate `docs/sources.md` file
2. Add the URL under the relevant priority section (PRIMARY/SECONDARY/REFERENCE)
3. Include context about what to check (e.g., "Check for API changes, deprecations")
4. Update the verification checklist if needed

This approach ensures documentation stays accurate and up-to-date with minimal manual effort.

## Testing

You can test the servers manually:

```bash
# SSH Server
node packages/ssh/build/index.js --host YOUR_HOST --username USER --key ~/.ssh/id_rsa

# Kubernetes Server
node packages/kubernetes/build/index.js --kubeconfig ~/.kube/config
```

The servers run on stdio and wait for MCP protocol messages.
