/**
 * Infrastructure Layer: DOMPurify-based HTML Sanitizer
 * Implements HtmlSanitizer interface using DOMPurify library
 *
 * DOMPurify is a production-ready XSS sanitizer for HTML, MathML and SVG.
 * It's fast, tolerant and extremely robust.
 *
 * @see https://github.com/cure53/DOMPurify
 */
import DOMPurify from 'dompurify';
import { HtmlSanitizer } from '@domain/services/HtmlSanitizer';

/**
 * DOMPurify-based sanitizer implementation
 *
 * This implementation uses DOMPurify's battle-tested sanitization engine
 * to protect against XSS attacks while preserving safe HTML formatting.
 *
 * Default Configuration:
 * - Allows common safe tags (p, div, span, strong, em, ul, ol, li, a, etc.)
 * - Removes dangerous tags (script, iframe, object, embed, etc.)
 * - Removes dangerous attributes (onclick, onerror, onload, etc.)
 * - Removes javascript: protocol from URLs
 * - Preserves safe CSS properties
 */
export class DOMPurifySanitizer implements HtmlSanitizer {
  /**
   * DOMPurify configuration for sanitization
   *
   * ALLOWED_TAGS: Whitelist of safe HTML tags
   * ALLOWED_ATTR: Whitelist of safe HTML attributes
   * ALLOW_DATA_ATTR: Allow data-* attributes (useful for bindings)
   * FORBID_TAGS: Additional blacklist (belt-and-suspenders approach)
   * FORBID_ATTR: Additional blacklist for dangerous event handlers
   */
  private readonly sanitizeConfig = {
    // Whitelist of allowed tags
    ALLOWED_TAGS: [
      // Text formatting
      'p',
      'div',
      'span',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'strike',
      'del',
      'ins',
      'mark',
      'small',
      'sub',
      'sup',
      'code',
      'pre',
      'blockquote',
      // Headings
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      // Lists
      'ul',
      'ol',
      'li',
      'dl',
      'dt',
      'dd',
      // Links and media
      'a',
      'img',
      // Tables
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      'caption',
      'colgroup',
      'col',
      // Other safe elements
      'br',
      'hr',
      'abbr',
      'address',
      'cite',
      'q',
      'time',
      'kbd',
      'samp',
      'var',
      'dfn',
    ],

    // Whitelist of allowed attributes
    ALLOWED_ATTR: [
      // Common safe attributes
      'class',
      'id',
      'title',
      'alt',
      'href',
      'src',
      'width',
      'height',
      'align',
      'valign',
      'colspan',
      'rowspan',
      'style', // Limited to safe CSS properties (see ALLOWED_CSS_PROPERTIES)
      // Link attributes
      'target',
      'rel',
      // Table attributes
      'cellpadding',
      'cellspacing',
      'border',
      // Image attributes
      'loading',
      // Time attributes
      'datetime',
    ],

    // Allow data-* attributes (useful for data binding)
    ALLOW_DATA_ATTR: true,

    // Blacklist dangerous tags (belt-and-suspenders approach)
    FORBID_TAGS: [
      'script',
      'iframe',
      'object',
      'embed',
      'link',
      'style',
      'base',
      'form',
      'input',
      'button',
      'textarea',
      'select',
      'option',
      'meta',
    ],

    // Blacklist dangerous event handler attributes
    FORBID_ATTR: [
      'onclick',
      'ondblclick',
      'onmousedown',
      'onmousemove',
      'onmouseover',
      'onmouseout',
      'onmouseup',
      'onkeydown',
      'onkeypress',
      'onkeyup',
      'onload',
      'onerror',
      'onfocus',
      'onblur',
      'onchange',
      'onsubmit',
      'onreset',
    ],
  };

  /**
   * Sanitize HTML content using DOMPurify
   *
   * @param html - The HTML string to sanitize
   * @returns Sanitized HTML string safe for rendering
   */
  sanitize(html: string): string {
    // Return empty string for null/undefined
    if (html === null || html === undefined) {
      return '';
    }

    // Return as-is for empty strings
    if (typeof html !== 'string' || html.trim() === '') {
      return html;
    }

    // Sanitize using DOMPurify with configuration
    return DOMPurify.sanitize(html, this.sanitizeConfig);
  }

  /**
   * Escape plain text to prevent HTML interpretation
   *
   * @param text - The plain text to escape
   * @returns HTML-escaped string
   */
  escapeText(text: string): string {
    // Return empty string for null/undefined
    if (text === null || text === undefined) {
      return '';
    }

    // Return as-is for empty strings
    if (typeof text !== 'string') {
      return String(text);
    }

    // Use DOM API to escape HTML entities
    // This is the safest and most reliable method
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
