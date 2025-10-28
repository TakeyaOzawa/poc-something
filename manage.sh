#!/bin/bash

CONTAINER_NAME="amazon-q-cli"

case "$1" in
    start)
        echo "🚀 Starting Amazon Q container..."
        ./deploy.sh
        ;;
    stop)
        echo "🛑 Stopping Amazon Q container..."
        docker stop $CONTAINER_NAME 2>/dev/null || echo "Container not running"
        ;;
    restart)
        echo "🔄 Restarting Amazon Q container..."
        docker stop $CONTAINER_NAME 2>/dev/null || true
        ./deploy.sh
        ;;
    shell)
        echo "🐚 Entering container shell..."
        docker exec -it $CONTAINER_NAME bash
        ;;
    auth)
        echo "🔐 Running Amazon Q authentication..."
        docker exec -it $CONTAINER_NAME /usr/local/scripts/auth-amazon-q.sh
        ;;
    chat)
        echo "💬 Starting Amazon Q chat..."
        docker exec -it $CONTAINER_NAME q chat
        ;;
    status)
        echo "📊 Checking Amazon Q status..."
        docker exec $CONTAINER_NAME /usr/local/scripts/check-auth.sh
        ;;
    logs)
        echo "📋 Container logs..."
        docker logs $CONTAINER_NAME
        ;;
    clean)
        echo "🧹 Cleaning up..."
        docker stop $CONTAINER_NAME 2>/dev/null || true
        docker rm $CONTAINER_NAME 2>/dev/null || true
        docker rmi amazon-q-devcontainer 2>/dev/null || true
        echo "Cleanup complete"
        ;;
    *)
        echo "Amazon Q CLI Container Manager"
        echo ""
        echo "Usage: $0 {start|stop|restart|shell|auth|chat|status|logs|clean}"
        echo ""
        echo "Commands:"
        echo "  start   - Deploy and start container"
        echo "  stop    - Stop container"
        echo "  restart - Restart container"
        echo "  shell   - Enter container shell"
        echo "  auth    - Run Amazon Q authentication"
        echo "  chat    - Start Amazon Q chat"
        echo "  status  - Check authentication status"
        echo "  logs    - Show container logs"
        echo "  clean   - Remove container and image"
        exit 1
        ;;
esac
