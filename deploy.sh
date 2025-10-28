#!/bin/bash

set -e

echo "Deploying Amazon Q DevContainer with Docker Compose..."

# .envファイルの存在確認
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "Please edit .env file with your settings before continuing."
        exit 1
    else
        echo "Error: .env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# 環境変数の確認
if [ -z "$AMAZON_Q_WORKSPACE" ]; then
    source .env
    if [ -z "$AMAZON_Q_WORKSPACE" ]; then
        echo "Error: AMAZON_Q_WORKSPACE not set in .env file"
        exit 1
    fi
fi

echo "Workspace path: $AMAZON_Q_WORKSPACE"

# 既存コンテナの停止
echo "Stopping existing containers..."
docker compose down || true

# コンテナ起動
echo "Starting containers..."
docker compose up -d

# 起動確認
if docker compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Container started successfully!"
    echo ""
    echo "Available commands:"
    echo "  ./manage.sh shell    # Enter container shell"
    echo "  ./manage.sh auth     # Run Amazon Q authentication"
    echo "  ./manage.sh chat     # Start Amazon Q chat"
    echo "  ./manage.sh status   # Check authentication status"
    echo "  ./manage.sh logs     # Show container logs"
    echo "  ./manage.sh stop     # Stop containers"
else
    echo "❌ Failed to start container"
    echo "Check logs with: docker compose logs"
    exit 1
fi
