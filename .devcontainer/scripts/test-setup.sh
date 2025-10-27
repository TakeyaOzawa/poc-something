#!/bin/bash

echo "=== Amazon Q DevContainer Setup Test ==="
echo

echo "1. Checking Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker is available"
    docker --version
else
    echo "❌ Docker not found"
    exit 1
fi

echo

echo "2. Checking devContainer configuration..."
if [ -f ".devcontainer/devcontainer.json" ] && [ -f ".devcontainer/Dockerfile" ]; then
    echo "✅ devContainer files exist"
else
    echo "❌ devContainer files missing"
    exit 1
fi

echo

echo "3. Validating Dockerfile..."
if grep -q "amazon-q-cli" .devcontainer/Dockerfile; then
    echo "✅ Amazon Q CLI build script included"
else
    echo "❌ Amazon Q CLI build script missing"
    exit 1
fi

echo

echo "4. Checking investigation document..."
if [ -f "docs/amazon-q-cli-investigation.md" ]; then
    echo "✅ Investigation document exists"
    echo "   Last updated: $(stat -f "%Sm" docs/amazon-q-cli-investigation.md)"
else
    echo "❌ Investigation document missing"
    exit 1
fi

echo

echo "=== Setup Ready! ==="
echo "Next steps:"
echo "1. Open this project in VSCode"
echo "2. Press Ctrl+Shift+P"
echo "3. Select 'Dev Containers: Reopen in Container'"
echo "4. Wait for container build and Amazon Q CLI compilation"
echo "5. Run 'q --version' to verify installation"
