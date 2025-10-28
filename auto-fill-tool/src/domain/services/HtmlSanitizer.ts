/**
 * Domain Service Interface: HTML Sanitization
 * Provides XSS protection by sanitizing HTML content before rendering
 *
 * This interface defines the contract for HTML sanitization services.
 * Implementations must ensure that all potentially dangerous HTML is safely escaped
 * or removed to prevent Cross-Site Scripting (XSS) attacks.
 */
export interface HtmlSanitizer {
  /**
   * Sanitize HTML content to prevent XSS attacks
   *
   * Removes or escapes potentially dangerous HTML tags, attributes, and JavaScript code.
   * The sanitized HTML is safe to be inserted into the DOM using innerHTML.
   *
   * @param html - The HTML string to sanitize (may contain untrusted user input)
   * @returns Sanitized HTML string that is safe to render
   *
   * @example
   * ```typescript
   * const userInput = '<script>alert("XSS")</script><p>Safe content</p>';
   * const safe = sanitizer.sanitize(userInput);
   * // Result: '<p>Safe content</p>'
   * ```
   */
  sanitize(html: string): string;

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
   * const escaped = sanitizer.escapeText(userInput);
   * // Result: '&lt;script&gt;alert("XSS")&lt;/script&gt;'
   * ```
   */
  escapeText(text: string): string;
}
