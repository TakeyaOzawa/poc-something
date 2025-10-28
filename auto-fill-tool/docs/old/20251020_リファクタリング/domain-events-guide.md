# Domain Events System Guide

## 概要

Domain Events（ドメインイベント）システムは、ビジネスロジックにおける重要な出来事を疎結合な方法で通知するためのメカニズムです。このガイドでは、イベントシステムの使い方と統合方法について説明します。

## なぜドメインイベントを使うのか？

### 利点

1. **疎結合**: イベント発行者は購読者を知る必要がない
2. **単一責任**: 各ハンドラーは1つの関心事のみに集中できる
3. **拡張性**: 新しいハンドラーを既存コードの変更なしに追加可能
4. **テスタビリティ**: 各ハンドラーを独立してテスト可能
5. **横断的関心事の管理**: ログ、通知、メトリクスなどを一元管理

### 使用例

- 自動入力完了時に通知を送信
- 操作のログとメトリクスを収集
- 複数のシステム間でデータを同期
- ビジネスイベントの監査ログを記録

---

## アーキテクチャ

```
src/domain/events/
├── DomainEvent.ts           # 基底イベントインターフェース
├── EventBus.ts              # イベントのパブリッシュ/サブスクライブ
├── EventHandler.ts          # ハンドラーインターフェース
├── events/                  # 具体的なドメインイベント
│   ├── AutoFillEvents.ts
│   ├── WebsiteEvents.ts
│   ├── XPathEvents.ts
│   └── SyncEvents.ts
└── examples/                # 使用例
    ├── LoggingEventHandler.ts
    ├── AutoFillNotificationHandler.ts
    └── SyncMetricsHandler.ts
```

---

## 基本的な使い方

### 1. EventBusの初期化

```typescript
import { EventBus } from '@domain/events';
import { Logger } from '@domain/services/Logger';

// EventBusのインスタンスを作成（通常はDIコンテナで管理）
const eventBus = new EventBus(logger);
```

### 2. イベントハンドラーの作成

#### 同期ハンドラー（シンプルな操作用）

```typescript
import { SyncEventHandler } from '@domain/events';
import { AutoFillCompletedEvent } from '@domain/events';

class SimpleLoggingHandler extends SyncEventHandler {
  handle(event: DomainEvent): void {
    console.log(`Event occurred: ${event.eventType}`);
  }
}
```

#### 非同期ハンドラー（I/O操作用）

```typescript
import { AsyncEventHandler } from '@domain/events';
import { AutoFillCompletedEvent } from '@domain/events';

class NotificationHandler extends AsyncEventHandler<AutoFillCompletedEvent> {
  async handle(event: AutoFillCompletedEvent): Promise<void> {
    await chrome.notifications.create({
      type: 'basic',
      title: 'Auto-Fill Completed',
      message: `Completed ${event.completedSteps} steps`,
    });
  }

  getSupportedEventTypes(): string[] {
    return ['AutoFillCompleted'];
  }
}
```

### 3. ハンドラーの登録

```typescript
// 特定のイベントタイプに対してハンドラーを登録
const handler = new NotificationHandler();
const subscriptionId = eventBus.subscribe('AutoFillCompleted', handler);

// 複数のイベントタイプに同じハンドラーを登録
eventBus.subscribeToMultiple(
  ['AutoFillCompleted', 'AutoFillFailed'],
  handler
);

// すべてのイベントに対してハンドラーを登録（ロギング用など）
const loggingHandler = new LoggingEventHandler(logger);
eventBus.subscribeToAll(loggingHandler);
```

### 4. イベントの発行

```typescript
import { AutoFillCompletedEvent } from '@domain/events';

// イベントを作成して発行
const event = new AutoFillCompletedEvent(
  tabId,
  websiteId,
  websiteName,
  totalSteps,
  completedSteps,
  duration
);

await eventBus.publish(event);
```

### 5. ハンドラーの登録解除

```typescript
// 特定のサブスクリプションを解除
eventBus.unsubscribe(subscriptionId);

// 特定のイベントタイプのすべてのハンドラーを解除
eventBus.unsubscribeAll('AutoFillCompleted');

// すべてのサブスクリプションをクリア
eventBus.clearAll();
```

---

## 利用可能なドメインイベント

### Auto-Fill イベント

#### AutoFillStartedEvent
自動入力が開始されたときに発行されます。

```typescript
const event = new AutoFillStartedEvent(
  tabId: number,
  websiteId: string,
  websiteName: string,
  totalSteps: number
);
```

#### AutoFillCompletedEvent
自動入力が正常に完了したときに発行されます。

```typescript
const event = new AutoFillCompletedEvent(
  tabId: number,
  websiteId: string,
  websiteName: string,
  totalSteps: number,
  completedSteps: number,
  duration: number  // ミリ秒
);
```

#### AutoFillFailedEvent
自動入力が失敗したときに発行されます。

```typescript
const event = new AutoFillFailedEvent(
  tabId: number,
  websiteId: string,
  websiteName: string,
  error: string,
  completedSteps: number,
  totalSteps: number,
  duration: number
);
```

#### AutoFillCancelledEvent
自動入力がキャンセルされたときに発行されます。

```typescript
const event = new AutoFillCancelledEvent(
  tabId: number,
  websiteId: string,
  websiteName: string,
  completedSteps: number,
  totalSteps: number,
  reason: string
);
```

#### AutoFillProgressUpdatedEvent
自動入力の進捗が更新されたときに発行されます。

```typescript
const event = new AutoFillProgressUpdatedEvent(
  tabId: number,
  websiteId: string,
  currentStep: number,
  totalSteps: number,
  currentAction: string
);
```

### Website イベント

- `WebsiteCreatedEvent`: Webサイトが作成された
- `WebsiteUpdatedEvent`: Webサイトが更新された
- `WebsiteDeletedEvent`: Webサイトが削除された
- `WebsiteStatusChangedEvent`: Webサイトのステータスが変更された
- `WebsiteDuplicatedEvent`: Webサイトが複製された

### XPath イベント

- `XPathCreatedEvent`: XPathが作成された
- `XPathUpdatedEvent`: XPathが更新された
- `XPathDeletedEvent`: XPathが削除された
- `XPathsImportedEvent`: XPathがインポートされた
- `XPathsExportedEvent`: XPathがエクスポートされた

### Sync イベント

- `SyncStartedEvent`: 同期が開始された
- `SyncCompletedEvent`: 同期が完了した
- `SyncFailedEvent`: 同期が失敗した
- `SyncConfigCreatedEvent`: 同期設定が作成された
- `SyncConfigUpdatedEvent`: 同期設定が更新された
- `SyncConfigDeletedEvent`: 同期設定が削除された
- `SyncConflictDetectedEvent`: 同期競合が検出された

---

## UseCaseへの統合

### パターン1: コンストラクタでEventBusを受け取る（推奨）

```typescript
import { EventBus } from '@domain/events';
import { AutoFillCompletedEvent } from '@domain/events';

export class ExecuteAutoFillUseCase {
  constructor(
    private xpathRepository: XPathRepository,
    private autoFillService: AutoFillService,
    private eventBus?: EventBus,  // Optional dependency
    private logger: Logger = new NoOpLogger()
  ) {}

  async execute(request: ExecuteAutoFillRequest): Promise<AutoFillResult> {
    const startTime = Date.now();

    // 既存のロジック
    const result = await this.autoFillService.executeAutoFill(
      request.tabId,
      xpaths,
      request.url,
      variables
    );

    // イベントを発行（EventBusが提供されている場合のみ）
    if (this.eventBus) {
      if (result.success) {
        await this.eventBus.publish(
          new AutoFillCompletedEvent(
            request.tabId,
            request.websiteId!,
            website.getName(),
            xpaths.length,
            result.processedSteps,
            Date.now() - startTime
          )
        );
      } else {
        await this.eventBus.publish(
          new AutoFillFailedEvent(
            request.tabId,
            request.websiteId!,
            website.getName(),
            result.error || 'Unknown error',
            result.processedSteps,
            xpaths.length,
            Date.now() - startTime
          )
        );
      }
    }

    return result;
  }
}
```

### パターン2: グローバルEventBusの使用（既存コードへの影響が少ない）

```typescript
// infrastructure/events/GlobalEventBus.ts
import { EventBus } from '@domain/events';
import { Logger } from '@domain/services/Logger';

class GlobalEventBusInstance {
  private static instance: EventBus | null = null;

  static initialize(logger: Logger): void {
    if (!GlobalEventBusInstance.instance) {
      GlobalEventBusInstance.instance = new EventBus(logger);
    }
  }

  static getInstance(): EventBus | null {
    return GlobalEventBusInstance.instance;
  }
}

export const getGlobalEventBus = GlobalEventBusInstance.getInstance;
export const initializeGlobalEventBus = GlobalEventBusInstance.initialize;
```

```typescript
// UseCaseでの使用
import { getGlobalEventBus } from '@infrastructure/events/GlobalEventBus';

export class SaveWebsiteUseCase {
  async execute(params: WebsiteParams): Promise<WebsiteData> {
    const website = Website.create(params);
    await this.websiteRepository.save(website);

    // グローバルEventBusからイベントを発行
    const eventBus = getGlobalEventBus();
    if (eventBus) {
      await eventBus.publish(
        new WebsiteCreatedEvent(
          website.getId(),
          website.getName(),
          website.getStatus()
        )
      );
    }

    return website.toData();
  }
}
```

---

## カスタムイベントハンドラーの作成

### ステップ1: ハンドラークラスの作成

```typescript
import { AsyncEventHandler } from '@domain/events';
import { WebsiteCreatedEvent } from '@domain/events';
import { DomainEvent } from '@domain/events';

export class WebsiteAnalyticsHandler extends AsyncEventHandler {
  constructor(
    private analyticsService: AnalyticsService,
    private logger: Logger
  ) {
    super();
  }

  async handle(event: DomainEvent): Promise<void> {
    if (event instanceof WebsiteCreatedEvent) {
      await this.handleWebsiteCreated(event);
    }
  }

  private async handleWebsiteCreated(event: WebsiteCreatedEvent): Promise<void> {
    try {
      await this.analyticsService.track('website_created', {
        websiteId: event.websiteId,
        websiteName: event.websiteName,
        timestamp: event.occurredAt,
      });
    } catch (error) {
      this.logger.error('Failed to track website creation', error);
    }
  }

  getSupportedEventTypes(): string[] {
    return ['WebsiteCreated'];
  }
}
```

### ステップ2: アプリケーション起動時にハンドラーを登録

```typescript
// presentation/background/index.ts
import { EventBus } from '@domain/events';
import { LoggingEventHandler } from '@domain/events/examples/LoggingEventHandler';
import { AutoFillNotificationHandler } from '@domain/events/examples/AutoFillNotificationHandler';

// EventBusの初期化
const eventBus = new EventBus(logger);

// グローバルハンドラーの登録（すべてのイベントをログ）
const loggingHandler = new LoggingEventHandler(logger);
eventBus.subscribeToAll(loggingHandler);

// 特定のイベント用ハンドラーの登録
const notificationHandler = new AutoFillNotificationHandler(logger);
eventBus.subscribeToMultiple(
  ['AutoFillCompleted', 'AutoFillFailed', 'AutoFillCancelled'],
  notificationHandler
);

// EventBusをDIコンテナやグローバルシングルトンとして保存
initializeGlobalEventBus(eventBus);
```

---

## ベストプラクティス

### 1. イベント命名規則

- **過去形を使用**: イベントは過去に起こったことを表す
  - ✅ `AutoFillCompleted`, `WebsiteCreated`
  - ❌ `AutoFillComplete`, `CreateWebsite`

### 2. イベントの不変性

- イベントは作成後に変更不可（`readonly`フィールド）
- 過去の出来事を変更することはできない

### 3. イベントハンドラーのエラーハンドリング

- ハンドラーでエラーが発生しても他のハンドラーに影響を与えない
- EventBusが自動的にエラーをキャッチしてログに記録
- クリティカルなエラーは適切にログに記録する

```typescript
async handle(event: DomainEvent): Promise<void> {
  try {
    // ハンドラーのロジック
  } catch (error) {
    this.logger.error('Handler error', { error, eventType: event.eventType });
    // エラーを再スローしない - 他のハンドラーが実行されるようにする
  }
}
```

### 4. 循環イベント発行の回避

- イベントハンドラー内から別のイベントを発行する際は注意
- EventBusは自動的にイベントをキューイングして循環を防ぐ
- ただし、無限ループには注意が必要

### 5. パフォーマンスの考慮

- ハンドラーは軽量に保つ
- 重い処理は非同期で実行
- 必要に応じてバッチ処理を検討

### 6. テスタビリティ

- ハンドラーは依存性注入を使用
- モックを使って独立してテスト可能にする

```typescript
describe('AutoFillNotificationHandler', () => {
  it('should send notification on AutoFillCompleted', async () => {
    const mockLogger = createMockLogger();
    const handler = new AutoFillNotificationHandler(mockLogger);

    const event = new AutoFillCompletedEvent(
      123,
      'website-1',
      'Test Website',
      10,
      10,
      5000
    );

    await handler.handle(event);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Auto-fill completed successfully',
      expect.any(Object)
    );
  });
});
```

---

## 実装例

### 例1: ログとメトリクスの収集

```typescript
import { SyncEventHandler } from '@domain/events';
import { DomainEvent } from '@domain/events';

export class MetricsCollectorHandler extends SyncEventHandler {
  private metrics = new Map<string, number>();

  handle(event: DomainEvent): void {
    const count = this.metrics.get(event.eventType) || 0;
    this.metrics.set(event.eventType, count + 1);
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}
```

### 例2: Chrome通知の送信

```typescript
import { AsyncEventHandler } from '@domain/events';
import { AutoFillCompletedEvent, AutoFillFailedEvent } from '@domain/events';

export class ChromeNotificationHandler extends AsyncEventHandler {
  async handle(event: DomainEvent): Promise<void> {
    if (event instanceof AutoFillCompletedEvent) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: '✅ Auto-Fill Completed',
        message: `${event.websiteName}: ${event.completedSteps} steps`,
      });
    } else if (event instanceof AutoFillFailedEvent) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: '❌ Auto-Fill Failed',
        message: `${event.websiteName}: ${event.error}`,
      });
    }
  }

  getSupportedEventTypes(): string[] {
    return ['AutoFillCompleted', 'AutoFillFailed'];
  }
}
```

### 例3: UIへのリアルタイム更新

```typescript
import { AsyncEventHandler } from '@domain/events';
import { AutoFillProgressUpdatedEvent } from '@domain/events';

export class ProgressUIHandler extends AsyncEventHandler {
  async handle(event: DomainEvent): Promise<void> {
    if (event instanceof AutoFillProgressUpdatedEvent) {
      // Chrome runtime messagingを使ってUIを更新
      await chrome.runtime.sendMessage({
        type: 'updateProgress',
        data: {
          tabId: event.tabId,
          currentStep: event.currentStep,
          totalSteps: event.totalSteps,
          action: event.currentAction,
        },
      });
    }
  }

  getSupportedEventTypes(): string[] {
    return ['AutoFillProgressUpdated'];
  }
}
```

---

## トラブルシューティング

### Q: イベントが発行されているのにハンドラーが呼ばれない

**A:** 以下を確認してください:
1. ハンドラーが正しく登録されているか
2. イベントタイプ名が正確に一致しているか
3. EventBusが正しく初期化されているか
4. ハンドラーでエラーが発生していないか（ログを確認）

### Q: ハンドラーで例外が発生した場合どうなるか？

**A:** EventBusは自動的にエラーをキャッチしてログに記録します。他のハンドラーは正常に実行され続けます。

### Q: イベントの発行順序は保証されるか？

**A:** はい。`publish()`は順次実行され、`publishMany()`で複数のイベントを発行した場合も順序が保証されます。

### Q: パフォーマンスへの影響は？

**A:** イベントシステム自体のオーバーヘッドは最小限です。ハンドラーの実行時間がパフォーマンスに影響します。重い処理は非同期で実行してください。

---

## 今後の拡張

### 検討中の機能

1. **イベント永続化**: イベントストアへの保存
2. **イベントリプレイ**: 過去のイベントの再生
3. **イベント集約**: 複数のイベントを1つにまとめる
4. **優先度付きハンドラー**: ハンドラーの実行順序を制御
5. **条件付きサブスクリプション**: フィルター条件付きでイベントを購読

---

## 参考資料

- [Domain Events - Martin Fowler](https://martinfowler.com/eaaDev/DomainEvent.html)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- Clean Architecture by Robert C. Martin
- Domain-Driven Design by Eric Evans

---

## 更新履歴

| 日付 | 内容 | 作成者 |
|-----|------|--------|
| 2025-10-17 | 初版作成 | Claude |
