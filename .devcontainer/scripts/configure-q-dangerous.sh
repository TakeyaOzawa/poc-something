#!/bin/bash

configure_dangerous_mode() {
    local dangerous_mode="${AMAZON_Q_DANGEROUS_MODE:-true}"
    
    echo "Configuring Amazon Q dangerous mode: $dangerous_mode"
    
    if [[ "$dangerous_mode" == "true" ]]; then
        echo "Enabling dangerous mode..."
        q configure set dangerous true
        echo "✓ Dangerous mode enabled"
    else
        echo "Disabling dangerous mode..."
        q configure set dangerous false
        echo "✓ Dangerous mode disabled"
    fi
    
    # 設定確認
    echo "Current dangerous mode setting:"
    q configure get dangerous 2>/dev/null || echo "Setting not found (default: false)"
}

# Amazon Q CLIが利用可能かチェック
if ! command -v q >/dev/null 2>&1; then
    echo "Error: Amazon Q CLI not found"
    exit 1
fi

configure_dangerous_mode
