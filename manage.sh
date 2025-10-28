#!/bin/bash

CONTAINER_NAME="q-amazon-q-1"

case "$1" in
    start)
        echo "🚀 Starting Amazon Q container with Docker Compose..."
        ./deploy.sh ${2:-} ${3:-}
        ;;
    stop)
        if [ -n "$2" ]; then
            echo "🛑 Stopping specific container: $2"
            docker stop "$2" 2>/dev/null || echo "Container $2 not found or already stopped"
        else
            echo "🛑 Stopping Amazon Q containers..."
            docker compose down
        fi
        ;;
    stop-all)
        echo "🛑 Stopping all Amazon Q containers..."
        docker ps --filter "name=q-" --format "{{.Names}}" | xargs -r docker stop
        ;;
    list)
        echo "📋 Amazon Q containers:"
        docker ps --filter "name=q-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        ;;
    restart)
        echo "🔄 Restarting Amazon Q containers..."
        docker compose down
        ./deploy.sh
        ;;
    shell)
        echo "🐚 Entering container shell..."
        docker compose exec ${2:-$CONTAINER_NAME} bash
        ;;
    auth)
        echo "🔐 Running Amazon Q authentication..."
        docker compose exec ${2:-$CONTAINER_NAME} /usr/local/scripts/auth-amazon-q.sh
        ;;
    chat)
        echo "💬 Starting Amazon Q chat..."
        docker compose exec ${2:-$CONTAINER_NAME} q chat
        ;;
    status)
        echo "📊 Checking Amazon Q status..."
        docker compose exec ${2:-$CONTAINER_NAME} /usr/local/scripts/check-auth.sh
        ;;
    logs)
        echo "📋 Container logs..."
        docker compose logs -f ${2:-$CONTAINER_NAME}
        ;;
    ps)
        echo "📋 Container status..."
        docker compose ps
        ;;
    build)
        echo "🔨 Building containers..."
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
        echo "Usage: $0 {start|stop|stop-all|list|restart|shell|auth|chat|status|logs|ps|build|clean|config}"
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
        exit 1
        ;;
esac
