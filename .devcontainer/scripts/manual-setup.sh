#!/bin/bash

echo "=== Manual Amazon Q Setup ==="

# Amazon Q認証
if [ -n "$AMAZON_Q_START_URL" ]; then
    echo "Setting up Amazon Q authentication..."
    q auth login --start-url "$AMAZON_Q_START_URL"
else
    echo "AMAZON_Q_START_URL not set. Please run:"
    echo "q auth login --start-url https://your-company.awsapps.com/start"
fi

# デンジャラスモード設定
dangerous_mode="${AMAZON_Q_DANGEROUS_MODE:-true}"
echo "Setting dangerous mode to: $dangerous_mode"
q configure set dangerous "$dangerous_mode"

# 状態確認
echo ""
echo "=== Status Check ==="
echo "Amazon Q CLI version: $(q --version)"
echo "Authentication status:"
q auth status
echo "Dangerous mode: $(q configure get dangerous)"

echo ""
echo "Setup complete! You can now use 'q chat' to start chatting."
