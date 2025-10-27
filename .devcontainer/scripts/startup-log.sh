#!/bin/bash

LOG_FILE="/tmp/devcontainer-startup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== DevContainer Startup Begin ==="

# マウント状況確認
log "Checking mounts..."
if [ -d "/home/developer/.aws" ]; then
    log "✓ AWS directory mounted: $(ls -la /home/developer/.aws 2>/dev/null | wc -l) items"
else
    log "✗ AWS directory not mounted"
fi

# ワークスペースの確認（複数パターン対応）
workspace_found=false
for ws_path in "/workspace" "${PWD}"; do
    if [ -d "$ws_path" ] && [ "$ws_path" != "/" ]; then
        log "✓ Workspace found at $ws_path: $(ls -la "$ws_path" 2>/dev/null | wc -l) items"
        workspace_found=true
        break
    fi
done

if [ "$workspace_found" = false ]; then
    log "✗ No workspace directory found"
fi

# 環境変数確認
log "Environment variables:"
log "  AMAZON_Q_START_URL: ${AMAZON_Q_START_URL:-'not set'}"
log "  AMAZON_Q_DANGEROUS_MODE: ${AMAZON_Q_DANGEROUS_MODE:-'not set (default: true)'}"
log "  AWS_CA_BUNDLE: ${AWS_CA_BUNDLE:-'not set'}"
log "  WORKSPACE_PATH: ${WORKSPACE_PATH:-'not set'}"
log "  PWD: ${PWD}"

# セットアップ実行
log "Running setup scripts..."

log "1/7 Setting up proxy..."
/usr/local/bin/setup-proxy.sh 2>&1 | while read line; do log "  $line"; done

log "2/7 Setting up AWS CLI..."
/usr/local/bin/setup-aws-cli.sh 2>&1 | while read line; do log "  $line"; done

log "3/7 Setting up certificates..."
/usr/local/bin/setup-certificates.sh 2>&1 | while read line; do log "  $line"; done

log "4/7 Setting up workspace..."
if [ -f "./.devcontainer/scripts/setup-workspace.sh" ]; then
    ./.devcontainer/scripts/setup-workspace.sh 2>&1 | while read line; do log "  $line"; done
else
    log "  setup-workspace.sh not found, skipping"
fi

log "5/7 Building Amazon Q CLI..."
sudo /usr/local/bin/build-amazon-q.sh 2>&1 | while read line; do log "  $line"; done

log "6/7 Setting up SSO authentication..."
if [ -f "./.devcontainer/scripts/sso-auth.sh" ]; then
    ./.devcontainer/scripts/sso-auth.sh setup 2>&1 | while read line; do log "  $line"; done
else
    log "  sso-auth.sh not found, skipping authentication setup"
fi

log "7/7 Configuring Amazon Q dangerous mode..."
if [ -f "./.devcontainer/scripts/configure-q-dangerous.sh" ]; then
    ./.devcontainer/scripts/configure-q-dangerous.sh 2>&1 | while read line; do log "  $line"; done
else
    log "  configure-q-dangerous.sh not found, skipping dangerous mode setup"
fi

log "=== DevContainer Startup Complete ==="
log "Log saved to: $LOG_FILE"

# 最終状態確認
log "Final status check:"
if command -v q >/dev/null 2>&1; then
    log "✓ Amazon Q CLI available: $(q --version 2>/dev/null || echo 'version check failed')"
else
    log "✗ Amazon Q CLI not available"
fi

if command -v q >/dev/null 2>&1 && q auth status >/dev/null 2>&1; then
    log "✓ Amazon Q authentication active"
else
    log "✗ Amazon Q authentication required"
fi

if command -v q >/dev/null 2>&1; then
    dangerous_setting=$(q configure get dangerous 2>/dev/null || echo "false")
    log "✓ Amazon Q dangerous mode: $dangerous_setting"
fi

echo "Startup complete. View full log: cat $LOG_FILE"
