# Kubernetes MCP Server

MCP (Model Context Protocol) server that provides Kubernetes cluster management capabilities to AI assistants.

## Features

- List pods in namespaces
- List cluster nodes
- Execute arbitrary kubectl commands
- Includes kubectl troubleshooting guide as an MCP resource

## Installation

From the repository root:

```bash
npm install
npm run build
```

## Configuration

### Command Line Usage

```bash
node packages/kubernetes/build/index.js --kubeconfig ~/.kube/config
```

### Options

**Optional:**
- `--kubeconfig <path>` - Path to kubeconfig file (default: uses default kubeconfig)

The server uses the standard Kubernetes client library, which will automatically:
- Use `~/.kube/config` if no kubeconfig is specified
- Respect `KUBECONFIG` environment variable
- Use in-cluster config when running inside Kubernetes

### Examples

```bash
# Use default kubeconfig
node packages/kubernetes/build/index.js

# Use specific kubeconfig
node packages/kubernetes/build/index.js --kubeconfig /path/to/kubeconfig

# Set kubeconfig via environment variable
KUBECONFIG=/path/to/kubeconfig node packages/kubernetes/build/index.js
```

## Using with Claude Code

Add to your Claude Code MCP settings (typically `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "kubernetes-server": {
      "command": "node",
      "args": [
        "/absolute/path/to/sre-mcp/packages/kubernetes/build/index.js",
        "--kubeconfig", "~/.kube/config"
      ]
    }
  }
}
```

Or create a local `.mcp.json` file in your project directory:

```json
{
  "mcpServers": {
    "kubernetes-server": {
      "command": "node",
      "args": [
        "/absolute/path/to/sre-mcp/packages/kubernetes/build/index.js",
        "--kubeconfig", "~/.kube/config"
      ]
    }
  }
}
```

## Using with Ollama Client

See the [Ollama Client README](../ollama-client/README.md) for instructions on using this MCP server with a local Ollama LLM.

## Available Tools

### `get_pods`

Get list of pods in a namespace.

**Parameters:**
- `namespace` (optional) - Kubernetes namespace (default: "default")

**Returns:**
```json
[
  {
    "name": "nginx-deployment-abc123",
    "namespace": "default",
    "status": "Running",
    "nodeName": "node-1",
    "podIP": "10.244.0.5",
    "containers": [
      {
        "name": "nginx",
        "image": "nginx:latest"
      }
    ]
  }
]
```

### `get_nodes`

Get list of nodes in the cluster.

**Parameters:** None

**Returns:**
```json
[
  {
    "name": "node-1",
    "status": "True",
    "version": "v1.28.0",
    "osImage": "Ubuntu 22.04.3 LTS",
    "architecture": "amd64",
    "addresses": [
      {
        "type": "InternalIP",
        "address": "192.168.1.100"
      }
    ]
  }
]
```

### `kubectl`

Execute arbitrary kubectl command.

**Parameters:**
- `command` (required) - kubectl command to execute (without the `kubectl` prefix)

**Example:**
- Command: `"get pods -n kube-system"`
- Executes: `kubectl get pods -n kube-system`

**Returns:**
Raw kubectl output as text.

**Security Note:** This tool executes kubectl commands directly. Only use with trusted AI systems.

## Available Resources

### kubectl Troubleshooting Guide

URI: `file:///kubectl-troubleshooting`

A comprehensive guide to Kubernetes troubleshooting commands and workflows. The AI can reference this guide when helping with cluster issues.

## Architecture

```
┌─────────────────┐
│   AI Client     │
│ (Claude/Ollama) │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐
│ Kubernetes MCP  │
│     Server      │
│ (This Package)  │
└────────┬────────┘
         │ Kubernetes API / kubectl
         ▼
┌─────────────────┐
│ Kubernetes      │
│   Cluster       │
└─────────────────┘
```

## Security Considerations

- **RBAC**: The server uses the credentials from your kubeconfig - ensure appropriate RBAC permissions
- **kubectl Access**: The `kubectl` tool allows arbitrary command execution - only use with trusted AI
- **Sensitive Data**: Be aware that pod/node information may contain sensitive details
- **Audit Logging**: Consider enabling Kubernetes audit logging to track all API calls
- **Namespace Isolation**: Consider using a service account with limited namespace access

## Troubleshooting

### Cannot Connect to Cluster

```
Error: Failed to get pods: RequestError: getaddrinfo ENOTFOUND
```

**Solutions:**
- Verify kubeconfig path is correct
- Ensure cluster is reachable
- Check VPN connection if accessing remote cluster
- Verify cluster context: `kubectl config current-context`

### Permission Denied

```
Error: Failed to get pods: Forbidden
```

**Solutions:**
- Check your kubeconfig credentials
- Verify RBAC permissions: `kubectl auth can-i get pods`
- Ensure service account has necessary permissions

### kubectl Command Not Found

```
Error: kubectl command failed: command not found
```

**Solutions:**
- Install kubectl: https://kubernetes.io/docs/tasks/tools/
- Ensure kubectl is in PATH
- Verify installation: `kubectl version --client`

### Invalid Namespace

```
Error: Failed to get pods: Namespace not found
```

**Solutions:**
- List available namespaces: `kubectl get namespaces`
- Use correct namespace name
- Create namespace if needed: `kubectl create namespace <name>`

## Development

### File Structure

```
packages/kubernetes/
├── src/
│   ├── index.ts           # Main MCP server
│   └── kube-manager.ts    # Kubernetes API manager
├── docs/
│   ├── kubectl-troubleshooting.md  # kubectl troubleshooting guide
│   └── sources.md         # Documentation sources
├── build/                 # Compiled JavaScript (generated)
├── package.json
└── tsconfig.json
```

### Building

```bash
npm run build
```

### Testing Manually

The server communicates via stdio using the MCP protocol. To test:

1. Run the server:
```bash
node build/index.js --kubeconfig ~/.kube/config
```

2. The server will wait for MCP protocol messages on stdin

3. You can send MCP messages manually or use an MCP client

## Example Use Cases

### Debugging Pod Issues

```
User: Why is my nginx pod not starting?
AI: [calls get_pods tool]
AI: I can see the pod is in CrashLoopBackOff status. Let me check the logs.
AI: [calls kubectl tool with "logs nginx-pod"]
AI: The logs show a configuration error...
```

### Cluster Health Check

```
User: Is my cluster healthy?
AI: [calls get_nodes tool]
AI: All 3 nodes are in Ready status. Let me check the system pods.
AI: [calls get_pods tool with namespace "kube-system"]
AI: All system pods are running. Your cluster looks healthy!
```

### Resource Investigation

```
User: Which pods are using the most memory?
AI: [calls kubectl tool with "top pods --all-namespaces"]
AI: Here are the top memory consumers...
```

## Documentation Maintenance

This package maintains a `docs/sources.md` file that lists authoritative sources for documentation updates. See the main repository README for details on AI-assisted documentation maintenance.

## License

See the main repository for license information.
