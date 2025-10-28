# 画面遷移対応自動入力機能 - 内部仕様

## アーキテクチャ概要

```
┌─────────────────┐
│  Content Script │ ← ページロード時に状態チェック
└────────┬────────┘
         │ メッセージ
         ↓
┌─────────────────┐
│ Background      │ ← 自動入力実行とステート管理
│ Service Worker  │
└────────┬────────┘
         │ 保存/読み込み
         ↓
┌─────────────────┐
│ Chrome Storage  │ ← AutomationResult (実行状態)
│ (local)         │
└─────────────────┘
```

## データ構造

### AutomationResult（拡張版）

既存の `AutomationResultData` に以下のフィールドを追加：

```typescript
interface AutomationResultData {
  // 既存フィールド
  id: string;
  automationVariablesId: string;
  executionStatus: 'ready' | 'doing' | 'success' | 'failed';
  resultDetail: string;
  startFrom: string;
  endTo: string | null;

  // 新規追加フィールド
  currentStepIndex: number;        // 次に実行すべきステップのインデックス (0-based)
  totalSteps: number;              // 総ステップ数
  lastExecutedUrl: string;         // 最後に実行されたページのURL
}
```

**設計方針:**
- シンプルに保つため、JSON化された複雑な構造を避ける
- `resultDetail` は引き続きエラーメッセージや完了メッセージのみに使用
- 進捗情報は専用フィールドで管理

### ExecutionStatus

```typescript
const EXECUTION_STATUS = {
  READY: 'ready',      // 未実行
  DOING: 'doing',      // 実行中（画面遷移で継続可能）
  SUCCESS: 'success',  // 完了
  FAILED: 'failed',    // 失敗
} as const;
```

**状態遷移:**
```
READY → DOING → SUCCESS
              ↘ FAILED
```

## コンポーネント設計

### 1. ExecuteAutoFillUseCase（変更）

**責務:**
- 自動入力の実行オーケストレーション
- 実行状態の初期化と更新

**変更点:**
```typescript
class ExecuteAutoFillUseCase {
  async execute(request: ExecuteAutoFillRequest): Promise<AutoFillResult> {
    // 1. 既存の実行中状態をチェック
    const existingExecution = await this.checkExistingExecution(request);

    if (existingExecution) {
      // 既存の実行を再開
      return await this.resumeExecution(existingExecution, request);
    }

    // 2. 新規実行
    const automationResult = await this.createAutomationResult(request);
    return await this.executeNewAutomation(automationResult, request);
  }

  private async executeNewAutomation(
    automationResult: AutomationResult,
    request: ExecuteAutoFillRequest
  ): Promise<AutoFillResult> {
    const xpaths = await this.loadXPaths(request);

    // 実行状態を初期化
    automationResult = automationResult
      .setExecutionStatus(EXECUTION_STATUS.DOING)
      .setCurrentStepIndex(0)
      .setTotalSteps(xpaths.length)
      .setLastExecutedUrl(request.url);

    await this.automationResultRepository.save(automationResult);

    // 自動入力実行
    const result = await this.autoFillService.executeAutoFillWithProgress(
      request.tabId,
      xpaths,
      request.url,
      automationResult,
      request.variables
    );

    // 最終状態を保存
    await this.finalizeExecution(automationResult, result);

    return result;
  }

  private async resumeExecution(
    existingResult: AutomationResult,
    request: ExecuteAutoFillRequest
  ): Promise<AutoFillResult> {
    const xpaths = await this.loadXPaths(request);
    const startIndex = existingResult.getCurrentStepIndex();

    // 続きから実行
    const result = await this.autoFillService.executeAutoFillWithProgress(
      request.tabId,
      xpaths.slice(startIndex), // 未実行ステップのみ
      request.url,
      existingResult,
      request.variables,
      startIndex  // オフセット
    );

    await this.finalizeExecution(existingResult, result);

    return result;
  }
}
```

### 2. ChromeAutoFillAdapter（変更）

**責務:**
- ステップごとの実行
- CHANGE_URLアクション後の進捗保存

**変更点:**
```typescript
class ChromeAutoFillAdapter {
  async executeAutoFillWithProgress(
    tabId: number,
    xpaths: XPathData[],
    url: string,
    automationResult: AutomationResult,
    variables?: VariableCollection,
    startOffset: number = 0
  ): Promise<AutoFillResult> {

    for (let i = 0; i < xpaths.length; i++) {
      const xpath = xpaths[i];
      const absoluteIndex = startOffset + i;

      // ステップ実行
      const result = await this.executeStep(tabId, xpath, variables);

      if (!result.success) {
        return {
          success: false,
          processedSteps: i,
          failedStep: xpath.executionOrder,
          error: result.error
        };
      }

      // CHANGE_URLアクションの後のみ進捗を保存
      if (xpath.actionType === ACTION_TYPE.CHANGE_URL) {
        await this.saveProgress(
          automationResult,
          absoluteIndex + 1,  // 次のステップ
          xpath.url
        );
      }
    }

    return { success: true, processedSteps: xpaths.length };
  }

  private async saveProgress(
    automationResult: AutomationResult,
    nextStepIndex: number,
    lastUrl: string
  ): Promise<void> {
    const updated = automationResult
      .setCurrentStepIndex(nextStepIndex)
      .setLastExecutedUrl(lastUrl);

    await this.automationResultRepository.save(updated);

    this.logger.debug('Progress saved', {
      currentStep: nextStepIndex,
      totalSteps: updated.getTotalSteps(),
      lastUrl
    });
  }
}
```

### 3. AutoFillHandler（Content Script, 変更）

**責務:**
- ページロード時の実行中状態チェック
- 再開判定とトリガー

**変更点:**
```typescript
class AutoFillHandler {
  async handlePageLoad(): Promise<void> {
    const currentUrl = window.location.href;

    // 1. 実行中の自動入力をチェック
    const inProgressExecution = await this.findInProgressExecution(currentUrl);

    if (inProgressExecution) {
      this.logger.info('Found in-progress execution, resuming...', {
        executionId: inProgressExecution.getId(),
        currentStep: inProgressExecution.getCurrentStepIndex(),
        totalSteps: inProgressExecution.getTotalSteps()
      });

      await this.resumeAutoFill(inProgressExecution);
      return;
    }

    // 2. 通常の自動入力開始判定
    await this.startNewAutoFillIfMatched();
  }

  private async findInProgressExecution(
    currentUrl: string
  ): Promise<AutomationResult | null> {
    const results = await this.automationResultRepository.loadAll();

    // DOING状態のものを抽出
    const inProgress = results.filter(
      r => r.getExecutionStatus() === EXECUTION_STATUS.DOING
    );

    // 古すぎる実行状態をクリーンアップ（24時間以上前）
    const now = Date.now();
    const validResults = inProgress.filter(r => {
      const age = now - new Date(r.getStartFrom()).getTime();
      return age < 24 * 60 * 60 * 1000; // 24時間
    });

    // 現在のURLとマッチする次のステップを持つものを探す
    for (const result of validResults) {
      const nextStep = await this.getNextStep(result);

      if (nextStep && this.urlMatches(currentUrl, nextStep.url)) {
        return result;
      }
    }

    return null;
  }

  private async getNextStep(
    result: AutomationResult
  ): Promise<XPathData | null> {
    // AutomationVariablesからXPathデータを取得
    const variables = await this.automationVariablesRepository.load(
      result.getAutomationVariablesId()
    );

    if (!variables) return null;

    const xpaths = await this.loadXPathsFromVariables(variables);
    const nextIndex = result.getCurrentStepIndex();

    if (nextIndex >= xpaths.length) return null;

    return xpaths[nextIndex];
  }

  private urlMatches(currentUrl: string, targetUrl: string): boolean {
    return this.urlMatchingService.matches(currentUrl, targetUrl);
  }

  private async resumeAutoFill(result: AutomationResult): Promise<void> {
    // Background scriptに再開リクエストを送信
    await this.messageDispatcher.send({
      action: 'resumeAutoFill',
      executionId: result.getId(),
      tabId: await this.getCurrentTabId(),
      url: window.location.href
    });
  }
}
```

### 4. Background Message Handler（新規）

**責務:**
- `resumeAutoFill` メッセージの処理

```typescript
// src/infrastructure/background/index.ts に追加

messageDispatcher.on('resumeAutoFill', async (message) => {
  const { executionId, tabId, url } = message;

  try {
    // AutomationResultを取得
    const result = await automationResultRepository.load(executionId);

    if (!result || result.getExecutionStatus() !== EXECUTION_STATUS.DOING) {
      logger.warn('Cannot resume: execution not found or not in DOING state', {
        executionId
      });
      return { success: false, error: 'Execution not resumable' };
    }

    // UseCaseを通じて再開
    const automationVariables = await automationVariablesRepository.load(
      result.getAutomationVariablesId()
    );

    const request: ExecuteAutoFillRequest = {
      tabId,
      url,
      websiteId: automationVariables.getWebsiteId(),
      xpathCollectionId: automationVariables.getXpathCollectionId(),
      variables: automationVariables.getVariables()
    };

    const autoFillResult = await executeAutoFillUseCase.execute(request);

    return { success: autoFillResult.success };
  } catch (error) {
    logger.error('Failed to resume auto-fill', error);
    return { success: false, error: error.message };
  }
});
```

## データフロー

### 新規実行時

```
1. Content Script: ページロード検知
   ↓
2. Content Script: 実行中状態チェック → なし
   ↓
3. Content Script: 通常の自動入力判定 → マッチ
   ↓
4. Background: ExecuteAutoFillUseCase.execute()
   ↓
5. Background: AutomationResult作成 (status=DOING, currentStepIndex=0)
   ↓
6. Background: ステップ実行ループ
   ├─ 各ステップ実行
   └─ CHANGE_URL後 → 進捗保存 (currentStepIndex更新)
   ↓
7. 画面遷移発生 → 新しいページ読み込み
   ↓
8. Content Script: ページロード検知
   ↓
9. Content Script: 実行中状態チェック → あり（currentStepIndex=5）
   ↓
10. Content Script: resumeAutoFill メッセージ送信
   ↓
11. Background: ステップ5から再開
   ↓
12. 全ステップ完了
   ↓
13. Background: AutomationResult更新 (status=SUCCESS)
```

### エラー時

```
1. ステップ実行中にエラー
   ↓
2. Background: AutomationResult更新 (status=FAILED, resultDetail=エラー内容)
   ↓
3. Content Script: 次のページロード時に実行中状態なし（FAILED状態）
   ↓
4. Content Script: 通常の新規自動入力判定へ
```

## パフォーマンス最適化

### 1. 進捗保存の最小化

**戦略:** CHANGE_URLアクション後のみ保存

**理由:**
- 画面遷移が発生するタイミングでのみ再開が必要
- 同一ページ内のステップは高速に連続実行されるため、途中保存は不要
- Chrome Storageへの書き込み回数を大幅削減

**例:**
```
Step 1: TYPE (保存しない)
Step 2: TYPE (保存しない)
Step 3: CLICK (保存しない)
Step 4: CHANGE_URL → ページ遷移 (保存する★)
Step 5: TYPE (保存しない)
Step 6: TYPE (保存しない)
Step 7: CLICK (保存しない)
Step 8: CHANGE_URL → ページ遷移 (保存する★)
```

### 2. 古い実行状態のクリーンアップ

24時間以上経過したDOING状態のレコードは無視する。

```typescript
// AutoFillHandlerで実装
const age = now - new Date(result.getStartFrom()).getTime();
if (age >= 24 * 60 * 60 * 1000) {
  // 古すぎるので無視
  continue;
}
```

定期的なクリーンアップバッチ（オプション）:
```typescript
// Background scriptで1日1回実行
setInterval(async () => {
  await cleanupOldExecutions();
}, 24 * 60 * 60 * 1000);
```

## エラーハンドリング

### 1. 次のステップが見つからない

```typescript
const nextStep = await this.getNextStep(result);
if (!nextStep) {
  logger.warn('Next step not found, marking as failed');
  await this.markAsFailed(result, 'Next step configuration missing');
  return null;
}
```

### 2. URLが一致しない

```typescript
if (!this.urlMatches(currentUrl, nextStep.url)) {
  // 一致しない場合は何もしない（通常の自動入力判定へ）
  return null;
}
```

### 3. AutomationResultが見つからない

```typescript
const result = await automationResultRepository.load(executionId);
if (!result) {
  logger.error('AutomationResult not found', { executionId });
  return { success: false, error: 'Execution not found' };
}
```

## セキュリティ考慮事項

### 1. タブIDの検証

再開時のタブIDが正当なものか確認：
```typescript
const tab = await chrome.tabs.get(tabId);
if (!tab) {
  throw new Error('Invalid tab ID');
}
```

### 2. URL検証

XPathデータのURLが信頼できるものか確認（既存のロジックを流用）

## テスト戦略

### 1. ユニットテスト

- `AutomationResult`の新規フィールドのgetter/setter
- `findInProgressExecution()`のロジック
- `getNextStep()`のロジック

### 2. 統合テスト

- 新規実行 → CHANGE_URL → 進捗保存の確認
- ページロード → 実行中状態検出 → 再開の確認
- エラー時の状態遷移

### 3. E2Eテスト

- 実際の複数ページフォームでの動作確認
- ネットワークエラー後の再開確認
