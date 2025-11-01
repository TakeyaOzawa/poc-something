# Phase 4: Advanced Features 実装 - 進捗報告

**実装期間**: 2025-01-16
**ステータス**: 🔄 進行中
**進捗**: 78% (7/9 タスク完了)

---

## 📋 実装概要

Phase 4では、Storage Sync Manager の高度な機能を実装しています。同期履歴の記録、エラーリトライ、同期状態監視、データ変換などの機能を追加し、より堅牢で柔軟性の高いシステムを構築します。

**実装統計** (現在まで):
- ✅ **同期履歴エンティティとリポジトリ** (377行) - 履歴管理基盤
- ✅ **履歴記録 Use Case** (130行) - 履歴取得・削除
- ✅ **エラーリトライ機能** (351行) - リトライポリシーと実行ロジック
- ✅ **同期状態監視機能** (369行) - リアルタイム状態追跡
- ✅ **データ変換機能** (724行) - フィールドマッピングとデータ検証
- ✅ **バッチ処理機能** (529行) - 大量データの分割処理
- ✅ **Use Case 拡張** (+350行) - 履歴記録、リトライ、状態監視、変換、バッチ統合
- ✅ **UI更新（履歴表示）** (756行) - タブ切替、履歴一覧、詳細表示
- ⏳ **テスト作成** - 未実施
- ⏳ **ドキュメント作成** - このファイル

**主要機能** (実装済み):
- ✅ 同期履歴の記録と保存
- ✅ 履歴の取得とフィルタリング
- ✅ 古い履歴の自動削除
- ✅ 設定可能なリトライポリシー
- ✅ 指数バックオフによるリトライ実行
- ✅ リトライ回数の履歴記録
- ✅ 同期状態のリアルタイム監視
- ✅ 進捗率の自動計算
- ✅ UI への状態変更通知
- ✅ フィールドマッピング（ネストフィールド対応）
- ✅ 型変換とデータ検証
- ✅ カスタム変換関数
- ✅ 10種類の組み込み変換関数
- ✅ バッチ処理（チャンク分割）
- ✅ シーケンシャル・パラレル処理
- ✅ バッチ進捗追跡
- ✅ バッチエラーハンドリング
- ✅ 失敗バッチのリトライ
- ✅ タブベースの設定/履歴表示
- ✅ 同期履歴一覧の表示
- ✅ 履歴詳細のモーダル表示
- ✅ 古い履歴の削除機能

**主要機能** (未実施):
- ⏳ テストとドキュメント

---

## ✅ 完了タスク

### Task 4.1: 同期履歴エンティティとリポジトリ作成
**期間**: 1時間
**ステータス**: ✅ 完了

#### SyncHistory エンティティ
**ファイル**: `src/domain/entities/SyncHistory.ts` (177行)

**実装内容**:
- 同期実行の記録エンティティ
- 開始/終了時刻、ステータス、結果の管理
- リトライ回数の記録

**主要インターフェース**:
```typescript
export interface SyncHistoryData {
  id: string;
  configId: string;
  storageKey: string;
  syncDirection: 'bidirectional' | 'receive_only' | 'send_only';
  startTime: number;
  endTime: number;
  status: 'success' | 'failed' | 'partial';
  receiveResult?: {
    success: boolean;
    receivedCount?: number;
    error?: string;
  };
  sendResult?: {
    success: boolean;
    sentCount?: number;
    error?: string;
  };
  error?: string;
  retryCount: number;
  createdAt: number;
}
```

**主要メソッド**:
1. **create()**: 新規履歴レコード作成
   - ユニークID自動生成
   - 開始時刻記録
   - リトライ回数初期化

2. **complete()**: 同期完了時の記録
   - 終了時刻設定
   - ステータス設定 (success/failed/partial)
   - 受信/送信結果の保存
   - エラーメッセージ記録

3. **getDuration()**: 実行時間取得
   - 開始から終了までの時間（ミリ秒）
   - 実行中の場合は現在までの経過時間

4. **getTotalItems()**: 処理アイテム数取得
   - 受信件数 + 送信件数の合計

**Factory メソッド**:
```typescript
// 新規作成
const history = SyncHistory.create({
  configId: 'config-123',
  storageKey: 'testData',
  syncDirection: 'bidirectional',
  startTime: Date.now(),
});

// 完了記録
history.complete({
  status: 'success',
  receiveResult: { success: true, receivedCount: 10 },
  sendResult: { success: true, sentCount: 5 },
});

// データから復元
const restored = SyncHistory.fromData(data);
```

#### ISyncHistoryRepository インターフェース
**ファイル**: `src/domain/repositories/ISyncHistoryRepository.ts` (48行)

**メソッド定義**:
```typescript
export interface ISyncHistoryRepository {
  save(history: SyncHistory): Promise<void>;
  findById(id: string): Promise<SyncHistory | null>;
  findByConfigId(configId: string, limit?: number): Promise<SyncHistory[]>;
  findRecent(limit: number): Promise<SyncHistory[]>;
  delete(id: string): Promise<void>;
  deleteOlderThan(days: number): Promise<number>;
  count(): Promise<number>;
  countByConfigId(configId: string): Promise<number>;
}
```

#### ChromeStorageSyncHistoryRepository 実装
**ファイル**: `src/infrastructure/repositories/ChromeStorageSyncHistoryRepository.ts` (200行)

**実装内容**:
- Chrome Storage Local を使用した永続化
- 最大1000件の履歴保持 (FIFO)
- Config ID によるフィルタリング
- 日数指定での古い履歴削除

**主要メソッド**:
1. **save()**: 履歴保存
   - 既存レコードの更新または新規追加
   - 最大件数チェックと古いレコードの削除
   - Chrome Storage への保存

2. **findByConfigId()**: Config別履歴取得
   - 指定Config IDの履歴をフィルタリング
   - 作成日時降順でソート
   - 件数制限適用

3. **findRecent()**: 最近の履歴取得
   - 全履歴から最新N件を取得
   - 作成日時降順でソート

4. **deleteOlderThan()**: 古い履歴削除
   - 指定日数より古い履歴を削除
   - 削除件数を返却
   - ストレージ容量の節約

**ストレージ構造**:
```typescript
const STORAGE_KEY = 'syncHistories';
const MAX_HISTORIES = 1000;

// Chrome Storage に保存される形式
{
  "syncHistories": [
    {
      "id": "sync-1737011234567-abc123",
      "configId": "config-123",
      "storageKey": "testData",
      "syncDirection": "bidirectional",
      "startTime": 1737011234567,
      "endTime": 1737011235890,
      "status": "success",
      "receiveResult": {
        "success": true,
        "receivedCount": 10
      },
      "sendResult": {
        "success": true,
        "sentCount": 5
      },
      "retryCount": 0,
      "createdAt": 1737011234567
    }
  ]
}
```

**FIFO 制御**:
```typescript
// 最大件数超過時の処理
if (histories.length > MAX_HISTORIES) {
  histories.sort((a, b) => b.createdAt - a.createdAt);
  histories.splice(MAX_HISTORIES);
}
```

---

### Task 4.2: 同期履歴記録 Use Case 作成
**期間**: 1時間
**ステータス**: ✅ 完了

#### GetSyncHistoriesUseCase
**ファイル**: `src/application/use-cases/sync/GetSyncHistoriesUseCase.ts` (70行)

**実装内容**:
- 同期履歴の取得
- Config ID によるフィルタリング
- 件数制限

**主要インターフェース**:
```typescript
export interface GetSyncHistoriesInput {
  configId?: string;  // 指定時は特定Configの履歴のみ
  limit?: number;     // デフォルト: 50
}

export interface GetSyncHistoriesOutput {
  success: boolean;
  histories?: SyncHistory[];
  error?: string;
}
```

**使用例**:
```typescript
// すべての最近の履歴を取得
const result = await useCase.execute({ limit: 100 });

// 特定Configの履歴を取得
const result = await useCase.execute({
  configId: 'config-123',
  limit: 20,
});
```

#### CleanupSyncHistoriesUseCase
**ファイル**: `src/application/use-cases/sync/CleanupSyncHistoriesUseCase.ts` (60行)

**実装内容**:
- 古い同期履歴の削除
- ストレージ容量の節約

**主要インターフェース**:
```typescript
export interface CleanupSyncHistoriesInput {
  olderThanDays: number;  // 何日より古い履歴を削除するか
}

export interface CleanupSyncHistoriesOutput {
  success: boolean;
  deletedCount?: number;
  error?: string;
}
```

**使用例**:
```typescript
// 30日より古い履歴を削除
const result = await useCase.execute({ olderThanDays: 30 });
console.log(`${result.deletedCount} 件の履歴を削除しました`);
```

#### ExecuteManualSyncUseCase への統合
**ファイル**: `src/application/use-cases/sync/ExecuteManualSyncUseCase.ts` (修正)

**変更内容**:
1. **コンストラクタに ISyncHistoryRepository 追加**
2. **execute() 開始時に履歴レコード作成**
3. **実行完了時に履歴を更新して保存**
4. **エラー発生時も履歴を保存**

**履歴記録フロー**:
```typescript
async execute(input: ExecuteManualSyncInput): Promise<ExecuteManualSyncOutput> {
  // 1. 履歴レコード作成
  const syncHistory = SyncHistory.create({
    configId: config.getId(),
    storageKey: config.getStorageKey(),
    syncDirection: config.getSyncDirection(),
    startTime: Date.now(),
  });

  try {
    // 2. 同期実行
    // ... (receive/send operations)

    // 3. 成功時の履歴記録
    syncHistory.complete({
      status: 'success',
      receiveResult: output.receiveResult,
      sendResult: output.sendResult,
    });
    await this.syncHistoryRepository.save(syncHistory);

  } catch (error) {
    // 4. エラー時の履歴記録
    syncHistory.complete({
      status: 'failed',
      error: errorMsg,
    });
    await this.syncHistoryRepository.save(syncHistory);
  }
}
```

**ログ出力**:
```typescript
this.logger.info('Manual sync completed successfully', {
  storageKey: config.getStorageKey(),
  syncDirection,
  receivedCount: output.receiveResult?.receivedCount,
  sentCount: output.sendResult?.sentCount,
  duration: syncHistory.getDuration(),  // 追加
});
```

---

### Task 4.3: エラーリトライ機能実装
**期間**: 2時間
**ステータス**: ✅ 完了

#### RetryPolicy エンティティ
**ファイル**: `src/domain/entities/RetryPolicy.ts` (149行)

**実装内容**:
- リトライ動作の設定エンティティ
- 指数バックオフのサポート
- リトライ対象エラーの設定

**主要インターフェース**:
```typescript
export interface RetryPolicyData {
  maxAttempts: number;           // 最大リトライ回数
  initialDelayMs: number;        // 初回遅延(ミリ秒)
  maxDelayMs: number;            // 最大遅延(ミリ秒)
  backoffMultiplier: number;     // バックオフ倍率
  retryableErrors: string[];     // リトライ対象エラーパターン
}
```

**主要メソッド**:
1. **calculateDelay()**: リトライ遅延計算
   - 指数バックオフ: `initialDelay * (multiplier ^ (attempt - 1))`
   - 最大遅延でキャップ
   ```typescript
   calculateDelay(attemptNumber: number): number {
     const delay = this.initialDelayMs * Math.pow(this.backoffMultiplier, attemptNumber - 1);
     return Math.min(delay, this.maxDelayMs);
   }
   ```

2. **shouldRetry()**: リトライ判定
   - 最大回数チェック
   - エラーパターンマッチング
   ```typescript
   shouldRetry(error: Error, attemptNumber: number): boolean {
     if (attemptNumber >= this.maxAttempts) return false;

     if (this.retryableErrors.length === 0) return true;

     const errorMessage = error.message.toLowerCase();
     return this.retryableErrors.some((pattern) =>
       errorMessage.includes(pattern.toLowerCase())
     );
   }
   ```

**プリセット Factory メソッド**:
```typescript
// デフォルトポリシー
const policy = RetryPolicy.default();
// {
//   maxAttempts: 3,
//   initialDelayMs: 1000,
//   maxDelayMs: 30000,
//   backoffMultiplier: 2,
//   retryableErrors: ['timeout', 'network', 'connection', '5xx']
// }

// リトライなし
const noRetry = RetryPolicy.noRetry();

// 積極的リトライ
const aggressive = RetryPolicy.aggressive();
// {
//   maxAttempts: 5,
//   initialDelayMs: 500,
//   maxDelayMs: 60000,
//   backoffMultiplier: 2,
//   retryableErrors: [] // すべてのエラーをリトライ
// }

// カスタムポリシー
const custom = RetryPolicy.fromData({
  maxAttempts: 3,
  initialDelayMs: 2000,
  maxDelayMs: 10000,
  backoffMultiplier: 1.5,
  retryableErrors: ['timeout', 'ECONNREFUSED'],
});
```

**遅延計算例**:
```
初回遅延: 1000ms
backoffMultiplier: 2
maxDelayMs: 30000ms

Attempt 1: 1000 * (2^0) = 1000ms
Attempt 2: 1000 * (2^1) = 2000ms
Attempt 3: 1000 * (2^2) = 4000ms
Attempt 4: 1000 * (2^3) = 8000ms
Attempt 5: 1000 * (2^4) = 16000ms
Attempt 6: 1000 * (2^5) = 32000ms → 30000ms (cap)
```

#### RetryExecutor サービス
**ファイル**: `src/domain/services/RetryExecutor.ts` (202行)

**実装内容**:
- リトライロジックの実行
- 遅延とバックオフの管理
- 詳細なログ出力

**主要インターフェース**:
```typescript
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attemptsMade: number;
  totalDelayMs: number;
}
```

**主要メソッド**:
1. **execute()**: 基本リトライ実行
   ```typescript
   async execute<T>(
     operation: () => Promise<T>,
     retryPolicy: RetryPolicy,
     operationName: string = 'operation'
   ): Promise<RetryResult<T>>
   ```

2. **executeWithAttempt()**: 試行回数付きリトライ実行
   ```typescript
   async executeWithAttempt<T>(
     operation: (attemptNumber: number) => Promise<T>,
     retryPolicy: RetryPolicy,
     operationName: string = 'operation'
   ): Promise<RetryResult<T>>
   ```

**実行フロー**:
```typescript
while (true) {
  attemptNumber++;

  try {
    // 1. 操作実行
    const result = await operation();

    // 2. 成功時は結果を返す
    return {
      success: true,
      result,
      attemptsMade: attemptNumber,
      totalDelayMs,
    };

  } catch (error) {
    // 3. リトライ判定
    if (!retryPolicy.shouldRetry(error, attemptNumber)) {
      return {
        success: false,
        error,
        attemptsMade: attemptNumber,
        totalDelayMs,
      };
    }

    // 4. 遅延適用
    const delayMs = retryPolicy.calculateDelay(attemptNumber);
    await this.sleep(delayMs);
    totalDelayMs += delayMs;
  }
}
```

**ログ出力**:
```
[DEBUG] Executing operation (attempt 1)
[WARN] operation failed (attempt 1) { error: "Connection refused" }
[DEBUG] Waiting 1000ms before retry
[DEBUG] Executing operation (attempt 2)
[WARN] operation failed (attempt 2) { error: "Connection refused" }
[DEBUG] Waiting 2000ms before retry
[DEBUG] Executing operation (attempt 3)
[DEBUG] operation succeeded { attemptNumber: 3, totalDelayMs: 3000 }
```

#### StorageSyncConfig へのリトライポリシー追加
**ファイル**: `src/domain/entities/StorageSyncConfig.ts` (修正)

**変更内容**:
1. **StorageSyncConfigData に retryPolicy フィールド追加**
   ```typescript
   export interface StorageSyncConfigData {
     // ... 既存フィールド
     retryPolicy?: RetryPolicyData;
   }
   ```

2. **Getter/Setter 追加**
   ```typescript
   getRetryPolicy(): RetryPolicy | undefined {
     return this.data.retryPolicy
       ? RetryPolicy.fromData(this.data.retryPolicy)
       : undefined;
   }

   setRetryPolicy(retryPolicy: RetryPolicy): StorageSyncConfig {
     return new StorageSyncConfig({
       ...this.data,
       retryPolicy: retryPolicy.toData(),
       updatedAt: new Date().toISOString(),
     });
   }
   ```

3. **create() Factory メソッドに retryPolicy パラメータ追加**
   ```typescript
   static create(params: {
     // ... 既存パラメータ
     retryPolicy?: RetryPolicy;
   }): StorageSyncConfig
   ```

#### ExecuteManualSyncUseCase へのリトライ統合
**ファイル**: `src/application/use-cases/sync/ExecuteManualSyncUseCase.ts` (修正)

**変更内容**:
1. **RetryExecutor インスタンス作成**
   ```typescript
   export class ExecuteManualSyncUseCase {
     private retryExecutor: RetryExecutor;

     constructor(
       private executeReceiveStepsUseCase: ExecuteReceiveStepsUseCase,
       private executeSendStepsUseCase: ExecuteSendStepsUseCase,
       private syncHistoryRepository: ISyncHistoryRepository,
       private logger: Logger
     ) {
       this.retryExecutor = new RetryExecutor(logger.createChild('RetryExecutor'));
     }
   }
   ```

2. **Receive Steps のリトライ実行**
   ```typescript
   const retryPolicy = config.getRetryPolicy() || RetryPolicy.default();

   const retryResult = await this.retryExecutor.executeWithAttempt(
     async (attemptNumber) => {
       // リトライ回数を履歴に記録
       syncHistory.setRetryCount(attemptNumber - 1);

       const receiveResult = await this.executeReceiveStepsUseCase.execute({ config });

       // 失敗時はエラーをスロー（リトライトリガー）
       if (!receiveResult.success) {
         throw new Error(receiveResult.error || 'Receive steps failed');
       }

       return receiveResult;
     },
     retryPolicy,
     'Receive steps'
   );
   ```

3. **Send Steps のリトライ実行**
   ```typescript
   const retryResult = await this.retryExecutor.executeWithAttempt(
     async (attemptNumber) => {
       syncHistory.setRetryCount(attemptNumber - 1);

       const sendResult = await this.executeSendStepsUseCase.execute({ config });

       if (!sendResult.success) {
         throw new Error(sendResult.error || 'Send steps failed');
       }

       return sendResult;
     },
     retryPolicy,
     'Send steps'
   );
   ```

4. **結果処理**
   ```typescript
   if (retryResult.success && retryResult.result) {
     // 成功
     output.receiveResult = {
       success: true,
       receivedCount: retryResult.result.storedCount,
     };
     this.logger.info('Receive steps completed successfully', {
       receivedCount: retryResult.result.storedCount,
       attemptsMade: retryResult.attemptsMade,  // リトライ回数をログ
     });
   } else {
     // すべてのリトライ失敗
     output.receiveResult = {
       success: false,
       error: retryResult.error?.message || 'Failed after all retries',
     };
     this.logger.error('Receive steps failed after all retries', {
       attemptsMade: retryResult.attemptsMade,
       error: retryResult.error?.message,
     });
   }
   ```

#### Background Worker への統合
**ファイル**: `src/presentation/background/index.ts` (修正)

**変更内容**:
1. **SyncHistoryRepository の依存性追加**
   ```typescript
   import { ChromeStorageSyncHistoryRepository } from '@/infrastructure/repositories/ChromeStorageSyncHistoryRepository';

   // createDependencies
   syncHistoryRepository: new ChromeStorageSyncHistoryRepository(
     logger.createChild('SyncHistoryRepository')
   ),
   ```

2. **ExecuteManualSyncUseCase への注入**
   ```typescript
   const executeManualSyncUseCase = new ExecuteManualSyncUseCase(
     executeReceiveStepsUseCase,
     executeSendStepsUseCase,
     dependencies.syncHistoryRepository,  // 追加
     logger.createChild('ExecuteManualSync')
   );
   ```

---

### Task 4.4: 同期状態監視機能実装
**期間**: 2時間
**ステータス**: ✅ 完了

#### SyncState エンティティ
**ファイル**: `src/domain/entities/SyncState.ts` (226行)

**実装内容**:
- 同期実行の現在状態を表現するエンティティ
- ステータス管理、進捗率計算、経過時間追跡
- Receive/Send 個別進捗管理

**主要インターフェース**:
```typescript
export type SyncStatus = 'idle' | 'starting' | 'receiving' | 'sending' | 'completed' | 'failed';

export interface SyncStateData {
  configId: string;
  storageKey: string;
  status: SyncStatus;
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  startTime: number;
  endTime?: number;
  error?: string;
  receiveProgress?: {
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    currentStep: number;
    totalSteps: number;
    error?: string;
  };
  sendProgress?: {
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    currentStep: number;
    totalSteps: number;
    error?: string;
  };
}
```

**主要メソッド**:
1. **setStatus()**: ステータス更新と進捗率再計算
2. **setCurrentStep()**: 現在のステップ名更新
3. **incrementCompletedSteps()**: 完了ステップをインクリメント
4. **setReceiveProgress()**: Receive 進捗更新
5. **setSendProgress()**: Send 進捗更新
6. **complete()**: 完了として記録（progress = 100%）
7. **fail()**: 失敗として記録
8. **getProgress()**: 進捗率取得 (0-100)
9. **getElapsedTime()**: 経過時間取得（ミリ秒）
10. **isInProgress()**: 実行中判定
11. **isCompleted()**: 完了判定

**進捗率計算**:
```typescript
// 完了ステップ数ベース
progress = (completedSteps / totalSteps) * 100

// 完了前は最大99%、完了時に100%
if (progress >= 100 && !isCompleted()) {
  progress = 99;
}
```

**Factory メソッド**:
```typescript
// 新規作成
const syncState = SyncState.create({
  configId: 'config-123',
  storageKey: 'testData',
  totalSteps: 4, // 例: start + validation + receive + send
});

// データから復元
const restored = SyncState.fromData(data);
```

#### SyncStateNotifier サービス
**ファイル**: `src/domain/services/SyncStateNotifier.ts` (143行)

**実装内容**:
- 状態変更をUIにブロードキャスト
- Chrome runtime messaging による通知
- ヘルパーメソッドで簡単な状態更新

**メッセージ形式**:
```typescript
export interface SyncStateChangeEvent {
  type: 'syncStateChanged';
  state: {
    configId: string;
    storageKey: string;
    status: string;
    progress: number;
    currentStep: string;
    elapsedTime: number;
    error?: string;
  };
}
```

**主要メソッド**:
1. **initialize()**: 新規状態を初期化してブロードキャスト
2. **update()**: 状態更新関数を実行してブロードキャスト
3. **getCurrentState()**: 現在の状態を取得
4. **clear()**: 状態をクリア

**ヘルパーメソッド**:
```typescript
// ステータス更新
notifier.updateStatus('receiving');

// 現在ステップ更新（自動でインクリメント）
notifier.updateCurrentStep('Receiving data from external API');

// Receive 進捗更新
notifier.updateReceiveProgress('in_progress', 1, 3);

// Send 進捗更新
notifier.updateSendProgress('completed', 2, 2);

// 完了
notifier.complete();

// 失敗
notifier.fail('Connection timeout');
```

**ブロードキャスト実装**:
```typescript
private notifyStateChange(state: SyncState): void {
  const event: SyncStateChangeEvent = {
    type: 'syncStateChanged',
    state: {
      configId: state.getConfigId(),
      storageKey: state.getStorageKey(),
      status: state.getStatus(),
      progress: state.getProgress(),
      currentStep: state.getCurrentStep(),
      elapsedTime: state.getElapsedTime(),
      error: state.getError(),
    },
  };

  // Broadcast to all tabs
  browser.runtime.sendMessage(event).catch((error) => {
    // Ignore errors when no listeners are present
  });
}
```

#### ExecuteManualSyncUseCase への統合
**ファイル**: `src/application/use-cases/sync/ExecuteManualSyncUseCase.ts` (修正)

**変更内容**:
1. **SyncStateNotifier インスタンス作成**
   ```typescript
   constructor(
     private executeReceiveStepsUseCase: ExecuteReceiveStepsUseCase,
     private executeSendStepsUseCase: ExecuteSendStepsUseCase,
     private syncHistoryRepository: ISyncHistoryRepository,
     private logger: Logger
   ) {
     this.retryExecutor = new RetryExecutor(logger.createChild('RetryExecutor'));
     this.syncStateNotifier = new SyncStateNotifier(logger.createChild('SyncStateNotifier'));
   }
   ```

2. **同期開始時の状態初期化**
   ```typescript
   // Calculate total steps
   const syncDirection = config.getSyncDirection();
   let totalSteps = 2; // Start + validation
   if (syncDirection === 'bidirectional') {
     totalSteps += 2; // Receive + send
   } else {
     totalSteps += 1; // Either receive or send
   }

   // Initialize sync state
   const syncState = SyncState.create({
     configId: config.getId(),
     storageKey: config.getStorageKey(),
     totalSteps,
   });
   this.syncStateNotifier.initialize(syncState);
   ```

3. **検証フェーズの状態更新**
   ```typescript
   this.syncStateNotifier.updateCurrentStep('Validating configuration');

   // 検証失敗時
   this.syncStateNotifier.fail(errorMsg);
   this.syncStateNotifier.clear();
   ```

4. **Receive フェーズの状態更新**
   ```typescript
   // 開始時
   this.syncStateNotifier.updateStatus('receiving');
   this.syncStateNotifier.updateCurrentStep('Receiving data from external API');

   const receiveSteps = config.getReceiveSteps() || [];
   this.syncStateNotifier.updateReceiveProgress('in_progress', 0, receiveSteps.length);

   // 完了時
   this.syncStateNotifier.updateReceiveProgress(
     'completed',
     receiveSteps.length,
     receiveSteps.length
   );

   // 失敗時
   this.syncStateNotifier.updateReceiveProgress(
     'failed',
     0,
     receiveSteps.length,
     retryResult.error?.message
   );
   ```

5. **Send フェーズの状態更新**
   ```typescript
   // 開始時
   this.syncStateNotifier.updateStatus('sending');
   this.syncStateNotifier.updateCurrentStep('Sending data to external API');

   const sendSteps = config.getSendSteps() || [];
   this.syncStateNotifier.updateSendProgress('in_progress', 0, sendSteps.length);

   // 完了時
   this.syncStateNotifier.updateSendProgress(
     'completed',
     sendSteps.length,
     sendSteps.length
   );

   // 失敗時
   this.syncStateNotifier.updateSendProgress(
     'failed',
     0,
     sendSteps.length,
     retryResult.error?.message
   );
   ```

6. **最終状態の更新とクリア**
   ```typescript
   // 成功時
   this.syncStateNotifier.complete();

   // 失敗時
   this.syncStateNotifier.fail(output.error);

   // 2秒後にクリア（UIが最終状態を表示する時間を確保）
   setTimeout(() => {
     this.syncStateNotifier.clear();
   }, 2000);
   ```

**状態遷移フロー**:
```
idle → starting → validating
              ↓
         receiving (receive_only / bidirectional)
              ↓
          sending (send_only / bidirectional)
              ↓
         completed / failed
              ↓
          (2秒後に状態クリア)
```

#### UIでの利用方法

**状態変更の監視**:
```typescript
// Listen for sync state changes
browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'syncStateChanged') {
    const state = message.state;

    // Update UI
    updateProgressBar(state.progress);
    updateStatusText(state.status);
    updateCurrentStep(state.currentStep);
    updateElapsedTime(state.elapsedTime);

    if (state.error) {
      showError(state.error);
    }
  }
});
```

**プログレスバーの実装例**:
```typescript
function updateProgressBar(progress: number) {
  const progressBar = document.getElementById('syncProgress');
  progressBar.style.width = `${progress}%`;
  progressBar.textContent = `${progress}%`;
}

function updateStatusText(status: string) {
  const statusText = document.getElementById('syncStatus');
  const statusMap = {
    'idle': 'Idle',
    'starting': 'Starting...',
    'receiving': 'Receiving data...',
    'sending': 'Sending data...',
    'completed': 'Completed ✓',
    'failed': 'Failed ✗',
  };
  statusText.textContent = statusMap[status] || status;
}
```

---

---

### Task 4.5: データ変換機能実装
**期間**: 2時間
**ステータス**: ✅ 完了

#### DataTransformer エンティティ
**ファイル**: `src/domain/entities/DataTransformer.ts` (389行)

**実装内容**:
- データ変換ルールを管理するエンティティ
- フィールドマッピングと型変換
- ネストフィールドのサポート（ドット記法）
- データバリデーション機能

**主要インターフェース**:
```typescript
export interface DataTransformerData {
  id: string;
  name: string;
  description?: string;
  transformationRules: FieldTransformationRule[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FieldTransformationRule {
  sourceField: string;          // ソースフィールド（ドット記法対応）
  targetField: string;           // ターゲットフィールド（ドット記法対応）
  type?: TransformationType;     // 型変換
  required?: boolean;            // 必須フィールド
  defaultValue?: any;            // デフォルト値
  transformFunction?: string;    // カスタム変換関数名
  validationRules?: ValidationRule[];  // バリデーションルール
}

export type TransformationType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'object';

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern';
  value?: any;
  message?: string;
}
```

**主要メソッド**:
1. **transform()**: データ変換実行
   - ソースフィールドから値を取得
   - 型変換適用
   - ターゲットフィールドに設定
   - ネストフィールド対応
   ```typescript
   transform(sourceData: Record<string, any>): Record<string, any> {
     const result: Record<string, any> = {};

     for (const rule of this.data.transformationRules) {
       const sourceValue = this.getNestedValue(sourceData, rule.sourceField);

       // Handle required fields
       if (rule.required && (sourceValue === undefined || sourceValue === null)) {
         if (rule.defaultValue !== undefined) {
           this.setNestedValue(result, rule.targetField, rule.defaultValue);
         }
         continue;
       }

       // Apply type transformation
       let transformedValue = this.applyTypeTransformation(sourceValue, rule.type);
       this.setNestedValue(result, rule.targetField, transformedValue);
     }

     return result;
   }
   ```

2. **validate()**: データバリデーション
   - 必須フィールドチェック
   - バリデーションルール適用
   - エラーメッセージ収集
   ```typescript
   validate(data: Record<string, any>): { valid: boolean; errors: string[] } {
     const errors: string[] = [];

     for (const rule of this.data.transformationRules) {
       const value = this.getNestedValue(data, rule.sourceField);

       // Check required fields
       if (rule.required && (value === undefined || value === null)) {
         errors.push(`Field ${rule.sourceField} is required`);
       }

       // Apply validation rules
       if (rule.validationRules && value !== undefined && value !== null) {
         for (const validation of rule.validationRules) {
           // minLength, maxLength, min, max, pattern checks
         }
       }
     }

     return { valid: errors.length === 0, errors };
   }
   ```

3. **applyTypeTransformation()**: 型変換
   - string, number, boolean, date, array, object に対応
   ```typescript
   private applyTypeTransformation(value: any, type?: TransformationType): any {
     if (!type || value === undefined || value === null) return value;

     switch (type) {
       case 'string':
         return String(value);
       case 'number':
         return Number(value);
       case 'boolean':
         return Boolean(value);
       case 'date':
         return new Date(value);
       case 'array':
         return Array.isArray(value) ? value : [value];
       case 'object':
         return typeof value === 'object' ? value : { value };
       default:
         return value;
     }
   }
   ```

4. **getNestedValue() / setNestedValue()**: ネストフィールドアクセス
   - ドット記法をサポート（例: `user.profile.name`）
   - 深い階層のフィールドに対応

**Factory メソッド**:
```typescript
// 新規作成
const transformer = DataTransformer.create({
  name: 'API to Storage Transformer',
  transformationRules: [
    {
      sourceField: 'user_name',
      targetField: 'userName',
      type: 'string',
      required: true,
    },
    {
      sourceField: 'created_at',
      targetField: 'createdAt',
      type: 'date',
    },
    {
      sourceField: 'profile.age',
      targetField: 'age',
      type: 'number',
      validationRules: [
        { type: 'min', value: 0 },
        { type: 'max', value: 150 },
      ],
    },
  ],
});

// データから復元
const restored = DataTransformer.fromData(data);
```

#### DataTransformationService サービス
**ファイル**: `src/domain/services/DataTransformationService.ts` (335行)

**実装内容**:
- データ変換の実行エンジン
- カスタム変換関数のレジストリ
- 組み込み変換関数（10種類）
- 配列データの一括変換

**主要インターフェース**:
```typescript
export interface TransformationContext {
  timestamp: number;
  sourceData: any;
  metadata?: Record<string, any>;
}

export interface TransformationResult {
  success: boolean;
  data?: any;
  errors?: string[];
}

export type TransformationFunction = (
  value: any,
  context?: TransformationContext
) => any;
```

**主要メソッド**:
1. **registerFunction()**: カスタム関数登録
   ```typescript
   registerFunction(name: string, fn: TransformationFunction): void {
     this.customFunctions.set(name, fn);
     this.logger.debug('Registered custom transformation function', { name });
   }
   ```

2. **transform()**: 単一オブジェクト変換
   ```typescript
   transform(
     data: Record<string, any>,
     transformer: DataTransformer,
     context?: Partial<TransformationContext>
   ): TransformationResult {
     // 1. データバリデーション
     const validation = transformer.validate(data);
     if (!validation.valid) {
       return { success: false, errors: validation.errors };
     }

     // 2. 基本変換実行
     let transformedData = transformer.transform(data);

     // 3. カスタム関数適用
     transformedData = this.applyCustomFunctions(transformedData, transformer, fullContext);

     return { success: true, data: transformedData };
   }
   ```

3. **transformArray()**: 配列データ変換
   ```typescript
   transformArray(
     dataArray: Record<string, any>[],
     transformer: DataTransformer,
     context?: Partial<TransformationContext>
   ): TransformationResult {
     const results: any[] = [];
     const errors: string[] = [];

     for (let i = 0; i < dataArray.length; i++) {
       const item = dataArray[i];
       const result = this.transform(item, transformer, context);

       if (result.success && result.data) {
         results.push(result.data);
       } else {
         errors.push(`Item ${i}: ${result.errors?.join(', ')}`);
       }
     }

     return {
       success: errors.length === 0,
       data: results,
       errors: errors.length > 0 ? errors : undefined,
     };
   }
   ```

4. **validate()**: バリデーションのみ実行
   ```typescript
   validate(data: Record<string, any>, transformer: DataTransformer): TransformationResult {
     const validation = transformer.validate(data);
     return {
       success: validation.valid,
       data: validation.valid ? data : undefined,
       errors: validation.errors.length > 0 ? validation.errors : undefined,
     };
   }
   ```

**組み込み変換関数（10種類）**:
```typescript
// 1. trim - 前後の空白除去
'trim': (value: any) => typeof value === 'string' ? value.trim() : value

// 2. uppercase - 大文字変換
'uppercase': (value: any) => typeof value === 'string' ? value.toUpperCase() : value

// 3. lowercase - 小文字変換
'lowercase': (value: any) => typeof value === 'string' ? value.toLowerCase() : value

// 4. addTimestamp - タイムスタンプ追加
'addTimestamp': (value: any, context?: TransformationContext) => ({
  ...value,
  timestamp: context?.timestamp || Date.now(),
})

// 5. parseJson - JSON文字列をパース
'parseJson': (value: any) => typeof value === 'string' ? JSON.parse(value) : value

// 6. stringifyJson - オブジェクトをJSON文字列化
'stringifyJson': (value: any) => typeof value === 'object' ? JSON.stringify(value) : value

// 7. split - 文字列を配列に分割（カンマ区切り）
'split': (value: any) => typeof value === 'string' ? value.split(',').map(item => item.trim()) : value

// 8. join - 配列を文字列に結合
'join': (value: any) => Array.isArray(value) ? value.join(', ') : value

// 9. formatDate - 日付をISO文字列にフォーマット
'formatDate': (value: any) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value).toISOString();
  }
  return value;
}

// 10. removeNullish - null/undefinedフィールドを削除
'removeNullish': (value: any) => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      if (val !== null && val !== undefined) {
        result[key] = val;
      }
    }
    return result;
  }
  return value;
}
```

**カスタム関数の登録例**:
```typescript
// カスタム関数を登録
transformationService.registerFunction('extractFirstName', (value: any) => {
  if (typeof value === 'string') {
    return value.split(' ')[0];
  }
  return value;
});

// 変換ルールで使用
const transformer = DataTransformer.create({
  name: 'Custom Transformer',
  transformationRules: [
    {
      sourceField: 'fullName',
      targetField: 'firstName',
      transformFunction: 'extractFirstName',  // カスタム関数を指定
    },
  ],
});
```

#### StorageSyncConfig への統合
**ファイル**: `src/domain/entities/StorageSyncConfig.ts` (+15行)

**変更内容**:
1. **StorageSyncConfigData に transformerConfig フィールド追加**
   ```typescript
   export interface StorageSyncConfigData {
     // ... 既存フィールド
     transformerConfig?: DataTransformerData;
   }
   ```

2. **Getter/Setter 追加**
   ```typescript
   getTransformerConfig(): DataTransformerData | undefined {
     return this.data.transformerConfig;
   }

   setTransformerConfig(transformerConfig: DataTransformerData): StorageSyncConfig {
     return new StorageSyncConfig({
       ...this.data,
       transformerConfig,
       updatedAt: new Date().toISOString(),
     });
   }
   ```

3. **create() Factory メソッドに transformerConfig パラメータ追加**
   ```typescript
   static create(params: {
     // ... 既存パラメータ
     transformerConfig?: DataTransformerData;
   }): StorageSyncConfig
   ```

#### ExecuteReceiveStepsUseCase への統合
**ファイル**: `src/application/use-cases/sync/ExecuteReceiveStepsUseCase.ts` (+35行)

**変更内容**:
1. **DataTransformationService インスタンス作成**
   ```typescript
   export class ExecuteReceiveStepsUseCase {
     private transformationService: DataTransformationService;

     constructor(
       private httpClient: HttpClient,
       private dataMapper: IDataMapper,
       private logger: Logger
     ) {
       this.transformationService = new DataTransformationService(
         logger.createChild('DataTransformation')
       );
     }
   }
   ```

2. **Receive後のデータ変換処理**
   ```typescript
   // Apply data transformation if configured
   const transformerConfig = config.getTransformerConfig();
   if (transformerConfig && transformerConfig.enabled) {
     this.logger.debug('Applying data transformation', {
       transformerId: transformerConfig.id,
       transformerName: transformerConfig.name,
     });

     const transformer = DataTransformer.fromData(transformerConfig);

     // 配列か単一オブジェクトかで処理を分岐
     const transformationResult = Array.isArray(receivedData)
       ? this.transformationService.transformArray(receivedData, transformer)
       : this.transformationService.transform(receivedData, transformer);

     if (!transformationResult.success) {
       this.logger.warn('Data transformation failed', {
         errors: transformationResult.errors,
       });
       return {
         success: false,
         error: `Data transformation failed: ${transformationResult.errors?.join(', ')}`,
       };
     }

     receivedData = transformationResult.data;
     this.logger.debug('Data transformation completed successfully');
   }
   ```

**Receive フロー**:
```
API Response
  ↓
JSONPath Response Mapping (step.responseMapping)
  ↓
Data Transformation (transformerConfig) ← 追加
  ↓
Chrome Storage Local
```

#### ExecuteSendStepsUseCase への統合
**ファイル**: `src/application/use-cases/sync/ExecuteSendStepsUseCase.ts` (+45行)

**変更内容**:
1. **DataTransformationService インスタンス作成**
   ```typescript
   export class ExecuteSendStepsUseCase {
     private transformationService: DataTransformationService;

     constructor(
       private httpClient: HttpClient,
       private dataMapper: IDataMapper,
       private logger: Logger
     ) {
       this.transformationService = new DataTransformationService(
         logger.createChild('DataTransformation')
       );
     }
   }
   ```

2. **Send前のデータ変換処理**
   ```typescript
   // Load data from Chrome Storage
   const dataToSend = await this.loadData(storageKey);

   // Apply data transformation if configured
   let transformedData = dataToSend;
   const transformerConfig = config.getTransformerConfig();
   if (transformerConfig && transformerConfig.enabled) {
     this.logger.debug('Applying data transformation before sending', {
       transformerId: transformerConfig.id,
       transformerName: transformerConfig.name,
     });

     const transformer = DataTransformer.fromData(transformerConfig);
     const transformationResult = this.transformationService.transformArray(
       dataToSend,
       transformer
     );

     if (!transformationResult.success) {
       this.logger.warn('Data transformation failed', {
         errors: transformationResult.errors,
       });
       return {
         success: false,
         error: `Data transformation failed: ${transformationResult.errors?.join(', ')}`,
       };
     }

     transformedData = transformationResult.data || [];
     this.logger.debug('Data transformation completed successfully', {
       itemCount: transformedData.length,
     });
   }

   // Execute send steps with transformedData
   ```

3. **すべての参照を transformedData に更新**
   - requestBody の準備
   - JSONPath request mapping の適用
   - レスポンスのカウント

**Send フロー**:
```
Chrome Storage Local
  ↓
Data Transformation (transformerConfig) ← 追加
  ↓
JSONPath Request Mapping (step.requestMapping)
  ↓
API Request
```

---

### Task 4.6: バッチ処理機能実装
**期間**: 2時間
**ステータス**: ✅ 完了

#### BatchConfig エンティティ
**ファイル**: `src/domain/entities/BatchConfig.ts` (241行)

**実装内容**:
- バッチ処理の設定を管理するエンティティ
- チャンクサイズ、処理モード、エラーハンドリング設定
- プログレス計算機能

**主要インターフェース**:
```typescript
export interface BatchConfigData {
  id: string;
  name: string;
  chunkSize: number;                              // 1バッチあたりのアイテム数
  processingMode: 'sequential' | 'parallel';      // 処理モード
  maxConcurrency?: number;                        // 最大並列数（parallel時）
  errorHandling: 'fail-fast' | 'continue-on-error';  // エラーハンドリング戦略
  retryFailedBatches: boolean;                    // 失敗バッチのリトライ
  createdAt: string;
  updatedAt: string;
}

export interface BatchProgress {
  totalBatches: number;        // 総バッチ数
  completedBatches: number;    // 完了バッチ数
  failedBatches: number;       // 失敗バッチ数
  currentBatch: number;        // 現在のバッチ番号
  processedItems: number;      // 処理済みアイテム数
  totalItems: number;          // 総アイテム数
  progress: number;            // 進捗率 (0-100)
}
```

**主要メソッド**:
1. **calculateTotalBatches()**: 総バッチ数計算
   - アイテム数とチャンクサイズから算出
   ```typescript
   calculateTotalBatches(itemCount: number): number {
     return Math.ceil(itemCount / this.data.chunkSize);
   }
   ```

2. **splitIntoBatches()**: 配列をバッチに分割
   - ジェネリック型対応で任意の型の配列を分割
   ```typescript
   splitIntoBatches<T>(items: T[]): T[][] {
     const batches: T[][] = [];
     const totalBatches = this.calculateTotalBatches(items.length);

     for (let i = 0; i < totalBatches; i++) {
       const start = i * this.data.chunkSize;
       const end = start + this.data.chunkSize;
       batches.push(items.slice(start, end));
     }

     return batches;
   }
   ```

3. **calculateProgress()**: 進捗計算
   - 完了バッチ数から進捗率を算出
   ```typescript
   calculateProgress(completedBatches: number, totalBatches: number): BatchProgress {
     const progress = totalBatches > 0
       ? Math.round((completedBatches / totalBatches) * 100)
       : 0;

     return {
       totalBatches,
       completedBatches,
       failedBatches: 0,
       currentBatch: completedBatches + 1,
       processedItems: completedBatches * this.data.chunkSize,
       totalItems: totalBatches * this.data.chunkSize,
       progress,
     };
   }
   ```

**プリセット Factory メソッド**:
```typescript
// デフォルト設定（チャンク100、シーケンシャル、エラー継続）
const config = BatchConfig.default();

// 大規模データセット用（チャンク50、並列3、エラー継続、リトライあり）
const config = BatchConfig.largeDataset();
// {
//   chunkSize: 50,
//   processingMode: 'parallel',
//   maxConcurrency: 3,
//   errorHandling: 'continue-on-error',
//   retryFailedBatches: true
// }

// 重要データ用（チャンク10、シーケンシャル、即座に失敗、リトライあり）
const config = BatchConfig.criticalData();
// {
//   chunkSize: 10,
//   processingMode: 'sequential',
//   errorHandling: 'fail-fast',
//   retryFailedBatches: true
// }

// カスタム設定
const config = BatchConfig.create({
  name: 'Custom Config',
  chunkSize: 25,
  processingMode: 'parallel',
  maxConcurrency: 5,
  errorHandling: 'continue-on-error',
  retryFailedBatches: false,
});
```

#### BatchProcessor サービス
**ファイル**: `src/domain/services/BatchProcessor.ts` (288行)

**実装内容**:
- バッチ処理の実行エンジン
- シーケンシャル・パラレル処理のサポート
- 進捗コールバック機能
- バッチ単位のエラーハンドリング
- 失敗バッチのリトライ

**主要インターフェース**:
```typescript
export interface BatchResult<T> {
  success: boolean;
  results: T[];
  errors: BatchError[];
  progress: BatchProgress;
}

export interface BatchError {
  batchIndex: number;
  error: Error;
  items: any[];
}

export type BatchProcessorCallback<T, R> = (
  batch: T[],
  batchIndex: number
) => Promise<R>;

export type ProgressCallback = (progress: BatchProgress) => void;
```

**主要メソッド**:
1. **process()**: バッチ処理実行
   ```typescript
   async process<T, R>(
     items: T[],
     config: BatchConfig,
     processor: BatchProcessorCallback<T, R>,
     onProgress?: ProgressCallback
   ): Promise<BatchResult<R>>
   ```

   **処理フロー**:
   ```typescript
   // 1. アイテムをバッチに分割
   const batches = config.splitIntoBatches(items);

   // 2. 処理モードに応じて実行
   if (config.getProcessingMode() === 'sequential') {
     // シーケンシャル処理: 順番に1つずつ
     for (let i = 0; i < batches.length; i++) {
       const batch = batches[i];
       const batchResult = await processor(batch, i);
       results.push(batchResult);

       // 進捗通知
       if (onProgress) {
         onProgress(config.calculateProgress(i + 1, batches.length));
       }
     }
   } else {
     // パラレル処理: 最大同時実行数を制御
     const maxConcurrency = config.getMaxConcurrency() || 3;
     // Promise.race() を使用して並列度を制御
   }

   // 3. 失敗バッチのリトライ（設定による）
   if (config.getRetryFailedBatches() && errors.length > 0) {
     for (const error of errors) {
       const batchResult = await processor(error.items, error.batchIndex);
       // リトライ成功時は結果に追加、失敗時はエラーリストに残す
     }
   }
   ```

2. **processSimple()**: シンプルなAPI（進捗コールバックなし）
   ```typescript
   async processSimple<T, R>(
     items: T[],
     config: BatchConfig,
     processor: BatchProcessorCallback<T, R>
   ): Promise<BatchResult<R>>
   ```

**エラーハンドリング**:
```typescript
// fail-fast: 最初のエラーで即座に停止
if (config.getErrorHandling() === 'fail-fast') {
  this.logger.warn('Failing fast due to batch error');
  break;
}

// continue-on-error: エラーを記録して処理継続
errors.push({
  batchIndex: i,
  error: error,
  items: batch,
});
```

**パラレル処理の実装**:
```typescript
const maxConcurrency = config.getMaxConcurrency() || 3;
const batchPromises: Array<Promise<BatchResult>> = [];

for (let i = 0; i < batches.length; i++) {
  const batch = batches[i];

  // 最大並列数に達したら待機
  if (batchPromises.length >= maxConcurrency) {
    const settled = await Promise.race(batchPromises);
    // 完了したプロミスを配列から削除
    batchPromises.splice(settledIndex, 1);
  }

  // 新しいバッチ処理を開始
  const batchPromise = this.processBatchWithCatch(batch, i, processor);
  batchPromises.push(batchPromise);
}

// 残りのバッチ処理を待機
const remainingResults = await Promise.all(batchPromises);
```

#### StorageSyncConfig への統合
**ファイル**: `src/domain/entities/StorageSyncConfig.ts` (+20行)

**変更内容**:
1. **StorageSyncConfigData に batchConfig フィールド追加**
   ```typescript
   export interface StorageSyncConfigData {
     // ... 既存フィールド
     batchConfig?: BatchConfigData;
   }
   ```

2. **Getter/Setter 追加**
   ```typescript
   getBatchConfig(): BatchConfigData | undefined {
     return this.data.batchConfig;
   }

   setBatchConfig(batchConfig: BatchConfigData): StorageSyncConfig {
     return new StorageSyncConfig({
       ...this.data,
       batchConfig,
       updatedAt: new Date().toISOString(),
     });
   }
   ```

3. **create() Factory メソッドに batchConfig パラメータ追加**
   ```typescript
   static create(params: {
     // ... 既存パラメータ
     batchConfig?: BatchConfigData;
   }): StorageSyncConfig
   ```

#### ExecuteSendStepsUseCase への統合
**ファイル**: `src/application/use-cases/sync/ExecuteSendStepsUseCase.ts` (+100行)

**変更内容**:
1. **BatchProcessor インスタンス作成**
   ```typescript
   export class ExecuteSendStepsUseCase {
     private transformationService: DataTransformationService;
     private batchProcessor: BatchProcessor;

     constructor(
       private httpClient: HttpClient,
       private dataMapper: IDataMapper,
       private logger: Logger
     ) {
       this.transformationService = new DataTransformationService(
         logger.createChild('DataTransformation')
       );
       this.batchProcessor = new BatchProcessor(logger.createChild('BatchProcessor'));
     }
   }
   ```

2. **バッチ処理の判定と実行**
   ```typescript
   // バッチ設定が存在し、データがチャンクサイズより大きい場合
   const batchConfigData = config.getBatchConfig();
   if (batchConfigData && transformedData.length > batchConfigData.chunkSize) {
     // バッチ処理モード
     this.logger.info('Using batch processing for send steps', {
       itemCount: transformedData.length,
       chunkSize: batchConfigData.chunkSize,
     });

     const batchConfig = BatchConfig.fromData(batchConfigData);

     // 各送信ステップをバッチ処理
     for (const step of sendSteps) {
       const batchResult = await this.batchProcessor.process(
         transformedData,
         batchConfig,
         async (batch: any[], batchIndex: number) => {
           // バッチ単位でAPI送信
           // 1. リクエストボディ準備
           // 2. リクエストマッピング適用
           // 3. HTTP リクエスト実行
           // 4. レスポンス検証
         }
       );

       // バッチ結果の集計
       for (const result of batchResult.results) {
         totalSentCount += result.sentCount;
       }
     }
   } else {
     // 通常処理モード（バッチなし）
     // 既存のロジック
   }
   ```

**Send フロー（バッチ処理あり）**:
```
Chrome Storage Local
  ↓
Data Transformation (transformerConfig)
  ↓
Batch Split (batchConfig) ← 追加
  ↓
For each batch:
  ↓
  JSONPath Request Mapping (step.requestMapping)
  ↓
  API Request
  ↓
Aggregate results
```

**バッチ処理の自動判定**:
- `batchConfig` が設定されている
- データ件数 > `chunkSize`
→ バッチ処理モード

- 上記以外
→ 通常処理モード

---

### Task 4.7: UI更新（履歴表示）
**期間**: 2時間
**ステータス**: ✅ 完了

#### 概要
Storage Sync Manager UI に同期履歴の表示機能を追加しました。タブベースのナビゲーションで設定と履歴を切り替え、履歴一覧の表示、詳細モーダル、古い履歴の削除機能を実装しました。

#### UI構造

**タブナビゲーション**:
```html
<div class="tabs">
  <button class="tab-btn active" id="configTabBtn">⚙️ 設定</button>
  <button class="tab-btn" id="historyTabBtn">📋 履歴</button>
</div>
```

**履歴一覧画面**:
- ヘッダー（タイトル + クリーンアップボタン）
- 履歴アイテムリスト
  - ストレージキー
  - ステータスバッジ（成功/失敗/部分的成功）
  - 実行時刻と実行時間
  - 同期方向
  - 受信/送信結果（件数とステータス）
  - エラーメッセージ（失敗時）
  - リトライ回数（リトライ時）
  - 詳細表示ボタン

**履歴詳細モーダル**:
- 基本情報（ID、Config ID、ストレージキー、方向、ステータス）
- 実行時間（開始、終了、実行時間）
- 受信結果（成功/失敗、件数、エラー）
- 送信結果（成功/失敗、件数、エラー）
- エラー情報（失敗時）
- リトライ情報（リトライ時）

#### Presenter 実装
**ファイル**: `src/presentation/storage-sync-manager/StorageSyncManagerPresenter.ts` (+78行)

**インターフェース拡張**:
```typescript
export interface IStorageSyncManagerView {
  // ... 既存メソッド
  showSyncHistories(histories: SyncHistoryData[], configId?: string): void;
  showHistoryEmpty(): void;
  showHistoryDetail(history: SyncHistoryData): void;
}
```

**Use Case 統合**:
```typescript
constructor(
  // ... 既存パラメータ
  private getSyncHistoriesUseCase: GetSyncHistoriesUseCase,
  private cleanupSyncHistoriesUseCase: CleanupSyncHistoriesUseCase,
  logger?: Logger
)
```

**新規メソッド**:
1. **loadHistories()**: 履歴一覧の読み込み
   ```typescript
   async loadHistories(configId?: string, limit = 50): Promise<void> {
     // 1. Use Case 実行
     const result = await this.getSyncHistoriesUseCase.execute({
       configId,
       limit,
     });

     // 2. 結果に応じてView更新
     if (result.histories && result.histories.length > 0) {
       const historyData = result.histories.map((h) => h.toData());
       this.view.showSyncHistories(historyData, configId);
     } else {
       this.view.showHistoryEmpty();
     }
   }
   ```

2. **showHistoryDetail()**: 詳細表示
   ```typescript
   async showHistoryDetail(historyId: string): Promise<void> {
     // 1. 全履歴から対象を検索
     const result = await this.getSyncHistoriesUseCase.execute({ limit: 1000 });
     const history = result.histories?.find((h) => h.getId() === historyId);

     // 2. モーダル表示
     if (history) {
       this.view.showHistoryDetail(history.toData());
     }
   }
   ```

3. **cleanupHistories()**: 古い履歴削除
   ```typescript
   async cleanupHistories(olderThanDays: number): Promise<void> {
     const result = await this.cleanupSyncHistoriesUseCase.execute({
       olderThanDays,
     });

     if (result.success) {
       this.view.showSuccess(`Cleaned up ${result.deletedCount || 0} old histories`);
     }
   }
   ```

#### View 実装
**ファイル**: `src/presentation/storage-sync-manager/StorageSyncManagerView.ts` (+310行)

**履歴一覧の表示**:
```typescript
showSyncHistories(histories: SyncHistoryData[], configId?: string): void {
  const html = `
    <div class="history-header">
      <h3>同期履歴 (${filterLabel})</h3>
      <div class="history-actions">
        <button class="btn-cleanup" data-action="cleanup">古い履歴を削除</button>
      </div>
    </div>
    <div class="history-list">
      ${histories.map(history => `
        <div class="history-item">
          <!-- ストレージキー + ステータスバッジ -->
          <div class="history-main-info">
            <span class="history-storage-key">${history.storageKey}</span>
            <span class="history-status status-${history.status}">
              ${this.getStatusLabel(history.status)}
            </span>
          </div>

          <!-- 実行時刻 + 実行時間 -->
          <div class="history-time">
            ${this.formatDate(history.startTime)}
            ${history.endTime ? `(${this.formatDuration(history.startTime, history.endTime)})` : ''}
          </div>

          <!-- 同期方向と結果 -->
          <div class="history-details">
            <div>方向: ${this.getSyncDirectionLabel(history.syncDirection)}</div>
            ${this.renderHistoryResults(history)}
            ${history.error ? `<div class="history-error">エラー: ${history.error}</div>` : ''}
            ${history.retryCount > 0 ? `<div class="history-retry">リトライ回数: ${history.retryCount}</div>` : ''}
          </div>

          <!-- 詳細表示ボタン -->
          <button class="btn-view-detail" data-action="view-detail" data-id="${history.id}">
            詳細を表示
          </button>
        </div>
      `).join('')}
    </div>
  `;

  this.container.innerHTML = html;
}
```

**履歴詳細モーダル**:
```typescript
showHistoryDetail(history: SyncHistoryData): void {
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content modal-history-detail">
      <div class="modal-header">同期履歴 詳細</div>

      <!-- 基本情報 -->
      <div class="detail-section">
        <h4>基本情報</h4>
        <div class="detail-row">
          <span class="detail-label">履歴ID:</span>
          <span class="detail-value">${history.id}</span>
        </div>
        <!-- ... Config ID, ストレージキー, 方向, ステータス -->
      </div>

      <!-- 実行時間 -->
      <div class="detail-section">
        <h4>実行時間</h4>
        <!-- 開始時刻, 終了時刻, 実行時間 -->
      </div>

      <!-- 受信結果 -->
      ${history.receiveResult ? `
        <div class="detail-section">
          <h4>受信結果</h4>
          <!-- 成功/失敗, 件数, エラー -->
        </div>
      ` : ''}

      <!-- 送信結果 -->
      ${history.sendResult ? `
        <div class="detail-section">
          <h4>送信結果</h4>
          <!-- 成功/失敗, 件数, エラー -->
        </div>
      ` : ''}

      <!-- エラー情報 -->
      ${history.error ? `
        <div class="detail-section detail-error">
          <h4>エラー情報</h4>
          <div class="detail-error-message">${history.error}</div>
        </div>
      ` : ''}

      <!-- リトライ情報 -->
      ${history.retryCount > 0 ? `
        <div class="detail-section">
          <h4>リトライ情報</h4>
          <div class="detail-row">
            <span class="detail-label">リトライ回数:</span>
            <span class="detail-value">${history.retryCount}</span>
          </div>
        </div>
      ` : ''}

      <div class="modal-actions">
        <button class="btn-cancel close-history-detail">閉じる</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // イベントリスナー設定
  const closeBtn = modal.querySelector('.close-history-detail');
  closeBtn.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}
```

**ヘルパーメソッド**:
1. **getStatusLabel()**: ステータスラベル変換
   ```typescript
   private getStatusLabel(status: 'success' | 'failed' | 'partial'): string {
     switch (status) {
       case 'success': return '✅ 成功';
       case 'failed': return '❌ 失敗';
       case 'partial': return '⚠️ 部分的成功';
     }
   }
   ```

2. **formatDate()**: 日時フォーマット
   ```typescript
   private formatDate(timestamp: number): string {
     const date = new Date(timestamp);
     return date.toLocaleString('ja-JP', {
       year: 'numeric',
       month: '2-digit',
       day: '2-digit',
       hour: '2-digit',
       minute: '2-digit',
       second: '2-digit',
     });
   }
   ```

3. **formatDuration()**: 実行時間フォーマット
   ```typescript
   private formatDuration(startTime: number, endTime: number): string {
     const durationMs = endTime - startTime;
     const seconds = Math.floor(durationMs / 1000);

     if (seconds < 60) {
       return `${seconds}.${Math.floor((durationMs % 1000) / 100)}秒`;
     }

     const minutes = Math.floor(seconds / 60);
     const remainingSeconds = seconds % 60;
     return `${minutes}分${remainingSeconds}秒`;
   }
   ```

#### Controller 実装
**ファイル**: `src/presentation/storage-sync-manager/index.ts` (+137行)

**Use Case 初期化**:
```typescript
private initializePresenter(): void {
  // ... 既存コード

  // History Repository 作成
  const historyRepository = new ChromeStorageSyncHistoryRepository(
    this.logger.createChild('HistoryRepository')
  );

  // Use Case 作成
  const useCases = {
    // ... 既存 Use Case
    getSyncHistories: new GetSyncHistoriesUseCase(
      historyRepository,
      this.logger.createChild('GetSyncHistoriesUseCase')
    ),
    cleanupSyncHistories: new CleanupSyncHistoriesUseCase(
      historyRepository,
      this.logger.createChild('CleanupSyncHistoriesUseCase')
    ),
  };

  // Presenter に渡す
  this.presenter = new StorageSyncManagerPresenter(
    view,
    // ... 既存 Use Case
    useCases.getSyncHistories,
    useCases.cleanupSyncHistories,
    this.logger.createChild('Presenter')
  );
}
```

**タブ切り替え**:
```typescript
private async showHistoryTab(): Promise<void> {
  this.logger.info('Switching to history tab');

  // タブボタンの状態更新
  this.historyTabBtn.classList.add('active');
  this.configTabBtn.classList.remove('active');

  // 履歴を読み込んで表示
  await this.presenter.loadHistories();
  this.attachHistoryActionListeners();
}

private async showConfigTab(): Promise<void> {
  this.logger.info('Switching to config tab');

  // タブボタンの状態更新
  this.configTabBtn.classList.add('active');
  this.historyTabBtn.classList.remove('active');

  // 設定を読み込んで表示
  await this.loadConfigs();
}
```

**履歴アクション処理**:
```typescript
private async handleHistoryDetailView(historyId: string): Promise<void> {
  this.logger.info('Viewing history detail', { historyId });
  await this.presenter.showHistoryDetail(historyId);
}

private async handleHistoryCleanup(): Promise<void> {
  // 日数入力プロンプト
  const daysStr = prompt('何日より古い履歴を削除しますか？', '30');
  if (!daysStr) return;

  const days = parseInt(daysStr, 10);
  if (isNaN(days) || days < 1) {
    this.showError('有効な日数を入力してください');
    return;
  }

  // 確認ダイアログ
  if (!confirm(`${days}日より古い履歴をすべて削除します。よろしいですか？`)) {
    return;
  }

  // クリーンアップ実行
  this.logger.info('Cleaning up old histories', { olderThanDays: days });
  await this.presenter.cleanupHistories(days);

  // 履歴を再読み込み
  await this.showHistoryTab();
}
```

#### HTML/CSS 実装
**ファイル**: `public/storage-sync-manager.html` (+231行)

**タブスタイル** (38行):
```css
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.tab-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid transparent;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.9);
  color: #667eea;
  border-color: #667eea;
}
```

**履歴スタイル** (193行):
```css
/* 履歴ヘッダー */
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

/* 履歴アイテム */
.history-item {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* ステータスバッジ */
.history-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.history-status.status-success {
  background: #2ecc71;
  color: white;
}

.history-status.status-failed {
  background: #e74c3c;
  color: white;
}

.history-status.status-partial {
  background: #f39c12;
  color: white;
}

/* 詳細モーダル */
.modal-history-detail {
  max-width: 600px;
}

.detail-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.detail-row {
  display: flex;
  margin-bottom: 8px;
}

.detail-label {
  width: 120px;
  font-weight: 600;
  color: #666;
}

.detail-value {
  flex: 1;
  color: #333;
}

.detail-error {
  background: #fee;
  padding: 10px;
  border-radius: 4px;
}
```

#### イベントフロー

**履歴タブの表示**:
```
User clicks "📋 履歴" tab
  ↓
Controller.showHistoryTab()
  ↓
Update tab button states (active/inactive)
  ↓
Presenter.loadHistories()
  ↓
GetSyncHistoriesUseCase.execute({ limit: 50 })
  ↓
ChromeStorageSyncHistoryRepository.findRecent(50)
  ↓
View.showSyncHistories(histories)
  ↓
Render history list HTML
  ↓
Controller.attachHistoryActionListeners()
```

**詳細表示**:
```
User clicks "詳細を表示" button
  ↓
Controller.handleHistoryDetailView(historyId)
  ↓
Presenter.showHistoryDetail(historyId)
  ↓
GetSyncHistoriesUseCase.execute({ limit: 1000 })
  ↓
Find history by ID
  ↓
View.showHistoryDetail(history)
  ↓
Create and show modal with detailed information
```

**履歴クリーンアップ**:
```
User clicks "古い履歴を削除" button
  ↓
Controller.handleHistoryCleanup()
  ↓
Prompt for days (default: 30)
  ↓
Confirm deletion
  ↓
Presenter.cleanupHistories(days)
  ↓
CleanupSyncHistoriesUseCase.execute({ olderThanDays })
  ↓
ChromeStorageSyncHistoryRepository.deleteOlderThan(days)
  ↓
View.showSuccess("Cleaned up X old histories")
  ↓
Reload histories
```

#### ファイル変更サマリー

**新規作成**: なし

**修正ファイル** (4ファイル):
1. `src/presentation/storage-sync-manager/StorageSyncManagerPresenter.ts` (+78行)
   - IStorageSyncManagerView インターフェース拡張
   - Use Case 追加（コンストラクタ）
   - loadHistories(), showHistoryDetail(), cleanupHistories() 実装

2. `src/presentation/storage-sync-manager/StorageSyncManagerView.ts` (+310行)
   - showSyncHistories() 実装（履歴一覧）
   - showHistoryEmpty() 実装（空状態）
   - showHistoryDetail() 実装（詳細モーダル）
   - ヘルパーメソッド実装（formatDate, formatDuration, getStatusLabel）

3. `src/presentation/storage-sync-manager/index.ts` (+137行)
   - DOM 要素追加（historyTabBtn, configTabBtn）
   - Use Case 初期化（getSyncHistories, cleanupSyncHistories）
   - タブ切り替え実装（showHistoryTab, showConfigTab）
   - 履歴アクション処理（handleHistoryDetailView, handleHistoryCleanup）

4. `public/storage-sync-manager.html` (+231行)
   - タブナビゲーションHTML追加
   - タブスタイル追加（38行）
   - 履歴表示スタイル追加（193行）

**合計**: 756行追加

#### 使用例

**履歴の表示**:
```typescript
// Storage Sync Manager を開く
browser.action.openPopup();

// "📋 履歴" タブをクリック
// → 最近の50件の同期履歴が表示される

// 各履歴には以下が表示される:
// - ストレージキー
// - ステータス（成功/失敗/部分的成功）
// - 実行時刻と実行時間
// - 同期方向（双方向/受信のみ/送信のみ）
// - 受信結果（件数とステータス）
// - 送信結果（件数とステータス）
// - エラーメッセージ（失敗時）
// - リトライ回数（リトライ時）
```

**詳細の表示**:
```typescript
// 履歴アイテムの "詳細を表示" ボタンをクリック
// → モーダルで詳細情報が表示される

// モーダルには以下が表示される:
// - 基本情報（ID、Config ID、ストレージキー、方向、ステータス）
// - 実行時間（開始時刻、終了時刻、実行時間）
// - 受信結果（成功/失敗、件数、エラー）
// - 送信結果（成功/失敗、件数、エラー）
// - エラー情報（失敗時）
// - リトライ情報（リトライ時）
```

**古い履歴の削除**:
```typescript
// "古い履歴を削除" ボタンをクリック
// → 日数入力プロンプトが表示される

// 例: 30 と入力
// → "30日より古い履歴をすべて削除します。よろしいですか？" 確認ダイアログ
// → OK をクリック
// → CleanupSyncHistoriesUseCase が実行される
// → "Cleaned up X old histories" 通知が表示される
// → 履歴一覧が再読み込みされる
```

#### スクリーンショット（テキスト形式）

**履歴一覧画面**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔄 ストレージ同期設定管理                                     │
├─────────────────────────────────────────────────────────────┤
│ [⚙️ 設定] [📋 履歴]                                          │
├─────────────────────────────────────────────────────────────┤
│ 同期履歴 (すべての履歴)          [古い履歴を削除]            │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ userData               [✅ 成功]                         │ │
│ │ 2025/01/16 14:30:45 (2.5秒)                             │ │
│ │                                                          │ │
│ │ 方向: 双方向                                              │ │
│ │ ✅ 受信: 10件 / ✅ 送信: 5件                             │ │
│ │                                [詳細を表示]              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ productData            [❌ 失敗]                        │ │
│ │ 2025/01/16 14:25:30 (1.2秒)                             │ │
│ │                                                          │ │
│ │ 方向: 受信のみ                                            │ │
│ │ ❌ 受信: 0件                                             │ │
│ │ エラー: Connection timeout                               │ │
│ │ リトライ回数: 3                                           │ │
│ │                                [詳細を表示]              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**履歴詳細モーダル**:
```
┌─────────────────────────────────────────────────────────────┐
│ 同期履歴 詳細                                                 │
├─────────────────────────────────────────────────────────────┤
│ 基本情報                                                      │
│ 履歴ID:          sync-1737011234567-abc123                   │
│ Config ID:       config-123                                  │
│ ストレージキー:   userData                                    │
│ 同期方向:        双方向                                       │
│ ステータス:      ✅ 成功                                      │
│                                                              │
│ 実行時間                                                      │
│ 開始時刻:        2025/01/16 14:30:45                        │
│ 終了時刻:        2025/01/16 14:30:47                        │
│ 実行時間:        2.5秒                                        │
│                                                              │
│ 受信結果                                                      │
│ 成功:            はい                                         │
│ 受信件数:        10                                          │
│                                                              │
│ 送信結果                                                      │
│ 成功:            はい                                         │
│ 送信件数:        5                                           │
│                                                              │
│                                          [閉じる]            │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏳ 未完了タスク

### Task 4.8: テスト作成
**予定期間**: 3時間
**ステータス**: ⏳ 未着手

**予定実装内容**:
- SyncHistory のテスト
- RetryPolicy のテスト
- RetryExecutor のテスト
- 統合テスト

### Task 4.9: ドキュメント更新
**予定期間**: 1時間
**ステータス**: 🔄 進行中

**実装内容**:
- このドキュメントの完成
- 使用方法の記述
- トラブルシューティングガイド

---

## 📁 作成ファイル一覧

### Entity Files
1. `src/domain/entities/SyncHistory.ts` (177行) ✅
2. `src/domain/entities/RetryPolicy.ts` (149行) ✅
3. `src/domain/entities/SyncState.ts` (226行) ✅
4. `src/domain/entities/DataTransformer.ts` (389行) ✅
5. `src/domain/entities/BatchConfig.ts` (241行) ✅

### Repository Files
6. `src/domain/repositories/ISyncHistoryRepository.ts` (48行) ✅
7. `src/infrastructure/repositories/ChromeStorageSyncHistoryRepository.ts` (200行) ✅

### Service Files
8. `src/domain/services/RetryExecutor.ts` (202行) ✅
9. `src/domain/services/SyncStateNotifier.ts` (143行) ✅
10. `src/domain/services/DataTransformationService.ts` (335行) ✅
11. `src/domain/services/BatchProcessor.ts` (288行) ✅

### Use Case Files
12. `src/application/use-cases/sync/GetSyncHistoriesUseCase.ts` (70行) ✅
13. `src/application/use-cases/sync/CleanupSyncHistoriesUseCase.ts` (60行) ✅

### Modified Files
14. `src/domain/entities/StorageSyncConfig.ts` (+55行) ✅
15. `src/application/use-cases/sync/ExecuteManualSyncUseCase.ts` (+150行) ✅
16. `src/application/use-cases/sync/ExecuteReceiveStepsUseCase.ts` (+35行) ✅
17. `src/application/use-cases/sync/ExecuteSendStepsUseCase.ts` (+145行) ✅
18. `src/presentation/background/index.ts` (+10行) ✅
19. `src/presentation/storage-sync-manager/StorageSyncManagerPresenter.ts` (+78行) ✅
20. `src/presentation/storage-sync-manager/StorageSyncManagerView.ts` (+310行) ✅
21. `src/presentation/storage-sync-manager/index.ts` (+142行) ✅
22. `public/storage-sync-manager.html` (+231行) ✅

### Documentation Files
23. `docs/外部データソース連携/phase-4-progress.md` (このファイル) 🔄

**合計**: 23ファイル (13新規 + 9修正 + 1ドキュメント)
**合計行数**: 2,673行 (新規作成) + 1,156行 (修正) = 3,829行

---

## 🎯 実装品質

### アーキテクチャ準拠
- ✅ **Clean Architecture**: Entity, Repository, Service, Use Case 層の適切な実装
- ✅ **Domain-Driven Design**: SyncHistory, RetryPolicy などのドメインエンティティ
- ✅ **Repository Pattern**: 履歴データアクセスの抽象化
- ✅ **Service Layer**: RetryExecutor による再利用可能なロジック

### コード品質
- ✅ **TypeScript**: 完全な型安全性
- ✅ **Immutability**: エンティティの不変性維持
- ✅ **Error Handling**: 包括的エラーハンドリング
- ✅ **Logging**: 詳細なログ出力
- ⏳ **Testing**: 未実施

### 機能品質
- ✅ **History Tracking**: 同期実行の完全な記録
- ✅ **Retry Logic**: 設定可能で堅牢なリトライメカニズム
- ✅ **Exponential Backoff**: 効率的な再試行戦略
- ✅ **Storage Management**: 履歴の自動管理とクリーンアップ

---

## 🔧 使用方法

### 1. 同期履歴の取得

**すべての最近の履歴**:
```typescript
const result = await getSyncHistoriesUseCase.execute({ limit: 50 });
if (result.success) {
  result.histories?.forEach(history => {
    console.log(`${history.getId()}: ${history.getStatus()}`);
    console.log(`  Duration: ${history.getDuration()}ms`);
    console.log(`  Items: ${history.getTotalItems()}`);
  });
}
```

**特定Configの履歴**:
```typescript
const result = await getSyncHistoriesUseCase.execute({
  configId: 'config-123',
  limit: 20,
});
```

### 2. 古い履歴の削除

**30日より古い履歴を削除**:
```typescript
const result = await cleanupSyncHistoriesUseCase.execute({
  olderThanDays: 30,
});
console.log(`${result.deletedCount} 件の履歴を削除しました`);
```

### 3. リトライポリシーの設定

**Config作成時にリトライポリシーを指定**:
```typescript
const config = StorageSyncConfig.create({
  storageKey: 'testData',
  syncMethod: 'db',
  syncTiming: 'manual',
  syncDirection: 'bidirectional',
  retryPolicy: RetryPolicy.default(),  // デフォルトポリシー
  // ... 他のパラメータ
});
```

**カスタムリトライポリシー**:
```typescript
const customPolicy = RetryPolicy.fromData({
  maxAttempts: 5,           // 最大5回リトライ
  initialDelayMs: 2000,     // 初回2秒待機
  maxDelayMs: 60000,        // 最大60秒待機
  backoffMultiplier: 1.5,   // 1.5倍ずつ増加
  retryableErrors: [        // リトライ対象エラー
    'timeout',
    'network',
    'ECONNREFUSED',
  ],
});

const config = StorageSyncConfig.create({
  // ...
  retryPolicy: customPolicy,
});
```

**既存Configへのリトライポリシー追加**:
```typescript
const updatedConfig = existingConfig.setRetryPolicy(RetryPolicy.aggressive());
await repository.save(updatedConfig);
```

### 4. リトライ実行のログ確認

**Console での確認**:
```
[INFO] Starting manual sync { storageKey: "testData", syncDirection: "bidirectional", historyId: "sync-123", retryPolicy: { maxAttempts: 3, initialDelayMs: 1000 } }
[DEBUG] Executing Receive steps (attempt 1) { attemptNumber: 1, maxAttempts: 3 }
[WARN] Receive steps failed (attempt 1) { attemptNumber: 1, error: "Connection refused" }
[DEBUG] Waiting 1000ms before retry { attemptNumber: 1, delayMs: 1000 }
[DEBUG] Executing Receive steps (attempt 2) { attemptNumber: 2, maxAttempts: 3 }
[DEBUG] Receive steps succeeded { attemptNumber: 2, totalDelayMs: 1000 }
[INFO] Receive steps completed successfully { receivedCount: 10, attemptsMade: 2 }
```

---

## 🐛 トラブルシューティング

### 履歴が保存されない

**原因と対処**:
1. **SyncHistoryRepository が初期化されていない**: Background Worker を再起動
2. **Chrome Storage の容量不足**: 古い履歴を削除
3. **保存エラー**: ログでエラーメッセージを確認

**確認方法**:
```javascript
// Chrome DevTools > Application > Storage > Local Storage
browser.storage.local.get('syncHistories', (result) => {
  console.log('Sync histories:', result.syncHistories);
});
```

### リトライが動作しない

**原因と対処**:
1. **RetryPolicy が設定されていない**: デフォルトポリシーが使用される
2. **エラーパターンが一致しない**: retryableErrors を確認
3. **最大回数に達した**: maxAttempts を増やす

**デバッグ**:
```typescript
// リトライポリシーの確認
const policy = config.getRetryPolicy();
console.log('Max attempts:', policy?.getMaxAttempts());
console.log('Initial delay:', policy?.getInitialDelayMs());
console.log('Retryable errors:', policy?.getRetryableErrors());

// 遅延計算の確認
for (let i = 1; i <= 5; i++) {
  console.log(`Attempt ${i}: ${policy?.calculateDelay(i)}ms`);
}
```

### リトライが多すぎる

**原因と対処**:
1. **maxAttempts が大きすぎる**: 適切な値に調整
2. **retryableErrors が広すぎる**: 特定のエラーのみリトライするよう設定

**推奨設定**:
```typescript
// 通常の API 呼び出し
const moderate = RetryPolicy.fromData({
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['timeout', 'network', '5'],
});

// 重要な同期
const aggressive = RetryPolicy.fromData({
  maxAttempts: 5,
  initialDelayMs: 500,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [],  // すべてのエラーをリトライ
});

// クイック同期 (リトライなし)
const quick = RetryPolicy.noRetry();
```

---

## 📈 次のステップ

### 残りのPhase 4タスク

**Task 4.4: 同期状態監視機能実装**:
- リアルタイム進捗追跡
- WebSocket または Messaging API 使用
- UI への状態通知

**Task 4.5: データ変換機能実装**:
- フィールドマッピング
- データバリデーション
- カスタム変換ロジック

**Task 4.6: バッチ処理機能実装**:
- データ分割処理
- チャンク単位での同期
- 大量データ対応

**Task 4.7: UI更新（履歴表示）**:
- 履歴一覧画面
- 詳細表示
- フィルタリング

**Task 4.8: テスト作成**:
- 単体テスト (Entity, Service, Use Case)
- 統合テスト
- E2Eテスト

**Task 4.9: ドキュメント完成**:
- 使用方法の詳細化
- トラブルシューティング拡充
- アーキテクチャ図の作成

### 改善予定

**パフォーマンス**:
- 履歴の圧縮保存
- インデックス作成
- ページネーション

**機能拡張**:
- 履歴のエクスポート
- 統計情報の集計
- アラート機能

---

## 📝 備考

### 実装状況サマリー
Phase 4の Advanced Features 実装は78%完了しました。基盤となる履歴管理、リトライ機能、状態監視、データ変換、バッチ処理機能が実装され、さらに履歴表示UIも完成しました。同期システムがより堅牢で柔軟性の高いものになりました。

**完了項目**:
- ✅ 同期履歴エンティティとリポジトリ (3ファイル、425行)
- ✅ 履歴記録 Use Case (2ファイル、130行)
- ✅ エラーリトライ機能 (2ファイル、351行)
- ✅ 同期状態監視機能 (2ファイル、369行)
- ✅ データ変換機能 (2ファイル、724行)
- ✅ バッチ処理機能 (2ファイル、529行)
- ✅ Use Case 拡張 (履歴記録、リトライ、状態監視、データ変換、バッチ統合)
- ✅ UI更新（履歴表示） (4ファイル、756行)

**未完了項目**:
- ⏳ テスト作成
- ⏳ ドキュメント完成

### 技術的ハイライト
1. **Entity Pattern**: SyncHistory, RetryPolicy の適切な実装
2. **Repository Pattern**: 履歴データアクセスの抽象化
3. **Service Pattern**: RetryExecutor による再利用可能なロジック
4. **Exponential Backoff**: 効率的なリトライ戦略
5. **FIFO Storage**: 履歴の自動管理 (最大1000件)

### ディレクトリ構造
```
src/domain/
├── entities/
│   ├── SyncHistory.ts                 # NEW (177行)
│   ├── RetryPolicy.ts                 # NEW (149行)
│   └── StorageSyncConfig.ts           # MODIFIED (+20行)
├── repositories/
│   └── ISyncHistoryRepository.ts      # NEW (48行)
└── services/
    └── RetryExecutor.ts               # NEW (202行)

src/infrastructure/
└── repositories/
    └── ChromeStorageSyncHistoryRepository.ts  # NEW (200行)

src/application/use-cases/sync/
├── GetSyncHistoriesUseCase.ts         # NEW (70行)
├── CleanupSyncHistoriesUseCase.ts     # NEW (60行)
└── ExecuteManualSyncUseCase.ts        # MODIFIED (+110行)

src/presentation/
├── background/
│   └── index.ts                       # MODIFIED (+10行)
└── storage-sync-manager/
    └── index.ts                       # MODIFIED (+5行)

docs/外部データソース連携/
├── phase-3-progress.md                # Phase 3 完了報告
└── phase-4-progress.md                # Phase 4 進捗報告 (このファイル)
```

---

**実装開始日**: 2025-01-16
**最終更新日**: 2025-01-16
**実装者**: Claude
**レビュー**: 未実施
**次回作業**: Task 4.8 - テスト作成

---

## 🔄 Phase 4 進行中

Phase 4の Advanced Features 実装が進行中です。

**達成事項** (現在まで):
- ✅ 同期履歴エンティティとリポジトリ (425行)
- ✅ 履歴記録 Use Case (130行)
- ✅ エラーリトライ機能 (351行)
- ✅ 同期状態監視機能 (369行)
- ✅ データ変換機能 (724行)
- ✅ バッチ処理機能 (529行)
- ✅ Use Case 拡張 (350行)
- ✅ UI更新（履歴表示） (756行)

**総実装行数** (現在まで): 3,829行

同期システムの堅牢性と柔軟性が大幅に向上し、エラー時の自動リトライ、詳細な履歴記録、リアルタイム状態監視、データ変換、バッチ処理機能が可能になりました。さらに、ユーザーが履歴を視覚的に確認できるUIも完成しました。
