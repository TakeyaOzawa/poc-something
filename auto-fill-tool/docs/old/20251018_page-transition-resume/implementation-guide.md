# 画面遷移対応自動入力機能 - 実装方針

## 設計原則

### 1. シンプルさを優先

**原則:**
- 複雑なデータ構造を避ける
- ネストしたJSONではなくフラットなフィールドを使用
- 処理の重複を避ける

**例:**
```typescript
// ❌ 悪い例: 複雑なネスト構造
resultDetail: JSON.stringify({
  progress: {
    current: { index: 5, url: 'https://...' },
    completed: [{ id: '...', step: 1 }, ...]
  }
});

// ✅ 良い例: フラットな構造
currentStepIndex: 5
lastExecutedUrl: 'https://...'
```

### 2. パフォーマンス重視

**原則:**
- ストレージへの書き込みを最小限に
- CHANGE_URLアクション時のみ状態保存
- メモリ上で状態を保持し、必要時のみ永続化

### 3. 既存機能との整合性

**原則:**
- 既存のリトライロジックと共存
- 既存のキャンセル機能と共存
- 既存のレコーディング機能と共存

### 4. エラー耐性

**原則:**
- 状態が破損していても通常の自動入力にフォールバック
- 古い実行状態は自動的に無視
- エラー時は明確にログ出力

## コーディング規約

### 1. 命名規則

**新規フィールド:**
```typescript
// AutomationResult
currentStepIndex: number;     // "next" ではなく "current" を使用
totalSteps: number;           // "count" ではなく "total" を使用
lastExecutedUrl: string;      // "lastUrl" ではなく明示的に
```

**メソッド名:**
```typescript
// 実行中状態の検索
findInProgressExecution()     // "search" ではなく "find"

// 次のステップ取得
getNextStep()                 // "fetch" ではなく "get"

// 進捗保存
saveProgress()                // "updateProgress" ではなく "save"

// 再開
resumeExecution()             // "continue" ではなく "resume"
```

### 2. ログ出力

**レベル:**
- `info`: 重要な状態遷移（実行開始、再開、完了）
- `debug`: 詳細情報（ステップ実行、進捗保存）
- `warn`: 想定内のエラー（古い実行状態、URLミスマッチ）
- `error`: 想定外のエラー（データ不整合、API失敗）

**例:**
```typescript
// ✅ 良い例: 構造化ログ
this.logger.info('Resuming auto-fill execution', {
  executionId: result.getId(),
  currentStep: result.getCurrentStepIndex(),
  totalSteps: result.getTotalSteps(),
  url: currentUrl
});

// ❌ 悪い例: 非構造化ログ
this.logger.info(`Resuming execution ${result.getId()} at step ${result.getCurrentStepIndex()}`);
```

### 3. エラーハンドリング

**パターン:**
```typescript
// パターン1: nullを返す（通常フローに影響なし）
private async findInProgressExecution(): Promise<AutomationResult | null> {
  try {
    // ...
  } catch (error) {
    this.logger.warn('Failed to find in-progress execution', error);
    return null; // エラーでも処理を継続
  }
}

// パターン2: エラーを投げる（実行を中断すべき）
private async loadXPaths(): Promise<XPathData[]> {
  const data = await this.repository.load();
  if (!data) {
    throw new Error('XPath data not found'); // 実行不可
  }
  return data;
}
```

### 4. 非同期処理

**await の使用:**
```typescript
// ✅ 良い例: 明示的な await
const result = await this.automationResultRepository.save(updated);

// ❌ 悪い例: await 忘れ
this.automationResultRepository.save(updated); // Promiseが無視される
```

**並列処理:**
```typescript
// ✅ 良い例: 独立した処理は並列実行
const [xpaths, variables] = await Promise.all([
  this.loadXPaths(request),
  this.loadVariables(request)
]);

// ❌ 悪い例: 不要な順次実行
const xpaths = await this.loadXPaths(request);
const variables = await this.loadVariables(request);
```

## 実装ガイドライン

### Phase 1: データモデル拡張

#### 1.1 AutomationResult エンティティ

**ファイル:** `src/domain/entities/AutomationResult.ts`

**変更内容:**
```typescript
interface AutomationResultData {
  // 既存フィールド
  id: string;
  automationVariablesId: string;
  executionStatus: string;
  resultDetail: string;
  startFrom: string;
  endTo: string | null;

  // 新規追加
  currentStepIndex: number;
  totalSteps: number;
  lastExecutedUrl: string;
}

class AutomationResult {
  // 既存メソッド
  // ...

  // 新規追加メソッド
  getCurrentStepIndex(): number {
    return this.data.currentStepIndex;
  }

  getTotalSteps(): number {
    return this.data.totalSteps;
  }

  getLastExecutedUrl(): string {
    return this.data.lastExecutedUrl;
  }

  setCurrentStepIndex(index: number): AutomationResult {
    return new AutomationResult({
      ...this.data,
      currentStepIndex: index
    });
  }

  setTotalSteps(total: number): AutomationResult {
    return new AutomationResult({
      ...this.data,
      totalSteps: total
    });
  }

  setLastExecutedUrl(url: string): AutomationResult {
    return new AutomationResult({
      ...this.data,
      lastExecutedUrl: url
    });
  }

  // ヘルパーメソッド
  getProgressPercentage(): number {
    if (this.data.totalSteps === 0) return 0;
    return Math.floor((this.data.currentStepIndex / this.data.totalSteps) * 100);
  }

  isInProgress(): boolean {
    return this.data.executionStatus === EXECUTION_STATUS.DOING;
  }
}
```

**テスト:**
```typescript
// src/domain/entities/__tests__/AutomationResult.test.ts

describe('AutomationResult - Progress tracking', () => {
  it('should track current step index', () => {
    const result = AutomationResult.create({
      automationVariablesId: 'var-1',
      executionStatus: EXECUTION_STATUS.DOING,
      currentStepIndex: 5,
      totalSteps: 20
    });

    expect(result.getCurrentStepIndex()).toBe(5);
    expect(result.getTotalSteps()).toBe(20);
  });

  it('should calculate progress percentage', () => {
    const result = AutomationResult.create({
      automationVariablesId: 'var-1',
      currentStepIndex: 5,
      totalSteps: 20
    });

    expect(result.getProgressPercentage()).toBe(25);
  });

  it('should update step index immutably', () => {
    const original = AutomationResult.create({
      automationVariablesId: 'var-1',
      currentStepIndex: 5
    });

    const updated = original.setCurrentStepIndex(10);

    expect(original.getCurrentStepIndex()).toBe(5);
    expect(updated.getCurrentStepIndex()).toBe(10);
  });
});
```

### Phase 2: ビジネスロジック実装

#### 2.1 ExecuteAutoFillUseCase

**ファイル:** `src/usecases/automation/ExecuteAutoFillUseCase.ts`

**変更内容:**
```typescript
class ExecuteAutoFillUseCase {
  async execute(request: ExecuteAutoFillRequest): Promise<AutoFillResult> {
    this.logger.info('Execute auto-fill request received', {
      tabId: request.tabId,
      url: request.url,
      websiteId: request.websiteId
    });

    // 1. 実行中状態のチェック
    const existingExecution = await this.checkExistingExecution(request);

    if (existingExecution) {
      this.logger.info('Found existing execution, resuming', {
        executionId: existingExecution.getId(),
        currentStep: existingExecution.getCurrentStepIndex()
      });

      return await this.resumeExecution(existingExecution, request);
    }

    // 2. 新規実行
    return await this.startNewExecution(request);
  }

  private async checkExistingExecution(
    request: ExecuteAutoFillRequest
  ): Promise<AutomationResult | null> {
    if (!request.websiteId) {
      return null; // websiteIdがない場合はスキップ
    }

    // websiteIdから最新のDOING状態を取得
    const results = await this.automationResultRepository.loadAll();
    const inProgress = results
      .filter(r => r.isInProgress())
      .filter(r => {
        // 24時間以内のもののみ
        const age = Date.now() - new Date(r.getStartFrom()).getTime();
        return age < 24 * 60 * 60 * 1000;
      });

    // TODO: websiteIdやURLでフィルタリング

    return inProgress.length > 0 ? inProgress[0] : null;
  }

  private async resumeExecution(
    existingResult: AutomationResult,
    request: ExecuteAutoFillRequest
  ): Promise<AutoFillResult> {
    const { xpaths, variables } = await this.loadAndValidateXPaths(request);
    const startIndex = existingResult.getCurrentStepIndex();

    // 続きから実行
    const result = await this.autoFillService.executeAutoFillWithProgress(
      request.tabId,
      xpaths.slice(startIndex),
      request.url,
      existingResult,
      variables,
      startIndex
    );

    await this.finalizeExecution(existingResult, result);

    return result;
  }

  private async startNewExecution(
    request: ExecuteAutoFillRequest
  ): Promise<AutoFillResult> {
    const { xpaths, variables } = await this.loadAndValidateXPaths(request);
    const automationResult = await this.setupAutomationResult(request);

    // 実行状態を初期化
    const initializedResult = automationResult
      .setExecutionStatus(EXECUTION_STATUS.DOING)
      .setCurrentStepIndex(0)
      .setTotalSteps(xpaths.length)
      .setLastExecutedUrl(request.url);

    await this.automationResultRepository.save(initializedResult);

    // 実行
    const result = await this.autoFillService.executeAutoFillWithProgress(
      request.tabId,
      xpaths,
      request.url,
      initializedResult,
      variables,
      0
    );

    await this.finalizeExecution(initializedResult, result);

    return result;
  }

  private async finalizeExecution(
    automationResult: AutomationResult,
    result: AutoFillResult
  ): Promise<void> {
    const finalStatus = result.success
      ? EXECUTION_STATUS.SUCCESS
      : EXECUTION_STATUS.FAILED;

    const finalDetail = result.success
      ? `Successfully processed ${result.processedSteps} steps`
      : `Failed at step ${result.failedStep}: ${result.error}`;

    const finalResult = automationResult
      .setExecutionStatus(finalStatus)
      .setResultDetail(finalDetail)
      .setEndTo(new Date().toISOString());

    await this.automationResultRepository.save(finalResult);

    this.logger.info('Auto-fill execution finalized', {
      status: finalStatus,
      processedSteps: result.processedSteps
    });
  }
}
```

**テスト:**
```typescript
// src/usecases/automation/__tests__/ExecuteAutoFillUseCase.test.ts

describe('ExecuteAutoFillUseCase - Resume capability', () => {
  it('should start new execution if no in-progress found', async () => {
    mockRepository.loadAll.mockResolvedValue([]);

    const result = await useCase.execute(request);

    expect(mockAutoFillService.executeAutoFillWithProgress).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([/* all xpaths */]),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      0 // startOffset = 0
    );
  });

  it('should resume execution if in-progress found', async () => {
    const inProgressResult = AutomationResult.create({
      automationVariablesId: 'var-1',
      executionStatus: EXECUTION_STATUS.DOING,
      currentStepIndex: 5,
      totalSteps: 10
    });

    mockRepository.loadAll.mockResolvedValue([inProgressResult]);

    const result = await useCase.execute(request);

    expect(mockAutoFillService.executeAutoFillWithProgress).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([/* xpaths from index 5 */]),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      5 // startOffset = 5
    );
  });

  it('should ignore in-progress execution older than 24 hours', async () => {
    const oldDate = new Date();
    oldDate.setHours(oldDate.getHours() - 25); // 25時間前

    const oldResult = AutomationResult.create({
      automationVariablesId: 'var-1',
      executionStatus: EXECUTION_STATUS.DOING,
      startFrom: oldDate.toISOString()
    });

    mockRepository.loadAll.mockResolvedValue([oldResult]);

    const result = await useCase.execute(request);

    // 新規実行として扱われる
    expect(mockAutoFillService.executeAutoFillWithProgress).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      0 // startOffset = 0
    );
  });
});
```

#### 2.2 ChromeAutoFillAdapter

**ファイル:** `src/infrastructure/adapters/ChromeAutoFillAdapter.ts`

**新規メソッド追加:**
```typescript
class ChromeAutoFillAdapter implements AutoFillService {
  // 既存メソッド
  async executeAutoFill(/* ... */): Promise<AutoFillResult> {
    // 既存実装を維持（後方互換性）
  }

  // 新規メソッド: 進捗管理付き実行
  async executeAutoFillWithProgress(
    tabId: number,
    xpaths: XPathData[],
    url: string,
    automationResult: AutomationResult,
    variables?: VariableCollection,
    startOffset: number = 0
  ): Promise<AutoFillResult> {
    try {
      const sortedXPaths = this.xpathSelectionService.sortByExecutionOrder(xpaths);
      this.logger.info('Starting auto-fill with progress tracking', {
        totalSteps: sortedXPaths.length,
        startOffset
      });

      for (let i = 0; i < sortedXPaths.length; i++) {
        const xpath = sortedXPaths[i];
        const absoluteIndex = startOffset + i;

        // キャンセルチェック
        if (this.isCancelled(tabId)) {
          return {
            success: false,
            processedSteps: i,
            failedStep: xpath.executionOrder,
            error: 'Auto-fill cancelled by user'
          };
        }

        // ステップ実行
        const result = await this.executeStep(tabId, xpath, variables, i, sortedXPaths.length);

        if (!result.success) {
          return {
            success: false,
            processedSteps: i,
            failedStep: xpath.executionOrder,
            error: result.error
          };
        }

        // CHANGE_URLアクション後のみ進捗保存
        if (xpath.actionType === ACTION_TYPE.CHANGE_URL) {
          await this.saveProgress(
            automationResult,
            absoluteIndex + 1,
            xpath.url
          );
        }

        // afterWaitSeconds処理
        if (xpath.afterWaitSeconds > 0) {
          await this.sleepWithCancellation(tabId, xpath.afterWaitSeconds * 1000);
        }
      }

      return { success: true, processedSteps: sortedXPaths.length };
    } catch (error) {
      this.logger.error('Auto-fill execution error', error);
      return {
        success: false,
        processedSteps: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async saveProgress(
    automationResult: AutomationResult,
    nextStepIndex: number,
    lastUrl: string
  ): Promise<void> {
    try {
      const updated = automationResult
        .setCurrentStepIndex(nextStepIndex)
        .setLastExecutedUrl(lastUrl);

      await this.automationResultRepository.save(updated);

      this.logger.debug('Progress saved', {
        executionId: updated.getId(),
        currentStep: nextStepIndex,
        totalSteps: updated.getTotalSteps(),
        progress: `${updated.getProgressPercentage()}%`
      });
    } catch (error) {
      // 進捗保存の失敗は実行を止めない
      this.logger.warn('Failed to save progress, continuing execution', error);
    }
  }
}
```

### Phase 3: Content Script実装

#### 3.1 AutoFillHandler

**ファイル:** `src/presentation/content-script/AutoFillHandler.ts`

**変更内容:**
```typescript
class AutoFillHandler {
  async handlePageLoad(): Promise<void> {
    const currentUrl = window.location.href;

    this.logger.debug('Page loaded, checking for auto-fill', { currentUrl });

    // 1. 実行中の自動入力をチェック
    const inProgressExecution = await this.findInProgressExecution(currentUrl);

    if (inProgressExecution) {
      this.logger.info('Found in-progress execution, resuming', {
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
    try {
      const results = await this.automationResultRepository.loadAll();

      // DOING状態のものを抽出
      const inProgress = results.filter(r => r.isInProgress());

      // 24時間以内のもののみ
      const now = Date.now();
      const validResults = inProgress.filter(r => {
        const age = now - new Date(r.getStartFrom()).getTime();
        return age < 24 * 60 * 60 * 1000;
      });

      this.logger.debug('Found in-progress executions', {
        count: validResults.length
      });

      // 現在のURLとマッチするものを探す
      for (const result of validResults) {
        const nextStep = await this.getNextStep(result);

        if (nextStep) {
          this.logger.debug('Checking URL match', {
            currentUrl,
            nextStepUrl: nextStep.url
          });

          if (this.urlMatches(currentUrl, nextStep.url)) {
            return result;
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.warn('Failed to find in-progress execution', error);
      return null;
    }
  }

  private async getNextStep(
    result: AutomationResult
  ): Promise<XPathData | null> {
    try {
      // AutomationVariablesからXPathデータを取得
      const variables = await this.automationVariablesRepository.load(
        result.getAutomationVariablesId()
      );

      if (!variables) {
        this.logger.warn('AutomationVariables not found', {
          variablesId: result.getAutomationVariablesId()
        });
        return null;
      }

      const xpaths = await this.loadXPathsFromVariables(variables);
      const nextIndex = result.getCurrentStepIndex();

      if (nextIndex >= xpaths.length) {
        this.logger.warn('Next step index out of bounds', {
          nextIndex,
          totalSteps: xpaths.length
        });
        return null;
      }

      return xpaths[nextIndex];
    } catch (error) {
      this.logger.error('Failed to get next step', error);
      return null;
    }
  }

  private urlMatches(currentUrl: string, targetUrl: string): boolean {
    return this.urlMatchingService.matches(currentUrl, targetUrl);
  }

  private async resumeAutoFill(result: AutomationResult): Promise<void> {
    try {
      const tabId = await this.getCurrentTabId();

      const response = await this.messageDispatcher.send({
        action: 'resumeAutoFill',
        executionId: result.getId(),
        tabId,
        url: window.location.href
      });

      if (!response.success) {
        this.logger.error('Failed to resume auto-fill', {
          error: response.error
        });
      }
    } catch (error) {
      this.logger.error('Error resuming auto-fill', error);
    }
  }

  private async getCurrentTabId(): Promise<number> {
    // chrome.runtime.sendMessage経由でbackgroundから取得
    const response = await this.messageDispatcher.send({
      action: 'getCurrentTabId'
    });
    return response.tabId;
  }
}
```

### Phase 4: Background Script実装

#### 4.1 Message Handler

**ファイル:** `src/infrastructure/background/index.ts`

**追加内容:**
```typescript
// 再開リクエストハンドラ
messageDispatcher.on('resumeAutoFill', async (message) => {
  const { executionId, tabId, url } = message;

  logger.info('Resume auto-fill request received', {
    executionId,
    tabId,
    url
  });

  try {
    // AutomationResultを取得
    const result = await automationResultRepository.load(executionId);

    if (!result) {
      logger.error('AutomationResult not found', { executionId });
      return { success: false, error: 'Execution not found' };
    }

    if (!result.isInProgress()) {
      logger.warn('AutomationResult is not in DOING state', {
        executionId,
        status: result.getExecutionStatus()
      });
      return { success: false, error: 'Execution not in progress' };
    }

    // AutomationVariablesを取得
    const variables = await automationVariablesRepository.load(
      result.getAutomationVariablesId()
    );

    if (!variables) {
      logger.error('AutomationVariables not found', {
        variablesId: result.getAutomationVariablesId()
      });
      return { success: false, error: 'Variables not found' };
    }

    // 再開リクエストを構築
    const request: ExecuteAutoFillRequest = {
      tabId,
      url,
      websiteId: variables.getWebsiteId(),
      xpathCollectionId: variables.getXpathCollectionId(),
      variables: variables.getVariables()
    };

    // UseCaseを通じて実行（内部で再開判定される）
    const autoFillResult = await executeAutoFillUseCase.execute(request);

    return { success: autoFillResult.success };
  } catch (error) {
    logger.error('Failed to resume auto-fill', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// 現在のタブID取得ハンドラ（Content Scriptから呼ばれる）
messageDispatcher.on('getCurrentTabId', async (message, sender) => {
  return { tabId: sender.tab?.id || -1 };
});
```

## チェックリスト

実装完了時に以下を確認：

### コード品質
- [ ] 全てのpublicメソッドにJSDocコメントを記述
- [ ] TypeScriptの型エラーなし
- [ ] ESLintエラー/警告なし
- [ ] Prettierフォーマット済み

### テスト
- [ ] ユニットテストカバレッジ80%以上
- [ ] 全ての新規メソッドにテストあり
- [ ] エッジケースのテストあり
- [ ] 統合テスト実装

### ドキュメント
- [ ] README更新（機能説明追加）
- [ ] CHANGELOGに変更内容記載
- [ ] APIドキュメント生成

### 動作確認
- [ ] 複数ページフォームで動作確認
- [ ] ネットワークエラー後の再開確認
- [ ] 既存の自動入力機能に影響なし
- [ ] パフォーマンス劣化なし
