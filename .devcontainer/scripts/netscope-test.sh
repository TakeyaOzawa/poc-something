#!/bin/bash

# Netscope環境での接続・認証テスト

echo "=== Netscope Environment Test ==="

# 1. 実環境での接続確認
test_aws_endpoints() {
    echo "Testing AWS endpoints..."
    local endpoints=(
        "https://sts.amazonaws.com"
        "https://sso.amazonaws.com" 
        "https://q.us-east-1.amazonaws.com"
        "https://desktop-release.q.us-east-1.amazonaws.com"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -s --max-time 10 --head "$endpoint" > /dev/null 2>&1; then
            echo "✅ $endpoint"
        else
            echo "❌ $endpoint"
        fi
    done
}

# 2. 認証フロー確認
test_auth_flow() {
    echo "Testing authentication flow..."
    
    # AWS CLI認証テスト
    if aws sts get-caller-identity --output text > /dev/null 2>&1; then
        echo "✅ AWS CLI authentication working"
    else
        echo "❌ AWS CLI authentication failed"
    fi
    
    # Amazon Q CLI認証テスト
    if command -v q > /dev/null 2>&1; then
        echo "✅ Amazon Q CLI available"
        q --version
    else
        echo "❌ Amazon Q CLI not found"
    fi
}

# 3. パフォーマンステスト
performance_test() {
    echo "Performance testing..."
    
    local start_time=$(date +%s)
    aws sts get-caller-identity > /dev/null 2>&1
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "AWS API call latency: ${duration}s"
    
    if [ $duration -lt 5 ]; then
        echo "✅ Performance acceptable"
    else
        echo "⚠️ Performance degraded"
    fi
}

# 環境情報収集
collect_env_info() {
    echo "Environment Information:"
    echo "- Proxy: ${HTTP_PROXY:-None}"
    echo "- DNS: $(cat /etc/resolv.conf | grep nameserver | head -1)"
    echo "- Network: $(ip route | grep default | head -1)"
}

# テスト実行
collect_env_info
echo
test_aws_endpoints
echo
test_auth_flow
echo
performance_test
