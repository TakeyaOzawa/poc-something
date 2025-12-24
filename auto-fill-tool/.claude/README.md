# Auto-Fill Tool - Claude Code Configuration

このディレクトリには、Claude Code用のプロジェクト固有の設定とルールが含まれています。

## 📁 ディレクトリ構造

```
.claude/
├── README.md                      # このファイル
├── CLAUDE.md                       # Claude Code品質保証ルール（メイン）
├── settings.local.json             # ローカル権限設定
├── settings/
│   └── mcp.json                   # MCP (Model Context Protocol) サーバー設定
├── rules/                          # プロジェクト固有ルール
│   ├── project-overview.md        # プロダクト概要
│   ├── project-structure.md       # プロジェクト構造
│   ├── tech-stack.md              # 技術スタック
│   ├── quality-standards.md       # 品質基準とワークフロー
│   ├── mcp-integration.md         # MCP統合ガイド
│   ├── japanese-communication.md  # 日本語コミュニケーション設定
│   └── manager-guidelines.md      # マネージャー向けガイドライン
└── hooks/
    └── README.md                   # 自動化ワークフローガイド
```

## 🚀 セットアップ

### 1. 環境変数の設定

MCP統合を使用するには、以下の環境変数を設定してください：

```bash
# Slack通知（必須）
export MY_SLACK_OAUTH_TOKEN='xoxb-your-bot-token'
export MY_SLACK_USER_ID='U1234567890'

# Notion連携
export NOTION_TOKEN='your-notion-token'

# Slack MCP連携
export SLACK_BOT_TOKEN='xoxb-your-bot-token'
export SLACK_USER_TOKEN='xoxp-your-user-token'

# AWS連携（オプション）
export AWS_PROFILE='default'
export AWS_REGION='ap-northeast-1'

# GitHub連携（オプション）
export GITHUB_TOKEN='your-github-token'

# Web検索（オプション）
export BRAVE_API_KEY='your-brave-api-key'

# PostgreSQL（オプション）
export POSTGRES_URL='postgresql://user:pass@host:port/db'
```

### 2. MCP設定の確認

MCP設定は `settings/mcp.json` に記載されています。環境変数が正しく設定されていれば、自動的に各MCPサーバーが利用可能になります。

### 3. Claude Codeの設定

Claude Codeを起動すると、自動的に `.claude/CLAUDE.md` のルールが適用されます。

## 📚 主要ドキュメント

### CLAUDE.md
プロジェクト開発時の品質保証ルールが記載されています：
- **Slack通知ルール**: ユーザーへの質問前の通知方法
- **TypeScript命名規則**: ファイル・型・インターフェースの命名ルール
- **型定義配置規約**: クリーンアーキテクチャに基づく型の配置ルール
- **開発完了時の必須プロセス**: 6ステップ品質保証プロセス

### Rules (rules/)
プロジェクト固有のルールとガイドラインが記載されています：
- **project-overview.md**: プロダクトの目的、ターゲットユーザー、主要機能
- **project-structure.md**: ディレクトリ構成、命名規則、依存関係の方向
- **tech-stack.md**: 使用技術、MCP統合、CI/CD設定
- **quality-standards.md**: 品質基準、テスト戦略、Git Hooks連携
- **mcp-integration.md**: MCP使用方法、Chrome拡張機能開発支援、AWS連携
- **japanese-communication.md**: 日本語でのコミュニケーション設定
- **manager-guidelines.md**: マネージャー向けプロジェクト管理ガイド

### Hooks (hooks/)
開発ワークフローの自動化ガイドが記載されています：
- 品質ゲート完全チェック
- カバレッジチェック & テスト強化
- Gitコミット品質チェック
- エラーハンドリング強化
- 多言語リソース更新

## 🔧 よく使うコマンド

### 開発・テスト
```bash
npm run dev              # 開発ビルド（ウォッチ）
npm test                 # テスト実行
npm run test:coverage    # カバレッジ測定
```

### 品質チェック
```bash
npm run hooks:commit-check   # コミット品質チェック
npm run lint                 # Lintチェック
npm run build                # プロダクションビルド
npm run hooks:quality-gate   # 完全品質チェック
npm run hooks:coverage       # カバレッジチェック & テスト強化
```

### エラーコード管理
```bash
npm run error:list       # エラーコード一覧
npm run error:reserve    # 新エラーコード予約
```

## 🎯 開発時の重要ポイント

1. **依存関係の方向**: `presentation → application → domain`, `infrastructure → domain`
2. **品質基準**: カバレッジ90%以上、複雑度10以下
3. **命名規則**: PascalCase（クラス）, kebab-case（型定義）
4. **必須プロセス**: 開発完了時の6ステップ品質保証

## 📖 参考資料

- [プロジェクトREADME](../README.md)
- [開発者ガイド](../docs/developer-guide.md)
- [アーキテクチャ設計](../docs/architecture/)

## 🔄 更新履歴

- 2024-12-24: Kiro設定からClaude Code設定に変換・作成
- 2024-11-08: 初版作成（CLAUDE.md）
