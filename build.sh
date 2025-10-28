#!/bin/bash

set -e

echo "Building Amazon Q DevContainer with Docker Compose..."

# .envファイルの存在確認
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        echo "Error: .env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Docker Composeでビルド
docker compose build

echo "Build completed successfully!"
echo "Service: amazon-q-dev"
echo ""
echo "To start the container:"
echo "  ./manage.sh start"
echo ""
echo "To use with DevContainer:"
echo "  Open in VS Code and use 'Dev Containers: Reopen in Container'"
