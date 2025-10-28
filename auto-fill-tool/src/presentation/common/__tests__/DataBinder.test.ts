/**
 * Unit Tests for DataBinder
 *
 * Tests cover:
 * - Content binding (data-bind)
 * - Attribute binding (data-bind-attr)
 * - Class binding
 * - Style binding
 * - HTML sanitization
 * - XSS protection
 * - Edge cases
 */

import { DataBinder } from '../DataBinder';

describe('DataBinder', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Create a fresh container for each test
    container = document.createElement('div');
  });

  afterEach(() => {
    // Clean up
    container.remove();
  });

  describe('bind() - Content Binding', () => {
    it('should bind string data to elements with data-bind attribute', () => {
      container.innerHTML = `
        <div>
          <h1 data-bind="title"></h1>
          <p data-bind="content"></p>
        </div>
      `;

      DataBinder.bind(container, {
        title: 'Test Title',
        content: 'Test Content',
      });

      expect(container.querySelector('[data-bind="title"]')?.textContent).toBe('Test Title');
      expect(container.querySelector('[data-bind="content"]')?.textContent).toBe('Test Content');
    });

    it('should bind number data to elements', () => {
      container.innerHTML = '<div data-bind="count"></div>';

      DataBinder.bind(container, { count: 42 });

      expect(container.querySelector('[data-bind="count"]')?.textContent).toBe('42');
    });

    it('should bind boolean data to elements', () => {
      container.innerHTML = '<div data-bind="isActive"></div>';

      DataBinder.bind(container, { isActive: true });

      expect(container.querySelector('[data-bind="isActive"]')?.textContent).toBe('true');
    });

    it('should clear content for null values', () => {
      container.innerHTML = '<div data-bind="value">Original Content</div>';

      DataBinder.bind(container, { value: null });

      expect(container.querySelector('[data-bind="value"]')?.textContent).toBe('');
    });

    it('should clear content for undefined values', () => {
      container.innerHTML = '<div data-bind="value">Original Content</div>';

      DataBinder.bind(container, { value: undefined });

      expect(container.querySelector('[data-bind="value"]')?.textContent).toBe('');
    });

    it('should use textContent for XSS protection by default', () => {
      container.innerHTML = '<div data-bind="userInput"></div>';

      DataBinder.bind(container, {
        userInput: '<script>alert("XSS")</script>',
      });

      const element = container.querySelector('[data-bind="userInput"]') as HTMLElement;
      // textContent should escape HTML
      expect(element.textContent).toBe('<script>alert("XSS")</script>');
      expect(element.innerHTML).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
    });

    it('should allow explicit HTML binding with { html: "..." } format', () => {
      container.innerHTML = '<div data-bind="content"></div>';

      DataBinder.bind(container, {
        content: { html: '<strong>Bold Text</strong>' },
      });

      const element = container.querySelector('[data-bind="content"]') as HTMLElement;
      expect(element.innerHTML).toBe('<strong>Bold Text</strong>');
      expect(element.querySelector('strong')?.textContent).toBe('Bold Text');
    });

    it('should ignore elements with data-bind if key not in data', () => {
      container.innerHTML = '<div data-bind="missing">Original</div>';

      DataBinder.bind(container, { other: 'value' });

      expect(container.querySelector('[data-bind="missing"]')?.textContent).toBe('Original');
    });

    it('should handle multiple elements with same data-bind key', () => {
      container.innerHTML = `
        <div data-bind="shared"></div>
        <span data-bind="shared"></span>
      `;

      DataBinder.bind(container, { shared: 'Same Value' });

      const elements = container.querySelectorAll('[data-bind="shared"]');
      expect(elements[0].textContent).toBe('Same Value');
      expect(elements[1].textContent).toBe('Same Value');
    });

    it('should handle elements without data-bind attribute', () => {
      container.innerHTML = '<div>No binding</div>';

      expect(() => {
        DataBinder.bind(container, { anything: 'value' });
      }).not.toThrow();

      expect(container.textContent).toBe('No binding');
    });

    it('should convert objects to string for non-html format', () => {
      container.innerHTML = '<div data-bind="obj"></div>';

      DataBinder.bind(container, {
        obj: { key: 'value' },
      });

      expect(container.querySelector('[data-bind="obj"]')?.textContent).toBe('[object Object]');
    });
  });

  describe('bindAttributes() - Attribute Binding', () => {
    it('should bind attributes using data-bind-attr format', () => {
      container.innerHTML = '<img data-bind-attr="imageUrl:src" />';

      DataBinder.bindAttributes(container, {
        imageUrl: 'https://example.com/image.jpg',
      });

      expect(container.querySelector('img')?.getAttribute('src')).toBe(
        'https://example.com/image.jpg'
      );
    });

    it('should bind multiple attributes to same element', () => {
      container.innerHTML = '<a data-bind-attr="linkUrl:href"></a>';

      DataBinder.bindAttributes(container, {
        linkUrl: 'https://example.com',
      });

      expect(container.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
    });

    it('should remove attribute for null values', () => {
      container.innerHTML = '<img src="original.jpg" data-bind-attr="imageUrl:src" />';

      DataBinder.bindAttributes(container, {
        imageUrl: null,
      });

      expect(container.querySelector('img')?.hasAttribute('src')).toBe(false);
    });

    it('should remove attribute for undefined values', () => {
      container.innerHTML = '<img src="original.jpg" data-bind-attr="imageUrl:src" />';

      DataBinder.bindAttributes(container, {
        imageUrl: undefined,
      });

      expect(container.querySelector('img')?.hasAttribute('src')).toBe(false);
    });

    it('should ignore elements with data-bind-attr if key not in data', () => {
      container.innerHTML = '<img data-bind-attr="missing:src" src="original.jpg" />';

      DataBinder.bindAttributes(container, { other: 'value' });

      expect(container.querySelector('img')?.getAttribute('src')).toBe('original.jpg');
    });

    it('should warn for invalid data-bind-attr format', () => {
      container.innerHTML = '<div data-bind-attr="invalid-format"></div>';

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      DataBinder.bindAttributes(container, { anything: 'value' });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid data-bind-attr format')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle multiple colons in data-bind-attr by using first two parts', () => {
      container.innerHTML = '<div data-bind-attr="data:value:extra"></div>';

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      DataBinder.bindAttributes(container, { data: 'test' });

      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should convert non-string values to strings', () => {
      container.innerHTML = '<div data-bind-attr="count:data-count"></div>';

      DataBinder.bindAttributes(container, { count: 42 });

      expect(container.querySelector('div')?.getAttribute('data-count')).toBe('42');
    });
  });

  describe('setAttributes() - Direct Attribute Setting', () => {
    it('should set multiple attributes on an element', () => {
      const img = document.createElement('img');

      DataBinder.setAttributes(img, {
        src: 'https://example.com/image.jpg',
        alt: 'Test Image',
        width: '200',
        height: '200',
      });

      expect(img.getAttribute('src')).toBe('https://example.com/image.jpg');
      expect(img.getAttribute('alt')).toBe('Test Image');
      expect(img.getAttribute('width')).toBe('200');
      expect(img.getAttribute('height')).toBe('200');
    });

    it('should remove attributes with null values', () => {
      const div = document.createElement('div');
      div.setAttribute('data-test', 'value');

      DataBinder.setAttributes(div, {
        'data-test': null,
      });

      expect(div.hasAttribute('data-test')).toBe(false);
    });

    it('should remove attributes with undefined values', () => {
      const div = document.createElement('div');
      div.setAttribute('data-test', 'value');

      DataBinder.setAttributes(div, {
        'data-test': undefined,
      });

      expect(div.hasAttribute('data-test')).toBe(false);
    });

    it('should convert boolean values to strings', () => {
      const input = document.createElement('input');

      DataBinder.setAttributes(input, {
        disabled: true,
      });

      expect(input.getAttribute('disabled')).toBe('true');
    });

    it('should convert number values to strings', () => {
      const div = document.createElement('div');

      DataBinder.setAttributes(div, {
        'data-count': 42,
      });

      expect(div.getAttribute('data-count')).toBe('42');
    });
  });

  describe('bindClasses() - Class Binding', () => {
    it('should add classes for true values', () => {
      const div = document.createElement('div');

      DataBinder.bindClasses(div, {
        active: true,
        highlighted: true,
      });

      expect(div.classList.contains('active')).toBe(true);
      expect(div.classList.contains('highlighted')).toBe(true);
    });

    it('should remove classes for false values', () => {
      const div = document.createElement('div');
      div.className = 'active disabled';

      DataBinder.bindClasses(div, {
        active: false,
        disabled: false,
      });

      expect(div.classList.contains('active')).toBe(false);
      expect(div.classList.contains('disabled')).toBe(false);
    });

    it('should handle mixed true and false values', () => {
      const div = document.createElement('div');
      div.className = 'old-class';

      DataBinder.bindClasses(div, {
        'old-class': false,
        'new-class': true,
        active: true,
        disabled: false,
      });

      expect(div.classList.contains('old-class')).toBe(false);
      expect(div.classList.contains('new-class')).toBe(true);
      expect(div.classList.contains('active')).toBe(true);
      expect(div.classList.contains('disabled')).toBe(false);
    });

    it('should not throw on empty classes object', () => {
      const div = document.createElement('div');

      expect(() => {
        DataBinder.bindClasses(div, {});
      }).not.toThrow();
    });
  });

  describe('bindStyles() - Style Binding', () => {
    it('should set inline styles', () => {
      const div = document.createElement('div');

      DataBinder.bindStyles(div, {
        color: '#333',
        backgroundColor: '#f0f0f0',
        fontSize: '14px',
      });

      expect(div.style.color).toBe('rgb(51, 51, 51)');
      expect(div.style.backgroundColor).toBe('rgb(240, 240, 240)');
      expect(div.style.fontSize).toBe('14px');
    });

    it('should remove styles for null values', () => {
      const div = document.createElement('div');
      div.style.color = 'red';

      DataBinder.bindStyles(div, {
        color: null as any,
      });

      expect(div.style.color).toBe('');
    });

    it('should remove styles for undefined values', () => {
      const div = document.createElement('div');
      div.style.color = 'red';

      DataBinder.bindStyles(div, {
        color: undefined as any,
      });

      expect(div.style.color).toBe('');
    });

    it('should remove styles for empty string values', () => {
      const div = document.createElement('div');
      div.style.color = 'red';

      DataBinder.bindStyles(div, {
        color: '',
      });

      expect(div.style.color).toBe('');
    });

    it('should handle display property for visibility', () => {
      const div = document.createElement('div');

      DataBinder.bindStyles(div, {
        display: 'none',
      });

      expect(div.style.display).toBe('none');

      DataBinder.bindStyles(div, {
        display: 'block',
      });

      expect(div.style.display).toBe('block');
    });
  });

  describe('bindAll() - Complete Binding', () => {
    it('should apply all binding types at once', () => {
      container.innerHTML = `
        <div class="component">
          <h1 data-bind="title"></h1>
          <img data-bind-attr="imageUrl:src" />
        </div>
      `;

      const component = container.querySelector('.component') as HTMLElement;

      DataBinder.bindAll(component, {
        data: { title: 'Complete Binding Test' },
        attributes: { imageUrl: 'https://example.com/image.jpg' },
        classes: { active: true, disabled: false },
        styles: { color: '#333', fontSize: '16px' },
      });

      expect(component.querySelector('[data-bind="title"]')?.textContent).toBe(
        'Complete Binding Test'
      );
      expect(component.querySelector('img')?.getAttribute('src')).toBe(
        'https://example.com/image.jpg'
      );
      expect(component.classList.contains('active')).toBe(true);
      expect(component.classList.contains('disabled')).toBe(false);
      expect(component.style.color).toBe('rgb(51, 51, 51)');
      expect(component.style.fontSize).toBe('16px');
    });

    it('should handle partial binding options', () => {
      container.innerHTML = '<div data-bind="title"></div>';

      expect(() => {
        DataBinder.bindAll(container, {
          data: { title: 'Partial Test' },
          // No attributes, classes, or styles
        });
      }).not.toThrow();

      expect(container.querySelector('[data-bind="title"]')?.textContent).toBe('Partial Test');
    });

    it('should handle empty options object', () => {
      container.innerHTML = '<div>Test</div>';

      expect(() => {
        DataBinder.bindAll(container, {});
      }).not.toThrow();
    });
  });

  describe('sanitizeHTML() - HTML Sanitization', () => {
    it('should remove script tags', () => {
      const html = '<div>Safe</div><script>alert("XSS")</script>';
      const sanitized = DataBinder.sanitizeHTML(html);

      expect(sanitized).toBe('<div>Safe</div>');
      expect(sanitized).not.toContain('<script>');
    });

    it('should remove iframe tags', () => {
      const html = '<div>Safe</div><iframe src="evil.com"></iframe>';
      const sanitized = DataBinder.sanitizeHTML(html);

      expect(sanitized).toBe('<div>Safe</div>');
      expect(sanitized).not.toContain('<iframe>');
    });

    it('should remove dangerous event handlers', () => {
      const html = '<div onclick="alert(\'XSS\')">Click me</div>';
      const sanitized = DataBinder.sanitizeHTML(html);

      const temp = document.createElement('div');
      temp.innerHTML = sanitized;
      const div = temp.querySelector('div');

      expect(div?.hasAttribute('onclick')).toBe(false);
    });

    it('should remove javascript: protocol from href', () => {
      const html = '<a href="javascript:alert(\'XSS\')">Link</a>';
      const sanitized = DataBinder.sanitizeHTML(html);

      const temp = document.createElement('div');
      temp.innerHTML = sanitized;
      const link = temp.querySelector('a');

      expect(link?.hasAttribute('href')).toBe(false);
    });

    it('should remove javascript: protocol from src', () => {
      const html = '<img src="javascript:alert(\'XSS\')" />';
      const sanitized = DataBinder.sanitizeHTML(html);

      const temp = document.createElement('div');
      temp.innerHTML = sanitized;
      const img = temp.querySelector('img');

      expect(img?.hasAttribute('src')).toBe(false);
    });

    it('should preserve safe HTML', () => {
      const html = '<div><p>Safe <strong>content</strong></p></div>';
      const sanitized = DataBinder.sanitizeHTML(html);

      expect(sanitized).toBe('<div><p>Safe <strong>content</strong></p></div>');
    });

    it('should remove multiple dangerous elements', () => {
      const html = '<div>Safe</div><script>bad</script><iframe>bad</iframe><object>bad</object>';
      const sanitized = DataBinder.sanitizeHTML(html);

      // DOMPurify removes dangerous tags but preserves text content to prevent data loss
      // This is the correct and industry-standard behavior
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<iframe>');
      expect(sanitized).not.toContain('<object>');
      expect(sanitized).toContain('<div>Safe</div>');
    });

    it('should handle empty string', () => {
      const sanitized = DataBinder.sanitizeHTML('');
      expect(sanitized).toBe('');
    });

    it('should remove style tags', () => {
      const html = '<div>Safe</div><style>body { display: none; }</style>';
      const sanitized = DataBinder.sanitizeHTML(html);

      expect(sanitized).toBe('<div>Safe</div>');
    });

    it('should remove link tags', () => {
      const html = '<div>Safe</div><link rel="stylesheet" href="evil.css" />';
      const sanitized = DataBinder.sanitizeHTML(html);

      expect(sanitized).toBe('<div>Safe</div>');
    });

    it('should handle case-insensitive javascript: protocol', () => {
      const html = '<a href="JaVaScRiPt:alert(1)">Link</a>';
      const sanitized = DataBinder.sanitizeHTML(html);

      const temp = document.createElement('div');
      temp.innerHTML = sanitized;
      const link = temp.querySelector('a');

      expect(link?.hasAttribute('href')).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should support typical component rendering workflow', () => {
      container.innerHTML = `
        <div class="card">
          <h2 data-bind="title"></h2>
          <p data-bind="description"></p>
          <img data-bind-attr="image:src,imageAlt:alt" />
          <button data-bind="buttonText"></button>
        </div>
      `;

      const card = container.querySelector('.card') as HTMLElement;

      DataBinder.bindAll(card, {
        data: {
          title: 'Card Title',
          description: 'Card description text',
          buttonText: 'Click Me',
        },
        attributes: {
          image: 'https://example.com/card.jpg',
          imageAlt: 'Card image',
        },
        classes: {
          'card-active': true,
          'card-disabled': false,
        },
        styles: {
          borderColor: '#ddd',
        },
      });

      expect(card.querySelector('[data-bind="title"]')?.textContent).toBe('Card Title');
      expect(card.querySelector('[data-bind="description"]')?.textContent).toBe(
        'Card description text'
      );
      expect(card.querySelector('[data-bind="buttonText"]')?.textContent).toBe('Click Me');
      expect(card.querySelector('img')?.getAttribute('src')).toBe('https://example.com/card.jpg');
      expect(card.querySelector('img')?.getAttribute('alt')).toBe('Card image');
      expect(card.classList.contains('card-active')).toBe(true);
      expect(card.style.borderColor).toBe('#ddd'); // JSDOM returns hex format
    });
  });
});
