#!/bin/bash

# マルチプラットフォーム対応テスト

echo "=== Platform Compatibility Test ==="

# プラットフォーム情報
echo "Host Platform: $(uname -s) $(uname -m)"
echo "Container Platform: Linux $(uname -m)"

# AWS CLI アーキテクチャ確認
if command -v aws > /dev/null 2>&1; then
    echo "AWS CLI: $(file $(which aws) | cut -d: -f2-)"
    aws --version
else
    echo "❌ AWS CLI not found"
fi

# Amazon Q CLI確認
if command -v q > /dev/null 2>&1; then
    echo "Amazon Q CLI: $(file $(which q) | cut -d: -f2-)"
    q --version
else
    echo "❌ Amazon Q CLI not found"
fi

# Docker環境確認
if [ -f /.dockerenv ]; then
    echo "✅ Running in Docker container"
else
    echo "⚠️ Not running in Docker container"
fi

echo "✅ Platform compatibility test completed"
