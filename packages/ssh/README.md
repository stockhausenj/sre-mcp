# SSH MCP Server

MCP (Model Context Protocol) server that provides SSH command execution capabilities to AI assistants.

## Features

- Execute shell commands on remote servers via SSH
- Support for password and key-based authentication
- Configurable command timeout
- Includes network troubleshooting guide as an MCP resource

## Installation

From the repository root:

```bash
npm install
npm run build
```

## Configuration

### Command Line Usage

```bash
node packages/ssh/build/index.js \
  --host <hostname> \
  --username <user> \
  --key ~/.ssh/id_rsa
```

### Options

**Required:**
- `--host <host>` - Remote host IP or hostname
- `--username <user>` - SSH username

**Authentication (choose one):**
- `--password <pass>` - SSH password
- `--key <path>` - Path to SSH private key
- `--passphrase <pass>` - Passphrase for private key (optional)

**Optional:**
- `--port <port>` - SSH port (default: 22)
- `--help` - Show help message

### Examples

```bash
# Using password authentication
node packages/ssh/build/index.js \
  --host 192.168.1.100 \
  --username admin \
  --password mypassword

# Using SSH key authentication
node packages/ssh/build/index.js \
  --host 192.168.1.100 \
  --username ubuntu \
  --key ~/.ssh/id_rsa

# Using SSH key with passphrase
node packages/ssh/build/index.js \
  --host 192.168.1.100 \
  --username ubuntu \
  --key ~/.ssh/id_rsa \
  --passphrase mypassphrase

# Custom port
node packages/ssh/build/index.js \
  --host 192.168.1.100 \
  --port 2222 \
  --username admin \
  --key ~/.ssh/id_rsa
```

## Using with Claude Code

Add to your Claude Code MCP settings (typically `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "ssh-server": {
      "command": "node",
      "args": [
        "/absolute/path/to/sre-mcp/packages/ssh/build/index.js",
        "--host", "192.168.1.100",
        "--username", "pi",
        "--key", "~/.ssh/id_rsa"
      ]
    }
  }
}
```

Or create a local `.mcp.json` file in your project directory:

```json
{
  "mcpServers": {
    "ssh-server": {
      "command": "node",
      "args": [
        "/absolute/path/to/sre-mcp/packages/ssh/build/index.js",
        "--host", "192.168.1.100",
        "--username", "pi",
        "--key", "~/.ssh/id_rsa"
      ]
    }
  }
}
```

## Using with Ollama Client

See the [Ollama Client README](../ollama-client/README.md) for instructions on using this MCP server with a local Ollama LLM.

## Available Tools

### `exec`

Execute a shell command on the remote server.

**Parameters:**
- `command` (required) - The shell command to execute
- `timeout` (optional) - Timeout in milliseconds (default: 60000)

**Returns:**
```json
{
  "exitCode": 0,
  "stdout": "command output",
  "stderr": "error output if any"
}
```

**Example usage by AI:**
```
User: Check the disk usage on the server
AI: [calls exec tool with command: "df -h"]
```

## Available Resources

### Network Troubleshooting Guide

URI: `file:///network-troubleshooting`

A comprehensive guide to Linux network troubleshooting commands and workflows. The AI can reference this guide when helping with network issues.

## Architecture

```
┌─────────────────┐
│   AI Client     │
│ (Claude/Ollama) │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐
│  SSH MCP Server │
│   (This Package)│
└────────┬────────┘
         │ SSH Connection
         ▼
┌─────────────────┐
│  Remote Server  │
└─────────────────┘
```

## Security Considerations

- **Credential Storage**: Never commit passwords or private keys to version control
- **SSH Key Permissions**: Ensure SSH private keys have proper permissions (600)
- **Command Injection**: The server executes commands directly - only use with trusted AI systems
- **Network Security**: Consider using SSH key authentication over passwords
- **Audit Logging**: Consider logging all executed commands for security auditing

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED
```

**Solutions:**
- Verify the host and port are correct
- Ensure SSH service is running on the remote server
- Check firewall rules allow SSH connections

### Authentication Failed

```
Error: All configured authentication methods failed
```

**Solutions:**
- Verify username is correct
- For password auth: ensure password is correct
- For key auth: ensure key file path is correct and key has proper permissions (600)
- Verify the key is authorized on the remote server (`~/.ssh/authorized_keys`)

### Permission Denied

```
Error: Permission denied (publickey)
```

**Solutions:**
- Ensure your public key is in the remote server's `~/.ssh/authorized_keys`
- Check SSH key file permissions (should be 600 for private key)
- Verify you're using the correct username

### Command Timeout

```
Error: Command execution timed out after 60000ms
```

**Solutions:**
- Increase timeout value in the command parameters
- Check if the command is hanging or waiting for input
- Consider running long-running commands in the background

## Development

### File Structure

```
packages/ssh/
├── src/
│   ├── index.ts           # Main MCP server
│   └── ssh-manager.ts     # SSH connection manager
├── docs/
│   ├── network-troubleshooting.md  # Network troubleshooting guide
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
node build/index.js --host <host> --username <user> --key ~/.ssh/id_rsa
```

2. The server will wait for MCP protocol messages on stdin

3. You can send MCP messages manually or use an MCP client

## Documentation Maintenance

This package maintains a `docs/sources.md` file that lists authoritative sources for documentation updates. See the main repository README for details on AI-assisted documentation maintenance.

## License

See the main repository for license information.
