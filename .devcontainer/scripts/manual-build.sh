#!/bin/bash

# 手動ビルドスクリプト（コンテナ起動後実行用）

echo "=== Amazon Q CLI Manual Build ==="

# ネットワーク確認
echo "1. Testing network connectivity..."
if curl -s --head https://github.com > /dev/null; then
    echo "✅ Network OK"
else
    echo "❌ Network issue - check proxy settings"
    exit 1
fi

# Rust環境確認
echo "2. Checking Rust environment..."
source ~/.cargo/env
if rustc --version > /dev/null 2>&1; then
    echo "✅ Rust OK: $(rustc --version)"
else
    echo "❌ Rust not available"
    exit 1
fi

# Amazon Q CLI ビルド
echo "3. Building Amazon Q CLI..."
cd /tmp
rm -rf amazon-q-cli
git clone https://github.com/aws/amazon-q-developer-cli.git amazon-q-cli
cd amazon-q-cli

echo "Building... (this may take 5-10 minutes)"
cargo build --release --bin chat_cli

if [ -f "target/release/chat_cli" ]; then
    sudo cp target/release/chat_cli /usr/local/bin/q
    sudo chmod +x /usr/local/bin/q
    echo "✅ Amazon Q CLI installed successfully!"
    q --version
else
    echo "❌ Build failed"
    exit 1
fi

echo "🎉 Setup complete! You can now use: q chat"
