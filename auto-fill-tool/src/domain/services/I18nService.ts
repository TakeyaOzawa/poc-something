/**
 * Domain Layer: I18n Service Interface
 * Abstraction for internationalization functionality
 */

/**
 * Message context for variable substitution
 */
export interface MessageContext {
  [key: string]: string | number | boolean | undefined;
}

/**
 * I18n Service interface for domain layer
 */
export interface I18nService {
  /**
   * Get localized message by key with optional context
   */
  getMessage(key: string, context?: MessageContext): string;
}

// Re-export MessageKey type from infrastructure (for type safety)
// This creates a controlled dependency inversion
export type { MessageKey } from '@infrastructure/adapters/I18nAdapter';
