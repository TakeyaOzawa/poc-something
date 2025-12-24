# Presentation層でのエラーハンドリング統一ガイド

## 概要

このガイドでは、Presentation層でResultパターンを処理し、エラーハンドリングを統一する方法を説明します。

---

## 基本方針

### 1. Resultパターンの処理

Presentation層では、UseCaseから返されたResultを適切に処理し、ユーザーにフィードバックを提供します。

### 2. エラーメッセージの表示

エラーメッセージは、ユーザーフレンドリーで具体的なものにします。

### 3. ログの記録

エラーが発生した場合、詳細なログを記録します。

---

## 推奨パターン

### パターン1: 基本的なエラーハンドリング

#### Before

```typescript
export class WebsitePresenter {
  async saveWebsite(input: SaveWebsiteInput): Promise<void> {
    try {
      await this.useCase.execute(input);
      this.view.showSuccess('保存しました');
    } catch (error) {
      this.view.showError('保存に失敗しました');
    }
  }
}
```

#### After

```typescript
export class WebsitePresenter {
  async saveWebsite(input: SaveWebsiteInput): Promise<void> {
    this.view.showLoading();

    const result = await this.useCase.execute(input);

    if (result.isFailure) {
      this.logger.error('Failed to save website', {
        input,
        error: result.error,
      });

      this.view.showError(this.getErrorMessage(result.error!));
      return;
    }

    this.logger.info('Website saved successfully');
    this.view.showSuccess('保存しました');
    this.view.updateWebsite(result.value!);
  }

  private getErrorMessage(error: Error): string {
    // エラーコードに基づいてメッセージを返す
    if (error instanceof DomainError) {
      return this.getErrorMessageByCode(error.code);
    }
    return error.message || '予期しないエラーが発生しました';
  }

  private getErrorMessageByCode(code: number): string {
    const messages: Record<number, string> = {
      [NUMERIC_ERROR_CODES.VALIDATION_REQUIRED_FIELD]: '必須項目が入力されていません',
      [NUMERIC_ERROR_CODES.VALIDATION_INVALID_FORMAT]: '入力形式が正しくありません',
      [NUMERIC_ERROR_CODES.BUSINESS_NOT_FOUND]: 'データが見つかりません',
      [NUMERIC_ERROR_CODES.INFRASTRUCTURE_STORAGE_ERROR]: '保存に失敗しました',
    };
    return messages[code] || '予期しないエラーが発生しました';
  }
}
```

### パターン2: エラーの詳細表示

```typescript
export class WebsitePresenter {
  async saveWebsite(input: SaveWebsiteInput): Promise<void> {
    this.view.showLoading();

    const result = await this.useCase.execute(input);

    if (result.isFailure) {
      const error = result.error!;

      // エラーログ
      this.logger.error('Failed to save website', {
        input,
        error,
        errorCode: error instanceof DomainError ? error.code : undefined,
      });

      // ユーザーへのフィードバック
      const userMessage = this.getUserFriendlyMessage(error);
      const details = error instanceof DomainError ? error.details : undefined;

      this.view.showError(userMessage, details);
      return;
    }

    this.view.showSuccess('保存しました');
    this.view.updateWebsite(result.value!);
  }

  private getUserFriendlyMessage(error: Error): string {
    if (error instanceof DomainError) {
      switch (error.code) {
        case NUMERIC_ERROR_CODES.VALIDATION_REQUIRED_FIELD:
          return `必須項目が入力されていません: ${error.details?.field || ''}`;
        case NUMERIC_ERROR_CODES.VALIDATION_INVALID_FORMAT:
          return `入力形式が正しくありません: ${error.details?.field || ''}`;
        case NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE:
          return `値が範囲外です: ${error.details?.field || ''}`;
        case NUMERIC_ERROR_CODES.BUSINESS_NOT_FOUND:
          return 'データが見つかりません';
        case NUMERIC_ERROR_CODES.INFRASTRUCTURE_STORAGE_ERROR:
          return '保存に失敗しました。もう一度お試しください';
        default:
          return error.message || '予期しないエラーが発生しました';
      }
    }
    return error.message || '予期しないエラーが発生しました';
  }
}
```

### パターン3: リトライ機能

```typescript
export class WebsitePresenter {
  async saveWebsite(input: SaveWebsiteInput, retryCount: number = 0): Promise<void> {
    const MAX_RETRIES = 3;

    this.view.showLoading();

    const result = await this.useCase.execute(input);

    if (result.isFailure) {
      const error = result.error!;

      // リトライ可能なエラーかチェック
      if (this.isRetryableError(error) && retryCount < MAX_RETRIES) {
        this.logger.warn(`Retrying save website (attempt ${retryCount + 1})`, { error });

        // 指数バックオフ
        await this.delay(Math.pow(2, retryCount) * 1000);

        return this.saveWebsite(input, retryCount + 1);
      }

      // リトライ不可能またはリトライ上限
      this.logger.error('Failed to save website after retries', {
        input,
        error,
        retryCount,
      });

      this.view.showError(this.getUserFriendlyMessage(error));
      return;
    }

    this.view.showSuccess('保存しました');
    this.view.updateWebsite(result.value!);
  }

  private isRetryableError(error: Error): boolean {
    if (error instanceof DomainError) {
      // インフラエラーやネットワークエラーはリトライ可能
      return [
        NUMERIC_ERROR_CODES.INFRASTRUCTURE_STORAGE_ERROR,
        NUMERIC_ERROR_CODES.INFRASTRUCTURE_NETWORK_ERROR,
        NUMERIC_ERROR_CODES.INFRASTRUCTURE_TIMEOUT,
      ].includes(error.code);
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### パターン4: 楽観的UI更新

```typescript
export class WebsitePresenter {
  async saveWebsite(input: SaveWebsiteInput): Promise<void> {
    // 楽観的にUIを更新
    const optimisticWebsite = this.createOptimisticWebsite(input);
    this.view.updateWebsite(optimisticWebsite);
    this.view.showLoading();

    const result = await this.useCase.execute(input);

    if (result.isFailure) {
      // エラー時は元に戻す
      this.view.revertWebsite();

      this.logger.error('Failed to save website', {
        input,
        error: result.error,
      });

      this.view.showError(this.getUserFriendlyMessage(result.error!));
      return;
    }

    // 成功時は実際のデータで更新
    this.view.updateWebsite(result.value!);
    this.view.showSuccess('保存しました');
  }

  private createOptimisticWebsite(input: SaveWebsiteInput): WebsiteViewModel {
    return {
      id: 'temp-' + Date.now(),
      name: input.name,
      startUrl: input.startUrl,
      updatedAt: new Date().toISOString(),
      editable: true,
    };
  }
}
```

---

## エラーメッセージの統一

### エラーメッセージマップ

```typescript
// src/presentation/utils/errorMessages.ts

export const ERROR_MESSAGES: Record<number, string> = {
  // Validation Errors (1000-1999)
  [NUMERIC_ERROR_CODES.VALIDATION_REQUIRED_FIELD]: '必須項目が入力されていません',
  [NUMERIC_ERROR_CODES.VALIDATION_INVALID_FORMAT]: '入力形式が正しくありません',
  [NUMERIC_ERROR_CODES.VALIDATION_OUT_OF_RANGE]: '値が範囲外です',

  // Business Errors (2000-2999)
  [NUMERIC_ERROR_CODES.BUSINESS_NOT_FOUND]: 'データが見つかりません',
  [NUMERIC_ERROR_CODES.BUSINESS_ALREADY_EXISTS]: 'すでに存在します',
  [NUMERIC_ERROR_CODES.BUSINESS_INVALID_STATE]: '無効な状態です',

  // Infrastructure Errors (3000-3999)
  [NUMERIC_ERROR_CODES.INFRASTRUCTURE_STORAGE_ERROR]: '保存に失敗しました',
  [NUMERIC_ERROR_CODES.INFRASTRUCTURE_NETWORK_ERROR]: 'ネットワークエラーが発生しました',
  [NUMERIC_ERROR_CODES.INFRASTRUCTURE_TIMEOUT]: 'タイムアウトしました',

  // External Errors (4000-4999)
  [NUMERIC_ERROR_CODES.EXTERNAL_API_ERROR]: '外部APIエラーが発生しました',
  [NUMERIC_ERROR_CODES.EXTERNAL_AUTH_ERROR]: '認証エラーが発生しました',

  // System Errors (5000-5999)
  [NUMERIC_ERROR_CODES.SYSTEM_UNEXPECTED_ERROR]: '予期しないエラーが発生しました',
};

export function getErrorMessage(error: Error): string {
  if (error instanceof DomainError) {
    const message = ERROR_MESSAGES[error.code];
    if (message) {
      // 詳細情報を追加
      if (error.details?.field) {
        return `${message}: ${error.details.field}`;
      }
      return message;
    }
  }
  return error.message || ERROR_MESSAGES[NUMERIC_ERROR_CODES.SYSTEM_UNEXPECTED_ERROR];
}
```

### 使用例

```typescript
import { getErrorMessage } from '@presentation/utils/errorMessages';

export class WebsitePresenter {
  async saveWebsite(input: SaveWebsiteInput): Promise<void> {
    const result = await this.useCase.execute(input);

    if (result.isFailure) {
      const message = getErrorMessage(result.error!);
      this.view.showError(message);
      return;
    }

    this.view.showSuccess('保存しました');
  }
}
```

---

## ログの記録

### ログレベル

```typescript
export class WebsitePresenter {
  async saveWebsite(input: SaveWebsiteInput): Promise<void> {
    // INFO: 正常な操作
    this.logger.info('Saving website', { name: input.name });

    const result = await this.useCase.execute(input);

    if (result.isFailure) {
      const error = result.error!;

      // エラーレベルに応じてログレベルを変更
      if (error instanceof DomainError) {
        if (error.code >= 1000 && error.code < 2000) {
          // バリデーションエラー: WARN
          this.logger.warn('Validation error', { input, error });
        } else if (error.code >= 3000 && error.code < 4000) {
          // インフラエラー: ERROR
          this.logger.error('Infrastructure error', { input, error });
        } else {
          // その他: ERROR
          this.logger.error('Failed to save website', { input, error });
        }
      } else {
        // 予期しないエラー: ERROR
        this.logger.error('Unexpected error', { input, error });
      }

      this.view.showError(getErrorMessage(error));
      return;
    }

    // SUCCESS: 成功
    this.logger.info('Website saved successfully', { id: result.value!.id });
    this.view.showSuccess('保存しました');
  }
}
```

---

## テスト

### Presenterのテスト

```typescript
describe('WebsitePresenter', () => {
  let presenter: WebsitePresenter;
  let mockUseCase: jest.Mocked<SaveWebsiteUseCase>;
  let mockView: jest.Mocked<WebsiteView>;
  let mockLogger: jest.Mocked<LoggerPort>;

  beforeEach(() => {
    mockUseCase = {
      execute: jest.fn(),
    } as any;

    mockView = {
      showLoading: jest.fn(),
      showSuccess: jest.fn(),
      showError: jest.fn(),
      updateWebsite: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    presenter = new WebsitePresenter(mockUseCase, mockView, mockLogger);
  });

  it('should show success message when save succeeds', async () => {
    const website = { id: '1', name: 'Test' };
    mockUseCase.execute.mockResolvedValue(Result.success(website));

    await presenter.saveWebsite({ name: 'Test' });

    expect(mockView.showLoading).toHaveBeenCalled();
    expect(mockView.showSuccess).toHaveBeenCalledWith('保存しました');
    expect(mockView.updateWebsite).toHaveBeenCalledWith(website);
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should show error message when save fails', async () => {
    const error = new DomainError(
      'Storage error',
      NUMERIC_ERROR_CODES.INFRASTRUCTURE_STORAGE_ERROR
    );
    mockUseCase.execute.mockResolvedValue(Result.failure(error));

    await presenter.saveWebsite({ name: 'Test' });

    expect(mockView.showError).toHaveBeenCalledWith('保存に失敗しました');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should show validation error message', async () => {
    const error = new DomainError(
      'Name is required',
      NUMERIC_ERROR_CODES.VALIDATION_REQUIRED_FIELD,
      { field: 'name' }
    );
    mockUseCase.execute.mockResolvedValue(Result.failure(error));

    await presenter.saveWebsite({ name: '' });

    expect(mockView.showError).toHaveBeenCalledWith(expect.stringContaining('必須項目'));
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});
```

---

## チェックリスト

### Presenter実装時の確認事項

- [ ] Resultパターンを適切に処理しているか
- [ ] エラーメッセージがユーザーフレンドリーか
- [ ] ログを適切なレベルで記録しているか
- [ ] ローディング状態を表示しているか
- [ ] 成功時のフィードバックを提供しているか
- [ ] エラー時のフィードバックを提供しているか
- [ ] テストを追加しているか

---

## ベストプラクティス

### 1. ユーザーフレンドリーなメッセージ

```typescript
// ✅ 推奨: 具体的で分かりやすい
'必須項目が入力されていません: 名前';

// ❌ 非推奨: 技術的すぎる
'ValidationError: name field is required';
```

### 2. エラーの詳細はログに

```typescript
// ✅ 推奨: ユーザーにはシンプルなメッセージ、ログには詳細
this.view.showError('保存に失敗しました');
this.logger.error('Failed to save', { input, error, stackTrace });

// ❌ 非推奨: ユーザーに技術的な詳細を表示
this.view.showError(`Failed to save: ${error.stack}`);
```

### 3. 一貫したエラーハンドリング

```typescript
// ✅ 推奨: 統一されたヘルパー関数を使用
const message = getErrorMessage(result.error!);
this.view.showError(message);

// ❌ 非推奨: 各Presenterで独自の処理
this.view.showError(result.error!.message);
```

---

## まとめ

Presentation層でエラーハンドリングを統一することで：

1. **ユーザー体験の向上**: 一貫したエラーメッセージ
2. **デバッグの容易化**: 詳細なログ記録
3. **保守性の向上**: 統一されたパターン
4. **テスタビリティ**: テストしやすい構造

---

最終更新日: 2024年11月22日
