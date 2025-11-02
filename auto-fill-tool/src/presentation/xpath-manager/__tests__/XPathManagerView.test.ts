/**
 * Test for XPathManagerView
 */

import { XPathManagerViewImpl } from '../XPathManagerView';
import { XPathData } from '@domain/entities/XPathCollection';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { PATH_PATTERN } from '@domain/constants/PathPattern';
import { TemplateLoader } from '@presentation/common/TemplateLoader';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: Record<string, string> = {
        loading: 'Loading...',
        noXPathsSaved: 'No XPaths saved',
        duplicate: 'Duplicate',
        edit: 'Edit',
        delete: 'Delete',
        pattern: 'Pattern',
        wait: 'Wait',
        timeout: 'Timeout',
        comparisonMethod: 'Comparison',
        action: 'Action',
        retry: 'Retry',
        equalsWithRegex: 'Equals (Regex)',
        notEqualsWithRegex: 'Not Equals (Regex)',
        greaterThan: 'Greater Than',
        lessThan: 'Less Than',
        multipleSelection: 'Multiple',
        singleSelection: 'Single',
        basicSimple: 'Basic',
        frameworkAgnosticRecommended: 'Framework Agnostic',
        defaultTreatedAs20: 'Default (20)',
      };
      return messages[key] || key;
    }),
  },
}));

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('XPathManagerView', () => {
  let view: XPathManagerViewImpl;
  let mockXPathList: HTMLElement;
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    // Set up xpath-card-template for XPathCard component
    const xpathCardTemplate = document.createElement('template');
    xpathCardTemplate.id = 'xpath-card-template';
    xpathCardTemplate.innerHTML = `
      <div class="xpath-item" data-bind-attr="id:id">
        <div class="xpath-header">
          <div class="xpath-name" data-bind="title"></div>
          <div class="xpath-actions">
            <button class="btn-info" data-action="duplicate">
              📑 <span data-i18n="duplicate"></span>
            </button>
            <button class="btn-warning" data-action="edit">
              ✏️ <span data-i18n="edit"></span>
            </button>
            <button class="btn-danger" data-action="delete">
              🗑️ <span data-i18n="delete"></span>
            </button>
          </div>
        </div>
        <div class="xpath-info" data-bind="info"></div>
        <div class="xpath-data">
          <span class="xpath-data-label">Short:</span>
          <span data-bind="pathShort"></span>
        </div>
        <div class="xpath-data">
          <span class="xpath-data-label">Absolute:</span>
          <span data-bind="pathAbsolute"></span>
        </div>
        <div class="xpath-data">
          <span class="xpath-data-label">Smart:</span>
          <span data-bind="pathSmart"></span>
        </div>
      </div>
    `;
    document.body.appendChild(xpathCardTemplate);

    // Set up progress-indicator-template for ProgressIndicator component
    const progressTemplate = document.createElement('template');
    progressTemplate.id = 'progress-indicator-template';
    progressTemplate.innerHTML = `
      <div class="progress-container">
        <div class="progress-header">
          <span class="progress-text">0%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 0%"></div>
        </div>
        <div class="progress-status"></div>
      </div>
    `;
    document.body.appendChild(progressTemplate);

    // Add empty state template setup
    const emptyStateTemplate = document.createElement('template');
    emptyStateTemplate.id = 'xpath-empty-state-template';
    emptyStateTemplate.innerHTML = `
      <div class="empty-state" data-bind="message"></div>
    `;
    document.body.appendChild(emptyStateTemplate);

    mockXPathList = document.createElement('div');
    view = new XPathManagerViewImpl(mockXPathList);
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    TemplateLoader.clearCache();

    // Clean up templates
    const xpathCardTemplate = document.getElementById('xpath-card-template');
    if (xpathCardTemplate) {
      xpathCardTemplate.remove();
    }

    const progressTemplate = document.getElementById('progress-indicator-template');
    if (progressTemplate) {
      progressTemplate.remove();
    }

    const emptyStateTemplate = document.getElementById('xpath-empty-state-template');
    if (emptyStateTemplate) {
      emptyStateTemplate.remove();
    }

    jest.clearAllMocks();
    alertSpy.mockRestore();
  });

  describe('showXPaths', () => {
    it('should display list of XPaths', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.TYPE,
          value: 'test value',
          pathShort: '//input[@id="test"]',
          pathAbsolute: '/html/body/input[1]',
          pathSmart: '//input[@id="test"]',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 10,
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('xpath-1');
      expect(mockXPathList.innerHTML).toContain('test value');
      expect(mockXPathList.innerHTML).toContain('//input[@id="test"]');
    });

    it('should display multiple XPaths', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.TYPE,
          value: 'value1',
          pathShort: '//input[@id="test1"]',
          pathAbsolute: '/html/body/input[1]',
          pathSmart: '//input[@id="test1"]',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 10,
          retryType: 0,
        },
        {
          id: 'xpath-2',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 2,
          actionType: ACTION_TYPE.CLICK,
          value: '',
          pathShort: '//button[@id="submit"]',
          pathAbsolute: '/html/body/button[1]',
          pathSmart: '//button[@id="submit"]',
          selectedPathPattern: PATH_PATTERN.SMART,
          afterWaitSeconds: 1,
          executionTimeoutSeconds: 15,
          actionPattern: 20,
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('xpath-1');
      expect(mockXPathList.innerHTML).toContain('xpath-2');
      expect(mockXPathList.innerHTML).toContain('value1');
      expect(mockXPathList.innerHTML).toContain('//button[@id="submit"]');
    });

    it('should display action buttons', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.TYPE,
          value: 'test',
          pathShort: '//input',
          pathAbsolute: '/html/body/input[1]',
          pathSmart: '//input',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 10,
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('btn-info');
      expect(mockXPathList.innerHTML).toContain('btn-warning');
      expect(mockXPathList.innerHTML).toContain('btn-danger');
      expect(mockXPathList.innerHTML).toContain('Duplicate');
      expect(mockXPathList.innerHTML).toContain('Edit');
      expect(mockXPathList.innerHTML).toContain('Delete');
    });

    it('should escape HTML in XPath values', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.TYPE,
          value: '<script>alert("xss")</script>',
          pathShort: '//input[@id="test"]',
          pathAbsolute: '/html/body/input[1]',
          pathSmart: '//input[@id="test"]',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 10,
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).not.toContain('<script>');
      expect(mockXPathList.innerHTML).toContain('&lt;script&gt;');
    });

    it('should display judge action with comparison pattern', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.JUDGE,
          value: 'expected value',
          pathShort: '//div[@id="result"]',
          pathAbsolute: '/html/body/div[1]',
          pathSmart: '//div[@id="result"]',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 10,
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('Comparison');
      expect(mockXPathList.innerHTML).toContain('Equals (Regex)');
    });

    it('should display select action with action pattern details', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.SELECT_VALUE,
          value: 'option1',
          pathShort: '//select[@id="dropdown"]',
          pathAbsolute: '/html/body/select[1]',
          pathSmart: '//select[@id="dropdown"]',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 110, // Multiple + Native
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('Native');
      expect(mockXPathList.innerHTML).toContain('Multiple');
    });

    it('should display retry type if present', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.TYPE,
          value: 'test',
          pathShort: '//input',
          pathAbsolute: '/html/body/input[1]',
          pathSmart: '//input',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 10,
          retryType: 10,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('Retry');
      expect(mockXPathList.innerHTML).toContain('10');
    });
  });

  describe('showError', () => {
    it('should create error notification element', () => {
      view.showError('Test error message');

      const notification = document.body.querySelector('.notification.error');
      expect(notification).not.toBeNull();
      expect(notification?.textContent).toBe('Test error message');
    });
  });

  describe('showSuccess', () => {
    it('should create success notification element', () => {
      view.showSuccess('Test success');

      const notification = document.body.querySelector('.notification.success');
      expect(notification).not.toBeNull();
      expect(notification?.textContent).toBe('Test success');
    });
  });

  describe('showLoading', () => {
    it('should display loading indicator', () => {
      view.showLoading();

      expect(mockXPathList.innerHTML).toContain('Loading...');
    });

    it('should clear existing content', () => {
      mockXPathList.innerHTML = '<div>Previous content</div>';

      view.showLoading();

      expect(mockXPathList.innerHTML).not.toContain('Previous content');
      expect(mockXPathList.innerHTML).toContain('Loading...');
    });
  });

  describe('hideLoading', () => {
    it('should remove loading indicator', () => {
      view.showLoading();
      expect(mockXPathList.innerHTML).toContain('Loading...');

      view.hideLoading();

      expect(mockXPathList.innerHTML).not.toContain('Loading...');
    });

    it('should do nothing if loading indicator is not present', () => {
      const initialContent = '<div>Some content</div>';
      mockXPathList.innerHTML = initialContent;

      view.hideLoading();

      expect(mockXPathList.innerHTML).toBe(initialContent);
    });
  });

  describe('showEmpty', () => {
    it('should display empty state message', () => {
      view.showEmpty();

      const emptyStateElement = mockXPathList.querySelector('.empty-state');
      expect(emptyStateElement).not.toBeNull();
      expect(emptyStateElement?.textContent).toBe('No XPaths saved');
    });

    it('should clear existing content before showing empty state', () => {
      mockXPathList.innerHTML = '<div>Previous content</div>';

      view.showEmpty();

      expect(mockXPathList.innerHTML).not.toContain('Previous content');
      const emptyStateElement = mockXPathList.querySelector('.empty-state');
      expect(emptyStateElement).not.toBeNull();
    });
  });

  describe('getActionPatternDisplay', () => {
    it('should display judge comparison patterns correctly', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.JUDGE,
          value: 'test',
          pathShort: '//div',
          pathAbsolute: '/html/body/div[1]',
          pathSmart: '//div',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 20, // Not Equals
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('Not Equals (Regex)');
    });

    it('should display judge greater than pattern', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.JUDGE,
          value: '100',
          pathShort: '//div[@id="price"]',
          pathAbsolute: '/html/body/div[1]',
          pathSmart: '//div[@id="price"]',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 30, // Greater Than
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('Greater Than');
    });

    it('should display judge less than pattern', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.JUDGE,
          value: '50',
          pathShort: '//div[@id="count"]',
          pathAbsolute: '/html/body/div[1]',
          pathSmart: '//div[@id="count"]',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 40, // Less Than
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('Less Than');
    });

    it('should display select action patterns correctly', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.SELECT_TEXT,
          value: 'test',
          pathShort: '//select',
          pathAbsolute: '/html/body/select[1]',
          pathSmart: '//select',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 20, // Custom + Single
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('Custom');
      expect(mockXPathList.innerHTML).toContain('Single');
    });

    it('should display click action patterns correctly', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.CLICK,
          value: '',
          pathShort: '//button',
          pathAbsolute: '/html/body/button[1]',
          pathSmart: '//button',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 20,
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('Framework Agnostic');
    });

    it('should display default pattern as 20', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.TYPE,
          value: 'test',
          pathShort: '//input',
          pathAbsolute: '/html/body/input[1]',
          pathSmart: '//input',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 0,
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('Default (20)');
    });

    it('should handle SELECT_INDEX action type', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.SELECT_INDEX,
          value: '2',
          pathShort: '//select',
          pathAbsolute: '/html/body/select[1]',
          pathSmart: '//select',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 30, // jQuery + Single
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('jQuery');
      expect(mockXPathList.innerHTML).toContain('Single');
    });

    it('should handle SELECT_TEXT_EXACT action type', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.SELECT_TEXT_EXACT,
          value: 'Exact Text',
          pathShort: '//select',
          pathAbsolute: '/html/body/select[1]',
          pathSmart: '//select',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 120, // Multiple + Custom
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('Custom');
      expect(mockXPathList.innerHTML).toContain('Multiple');
    });

    it('should handle unknown customType in select actions', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.SELECT_VALUE,
          value: 'option',
          pathShort: '//select',
          pathAbsolute: '/html/body/select[1]',
          pathSmart: '//select',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 0, // Unknown type (0/10 = 0)
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('Unknown');
      expect(mockXPathList.innerHTML).toContain('Single');
    });

    it('should display multiple selection for select actions with actionPattern >= 100', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.SELECT_VALUE,
          value: 'options',
          pathShort: '//select[@multiple]',
          pathAbsolute: '/html/body/select[1]',
          pathSmart: '//select[@multiple]',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 110, // Multiple + Native (100 + 10)
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('Native');
      expect(mockXPathList.innerHTML).toContain('Multiple');
    });
  });

  describe('render all path patterns', () => {
    it('should display all three XPath patterns', () => {
      const xpaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          executionOrder: 1,
          actionType: ACTION_TYPE.TYPE,
          value: 'test',
          pathShort: '//input[@id="test"]',
          pathAbsolute: '/html/body/form/div/input[1]',
          pathSmart: '//form//input[@id="test"]',
          selectedPathPattern: PATH_PATTERN.SHORT,
          afterWaitSeconds: 0,
          executionTimeoutSeconds: 10,
          actionPattern: 10,
          retryType: 0,
        },
      ];

      view.showXPaths(xpaths);

      expect(mockXPathList.innerHTML).toContain('Short:');
      expect(mockXPathList.innerHTML).toContain('//input[@id="test"]');
      expect(mockXPathList.innerHTML).toContain('Absolute:');
      expect(mockXPathList.innerHTML).toContain('/html/body/form/div/input[1]');
      expect(mockXPathList.innerHTML).toContain('Smart:');
      expect(mockXPathList.innerHTML).toContain('//form//input[@id="test"]');
    });
  });

  describe('progress indicator methods', () => {
    it('should show progress indicator', () => {
      view.showProgress('Loading data', false);

      // ProgressIndicator is created but we can't easily test it without mocking
      // Just verify the method doesn't throw
      expect(() => view.showProgress('Test', true)).not.toThrow();
    });

    it('should clean up existing progress indicator when showing new one', () => {
      view.showProgress('First progress', false);
      view.showProgress('Second progress', false);

      // Should not throw and should handle cleanup
      expect(() => view.showProgress('Third', false)).not.toThrow();
    });

    it('should update progress indicator', () => {
      view.showProgress('Loading', false);
      view.updateProgress(50, 'Half done');

      // Verify the method doesn't throw
      expect(() => view.updateProgress(100, 'Complete')).not.toThrow();
    });

    it('should do nothing when updating progress without indicator', () => {
      // Call updateProgress without showProgress first
      expect(() => view.updateProgress(50, 'Test')).not.toThrow();
    });

    it('should hide progress indicator', () => {
      view.showProgress('Loading', false);
      view.hideProgress();

      // Should not throw
      expect(() => view.hideProgress()).not.toThrow();
    });

    it('should do nothing when hiding progress without indicator', () => {
      // Call hideProgress without showProgress first
      expect(() => view.hideProgress()).not.toThrow();
    });
  });
});
