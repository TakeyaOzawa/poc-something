/**
 * Tests for JSONPathDataMapper
 */

// Mock jsonpath-plus to avoid ES module issues
jest.mock('jsonpath-plus', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- Jest mock factory requires CommonJS require() for synchronous module loading. This is a standard Jest pattern for mocking dependencies during test setup, and dynamic import() cannot be used here as jest.mock() must execute synchronously before the test file loads.
  const jp = require('jsonpath');
  return {
    JSONPath: (options: any) => {
      const { path, json, wrap } = options;
      const result = jp.query(json, path);
      return wrap ? result : result.length === 1 ? result : result;
    },
  };
});

import { JSONPathDataMapper } from '../JSONPathDataMapper';
import { MappingRule } from '@domain/types/data-mapper.types';
import { Logger } from '@domain/types/logger.types';

// Mock Logger
const createMockLogger = (): jest.Mocked<Logger> => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  setLevel: jest.fn(),
  getLevel: jest.fn(),
  createChild: jest.fn(),
});

describe('JSONPathDataMapper', () => {
  let mapper: JSONPathDataMapper;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mapper = new JSONPathDataMapper(mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with logger', () => {
      expect(mockLogger.info).toHaveBeenCalledWith('JSONPathDataMapper initialized');
    });
  });

  describe('extract', () => {
    it('should extract data from JSON object', async () => {
      const data = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      };

      const result = await mapper.extract(data, '$.users[*].name');

      expect(result).toEqual(['Alice', 'Bob']);
    });

    it('should extract data from JSON string', async () => {
      const jsonString = JSON.stringify({
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      });

      const result = await mapper.extract(jsonString, '$.users[*].name');

      expect(result).toEqual(['Alice', 'Bob']);
    });

    it('should extract single value', async () => {
      const data = {
        total: 42,
        status: 'success',
      };

      const result = await mapper.extract(data, '$.total');

      expect(result).toEqual([42]);
    });

    it('should extract nested data', async () => {
      const data = {
        response: {
          data: {
            items: [
              { name: 'Item 1', price: 100 },
              { name: 'Item 2', price: 200 },
            ],
          },
        },
      };

      const result = await mapper.extract(data, '$.response.data.items[*].price');

      expect(result).toEqual([100, 200]);
    });

    it('should extract with filter', async () => {
      const data = {
        users: [
          { id: 1, name: 'Alice', active: true },
          { id: 2, name: 'Bob', active: false },
          { id: 3, name: 'Charlie', active: true },
        ],
      };

      const result = await mapper.extract(data, '$.users[?(@.active==true)].name');

      expect(result).toEqual(['Alice', 'Charlie']);
    });

    it('should extract all items from array', async () => {
      const data = {
        items: [1, 2, 3, 4, 5],
      };

      const result = await mapper.extract(data, '$.items[*]');

      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return empty array when no match', async () => {
      const data = {
        users: [],
      };

      const result = await mapper.extract(data, '$.users[*].name');

      expect(result).toEqual([]);
    });

    it('should throw error for invalid JSON string', async () => {
      const invalidJson = '{ invalid json }';

      await expect(mapper.extract(invalidJson, '$.data')).rejects.toThrow('Invalid JSON data');
    });

    it('should throw error for invalid JSONPath', async () => {
      const data = { test: 'value' };

      await expect(mapper.extract(data, 'invalid-path')).rejects.toThrow(
        'Invalid JSONPath expression'
      );
    });

    it('should extract data with complex filter', async () => {
      const data = {
        products: [
          { id: 1, name: 'Product A', price: 100, stock: 10 },
          { id: 2, name: 'Product B', price: 200, stock: 0 },
          { id: 3, name: 'Product C', price: 150, stock: 5 },
        ],
      };

      const result = await mapper.extract(data, '$.products[?(@.price > 100 && @.stock > 0)]');

      expect(result).toEqual([{ id: 3, name: 'Product C', price: 150, stock: 5 }]);
    });
  });

  describe('map', () => {
    it('should apply single mapping rule', async () => {
      const data = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      };

      const rules: MappingRule[] = [
        {
          sourcePath: '$.users[*]',
          targetField: 'items',
        },
      ];

      const result = await mapper.map(data, rules);

      expect(result).toEqual({
        items: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      });
    });

    it('should apply multiple mapping rules', async () => {
      const data = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        total: 2,
        status: 'success',
      };

      const rules: MappingRule[] = [
        { sourcePath: '$.users[*]', targetField: 'items' },
        { sourcePath: '$.total', targetField: 'count' },
        { sourcePath: '$.status', targetField: 'result' },
      ];

      const result = await mapper.map(data, rules);

      expect(result).toEqual({
        items: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        count: 2,
        result: 'success',
      });
    });

    it('should apply mapping rule with filter', async () => {
      const data = {
        users: [
          { id: 1, name: 'Alice', active: true },
          { id: 2, name: 'Bob', active: false },
          { id: 3, name: 'Charlie', active: true },
        ],
      };

      const rules: MappingRule[] = [
        {
          sourcePath: '$.users[?(@.active==true)]',
          targetField: 'activeUsers',
        },
      ];

      const result = await mapper.map(data, rules);

      expect(result.activeUsers).toEqual([
        { id: 1, name: 'Alice', active: true },
        { id: 3, name: 'Charlie', active: true },
      ]);
    });

    it('should unwrap single item array', async () => {
      const data = {
        config: {
          version: '1.0',
        },
      };

      const rules: MappingRule[] = [
        {
          sourcePath: '$.config.version',
          targetField: 'appVersion',
        },
      ];

      const result = await mapper.map(data, rules);

      expect(result).toEqual({
        appVersion: '1.0',
      });
    });

    it('should handle null targetField (return raw data)', async () => {
      const data = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      };

      const rules: MappingRule[] = [
        {
          sourcePath: '$.users[*]',
          targetField: null,
        },
      ];

      const result = await mapper.map(data, rules);

      expect(result).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
    });

    it('should handle null targetField with single item', async () => {
      const data = {
        config: { version: '1.0' },
      };

      const rules: MappingRule[] = [
        {
          sourcePath: '$.config',
          targetField: null,
        },
      ];

      const result = await mapper.map(data, rules);

      expect(result).toEqual({ version: '1.0' });
    });

    it('should handle mapping from JSON string', async () => {
      const jsonString = JSON.stringify({
        data: {
          items: [1, 2, 3],
        },
      });

      const rules: MappingRule[] = [
        {
          sourcePath: '$.data.items[*]',
          targetField: 'numbers',
        },
      ];

      const result = await mapper.map(jsonString, rules);

      expect(result).toEqual({
        numbers: [1, 2, 3],
      });
    });

    it('should throw error for invalid JSON string', async () => {
      const invalidJson = '{ invalid }';
      const rules: MappingRule[] = [{ sourcePath: '$.data', targetField: 'result' }];

      await expect(mapper.map(invalidJson, rules)).rejects.toThrow('Invalid JSON data');
    });

    it('should handle empty rules array', async () => {
      const data = { test: 'value' };
      const rules: MappingRule[] = [];

      const result = await mapper.map(data, rules);

      expect(result).toEqual({});
    });
  });

  describe('isValidPath', () => {
    it('should validate correct JSONPath with $', () => {
      expect(mapper.isValidPath('$.data')).toBe(true);
      expect(mapper.isValidPath('$.users[*]')).toBe(true);
      expect(mapper.isValidPath('$.users[0].name')).toBe(true);
      expect(mapper.isValidPath('$.items[?(@.active)]')).toBe(true);
    });

    it('should reject invalid JSONPath', () => {
      expect(mapper.isValidPath('invalid')).toBe(false);
      expect(mapper.isValidPath('data.users')).toBe(false);
      expect(mapper.isValidPath('')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(mapper.isValidPath('')).toBe(false);
    });

    it('should validate complex JSONPath expressions', () => {
      expect(mapper.isValidPath('$.store.book[*].author')).toBe(true);
      expect(mapper.isValidPath('$..author')).toBe(true);
      expect(mapper.isValidPath('$.store.*')).toBe(true);
      expect(mapper.isValidPath('$.store..price')).toBe(true);
      expect(mapper.isValidPath('$..book[2]')).toBe(true);
      expect(mapper.isValidPath('$..book[-1:]')).toBe(true);
      expect(mapper.isValidPath('$..book[0,1]')).toBe(true);
      expect(mapper.isValidPath('$..book[:2]')).toBe(true);
    });

    it('should validate JSONPath with filters', () => {
      expect(mapper.isValidPath('$.users[?(@.age > 18)]')).toBe(true);
      expect(mapper.isValidPath('$.items[?(@.price < 100)]')).toBe(true);
      expect(mapper.isValidPath('$.data[?(@.status == "active")]')).toBe(true);
    });
  });
});
