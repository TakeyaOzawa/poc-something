/**
 * Unit Tests for TemplateLoader
 *
 * Tests cover:
 * - Template loading and caching
 * - Error handling for missing/invalid templates
 * - Cache management operations
 * - Preloading functionality
 * - DocumentFragment cloning
 */

import { TemplateLoader } from '../TemplateLoader';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('TemplateLoader', () => {
  // Setup test templates in DOM
  beforeEach(() => {
    // Clear cache before each test
    TemplateLoader.clearCache();

    // Create test templates
    const template1 = document.createElement('template');
    template1.id = 'test-template-1';
    template1.innerHTML = `
      <div class="test-component">
        <h1>Test Title</h1>
        <p>Test Content</p>
      </div>
    `;
    document.body.appendChild(template1);

    const template2 = document.createElement('template');
    template2.id = 'test-template-2';
    template2.innerHTML = `
      <div class="another-component">
        <span>Another Test</span>
      </div>
    `;
    document.body.appendChild(template2);
  });

  afterEach(() => {
    // Clean up DOM
    const template1 = document.getElementById('test-template-1');
    const template2 = document.getElementById('test-template-2');
    const nonTemplate = document.getElementById('not-a-template');

    if (template1) template1.remove();
    if (template2) template2.remove();
    if (nonTemplate) nonTemplate.remove();

    // Clear cache after each test
    TemplateLoader.clearCache();
  });

  describe('load()', () => {
    it('should load and return a DocumentFragment from a template', () => {
      const fragment = TemplateLoader.load('test-template-1');

      expect(fragment).toBeInstanceOf(DocumentFragment);

      const element = fragment.querySelector('.test-component') as HTMLElement;
      expect(element).toBeTruthy();
      expect(element.querySelector('h1')?.textContent).toBe('Test Title');
      expect(element.querySelector('p')?.textContent).toBe('Test Content');
    });

    it('should return a deep clone of the template content', () => {
      const fragment1 = TemplateLoader.load('test-template-1');
      const fragment2 = TemplateLoader.load('test-template-1');

      const element1 = fragment1.querySelector('.test-component') as HTMLElement;
      const element2 = fragment2.querySelector('.test-component') as HTMLElement;

      // Different instances
      expect(element1).not.toBe(element2);

      // But same content
      expect(element1?.innerHTML).toBe(element2?.innerHTML);
    });

    it('should cache the template after first load', () => {
      expect(TemplateLoader.getCacheSize()).toBe(0);

      TemplateLoader.load('test-template-1');
      expect(TemplateLoader.getCacheSize()).toBe(1);
      expect(TemplateLoader.has('test-template-1')).toBe(true);

      // Second load should use cache
      TemplateLoader.load('test-template-1');
      expect(TemplateLoader.getCacheSize()).toBe(1);
    });

    it('should load multiple different templates', () => {
      const fragment1 = TemplateLoader.load('test-template-1');
      const fragment2 = TemplateLoader.load('test-template-2');

      expect(fragment1.querySelector('.test-component')).toBeTruthy();
      expect(fragment2.querySelector('.another-component')).toBeTruthy();
      expect(TemplateLoader.getCacheSize()).toBe(2);
    });

    it('should throw error if template does not exist', () => {
      expect(() => {
        TemplateLoader.load('non-existent-template');
      }).toThrow('Template not found: non-existent-template');
    });

    it('should throw error if element is not a template', () => {
      // Create a non-template element with the ID
      const div = document.createElement('div');
      div.id = 'not-a-template';
      document.body.appendChild(div);

      expect(() => {
        TemplateLoader.load('not-a-template');
      }).toThrow('Element with id="not-a-template" is not a <template> element');
    });

    it('should include template ID in error message for not found', () => {
      expect(() => {
        TemplateLoader.load('missing-template');
      }).toThrow('Ensure <template id="missing-template"> exists');
    });

    it('should include element tag name in error message for wrong type', () => {
      const span = document.createElement('span');
      span.id = 'wrong-type';
      document.body.appendChild(span);

      try {
        TemplateLoader.load('wrong-type');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Found: SPAN');
      } finally {
        span.remove();
      }
    });
  });

  describe('has()', () => {
    it('should return false for uncached template', () => {
      expect(TemplateLoader.has('test-template-1')).toBe(false);
    });

    it('should return true for cached template', () => {
      TemplateLoader.load('test-template-1');
      expect(TemplateLoader.has('test-template-1')).toBe(true);
    });

    it('should return false for non-existent template', () => {
      expect(TemplateLoader.has('non-existent')).toBe(false);
    });
  });

  describe('clearCache()', () => {
    it('should clear all cached templates', () => {
      TemplateLoader.load('test-template-1');
      TemplateLoader.load('test-template-2');
      expect(TemplateLoader.getCacheSize()).toBe(2);

      TemplateLoader.clearCache();

      expect(TemplateLoader.getCacheSize()).toBe(0);
      expect(TemplateLoader.has('test-template-1')).toBe(false);
      expect(TemplateLoader.has('test-template-2')).toBe(false);
    });

    it('should allow reloading after cache clear', () => {
      TemplateLoader.load('test-template-1');
      TemplateLoader.clearCache();

      // Should be able to load again
      const fragment = TemplateLoader.load('test-template-1');
      expect(fragment.querySelector('.test-component')).toBeTruthy();
      expect(TemplateLoader.getCacheSize()).toBe(1);
    });
  });

  describe('clearTemplate()', () => {
    it('should remove specific template from cache', () => {
      TemplateLoader.load('test-template-1');
      TemplateLoader.load('test-template-2');
      expect(TemplateLoader.getCacheSize()).toBe(2);

      const removed = TemplateLoader.clearTemplate('test-template-1');

      expect(removed).toBe(true);
      expect(TemplateLoader.getCacheSize()).toBe(1);
      expect(TemplateLoader.has('test-template-1')).toBe(false);
      expect(TemplateLoader.has('test-template-2')).toBe(true);
    });

    it('should return false if template was not in cache', () => {
      const removed = TemplateLoader.clearTemplate('non-existent');
      expect(removed).toBe(false);
    });

    it('should allow reloading cleared template', () => {
      TemplateLoader.load('test-template-1');
      TemplateLoader.clearTemplate('test-template-1');

      // Should be able to load again
      const fragment = TemplateLoader.load('test-template-1');
      expect(fragment.querySelector('.test-component')).toBeTruthy();
    });
  });

  describe('getCacheSize()', () => {
    it('should return 0 for empty cache', () => {
      expect(TemplateLoader.getCacheSize()).toBe(0);
    });

    it('should return correct size for cached templates', () => {
      expect(TemplateLoader.getCacheSize()).toBe(0);

      TemplateLoader.load('test-template-1');
      expect(TemplateLoader.getCacheSize()).toBe(1);

      TemplateLoader.load('test-template-2');
      expect(TemplateLoader.getCacheSize()).toBe(2);

      TemplateLoader.clearTemplate('test-template-1');
      expect(TemplateLoader.getCacheSize()).toBe(1);
    });
  });

  describe('preload()', () => {
    it('should preload multiple templates', () => {
      expect(TemplateLoader.getCacheSize()).toBe(0);

      TemplateLoader.preload(['test-template-1', 'test-template-2']);

      expect(TemplateLoader.getCacheSize()).toBe(2);
      expect(TemplateLoader.has('test-template-1')).toBe(true);
      expect(TemplateLoader.has('test-template-2')).toBe(true);
    });

    it('should not preload already cached templates', () => {
      TemplateLoader.load('test-template-1');
      expect(TemplateLoader.getCacheSize()).toBe(1);

      TemplateLoader.preload(['test-template-1', 'test-template-2']);

      expect(TemplateLoader.getCacheSize()).toBe(2);
    });

    it('should handle empty array', () => {
      TemplateLoader.preload([]);
      expect(TemplateLoader.getCacheSize()).toBe(0);
    });

    it('should throw error if template does not exist during preload', () => {
      expect(() => {
        TemplateLoader.preload(['test-template-1', 'non-existent', 'test-template-2']);
      }).toThrow('Template not found during preload: non-existent');
    });

    it('should throw error if element is not a template during preload', () => {
      const div = document.createElement('div');
      div.id = 'not-a-template';
      document.body.appendChild(div);

      expect(() => {
        TemplateLoader.preload(['test-template-1', 'not-a-template']);
      }).toThrow('Element with id="not-a-template" is not a <template> element during preload');

      div.remove();
    });

    it('should cache all templates before first error', () => {
      try {
        TemplateLoader.preload(['test-template-1', 'non-existent', 'test-template-2']);
        fail('Should have thrown an error');
      } catch (error) {
        // First template should be cached before error
        expect(TemplateLoader.has('test-template-1')).toBe(true);
        // Third template should not be cached due to error on second
        expect(TemplateLoader.has('test-template-2')).toBe(false);
      }
    });
  });

  describe('Integration scenarios', () => {
    it('should support typical component rendering workflow', () => {
      // Load template
      const fragment = TemplateLoader.load('test-template-1');

      // Extract element from fragment
      const component = fragment.querySelector('.test-component') as HTMLElement;
      expect(component).toBeTruthy();

      // Modify cloned content (should not affect cached template)
      const title = component.querySelector('h1');
      if (title) {
        title.textContent = 'Modified Title';
      }

      // Load again - should get original content
      const fragment2 = TemplateLoader.load('test-template-1');
      const component2 = fragment2.querySelector('.test-component') as HTMLElement;
      const title2 = component2.querySelector('h1');

      expect(title2?.textContent).toBe('Test Title'); // Original, not modified
    });

    it('should support preloading during initialization', () => {
      // Simulate app initialization
      const componentTemplates = ['test-template-1', 'test-template-2'];

      // Preload all templates
      TemplateLoader.preload(componentTemplates);

      // All subsequent loads should use cache
      const fragment1 = TemplateLoader.load('test-template-1');
      const fragment2 = TemplateLoader.load('test-template-2');

      expect(fragment1.querySelector('.test-component')).toBeTruthy();
      expect(fragment2.querySelector('.another-component')).toBeTruthy();

      // Cache size should remain the same (no new loads)
      expect(TemplateLoader.getCacheSize()).toBe(2);
    });

    it('should support test isolation with cache clearing', () => {
      // Test 1
      TemplateLoader.load('test-template-1');
      expect(TemplateLoader.has('test-template-1')).toBe(true);

      // Clear between tests
      TemplateLoader.clearCache();

      // Test 2 - clean state
      expect(TemplateLoader.has('test-template-1')).toBe(false);
      expect(TemplateLoader.getCacheSize()).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle template with no content', () => {
      const emptyTemplate = document.createElement('template');
      emptyTemplate.id = 'empty-template';
      document.body.appendChild(emptyTemplate);

      const fragment = TemplateLoader.load('empty-template');
      expect(fragment).toBeInstanceOf(DocumentFragment);
      expect(fragment.childNodes.length).toBe(0);

      emptyTemplate.remove();
    });

    it('should handle template with complex nested structure', () => {
      const complexTemplate = document.createElement('template');
      complexTemplate.id = 'complex-template';
      complexTemplate.innerHTML = `
        <div class="level-1">
          <div class="level-2">
            <div class="level-3">
              <span>Deep Content</span>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(complexTemplate);

      const fragment = TemplateLoader.load('complex-template');
      const deepContent = fragment.querySelector('.level-3 span');
      expect(deepContent?.textContent).toBe('Deep Content');

      complexTemplate.remove();
    });

    it('should handle template with special characters in ID', () => {
      const specialTemplate = document.createElement('template');
      specialTemplate.id = 'template-with-dashes-and_underscores_123';
      specialTemplate.innerHTML = '<div>Special</div>';
      document.body.appendChild(specialTemplate);

      const fragment = TemplateLoader.load('template-with-dashes-and_underscores_123');
      expect(fragment.querySelector('div')?.textContent).toBe('Special');

      specialTemplate.remove();
    });
  });
});
