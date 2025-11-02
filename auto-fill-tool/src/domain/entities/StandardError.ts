/**
 * Domain Entity: Standard Error
 * Standardized error handling with automatic error code management
 */

import { ErrorCodeRegistry, ErrorCategory } from '../constants/ErrorCodes';

export interface ErrorContext {
  [key: string]: unknown;
}

export interface StandardErrorData {
  code: string;
  message: string;
  context?: ErrorContext;
  timestamp: number;
  stack?: string;
}

/**
 * Standard Error Entity
 * Provides consistent error handling across the application
 */
export class StandardError extends Error {
  public readonly code: string;
  public readonly context?: ErrorContext;
  public readonly timestamp: number;

  constructor(code: string, context?: ErrorContext, message?: string) {
    const definition = ErrorCodeRegistry.getDefinition(code);
    const errorMessage = message || definition?.defaultMessage || 'Unknown error';
    
    super(errorMessage);
    
    this.name = 'StandardError';
    this.code = code;
    this.context = context;
    this.timestamp = Date.now();
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StandardError);
    }
  }

  /**
   * Create error from category and message (auto-generates code)
   */
  static fromCategory(category: ErrorCategory, message: string, context?: ErrorContext): StandardError {
    const code = ErrorCodeRegistry.generateCode(category, message);
    return new StandardError(code, context, message);
  }

  /**
   * Create XPath related error
   */
  static xpath(message: string, context?: ErrorContext): StandardError {
    return StandardError.fromCategory(ErrorCategory.XPATH, message, context);
  }

  /**
   * Create authentication related error
   */
  static auth(message: string, context?: ErrorContext): StandardError {
    return StandardError.fromCategory(ErrorCategory.AUTH, message, context);
  }

  /**
   * Create sync related error
   */
  static sync(message: string, context?: ErrorContext): StandardError {
    return StandardError.fromCategory(ErrorCategory.SYNC, message, context);
  }

  /**
   * Create storage related error
   */
  static storage(message: string, context?: ErrorContext): StandardError {
    return StandardError.fromCategory(ErrorCategory.STORAGE, message, context);
  }

  /**
   * Create validation related error
   */
  static validation(message: string, context?: ErrorContext): StandardError {
    return StandardError.fromCategory(ErrorCategory.VALIDATION, message, context);
  }

  /**
   * Create network related error
   */
  static network(message: string, context?: ErrorContext): StandardError {
    return StandardError.fromCategory(ErrorCategory.NETWORK, message, context);
  }

  /**
   * Create crypto related error
   */
  static crypto(message: string, context?: ErrorContext): StandardError {
    return StandardError.fromCategory(ErrorCategory.CRYPTO, message, context);
  }

  /**
   * Create system related error
   */
  static system(message: string, context?: ErrorContext): StandardError {
    return StandardError.fromCategory(ErrorCategory.SYSTEM, message, context);
  }

  /**
   * Get error definition
   */
  getDefinition() {
    return ErrorCodeRegistry.getDefinition(this.code);
  }

  /**
   * Get i18n key for error message
   */
  getI18nKey(): string {
    const definition = this.getDefinition();
    return definition?.i18nKey || `error.unknown`;
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): StandardErrorData {
    return {
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  /**
   * Create from plain object
   */
  static fromJSON(data: StandardErrorData): StandardError {
    const error = new StandardError(data.code, data.context, data.message);
    if (data.stack) {
      error.stack = data.stack;
    }
    return error;
  }

  /**
   * Format error for user display (hides technical details)
   */
  toUserMessage(): string {
    const definition = this.getDefinition();
    if (!definition) {
      return 'An unexpected error occurred';
    }

    // Return user-friendly message without technical details
    return definition.defaultMessage;
  }

  /**
   * Format error for developer logging (includes all details)
   */
  toDeveloperMessage(): string {
    const contextStr = this.context ? ` Context: ${JSON.stringify(this.context)}` : '';
    return `[${this.code}] ${this.message}${contextStr}`;
  }

  /**
   * Check if error is of specific category
   */
  isCategory(category: ErrorCategory): boolean {
    return this.code.startsWith(`E-${category}-`);
  }

  /**
   * Check if error is retryable based on category
   */
  isRetryable(): boolean {
    return this.isCategory(ErrorCategory.NETWORK) || 
           this.isCategory(ErrorCategory.SYNC) ||
           this.isCategory(ErrorCategory.SYSTEM);
  }
}
