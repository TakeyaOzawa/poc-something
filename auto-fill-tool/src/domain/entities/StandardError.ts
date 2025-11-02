/**
 * Domain Layer: Standard Error Entity
 * Unified error handling with compile-time error code validation
 * 
 * 🚨 新しいエラーコードを追加する場合の対応手順:
 * 1. `npm run error:reserve <CATEGORY>` でエラーコードを予約
 * 2. public/_locales/*/messages.json にメッセージを追加
 * 3. `npm run error:validate` で整合性をチェック
 * 
 * 📖 詳細なドキュメント:
 * - エラーコード管理: README.md の「エラーコード管理」セクション
 * - 使用例とベストプラクティス: README.md の「エラーハンドリングアーキテクチャ」セクション
 * - コマンドリファレンス: package.json の scripts セクション
 */

import type { I18nPort, MessageKey } from '../types/i18n-port.type';

/**
 * Error context for additional error information
 */
export interface ErrorContext {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Error message types for different audiences
 */
export type ErrorMessageType = 'USER' | 'DEV' | 'RESOLUTION';

/**
 * Extract error codes from MessageKey type
 * E_XPATH_0001_USER -> E_XPATH_0001
 */
type ExtractErrorCode<T extends string> = T extends `${infer Code}_${ErrorMessageType}`
  ? Code
  : never;

/**
 * Valid error codes (extracted from MessageKey)
 */
export type ValidErrorCode = ExtractErrorCode<MessageKey>;

/**
 * Standard Error class for unified error handling
 * Uses dependency injection for I18n service
 */
export class StandardError extends Error {
  public readonly errorCode: ValidErrorCode;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  private i18nService?: I18nPort;

  constructor(errorCode: ValidErrorCode, context: ErrorContext = {}) {
    super(errorCode);
    this.name = 'StandardError';
    this.errorCode = errorCode;
    this.context = context;
    this.timestamp = new Date();
  }

  /**
   * Set I18n service (dependency injection)
   */
  public setI18nService(service: I18nPort): void {
    this.i18nService = service;
  }

  /**
   * Generate message key for specific error message type
   * E_XPATH_0002 -> E_XPATH_0002_USER, E_XPATH_0002_DEV, E_XPATH_0002_RESOLUTION
   */
  public getMessageKey(type: ErrorMessageType): MessageKey {
    return `${this.errorCode}_${type}` as MessageKey;
  }

  /**
   * Get user-facing message key
   */
  public getUserMessageKey(): MessageKey {
    return this.getMessageKey('USER');
  }

  /**
   * Get developer message key
   */
  public getDevMessageKey(): MessageKey {
    return this.getMessageKey('DEV');
  }

  /**
   * Get resolution message key
   */
  public getResolutionMessageKey(): MessageKey {
    return this.getMessageKey('RESOLUTION');
  }

  /**
   * Get localized user-facing message
   */
  public getUserMessage(): string {
    if (!this.i18nService) {
      return `[No I18n Service] ${this.getUserMessageKey()}`;
    }
    return this.i18nService.getMessage(this.getUserMessageKey(), this.context);
  }

  /**
   * Get localized developer message
   */
  public getDevMessage(): string {
    if (!this.i18nService) {
      return `[No I18n Service] ${this.getDevMessageKey()}`;
    }
    return this.i18nService.getMessage(this.getDevMessageKey(), this.context);
  }

  /**
   * Get localized resolution message
   */
  public getResolutionMessage(): string {
    if (!this.i18nService) {
      return `[No I18n Service] ${this.getResolutionMessageKey()}`;
    }
    return this.i18nService.getMessage(this.getResolutionMessageKey(), this.context);
  }

  /**
   * Get error code as string
   */
  public getErrorCode(): string {
    return this.errorCode;
  }

  /**
   * Get error context
   */
  public getContext(): ErrorContext {
    return { ...this.context };
  }

  /**
   * Convert to JSON representation
   */
  public toJSON(): object {
    return {
      name: this.name,
      errorCode: this.errorCode,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      message: this.message,
      stack: this.stack,
      userMessage: this.getUserMessage(),
      devMessage: this.getDevMessage(),
      resolutionMessage: this.getResolutionMessage(),
    };
  }
}
