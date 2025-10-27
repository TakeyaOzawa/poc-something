#!/bin/bash

# プロキシ設定が存在する場合のみ設定
if [ -n "$HTTP_PROXY" ] && [ "$HTTP_PROXY" != "" ]; then
    echo "Setting up HTTP proxy: $HTTP_PROXY"
    export HTTP_PROXY="$HTTP_PROXY"
    export http_proxy="$HTTP_PROXY"
else
    echo "No HTTP proxy configured - skipping HTTP proxy setup"
    unset HTTP_PROXY
    unset http_proxy
fi

if [ -n "$HTTPS_PROXY" ] && [ "$HTTPS_PROXY" != "" ]; then
    echo "Setting up HTTPS proxy: $HTTPS_PROXY"
    export HTTPS_PROXY="$HTTPS_PROXY"
    export https_proxy="$HTTPS_PROXY"
else
    echo "No HTTPS proxy configured - skipping HTTPS proxy setup"
    unset HTTPS_PROXY
    unset https_proxy
fi

# NO_PROXYの設定
if [ -n "$NO_PROXY" ] && [ "$NO_PROXY" != "" ]; then
    export NO_PROXY="$NO_PROXY"
    export no_proxy="$NO_PROXY"
fi
