#!/bin/bash

# ヘルスチェック時は静かに実行
if [ "$HEALTHCHECK_MODE" = "true" ]; then
    exit 0
fi

cat << 'EOF'
╔══════════════════════════════════════╗
║     🎯 Amazon Q DevContainer        ║
║        準備完了！                    ║
╠══════════════════════════════════════╣
║ 利用可能なコマンド:                  ║
║ • ./manage.sh auth    (認証)         ║
║ • ./manage.sh chat    (チャット)     ║
║ • ./manage.sh shell   (シェル)       ║
║ • ./manage.sh status  (状態確認)     ║
╚══════════════════════════════════════╝
EOF
