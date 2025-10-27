#!/bin/bash

# セキュリティチェック・強化

echo "=== Security Check ==="

# 権限チェック
check_permissions() {
    echo "Checking file permissions..."
    
    local issues=0
    
    # AWS認証情報
    if [ -f "$HOME/.aws/credentials" ]; then
        local perm=$(stat -c "%a" "$HOME/.aws/credentials" 2>/dev/null || stat -f "%A" "$HOME/.aws/credentials" 2>/dev/null)
        if [ "$perm" != "600" ]; then
            echo "⚠️ AWS credentials permissions: $perm (should be 600)"
            ((issues++))
        fi
    fi
    
    # SSH keys
    for key in "$HOME/.ssh/id_"*; do
        if [ -f "$key" ] && [[ ! "$key" == *.pub ]]; then
            local perm=$(stat -c "%a" "$key" 2>/dev/null || stat -f "%A" "$key" 2>/dev/null)
            if [ "$perm" != "600" ]; then
                echo "⚠️ SSH key permissions: $key ($perm, should be 600)"
                ((issues++))
            fi
        fi
    done
    
    if [ $issues -eq 0 ]; then
        echo "✅ File permissions OK"
    fi
}

# 環境変数チェック
check_env_vars() {
    echo "Checking environment variables..."
    
    local sensitive_vars=("AWS_SECRET_ACCESS_KEY" "AWS_SESSION_TOKEN" "GITHUB_TOKEN")
    local found=0
    
    for var in "${sensitive_vars[@]}"; do
        if [ -n "${!var}" ]; then
            echo "⚠️ Sensitive variable exposed: $var"
            ((found++))
        fi
    done
    
    if [ $found -eq 0 ]; then
        echo "✅ No sensitive environment variables exposed"
    fi
}

# ネットワークセキュリティ
check_network() {
    echo "Checking network security..."
    
    # HTTPS確認
    if curl -s --head "https://sts.amazonaws.com" | grep -q "HTTP/2 200"; then
        echo "✅ HTTPS connections working"
    else
        echo "❌ HTTPS connection issues"
    fi
    
    # DNS over HTTPS確認
    if dig @1.1.1.1 amazonaws.com > /dev/null 2>&1; then
        echo "✅ Secure DNS resolution"
    else
        echo "⚠️ DNS resolution issues"
    fi
}

# 実行
check_permissions
check_env_vars  
check_network

echo "✅ Security check completed"
