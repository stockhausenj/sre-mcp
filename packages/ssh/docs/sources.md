# Documentation Sources - SSH MCP Server

When updating documentation, verify information against these authoritative sources in order of priority.

## PRIMARY SOURCES (Always check these)

### MCP Protocol - Check for API changes, new capabilities, best practices
- https://spec.modelcontextprotocol.io/
- https://modelcontextprotocol.io/docs/tools/
- https://modelcontextprotocol.io/docs/concepts/resources
- https://github.com/modelcontextprotocol/typescript-sdk

### ssh2 Library - Check for API changes, new features, security updates
- https://github.com/mscdex/ssh2#api
- https://github.com/mscdex/ssh2#client-methods
- https://github.com/mscdex/ssh2#client-events

## SECONDARY SOURCES (Check for best practices and examples)

### Network Troubleshooting - Verify command syntax and options
- https://hackertarget.com/tcpdump-examples/
- https://www.man7.org/linux/man-pages/man8/ip.8.html

### Linux Networking - Verify kernel features and capabilities
- https://www.kernel.org/doc/html/latest/networking/index.html

## REFERENCE (Check as needed for TypeScript/Node.js specifics)

- https://www.typescriptlang.org/docs/
- https://nodejs.org/api/fs.html
- https://nodejs.org/api/path.html

## VERIFICATION CHECKLIST

When updating docs, confirm:
- [ ] MCP tool definitions match current spec
- [ ] ssh2 usage follows latest API patterns
- [ ] Network commands are accurate and include common options
- [ ] Examples are tested and functional
- [ ] Security best practices are current
