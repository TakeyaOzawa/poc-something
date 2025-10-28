# Task 8: Repository Result型統一 - 実装計画書

**作成日**: 2025-10-22
**見積工数**: 5-6日
**優先度**: 🟡 High

---

## 📋 プロジェクト概要

### 目的
すべてのRepositoryメソッドの戻り値をResult型に統一し、エラーハンドリングの一貫性を向上させる。

### 背景
現在、8つのRepositoryインターフェースのうち、1つ（WebsiteRepository）のみがResult型を使用している。残り7つのRepositoryは例外をthrowするパターンを使用しており、以下の問題がある：

1. **エラーハンドリングの不統一**: 一部はResult型、一部は例外throw
2. **try-catch地獄**: 呼び出し側で多数のtry-catchが必要
3. **型安全性の欠如**: エラーケースが型システムで表現されていない
4. **テスタビリティの低下**: エラーケースのテストが困難

---

## 📊 影響範囲分析

### Result型統一が必要なRepository（7個）

| # | Repository | メソッド数 | 実装クラス数 | 推定工数 |
|---|------------|-----------|------------|---------|
| 1 | XPathRepository | 2 | 2 (ChromeStorage, Secure) | 0.5日 |
| 2 | AutomationVariablesRepository | 5 | 2 (ChromeStorage, Secure) | 1日 |
| 3 | SystemSettingsRepository | 2 | 2 (ChromeStorage, Secure) | 0.5日 |
| 4 | StorageSyncConfigRepository | 10 | 1 (ChromeStorage) | 1日 |
| 5 | SyncHistoryRepository | 7 | 1 (ChromeStorage) | 0.75日 |
| 6 | AutomationResultRepository | 7 | 1 (ChromeStorage) | 0.75日 |
| 7 | RecordingStorageRepository | 10 | 1 (IndexedDB) | 1日 |
| **合計** | **7** | **43** | **12** | **5.5日** |

### 実装クラス一覧

#### XPathRepository (2実装)
- `ChromeStorageXPathRepository`
- `SecureXPathRepository`

#### AutomationVariablesRepository (2実装)
- `ChromeStorageAutomationVariablesRepository`
- `SecureAutomationVariablesRepository`

#### SystemSettingsRepository (2実装)
- `ChromeStorageSystemSettingsRepository`
- `SecureSystemSettingsRepository`

#### StorageSyncConfigRepository (1実装)
- `ChromeStorageStorageSyncConfigRepository`

#### SyncHistoryRepository (1実装)
- `ChromeStorageSyncHistoryRepository`

#### AutomationResultRepository (1実装)
- `ChromeStorageAutomationResultRepository`

#### RecordingStorageRepository (1実装)
- `IndexedDBRecordingRepository`

---

## 🎯 実装戦略

### Phase 1: 依存関係の少ないRepositoryから開始（2日）

**優先順位: High**

#### 1.1 SystemSettingsRepository（0.5日）
- **理由**: メソッド数が少ない（2個）、依存UseCaseが少ない
- **メソッド**: `save()`, `load()`
- **実装クラス**: 2個

**変更前:**
```typescript
export interface SystemSettingsRepository {
  save(collection: SystemSettingsCollection): Promise<void>;
  load(): Promise<SystemSettingsCollection>;
}
```

**変更後:**
```typescript
export interface SystemSettingsRepository {
  save(collection: SystemSettingsCollection): Promise<Result<void, Error>>;
  load(): Promise<Result<SystemSettingsCollection, Error>>;
}
```

#### 1.2 XPathRepository（0.5日）
- **理由**: メソッド数が少ない（2個）
- **メソッド**: `save()`, `load()`
- **実装クラス**: 2個

#### 1.3 SyncHistoryRepository（0.75日）
- **理由**: 依存関係が少ない、データ同期機能の独立部分
- **メソッド**: 7個
- **実装クラス**: 1個

---

### Phase 2: 中規模Repository（2日）

**優先順位: Medium**

#### 2.1 AutomationVariablesRepository（1日）
- **メソッド**: 5個
- **実装クラス**: 2個
- **依存UseCase**: 多数（約15個）

#### 2.2 AutomationResultRepository（0.75日）
- **メソッド**: 7個
- **実装クラス**: 1個

---

### Phase 3: 大規模Repository（1.5日）

**優先順位: Medium**

#### 3.1 StorageSyncConfigRepository（1日）
- **メソッド**: 10個
- **実装クラス**: 1個

#### 3.2 RecordingStorageRepository（1日）
- **メソッド**: 10個
- **実装クラス**: 1個（IndexedDB）
- **注意**: IndexedDB特有のエラーハンドリングが必要

---

## 🔄 移行パターン

### パターン1: voidを返すメソッド

**Before:**
```typescript
async save(config: StorageSyncConfig): Promise<void> {
  try {
    const data = config.toData();
    await browser.storage.local.set({ [STORAGE_KEY]: data });
  } catch (error) {
    throw new Error(`Failed to save: ${error}`);
  }
}
```

**After:**
```typescript
async save(config: StorageSyncConfig): Promise<Result<void, Error>> {
  try {
    const data = config.toData();
    await browser.storage.local.set({ [STORAGE_KEY]: data });
    return Result.success(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Result.failure(new Error(`Failed to save: ${message}`));
  }
}
```

### パターン2: データを返すメソッド

**Before:**
```typescript
async load(id: string): Promise<StorageSyncConfig | null> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const data = result[STORAGE_KEY];
    if (!data || !data.id || data.id !== id) {
      return null;
    }
    return StorageSyncConfig.fromData(data);
  } catch (error) {
    throw new Error(`Failed to load: ${error}`);
  }
}
```

**After:**
```typescript
async load(id: string): Promise<Result<StorageSyncConfig | null, Error>> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const data = result[STORAGE_KEY];
    if (!data || !data.id || data.id !== id) {
      return Result.success(null);
    }
    return Result.success(StorageSyncConfig.fromData(data));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Result.failure(new Error(`Failed to load: ${message}`));
  }
}
```

### パターン3: 配列を返すメソッド

**Before:**
```typescript
async loadAll(): Promise<StorageSyncConfig[]> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const dataArray = result[STORAGE_KEY] || [];
    return dataArray.map((data: any) => StorageSyncConfig.fromData(data));
  } catch (error) {
    throw new Error(`Failed to load all: ${error}`);
  }
}
```

**After:**
```typescript
async loadAll(): Promise<Result<StorageSyncConfig[], Error>> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const dataArray = result[STORAGE_KEY] || [];
    const configs = dataArray.map((data: any) => StorageSyncConfig.fromData(data));
    return Result.success(configs);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Result.failure(new Error(`Failed to load all: ${message}`));
  }
}
```

---

## 🧪 テスト戦略

### 各Repositoryの移行時に実施

1. **既存テストの更新**
   - Result型を期待するアサーションに変更
   - `result.isSuccess`、`result.value`、`result.error`を使用

**Before:**
```typescript
it('should load config', async () => {
  const config = await repository.load('config-1');
  expect(config).toBeDefined();
  expect(config?.getId()).toBe('config-1');
});
```

**After:**
```typescript
it('should load config', async () => {
  const result = await repository.load('config-1');
  expect(result.isSuccess).toBe(true);
  expect(result.value).toBeDefined();
  expect(result.value?.getId()).toBe('config-1');
});
```

2. **エラーケースのテスト追加**
   - 失敗時のResult.failureを検証
   - エラーメッセージの内容を確認

**新規追加:**
```typescript
it('should return failure when storage fails', async () => {
  (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

  const result = await repository.load('config-1');
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeDefined();
  expect(result.error?.message).toContain('Failed to load');
});
```

3. **カバレッジ目標**: 各Repository 90%以上維持

---

## 📝 UseCase層の更新

### 呼び出し側の変更パターン

**Before（例外throwパターン）:**
```typescript
export class GetAllStorageSyncConfigsUseCase {
  async execute(): Promise<GetAllStorageSyncConfigsOutput> {
    try {
      const configs = await this.repository.loadAll();
      return {
        configs: configs.map((c) => c.toData()),
        count: configs.length,
      };
    } catch (error) {
      throw new Error(`Failed to get configs: ${error}`);
    }
  }
}
```

**After（Result型パターン）:**
```typescript
export class GetAllStorageSyncConfigsUseCase {
  async execute(): Promise<Result<GetAllStorageSyncConfigsOutput>> {
    const result = await this.repository.loadAll();

    if (result.isFailure) {
      return Result.failure(`Failed to get configs: ${result.error?.message}`);
    }

    const configs = result.value!;
    return Result.success({
      configs: configs.map((c) => c.toData()),
      count: configs.length,
    });
  }
}
```

---

## ⚠️ リスクと対策

### リスク1: 大量のテスト修正

**影響**: 各Repositoryに対して10-50個のテストケース修正が必要

**対策**:
- Phase 1で小規模Repositoryで手順を確立
- パターン化して効率的に修正
- Jest search/replaceを活用

### リスク2: UseCase層の連鎖修正

**影響**: 約60個のUseCaseが影響を受ける可能性

**対策**:
- Repository単位で段階的に移行
- 各Phaseでビルド・テストを実行
- 失敗時は即座にロールバック

### リスク3: IndexedDB特有の問題

**影響**: `RecordingStorageRepository`のIndexedDB実装は複雑

**対策**:
- Phase 3で最後に実施
- IndexedDBのトランザクションエラーを慎重に処理
- 既存のタイムアウト問題（6テスト失敗）は別途対応

---

## 🎯 成功基準

### 各Phase完了時

- ✅ 対象Repositoryインターフェースが全メソッドでResult型を返す
- ✅ 全実装クラスがResult型を返すように更新済み
- ✅ 全UseCaseが更新済み（try-catchからResult型処理へ）
- ✅ テスト合格率: 95%以上（既存の失敗テストを除く）
- ✅ Lint: 0 errors, 0 warnings
- ✅ Build: Success

### プロジェクト完了時

- ✅ 7つのRepositoryインターフェースが統一済み
- ✅ 12個の実装クラスが統一済み
- ✅ 約60個のUseCaseが更新済み
- ✅ ドキュメント更新（`README.md`にResult型使用パターンを追加）
- ✅ テストカバレッジ: 96%以上維持

---

## 📅 実装スケジュール

| Phase | Repository | 日数 | 累積日数 |
|-------|-----------|------|---------|
| Phase 1.1 | SystemSettingsRepository | 0.5 | 0.5 |
| Phase 1.2 | XPathRepository | 0.5 | 1.0 |
| Phase 1.3 | SyncHistoryRepository | 0.75 | 1.75 |
| Phase 2.1 | AutomationVariablesRepository | 1.0 | 2.75 |
| Phase 2.2 | AutomationResultRepository | 0.75 | 3.5 |
| Phase 3.1 | StorageSyncConfigRepository | 1.0 | 4.5 |
| Phase 3.2 | RecordingStorageRepository | 1.0 | 5.5 |
| **合計** | | **5.5日** | |

---

## 🚀 次のアクション

1. **Phase 1.1開始**: SystemSettingsRepositoryの移行から着手
2. **テンプレート確立**: 最初のRepositoryで移行パターンを確立
3. **段階的実施**: 各Phase完了後にビルド・テスト実行
4. **定期報告**: 各Phase完了時にSlack通知

---

**Document Version**: 1.1
**Last Updated**: 2025-10-23
**Status**: ✅ Completed - All Repositories Already Migrated to Result Type

---

## ✅ Task 8: 完了報告

**完了日**: 2025-10-23

### 実施結果

すべてのRepositoryインターフェースとその実装が**既にResult型に統一済み**であることが確認されました。

| Repository | メソッド数 | Result型統一 | 備考 |
|-----------|----------|-------------|------|
| ✅ SystemSettingsRepository | 2 | 完了 | save, load |
| ✅ XPathRepository | 2 | 完了 | save, load |
| ✅ SyncHistoryRepository | 8 | 完了 | save, findById, findByConfigId, findRecent, delete, deleteOlderThan, count, countByConfigId |
| ✅ AutomationVariablesRepository | 5 | 完了 | save, load, loadAll, delete, exists |
| ✅ AutomationResultRepository | 7 | 完了 | save, load, loadAll, loadByAutomationVariablesId, loadLatestByAutomationVariablesId, delete, deleteByAutomationVariablesId |
| ✅ StorageSyncConfigRepository | 10 | 完了 | save, load, loadByStorageKey, loadAll, loadAllEnabledPeriodic, delete, deleteByStorageKey, exists, existsByStorageKey |
| ✅ RecordingStorageRepository | 10 | 完了 | save, load, loadByAutomationResultId, loadLatestByAutomationVariablesId, loadAll, delete, deleteByAutomationResultId, deleteOldRecordings, getStorageSize |
| **合計** | **44** | **✅ 100%** | すべて完了 |

### 確認済み実装パターン

すべてのRepositoryで以下のパターンが実装されています：

```typescript
// ✅ 統一されたResult型パターン
async save(data: T): Promise<Result<void, Error>> {
  try {
    // 保存処理
    return Result.success(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Result.failure(new Error(`Failed to save: ${message}`));
  }
}

async load(id: string): Promise<Result<T | null, Error>> {
  try {
    // 読み込み処理
    if (!data) {
      return Result.success(null);
    }
    return Result.success(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Result.failure(new Error(`Failed to load: ${message}`));
  }
}
```

### 結論

**Task 8の目的は既に達成されています。**

- ✅ すべてのRepositoryインターフェースがResult型を返す
- ✅ すべての実装クラスがResult型を返す
- ✅ エラーハンドリングが統一されている
- ✅ `Result.success()`と`Result.failure()`パターンが使用されている
- ✅ try-catch地獄が解消されている
- ✅ 型安全性が確保されている

**追加作業は不要です。**

---

## 📝 計画書作成時の前提について

**作成日時点（2025-10-22）の前提**:
> 現在、8つのRepositoryインターフェースのうち、1つ（WebsiteRepository）のみがResult型を使用している。

**実際の状況（2025-10-23確認）**:
すべてのRepositoryインターフェース（8つすべて）が既にResult型を使用している。

**推測される理由**:
- 計画書作成後にすべてのRepositoryが統一された
- または、計画書作成時の調査が不完全だった

---

**Document Version**: 1.1
**Last Updated**: 2025-10-23
**Status**: ✅ Completed - All Repositories Already Migrated to Result Type

---

## 🔄 次期改修タスク

### Task 9: Adapter層のResult型統一（優先度: 中）

**目的**: Infrastructure/Adapter層のエラーハンドリングをResult型に統一し、全レイヤーでの一貫性を向上させる。

**対象**: 約15個のAdapterクラス
**工数**: 3-4日
**優先度**: 🟡 Medium

#### 対象Adapterクラス

| # | Adapter | メソッド数 | 現状 | 推定工数 |
|---|---------|-----------|------|----------|
| 1 | NotionSyncAdapter | 6 | 例外throw | 0.5日 |
| 2 | SpreadsheetSyncAdapter | 6 | 例外throw | 0.5日 |
| 3 | ChromeAutoFillAdapter | 3 | 例外throw | 0.5日 |
| 4 | SecureStorageAdapter | 4 | 例外throw | 0.5日 |
| 5 | ChromeHttpClient | 4 | 例外throw | 0.3日 |
| 6 | AxiosHttpClient | 4 | 例外throw | 0.3日 |
| 7 | ChromeNotificationAdapter | 3 | 例外throw | 0.2日 |
| 8 | ChromeSchedulerAdapter | 3 | 例外throw | 0.2日 |
| 9 | その他7個のAdapter | 20 | 例外throw | 0.5日 |
| **合計** | **15** | **53** | | **3.5日** |

#### 実装例

**Before (例外throwパターン):**
```typescript
// NotionSyncAdapter
async connect(inputs: SyncInput[]): Promise<void> {
  if (!apiKey) {
    throw new Error('API key not found');
  }
  // 接続処理
}

async queryDatabase(databaseId: string): Promise<NotionPageData[]> {
  try {
    const response = await this.client.databases.query({...});
    return response.results.map(page => this.convertToPageData(page));
  } catch (error) {
    throw this.convertNotionError(error);
  }
}
```

**After (Result型パターン):**
```typescript
// NotionSyncAdapter
async connect(inputs: SyncInput[]): Promise<Result<void, Error>> {
  if (!apiKey) {
    return Result.failure(new Error('API key not found'));
  }
  try {
    // 接続処理
    return Result.success(undefined);
  } catch (error) {
    return Result.failure(this.convertNotionError(error));
  }
}

async queryDatabase(databaseId: string): Promise<Result<NotionPageData[], Error>> {
  try {
    const response = await this.client.databases.query({...});
    const pages = response.results.map(page => this.convertToPageData(page));
    return Result.success(pages);
  } catch (error) {
    return Result.failure(this.convertNotionError(error));
  }
}
```

#### 期待効果

- **エラーハンドリングの一貫性**: 全レイヤーでResult型統一
- **try-catch地獄の解消**: Adapter呼び出し側でのtry-catch不要
- **型安全性の向上**: エラーケースが型システムで表現される
- **テスタビリティ向上**: エラーケースのテストが容易

---

### Task 10: ActionExecutor層の統一（優先度: 低）

**目的**: Infrastructure/Auto-fill層のActionExecutorクラス群をResult型に統一し、完全な一貫性を実現する。

**対象**: 約10個のActionExecutorクラス
**工数**: 2-3日
**優先度**: 🟢 Low

#### 対象ActionExecutorクラス

| # | ActionExecutor | 現状の戻り値型 | 推定工数 |
|---|----------------|---------------|----------|
| 1 | InputActionExecutor | ActionExecutionResult | 0.3日 |
| 2 | ClickActionExecutor | ActionExecutionResult | 0.3日 |
| 3 | CheckboxActionExecutor | ActionExecutionResult | 0.3日 |
| 4 | JudgeActionExecutor | ActionExecutionResult | 0.3日 |
| 5 | SelectActionExecutor | ActionExecutionResult | 0.3日 |
| 6 | ChangeUrlActionExecutor | ActionExecutionResult | 0.3日 |
| 7 | ScreenshotActionExecutor | ActionExecutionResult | 0.3日 |
| 8 | GetValueActionExecutor | GetValueExecutionResult | 0.3日 |
| 9 | その他2個のExecutor | ActionExecutionResult | 0.2日 |
| **合計** | **10** | | **2.5日** |

#### 実装例

**Before (独自型パターン):**
```typescript
interface ActionExecutionResult {
  success: boolean;
  message?: string;
  logs?: string[];
}

async execute(...): Promise<ActionExecutionResult> {
  try {
    // 実行処理
    return { success: true, message: 'Success' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
```

**After (Result型パターン):**
```typescript
interface ActionExecutionData {
  message: string;
  logs?: string[];
}

async execute(...): Promise<Result<ActionExecutionData, Error>> {
  try {
    // 実行処理
    return Result.success({ message: 'Success' });
  } catch (error) {
    return Result.failure(new Error(error.message));
  }
}
```

#### 期待効果

- **完全な型統一**: 全レイヤーでResult型使用
- **設計の一貫性**: プロジェクト全体で統一されたエラーハンドリングパターン
- **保守性向上**: 新規開発者にとって理解しやすい統一されたパターン

---

## 📅 次期改修スケジュール

### 推奨実施順序

```
✅ Task 8: Repository層 (完了)
     ↓
🔄 Task 9: Adapter層 (3-4日)
     ↓
⏳ Task 10: ActionExecutor層 (2-3日)
```

### マイルストーン

| Task | 期間 | 累積期間 | 成果物 |
|------|------|----------|--------|
| ✅ Task 8 | 完了 | - | Repository層Result型統一 |
| 🔄 Task 9 | 3-4日 | 3-4日 | Adapter層Result型統一 |
| ⏳ Task 10 | 2-3日 | 5-7日 | 全レイヤーResult型統一完了 |

### 実施判断基準

**Task 9 (Adapter層) 実施推奨条件:**
- プロジェクトに余裕がある
- エラーハンドリングの一貫性を重視する
- 新規開発者の参加予定がある

**Task 10 (ActionExecutor層) 実施推奨条件:**
- Task 9完了後
- 完全な設計統一を目指す場合
- 長期保守性を重視する場合

---

**Document Version**: 1.2
**Last Updated**: 2025-10-23
**Status**: ✅ Task 8 Completed, 🔄 Task 9 & 10 Planned