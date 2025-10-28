#!/bin/bash

# 環境変数の読み込み
if [ -f ".env" ]; then
    source .env
fi

# 実際に動いているAmazon Qコンテナを検索（最新のものを選択）
find_running_container() {
    # Amazon Qコンテナのパターンで検索し、最新のものを取得
    docker ps --format "{{.Names}}" | grep -E "q-.*amazon-q-1$" | head -n1
}

CONTAINER_NAME=$(find_running_container)

case "$1" in
    start)
        echo "🚀 Starting Amazon Q container with Docker Compose..."
        ./deploy.sh ${2:-} ${3:-}
        ;;
    stop)
        echo "🛑 Stopping Amazon Q containers..."
        if [ -n "$2" ]; then
            ./cleanup.sh stop "$2"
        else
            ./cleanup.sh stop
        fi
        ;;
    down)
        echo "🗑️ Stopping and removing Amazon Q containers..."
        if [ -n "$2" ]; then
            ./cleanup.sh remove "$2"
        else
            ./cleanup.sh remove
        fi
        ;;
    clean)
        echo "🧹 Complete cleanup (stop, remove containers and images)..."
        if [ -n "$2" ]; then
            ./cleanup.sh clean "$2"
        else
            ./cleanup.sh clean
        fi
        ;;
    list)
        echo "📋 Amazon Q containers:"
        docker ps --filter "name=q-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        ;;
    restart)
        echo "🔄 Restarting Amazon Q containers..."
        if [ -n "$CONTAINER_NAME" ]; then
            ./cleanup.sh remove "${2:-$CONTAINER_NAME}"
            ./deploy.sh ${2:-$CONTAINER_NAME} ${3:-}
        else
            echo "❌ No Amazon Q container found"
            exit 1
        fi
        ;;
    shell)
        echo "🐚 Entering container shell..."
        if [ -n "$CONTAINER_NAME" ]; then
            docker exec -it ${2:-$CONTAINER_NAME} bash
        else
            echo "❌ No Amazon Q container found"
            exit 1
        fi
        ;;
    auth)
        echo "🔐 Running Amazon Q authentication..."
        if [ -n "$CONTAINER_NAME" ]; then
            docker exec -it ${2:-$CONTAINER_NAME} /usr/local/scripts/auth-amazon-q.sh
        else
            echo "❌ No Amazon Q container found"
            exit 1
        fi
        ;;
    chat)
        echo "💬 Starting Amazon Q chat..."
        if [ -n "$CONTAINER_NAME" ]; then
            docker exec -it ${2:-$CONTAINER_NAME} q chat
        else
            echo "❌ No Amazon Q container found"
            exit 1
        fi
        ;;
    auth-status)
        echo "📊 Checking Amazon Q authentication status..."
        if [ -n "$CONTAINER_NAME" ]; then
            docker exec -it ${2:-$CONTAINER_NAME} /usr/local/scripts/check-auth.sh
        else
            echo "❌ No Amazon Q container found"
            exit 1
        fi
        ;;
    logs)
        echo "📋 Container logs..."
        docker logs -f ${2:-$CONTAINER_NAME}
        ;;
    ps)
        echo "📋 Container status..."
        docker ps --filter "name=q-"
        ;;
    build)
        echo "🔨 Building containers..."
        ./cleanup.sh clean
        ./build.sh
        ;;
    clean)
        echo "🧹 Cleaning up..."
        docker compose down --volumes --remove-orphans
        docker compose down --rmi all --volumes --remove-orphans 2>/dev/null || true
        echo "Cleanup complete"
        ;;
    config)
        echo "⚙️  Showing Docker Compose configuration..."
        docker compose config
        ;;
    *)
        echo "Amazon Q CLI Container Manager (Docker Compose)"
        echo ""
        echo "Usage: $0 {start|stop|down|clean|list|restart|shell|auth|chat|status|logs|ps|build|config}"
        echo ""
        echo "Commands:"
        echo "  start      - Deploy and start containers"
        echo "  stop       - Stop Amazon Q containers (or specific: stop <container_name>)"
        echo "  down       - Stop and remove Amazon Q containers"
        echo "  clean      - Complete cleanup: stop, remove containers and images"
        echo "  list       - List all Amazon Q containers"
        echo "  restart    - Restart containers"
        echo "  shell      - Enter container shell"
        echo "  auth       - Run Amazon Q authentication"
        echo "  chat       - Start Amazon Q chat"
        echo "  status     - Check authentication status"
        echo "  logs       - Show container logs (follow mode)"
        echo "  ps         - Show container status"
        echo "  build      - Build container images"
        echo "  config     - Show Docker Compose configuration"
        echo ""
        echo "DevContainer Usage:"
        echo "  Open this folder in VS Code and use 'Dev Containers: Reopen in Container'"
        ;;
esac
