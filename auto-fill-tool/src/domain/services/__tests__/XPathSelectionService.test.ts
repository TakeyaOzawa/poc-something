/**
 * Unit Tests: XPathSelectionService
 */

import { XPathSelectionService } from '../XPathSelectionService';
import { PATH_PATTERN } from '@domain/constants/PathPattern';
import { XPathData } from '@domain/entities/XPathCollection';

describe('XPathSelectionService', () => {
  let service: XPathSelectionService;

  beforeEach(() => {
    service = new XPathSelectionService();
  });

  const createMockXPath = (overrides: Partial<XPathData> = {}): XPathData => ({
    id: 'test-id',
    websiteId: 'website-1',
    value: 'test value',
    actionType: 'type',
    actionPattern: 10,
    afterWaitSeconds: 0,
    retryType: 0,
    executionOrder: 100,
    executionTimeoutSeconds: 30,
    pathShort: '//*[@id="short"]',
    pathAbsolute: '/html/body/div[1]/form/input',
    pathSmart: '//input[@name="test"]',
    selectedPathPattern: 'smart',
    url: 'https://example.com',
    ...overrides,
  });

  describe('selectXPath', () => {
    it('should select smart path when pattern is smart', () => {
      const xpath = createMockXPath({ selectedPathPattern: PATH_PATTERN.SMART });
      expect(service.selectXPath(xpath)).toBe('//input[@name="test"]');
    });

    it('should select short path when pattern is short', () => {
      const xpath = createMockXPath({ selectedPathPattern: PATH_PATTERN.SHORT });
      expect(service.selectXPath(xpath)).toBe('//*[@id="short"]');
    });

    it('should select absolute path when pattern is absolute', () => {
      const xpath = createMockXPath({ selectedPathPattern: PATH_PATTERN.ABSOLUTE });
      expect(service.selectXPath(xpath)).toBe('/html/body/div[1]/form/input');
    });

    it('should default to smart path for unknown pattern', () => {
      const xpath = createMockXPath({ selectedPathPattern: 'unknown' as any });
      expect(service.selectXPath(xpath)).toBe('//input[@name="test"]');
    });

    it('should default to smart path for empty pattern', () => {
      const xpath = createMockXPath({ selectedPathPattern: '' as any });
      expect(service.selectXPath(xpath)).toBe('//input[@name="test"]');
    });

    it('should handle different path values', () => {
      const xpath = createMockXPath({
        pathShort: '/short/path',
        pathAbsolute: '/absolute/path',
        pathSmart: '/smart/path',
        selectedPathPattern: PATH_PATTERN.SHORT,
      });
      expect(service.selectXPath(xpath)).toBe('/short/path');
    });
  });

  describe('sortByExecutionOrder', () => {
    it('should sort xpaths in ascending order', () => {
      const xpaths = [
        createMockXPath({ id: '1', executionOrder: 300 }),
        createMockXPath({ id: '2', executionOrder: 100 }),
        createMockXPath({ id: '3', executionOrder: 200 }),
      ];

      const sorted = service.sortByExecutionOrder(xpaths);

      expect(sorted[0].executionOrder).toBe(100);
      expect(sorted[1].executionOrder).toBe(200);
      expect(sorted[2].executionOrder).toBe(300);
    });

    it('should not mutate original array', () => {
      const xpaths = [
        createMockXPath({ executionOrder: 300 }),
        createMockXPath({ executionOrder: 100 }),
      ];
      const originalOrder = xpaths.map((x) => x.executionOrder);

      service.sortByExecutionOrder(xpaths);

      expect(xpaths.map((x) => x.executionOrder)).toEqual(originalOrder);
    });

    it('should handle empty array', () => {
      const sorted = service.sortByExecutionOrder([]);
      expect(sorted).toEqual([]);
    });

    it('should handle single element', () => {
      const xpaths = [createMockXPath({ executionOrder: 100 })];
      const sorted = service.sortByExecutionOrder(xpaths);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].executionOrder).toBe(100);
    });

    it('should handle already sorted array', () => {
      const xpaths = [
        createMockXPath({ executionOrder: 100 }),
        createMockXPath({ executionOrder: 200 }),
        createMockXPath({ executionOrder: 300 }),
      ];

      const sorted = service.sortByExecutionOrder(xpaths);

      expect(sorted[0].executionOrder).toBe(100);
      expect(sorted[1].executionOrder).toBe(200);
      expect(sorted[2].executionOrder).toBe(300);
    });

    it('should handle duplicate execution orders', () => {
      const xpaths = [
        createMockXPath({ id: '1', executionOrder: 100 }),
        createMockXPath({ id: '2', executionOrder: 100 }),
        createMockXPath({ id: '3', executionOrder: 200 }),
      ];

      const sorted = service.sortByExecutionOrder(xpaths);

      expect(sorted[0].executionOrder).toBe(100);
      expect(sorted[1].executionOrder).toBe(100);
      expect(sorted[2].executionOrder).toBe(200);
    });
  });

  describe('getPatternDescription', () => {
    it('should return description for smart pattern', () => {
      const desc = service.getPatternDescription(PATH_PATTERN.SMART);
      expect(desc).toContain('Smart XPath');
      expect(desc).toContain('highest compatibility');
    });

    it('should return description for short pattern', () => {
      const desc = service.getPatternDescription(PATH_PATTERN.SHORT);
      expect(desc).toContain('Short XPath');
      expect(desc).toContain('better performance');
    });

    it('should return description for absolute pattern', () => {
      const desc = service.getPatternDescription(PATH_PATTERN.ABSOLUTE);
      expect(desc).toContain('Absolute XPath');
      expect(desc).toContain('maximum specificity');
    });

    it('should return description for none pattern', () => {
      const desc = service.getPatternDescription(PATH_PATTERN.NONE);
      expect(desc).toContain('No XPath');
      expect(desc).toContain('do not require element selection');
    });

    it('should return unknown for invalid pattern', () => {
      const desc = service.getPatternDescription('invalid' as any);
      expect(desc).toBe('Unknown pattern');
    });
  });

  describe('hasUniqueExecutionOrders', () => {
    it('should return true when all execution orders are unique', () => {
      const xpaths = [
        createMockXPath({ executionOrder: 100 }),
        createMockXPath({ executionOrder: 200 }),
        createMockXPath({ executionOrder: 300 }),
      ];

      expect(service.hasUniqueExecutionOrders(xpaths)).toBe(true);
    });

    it('should return false when there are duplicate execution orders', () => {
      const xpaths = [
        createMockXPath({ executionOrder: 100 }),
        createMockXPath({ executionOrder: 200 }),
        createMockXPath({ executionOrder: 100 }),
      ];

      expect(service.hasUniqueExecutionOrders(xpaths)).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(service.hasUniqueExecutionOrders([])).toBe(true);
    });

    it('should return true for single element', () => {
      const xpaths = [createMockXPath({ executionOrder: 100 })];
      expect(service.hasUniqueExecutionOrders(xpaths)).toBe(true);
    });
  });

  describe('findByExecutionOrder', () => {
    it('should find xpath by execution order', () => {
      const xpaths = [
        createMockXPath({ id: '1', executionOrder: 100 }),
        createMockXPath({ id: '2', executionOrder: 200 }),
        createMockXPath({ id: '3', executionOrder: 300 }),
      ];

      const found = service.findByExecutionOrder(xpaths, 200);

      expect(found).toBeDefined();
      expect(found?.id).toBe('2');
      expect(found?.executionOrder).toBe(200);
    });

    it('should return undefined when not found', () => {
      const xpaths = [
        createMockXPath({ executionOrder: 100 }),
        createMockXPath({ executionOrder: 200 }),
      ];

      const found = service.findByExecutionOrder(xpaths, 999);

      expect(found).toBeUndefined();
    });

    it('should return first match when there are duplicates', () => {
      const xpaths = [
        createMockXPath({ id: '1', executionOrder: 100 }),
        createMockXPath({ id: '2', executionOrder: 100 }),
      ];

      const found = service.findByExecutionOrder(xpaths, 100);

      expect(found?.id).toBe('1');
    });

    it('should handle empty array', () => {
      const found = service.findByExecutionOrder([], 100);
      expect(found).toBeUndefined();
    });
  });

  describe('getNextExecutionOrder', () => {
    it('should return 100 for empty array', () => {
      expect(service.getNextExecutionOrder([])).toBe(100);
    });

    it('should return max + 100', () => {
      const xpaths = [
        createMockXPath({ executionOrder: 100 }),
        createMockXPath({ executionOrder: 200 }),
        createMockXPath({ executionOrder: 300 }),
      ];

      expect(service.getNextExecutionOrder(xpaths)).toBe(400);
    });

    it('should handle single element', () => {
      const xpaths = [createMockXPath({ executionOrder: 100 })];
      expect(service.getNextExecutionOrder(xpaths)).toBe(200);
    });

    it('should handle non-standard increments', () => {
      const xpaths = [
        createMockXPath({ executionOrder: 10 }),
        createMockXPath({ executionOrder: 25 }),
        createMockXPath({ executionOrder: 137 }),
      ];

      expect(service.getNextExecutionOrder(xpaths)).toBe(237);
    });

    it('should handle large execution orders', () => {
      const xpaths = [createMockXPath({ executionOrder: 9999 })];
      expect(service.getNextExecutionOrder(xpaths)).toBe(10099);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow', () => {
      const xpaths = [
        createMockXPath({ id: '1', executionOrder: 300, selectedPathPattern: 'smart' }),
        createMockXPath({ id: '2', executionOrder: 100, selectedPathPattern: 'short' }),
        createMockXPath({ id: '3', executionOrder: 200, selectedPathPattern: 'absolute' }),
      ];

      // Sort by execution order
      const sorted = service.sortByExecutionOrder(xpaths);
      expect(sorted.map((x) => x.id)).toEqual(['2', '3', '1']);

      // Select XPaths according to pattern
      expect(service.selectXPath(sorted[0])).toBe(sorted[0].pathShort); // id:2, pattern:short
      expect(service.selectXPath(sorted[1])).toBe(sorted[1].pathAbsolute); // id:3, pattern:absolute
      expect(service.selectXPath(sorted[2])).toBe(sorted[2].pathSmart); // id:1, pattern:smart

      // Verify unique orders
      expect(service.hasUniqueExecutionOrders(xpaths)).toBe(true);

      // Get next order
      expect(service.getNextExecutionOrder(xpaths)).toBe(400);
    });
  });
});
