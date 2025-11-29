# Documentation Sources - Kubernetes MCP Server

When updating documentation, verify information against these authoritative sources in order of priority.

## PRIMARY SOURCES (Always check these)

### MCP Protocol - Check for API changes, new capabilities, best practices
- https://spec.modelcontextprotocol.io/
- https://modelcontextprotocol.io/docs/tools/
- https://modelcontextprotocol.io/docs/concepts/resources
- https://github.com/modelcontextprotocol/typescript-sdk

### @kubernetes/client-node - Check for API changes, new methods, deprecations
- https://github.com/kubernetes-client/javascript
- https://github.com/kubernetes-client/javascript/blob/master/README.md
- https://github.com/kubernetes-client/javascript/tree/master/examples

### Kubernetes API - Check for resource definitions and API changes
- https://kubernetes.io/docs/reference/kubernetes-api/
- https://kubernetes.io/docs/concepts/

## SECONDARY SOURCES (Check for kubectl commands and best practices)

### kubectl Reference - Verify command syntax and options
- https://kubernetes.io/docs/reference/kubectl/cheatsheet/
- https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands
- https://kubernetes.io/docs/reference/kubectl/

### Kubernetes Core Docs - Verify concepts and architecture
- https://kubernetes.io/docs/home/

## REFERENCE (Check as needed for TypeScript/Node.js specifics)

- https://www.typescriptlang.org/docs/
- https://nodejs.org/api/

## VERIFICATION CHECKLIST

When updating docs, confirm:
- [ ] MCP tool definitions match current spec
- [ ] @kubernetes/client-node usage follows latest API patterns
- [ ] Kubernetes API versions are current
- [ ] kubectl commands are accurate and include common options
- [ ] Examples handle kubeconfig correctly
- [ ] Security best practices for cluster access are current
