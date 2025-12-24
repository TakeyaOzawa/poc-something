---
inclusion: always
---

# プロジェクト構造

## 📁 ディレクトリ構成

### Clean Architecture レイヤー構造

```
src/
├── domain/                           # Domain層（最も内側）
│   ├── types/                        # Domain層の型をすべてここに集約
│   │   ├── index.ts                  # Domain層の型を集約エクスポート
│   │   ├── user.types.ts             # ユーザー関連の型
│   │   ├── product.types.ts          # プロダクト関連の型
│   │   └── common.types.ts           # Domain層の共通型（Result, Option など）
│   ├── entities/                     # エンティティ（ビジネスオブジェクト）
│   ├── values/                       # 値オブジェクト
│   ├── services/                     # ドメインサービス
│   ├── repositories/                 # リポジトリインターフェース
│   ├── ports/                        # ポートインターフェース
│   └── events/                       # ドメインイベント
│
├── application/                      # Application層（UseCase層）
│   ├── types/                        # Application層の共有型
│   │   ├── index.ts                  # Application層の型を集約エクスポート
│   │   └── common.types.ts           # Application層の共通型
│   ├── usecases/                     # ユースケース実装
│   ├── dtos/                         # Data Transfer Objects
│   └── mappers/                      # DTOとエンティティ間のマッピング
│
├── infrastructure/                   # Infrastructure層
│   ├── types/                        # Infrastructure層の型をすべてここに集約
│   │   ├── index.ts                  # Infrastructure層の型を集約エクスポート
│   │   ├── api.types.ts              # API関連の型
│   │   ├── storage.types.ts          # ストレージ関連の型
│   │   └── dto.types.ts              # Data Transfer Objects
│   ├── adapters/                     # 外部システムアダプター
│   ├── repositories/                 # リポジトリ実装
│   ├── services/                     # 外部サービス連携
│   └── di/                           # 依存性注入設定
│
└── presentation/                     # Presentation層（最も外側）
    ├── types/                        # Presentation層の型をすべてここに集約
    │   ├── index.ts                  # Presentation層の型を集約エクスポート
    │   ├── component.types.ts        # コンポーネント共通の型
    │   └── event.types.ts            # イベント関連の型
    ├── components/                   # UIコンポーネント
    ├── stores/                       # 状態管理
    └── mappers/                      # プレゼンテーション層のマッピング
```

## 📝 ファイル命名規則

### TypeScript実装ファイル

#### PascalCase (アッパーキャメル) を使用
- **クラス定義**: `UserService.ts`, `DatabaseConnection.ts`
- **エンティティ**: `User.ts`, `Product.ts`
- **値オブジェクト**: `Email.ts`, `Money.ts`
- **アダプター**: `HttpClient.ts`, `DatabaseAdapter.ts`
- **リポジトリ**: `UserRepository.ts`, `ProductRepository.ts`

#### kebab-case (小文字+ハイフン) を使用
- **型定義ファイル**: `user.types.ts`, `api-response.types.ts`
- **ユーティリティ関数**: `string-utils.ts`, `date-helper.ts`
- **設定ファイル**: `api-config.ts`, `database-config.ts`

### 型定義・インターフェース

#### ファイル名パターン
1. **[機能名].types.ts** - 特定機能の型定義
2. **types.ts** - 共通型定義
3. **index.ts** - 型の集約エクスポート（必須）

#### 型名の命名規則
- **PascalCase使用**: `UserProfile`, `ApiResponse`
- **プレフィックス`I`は非推奨**: `User` (○) vs `IUser` (×)
- **具体的で説明的な名前**: `UserData` (○) vs `Data` (×)

## 🏗️ アーキテクチャ決定

### 依存関係の方向

**重要**: 依存関係は内側に向かってのみ流れる

```
presentation → application → domain
infrastructure → domain
```

### レイヤー別制約

#### Domain層（ドメイン層）
- **役割**: ビジネスロジックとルールの中核
- **許可される依存**: なし（完全に独立）
- **禁止事項**:
  - 外部ライブラリの直接インポート
  - 他レイヤーからのインポート
  - フレームワーク固有のコード

#### Application層（アプリケーション層）
- **役割**: ユースケースの実装、ドメインオブジェクトの調整
- **許可される依存**: Domain層のみ
- **禁止事項**:
  - Infrastructure層からの直接インポート
  - Presentation層からの直接インポート

#### Infrastructure層（インフラストラクチャ層）
- **役割**: 外部システムとの接続、技術的実装
- **許可される依存**: Domain層のポートインターフェース
- **命名規則**: 
  - クラス名は `Adapter`, `Repository`, `Factory`, `Mapper`, `Decorator` で終わる
  - `Service` は使用禁止（Adapterパターンを使用）

#### Presentation層（プレゼンテーション層）
- **役割**: UI、コントローラー、外部インターフェース
- **許可される依存**: Application層、Domain層
- **禁止事項**: Infrastructure層への直接依存

## 📦 インポートパターン

### パスマッピング設定

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"],
      "@domain/*": ["src/domain/*"],
      "@application/*": ["src/application/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@presentation/*": ["src/presentation/*"],
      "@usecases/*": ["src/application/usecases/*"],
      "@tests/*": ["tests/*"]
    }
  }
}
```

### 推奨インポートパターン

```typescript
// ✅ 良い例: 各レイヤーのtypes/index.tsからインポート
import { User, Product, Result } from '@domain/types';
import { CreateUserInput, UpdateUserInput } from '@application/types';
import { ApiUserResponse, StorageConfig } from '@infrastructure/types';
import { UserComponentProps, UserEventHandler } from '@presentation/types';

// ❌ 悪い例: 個別の型ファイルから直接インポート（保守性が低い）
import { User } from '@domain/types/user.types';
import { Product } from '@domain/types/product.types';
```

## 🧪 テスト構造

### テストファイル配置

```
src/
├── domain/entities/MyEntity.ts
│   └── __tests__/MyEntity.test.ts
├── application/usecases/MyUseCase.ts
│   └── __tests__/MyUseCase.test.ts
├── infrastructure/services/MyService.ts
│   └── __tests__/MyService.test.ts
```

### テスト命名規則

- **テストファイル**: `[ClassName].test.ts`
- **テストスイート**: `describe('[ClassName]', () => {})`
- **テストケース**: `it('should [expected behavior]', () => {})`

## 📋 コード組織化ルール

### Entity実装順序（必須）

新しいEntityを追加する際は、以下の順序で実装：

1. **Domain Entity作成**
2. **DTO作成（Input/Output）**
3. **Mapper作成**
4. **Repository Interface作成**
5. **UseCase作成**
6. **Repository実装作成**
7. **テスト作成**

### 実装ルール

#### ✅ 必須ルール
1. **依存方向**: Domain ← Application ← Infrastructure ← Presentation
2. **DTO使用**: EntityをPresentation層に直接渡すことは禁止
3. **Mapper責務**: Entity ↔ DTO変換のみ（ビジネスロジック禁止）
4. **テスト作成**: 各層で90%以上のカバレッジ維持

#### ✅ 命名規則
```typescript
// Entity
NewEntity.ts

// DTO
NewEntityInputDto.ts
NewEntityOutputDto.ts

// Mapper
NewEntityMapper.ts

// Repository
NewEntityRepository.ts (interface)
ChromeStorageNewEntityRepository.ts (implementation)

// UseCase
CreateNewEntityUseCase.ts
UpdateNewEntityUseCase.ts
GetNewEntityUseCase.ts
DeleteNewEntityUseCase.ts
```

## 🔧 設定ファイル構造

### TypeScript設定

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### ESLint設定

```javascript
// .eslintrc.js
{
  "rules": {
    "complexity": ["error", 10],
    "max-depth": ["error", 4],
    "max-lines-per-function": ["error", {"max": 50}],
    "max-params": ["error", 4]
  }
}
```

## 📊 品質メトリクス

### コード品質基準

| メトリクス | 目標値 | 測定方法 |
|-----------|--------|----------|
| テストカバレッジ | 90%以上 | `npm run test:coverage` |
| 複雑度 | 10以下 | ESLint complexity rule |
| 関数の長さ | 50行以下 | ESLint max-lines-per-function |
| ネストの深さ | 4レベル以下 | ESLint max-depth |
| パラメータ数 | 4個以下 | ESLint max-params |

### 品質チェックコマンド

```bash
# 全体的な品質チェック
npm run hooks:quality-gate

# テストカバレッジ確認
npm run test:coverage

# 複雑度チェック
npm run complexity

# 循環依存チェック
npm run analyze:circular
```

## 🚀 ビルド・デプロイ構造

### Webpack設定

```javascript
// webpack.config.js
module.exports = {
  entry: {
    background: './src/presentation/background/index.ts',
    popup: './src/presentation/popup/index.ts',
    'content-script': './src/presentation/content-script/index.ts',
    'xpath-manager': './src/presentation/xpath-manager/index.ts'
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxSize: 572000 // 95%削減後のサイズ
    }
  }
};
```

### 成果物構造

```
dist/
├── manifest.json
├── background.js
├── popup.js
├── content-script.js
├── xpath-manager.js
├── styles/
│   └── common.css
├── vendor/
│   ├── alpinejs/
│   └── chartjs/
└── _locales/
    ├── en/
    └── ja/
```

## 📝 ドキュメント構造

### プロジェクトドキュメント

```
docs/
├── user-guides/              # ユーザーガイド
├── developer-guides/         # 開発者ガイド
├── api/                      # API仕様
├── architecture/             # アーキテクチャ設計
└── security/                 # セキュリティ関連
```

### コードドキュメント

- **JSDoc**: 関数・クラスの詳細説明
- **README.md**: プロジェクト概要
- **CHANGELOG.md**: 変更履歴
- **ADR**: アーキテクチャ決定記録

## 🔄 開発ワークフロー

### ブランチ戦略

- **main**: 本番リリース用
- **develop**: 開発統合用
- **feature/***: 機能開発用
- **hotfix/***: 緊急修正用

### コミット規約

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type一覧**:
- `feat`: 新機能
- `fix`: バグ修正
- `refactor`: リファクタリング
- `test`: テスト追加/修正
- `docs`: ドキュメント
- `style`: コードスタイル
- `perf`: パフォーマンス改善
- `chore`: その他

## 🤖 Agent Hooks統合

### 自動化ワークフロー

プロジェクトには以下のAgent Hooksが設定されており、開発プロセスを自動化します：

#### 自動トリガーHooks

1. **新セッション開始時** (`onNewSession`)
   - プロジェクト概要の表示
   - 重要ポイントの確認
   - よく使うコマンドの提示
   - Slack通知送信

2. **ファイル保存時** (`onFileSave`)
   - 対象: `**/*.ts`（テストファイル除く）
   - 関連テストの自動実行
   - Lintチェックの自動実行

3. **実行完了時** (`onExecutionComplete`)
   - 実装完了後の品質保証プロセス開始
   - Slack通知送信

4. **メッセージ送信時** (`onMessageSent`)
   - ユーザーへの質問前にSlack通知
   - 条件: 「選択してください」「確認してください」等を含む

#### 手動トリガーHooks

1. **📊 カバレッジチェック & テスト強化**
   - カバレッジ測定（`npm run test:coverage`）
   - 90%未満のファイルに対するテスト追加ガイド
   - テストケース作成支援

2. **✅ 品質ゲート実行**
   - 6ステップ品質保証プロセスの完全実行
   - カバレッジ → テスト → Lint → ビルドの順次実行
   - 各ステップの結果確認

3. **🌍 多言語リソース更新**
   - 新機能の多言語対応確認
   - `messages.json`の更新ガイド
   - メッセージキー命名規則の提示

4. **🚨 エラーハンドリング強化**
   - エラーコード一覧表示（`npm run error:list`）
   - StandardError使用ガイド
   - 新エラーコード予約支援

### Hook設定ファイル

```
.kiro/hooks/
├── new-session-setup.json          # 新セッション開始時
├── on-file-save.json               # ファイル保存時
├── on-execution-complete.json      # 実行完了時
├── on-message-sent.json            # メッセージ送信時
├── coverage-enforcement.json       # カバレッジ強制
├── quality-gate-check.json         # 品質ゲート
├── i18n-resource-update.json       # 多言語リソース
├── error-handling-check.json       # エラーハンドリング
├── pre-commit-review.json          # コミット前レビュー
└── git-commit-quality.json         # コミット品質チェック
```

### Gitワークフロー統合Hooks

#### コミット前品質保証
- **pre-commit-review.json**: 大量変更時の自動レビュー
  - デバッグコード検出
  - 機密情報混入チェック
  - 不要ファイル検出
  - 空白変更問題の検出

- **git-commit-quality.json**: アーキテクチャ・品質チェック
  - アーキテクチャ準拠確認
  - 変更ファイルのテスト実行
  - Lintチェック
  - 型チェック
  - 循環依存チェック

### 推奨Gitワークフロー

```bash
# 1. 変更をステージング
git add .

# 2. Kiroでコミット前チェック実行
# → 🔍 コミット前レビュー実行
# → 📝 コミット品質チェック

# 3. 問題なければコミット
git commit -m "feat(domain): 新機能を追加"
```

### Slack通知統合

すべてのHooksはSlack通知と統合されており、以下の形式で通知を送信します：

```bash
bash slackNotification.sh "[$]タスク名" "詳細メッセージ"
```

**環境変数設定**:
```bash
export MY_SLACK_OAUTH_TOKEN='xoxb-your-bot-token'
export MY_SLACK_USER_ID='U1234567890'
```
