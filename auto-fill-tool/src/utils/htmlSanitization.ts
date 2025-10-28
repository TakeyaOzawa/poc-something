/**
 * HTML Sanitization Utilities
 * Provides global helper functions for XSS protection
 *
 * These utilities wrap the DOMPurify sanitizer and provide convenient
 * functions for safe HTML rendering throughout the application.
 */
import { DOMPurifySanitizer } from '@infrastructure/services/DOMPurifySanitizer';

// Singleton instance of the sanitizer
const sanitizer = new DOMPurifySanitizer();

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * This function removes or escapes potentially dangerous HTML tags, attributes,
 * and JavaScript code. The sanitized HTML is safe to be inserted into the DOM
 * using innerHTML.
 *
 * Uses DOMPurify under the hood for production-grade security.
 *
 * @param html - The HTML string to sanitize (may contain untrusted user input)
 * @returns Sanitized HTML string that is safe to render
 *
 * @example
 * ```typescript
 * const userInput = '<script>alert("XSS")</script><p>Safe content</p>';
 * const safe = sanitizeHtml(userInput);
 * element.innerHTML = safe;
 * // Result: '<p>Safe content</p>'
 * ```
 */
export function sanitizeHtml(html: string): string {
  return sanitizer.sanitize(html);
}

/**
 * Escape plain text to prevent HTML interpretation
 *
 * Converts special HTML characters to their entity equivalents,
 * ensuring that user input is displayed as plain text rather than being
 * interpreted as HTML tags.
 *
 * This is useful when you want to display user input without allowing any HTML formatting.
 *
 * @param text - The plain text to escape
 * @returns HTML-escaped string
 *
 * @example
 * ```typescript
 * const userInput = '<script>alert("XSS")</script>';
 * const escaped = escapeHtml(userInput);
 * element.innerHTML = escaped;
 * // Displays: <script>alert("XSS")</script>
 * // (As text, not executed)
 * ```
 */
export function escapeHtml(text: string): string {
  return sanitizer.escapeText(text);
}
