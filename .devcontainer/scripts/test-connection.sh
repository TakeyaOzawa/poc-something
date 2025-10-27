#!/bin/bash

echo "=== 接続テストスクリプト ==="

# テスト対象URL
TEST_URLS=(
    "https://aws.amazon.com"
    "https://signin.aws.amazon.com"
    "https://registry.npmjs.org"
    "https://github.com"
)

# 接続テスト関数
test_url() {
    local url=$1
    local timeout=10
    
    echo -n "Testing $url ... "
    
    if curl -s --connect-timeout $timeout --max-time $timeout "$url" > /dev/null 2>&1; then
        echo "✅ OK"
        return 0
    else
        echo "❌ FAILED"
        return 1
    fi
}

# DNS解決テスト
test_dns() {
    echo "DNS解決テスト:"
    local hosts=("aws.amazon.com" "github.com" "registry.npmjs.org")
    
    for host in "${hosts[@]}"; do
        echo -n "  $host ... "
        if nslookup "$host" > /dev/null 2>&1; then
            echo "✅ OK"
        else
            echo "❌ FAILED"
        fi
    done
}

# プロキシ設定表示
show_proxy_settings() {
    echo "現在のプロキシ設定:"
    echo "  HTTP_PROXY: ${HTTP_PROXY:-未設定}"
    echo "  HTTPS_PROXY: ${HTTPS_PROXY:-未設定}"
    echo "  NO_PROXY: ${NO_PROXY:-未設定}"
}

# メイン処理
main() {
    show_proxy_settings
    echo ""
    
    test_dns
    echo ""
    
    echo "URL接続テスト:"
    local failed=0
    
    for url in "${TEST_URLS[@]}"; do
        if ! test_url "$url"; then
            ((failed++))
        fi
    done
    
    echo ""
    if [ $failed -eq 0 ]; then
        echo "✅ すべての接続テストが成功しました"
        return 0
    else
        echo "❌ $failed 個のテストが失敗しました"
        echo ""
        echo "トラブルシューティング:"
        echo "1. プロキシ設定を確認してください"
        echo "2. CA証明書が正しくインストールされているか確認してください"
        echo "3. DNS設定を確認してください"
        return 1
    fi
}

main "$@"

echo "=== 接続テスト完了 ==="
