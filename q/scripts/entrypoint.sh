#!/bin/bash

echo "=== Entrypoint Debug Start ==="
echo "User: $(whoami)"
echo "UID: $(id -u)"
echo "Home: $HOME"
echo "PWD: $(pwd)"

# Amazon Q設定（エラーを無視）
setup_amazon_q() {
    echo "Setting up Amazon Q..."
    
    if command -v q >/dev/null 2>&1; then
        echo "✓ Amazon Q CLI found"
        q --version || echo "Warning: q --version failed"
    else
        echo "✗ Amazon Q CLI not found"
    fi
    
    if [ -n "$AMAZON_Q_START_URL" ]; then
        echo "Amazon Q Start URL: $AMAZON_Q_START_URL"
    else
        echo "No AMAZON_Q_START_URL set"
    fi
}

# メイン処理
main() {
    echo "=== Main Process Start ==="
    
    # Amazon Q設定（エラーがあっても続行）
    # setup_amazon_q || echo "Warning: setup_amazon_q failed"
    /usr/local/scripts/check-auth.sh || echo "Warning: check-auth.sh failed"
    
    echo "=== Entrypoint Debug End ==="
    
    # 引数が渡された場合はそれを実行、なければbashを起動
    if [ $# -eq 0 ]; then
        echo "Starting bash..."
        exec bash
    else
        echo "Executing: $*"
        exec "$@"
    fi
}

main "$@"
