# テスト更新ガイド

## 概要

Resultパターンへの移行に伴い、テストを更新する必要があります。このガイドでは、テスト更新の方法とパターンを説明します。

---

## 更新パターン

### パターン1: バリデーションありのメソッド

#### Before

```typescript
it('should throw error if value is invalid', () => {
  const settings = new SystemSettingsCollection();
  expect(() => settings.withRetryCount(-2)).toThrow(
    'Retry count must be -1 (infinite) or non-negative'
  );
});
```

#### After

```typescript
it('should return failure if value is invalid', () => {
  const settings = new SystemSettingsCollection();
  const result = settings.withRetryCount(-2);
  expect(result.isFailure).toBe(true);
  expect(result.error!.message).toContain('Retry count must be -1 (infinite) or non-negative');
});
```

### パターン2: バリデーションなしのメソッド

#### Before

```typescript
it('should return new instance with updated value', () => {
  const settings = new SystemSettingsCollection();
  const updated = settings.withLogLevel(LogLevel.DEBUG);
  expect(updated.getLogLevel()).toBe(LogLevel.DEBUG);
});
```

#### After

```typescript
it('should return new instance with updated value', () => {
  const settings = new SystemSettingsCollection();
  const result = settings.withLogLevel(LogLevel.DEBUG);
  expect(result.isSuccess).toBe(true);
  const updated = unwrapResult(result);
  expect(updated.getLogLevel()).toBe(LogLevel.DEBUG);
});
```

### パターン3: チェーンメソッド

#### Before

```typescript
it('should chain immutable operations', () => {
  const settings = new SystemSettingsCollection();
  const updated = settings
    .withRetryWaitSecondsRange(10, 20)
    .withRetryCount(5)
    .withLogLevel(LogLevel.DEBUG);

  expect(updated.getRetryWaitSecondsMin()).toBe(10);
  expect(updated.getRetryCount()).toBe(5);
  expect(updated.getLogLevel()).toBe(LogLevel.DEBUG);
});
```

#### After

```typescript
it('should chain immutable operations', () => {
  const settings = new SystemSettingsCollection();

  const step1 = unwrapResult(settings.withRetryWaitSecondsRange(10, 20));
  const step2 = unwrapResult(step1.withRetryCount(5));
  const updated = unwrapResult(step2.withLogLevel(LogLevel.DEBUG));

  expect(updated.getRetryWaitSecondsMin()).toBe(10);
  expect(updated.getRetryCount()).toBe(5);
  expect(updated.getLogLevel()).toBe(LogLevel.DEBUG);
});
```

または、ヘルパー関数を使用：

```typescript
// ヘルパー関数
function chainResults<T>(initial: T, ...operations: Array<(value: T) => Result<T, Error>>): T {
  return operations.reduce((acc, op) => unwrapResult(op(acc)), initial);
}

// 使用例
it('should chain immutable operations', () => {
  const settings = new SystemSettingsCollection();

  const updated = chainResults(
    settings,
    (s) => s.withRetryWaitSecondsRange(10, 20),
    (s) => s.withRetryCount(5),
    (s) => s.withLogLevel(LogLevel.DEBUG)
  );

  expect(updated.getRetryWaitSecondsMin()).toBe(10);
  expect(updated.getRetryCount()).toBe(5);
  expect(updated.getLogLevel()).toBe(LogLevel.DEBUG);
});
```

---

## ヘルパー関数

### unwrapResult

```typescript
// Helper function to unwrap Result for testing
function unwrapResult<T>(result: Result<T, Error>): T {
  if (result.isFailure) {
    throw result.error;
  }
  return result.value!;
}
```

### expectSuccess

```typescript
// Helper function to expect success and return value
function expectSuccess<T>(result: Result<T, Error>): T {
  expect(result.isSuccess).toBe(true);
  expect(result.value).toBeDefined();
  return result.value!;
}
```

### expectFailure

```typescript
// Helper function to expect failure and check error message
function expectFailure<T>(result: Result<T, Error>, expectedMessage: string): void {
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeDefined();
  expect(result.error!.message).toContain(expectedMessage);
}
```

### chainResults

```typescript
// Helper function to chain Result operations
function chainResults<T>(initial: T, ...operations: Array<(value: T) => Result<T, Error>>): T {
  return operations.reduce((acc, op) => unwrapResult(op(acc)), initial);
}
```

---

## 更新手順

### 1. ヘルパー関数の追加

テストファイルの先頭に、ヘルパー関数を追加します。

```typescript
import { Result } from '@domain/values/result.value';

// Helper functions
function unwrapResult<T>(result: Result<T, Error>): T {
  if (result.isFailure) {
    throw result.error;
  }
  return result.value!;
}

function expectSuccess<T>(result: Result<T, Error>): T {
  expect(result.isSuccess).toBe(true);
  expect(result.value).toBeDefined();
  return result.value!;
}

function expectFailure<T>(result: Result<T, Error>, expectedMessage: string): void {
  expect(result.isFailure).toBe(true);
  expect(result.error).toBeDefined();
  expect(result.error!.message).toContain(expectedMessage);
}
```

### 2. 成功ケースの更新

```typescript
// Before
const updated = settings.withRetryCount(5);

// After
const result = settings.withRetryCount(5);
const updated = expectSuccess(result);
```

### 3. 失敗ケースの更新

```typescript
// Before
expect(() => settings.withRetryCount(-2)).toThrow('error message');

// After
const result = settings.withRetryCount(-2);
expectFailure(result, 'error message');
```

### 4. チェーンメソッドの更新

```typescript
// Before
const updated = settings.withRetryCount(5).withLogLevel(LogLevel.DEBUG);

// After
const step1 = expectSuccess(settings.withRetryCount(5));
const updated = expectSuccess(step1.withLogLevel(LogLevel.DEBUG));
```

---

## 更新対象ファイル

### 完了

- ✅ `src/domain/entities/__tests__/Website.test.ts`
- ✅ `src/domain/entities/__tests__/XPathCollection.test.ts`
- 🔄 `src/domain/entities/__tests__/SystemSettings.test.ts` (部分的)

### 未完了

- [ ] `src/domain/entities/__tests__/SystemSettings.test.ts` (残りのテスト)
- [ ] その他のエンティティテスト（必要に応じて）

---

## チェックリスト

### テスト更新時の確認事項

- [ ] ヘルパー関数をインポートしているか
- [ ] 成功ケースで`isSuccess`をチェックしているか
- [ ] 失敗ケースで`isFailure`をチェックしているか
- [ ] エラーメッセージを検証しているか
- [ ] チェーンメソッドを適切に処理しているか
- [ ] すべてのテストが通過するか

---

## トラブルシューティング

### 問題1: テストが失敗する

**原因**: Resultを unwrap していない

**解決策**:

```typescript
// ❌ 間違い
const updated = settings.withRetryCount(5);
expect(updated.getRetryCount()).toBe(5);

// ✅ 正しい
const result = settings.withRetryCount(5);
const updated = unwrapResult(result);
expect(updated.getRetryCount()).toBe(5);
```

### 問題2: チェーンメソッドが動作しない

**原因**: 各ステップでResultを unwrap していない

**解決策**:

```typescript
// ❌ 間違い
const updated = settings.withRetryCount(5).withLogLevel(LogLevel.DEBUG);

// ✅ 正しい
const step1 = unwrapResult(settings.withRetryCount(5));
const updated = unwrapResult(step1.withLogLevel(LogLevel.DEBUG));
```

### 問題3: エラーメッセージの検証が失敗する

**原因**: エラーメッセージが変更された

**解決策**: エラーメッセージを確認して、テストを更新します。

```typescript
// 部分一致を使用
expect(result.error!.message).toContain('Retry count');

// 完全一致を使用（推奨しない）
expect(result.error!.message).toBe('Retry count must be -1 (infinite) or non-negative');
```

---

## ベストプラクティス

### 1. ヘルパー関数を活用

```typescript
// ✅ 推奨: ヘルパー関数を使用
const updated = expectSuccess(settings.withRetryCount(5));

// ❌ 非推奨: 毎回手動でチェック
const result = settings.withRetryCount(5);
expect(result.isSuccess).toBe(true);
const updated = result.value!;
```

### 2. エラーメッセージは部分一致

```typescript
// ✅ 推奨: 部分一致
expectFailure(result, 'Retry count');

// ❌ 非推奨: 完全一致（メッセージ変更に脆弱）
expectFailure(result, 'Retry count must be -1 (infinite) or non-negative');
```

### 3. テストの可読性を重視

```typescript
// ✅ 推奨: 明確な変数名
const retryCountResult = settings.withRetryCount(5);
const updatedSettings = expectSuccess(retryCountResult);

// ❌ 非推奨: 不明確な変数名
const r = settings.withRetryCount(5);
const u = expectSuccess(r);
```

---

## まとめ

Resultパターンへの移行により、テストも更新する必要があります。ヘルパー関数を活用することで、テストの可読性と保守性を維持できます。

---

最終更新日: 2024年11月22日
