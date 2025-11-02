/**
 * Domain Layer: Error Code Definitions
 * Centralized error code management with automatic categorization
 */

export interface ErrorCodeDefinition {
  code: string;
  category: string;
  number: number;
  defaultMessage: string;
  i18nKey: string;
}

export enum ErrorCategory {
  XPATH = 'XPATH',
  AUTH = 'AUTH',
  SYNC = 'SYNC',
  STORAGE = 'STORAGE',
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  CRYPTO = 'CRYPTO',
  I18N = 'I18N',
  PERFORMANCE = 'PERFORMANCE',
  SYSTEM = 'SYSTEM',
}

/**
 * Error Code Registry
 * Auto-generated error codes with category-based numbering
 */
export class ErrorCodeRegistry {
  private static codes: Map<string, ErrorCodeDefinition> = new Map();
  private static categoryCounters: Map<string, number> = new Map();

  /**
   * Generate error code based on file path and category
   */
  static generateCode(category: ErrorCategory, message: string): string {
    const counter = this.categoryCounters.get(category) || 0;
    const newCounter = counter + 1;
    this.categoryCounters.set(category, newCounter);

    const code = `E-${category}-${newCounter.toString().padStart(4, '0')}`;
    const i18nKey = `error.${category.toLowerCase()}.${newCounter.toString().padStart(4, '0')}`;

    this.codes.set(code, {
      code,
      category,
      number: newCounter,
      defaultMessage: message,
      i18nKey,
    });

    return code;
  }

  /**
   * Get error definition by code
   */
  static getDefinition(code: string): ErrorCodeDefinition | undefined {
    return this.codes.get(code);
  }

  /**
   * Get all error codes by category
   */
  static getByCategory(category: ErrorCategory): ErrorCodeDefinition[] {
    return Array.from(this.codes.values()).filter((def) => def.category === category);
  }

  /**
   * Export all error codes for i18n generation
   */
  static exportForI18n(): Record<string, string> {
    const result: Record<string, string> = {};
    this.codes.forEach((def) => {
      result[def.i18nKey] = def.defaultMessage;
    });
    return result;
  }
}

/**
 * Pre-defined error codes for common scenarios
 */
export const ERROR_CODES = {
  // XPath related errors
  XPATH_NOT_FOUND: ErrorCodeRegistry.generateCode(ErrorCategory.XPATH, 'XPath element not found'),
  XPATH_INVALID: ErrorCodeRegistry.generateCode(ErrorCategory.XPATH, 'Invalid XPath expression'),
  XPATH_TIMEOUT: ErrorCodeRegistry.generateCode(
    ErrorCategory.XPATH,
    'XPath element search timeout'
  ),

  // Authentication related errors
  AUTH_FAILED: ErrorCodeRegistry.generateCode(ErrorCategory.AUTH, 'Authentication failed'),
  AUTH_LOCKED: ErrorCodeRegistry.generateCode(
    ErrorCategory.AUTH,
    'Account locked due to failed attempts'
  ),
  AUTH_EXPIRED: ErrorCodeRegistry.generateCode(
    ErrorCategory.AUTH,
    'Authentication session expired'
  ),

  // Sync related errors
  SYNC_FAILED: ErrorCodeRegistry.generateCode(ErrorCategory.SYNC, 'Data synchronization failed'),
  SYNC_CONFLICT: ErrorCodeRegistry.generateCode(
    ErrorCategory.SYNC,
    'Synchronization conflict detected'
  ),
  SYNC_TIMEOUT: ErrorCodeRegistry.generateCode(ErrorCategory.SYNC, 'Synchronization timeout'),

  // Storage related errors
  STORAGE_FULL: ErrorCodeRegistry.generateCode(ErrorCategory.STORAGE, 'Storage quota exceeded'),
  STORAGE_CORRUPTED: ErrorCodeRegistry.generateCode(
    ErrorCategory.STORAGE,
    'Storage data corrupted'
  ),
  STORAGE_LOCKED: ErrorCodeRegistry.generateCode(ErrorCategory.STORAGE, 'Storage is locked'),

  // Validation related errors
  VALIDATION_FAILED: ErrorCodeRegistry.generateCode(
    ErrorCategory.VALIDATION,
    'Data validation failed'
  ),
  VALIDATION_REQUIRED: ErrorCodeRegistry.generateCode(
    ErrorCategory.VALIDATION,
    'Required field missing'
  ),
  VALIDATION_FORMAT: ErrorCodeRegistry.generateCode(
    ErrorCategory.VALIDATION,
    'Invalid data format'
  ),

  // Network related errors
  NETWORK_TIMEOUT: ErrorCodeRegistry.generateCode(ErrorCategory.NETWORK, 'Network request timeout'),
  NETWORK_OFFLINE: ErrorCodeRegistry.generateCode(
    ErrorCategory.NETWORK,
    'Network connection unavailable'
  ),
  NETWORK_ERROR: ErrorCodeRegistry.generateCode(ErrorCategory.NETWORK, 'Network request failed'),

  // Crypto related errors
  CRYPTO_DECRYPT_FAILED: ErrorCodeRegistry.generateCode(ErrorCategory.CRYPTO, 'Decryption failed'),
  CRYPTO_ENCRYPT_FAILED: ErrorCodeRegistry.generateCode(ErrorCategory.CRYPTO, 'Encryption failed'),
  CRYPTO_KEY_INVALID: ErrorCodeRegistry.generateCode(
    ErrorCategory.CRYPTO,
    'Invalid encryption key'
  ),

  // System related errors
  SYSTEM_ERROR: ErrorCodeRegistry.generateCode(ErrorCategory.SYSTEM, 'System error occurred'),
  SYSTEM_UNAVAILABLE: ErrorCodeRegistry.generateCode(
    ErrorCategory.SYSTEM,
    'System temporarily unavailable'
  ),
  SYSTEM_MAINTENANCE: ErrorCodeRegistry.generateCode(
    ErrorCategory.SYSTEM,
    'System under maintenance'
  ),
} as const;
