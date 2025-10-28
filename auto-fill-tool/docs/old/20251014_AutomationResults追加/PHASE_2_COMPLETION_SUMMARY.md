# Phase 2 完了報告: Use Cases 実装

## 実施日時
2025-10-15

## 概要

Phase 2 では、AutomationVariables と AutomationResult の管理に必要な Use Cases を実装しました。これにより、データ層（Phase 1）とプレゼンテーション層（Phase 3）の橋渡しが完成しました。

## 完了したタスク

### 新規作成した Use Cases

#### AutomationVariables 関連

**1. GetAutomationVariablesByIdUseCase** ✅
- **機能:** ID による AutomationVariables の取得
- **用途:** 特定の変数セットを ID で直接取得（編集・表示用）
- **テスト:** 2 tests passing

**2. DeleteAutomationVariablesUseCase** ✅
- **機能:** AutomationVariables と関連する実行結果の削除
- **特徴:** カスケード削除により関連データの整合性を保つ
- **用途:** 不要な変数セットの削除
- **テスト:** 2 tests passing

**3. DuplicateAutomationVariablesUseCase** ✅
- **機能:** 既存の AutomationVariables の複製
- **特徴:**
  - 新しい UUID を自動生成
  - 同じ websiteId を保持
  - すべての variables をコピー
  - status も保持
- **用途:** 類似の設定を簡単に作成
- **テスト:** 4 tests passing

#### AutomationResult 関連

**4. SaveAutomationResultUseCase** ✅
- **機能:** 実行結果の保存
- **用途:** 自動入力の実行履歴を記録
- **テスト:** 2 tests passing

**5. GetLatestAutomationResultUseCase** ✅
- **機能:** 特定の AutomationVariables の最新実行結果を取得
- **用途:** 管理画面での最新ステータス表示
- **テスト:** 2 tests passing

**6. GetAutomationResultHistoryUseCase** ✅
- **機能:** 特定の AutomationVariables の全実行履歴を取得
- **特徴:** 日時降順（最新が先）でソート済み
- **用途:** 実行履歴の一覧表示
- **テスト:** 3 tests passing

### 既存の Use Cases（確認済み）

以下の Use Cases はすでに存在し、新しいリポジトリ構造に対応しています：

- ✅ GetAllAutomationVariablesUseCase
- ✅ GetAutomationVariablesByWebsiteIdUseCase
- ✅ SaveAutomationVariablesUseCase
- ✅ ExportAutomationVariablesUseCase
- ✅ ImportAutomationVariablesUseCase

## ファイル構成

### 実装ファイル

```
src/usecases/
├── GetAutomationVariablesByIdUseCase.ts
├── DeleteAutomationVariablesUseCase.ts
├── DuplicateAutomationVariablesUseCase.ts
├── SaveAutomationResultUseCase.ts
├── GetLatestAutomationResultUseCase.ts
└── GetAutomationResultHistoryUseCase.ts
```

### テストファイル

```
src/usecases/__tests__/
├── GetAutomationVariablesByIdUseCase.test.ts
├── DeleteAutomationVariablesUseCase.test.ts
├── DuplicateAutomationVariablesUseCase.test.ts
├── SaveAutomationResultUseCase.test.ts
├── GetLatestAutomationResultUseCase.test.ts
└── GetAutomationResultHistoryUseCase.test.ts
```

## テスト統計

| UseCase | テスト数 | 状態 |
|---------|---------|------|
| GetAutomationVariablesByIdUseCase | 2 | ✅ Pass |
| DeleteAutomationVariablesUseCase | 2 | ✅ Pass |
| DuplicateAutomationVariablesUseCase | 4 | ✅ Pass |
| SaveAutomationResultUseCase | 2 | ✅ Pass |
| GetLatestAutomationResultUseCase | 2 | ✅ Pass |
| GetAutomationResultHistoryUseCase | 3 | ✅ Pass |
| **合計** | **15** | **✅ All Pass** |

## Use Case 依存関係図

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│                  (Phase 3 で実装予定)                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Use Cases Layer                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  AutomationVariables 管理:                               │
│  ├─ GetAllAutomationVariablesUseCase                    │
│  ├─ GetAutomationVariablesByIdUseCase          [NEW]    │
│  ├─ GetAutomationVariablesByWebsiteIdUseCase            │
│  ├─ SaveAutomationVariablesUseCase                      │
│  ├─ DeleteAutomationVariablesUseCase           [NEW]    │
│  │  └─ 関連 AutomationResult も削除                      │
│  ├─ DuplicateAutomationVariablesUseCase        [NEW]    │
│  ├─ ExportAutomationVariablesUseCase                    │
│  └─ ImportAutomationVariablesUseCase                    │
│                                                          │
│  AutomationResult 管理:                                  │
│  ├─ SaveAutomationResultUseCase                [NEW]    │
│  ├─ GetLatestAutomationResultUseCase           [NEW]    │
│  └─ GetAutomationResultHistoryUseCase          [NEW]    │
│                                                          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 Domain & Infrastructure                  │
│                    (Phase 1 で実装済み)                   │
├─────────────────────────────────────────────────────────┤
│  Repositories:                                           │
│  ├─ IAutomationVariablesRepository                      │
│  │  └─ ChromeStorageAutomationVariablesRepository      │
│  └─ IAutomationResultRepository                         │
│     └─ ChromeStorageAutomationResultRepository          │
│                                                          │
│  Entities:                                               │
│  ├─ AutomationVariables                                 │
│  └─ AutomationResult                                    │
└─────────────────────────────────────────────────────────┘
```

## 実装パターン

### シンプルなラッパー型

リポジトリのメソッドをそのまま呼び出すタイプ：

```typescript
export class GetAutomationVariablesByIdUseCase {
  constructor(private repository: IAutomationVariablesRepository) {}

  async execute(id: string): Promise<AutomationVariables | null> {
    return await this.repository.load(id);
  }
}
```

**適用した UseCase:**
- GetAutomationVariablesByIdUseCase
- SaveAutomationResultUseCase
- GetLatestAutomationResultUseCase
- GetAutomationResultHistoryUseCase

### 複数リポジトリ連携型

複数のリポジトリを使用して関連データを処理するタイプ：

```typescript
export class DeleteAutomationVariablesUseCase {
  constructor(
    private variablesRepository: IAutomationVariablesRepository,
    private resultRepository: IAutomationResultRepository
  ) {}

  async execute(id: string): Promise<void> {
    await this.variablesRepository.delete(id);
    await this.resultRepository.deleteByAutomationVariablesId(id);
  }
}
```

**適用した UseCase:**
- DeleteAutomationVariablesUseCase（カスケード削除）

### データ変換型

エンティティを作成・変換してから保存するタイプ：

```typescript
export class DuplicateAutomationVariablesUseCase {
  constructor(private repository: IAutomationVariablesRepository) {}

  async execute(id: string): Promise<AutomationVariables | null> {
    const original = await this.repository.load(id);
    if (!original) return null;

    const duplicate = AutomationVariables.create({
      websiteId: original.getWebsiteId(),
      variables: { ...original.getVariables() },
      status: original.getStatus(),
    });

    await this.repository.save(duplicate);
    return duplicate;
  }
}
```

**適用した UseCase:**
- DuplicateAutomationVariablesUseCase

## テストパターン

### 基本パターン

```typescript
describe('UseCase', () => {
  let useCase: UseCase;
  let mockRepository: jest.Mocked<IRepository>;

  beforeEach(() => {
    mockRepository = {
      method1: jest.fn(),
      method2: jest.fn(),
    };
    useCase = new UseCase(mockRepository);
  });

  it('should perform expected operation', async () => {
    // Arrange
    mockRepository.method.mockResolvedValue(expectedValue);

    // Act
    const result = await useCase.execute(params);

    // Assert
    expect(result).toBe(expectedValue);
    expect(mockRepository.method).toHaveBeenCalledWith(params);
  });
});
```

### カバーしたテストケース

各 UseCase で以下のケースをテスト：

1. **正常系:** 期待通りの動作を確認
2. **異常系:** データが見つからない場合の処理
3. **エッジケース:** 特殊なデータ構造や状態
4. **依存関係:** 複数リポジトリの呼び出し順序

## 設計上の決定事項

### 1. カスケード削除の実装

**決定:** DeleteAutomationVariablesUseCase で AutomationResult も削除

**理由:**
- データの整合性を保つ
- 孤児レコードを防ぐ
- ストレージの無駄遣いを防ぐ

**代替案（却下）:**
- 削除フラグのみ設定 → 実装が複雑化
- 手動削除 → ユーザー体験が悪い

### 2. 複製時の ID 生成

**決定:** DuplicateAutomationVariablesUseCase で新しい UUID を自動生成

**理由:**
- 各レコードの一意性を保証
- 既存データとの衝突を防ぐ
- トレーサビリティの向上

### 3. 実行履歴のソート

**決定:** GetAutomationResultHistoryUseCase はリポジトリでソート済みのデータを返す

**理由:**
- UseCase をシンプルに保つ
- リポジトリ層でのパフォーマンス最適化が可能
- 一貫したソート順を保証

## Phase 2 で得られた知見

### 1. UseCase の粒度

- **良い例:** 単一責任の原則に従った小さな UseCase
- **悪い例:** 複数の操作を1つの UseCase に詰め込む

### 2. テストの重要性

- モックを使用したテストにより、依存関係の影響を排除
- 各 UseCase が独立してテスト可能

### 3. リポジトリインターフェースの価値

- UseCase がリポジトリの実装詳細に依存しない
- テストが書きやすい
- 将来的な実装変更が容易

## 次のステップ（Phase 3）

### Presenter 層の実装

Phase 3 では以下を実装します：

1. **AutomationVariablesManagerPresenter**
   - View インターフェースの定義
   - UseCase の統合
   - ビジネスロジックの調整

2. **ViewModel の設計**
   - 表示用のデータ構造
   - エンティティから ViewModel への変換

3. **イベントハンドリング**
   - ユーザーアクションの処理
   - UseCase の呼び出し
   - View の更新

### 推定工数

- Presenter 実装: 0.5日
- ViewModel & 変換ロジック: 0.3日
- テスト: 0.2日

**合計: 約1日**

## まとめ

Phase 2 は計画通りに完了しました。6つの新しい UseCase を実装し、15のテストケースがすべてパスしています。

**主な成果:**
- ✅ AutomationVariables の完全な CRUD 操作
- ✅ AutomationResult の保存と取得
- ✅ カスケード削除による整合性保持
- ✅ 複製機能の実装
- ✅ 包括的なテストカバレッジ

**Phase 2 統計:**
- 新規 UseCase: 6 ファイル
- 新規テスト: 6 ファイル、15 tests
- 既存 UseCase 確認: 5 ファイル
- すべてのテストが Pass ✅

これで Phase 3 の Presenter 実装に進む準備が整いました。
