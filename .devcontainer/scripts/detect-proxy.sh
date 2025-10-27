#!/bin/bash

echo "=== プロキシ自動検出スクリプト ==="

# プロキシ検出関数
detect_proxy() {
    # 環境変数から検出
    if [ -n "$HTTP_PROXY" ] || [ -n "$HTTPS_PROXY" ]; then
        echo "環境変数からプロキシを検出:"
        [ -n "$HTTP_PROXY" ] && echo "  HTTP_PROXY: $HTTP_PROXY"
        [ -n "$HTTPS_PROXY" ] && echo "  HTTPS_PROXY: $HTTPS_PROXY"
        return 0
    fi
    
    # 一般的なプロキシポートをテスト
    local proxy_hosts=("proxy.company.com" "proxy" "10.0.0.1")
    local proxy_ports=("8080" "3128" "8888")
    
    for host in "${proxy_hosts[@]}"; do
        for port in "${proxy_ports[@]}"; do
            if timeout 3 bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
                echo "プロキシを検出: $host:$port"
                export HTTP_PROXY="http://$host:$port"
                export HTTPS_PROXY="http://$host:$port"
                return 0
            fi
        done
    done
    
    return 1
}

# 接続テスト関数
test_connection() {
    echo "接続テスト実行中..."
    
    # AWS接続テスト
    if curl -s --connect-timeout 10 https://aws.amazon.com > /dev/null; then
        echo "✅ AWS接続: 成功"
        return 0
    else
        echo "❌ AWS接続: 失敗"
        return 1
    fi
}

# プロキシ設定適用
apply_proxy_settings() {
    if [ -n "$HTTP_PROXY" ]; then
        # Git設定
        git config --global http.proxy "$HTTP_PROXY"
        git config --global https.proxy "$HTTPS_PROXY"
        
        # npm設定
        npm config set proxy "$HTTP_PROXY"
        npm config set https-proxy "$HTTPS_PROXY"
        
        # 環境変数を永続化
        {
            echo "export HTTP_PROXY=\"$HTTP_PROXY\""
            echo "export HTTPS_PROXY=\"$HTTPS_PROXY\""
            echo "export NO_PROXY=\"localhost,127.0.0.1,.local\""
        } >> ~/.bashrc
        
        echo "プロキシ設定を適用しました"
    fi
}

# メイン処理
main() {
    if detect_proxy; then
        apply_proxy_settings
        if test_connection; then
            echo "✅ プロキシ設定が正常に動作しています"
        else
            echo "⚠️ プロキシ設定に問題がある可能性があります"
        fi
    else
        echo "プロキシが検出されませんでした"
        if test_connection; then
            echo "✅ 直接接続で動作しています"
        else
            echo "❌ インターネット接続に問題があります"
        fi
    fi
}

main "$@"

echo "=== プロキシ自動検出完了 ==="
