# AutomationResults - Design Document

## 概要

AutomationVariables の実行履歴を記録する `automationResults` をlocalStorageに追加します。各実行の状態、詳細、開始・終了日時を記録し、AutomationVariables管理画面から最新の実行結果を確認できるようにします。

## localStorage構造

### automationResults

```typescript
{
  "automationResults": [
    {
      "id": "result-uuid-1",
      "automationVariablesId": "variables-uuid-1",
      "executionStatus": "success",
      "resultDetail": "Successfully completed all 10 steps",
      "startFrom": "2025-10-15T10:00:00.000Z",
      "endTo": "2025-10-15T10:05:30.000Z"
    },
    {
      "id": "result-uuid-2",
      "automationVariablesId": "variables-uuid-1",
      "executionStatus": "failed",
      "resultDetail": "Failed at step 5: Element not found",
      "startFrom": "2025-10-15T09:30:00.000Z",
      "endTo": "2025-10-15T09:32:15.000Z"
    },
    {
      "id": "result-uuid-3",
      "automationVariablesId": "variables-uuid-2",
      "executionStatus": "doing",
      "resultDetail": "In progress: Step 3 of 8",
      "startFrom": "2025-10-15T10:10:00.000Z",
      "endTo": null
    }
  ]
}
```

## フィールド定義

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string (UUID v4) | ✓ | 実行結果の一意な識別子 |
| automationVariablesId | string | ✓ | 実行した AutomationVariables の ID（外部キー） |
| executionStatus | ExecutionStatus | ✓ | 実行ステータス: 'ready', 'doing', 'success', 'failed' |
| resultDetail | string | ✓ | 実行結果の詳細（自由記述） |
| startFrom | string (ISO 8601) | ✓ | 実行開始日時 |
| endTo | string (ISO 8601) \| null |  | 実行終了日時（実行中は null） |

### ExecutionStatus

```typescript
export const EXECUTION_STATUS = {
  READY: 'ready',      // 実行準備完了（予約実行など）
  DOING: 'doing',      // 実行中
  SUCCESS: 'success',  // 実行成功
  FAILED: 'failed',    // 実行失敗
} as const;

export type ExecutionStatus = (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];
```

## エンティティ設計

### AutomationResult Entity

```typescript
// src/domain/entities/AutomationResult.ts

import { v4 as uuidv4 } from 'uuid';
import { ExecutionStatus, isExecutionStatus } from '@domain/constants/ExecutionStatus';

export interface AutomationResultData {
  id: string;
  automationVariablesId: string;
  executionStatus: ExecutionStatus;
  resultDetail: string;
  startFrom: string; // ISO 8601
  endTo: string | null; // ISO 8601 or null
}

export class AutomationResult {
  private data: AutomationResultData;

  constructor(data: AutomationResultData) {
    this.validate(data);
    this.data = { ...data };
  }

  private validate(data: AutomationResultData): void {
    if (!data.id) throw new Error('ID is required');
    if (!data.automationVariablesId) throw new Error('AutomationVariables ID is required');
    if (!isExecutionStatus(data.executionStatus)) {
      throw new Error('Invalid execution status');
    }
    if (!data.startFrom) throw new Error('Start time is required');
  }

  // Getters
  getId(): string {
    return this.data.id;
  }

  getAutomationVariablesId(): string {
    return this.data.automationVariablesId;
  }

  getExecutionStatus(): ExecutionStatus {
    return this.data.executionStatus;
  }

  getResultDetail(): string {
    return this.data.resultDetail;
  }

  getStartFrom(): string {
    return this.data.startFrom;
  }

  getEndTo(): string | null {
    return this.data.endTo;
  }

  // Immutable setters
  setExecutionStatus(status: ExecutionStatus): AutomationResult {
    return new AutomationResult({
      ...this.data,
      executionStatus: status,
    });
  }

  setResultDetail(detail: string): AutomationResult {
    return new AutomationResult({
      ...this.data,
      resultDetail: detail,
    });
  }

  setEndTo(endTime: string): AutomationResult {
    return new AutomationResult({
      ...this.data,
      endTo: endTime,
    });
  }

  // Export data
  toData(): AutomationResultData {
    return { ...this.data };
  }

  // Clone
  clone(): AutomationResult {
    return new AutomationResult({ ...this.data });
  }

  // Static factory
  static create(params: {
    automationVariablesId: string;
    executionStatus?: ExecutionStatus;
    resultDetail?: string;
  }): AutomationResult {
    return new AutomationResult({
      id: uuidv4(),
      automationVariablesId: params.automationVariablesId,
      executionStatus: params.executionStatus || EXECUTION_STATUS.READY,
      resultDetail: params.resultDetail || '',
      startFrom: new Date().toISOString(),
      endTo: null,
    });
  }

  // Helper: 実行時間を計算（秒）
  getDurationSeconds(): number | null {
    if (!this.data.endTo) return null;
    const start = new Date(this.data.startFrom).getTime();
    const end = new Date(this.data.endTo).getTime();
    return (end - start) / 1000;
  }

  // Helper: 実行中かどうか
  isInProgress(): boolean {
    return this.data.executionStatus === EXECUTION_STATUS.DOING;
  }

  // Helper: 成功したかどうか
  isSuccess(): boolean {
    return this.data.executionStatus === EXECUTION_STATUS.SUCCESS;
  }

  // Helper: 失敗したかどうか
  isFailed(): boolean {
    return this.data.executionStatus === EXECUTION_STATUS.FAILED;
  }
}
```

## Repository 設計

### IAutomationResultRepository

```typescript
// src/domain/repositories/IAutomationResultRepository.ts

import { AutomationResult } from '@domain/entities/AutomationResult';

export interface IAutomationResultRepository {
  /**
   * Save automation result
   */
  save(result: AutomationResult): Promise<void>;

  /**
   * Load automation result by ID
   */
  load(id: string): Promise<AutomationResult | null>;

  /**
   * Load all automation results
   */
  loadAll(): Promise<AutomationResult[]>;

  /**
   * Load results for specific AutomationVariables
   */
  loadByAutomationVariablesId(variablesId: string): Promise<AutomationResult[]>;

  /**
   * Load latest result for specific AutomationVariables
   * (最新の startFrom を持つ1件)
   */
  loadLatestByAutomationVariablesId(variablesId: string): Promise<AutomationResult | null>;

  /**
   * Delete automation result by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all results for specific AutomationVariables
   */
  deleteByAutomationVariablesId(variablesId: string): Promise<void>;
}
```

### ChromeStorageAutomationResultRepository

```typescript
// src/infrastructure/repositories/ChromeStorageAutomationResultRepository.ts

import browser from 'webextension-polyfill';
import { IAutomationResultRepository } from '@domain/repositories/IAutomationResultRepository';
import { AutomationResult, AutomationResultData } from '@domain/entities/AutomationResult';
import { ILogger } from '@domain/services/ILogger';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';

export class ChromeStorageAutomationResultRepository implements IAutomationResultRepository {
  constructor(private logger: ILogger) {}

  async save(result: AutomationResult): Promise<void> {
    try {
      const storage = await this.loadStorage();
      const data = result.toData();

      const existingIndex = storage.findIndex((r) => r.id === data.id);
      if (existingIndex >= 0) {
        storage[existingIndex] = data;
        this.logger.info(`Automation result updated: ${data.id}`);
      } else {
        storage.push(data);
        this.logger.info(`Automation result created: ${data.id}`);
      }

      await this.saveStorage(storage);
    } catch (error) {
      this.logger.error('Failed to save automation result', error);
      throw new Error('Failed to save automation result');
    }
  }

  async load(id: string): Promise<AutomationResult | null> {
    try {
      const storage = await this.loadStorage();
      const data = storage.find((r) => r.id === id);
      return data ? new AutomationResult(data) : null;
    } catch (error) {
      this.logger.error('Failed to load automation result', error);
      return null;
    }
  }

  async loadAll(): Promise<AutomationResult[]> {
    try {
      const storage = await this.loadStorage();
      return storage.map((data) => new AutomationResult(data));
    } catch (error) {
      this.logger.error('Failed to load all automation results', error);
      return [];
    }
  }

  async loadByAutomationVariablesId(variablesId: string): Promise<AutomationResult[]> {
    try {
      const storage = await this.loadStorage();
      const filtered = storage.filter((r) => r.automationVariablesId === variablesId);

      // Sort by startFrom descending (newest first)
      filtered.sort((a, b) => {
        return new Date(b.startFrom).getTime() - new Date(a.startFrom).getTime();
      });

      return filtered.map((data) => new AutomationResult(data));
    } catch (error) {
      this.logger.error('Failed to load automation results by variables ID', error);
      return [];
    }
  }

  async loadLatestByAutomationVariablesId(variablesId: string): Promise<AutomationResult | null> {
    try {
      const results = await this.loadByAutomationVariablesId(variablesId);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      this.logger.error('Failed to load latest automation result', error);
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const storage = await this.loadStorage();
      const filtered = storage.filter((r) => r.id !== id);

      if (filtered.length === storage.length) {
        this.logger.warn(`No automation result found to delete: ${id}`);
      } else {
        await this.saveStorage(filtered);
        this.logger.info(`Automation result deleted: ${id}`);
      }
    } catch (error) {
      this.logger.error('Failed to delete automation result', error);
      throw new Error('Failed to delete automation result');
    }
  }

  async deleteByAutomationVariablesId(variablesId: string): Promise<void> {
    try {
      const storage = await this.loadStorage();
      const filtered = storage.filter((r) => r.automationVariablesId !== variablesId);

      await this.saveStorage(filtered);
      this.logger.info(`Automation results deleted for variables: ${variablesId}`);
    } catch (error) {
      this.logger.error('Failed to delete automation results by variables ID', error);
      throw new Error('Failed to delete automation results');
    }
  }

  private async loadStorage(): Promise<AutomationResultData[]> {
    const result = await browser.storage.local.get(STORAGE_KEYS.AUTOMATION_RESULTS);
    return (result[STORAGE_KEYS.AUTOMATION_RESULTS] as AutomationResultData[]) || [];
  }

  private async saveStorage(data: AutomationResultData[]): Promise<void> {
    await browser.storage.local.set({ [STORAGE_KEYS.AUTOMATION_RESULTS]: data });
  }
}
```

## Use Cases

### SaveAutomationResultUseCase

```typescript
// src/usecases/SaveAutomationResultUseCase.ts

export class SaveAutomationResultUseCase {
  constructor(private repository: IAutomationResultRepository) {}

  async execute(result: AutomationResult): Promise<void> {
    await this.repository.save(result);
  }
}
```

### GetLatestAutomationResultUseCase

```typescript
// src/usecases/GetLatestAutomationResultUseCase.ts

export class GetLatestAutomationResultUseCase {
  constructor(private repository: IAutomationResultRepository) {}

  async execute(automationVariablesId: string): Promise<AutomationResult | null> {
    return await this.repository.loadLatestByAutomationVariablesId(automationVariablesId);
  }
}
```

### GetAutomationResultHistoryUseCase

```typescript
// src/usecases/GetAutomationResultHistoryUseCase.ts

export class GetAutomationResultHistoryUseCase {
  constructor(private repository: IAutomationResultRepository) {}

  async execute(automationVariablesId: string): Promise<AutomationResult[]> {
    return await this.repository.loadByAutomationVariablesId(automationVariablesId);
  }
}
```

## UI 表示仕様

### AutomationVariables 管理画面での表示

各 AutomationVariables カードに最新の実行結果を表示：

```
┌──────────────────────────────────────────────────────────────┐
│ 📌 Example Site                                              │
│ ID: abc123-def456-ghi789                                     │
│ Website ID: website-001                                      │
│ Status: 🟢 Active                                            │
│ Variables: username, password, email (3 variables)           │
│ Updated: 2025-10-15 10:30:45                                │
│                                                              │
│ ⏱️ 最新の実行結果:                                           │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ✅ Success - 5.3秒                                   │   │
│ │ Successfully completed all 10 steps                  │   │
│ │ 開始: 2025-10-15 10:00:00                           │   │
│ │ 終了: 2025-10-15 10:00:05                           │   │
│ └──────────────────────────────────────────────────────┘   │
│                                   ┌─────┐┌─────┐┌─────┐   │
│                                   │✏️編集││🗑️削除││📋複製│   │
│                                   └─────┘└─────┘└─────┘   │
└──────────────────────────────────────────────────────────────┘
```

実行履歴がない場合：

```
│ ⏱️ 最新の実行結果:                                           │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📭 実行履歴なし                                      │   │
│ └──────────────────────────────────────────────────────┘   │
```

実行中の場合：

```
│ ⏱️ 最新の実行結果:                                           │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ⚙️ 実行中...                                         │   │
│ │ In progress: Step 3 of 8                             │   │
│ │ 開始: 2025-10-15 10:10:00                           │   │
│ └──────────────────────────────────────────────────────┘   │
```

失敗の場合：

```
│ ⏱️ 最新の実行結果:                                           │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ❌ Failed - 2.1秒                                    │   │
│ │ Failed at step 5: Element not found                 │   │
│ │ 開始: 2025-10-15 09:30:00                           │   │
│ │ 終了: 2025-10-15 09:30:02                           │   │
│ └──────────────────────────────────────────────────────┘   │
```

### ステータス表示のスタイル

```typescript
const getStatusDisplay = (status: ExecutionStatus) => {
  switch (status) {
    case 'ready':
      return { icon: '⏳', text: 'Ready', color: '#3498db' };
    case 'doing':
      return { icon: '⚙️', text: '実行中', color: '#f39c12' };
    case 'success':
      return { icon: '✅', text: 'Success', color: '#2ecc71' };
    case 'failed':
      return { icon: '❌', text: 'Failed', color: '#e74c3c' };
  }
};
```

## StorageKeys の更新

```typescript
// src/domain/constants/StorageKeys.ts

export const STORAGE_KEYS = {
  XPATH_COLLECTION: 'xpathCollectionCSV',
  WEBSITE_CONFIGS: 'websiteConfigs',
  SYSTEM_SETTINGS: 'systemSettings',
  AUTOMATION_VARIABLES: 'automationVariables',
  AUTOMATION_RESULTS: 'automationResults', // 追加
} as const;
```

## ExecutionStatus 定数の追加

```typescript
// src/domain/constants/ExecutionStatus.ts

export const EXECUTION_STATUS = {
  READY: 'ready',
  DOING: 'doing',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;

export type ExecutionStatus = (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];

export function isExecutionStatus(value: string): value is ExecutionStatus {
  return Object.values(EXECUTION_STATUS).includes(value as ExecutionStatus);
}
```

## 自動入力実行時の記録処理

### ChromeAutoFillService の更新

```typescript
// src/infrastructure/services/ChromeAutoFillService.ts

async executeAutoFill(
  tabId: number,
  xpaths: XPathData[],
  url: string,
  variables?: VariableCollection
): Promise<AutoFillResult> {
  // Create automation result entry
  const result = AutomationResult.create({
    automationVariablesId: variables?.getAutomationVariablesId() || '',
    executionStatus: EXECUTION_STATUS.DOING,
    resultDetail: `Starting auto-fill with ${xpaths.length} steps`,
  });

  await this.automationResultRepository.save(result);

  try {
    // ... existing auto-fill logic ...

    // Update result on success
    const successResult = result
      .setExecutionStatus(EXECUTION_STATUS.SUCCESS)
      .setResultDetail(`Successfully completed ${processedSteps} steps`)
      .setEndTo(new Date().toISOString());

    await this.automationResultRepository.save(successResult);

    return { success: true, processedSteps };
  } catch (error) {
    // Update result on failure
    const failedResult = result
      .setExecutionStatus(EXECUTION_STATUS.FAILED)
      .setResultDetail(`Failed: ${error.message}`)
      .setEndTo(new Date().toISOString());

    await this.automationResultRepository.save(failedResult);

    throw error;
  }
}
```

## 実装順序

### Phase 1: Entity & Repository (0.5日)
1. ExecutionStatus 定数の作成
2. AutomationResult エンティティの作成
3. IAutomationResultRepository インターフェースの作成
4. ChromeStorageAutomationResultRepository の実装
5. StorageKeys の更新
6. テストの作成

### Phase 2: Use Cases (0.5日)
1. SaveAutomationResultUseCase
2. GetLatestAutomationResultUseCase
3. GetAutomationResultHistoryUseCase
4. テストの作成

### Phase 3: AutoFillService 統合 (0.5日)
1. ChromeAutoFillService に結果記録処理を追加
2. VariableCollection に automationVariablesId を追加（必要に応じて）
3. テストの更新

### Phase 4: UI 表示 (1日)
1. Presenter に最新結果取得ロジックを追加
2. AutomationVariables 管理画面に結果表示を追加
3. スタイリング
4. 多言語対応

## データ保持ポリシー

### オプション検討

1. **無制限保持**: すべての履歴を保持
2. **期間制限**: 30日以前のデータを削除
3. **件数制限**: 各 AutomationVariables につき最新100件のみ保持
4. **ステータス別**: 失敗履歴は長期保持、成功履歴は短期保持

**推奨**: Phase 1 では無制限保持で実装し、将来的に設定画面で選択可能にする

## セキュリティ考慮事項

- `resultDetail` にはパスワードや秘密情報を含めない
- エラーメッセージのサニタイジング
- 大量のデータ蓄積によるパフォーマンス低下に注意

## 今後の拡張案

1. **詳細履歴画面**: 全履歴を一覧表示・フィルタリング
2. **統計情報**: 成功率、平均実行時間など
3. **通知機能**: 失敗時にデスクトップ通知
4. **エクスポート**: 履歴をCSVエクスポート
5. **自動削除**: 古い履歴の自動削除設定
