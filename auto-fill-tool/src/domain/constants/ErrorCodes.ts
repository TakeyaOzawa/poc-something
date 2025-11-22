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
 * Numeric error codes for programmatic error handling
 * Organized by category with ranges:
 * - 1000-1999: Validation errors
 * - 2000-2999: Business logic errors
 * - 3000-3999: Infrastructure errors
 * - 4000-4999: External system errors
 * - 5000-5999: System errors
 */
export const NUMERIC_ERROR_CODES = {
  // Validation Errors (1000-1999)
  VALIDATION_REQUIRED_FIELD: 1001,
  VALIDATION_INVALID_FORMAT: 1002,
  VALIDATION_OUT_OF_RANGE: 1003,
  VALIDATION_INVALID_TYPE: 1004,
  VALIDATION_DUPLICATE: 1005,

  // Business Errors (2000-2999)
  BUSINESS_NOT_FOUND: 2001,
  BUSINESS_ALREADY_EXISTS: 2002,
  BUSINESS_INVALID_STATE: 2003,
  BUSINESS_OPERATION_NOT_ALLOWED: 2004,
  BUSINESS_QUOTA_EXCEEDED: 2005,

  // Infrastructure Errors (3000-3999)
  INFRASTRUCTURE_STORAGE_ERROR: 3001,
  INFRASTRUCTURE_NETWORK_ERROR: 3002,
  INFRASTRUCTURE_TIMEOUT: 3003,
  INFRASTRUCTURE_UNAVAILABLE: 3004,
  INFRASTRUCTURE_CONFIGURATION_ERROR: 3005,

  // External Errors (4000-4999)
  EXTERNAL_API_ERROR: 4001,
  EXTERNAL_AUTH_ERROR: 4002,
  EXTERNAL_RATE_LIMIT: 4003,
  EXTERNAL_SERVICE_UNAVAILABLE: 4004,

  // System Errors (5000-5999)
  SYSTEM_UNEXPECTED_ERROR: 5001,
  SYSTEM_NOT_IMPLEMENTED: 5002,
  SYSTEM_INTERNAL_ERROR: 5003,
  SYSTEM_MAINTENANCE: 5004,
} as const;

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
