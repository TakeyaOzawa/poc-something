#!/bin/bash

# ヘルスチェック・診断

echo "=== Health Check ==="

# システムリソース
check_resources() {
    echo "System Resources:"
    echo "- Memory: $(free -h 2>/dev/null | grep Mem | awk '{print $3"/"$2}' || echo 'N/A')"
    echo "- Disk: $(df -h / | tail -1 | awk '{print $3"/"$2" ("$5" used)"}')"
    echo "- Load: $(uptime | awk -F'load average:' '{print $2}')"
}

# サービス状態
check_services() {
    echo "Service Status:"
    
    # AWS CLI
    if aws --version > /dev/null 2>&1; then
        echo "✅ AWS CLI: $(aws --version | cut -d' ' -f1-2)"
    else
        echo "❌ AWS CLI: Not working"
    fi
    
    # Amazon Q CLI
    if q --version > /dev/null 2>&1; then
        echo "✅ Amazon Q CLI: $(q --version)"
    else
        echo "❌ Amazon Q CLI: Not working"
    fi
    
    # Docker
    if [ -f /.dockerenv ]; then
        echo "✅ Docker: Container environment"
    else
        echo "⚠️ Docker: Not in container"
    fi
}

# 接続テスト
check_connectivity() {
    echo "Connectivity:"
    
    local endpoints=(
        "github.com:443"
        "sts.amazonaws.com:443"
        "q.us-east-1.amazonaws.com:443"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if timeout 5 bash -c "</dev/tcp/${endpoint//:/ }" 2>/dev/null; then
            echo "✅ $endpoint"
        else
            echo "❌ $endpoint"
        fi
    done
}

# ログ出力
log_status() {
    local log_file="/tmp/health-check.log"
    {
        echo "=== Health Check $(date) ==="
        check_resources
        check_services
        check_connectivity
    } | tee "$log_file"
    echo "Log saved to: $log_file"
}

log_status
