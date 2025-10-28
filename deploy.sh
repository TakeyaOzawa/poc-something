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

TARGET_WORKSPACE=${1:-${AMAZON_Q_WORKSPACE:-${AMAZON_Q_DEFAULT_WORKSPACE}}}
PROJECT_NAME=$(echo ${2:-$TARGET_WORKSPACE} | sed 's|/*$||; s|.*/\([^/]*\)/\([^/]*\)$|\2-\1|')
WORK_HASH=$(echo "${TARGET_WORKSPACE}_$(date)" | md5sum | cut -c1-4)

export AMAZON_Q_WORKSPACE="$TARGET_WORKSPACE"
export COMPOSE_PROJECT_NAME="q-${PROJECT_NAME}-${WORK_HASH}"

# コンテナ起動
echo "Starting containers..."
docker compose up -d

# 起動確認
if docker compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Container started successfully!"
    echo ""
    echo "Amazon Q CLI Container Manager (Docker Compose)"
    echo ""
    echo "Usage: ./manage.sh {start|stop|stop-all|list|restart|shell|auth|chat|status|logs|ps|build|clean|config}"
    echo ""
    echo "Commands:"
    echo "  start      - Deploy and start containers"
    echo "  stop       - Stop current containers (or specific: stop <container_name>)"
    echo "  stop-all   - Stop all Amazon Q containers"
    echo "  list       - List all Amazon Q containers"
    echo "  restart    - Restart containers"
    echo "  shell      - Enter container shell"
    echo "  auth       - Run Amazon Q authentication"
    echo "  chat       - Start Amazon Q chat"
    echo "  status     - Check authentication status"
    echo "  logs       - Show container logs (follow mode)"
    echo "  ps         - Show container status"
    echo "  build      - Build container images"
    echo "  clean      - Remove containers, volumes, and images"
    echo "  config     - Show Docker Compose configuration"
    echo ""
    echo "DevContainer Usage:"
    echo "  Open this folder in VS Code and use 'Dev Containers: Reopen in Container'"
else
    echo "❌ Failed to start container"
    echo "Check logs with: docker compose logs"
    exit 1
fi
