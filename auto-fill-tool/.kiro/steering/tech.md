---
inclusion: always
---

# 技術スタック

## 🏗️ アーキテクチャパターン

### Clean Architecture + DDD
- **Clean Architecture**: レイヤー分離による保守性の確保
- **Domain-Driven Design**: ビジネスロジックの中心化
- **Presenter Pattern**: UIとビジネスロジックの分離
- **Repository Pattern**: データアクセスの抽象化
- **Use Case Pattern**: アプリケーションロジックのカプセル化

### 依存関係の方向
```
Presentation → Application → Domain
Infrastructure → Domain
```

## 💻 フロントエンド技術

### 言語・フレームワーク
- **TypeScript 5.4.5**: 型安全性の確保
- **ES2022**: モダンJavaScript機能の活用
- **Chrome Extension Manifest V3**: 最新のChrome拡張機能API

### ビルドツール
- **Webpack 5.91.0**: モジュールバンドラー
  - splitChunks設定による最適化（最大chunkサイズを95%削減）
  - 効率的なキャッシングと並列ロード
- **Babel**: TypeScriptトランスパイル
- **PostCSS + Autoprefixer**: CSS最適化

### UI/スタイリング
- **Tailwind CSS 3.4.18**: ユーティリティファーストCSS
- **統一デザインシステム**: 共通コンポーネント（form-input, form-select, btn-*）
- **レスポンシブデザイン**: 全画面対応

### 外部ライブラリ（ローカル管理）
- **Alpine.js 3.15.1**: リアクティブUI（CDN不使用、セキュリティ強化）
- **Chart.js 4.5.1**: パフォーマンスダッシュボード
- **DOMPurify 3.3.0**: XSS対策

## 🔧 開発ツール

### コード品質
- **ESLint 8.57.0**: 静的解析
  - 複雑度ルール（最大10）
  - アーキテクチャルール（レイヤー間依存チェック）
  - カスタムルール（domain-layer-purity等）
- **Prettier 3.6.2**: コードフォーマッター
- **TypeScript Compiler**: 型チェック
- **madge 7.0.0**: 循環依存検出・依存関係グラフ生成

### Git Hooks
- **Husky 9.1.7**: Git hooks管理
- **lint-staged 16.2.3**: ステージされたファイルの自動チェック
  - pre-commit: ESLint + Prettier
  - pre-push: 型チェック + 複雑度チェック

## 🧪 テスト技術

### テストフレームワーク
- **Jest 29.7.0**: ユニットテストフレームワーク
- **ts-jest 29.1.2**: TypeScript対応
- **jest-environment-jsdom 29.7.0**: DOM環境シミュレーション

### テスト戦略
- **5114テストケース**: 高いテストカバレッジ（229テストスイート）
- **テストピラミッド**: Unit Tests（多数）→ Integration Tests（中程度）→ E2E Tests（少数）
- **モック戦略**: 外部依存の完全な隔離

### カバレッジ目標
- **Statements**: 96%以上
- **Branches**: 89%以上
- **Functions**: 96%以上
- **Lines**: 96%以上

## 🗄️ データ・ストレージ

### ストレージ技術
- **Chrome Storage API**: 設定データの永続化
- **IndexedDB**: 大容量データ（録画ファイル等）の保存
- **暗号化ストレージ**: AES-256-GCM暗号化

### データ形式
- **JSON**: 構造化データの標準形式
- **CSV**: インポート/エクスポート形式
- **Base64**: バイナリデータのエンコーディング

## 🔒 セキュリティ技術

### 暗号化
- **AES-256-GCM**: データ暗号化
- **SHA-256**: パスワードハッシュ化
- **PBKDF2**: キー導出関数

### セキュリティ機能
- **マスターパスワード**: 全データの暗号化
- **自動ロック**: 非アクティブ時の自動ロック
- **セキュリティイベントログ**: 7種類のセキュリティイベント追跡
- **依存関係監視**: Dependabotによる自動脆弱性スキャン

## 🌐 外部連携

### MCP (Model Context Protocol) サーバー

プロジェクトには以下のMCPサーバーが設定されており、外部システムとの連携が可能です：

#### 🔧 開発ツール連携
- **filesystem**: ファイルシステム操作
  - `read_file`, `list_directory`, `search_files`
- **git**: Git操作
  - `git_status`, `git_diff`, `git_log`, `git_show`
- **github**: GitHub連携（無効化）
  - `search_repositories`, `get_repository`, `list_issues`

#### 🌐 Chrome拡張機能開発支援
- **chrome**: Chrome ブラウザ連携
  - `chrome_list_tabs`: 開いているタブの一覧取得
  - `chrome_get_tab_info`: タブ情報の取得
  - `chrome_navigate_tab`: タブのナビゲーション
  - `chrome_execute_script`: スクリプト実行
  - `chrome_get_extension_info`: 拡張機能情報取得
  - `chrome_reload_extension`: 拡張機能のリロード

#### ☁️ AWS連携
- **aws-docs**: AWS公式ドキュメント検索
  - `search_aws_docs`: AWSドキュメント検索
  - `get_aws_service_info`: AWSサービス情報取得
  - `list_aws_services`: AWSサービス一覧
- **aws-cli**: AWS CLI操作（読み取り専用で有効化）
  - **基本サービス**: S3, Lambda, EC2, IAM, CloudFormation, RDS
  - **CI/CD**: CodeBuild（プロジェクト・ビルド履歴）
  - **コンテナ**: ECR（リポジトリ・イメージ）, ECS（クラスター・サービス・タスク）
  - **API**: API Gateway（REST API・HTTP API・リソース）
  - **ワークフロー**: Step Functions（ステートマシン・実行履歴）
  - **ネットワーク**: VPC（VPC・サブネット・ルートテーブル・ゲートウェイ）
  - **セキュリティ**: Secrets Manager（シークレット一覧）, Systems Manager（パラメータ）
  - **通知**: SES（送信者ID・設定セット）, EventBridge（ルール・バス）
  - **評価**: Well-Architected Tool（ワークロード・レンズレビュー）
  - **コスト管理**: Cost Explorer（コスト・使用量・予測）, Budgets（予算管理）, Cost and Usage Reports（詳細レポート）, Pricing（料金情報）

#### 📝 ドキュメント・コミュニケーション
- **notion**: Notion連携
  - `notion_search`, `notion_read_page`, `notion_list_databases`
- **slack**: Slack連携
  - `list_channels`, `send_message`, `get_channel_history`

#### 🔍 検索・データベース
- **web-search**: Brave検索（無効化）
- **postgres**: PostgreSQL連携（無効化）

### 環境変数設定

MCPサーバーを使用するには、以下の環境変数を設定してください：

```bash
# Notion連携
export KIRO_NOTION_TOKEN='your-notion-token'

# Slack連携  
export KIRO_SLACK_BOT_TOKEN='xoxb-your-bot-token'
export KIRO_SLACK_USER_TOKEN='xoxp-your-user-token'

# AWS連携
export KIRO_AWS_PROFILE='your-aws-profile'
export KIRO_AWS_REGION='ap-northeast-1'

# GitHub連携（必要時）
export KIRO_GITHUB_TOKEN='your-github-token'

# Web検索（必要時）
export KIRO_BRAVE_API_KEY='your-brave-api-key'

# PostgreSQL（必要時）
export KIRO_POSTGRES_URL='postgresql://user:pass@host:port/db'
```

### MCP使用例

#### Chrome拡張機能開発での活用
```typescript
// Chrome MCPを使用した拡張機能テスト
// 1. 拡張機能の情報取得
await chrome_get_extension_info();

// 2. 拡張機能のリロード
await chrome_reload_extension();

// 3. テスト用スクリプトの実行
await chrome_execute_script({
  code: "console.log('Extension test')"
});
```

#### AWS連携での活用
```typescript
// AWS Docs MCPを使用した技術調査
// 1. Chrome Extension関連のAWSサービス検索
await search_aws_docs("chrome extension hosting");

// 2. Lambda関数での拡張機能バックエンド構築
await get_aws_service_info("lambda");
```

### API連携
- **Notion API**: データ同期
- **Google Sheets API**: データ同期
- **カスタムAPI**: 汎用的なREST API対応

### データ変換
- **JSONPath**: 柔軟なデータマッピング
- **CSV変換**: 複数文字コード対応（UTF-8, Shift-JIS, EUC-JP）

## 📦 パッケージ管理

### 依存関係管理
- **npm**: パッケージマネージャー
- **package-lock.json**: 依存関係の固定
- **セキュリティ監査**: 定期的な脆弱性チェック

### 主要依存関係
```json
{
  "dependencies": {
    "alpinejs": "^3.15.1",
    "axios": "^1.12.2",
    "chart.js": "^4.5.1",
    "dompurify": "^3.3.0",
    "uuid": "^13.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "webpack": "^5.91.0",
    "jest": "^29.7.0",
    "eslint": "^8.57.0",
    "prettier": "^3.6.2"
  }
}
```

## 🚀 パフォーマンス最適化

### ビルド最適化
- **Code Splitting**: 機能別のチャンク分割
- **Tree Shaking**: 未使用コードの除去
- **Minification**: コード圧縮
- **Bundle Analysis**: バンドルサイズの監視

### ランタイム最適化
- **Batch Loading**: Chrome Storage APIの一括読み込み（67%のAPIコール削減）
- **並列処理**: Promise.allSettled()による並行処理
- **メモリ管理**: 適切なオブジェクト破棄

### 監視・計測
- **パフォーマンスメトリクス**: 実行時間の計測
- **メモリ使用量**: メモリリークの監視
- **API呼び出し回数**: 外部API使用量の最適化

## 🔄 CI/CD

### 自動化
- **GitHub Actions**: CI/CDパイプライン（将来実装予定）
- **自動テスト**: プッシュ時の全テスト実行
- **自動デプロイ**: リリース時の自動パッケージング
- **Agent Hooks**: Kiro内での自動品質チェック

### Agent Hooks統合

#### 開発ワークフロー自動化
- **ファイル保存時**: 関連テスト + Lint自動実行
- **実行完了時**: 品質保証プロセス自動開始
- **メッセージ送信時**: ユーザー質問前のSlack通知

#### 手動トリガーHooks
- **品質ゲート**: 6ステップ完全品質チェック
- **カバレッジ強制**: 90%達成までのテスト追加支援
- **エラーハンドリング**: StandardError + エラーコード管理
- **多言語対応**: i18nリソース更新支援

### 品質ゲート
- **テスト合格**: 全テストケースの合格
- **Lint通過**: 0エラー、0警告
- **型チェック**: TypeScriptコンパイル成功
- **セキュリティ監査**: 脆弱性0件
- **カバレッジ**: 90%以上達成

## 📊 監視・ログ

### ログシステム
- **構造化ログ**: JSON形式のログ出力
- **ログレベル**: ERROR, WARN, INFO, DEBUG
- **ログローテーション**: 最大保存数・保持期間の設定

### エラーハンドリング
- **StandardError**: 統一エラー管理システム
- **エラーコード**: カテゴリ別の体系的なエラーコード
- **多言語エラーメッセージ**: 英語・日本語対応

## 🌍 国際化

### i18n対応
- **Chrome i18n API**: 拡張機能標準の国際化機能
- **多言語メッセージ**: 英語・日本語対応
- **動的言語切り替え**: ユーザー設定による言語変更

## 📝 開発制約・考慮事項

### TypeScript制約
- **パスマッピング**: TypeScriptコンパイラーの既知の問題
  - 実用上の影響なし（Webpack、Jest、実行時は正常動作）
  - IDEの型チェックエラーは無視可能

### Chrome拡張機能制約
- **Manifest V3**: Service Worker環境での制限
- **CORS制限**: 一部外部APIへのアクセス制限
- **権限管理**: 最小権限の原則

### パフォーマンス制約
- **Chrome Storage制限**: 同期ストレージの容量制限
- **IndexedDB**: 大容量データの非同期処理
- **メモリ制限**: ブラウザ環境でのメモリ使用量

## 🔮 技術的負債・改善計画

### 短期改善項目
- **TypeScriptパスマッピング**: コンパイラー問題の解決
- **テストカバレッジ**: 100%カバレッジの達成
- **パフォーマンス**: さらなる最適化

### 中期改善項目
- **React/Vue移行**: モダンUIフレームワークへの移行検討
- **WebAssembly**: 重い処理の高速化
- **PWA対応**: プログレッシブWebアプリ化

### 長期改善項目
- **マイクロサービス**: 機能の分散化
- **AI統合**: 機械学習による自動化強化
- **クラウド連携**: サーバーサイド機能の追加
