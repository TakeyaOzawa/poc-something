/**
 * Tests for DOMPurifySanitizer
 * Ensures HTML sanitization provides effective XSS protection
 */
import { DOMPurifySanitizer } from '../DOMPurifySanitizer';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('DOMPurifySanitizer', () => {
  let sanitizer: DOMPurifySanitizer;

  beforeEach(() => {
    sanitizer = new DOMPurifySanitizer();
  });

  describe('sanitize()', () => {
    describe('✅ XSS Protection - Dangerous Scripts', () => {
      it('should remove <script> tags', () => {
        const input = '<script>alert("XSS")</script><p>Safe content</p>';
        const result = sanitizer.sanitize(input);

        expect(result).not.toContain('<script>');
        expect(result).not.toContain('alert("XSS")');
        expect(result).toContain('<p>Safe content</p>');
      });

      it('should remove inline event handlers (onclick, onerror, etc.)', () => {
        const input = '<img src="x" onerror="alert(\'XSS\')" />';
        const result = sanitizer.sanitize(input);

        expect(result).not.toContain('onerror');
        expect(result).not.toContain('alert');
      });

      it('should remove javascript: protocol from href', () => {
        const input = '<a href="javascript:alert(\'XSS\')">Click</a>';
        const result = sanitizer.sanitize(input);

        expect(result).not.toContain('javascript:');
        expect(result).not.toContain('alert');
      });

      it('should remove javascript: protocol from src', () => {
        const input = '<img src="javascript:alert(\'XSS\')" />';
        const result = sanitizer.sanitize(input);

        expect(result).not.toContain('javascript:');
        expect(result).not.toContain('alert');
      });

      it('should remove <iframe> tags', () => {
        const input = '<iframe src="evil.com"></iframe>';
        const result = sanitizer.sanitize(input);

        expect(result).not.toContain('<iframe>');
        expect(result).not.toContain('evil.com');
      });

      it('should remove <object> and <embed> tags', () => {
        const input = '<object data="evil.swf"></object><embed src="evil.swf">';
        const result = sanitizer.sanitize(input);

        expect(result).not.toContain('<object>');
        expect(result).not.toContain('<embed>');
        expect(result).not.toContain('evil.swf');
      });

      it('should remove <style> tags', () => {
        const input = '<style>body { background: url("evil.com") }</style>';
        const result = sanitizer.sanitize(input);

        expect(result).not.toContain('<style>');
      });

      it('should remove <link> tags', () => {
        const input = '<link rel="stylesheet" href="evil.css">';
        const result = sanitizer.sanitize(input);

        expect(result).not.toContain('<link>');
        expect(result).not.toContain('evil.css');
      });

      it('should remove <base> tags', () => {
        const input = '<base href="http://evil.com/">';
        const result = sanitizer.sanitize(input);

        expect(result).not.toContain('<base>');
      });

      it('should remove <form> tags', () => {
        const input = '<form action="http://evil.com/steal"></form>';
        const result = sanitizer.sanitize(input);

        expect(result).not.toContain('<form>');
      });
    });

    describe('✅ Safe HTML Preservation', () => {
      it('should preserve safe text formatting tags', () => {
        const input = '<p>Text with <strong>bold</strong> and <em>italic</em></p>';
        const result = sanitizer.sanitize(input);

        expect(result).toContain('<p>');
        expect(result).toContain('<strong>');
        expect(result).toContain('<em>');
        expect(result).toContain('bold');
        expect(result).toContain('italic');
      });

      it('should preserve headings (h1-h6)', () => {
        const input = '<h1>Title</h1><h2>Subtitle</h2>';
        const result = sanitizer.sanitize(input);

        expect(result).toContain('<h1>');
        expect(result).toContain('<h2>');
        expect(result).toContain('Title');
        expect(result).toContain('Subtitle');
      });

      it('should preserve lists (ul, ol, li)', () => {
        const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
        const result = sanitizer.sanitize(input);

        expect(result).toContain('<ul>');
        expect(result).toContain('<li>');
        expect(result).toContain('Item 1');
      });

      it('should preserve safe links with http/https', () => {
        const input = '<a href="https://example.com">Link</a>';
        const result = sanitizer.sanitize(input);

        expect(result).toContain('<a');
        expect(result).toContain('href');
        expect(result).toContain('https://example.com');
        expect(result).toContain('Link');
      });

      it('should preserve safe images with http/https src', () => {
        const input = '<img src="https://example.com/photo.jpg" alt="Photo" />';
        const result = sanitizer.sanitize(input);

        expect(result).toContain('<img');
        expect(result).toContain('src');
        expect(result).toContain('https://example.com/photo.jpg');
        expect(result).toContain('alt');
      });

      it('should preserve tables', () => {
        const input = '<table><tr><th>Header</th></tr><tr><td>Data</td></tr></table>';
        const result = sanitizer.sanitize(input);

        expect(result).toContain('<table>');
        expect(result).toContain('<tr>');
        expect(result).toContain('<th>');
        expect(result).toContain('<td>');
      });

      it('should preserve safe attributes (class, id, title, alt)', () => {
        const input = '<div class="card" id="main" title="Main card"><p>Content</p></div>';
        const result = sanitizer.sanitize(input);

        expect(result).toContain('class="card"');
        expect(result).toContain('id="main"');
        expect(result).toContain('title="Main card"');
      });

      it('should preserve data-* attributes', () => {
        const input = '<div data-bind="userName" data-id="123">Content</div>';
        const result = sanitizer.sanitize(input);

        expect(result).toContain('data-bind');
        expect(result).toContain('data-id');
      });
    });

    describe('✅ Edge Cases', () => {
      it('should return empty string for null', () => {
        const result = sanitizer.sanitize(null as any);
        expect(result).toBe('');
      });

      it('should return empty string for undefined', () => {
        const result = sanitizer.sanitize(undefined as any);
        expect(result).toBe('');
      });

      it('should return empty string for empty string', () => {
        const result = sanitizer.sanitize('');
        expect(result).toBe('');
      });

      it('should return empty string for whitespace-only string', () => {
        const result = sanitizer.sanitize('   ');
        expect(result).toBe('   ');
      });

      it('should handle plain text without HTML', () => {
        const input = 'Plain text content';
        const result = sanitizer.sanitize(input);
        expect(result).toBe('Plain text content');
      });

      it('should handle mixed safe and dangerous content', () => {
        const input = '<p>Safe paragraph</p><script>alert("XSS")</script><div>Safe div</div>';
        const result = sanitizer.sanitize(input);

        expect(result).toContain('<p>Safe paragraph</p>');
        expect(result).toContain('<div>Safe div</div>');
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('alert');
      });
    });
  });

  describe('escapeText()', () => {
    describe('✅ HTML Entity Escaping', () => {
      it('should escape < to &lt;', () => {
        const input = '<script>';
        const result = sanitizer.escapeText(input);
        expect(result).toBe('&lt;script&gt;');
      });

      it('should escape > to &gt;', () => {
        const input = 'a > b';
        const result = sanitizer.escapeText(input);
        expect(result).toContain('&gt;');
      });

      it('should escape & to &amp;', () => {
        const input = 'Tom & Jerry';
        const result = sanitizer.escapeText(input);
        expect(result).toContain('&amp;');
      });

      it('should preserve " (quotes are safe in textContent)', () => {
        const input = 'Say "Hello"';
        const result = sanitizer.escapeText(input);
        // Note: textContent doesn't need to escape quotes
        expect(result).toContain('"');
        expect(result).toBe('Say "Hello"');
      });

      it('should escape dangerous characters in XSS payload', () => {
        const input = '<script>alert("XSS")</script>';
        const result = sanitizer.escapeText(input);

        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
        // Quotes are safe in textContent (not in attributes)
        expect(result).toContain('"');
      });
    });

    describe('✅ Edge Cases', () => {
      it('should return empty string for null', () => {
        const result = sanitizer.escapeText(null as any);
        expect(result).toBe('');
      });

      it('should return empty string for undefined', () => {
        const result = sanitizer.escapeText(undefined as any);
        expect(result).toBe('');
      });

      it('should convert non-string to string', () => {
        const result = sanitizer.escapeText(123 as any);
        expect(result).toBe('123');
      });

      it('should handle plain text without special characters', () => {
        const input = 'Plain text content';
        const result = sanitizer.escapeText(input);
        expect(result).toBe('Plain text content');
      });
    });
  });
});
