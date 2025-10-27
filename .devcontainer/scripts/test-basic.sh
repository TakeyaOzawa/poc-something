#!/bin/bash

echo "=== Amazon Q DevContainer 基本動作確認 ==="

# Amazon Q CLI確認
echo "1. Amazon Q CLI バージョン確認"
if command -v q &> /dev/null; then
    q --version || echo "  Amazon Q CLI: インストール済み（バージョン確認エラー）"
else
    echo "  Amazon Q CLI: インストールされていません"
fi

# AWS CLI確認
echo "2. AWS CLI バージョン確認"
aws --version

# Node.js確認
echo "3. Node.js バージョン確認"
node --version
npm --version

# Rust確認
echo "4. Rust バージョン確認"
if command -v rustc &> /dev/null; then
    rustc --version
else
    echo "  Rust: インストールされていません"
fi

# 基本コマンドテスト
echo "5. 基本コマンドテスト"
echo "  - curl: $(curl --version | head -1)"
echo "  - git: $(git --version)"
echo "  - unzip: $(unzip -v | head -1)"

echo "=== テスト完了 ==="
