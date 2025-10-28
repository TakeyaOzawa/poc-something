#!/bin/bash

# 使用方法表示
show_usage() {
    echo "Usage: $0 [LEVEL] [CONTAINER_NAME]"
    echo ""
    echo "LEVEL:"
    echo "  stop     - Stop containers only"
    echo "  remove   - Stop and remove containers"
    echo "  clean    - Stop, remove containers and remove images (default)"
    echo ""
    echo "CONTAINER_NAME:"
    echo "  Specific container name (optional)"
    echo "  If not specified, targets all 'q-.*amazon-q' containers"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Clean all Amazon Q containers"
    echo "  $0 stop                              # Stop all Amazon Q containers"
    echo "  $0 remove                            # Stop and remove all Amazon Q containers"
    echo "  $0 clean q-project-amazon-q-1       # Clean specific container"
    exit 1
}

# 引数処理
LEVEL=${1:-clean}
TARGET_CONTAINER=$2

# レベル検証
case $LEVEL in
    stop|remove|clean)
        ;;
    -h|--help|help)
        show_usage
        ;;
    *)
        echo "❌ Invalid level: $LEVEL"
        show_usage
        ;;
esac

echo "🔍 Amazon Q containers cleanup script"
echo "======================================"
echo "Level: $LEVEL"
echo "Target: ${TARGET_CONTAINER:-all Amazon Q containers}"
echo ""

# 対象コンテナの取得
if [ -n "$TARGET_CONTAINER" ]; then
    # 特定コンテナが指定された場合
    if docker ps -a --format "{{.Names}}" | grep -q "^${TARGET_CONTAINER}$"; then
        CONTAINERS=$(docker ps --format "{{.Names}}" | grep "^${TARGET_CONTAINER}$" || true)
        ALL_CONTAINERS="$TARGET_CONTAINER"
        IMAGES=$(docker inspect "$TARGET_CONTAINER" --format '{{.Config.Image}}' 2>/dev/null || true)
    else
        echo "❌ Container '$TARGET_CONTAINER' not found"
        exit 1
    fi
else
    # 全Amazon Qコンテナを対象
    CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "q-.*amazon-q" || true)
    ALL_CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep -E "q-.*amazon-q" || true)
    IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "q-.*amazon-q" || true)
fi

# 対象確認
if [ -z "$ALL_CONTAINERS" ]; then
    echo "❌ No target containers found"
    exit 0
fi

echo "📋 Target containers:"
echo "$ALL_CONTAINERS"
if [ "$LEVEL" = "clean" ] && [ -n "$IMAGES" ]; then
    echo ""
    echo "📋 Target images:"
    echo "$IMAGES"
fi
echo ""

# 確認プロンプト
read -p "⚠️  Proceed with $LEVEL operation? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled"
    exit 0
fi

# レベル別処理実行
case $LEVEL in
    stop)
        echo "🛑 Stopping containers..."
        if [ -n "$CONTAINERS" ]; then
            echo "$CONTAINERS" | xargs -r docker stop
            echo "✅ Containers stopped"
        else
            echo "ℹ️  No running containers to stop"
        fi
        ;;
    remove)
        echo "🛑 Stopping containers..."
        if [ -n "$CONTAINERS" ]; then
            echo "$CONTAINERS" | xargs -r docker stop
            echo "✅ Containers stopped"
        else
            echo "ℹ️  No running containers to stop"
        fi
        
        echo "🗑️  Removing containers..."
        if [ -n "$ALL_CONTAINERS" ]; then
            echo "$ALL_CONTAINERS" | xargs -r docker rm
            echo "✅ Containers removed"
        else
            echo "ℹ️  No containers to remove"
        fi
        ;;
    clean)
        echo "🛑 Stopping containers..."
        if [ -n "$CONTAINERS" ]; then
            echo "$CONTAINERS" | xargs -r docker stop
            echo "✅ Containers stopped"
        else
            echo "ℹ️  No running containers to stop"
        fi
        
        echo "🗑️  Removing containers..."
        if [ -n "$ALL_CONTAINERS" ]; then
            echo "$ALL_CONTAINERS" | xargs -r docker rm
            echo "✅ Containers removed"
        else
            echo "ℹ️  No containers to remove"
        fi
        
        echo "🗑️  Removing images..."
        if [ -n "$IMAGES" ]; then
            echo "$IMAGES" | xargs -r docker rmi
            echo "✅ Images removed"
        else
            echo "ℹ️  No images to remove"
        fi
        ;;
esac

echo "🎉 $LEVEL operation completed!"
