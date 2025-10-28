#!/bin/bash

SERVICE_NAME="amazon-q-dev"

case "$1" in
    start)
        echo "🚀 Starting Amazon Q container with Docker Compose..."
        ./deploy.sh
        ;;
    stop)
        echo "🛑 Stopping Amazon Q containers..."
        docker compose down
        ;;
    restart)
        echo "🔄 Restarting Amazon Q containers..."
        docker compose down
        ./deploy.sh
        ;;
    shell)
        echo "🐚 Entering container shell..."
        docker compose exec $SERVICE_NAME bash
        ;;
    auth)
        echo "🔐 Running Amazon Q authentication..."
        docker compose exec $SERVICE_NAME /usr/local/scripts/auth-amazon-q.sh
        ;;
    chat)
        echo "💬 Starting Amazon Q chat..."
        docker compose exec $SERVICE_NAME q chat
        ;;
    status)
        echo "📊 Checking Amazon Q status..."
        docker compose exec $SERVICE_NAME /usr/local/scripts/check-auth.sh
        ;;
    logs)
        echo "📋 Container logs..."
        docker compose logs -f $SERVICE_NAME
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
        echo "Usage: $0 {start|stop|restart|shell|auth|chat|status|logs|ps|build|clean|config}"
        echo ""
        echo "Commands:"
        echo "  start   - Deploy and start containers"
        echo "  stop    - Stop containers"
        echo "  restart - Restart containers"
        echo "  shell   - Enter container shell"
        echo "  auth    - Run Amazon Q authentication"
        echo "  chat    - Start Amazon Q chat"
        echo "  status  - Check authentication status"
        echo "  logs    - Show container logs (follow mode)"
        echo "  ps      - Show container status"
        echo "  build   - Build container images"
        echo "  clean   - Remove containers, volumes, and images"
        echo "  config  - Show Docker Compose configuration"
        echo ""
        echo "DevContainer Usage:"
        echo "  Open this folder in VS Code and use 'Dev Containers: Reopen in Container'"
        exit 1
        ;;
esac
