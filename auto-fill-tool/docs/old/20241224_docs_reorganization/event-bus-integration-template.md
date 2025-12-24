# EventBus統合テンプレート

## 基本パターン

### 1. インポート追加

```typescript
import { EventBus } from '@domain/events/EventBus';
import { 
  [EntityName]CreatedEvent, 
  [EntityName]UpdatedEvent, 
  [EntityName]DeletedEvent,
  [EntityName]OperationFailedEvent 
} from '@domain/events/events/[EntityName]Events';
```

### 2. コンストラクタ修正

```typescript
export class [UseCaseName] {
  constructor(
    private repository: [EntityName]Repository,
    private eventBus?: EventBus // Optional dependency for backward compatibility
  ) {}
}
```

### 3. 成功時イベント発行

```typescript
// Create操作の場合
this.eventBus?.publish(new [EntityName]CreatedEvent({
  [entityId]: entity.getId(),
  [entityName]: entity.getName(),
  timestamp: Date.now(),
}));

// Update操作の場合
this.eventBus?.publish(new [EntityName]UpdatedEvent({
  [entityId]: entity.getId(),
  changes: { /* 変更内容 */ },
  timestamp: Date.now(),
}));

// Delete操作の場合
this.eventBus?.publish(new [EntityName]DeletedEvent({
  [entityId]: entityId,
  timestamp: Date.now(),
}));
```

### 4. 失敗時イベント発行

```typescript
// Repository操作失敗時
this.eventBus?.publish(new [EntityName]OperationFailedEvent({
  operation: 'save', // 'update', 'delete', 'load'
  input,
  error: error instanceof Error ? error : new Error(String(error)),
  timestamp: Date.now(),
}));
```

### 5. try-catch全体での失敗イベント

```typescript
async execute(input: [InputType]): Promise<[OutputType]> {
  try {
    // メインロジック
    
    // 成功イベント発行
    this.eventBus?.publish(new [EntityName]CreatedEvent({ ... }));
    
    return { success: true, ... };
  } catch (error) {
    // 予期しないエラー時のイベント発行
    this.eventBus?.publish(new [EntityName]OperationFailedEvent({
      operation: 'execute',
      input,
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp: Date.now(),
    }));
    
    throw error;
  }
}
```

## テストパターン

### 1. テストファイルのインポート追加

```typescript
import { EventBus } from '@domain/events/EventBus';
```

### 2. モック作成

```typescript
let mockEventBus: jest.Mocked<EventBus>;

beforeEach(() => {
  mockEventBus = {
    publish: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    // その他必要なメソッド
  } as jest.Mocked<EventBus>;
  
  useCase = new [UseCaseName](mockRepository, mockEventBus);
});
```

### 3. イベント発行テスト

```typescript
it('should publish [EntityName]CreatedEvent on success', async () => {
  // Arrange
  mockRepository.save.mockResolvedValue(Result.success());
  
  // Act
  await useCase.execute(validInput);
  
  // Assert
  expect(mockEventBus.publish).toHaveBeenCalledWith(
    expect.objectContaining({
      eventType: '[EntityName]CreatedEvent',
      data: expect.objectContaining({
        [entityId]: expect.any(String),
        timestamp: expect.any(Number),
      }),
    })
  );
});

it('should publish [EntityName]OperationFailedEvent on error', async () => {
  // Arrange
  const error = new Error('Repository error');
  mockRepository.save.mockRejectedValue(error);
  
  // Act & Assert
  await expect(useCase.execute(validInput)).rejects.toThrow();
  
  expect(mockEventBus.publish).toHaveBeenCalledWith(
    expect.objectContaining({
      eventType: '[EntityName]OperationFailedEvent',
      data: expect.objectContaining({
        operation: 'execute',
        error: error,
        timestamp: expect.any(Number),
      }),
    })
  );
});
```

## 後方互換性

- EventBusは`Optional依存`として実装
- EventBusが未注入でも既存機能は正常動作
- テストでEventBusをundefinedにしても動作確認

## 注意事項

1. **イベント発行は非同期だが待機しない**: `await`を付けずに`fire-and-forget`パターン
2. **エラーハンドリング**: イベント発行失敗が元の処理に影響しないよう設計
3. **パフォーマンス**: イベント発行のオーバーヘッドは1ms以下を目標
