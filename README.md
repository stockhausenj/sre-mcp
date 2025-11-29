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

## Testing

You can test the servers manually:

```bash
# SSH Server
node packages/ssh/build/index.js --host YOUR_HOST --username USER --key ~/.ssh/id_rsa

# Kubernetes Server
node packages/kubernetes/build/index.js --kubeconfig ~/.kube/config
```

The servers run on stdio and wait for MCP protocol messages.
