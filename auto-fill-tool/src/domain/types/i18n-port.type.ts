// Import messages.json to automatically generate MessageKey type
// Using project root _locales folder (the complete/master version)
import messages from '../../../public/_locales/en/messages.json';

/**
 * Message keys for type-safe i18n
 * Automatically generated from _locales/en/messages.json
 */
export type MessageKey = keyof typeof messages;

export interface MessageContext {
  [key: string]: string | number | boolean | undefined;
}

/**
 * I18n Service interface for domain layer
 */
export interface I18nPort {
  /**
   * Get localized message by key with optional context
   */
  getMessage(key: string, context?: MessageContext): string;
}
