/**
 * @jest-environment jsdom
 */

import { BrowserXPathGenerationAdapter } from '@infrastructure/adapters/BrowserXPathGenerationAdapter';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('BrowserXPathGenerationAdapter', () => {
  let service: BrowserXPathGenerationAdapter;

  beforeEach(() => {
    document.body.innerHTML = '';
    service = new BrowserXPathGenerationAdapter();
  });

  describe('getMixed', () => {
    it('should return null for null element', () => {
      expect(service.getMixed(null)).toBeNull();
    });

    it('should return XPath with ID when element has ID', () => {
      document.body.innerHTML = '<div id="test-id">Content</div>';
      const element = document.getElementById('test-id');

      expect(service.getMixed(element)).toBe('//*[@id="test-id"]');
    });

    it('should return /html/body for body element', () => {
      expect(service.getMixed(document.body)).toBe('/html/body');
    });

    it('should return indexed XPath for element without ID', () => {
      document.body.innerHTML = '<div><span>First</span><span>Second</span></div>';
      const spans = document.querySelectorAll('span');

      expect(service.getMixed(spans[0])).toContain('span[1]');
      expect(service.getMixed(spans[1])).toContain('span[2]');
    });
  });

  describe('getAbsolute', () => {
    it('should return null for null element', () => {
      expect(service.getAbsolute(null)).toBeNull();
    });

    it('should return /html for document element', () => {
      expect(service.getAbsolute(document.documentElement)).toBe('/html');
    });

    it('should return /html/body for body element', () => {
      expect(service.getAbsolute(document.body)).toBe('/html/body');
    });

    it('should return absolute XPath without using ID', () => {
      document.body.innerHTML = '<div id="with-id"><span>Content</span></div>';
      const span = document.querySelector('span');

      const xpath = service.getAbsolute(span);
      expect(xpath).toContain('/html/body');
      expect(xpath).not.toContain('@id');
    });
  });

  describe('getSmart', () => {
    it('should return null for null element', () => {
      expect(service.getSmart(null)).toBeNull();
    });

    it('should use ID when available', () => {
      document.body.innerHTML = '<div id="test-id"><span>Content</span></div>';
      const div = document.getElementById('test-id');

      expect(service.getSmart(div)).toContain('[@id="test-id"]');
    });

    it('should use class name', () => {
      document.body.innerHTML = '<div class="test-class another-class">Content</div>';
      const div = document.querySelector('.test-class');

      expect(service.getSmart(div)).toContain('[@class="test-class"]');
    });

    it('should use text content for links', () => {
      document.body.innerHTML = '<a href="#">Click Me</a>';
      const link = document.querySelector('a');

      expect(service.getSmart(link)).toContain('contains(text(), "Click Me")');
    });

    it('should use text content for buttons', () => {
      document.body.innerHTML = '<button>Submit</button>';
      const button = document.querySelector('button');

      expect(service.getSmart(button)).toContain('contains(text(), "Submit")');
    });

    it('should use name attribute', () => {
      document.body.innerHTML = '<input name="username" type="text" />';
      const input = document.querySelector('input');

      expect(service.getSmart(input)).toContain('[@name="username"]');
    });

    it('should use type attribute when name is not available', () => {
      document.body.innerHTML = '<input type="password" />';
      const input = document.querySelector('input');

      expect(service.getSmart(input)).toContain('[@type="password"]');
    });

    it('should use value attribute when short', () => {
      document.body.innerHTML = '<button value="short">Button</button>';
      const button = document.querySelector('button');

      expect(service.getSmart(button)).toContain('[@value="short"]');
    });

    it('should not use value attribute when too long', () => {
      const longValue = 'a'.repeat(31);
      document.body.innerHTML = `<button value="${longValue}">Button</button>`;
      const button = document.querySelector('button');

      expect(service.getSmart(button)).not.toContain('[@value=');
    });
  });

  describe('generateAll', () => {
    it('should return all three XPath variants', () => {
      document.body.innerHTML = '<div id="test"><span class="highlight">Text</span></div>';
      const span = document.querySelector('span');

      const result = service.generateAll(span);

      expect(result).toHaveProperty('smart');
      expect(result).toHaveProperty('short');
      expect(result).toHaveProperty('absolute');
      expect(result.smart).toBeTruthy();
      expect(result.short).toBeTruthy();
      expect(result.absolute).toBeTruthy();
    });

    it('should return all nulls for null element', () => {
      const result = service.generateAll(null);

      expect(result.smart).toBeNull();
      expect(result.short).toBeNull();
      expect(result.absolute).toBeNull();
    });
  });
});
