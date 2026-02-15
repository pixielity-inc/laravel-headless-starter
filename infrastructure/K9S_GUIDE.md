# 🎮 K9s - Kubernetes Management Guide

## What is K9s?

K9s is a terminal-based UI to interact with your Kubernetes clusters. It makes managing Kubernetes much easier than using kubectl commands.

## 🚀 Quick Start

```bash
# Launch K9s
k9s

# Launch K9s in a specific namespace
k9s -n laravel-dev

# Launch K9s with readonly mode
k9s --readonly
```

## ⌨️ Essential Keyboard Shortcuts

### Navigation
- `:` - Command mode (type resource name)
- `/` - Filter/search current view
- `Esc` - Back/cancel
- `?` - Help (shows all shortcuts)
- `Ctrl+a` - Show all available resources
- `0` - Show all namespaces
- `1-9` - Switch to namespace by number

### Common Views
- `:pods` or `:po` - View pods
- `:deployments` or `:deploy` - View deployments
- `:services` or `:svc` - View services
- `:secrets` - View secrets
- `:configmaps` or `:cm` - View config maps
- `:namespaces` or `:ns` - View namespaces
- `:nodes` - View cluster nodes
- `:events` - View cluster events
- `:ingress` or `:ing` - View ingresses

### Pod Operations
- `Enter` - View pod details
- `l` - View pod logs
- `Shift+l` - View previous pod logs
- `d` - Describe resource
- `e` - Edit resource
- `y` - View YAML
- `Ctrl+k` - Delete resource
- `s` - Shell into container
- `Shift+f` - Port forward
- `Ctrl+z` - Toggle auto-refresh

### Log Viewing
- `0-9` - Select container (if multiple)
- `/` - Filter logs
- `w` - Toggle wrap
- `f` - Toggle fullscreen
- `t` - Toggle timestamps
- `s` - Toggle auto-scroll
- `c` - Clear logs

### Resource Management
- `Ctrl+d` - Delete resource
- `e` - Edit resource
- `y` - View YAML
- `d` - Describe resource
- `Shift+r` - Restart/rollout restart

## 📋 Common Workflows

### 1. Check Laravel Application Status

```bash
# Launch K9s in laravel-dev namespace
k9s -n laravel-dev

# Or switch namespace after launch
:ns
# Select laravel-dev

# View pods
:po

# Check specific pod logs
# Navigate to pod, press 'l'

# Shell into pod
# Navigate to pod, press 's'
```

### 2. Debug Failed Pods

```bash
k9s -n laravel-dev

# View pods
:po

# Find failed pod (red status)
# Press 'd' to describe
# Press 'l' to view logs
# Press 'y' to view YAML
```

### 3. Monitor Resource Usage

```bash
k9s

# View nodes
:nodes

# View pod resource usage
:po
# Press 'Shift+t' to toggle resource metrics
```

### 4. Restart Deployments

```bash
k9s -n laravel-dev

# View deployments
:deploy

# Navigate to deployment
# Press 'Shift+r' to restart
```

### 5. Port Forward to Service

```bash
k9s -n laravel-dev

# View services
:svc

# Navigate to service
# Press 'Shift+f'
# Enter local port (e.g., 8080)
```

### 6. View and Edit Secrets

```bash
k9s -n laravel-dev

# View secrets
:secrets

# Navigate to secret
# Press 'y' to view YAML (values are base64 encoded)
# Press 'e' to edit
```

## 🎨 K9s Configuration

K9s config is stored at `~/.config/k9s/config.yaml`

### Custom Aliases

Create `~/.config/k9s/aliases.yaml`:

```yaml
aliases:
  # Laravel shortcuts
  laravel-pods: pods -n laravel-dev
  laravel-logs: pods -n laravel-dev --context logs
  
  # Quick views
  all-pods: pods --all-namespaces
  failed: pods --field-selector status.phase=Failed
  running: pods --field-selector status.phase=Running
```

### Custom Hotkeys

Create `~/.config/k9s/hotkeys.yaml`:

```yaml
hotKeys:
  # Shift+1: Jump to laravel-dev namespace
  shift-1:
    shortCut: Shift-1
    description: Laravel Dev Namespace
    command: namespace laravel-dev
  
  # Shift+2: Jump to argocd namespace
  shift-2:
    shortCut: Shift-2
    description: ArgoCD Namespace
    command: namespace argocd
  
  # Shift+p: View all pods
  shift-p:
    shortCut: Shift-P
    description: All Pods
    command: pods
```

## 🔍 Useful K9s Features

### 1. XRay View
Shows resource relationships and dependencies
```
:xray deployments
```

### 2. Pulse View
Real-time cluster metrics
```
:pulse
```

### 3. Popeye Integration
Cluster sanitizer (if installed)
```
:popeye
```

### 4. Context Switching
```
:ctx
# Select different Kubernetes context
```

## 📊 K9s for Laravel Infrastructure

### Quick Health Check

1. Launch K9s: `k9s -n laravel-dev`
2. Check pods: `:po` - All should be green (Running)
3. Check events: `:events` - Look for errors
4. Check logs: Navigate to pod, press `l`

### Monitor Specific Services

```bash
# PostgreSQL
k9s -n laravel-dev
:po
# Filter: /postgres
# Press 'l' for logs

# Redis
:po
# Filter: /redis
# Press 'l' for logs

# Laravel Web
:po
# Filter: /laravel-web
# Press 'l' for logs
```

### Debug Container Issues

```bash
k9s -n laravel-dev

# Find problematic pod
:po
# Filter: /laravel

# Check pod details
# Navigate to pod, press 'd'

# View logs
# Press 'l'

# Shell into container (if running)
# Press 's'

# View YAML
# Press 'y'
```

## 🎯 K9s vs kubectl

| Task | kubectl | K9s |
|------|---------|-----|
| View pods | `kubectl get pods -n laravel-dev` | `:po` |
| View logs | `kubectl logs pod-name -n laravel-dev` | Navigate + `l` |
| Describe | `kubectl describe pod pod-name` | Navigate + `d` |
| Delete | `kubectl delete pod pod-name` | Navigate + `Ctrl+k` |
| Edit | `kubectl edit pod pod-name` | Navigate + `e` |
| Shell | `kubectl exec -it pod-name -- sh` | Navigate + `s` |
| Port forward | `kubectl port-forward svc/name 8080:80` | Navigate + `Shift+f` |

## 🚨 Pro Tips

1. **Use filters**: Press `/` and type to filter resources
2. **Watch logs in real-time**: Logs auto-scroll by default
3. **Multiple containers**: Press `0-9` to switch between containers in a pod
4. **Copy to clipboard**: Press `y` to view YAML, then copy from terminal
5. **Quick namespace switch**: Press `0` to see all namespaces, then select
6. **Resource metrics**: Press `Shift+t` in pods view to see CPU/Memory
7. **Fullscreen logs**: Press `f` when viewing logs
8. **Search in logs**: Press `/` when viewing logs

## 🔧 Troubleshooting

### K9s won't start
```bash
# Check kubeconfig
kubectl cluster-info

# Check K9s config
cat ~/.config/k9s/config.yaml

# Reset K9s config
rm -rf ~/.config/k9s
k9s
```

### Can't see resources
```bash
# Check RBAC permissions
kubectl auth can-i list pods -n laravel-dev

# Try readonly mode
k9s --readonly
```

### Slow performance
```bash
# Disable auto-refresh
# Press 'Ctrl+z' in K9s

# Or set refresh rate in config
# ~/.config/k9s/config.yaml
k9s:
  refreshRate: 5 # seconds
```

## 📚 Resources

- [K9s Documentation](https://k9scli.io/)
- [K9s GitHub](https://github.com/derailed/k9s)
- [K9s Keyboard Shortcuts](https://k9scli.io/topics/commands/)

## 🎬 Quick Demo

```bash
# 1. Launch K9s
k9s -n laravel-dev

# 2. View pods (should already be in pods view)
# Look for green "Running" status

# 3. Check Laravel web logs
# Navigate to laravel-web pod
# Press 'l'

# 4. Check all services
:svc

# 5. View secrets
:secrets

# 6. Check events for errors
:events

# 7. Exit
:quit
# or press 'Ctrl+c'
```

---

**Remember**: K9s is just a UI for kubectl. Everything you do in K9s can be done with kubectl, but K9s makes it much faster and more intuitive! 🚀
