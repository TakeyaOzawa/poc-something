#!/bin/bash

set -e

echo "Setting up Amazon Q..."

# デンジャラスモード設定
if [ "${AMAZON_Q_DANGEROUS_MODE:-true}" = "true" ]; then
    echo "Enabling dangerous mode..."
    q configure set dangerous-mode true
else
    echo "Dangerous mode disabled"
fi

# SSO URL設定（認証は手動）
if [ -n "$AMAZON_Q_START_URL" ]; then
    echo "Amazon Q SSO URL configured: $AMAZON_Q_START_URL"
    echo "To authenticate, run: q auth login --start-url $AMAZON_Q_START_URL"
else
    echo "No SSO URL configured. Set AMAZON_Q_START_URL environment variable."
fi

echo "Amazon Q setup completed!"
echo "Run 'q auth login' to authenticate when ready."
