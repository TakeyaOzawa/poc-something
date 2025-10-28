/**
 * Infrastructure Layer: I18n Adapter
 * Wrapper around Chrome Extension i18n API for type-safe internationalization
 */

import browser from 'webextension-polyfill';
// Import messages.json to automatically generate MessageKey type
// Using project root _locales folder (the complete/master version)
import messages from '../../../public/_locales/en/messages.json';

/**
 * Message keys for type-safe i18n
 * Automatically generated from _locales/en/messages.json
 */
export type MessageKey = keyof typeof messages;

/**
 * I18n Adapter for internationalization support
 */
export class I18nAdapter {
  /**
   * Get localized message by key
   * @param key Message key
   * @param substitutions Optional substitutions for placeholders
   * @returns Localized message
   */
  public static getMessage(key: MessageKey, substitutions?: string | string[]): string {
    return browser.i18n.getMessage(key, substitutions);
  }

  /**
   * Get current locale (e.g., 'ja', 'en')
   * @returns Current locale code
   */
  public static getLocale(): string {
    return browser.i18n.getUILanguage();
  }

  /**
   * Format message with substitutions
   * @param key Message key
   * @param substitutions Values to substitute into placeholders
   * @returns Formatted message
   */
  public static format(key: MessageKey, ...substitutions: string[]): string {
    return this.getMessage(key, substitutions);
  }

  /**
   * Check if a message exists
   * @param key Message key
   * @returns True if message exists
   */
  public static hasMessage(key: MessageKey): boolean {
    const message = browser.i18n.getMessage(key);
    return message !== '';
  }

  /**
   * Apply i18n to DOM elements with data-i18n attributes
   * @param root Root element to search for i18n elements (default: document)
   */
  public static applyToDOM(root: Document | HTMLElement = document): void {
    // Text content
    root.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.getAttribute('data-i18n') as MessageKey;
      if (key) {
        const message = browser.i18n.getMessage(key);
        if (message) {
          element.textContent = message;
        }
      }
    });

    // Placeholder attribute
    root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      const key = element.getAttribute('data-i18n-placeholder') as MessageKey;
      if (key && element instanceof HTMLInputElement) {
        const message = browser.i18n.getMessage(key);
        if (message) {
          element.placeholder = message;
        }
      }
    });

    // Title attribute
    root.querySelectorAll('[data-i18n-title]').forEach((element) => {
      const key = element.getAttribute('data-i18n-title') as MessageKey;
      if (key) {
        const message = browser.i18n.getMessage(key);
        if (message) {
          element.setAttribute('title', message);
        }
      }
    });

    // Aria-label attribute
    root.querySelectorAll('[data-i18n-aria]').forEach((element) => {
      const key = element.getAttribute('data-i18n-aria') as MessageKey;
      if (key) {
        const message = browser.i18n.getMessage(key);
        if (message) {
          element.setAttribute('aria-label', message);
        }
      }
    });
  }
}
