#!/bin/bash

echo "=== Amazon Q DevContainer Runtime Setup ==="

# 1. プロキシ設定
echo "1/4 Setting up proxy..."
if [ -n "$HTTP_PROXY" ]; then
    export HTTP_PROXY="$HTTP_PROXY"
    export http_proxy="$HTTP_PROXY"
    echo "HTTP proxy: $HTTP_PROXY"
fi
if [ -n "$HTTPS_PROXY" ]; then
    export HTTPS_PROXY="$HTTPS_PROXY"
    export https_proxy="$HTTPS_PROXY"
    echo "HTTPS proxy: $HTTPS_PROXY"
fi

# 2. AWS CLI設定
echo "2/4 Setting up AWS CLI..."
HOST_ARCH=$(uname -m)
if [ "$HOST_ARCH" = "arm64" ] || [ "$HOST_ARCH" = "aarch64" ]; then
    sudo ln -sf /opt/aws-cli/aarch64/bin/aws /usr/local/bin/aws
    echo "Using ARM64 AWS CLI"
else
    sudo ln -sf /opt/aws-cli/x86_64/bin/aws /usr/local/bin/aws
    echo "Using x86_64 AWS CLI"
fi

# 3. Amazon Q CLI確認
echo "3/4 Checking Amazon Q CLI..."
if command -v q >/dev/null 2>&1; then
    echo "✓ Amazon Q CLI ready: $(q --version)"
else
    echo "✗ Amazon Q CLI not found"
fi

# 4. 認証準備
echo "4/4 Preparing authentication..."
if [ -n "$AMAZON_Q_START_URL" ]; then
    echo "Amazon Q Start URL configured: $AMAZON_Q_START_URL"
    echo ""
    echo "🚀 To complete setup, run:"
    echo "   /usr/local/scripts/auth-amazon-q.sh"
    echo ""
else
    echo "⚠️  AMAZON_Q_START_URL not set"
    echo ""
    echo "🚀 To complete setup, run:"
    echo "   q auth login --start-url https://your-company.awsapps.com/start"
    echo ""
fi

echo "Runtime setup complete!"
