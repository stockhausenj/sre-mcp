# Kubernetes Troubleshooting Cheat Sheet

A comprehensive reference for diagnosing and resolving Kubernetes cluster issues.

---

## 1. Cluster & Context Management

### View current context
```bash
kubectl config current-context
```

### List all available contexts
```bash
kubectl config get-contexts
```

### Switch between clusters
```bash
kubectl config use-context <context-name>
```

### View merged kubeconfig
```bash
kubectl config view
kubectl config view --minify              # Show only current context
```

### Set default namespace for context
```bash
kubectl config set-context --current --namespace=production
```

### Display cluster information
```bash
kubectl cluster-info
kubectl cluster-info dump                 # Full cluster state dump
```

---

## 2. Pod Inspection & Debugging

### List pods
```bash
kubectl get pods
kubectl get pods -n <namespace>
kubectl get pods --all-namespaces         # All pods across all namespaces
kubectl get pods -A                       # Shorthand for --all-namespaces
kubectl get pods -o wide                  # Show node, IP, and more details
```

### Describe pod (detailed information)
```bash
kubectl describe pod <pod-name>
kubectl describe pod <pod-name> -n <namespace>
```

### View pod logs
```bash
kubectl logs <pod-name>
kubectl logs <pod-name> -n <namespace>
kubectl logs <pod-name> -f                # Follow/tail logs
kubectl logs <pod-name> --tail=50         # Last 50 lines
kubectl logs <pod-name> --since=1h        # Logs from last hour
kubectl logs <pod-name> --previous        # Logs from previous container instance
```

### Multi-container pod logs
```bash
kubectl logs <pod-name> -c <container-name>
kubectl logs <pod-name> --all-containers=true
```

### Execute commands in pod
```bash
kubectl exec -it <pod-name> -- /bin/bash
kubectl exec -it <pod-name> -- /bin/sh    # If bash not available
kubectl exec <pod-name> -- ls /app        # Run single command
kubectl exec <pod-name> -c <container> -- command  # Specific container
```

### Copy files to/from pod
```bash
kubectl cp <pod-name>:/path/to/file ./local-file
kubectl cp ./local-file <pod-name>:/path/to/file
```

### Check pod resource usage
```bash
kubectl top pod <pod-name>
kubectl top pods -n <namespace>
kubectl top pods --all-namespaces
```

### Sort pods by restart count
```bash
kubectl get pods --sort-by='.status.containerStatuses[0].restartCount'
```

### Filter pods by status
```bash
kubectl get pods --field-selector=status.phase=Running
kubectl get pods --field-selector=status.phase=Pending
kubectl get pods --field-selector=status.phase=Failed
```

---

## 3. Node Inspection

### List nodes
```bash
kubectl get nodes
kubectl get nodes -o wide
```

### Describe node
```bash
kubectl describe node <node-name>
```

### Check node resource usage
```bash
kubectl top nodes
kubectl top node <node-name>
```

### View node conditions
```bash
kubectl get nodes -o json | jq '.items[].status.conditions'
```

### Cordon/uncordon nodes (prevent/allow scheduling)
```bash
kubectl cordon <node-name>                # Mark unschedulable
kubectl uncordon <node-name>              # Mark schedulable
kubectl drain <node-name>                 # Safely evict all pods
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
```

### View node taints
```bash
kubectl describe node <node-name> | grep Taints
```

---

## 4. Events & Debugging

### View events
```bash
kubectl get events
kubectl get events -n <namespace>
kubectl get events --all-namespaces
kubectl get events --sort-by='.metadata.creationTimestamp'
kubectl get events --sort-by='.lastTimestamp'
```

### Watch events in real-time
```bash
kubectl get events --watch
kubectl get events -n <namespace> --watch
```

### Filter events by type
```bash
kubectl get events --field-selector type=Warning
kubectl get events --field-selector type=Normal
```

### Events for specific resource
```bash
kubectl get events --field-selector involvedObject.name=<pod-name>
```

---

## 5. Deployments & Workloads

### List deployments
```bash
kubectl get deployments
kubectl get deployments -n <namespace>
kubectl get deployments -A
```

### Describe deployment
```bash
kubectl describe deployment <deployment-name>
```

### Check rollout status
```bash
kubectl rollout status deployment/<deployment-name>
kubectl rollout history deployment/<deployment-name>
```

### Restart deployment
```bash
kubectl rollout restart deployment/<deployment-name>
```

### Undo deployment
```bash
kubectl rollout undo deployment/<deployment-name>
kubectl rollout undo deployment/<deployment-name> --to-revision=2
```

### Scale deployment
```bash
kubectl scale deployment/<deployment-name> --replicas=3
```

### Update deployment image
```bash
kubectl set image deployment/<deployment-name> <container>=<image>:<tag>
```

### View ReplicaSets
```bash
kubectl get replicasets
kubectl get rs
kubectl describe rs <replicaset-name>
```

---

## 6. Services & Networking

### List services
```bash
kubectl get services
kubectl get svc
kubectl get svc -n <namespace>
kubectl get svc -A
```

### Describe service
```bash
kubectl describe service <service-name>
kubectl describe svc <service-name>
```

### Get service endpoints
```bash
kubectl get endpoints <service-name>
kubectl get ep <service-name>
```

### Port forwarding
```bash
kubectl port-forward pod/<pod-name> 8080:80
kubectl port-forward svc/<service-name> 8080:80
kubectl port-forward deployment/<deployment> 8080:80
```

### Test service connectivity from within cluster
```bash
kubectl run test-pod --image=busybox --rm -it -- /bin/sh
# Inside pod:
wget -O- http://<service-name>.<namespace>.svc.cluster.local
nslookup <service-name>
```

---

## 7. ConfigMaps & Secrets

### List ConfigMaps
```bash
kubectl get configmaps
kubectl get cm
kubectl describe cm <configmap-name>
```

### View ConfigMap data
```bash
kubectl get cm <configmap-name> -o yaml
kubectl get cm <configmap-name> -o json
```

### List Secrets
```bash
kubectl get secrets
kubectl describe secret <secret-name>
```

### Decode secret
```bash
kubectl get secret <secret-name> -o jsonpath='{.data.password}' | base64 -d
```

---

## 8. PersistentVolumes & Storage

### List PersistentVolumes
```bash
kubectl get pv
kubectl describe pv <pv-name>
```

### List PersistentVolumeClaims
```bash
kubectl get pvc
kubectl get pvc -n <namespace>
kubectl describe pvc <pvc-name>
```

### Check storage classes
```bash
kubectl get storageclass
kubectl get sc
kubectl describe sc <storageclass-name>
```

---

## 9. Resource Quotas & Limits

### View resource quotas
```bash
kubectl get resourcequota
kubectl get quota
kubectl describe quota <quota-name>
```

### View limit ranges
```bash
kubectl get limitrange
kubectl describe limitrange <limitrange-name>
```

### Check namespace resource usage
```bash
kubectl top pods -n <namespace>
kubectl describe namespace <namespace>
```

---

## 10. RBAC & Security

### Check user permissions
```bash
kubectl auth can-i <verb> <resource>
kubectl auth can-i create pods
kubectl auth can-i delete deployments -n production
kubectl auth can-i '*' '*' --all-namespaces        # Check cluster-admin
```

### List service accounts
```bash
kubectl get serviceaccounts
kubectl get sa
kubectl describe sa <service-account-name>
```

### List roles and rolebindings
```bash
kubectl get roles
kubectl get rolebindings
kubectl get clusterroles
kubectl get clusterrolebindings
```

### Describe RBAC permissions
```bash
kubectl describe role <role-name>
kubectl describe rolebinding <rolebinding-name>
kubectl describe clusterrole <clusterrole-name>
```

---

## 11. Jobs & CronJobs

### List jobs
```bash
kubectl get jobs
kubectl describe job <job-name>
```

### View job logs
```bash
kubectl logs job/<job-name>
```

### List CronJobs
```bash
kubectl get cronjobs
kubectl get cj
kubectl describe cj <cronjob-name>
```

### Manually trigger CronJob
```bash
kubectl create job --from=cronjob/<cronjob-name> <job-name>
```

---

## 12. Namespaces

### List namespaces
```bash
kubectl get namespaces
kubectl get ns
```

### Describe namespace
```bash
kubectl describe namespace <namespace>
```

### Create namespace
```bash
kubectl create namespace <namespace>
```

### Delete namespace (careful!)
```bash
kubectl delete namespace <namespace>
```

---

## 13. Labels & Annotations

### Show labels
```bash
kubectl get pods --show-labels
kubectl get pods -L app,version          # Show specific labels as columns
```

### Filter by label
```bash
kubectl get pods -l app=nginx
kubectl get pods -l 'environment in (production,staging)'
kubectl get pods -l 'app!=nginx'
```

### Add/update label
```bash
kubectl label pod <pod-name> environment=production
kubectl label pod <pod-name> version=v2 --overwrite
```

### Remove label
```bash
kubectl label pod <pod-name> environment-
```

---

## 14. Output Formatting

### JSON output
```bash
kubectl get pods -o json
kubectl get pod <pod-name> -o json
```

### YAML output
```bash
kubectl get pod <pod-name> -o yaml
```

### Custom columns
```bash
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,NODE:.spec.nodeName
```

### JSONPath queries
```bash
kubectl get pods -o jsonpath='{.items[*].metadata.name}'
kubectl get pods -o jsonpath='{.items[*].status.podIP}'
kubectl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="InternalIP")].address}'
```

### Wide output (more details)
```bash
kubectl get pods -o wide
kubectl get nodes -o wide
```

---

## 15. Manifest Management

### Apply manifests
```bash
kubectl apply -f deployment.yaml
kubectl apply -f ./manifests/
kubectl apply -f https://url/to/manifest.yaml
```

### Dry run
```bash
kubectl apply -f deployment.yaml --dry-run=client
kubectl apply -f deployment.yaml --dry-run=server
```

### Delete resources
```bash
kubectl delete -f deployment.yaml
kubectl delete pod <pod-name>
kubectl delete deployment <deployment-name>
kubectl delete all --all -n <namespace>     # Delete all resources in namespace
```

### Export running resource to YAML
```bash
kubectl get pod <pod-name> -o yaml --export > pod.yaml
kubectl get deployment <name> -o yaml > deployment.yaml
```

---

## 16. Common Troubleshooting Workflows

### Workflow 1: Pod Won't Start

```bash
# Step 1: Check pod status
kubectl get pods

# Step 2: Describe pod for events
kubectl describe pod <pod-name>

# Step 3: Check logs
kubectl logs <pod-name>
kubectl logs <pod-name> --previous        # If pod is restarting

# Step 4: Check node status (if pending)
kubectl get nodes
kubectl describe node <node-name>

# Step 5: Check events
kubectl get events --sort-by='.lastTimestamp' | grep <pod-name>
```

### Workflow 2: Service Not Accessible

```bash
# Step 1: Check service exists
kubectl get svc <service-name>

# Step 2: Check endpoints
kubectl get endpoints <service-name>

# Step 3: Verify pods are running and labeled correctly
kubectl get pods -l <label-selector>

# Step 4: Test from within cluster
kubectl run test --image=busybox --rm -it -- wget -O- <service-name>

# Step 5: Check network policies
kubectl get networkpolicies
```

### Workflow 3: High Resource Usage

```bash
# Step 1: Check node resource usage
kubectl top nodes

# Step 2: Check pod resource usage
kubectl top pods --all-namespaces --sort-by=cpu
kubectl top pods --all-namespaces --sort-by=memory

# Step 3: Describe resource-heavy pods
kubectl describe pod <pod-name>

# Step 4: Check resource quotas
kubectl describe namespace <namespace>

# Step 5: View historical metrics (if metrics-server available)
kubectl get --raw /apis/metrics.k8s.io/v1beta1/nodes
```

### Workflow 4: Deployment Update Issues

```bash
# Step 1: Check rollout status
kubectl rollout status deployment/<deployment-name>

# Step 2: View rollout history
kubectl rollout history deployment/<deployment-name>

# Step 3: Check replica sets
kubectl get rs

# Step 4: Describe new ReplicaSet
kubectl describe rs <replicaset-name>

# Step 5: Rollback if needed
kubectl rollout undo deployment/<deployment-name>
```

---

## 17. Common Issues & Solutions

### Issue: ImagePullBackOff
**Symptoms:** Pod stuck in ImagePullBackOff or ErrImagePull
**Check:**
```bash
kubectl describe pod <pod-name>          # Look for image pull errors
```
**Common Causes:**
- Incorrect image name or tag
- Private registry without imagePullSecrets
- Network issues reaching registry
- Registry authentication failure

### Issue: CrashLoopBackOff
**Symptoms:** Pod repeatedly crashing
**Check:**
```bash
kubectl logs <pod-name>
kubectl logs <pod-name> --previous       # Logs from crashed container
kubectl describe pod <pod-name>          # Check exit code
```
**Common Causes:**
- Application error/misconfiguration
- Missing dependencies or environment variables
- Health check failures
- Resource limits too restrictive

### Issue: Pending Pods
**Symptoms:** Pod stuck in Pending state
**Check:**
```bash
kubectl describe pod <pod-name>          # Look for scheduling events
kubectl get nodes                        # Check node availability
kubectl describe node <node-name>        # Check node capacity
```
**Common Causes:**
- Insufficient resources on nodes
- Node affinity/anti-affinity rules
- Taints on nodes without matching tolerations
- PersistentVolumeClaim not bound

### Issue: Service 503/Connection Refused
**Symptoms:** Service returns errors or can't connect
**Check:**
```bash
kubectl get endpoints <service-name>     # Should show pod IPs
kubectl get pods -l <selector>           # Verify pods are running
kubectl logs <pod-name>                  # Check application logs
```
**Common Causes:**
- No healthy pods matching service selector
- Pods not listening on correct port
- Network policy blocking traffic
- Readiness probe failing

### Issue: Node NotReady
**Symptoms:** Node shows NotReady status
**Check:**
```bash
kubectl describe node <node-name>        # Check conditions
kubectl get events --all-namespaces | grep <node-name>
```
**Common Causes:**
- kubelet not running
- Network connectivity issues
- Disk pressure
- Memory pressure
- System resource exhaustion

---

## 18. Quick Diagnostic One-Liners

```bash
# Find pods using most CPU
kubectl top pods -A --sort-by=cpu | head -10

# Find pods using most memory
kubectl top pods -A --sort-by=memory | head -10

# Find all failing pods
kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded

# Count pods per node
kubectl get pods -A -o wide --no-headers | awk '{print $8}' | sort | uniq -c

# List all container images in use
kubectl get pods -A -o jsonpath='{range .items[*]}{.spec.containers[*].image}{"\n"}{end}' | sort -u

# Find pods without resource limits
kubectl get pods -A -o json | jq -r '.items[] | select(.spec.containers[].resources.limits == null) | .metadata.name'

# Show all pod IPs
kubectl get pods -A -o custom-columns=NAME:.metadata.name,IP:.status.podIP,NODE:.spec.nodeName

# Check what's using PVCs
kubectl get pods -A -o json | jq -r '.items[] | select(.spec.volumes[]?.persistentVolumeClaim != null) | .metadata.name'
```

---

## 19. Advanced Debugging

### Ephemeral debug containers (K8s 1.23+)
```bash
kubectl debug <pod-name> -it --image=busybox
kubectl debug <pod-name> -it --image=nicolaka/netshoot --target=<container>
```

### Debug node with privileged pod
```bash
kubectl debug node/<node-name> -it --image=ubuntu
```

### Proxy to Kubernetes API
```bash
kubectl proxy --port=8080
# Access API at http://localhost:8080/api/v1
```

### Raw API access
```bash
kubectl get --raw /api/v1/nodes
kubectl get --raw /apis/metrics.k8s.io/v1beta1/nodes
```

---

## 20. Tips & Best Practices

- Use `kubectl explain <resource>` to understand resource specs (e.g., `kubectl explain pod.spec`)
- Use `--dry-run=client -o yaml` to generate manifest templates
- Always use labels and selectors for better organization and filtering
- Use `kubectl diff -f manifest.yaml` before applying changes
- Set up aliases: `alias k=kubectl`, `alias kgp='kubectl get pods'`
- Use `kubectl completion bash` or `kubectl completion zsh` for shell autocompletion
- Monitor events regularly: `kubectl get events -A --watch`
- Use `kubectl api-resources` to list all available resource types
- Use `kubectl explain --recursive <resource>` to see full schema
- Always specify namespace explicitly for production operations
