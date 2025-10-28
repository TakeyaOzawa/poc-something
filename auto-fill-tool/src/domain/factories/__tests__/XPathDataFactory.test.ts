/**
 * Unit Tests: XPathDataFactory
 * Tests business rule defaults for XPathData creation
 */

import { XPathDataFactory } from '../XPathDataFactory';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { PATH_PATTERN } from '@domain/constants/PathPattern';

describe('XPathDataFactory', () => {
  describe('DEFAULT values', () => {
    it('should define correct default values', () => {
      expect(XPathDataFactory.DEFAULT_ACTION_TYPE).toBe('type');
      expect(XPathDataFactory.DEFAULT_PATH_PATTERN).toBe('smart');
      expect(XPathDataFactory.DEFAULT_AFTER_WAIT_SECONDS).toBe(0);
      expect(XPathDataFactory.DEFAULT_ACTION_PATTERN).toBe(0);
      expect(XPathDataFactory.DEFAULT_RETRY_TYPE).toBe(0);
      expect(XPathDataFactory.DEFAULT_EXECUTION_ORDER).toBe(100);
      expect(XPathDataFactory.DEFAULT_EXECUTION_TIMEOUT_SECONDS).toBe(30);
    });
  });

  describe('createFromCSVValues', () => {
    it('should create XPathData with all values provided', () => {
      const values = [
        'xpath_123',
        'website_456',
        'Test Value',
        'click',
        '5',
        '10',
        '/html/body/div[1]',
        '//*[@id="test"]',
        '//div[@id="test"]',
        'absolute',
        '1',
        '200',
        '60',
        'https://example.com',
      ];

      const result = XPathDataFactory.createFromCSVValues(values);

      expect(result.id).toBe('xpath_123');
      expect(result.websiteId).toBe('website_456');
      expect(result.value).toBe('Test Value');
      expect(result.actionType).toBe('click');
      expect(result.afterWaitSeconds).toBe(5);
      expect(result.actionPattern).toBe(10);
      expect(result.pathAbsolute).toBe('/html/body/div[1]');
      expect(result.pathShort).toBe('//*[@id="test"]');
      expect(result.pathSmart).toBe('//div[@id="test"]');
      expect(result.selectedPathPattern).toBe('absolute');
      expect(result.retryType).toBe(1);
      expect(result.executionOrder).toBe(200);
      expect(result.executionTimeoutSeconds).toBe(60);
      expect(result.url).toBe('https://example.com');
    });

    it('should apply default actionType when empty', () => {
      const values = [
        'xpath_123',
        '',
        'Test Value',
        '', // Empty actionType
        '0',
        '0',
        '',
        '',
        '',
        'smart',
        '0',
        '100',
        '30',
        '',
      ];

      const result = XPathDataFactory.createFromCSVValues(values);

      expect(result.actionType).toBe(XPathDataFactory.DEFAULT_ACTION_TYPE);
      expect(result.actionType).toBe('type');
    });

    it('should apply default pathPattern when empty', () => {
      const values = [
        'xpath_123',
        '',
        'Test Value',
        'input',
        '0',
        '0',
        '',
        '',
        '',
        '', // Empty pathPattern
        '0',
        '100',
        '30',
        '',
      ];

      const result = XPathDataFactory.createFromCSVValues(values);

      expect(result.selectedPathPattern).toBe(XPathDataFactory.DEFAULT_PATH_PATTERN);
      expect(result.selectedPathPattern).toBe('smart');
    });

    it('should apply default numeric values for invalid inputs', () => {
      const values = [
        'xpath_123',
        '',
        'Test Value',
        'input',
        'invalid', // Invalid number -> 0
        '', // Empty -> 0
        '',
        '',
        '',
        'smart',
        'invalid', // Invalid number -> 0
        'invalid', // Invalid number -> 100
        'invalid', // Invalid number -> 30
        '',
      ];

      const result = XPathDataFactory.createFromCSVValues(values);

      expect(result.afterWaitSeconds).toBe(0);
      expect(result.actionPattern).toBe(0);
      expect(result.retryType).toBe(0);
      expect(result.executionOrder).toBe(100);
      expect(result.executionTimeoutSeconds).toBe(30);
    });

    it('should allow 0 values for numeric fields', () => {
      const values = [
        'xpath_123',
        '',
        'Test Value',
        'input',
        '0',
        '0',
        '',
        '',
        '',
        'smart',
        '0',
        '0', // 0 should be allowed (but default is 100)
        '0',
        '',
      ];

      const result = XPathDataFactory.createFromCSVValues(values);

      expect(result.afterWaitSeconds).toBe(0);
      expect(result.actionPattern).toBe(0);
      expect(result.retryType).toBe(0);
      expect(result.executionOrder).toBe(100); // 0 is falsy, so default is applied
      expect(result.executionTimeoutSeconds).toBe(0);
    });

    it('should handle empty websiteId', () => {
      const values = [
        'xpath_123',
        '', // Empty websiteId
        'Test Value',
        'input',
        '0',
        '0',
        '',
        '',
        '',
        'smart',
        '0',
        '100',
        '30',
        '',
      ];

      const result = XPathDataFactory.createFromCSVValues(values);

      expect(result.websiteId).toBe('');
    });
  });

  describe('createFromJSON', () => {
    it('should create XPathData with all values provided', () => {
      const item = {
        websiteId: 'website_456',
        value: 'Test Value',
        actionType: 'click',
        afterWaitSeconds: 5,
        actionPattern: 10,
        pathAbsolute: '/html/body/div[1]',
        pathShort: '//*[@id="test"]',
        pathSmart: '//div[@id="test"]',
        selectedPathPattern: 'absolute',
        retryType: 1,
        executionOrder: 200,
        executionTimeoutSeconds: 60,
        url: 'https://example.com',
      };

      const result = XPathDataFactory.createFromJSON(item);

      expect(result.websiteId).toBe('website_456');
      expect(result.value).toBe('Test Value');
      expect(result.actionType).toBe('click');
      expect(result.afterWaitSeconds).toBe(5);
      expect(result.actionPattern).toBe(10);
      expect(result.pathAbsolute).toBe('/html/body/div[1]');
      expect(result.pathShort).toBe('//*[@id="test"]');
      expect(result.pathSmart).toBe('//div[@id="test"]');
      expect(result.selectedPathPattern).toBe('absolute');
      expect(result.retryType).toBe(1);
      expect(result.executionOrder).toBe(200);
      expect(result.executionTimeoutSeconds).toBe(60);
      expect(result.url).toBe('https://example.com');
    });

    it('should apply default values for missing fields', () => {
      const item = {
        websiteId: 'website_456',
        value: 'Test Value',
        pathAbsolute: '/html/body/div[1]',
        pathShort: '//*[@id="test"]',
        pathSmart: '//div[@id="test"]',
        url: 'https://example.com',
      };

      const result = XPathDataFactory.createFromJSON(item);

      expect(result.actionType).toBe(XPathDataFactory.DEFAULT_ACTION_TYPE);
      expect(result.selectedPathPattern).toBe(XPathDataFactory.DEFAULT_PATH_PATTERN);
      expect(result.afterWaitSeconds).toBe(XPathDataFactory.DEFAULT_AFTER_WAIT_SECONDS);
      expect(result.actionPattern).toBe(XPathDataFactory.DEFAULT_ACTION_PATTERN);
      expect(result.retryType).toBe(XPathDataFactory.DEFAULT_RETRY_TYPE);
      expect(result.executionOrder).toBe(XPathDataFactory.DEFAULT_EXECUTION_ORDER);
      expect(result.executionTimeoutSeconds).toBe(
        XPathDataFactory.DEFAULT_EXECUTION_TIMEOUT_SECONDS
      );
    });

    it('should allow 0 values for numeric fields using nullish coalescing', () => {
      const item = {
        websiteId: 'website_456',
        value: 'Test Value',
        actionType: 'input',
        afterWaitSeconds: 0,
        actionPattern: 0,
        pathAbsolute: '',
        pathShort: '',
        pathSmart: '',
        selectedPathPattern: 'smart',
        retryType: 0,
        executionOrder: 0,
        executionTimeoutSeconds: 0,
        url: '',
      };

      const result = XPathDataFactory.createFromJSON(item);

      // These should use nullish coalescing and allow 0
      expect(result.afterWaitSeconds).toBe(0);
      expect(result.actionPattern).toBe(0);
      expect(result.retryType).toBe(0);
      expect(result.executionTimeoutSeconds).toBe(0);

      // executionOrder uses || so 0 becomes default
      expect(result.executionOrder).toBe(100);
    });

    it('should apply default for empty string fields', () => {
      const item = {
        websiteId: '',
        value: '',
        actionType: '',
        pathAbsolute: '',
        pathShort: '',
        pathSmart: '',
        selectedPathPattern: '',
        url: '',
      };

      const result = XPathDataFactory.createFromJSON(item);

      expect(result.websiteId).toBe('');
      expect(result.value).toBe('');
      expect(result.actionType).toBe(XPathDataFactory.DEFAULT_ACTION_TYPE);
      expect(result.pathAbsolute).toBe('');
      expect(result.pathShort).toBe('');
      expect(result.pathSmart).toBe('');
      expect(result.selectedPathPattern).toBe(XPathDataFactory.DEFAULT_PATH_PATTERN);
      expect(result.url).toBe('');
    });

    it('should not include id field in result', () => {
      const item = {
        websiteId: 'website_456',
        value: 'Test Value',
        pathAbsolute: '',
        pathShort: '',
        pathSmart: '',
        url: '',
      };

      const result = XPathDataFactory.createFromJSON(item);

      // Result should be Omit<XPathData, 'id'>
      expect(result).not.toHaveProperty('id');
    });
  });

  describe('getDefaultsExplanation', () => {
    it('should return explanation for all defaults', () => {
      const explanation = XPathDataFactory.getDefaultsExplanation();

      expect(explanation).toHaveProperty('actionType');
      expect(explanation).toHaveProperty('pathPattern');
      expect(explanation).toHaveProperty('afterWaitSeconds');
      expect(explanation).toHaveProperty('actionPattern');
      expect(explanation).toHaveProperty('retryType');
      expect(explanation).toHaveProperty('executionOrder');
      expect(explanation).toHaveProperty('executionTimeoutSeconds');

      expect(explanation.actionType).toContain('type');
      expect(explanation.pathPattern).toContain('smart');
      expect(explanation.executionOrder).toContain('100');
    });
  });

  describe('Business Rules Documentation', () => {
    it('should document that default actionType is "type"', () => {
      // Business Rule: "type" is the most common action type for form filling
      expect(XPathDataFactory.DEFAULT_ACTION_TYPE).toBe(ACTION_TYPE.TYPE);
    });

    it('should document that default pathPattern is "smart"', () => {
      // Business Rule: "smart" is the recommended pattern for best compatibility
      expect(XPathDataFactory.DEFAULT_PATH_PATTERN).toBe(PATH_PATTERN.SMART);
    });

    it('should document that default executionOrder is 100', () => {
      // Business Rule: 100 is the standard increment for ordering XPaths
      expect(XPathDataFactory.DEFAULT_EXECUTION_ORDER).toBe(100);
    });

    it('should document that default timeout is 30 seconds', () => {
      // Business Rule: 30 seconds is the standard timeout for XPath execution
      expect(XPathDataFactory.DEFAULT_EXECUTION_TIMEOUT_SECONDS).toBe(30);
    });
  });
});
