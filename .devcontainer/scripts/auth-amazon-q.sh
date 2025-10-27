#!/bin/bash

export PATH=~/bin:$PATH

echo "=== Amazon Q Authentication ==="

if ! command -v q >/dev/null 2>&1; then
    echo "Amazon Q CLI not found. Please run setup first."
    exit 1
fi

# 認証
if [ -n "$AMAZON_Q_START_URL" ]; then
    echo "Authenticating with: $AMAZON_Q_START_URL"
    q auth login --start-url "$AMAZON_Q_START_URL"
else
    echo "Please provide your SSO start URL:"
    read -p "Start URL: " start_url
    q auth login --start-url "$start_url"
fi

# デンジャラスモード設定
dangerous_mode="${AMAZON_Q_DANGEROUS_MODE:-true}"
echo "Setting dangerous mode: $dangerous_mode"
q configure set dangerous "$dangerous_mode"

# 状態確認
echo ""
echo "=== Status ==="
echo "Version: $(q --version)"
q auth status
echo "Dangerous mode: $(q configure get dangerous)"

echo "Ready to use 'q chat'!"
