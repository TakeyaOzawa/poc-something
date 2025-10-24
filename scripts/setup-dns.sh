#!/bin/bash

echo "=== DNS設定調整スクリプト ==="

# DNS設定ファイル
RESOLV_CONF="/etc/resolv.conf"
BACKUP_FILE="/etc/resolv.conf.backup"

# 現在の設定をバックアップ
if [ ! -f "$BACKUP_FILE" ]; then
    echo "DNS設定をバックアップ中..."
    sudo cp "$RESOLV_CONF" "$BACKUP_FILE"
fi

# 会社DNS設定（環境変数から取得）
if [ -n "$COMPANY_DNS1" ] || [ -n "$COMPANY_DNS2" ]; then
    echo "会社DNS設定を適用中..."
    
    # 新しいresolv.confを作成
    {
        echo "# Company DNS Configuration"
        [ -n "$COMPANY_DNS1" ] && echo "nameserver $COMPANY_DNS1"
        [ -n "$COMPANY_DNS2" ] && echo "nameserver $COMPANY_DNS2"
        echo "# Fallback DNS"
        echo "nameserver 8.8.8.8"
        echo "nameserver 8.8.4.4"
    } | sudo tee "$RESOLV_CONF" > /dev/null
    
    echo "DNS設定が完了しました"
    echo "設定内容:"
    cat "$RESOLV_CONF"
else
    echo "会社DNS設定が見つかりません"
    echo "環境変数 COMPANY_DNS1, COMPANY_DNS2 を設定してください"
    echo "例:"
    echo "  export COMPANY_DNS1=10.0.0.1"
    echo "  export COMPANY_DNS2=10.0.0.2"
fi

# DNS解決テスト
echo ""
echo "DNS解決テスト:"
nslookup aws.amazon.com || echo "DNS解決に失敗しました"

echo "=== DNS設定調整完了 ==="
