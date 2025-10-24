#!/bin/bash

echo "=== CA証明書インストールスクリプト ==="

# CA証明書ディレクトリ
CA_CERT_DIR="/usr/local/share/ca-certificates"
CERT_FILE="$CA_CERT_DIR/company-ca.crt"

# 環境変数から証明書パスを取得
if [ -n "$CA_CERT_PATH" ] && [ -f "$CA_CERT_PATH" ]; then
    echo "CA証明書をインストール中: $CA_CERT_PATH"
    
    # 証明書をコピー
    sudo cp "$CA_CERT_PATH" "$CERT_FILE"
    
    # 権限設定
    sudo chmod 644 "$CERT_FILE"
    
    # 証明書ストア更新
    sudo update-ca-certificates
    
    echo "CA証明書のインストールが完了しました"
else
    echo "CA証明書が見つかりません"
    echo "環境変数 CA_CERT_PATH を設定してください"
    echo "例: export CA_CERT_PATH=/path/to/company-ca.crt"
fi

# Node.js用証明書設定
if [ -f "$CERT_FILE" ]; then
    echo "Node.js用CA証明書設定"
    export NODE_EXTRA_CA_CERTS="$CERT_FILE"
    echo "export NODE_EXTRA_CA_CERTS=\"$CERT_FILE\"" >> ~/.bashrc
fi

echo "=== CA証明書インストール完了 ==="
