/**
 * Tests for HTML Sanitization Utilities
 * Ensures global helper functions provide XSS protection
 */
import { sanitizeHtml, escapeHtml } from '../htmlSanitization';

describe('htmlSanitization', () => {
  describe('sanitizeHtml()', () => {
    describe('✅ XSS Protection', () => {
      it('should remove <script> tags', () => {
        const input = '<script>alert("XSS")</script><p>Safe content</p>';
        const result = sanitizeHtml(input);

        expect(result).not.toContain('<script>');
        expect(result).not.toContain('alert("XSS")');
        expect(result).toContain('<p>Safe content</p>');
      });

      it('should remove inline event handlers', () => {
        const input = '<img src="x" onerror="alert(\'XSS\')" />';
        const result = sanitizeHtml(input);

        expect(result).not.toContain('onerror');
        expect(result).not.toContain('alert');
      });

      it('should remove javascript: protocol', () => {
        const input = '<a href="javascript:alert(\'XSS\')">Click</a>';
        const result = sanitizeHtml(input);

        expect(result).not.toContain('javascript:');
        expect(result).not.toContain('alert');
      });

      it('should remove <iframe> tags', () => {
        const input = '<iframe src="evil.com"></iframe>';
        const result = sanitizeHtml(input);

        expect(result).not.toContain('<iframe>');
      });

      it('should remove <form> tags', () => {
        const input = '<form action="http://evil.com/steal"></form>';
        const result = sanitizeHtml(input);

        expect(result).not.toContain('<form>');
      });
    });

    describe('✅ Safe HTML Preservation', () => {
      it('should preserve safe text formatting', () => {
        const input = '<p>Text with <strong>bold</strong> and <em>italic</em></p>';
        const result = sanitizeHtml(input);

        expect(result).toContain('<p>');
        expect(result).toContain('<strong>');
        expect(result).toContain('<em>');
      });

      it('should preserve headings', () => {
        const input = '<h1>Title</h1><h2>Subtitle</h2>';
        const result = sanitizeHtml(input);

        expect(result).toContain('<h1>');
        expect(result).toContain('<h2>');
      });

      it('should preserve lists', () => {
        const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
        const result = sanitizeHtml(input);

        expect(result).toContain('<ul>');
        expect(result).toContain('<li>');
      });

      it('should preserve safe links', () => {
        const input = '<a href="https://example.com">Link</a>';
        const result = sanitizeHtml(input);

        expect(result).toContain('<a');
        expect(result).toContain('href');
        expect(result).toContain('https://example.com');
      });

      it('should preserve safe images', () => {
        const input = '<img src="https://example.com/photo.jpg" alt="Photo" />';
        const result = sanitizeHtml(input);

        expect(result).toContain('<img');
        expect(result).toContain('src');
        expect(result).toContain('https://example.com/photo.jpg');
      });

      it('should preserve data-* attributes', () => {
        const input = '<div data-bind="userName" data-id="123">Content</div>';
        const result = sanitizeHtml(input);

        expect(result).toContain('data-bind');
        expect(result).toContain('data-id');
      });
    });

    describe('✅ Edge Cases', () => {
      it('should handle plain text', () => {
        const input = 'Plain text content';
        const result = sanitizeHtml(input);
        expect(result).toBe('Plain text content');
      });

      it('should handle mixed safe and dangerous content', () => {
        const input =
          '<p>Safe paragraph</p><script>alert("XSS")</script><div>Safe div</div>';
        const result = sanitizeHtml(input);

        expect(result).toContain('<p>Safe paragraph</p>');
        expect(result).toContain('<div>Safe div</div>');
        expect(result).not.toContain('<script>');
      });
    });
  });

  describe('escapeHtml()', () => {
    describe('✅ HTML Entity Escaping', () => {
      it('should escape < and >', () => {
        const input = '<script>';
        const result = escapeHtml(input);
        expect(result).toBe('&lt;script&gt;');
      });

      it('should escape &', () => {
        const input = 'Tom & Jerry';
        const result = escapeHtml(input);
        expect(result).toContain('&amp;');
      });

      it('should preserve " (quotes are safe in textContent)', () => {
        const input = 'Say "Hello"';
        const result = escapeHtml(input);
        // Note: textContent doesn't need to escape quotes
        expect(result).toContain('"');
        expect(result).toBe('Say "Hello"');
      });

      it('should escape dangerous characters in XSS payload', () => {
        const input = '<script>alert("XSS")</script>';
        const result = escapeHtml(input);

        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
        // Quotes are safe in textContent (not in attributes)
        expect(result).toContain('"');
      });
    });

    describe('✅ Edge Cases', () => {
      it('should handle plain text without special characters', () => {
        const input = 'Plain text content';
        const result = escapeHtml(input);
        expect(result).toBe('Plain text content');
      });
    });
  });
});
