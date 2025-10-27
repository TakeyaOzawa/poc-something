#!/bin/bash

# ネットワーク接続フォールバック機能

test_connection() {
    local url="$1"
    local timeout="${2:-5}"
    curl -s --max-time "$timeout" --head "$url" > /dev/null 2>&1
}

setup_proxy() {
    if [ -n "$HTTP_PROXY" ]; then
        export http_proxy="$HTTP_PROXY"
        export https_proxy="$HTTPS_PROXY"
        echo "Proxy configured: $HTTP_PROXY"
        return 0
    fi
    return 1
}

clear_proxy() {
    unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
    echo "Proxy cleared - using direct connection"
}

# テスト用URL
TEST_URLS=(
    "https://github.com"
    "https://api.github.com"
    "https://awscli.amazonaws.com"
)

echo "Testing network connectivity..."

# プロキシ設定がある場合はまずプロキシで試行
if setup_proxy; then
    echo "Testing with proxy..."
    for url in "${TEST_URLS[@]}"; do
        if test_connection "$url"; then
            echo "✅ Proxy connection successful"
            exit 0
        fi
    done
    echo "❌ Proxy connection failed"
fi

# プロキシ失敗時は直接接続にフォールバック
echo "Falling back to direct connection..."
clear_proxy

for url in "${TEST_URLS[@]}"; do
    if test_connection "$url"; then
        echo "✅ Direct connection successful"
        exit 0
    fi
done

echo "❌ All connection methods failed"
exit 1
