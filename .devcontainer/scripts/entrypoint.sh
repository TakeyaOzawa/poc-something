#!/bin/bash

set -e

# Amazon Q自動設定
setup_amazon_q() {
    echo "Setting up Amazon Q..."
    
    # Amazon Q CLIの確認
    if command -v q >/dev/null 2>&1; then
        echo "✓ Amazon Q CLI ready: $(q --version)"
    else
        echo "✗ Amazon Q CLI not found"
    fi
    
    # SSO認証（環境変数が設定されている場合のみ）
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
}

setup_proxy() {
    echo "Setting up proxy..."
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
}

# メイン処理
main() {
    # 開発者ユーザーとして実行
    if [ "$(id -u)" = "0" ]; then
        # rootの場合、developerユーザーに切り替え
        exec su - developer -c "$0 $*"
    fi

    # プロキシ設定
    setup_proxy

    # Amazon Q設定
    exec /usr/local/scripts/check-auth.sh
    
    # 引数が渡された場合はそれを実行、なければbashを起動
    if [ $# -eq 0 ]; then
        exec bash
    else
        exec "$@"
    fi
}

main "$@"
