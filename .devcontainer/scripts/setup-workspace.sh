#!/bin/bash

# ワークスペースパスが設定されている場合の情報表示
if [ -n "$WORKSPACE_PATH" ] && [ "$WORKSPACE_PATH" != "" ]; then
    echo "Workspace path configured: $WORKSPACE_PATH"
    
    if [ -d "/workspace" ]; then
        echo "Workspace mounted successfully at /workspace"
        ls -la /workspace | head -5
    else
        echo "To mount workspace, add the following to runArgs in devcontainer.json:"
        echo "  \"-v\", \"$WORKSPACE_PATH:/workspace\""
        echo ""
        echo "Example runArgs configuration:"
        echo "\"runArgs\": ["
        echo "  \"--env-file\", \".env\","
        echo "  \"-v\", \"$WORKSPACE_PATH:/workspace\""
        echo "]"
    fi
else
    echo "No workspace path configured in WORKSPACE_PATH"
    echo "Set WORKSPACE_PATH in .env file to enable workspace mounting"
fi
