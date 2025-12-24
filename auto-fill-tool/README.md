# Auto-Fill Tool - Web自動入力 Chrome拡張機能

Webサイトへの自動入力・操作を行うChrome拡張機能です。XPath管理機能により、複数サイトの自動入力フローを簡単に設定・管理できます。

## 🚀 クイックスタート

### インストール

```bash
# 1. 依存パッケージのインストール
npm install

# 2. ビルド
npm run build

# 3. Chromeに読み込み
# chrome://extensions/ → デベロッパーモード ON → 「パッケージ化されていない拡張機能を読み込む」→ distフォルダを選択
```

### 基本的な使い方

1. **Webサイト設定**: ポップアップUIから対象サイトを登録
2. **XPath設定**: XPath管理画面で入力ステップを設定
3. **自動入力実行**: 「▶️ 自動入力実行」ボタンで開始

詳細な使用方法は [使い方ガイド](#使い方) を参照してください。

## ✨ 主な機能

- ✅ **XPath管理**: 複数Webサイトの自動入力設定を一元管理
- ✅ **変数管理**: サイトごとの動的な値入力に対応
- ✅ **画面遷移対応**: 複数ページにまたがるフォーム入力の自動継続
- ✅ **リトライ機能**: 失敗時の自動リトライ（回数・待機時間をカスタマイズ可能）
- ✅ **タブ録画機能**: 自動入力実行中の画面録画・視聴
- ✅ **データ同期機能**: 外部ストレージ（CSV、Notion、Google Sheets等）との同期
- ✅ **セキュリティ**: AES-256-GCM暗号化、マスターパスワード保護
- ✅ **CSVインポート/エクスポート**: 設定のバックアップ・共有
- ✅ **レスポンシブUI**: 統一されたデザインシステム

## 🏗️ アーキテクチャ

本プロジェクトは**Clean Architecture**と**Domain-Driven Design (DDD)** の原則に基づいて設計されています。

```
src/
├── domain/          # ドメイン層（ビジネスロジック）
├── usecases/        # ユースケース層（アプリケーションロジック）
├── infrastructure/  # インフラ層（外部システム連携）
└── presentation/    # プレゼンテーション層（UI）
```

詳細なアーキテクチャ設計については以下を参照：
- [アーキテクチャ詳細](#アーキテクチャ詳細)
- [新規Entity追加実装ルール](#新規entity追加実装ルール)

## 🔧 Kiro統合とMCP設定

本プロジェクトは**Kiro IDE**との統合を前提として設計されており、包括的なMCP (Model Context Protocol) サーバー設定と自動化されたAgent Hooksを提供します。

### 📋 設定済みMCPサーバー

- **🌐 Chrome拡張機能開発支援**: ブラウザ操作・拡張機能管理
- **☁️ AWS連携**: 包括的なAWSサービス参照（読み取り専用）
- **🔧 開発ツール**: ファイルシステム・Git操作
- **📝 ドキュメント・コミュニケーション**: Notion・Slack連携

### 🤖 Agent Hooks自動化

- **自動トリガー**: ファイル保存時、実行完了時、メッセージ送信時
- **手動トリガー**: 品質ゲートチェック、カバレッジ強制、エラーハンドリングチェック

詳細な設定方法と使用例については [MCP統合ガイド](.kiro/steering/mcp-integration.md) を参照してください。

## 📖 ドキュメント

### ユーザーガイド
- [使い方](#使い方) - 基本的な操作方法
- [画面遷移対応機能](#画面遷移対応機能) - 複数ページフォームの自動入力
- [データ同期機能](#データ同期機能) - 外部ストレージとの連携
- [セキュリティ](#セキュリティ) - 暗号化・認証機能

### 開発者ガイド
- [開発コマンド](#開発コマンド) - ビルド・テスト・品質チェック
- [アーキテクチャ詳細](#アーキテクチャ詳細) - Clean Architecture設計
- [新規Entity追加実装ルール](#新規entity追加実装ルール) - 開発ガイドライン
- [技術スタック](#技術スタック) - 使用技術・制約事項

### Kiro統合
- [MCP統合ガイド](.kiro/steering/mcp-integration.md) - MCP設定・使用例
- [Steering Files](.kiro/steering/) - Kiro連携設定
- [Agent Hooks](.kiro/hooks/) - 自動化設定

### API・設定例
- [API Configuration Examples](docs/user-guides/データ同期/API_CONFIGURATION_EXAMPLES.md)
- [CSV Format Examples](docs/user-guides/データ同期/CSV_FORMAT_EXAMPLES.md)
- [セキュリティポリシー](docs/SECURITY_POLICY.md)

## 使い方

### 1. Webサイト設定の追加

ポップアップUIから対象Webサイトを登録します：

- **Website Name**: サイト識別名
- **Start URL**: 自動入力開始URL
- **Status**: enabled（有効）/ disabled（無効）/ once（1回のみ実行）
- **Variables**: サイト固有の変数（例: ユーザー名、パスワード）

### 2. XPath設定の追加

XPath管理画面で各入力ステップを設定します：

#### 基本設定
- **Value**: 入力する値（変数 `{{variable_name}}` 使用可）
- **Action Type**: `input`（テキスト入力）、`click`（クリック）、`change_url`（URL変更）、`check`（条件チェック）
- **URL**: 実行対象のURL（正規表現可）
- **Execution Order**: 実行順序（数値）

#### XPath設定
- **Selected Path Pattern**: smart（推奨）/ short / absolute
- **Smart XPath**: スマートXPath（推奨）
- **Short XPath**: 短縮XPath
- **Absolute XPath**: 絶対XPath

#### 高度な設定
- **After Wait Seconds**: 実行後の待機時間（秒）
- **Execution Timeout Seconds**: タイムアウト時間（秒）
- **Retry Type**: リトライ設定（0: なし、10: あり）

### 3. システム設定

変数管理画面の「システム設定」セクションで設定します：

- **リトライ待機時間（範囲指定）**: 最小値・最大値を指定（デフォルト: 30〜60秒）
- **リトライ回数**: 失敗時のリトライ回数（-1で無限回、デフォルト: 3回）

### 4. 自動入力の実行

1. XPath管理画面でサイトを選択
2. 「▶️ 自動入力実行」ボタンをクリック
3. 新しいタブでstart_urlが開き、自動入力が開始されます

### 5. XPathのインポート/エクスポート

- **エクスポート**: 現在の全XPath設定をCSV形式でダウンロード
- **インポート**: CSVファイルから設定を一括インポート

## 画面遷移対応機能

複数ページにまたがるフォーム入力を自動的に継続・再開できます。

### 主な特徴
- **自動進捗保存**: CHANGE_URLアクション実行時に現在のステップ位置を自動保存
- **自動再開**: ページ遷移後、次のページを開くと自動的に続きから実行
- **中断復旧**: ブラウザを閉じても24時間以内なら再開可能
- **進捗管理**: 全体の進捗状況（現在のステップ/全ステップ数）を追跡

### 使用例
- 3ページ登録フォーム（個人情報 → 住所情報 → アカウント作成）
- ショッピングチェックアウト（カート → 配送情報 → 支払い情報 → 確認）

### 制約事項
- **24時間制限**: 24時間以上前の実行は再開対象外
- **CHANGE_URLアクション必須**: 進捗保存にはCHANGE_URLアクションが必要
- **WebsiteId一致**: 同一WebsiteId設定のみ再開可能

## データ同期機能

自動化変数（AutomationVariables）を外部ストレージと同期できます。

### 対応同期方法
- **CSV同期**: ローカルファイルシステムとのインポート/エクスポート
- **外部API同期**: Notion、Google Sheets、カスタムAPI等との連携

### 主な機能
- **同期設定管理**: 同期方法、タイミング、方向、競合解決ポリシーの設定
- **定期同期**: 指定間隔での自動同期（最小60秒）
- **同期履歴**: 実行日時、成功/失敗、データ数の記録
- **文字コード対応**: UTF-8、Shift-JIS、EUC-JP

詳細な設定例は [API Configuration Examples](docs/user-guides/データ同期/API_CONFIGURATION_EXAMPLES.md) を参照してください。

## セキュリティ

### 🔒 暗号化とデータ保護
- **マスターパスワード暗号化**: AES-256-GCM暗号化
- **パスワードハッシュ化**: SHA-256ハッシュと一意のソルト
- **自動ロック**: 非アクティブ時の自動ロック
- **セキュリティイベントログ**: 7種類のセキュリティイベント追跡

### 🛡️ セキュリティ機能
- **パスワード強度メーター**: Shannon エントロピー計算
- **ロックアウト保護**: 5回の認証失敗後、5分間のロックアウト
- **オプショナルパーミッション**: 必要な権限のみをユーザーが制御
- **依存関係監視**: Dependabotによる自動脆弱性スキャン

### 📦 Vendorライブラリ管理
外部CDNを使用せず、すべてのJavaScriptライブラリをローカル管理：

```bash
npm run vendor:check    # バージョン確認
npm run vendor:update   # 最新版に更新
```

詳細なセキュリティポリシーは [セキュリティポリシー](docs/SECURITY_POLICY.md) を参照してください。

## 開発コマンド

### ビルド
```bash
npm run build           # プロダクションビルド
npm run build:dev       # 開発ビルド
npm run dev             # 開発ビルド（ウォッチモード）
npm run clean           # ビルド成果物のクリーンアップ
```

### テスト
```bash
npm test                # 通常のテスト実行
npm run test:watch      # ウォッチモード
npm run test:coverage   # カバレッジ付きテスト
npm run test:ci         # CI用テスト
```

### コード品質
```bash
npm run lint            # Lintチェック
npm run lint:fix        # Lint自動修正
npm run format          # Prettierフォーマット適用
npm run type-check      # 型チェック
npm run quality         # 品質チェック（lint + format + type-check）
npm run validate        # ローカル検証（quality + test）
npm run ci              # CI完全検証（quality + test + build）
```

### エラーコード管理
```bash
npm run error:list              # エラーコード一覧表示
npm run error:reserve <category> # 新しいエラーコードを予約
npm run error:validate          # エラーコードの整合性チェック
```

### セキュリティ
```bash
npm run security:audit   # 脆弱性スキャン
npm run security:fix     # 脆弱性の自動修正
```

## アーキテクチャ詳細

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

### プロジェクト構成
```
src/
├── domain/                    # ドメイン層（ビジネスロジック）
│   ├── entities/              # エンティティ（14個）
│   ├── repositories/          # リポジトリインターフェース
│   ├── services/              # サービスインターフェース
│   └── types/                 # 型定義
├── usecases/                  # ユースケース層（50以上）
│   ├── websites/              # Website管理（7ユースケース）
│   ├── xpaths/                # XPath管理（12ユースケース）
│   ├── automation-variables/  # 自動化変数管理（8ユースケース）
│   ├── sync/                  # データ同期（8ユースケース）
│   └── recording/             # タブ録画管理（5ユースケース）
├── infrastructure/            # インフラ層（外部システム連携）
│   ├── repositories/          # データ永続化（Chrome Storage, IndexedDB）
│   ├── adapters/              # Chrome API アダプター
│   ├── services/              # サービス実装
│   └── auto-fill/             # 自動入力アクション実行
└── presentation/              # プレゼンテーション層（UI）
    ├── background/            # バックグラウンドスクリプト
    ├── popup/                 # ポップアップUI
    ├── xpath-manager/         # XPath管理画面（Presenter Pattern）
    └── content-script/        # コンテンツスクリプト
```

## 新規Entity追加実装ルール

新しいEntityを追加する際は、以下の順序で実装してください：

1. **Domain Entity作成**
2. **DTO作成（Input/Output）**
3. **Mapper作成**
4. **Repository Interface作成**
5. **UseCase作成**
6. **Repository実装作成**
7. **テスト作成**

### 必須ルール
- **依存方向**: Domain ← Application ← Infrastructure ← Presentation
- **DTO使用**: EntityをPresentation層に直接渡すことは禁止
- **Mapper責務**: Entity ↔ DTO変換のみ（ビジネスロジック禁止）
- **テスト作成**: 各層で90%以上のカバレッジ維持

詳細な実装手順は [新規Entity追加実装ルール](#新規entity追加実装ルール) を参照してください。

## 技術スタック

### 言語・フレームワーク
- **TypeScript 5.4.5**: 型安全性の確保
- **Chrome Extension Manifest V3**: 最新のChrome拡張機能API
- **Webpack 5.91.0**: モジュールバンドラー

### テスト
- **Jest 29.7.0**: ユニットテストフレームワーク
- **5114テストケース**: 高いテストカバレッジ（229テストスイート）
- **カバレッジ**: Statements 96%以上、Branches 89%以上

### コード品質
- **ESLint 8.57.0**: 静的解析（複雑度ルール含む）
- **Prettier 3.6.2**: コードフォーマッター
- **Husky + lint-staged**: Git hooks による自動チェック

### ストレージ・セキュリティ
- **Chrome Storage API**: 設定データの永続化
- **IndexedDB**: 大容量データ（録画ファイル等）の保存
- **AES-256-GCM**: データ暗号化
- **SHA-256**: パスワードハッシュ化

### 外部連携
- **MCP (Model Context Protocol)**: 外部システム連携
- **Chrome API**: タブ操作、通知、コンテキストメニュー
- **REST API**: Notion、Google Sheets等との連携

## テスト

全5114テストケース（229テストスイート）が実装されています。

```bash
npm test
```

**テストカバレッジ:**
- **Statements**: 96.14%
- **Branches**: 89.89%
- **Functions**: 96.77%
- **Lines**: 96.17%

**レイヤー別カバレッジ:**
- Domain層: ~98%
- UseCase層: ~96%
- Infrastructure層: ~95%
- Presentation層: ~92%

## パフォーマンス最適化

### Task 3: Chrome Storage Batch Loading (v3.2.0)

プロジェクトのパフォーマンスを大幅に改善する3つの最適化を実装：

1. **Bidirectional Sync Parallelization**: 双方向同期の並列実行（50%高速化）
2. **Repository Optimization**: 必要なデータのみロード（85-90%高速化）
3. **Chrome Storage Batch Loading**: バッチ操作によるAPIコール削減（67%削減）

詳細なパフォーマンスレポート: [Task 3 Performance Optimization Report](docs/TASK_3_PERFORMANCE_OPTIMIZATION_REPORT.md)

## 更新履歴

### v3.2.0 (2025-10-23) - パフォーマンス最適化完了
- Chrome Storage Batch Loading実装
- APIコール数67%削減、~100ms読み込み時間短縮
- 全5473テスト合格（100%）

### v3.1.0 (2025-10-18) - 画面遷移対応機能
- 複数ページフォーム入力の自動継続・再開
- 24時間以内の中断復旧機能
- 進捗状況の可視化

### v3.0.0 (2025-10-17) - UI/UX大幅改善
- 統一デザインシステム導入
- 設定の一元化（Single Source of Truth）
- 全画面レスポンシブ対応

### v2.7.0 (2025-01-16) - 同期管理テスト実装完了
- 8つのUse Caseに対する包括的テスト
- テストケース大幅増加（2893→3050）

詳細な更新履歴は [CHANGELOG.md](CHANGELOG.md) を参照してください。

## ライセンス

MIT License

## 注意事項

⚠️ この拡張機能は自己責任で使用してください。

⚠️ 対象サイトの利用規約を必ず確認してください。

⚠️ サーバーへの過度な負荷をかけないよう、適切な待機時間を設定してください。

⚠️ サイトの構造が変更された場合、XPath設定の更新が必要になる場合があります。

## サポート・コミュニティ

- **Issues**: [GitHub Issues](https://github.com/your-repo/auto-fill-tool/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/auto-fill-tool/discussions)
- **Security**: [セキュリティポリシー](docs/SECURITY_POLICY.md)
- **Contributing**: [コントリビューションガイド](CONTRIBUTING.md)
