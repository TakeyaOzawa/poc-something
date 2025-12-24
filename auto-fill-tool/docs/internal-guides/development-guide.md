# 開発者ガイド

## 概要

このガイドは、Auto-Fill Tool プロジェクトの新規開発者向けの包括的なドキュメントです。プロジェクトの構造、開発プロセス、ベストプラクティスについて説明します。

---

## 🚀 クイックスタート

### 前提条件

- Node.js 18以上
- npm 8以上
- Chrome ブラウザ
- TypeScript の基本知識
- Git

### セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd auto-fill-tool

# 依存関係のインストール
npm install

# 開発ビルド
npm run build

# テストの実行
npm test

# Lintの実行
npm run lint
```

### Chrome Extension の読み込み

1. Chrome で `chrome://extensions/` を開く
2. 「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. プロジェクトの `dist` フォルダを選択

---

## 📁 プロジェクト構造

```
src/
├── domain/              # ドメイン層（ビジネスロジック）
│   ├── entities/        # エンティティ
│   ├── values/          # 値オブジェクト
│   ├── services/        # ドメインサービス
│   ├── repositories/    # リポジトリインターフェース
│   ├── ports/           # ポート（外部システムとのインターフェース）
│   ├── events/          # ドメインイベント
│   ├── constants/       # 定数
│   └── types/           # 型定義
├── application/         # アプリケーション層（ユースケース）
│   ├── usecases/        # ユースケース実装
│   ├── dtos/            # データ転送オブジェクト
│   └── mappers/         # マッパー
├── infrastructure/     # インフラストラクチャ層（技術的実装）
│   ├── adapters/        # アダプター（ポート実装）
│   ├── repositories/    # リポジトリ実装
│   ├── di/              # 依存性注入
│   ├── messaging/       # メッセージング
│   └── services/        # インフラサービス
└── presentation/        # プレゼンテーション層（UI）
    ├── popup/           # ポップアップUI
    ├── content-script/  # コンテンツスクリプト
    ├── background/      # バックグラウンドスクリプト
    ├── components/      # UIコンポーネント
    ├── stores/          # 状態管理
    └── types/           # プレゼンテーション型
```

---

## 🏗️ アーキテクチャ

### Clean Architecture

プロジェクトは Clean Architecture パターンを採用しています：

1. **Domain Layer**: ビジネスロジックとルール
2. **Application Layer**: ユースケースとアプリケーション固有のロジック
3. **Infrastructure Layer**: 外部システムとの統合
4. **Presentation Layer**: ユーザーインターフェース

### 依存関係のルール

- 依存関係は内向き（ドメインに向かって）のみ
- 外側の層は内側の層に依存できるが、逆は不可
- ドメイン層は他の層に依存しない

### 主要パターン

- **Repository Pattern**: データアクセスの抽象化
- **Port-Adapter Pattern**: 外部システムとの分離
- **Result Pattern**: エラーハンドリング
- **Value Objects**: ドメインプリミティブの型安全性

---

## 🛠️ 開発ワークフロー

### 新機能の追加

#### 1. ドメインモデルの設計

```typescript
// 1. Value Object の作成（必要に応じて）
export class FeatureId {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<FeatureId, Error> {
    if (!value || value.trim().length === 0) {
      return Result.failure(new Error('FeatureId cannot be empty'));
    }
    return Result.success(new FeatureId(value.trim()));
  }

  getValue(): string {
    return this.value;
  }
}

// 2. Entity の作成
export class Feature {
  constructor(
    private readonly id: FeatureId,
    private readonly name: string,
    private readonly enabled: boolean
  ) {}

  static create(data: FeatureData): Result<Feature, Error> {
    const idResult = FeatureId.create(data.id);
    if (idResult.isFailure) {
      return Result.failure(idResult.error!);
    }

    return Result.success(new Feature(idResult.value!, data.name, data.enabled));
  }

  // ビジネスメソッド
  enable(): Feature {
    return new Feature(this.id, this.name, true);
  }
}
```

#### 2. Repository Interface の定義

```typescript
// domain/repositories/FeatureRepository.ts
export interface FeatureRepository {
  findById(id: FeatureId): Promise<Result<Feature | null, Error>>;
  save(feature: Feature): Promise<Result<void, Error>>;
  findAll(): Promise<Result<Feature[], Error>>;
}
```

#### 3. Use Case の実装

```typescript
// application/usecases/features/EnableFeatureUseCase.ts
export interface EnableFeatureInput {
  featureId: string;
}

export interface EnableFeatureOutput {
  id: string;
  name: string;
  enabled: boolean;
}

export class EnableFeatureUseCase {
  constructor(private featureRepository: FeatureRepository) {}

  async execute(input: EnableFeatureInput): Promise<Result<EnableFeatureOutput, Error>> {
    const featureIdResult = FeatureId.create(input.featureId);
    if (featureIdResult.isFailure) {
      return Result.failure(featureIdResult.error!);
    }

    const featureResult = await this.featureRepository.findById(featureIdResult.value!);
    if (featureResult.isFailure) {
      return Result.failure(featureResult.error!);
    }

    if (!featureResult.value) {
      return Result.failure(new Error('Feature not found'));
    }

    const enabledFeature = featureResult.value.enable();

    const saveResult = await this.featureRepository.save(enabledFeature);
    if (saveResult.isFailure) {
      return Result.failure(saveResult.error!);
    }

    return Result.success({
      id: enabledFeature.getId().getValue(),
      name: enabledFeature.getName(),
      enabled: enabledFeature.isEnabled(),
    });
  }
}
```

---

## 🧪 テスト戦略

### テストピラミッド

1. **Unit Tests** (多数): 個別のクラス/関数
2. **Integration Tests** (中程度): 複数コンポーネントの連携
3. **E2E Tests** (少数): エンドツーエンドのシナリオ
4. **Architecture Tests**: アーキテクチャルールの検証

### テストの書き方

```typescript
// Unit Test
describe('Feature', () => {
  it('should enable feature', () => {
    const feature = Feature.create({
      id: 'feature-1',
      name: 'Test',
      enabled: false,
    }).value!;

    const enabled = feature.enable();

    expect(enabled.isEnabled()).toBe(true);
  });
});
```

---

## 📋 コーディング規約

### 命名規則

- **Classes**: PascalCase (`UserService`)
- **Interfaces**: PascalCase (`UserRepository`)
- **Variables/Functions**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Files**: kebab-case (`user-service.ts`)

### TypeScript

- 厳密な型チェックを使用
- `any` 型の使用を避ける
- インターフェースを優先
- 明示的な戻り値の型を指定

---

## 🔧 ツールとコマンド

```bash
# 開発ビルド（ウォッチモード）
npm run dev

# プロダクションビルド
npm run build

# テスト実行
npm test

# テスト（ウォッチモード）
npm run test:watch

# カバレッジ付きテスト
npm run test:coverage

# Lint実行
npm run lint

# Lint修正
npm run lint:fix

# 型チェック
npm run type-check
```

---

## 📚 学習リソース

### 必読書籍

- Clean Architecture (Robert C. Martin)
- Domain-Driven Design (Eric Evans)
- Refactoring (Martin Fowler)

### プロジェクト内ドキュメント

- [アーキテクチャ解析レポート](./architecture-analysis.md)
- [ドメインモデル](./domain-model.md)
- [エラーハンドリング戦略](./error-handling-strategy.md)
- [ADR (Architecture Decision Records)](./adr/)
- [アーキテクチャ図](./architecture-diagrams.md)

---

## 🤝 コントリビューション

### プルリクエストの流れ

1. Issue の作成（機能要求・バグ報告）
2. ブランチの作成（`feature/issue-number` または `fix/issue-number`）
3. 実装とテストの追加
4. コミットメッセージの規約に従う
5. プルリクエストの作成
6. コードレビュー
7. マージ

### コミットメッセージ規約

```
type(scope): description

feat(domain): add new feature entity
fix(infrastructure): resolve storage issue
docs(readme): update installation guide
test(application): add use case tests
refactor(presentation): improve presenter structure
```

---

最終更新日: 2024年11月22日
