/**
 * Unit Tests: JsonPathDataMapper
 */

import { JsonPathDataMapper } from '../JsonPathDataMapper';
import { Logger } from '@domain/types/logger.types';
import { MappingRule } from '@domain/types/data-mapper.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('JsonPathDataMapper', () => {
  let mapper: JsonPathDataMapper;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    mapper = new JsonPathDataMapper(mockLogger);
  });

  describe('extract', () => {
    const sampleData = {
      users: [
        { id: 1, name: 'Alice', active: true },
        { id: 2, name: 'Bob', active: false },
        { id: 3, name: 'Charlie', active: true },
      ],
      meta: {
        total: 3,
        page: 1,
      },
    };

    it('should extract data from JSON string', async () => {
      const jsonString = JSON.stringify(sampleData);
      const result = await mapper.extract(jsonString, '$.users[*].name');

      expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Extracting data with JSONPath: $.users[*].name'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith('Extracted 3 items');
    });

    it('should extract data from JSON object', async () => {
      const result = await mapper.extract(sampleData, '$.users[*].name');

      expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should extract all items from array', async () => {
      const result = await mapper.extract(sampleData, '$.users[*]');

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: 1, name: 'Alice', active: true });
    });

    it('should extract single item', async () => {
      const result = await mapper.extract(sampleData, '$.meta.total');

      expect(result).toEqual([3]);
    });

    it('should extract with filter', async () => {
      const result = await mapper.extract(sampleData, '$.users[?(@.active==true)].name');

      expect(result).toEqual(['Alice', 'Charlie']);
    });

    it('should extract nested path', async () => {
      const result = await mapper.extract(sampleData, '$.meta.page');

      expect(result).toEqual([1]);
    });

    it('should return empty array if path matches nothing', async () => {
      const result = await mapper.extract(sampleData, '$.nonexistent');

      expect(result).toEqual([]);
    });

    it('should throw error if JSON string is invalid', async () => {
      await expect(mapper.extract('invalid json', '$.data')).rejects.toThrow(
        'Failed to extract data with JSONPath "$.data"'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'JSONPath extraction failed: $.data',
        expect.any(Error)
      );
    });

    it('should throw error if JSONPath is invalid', async () => {
      await expect(mapper.extract(sampleData, 'invalid path')).rejects.toThrow(
        'Failed to extract data with JSONPath "invalid path"'
      );
    });

    it('should handle empty JSON object', async () => {
      const result = await mapper.extract({}, '$.data');

      expect(result).toEqual([]);
    });
  });

  describe('map', () => {
    const sampleData = {
      users: [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ],
      meta: {
        total: 2,
        page: 1,
      },
    };

    it('should apply single mapping rule', async () => {
      const rules: MappingRule[] = [{ sourcePath: '$.users[*]', targetField: 'items' }];

      const result = await mapper.map(sampleData, rules);

      expect(result).toEqual({
        items: [
          { id: 1, name: 'Alice', email: 'alice@example.com' },
          { id: 2, name: 'Bob', email: 'bob@example.com' },
        ],
      });

      expect(mockLogger.debug).toHaveBeenCalledWith('Applying 1 mapping rules');
      expect(mockLogger.debug).toHaveBeenCalledWith('Mapped 2 items to field "items"');
    });

    it('should apply multiple mapping rules', async () => {
      const rules: MappingRule[] = [
        { sourcePath: '$.users[*]', targetField: 'items' },
        { sourcePath: '$.meta.total', targetField: 'count' },
        { sourcePath: '$.meta.page', targetField: 'currentPage' },
      ];

      const result = await mapper.map(sampleData, rules);

      expect(result).toEqual({
        items: [
          { id: 1, name: 'Alice', email: 'alice@example.com' },
          { id: 2, name: 'Bob', email: 'bob@example.com' },
        ],
        count: 2,
        currentPage: 1,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith('Applying 3 mapping rules');
    });

    it('should return raw data when targetField is null', async () => {
      const rules: MappingRule[] = [{ sourcePath: '$.users[*]', targetField: null }];

      const result = await mapper.map(sampleData, rules);

      expect(result).toEqual([
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ]);
    });

    it('should unwrap single item when targetField is null', async () => {
      const rules: MappingRule[] = [{ sourcePath: '$.meta.total', targetField: null }];

      const result = await mapper.map(sampleData, rules);

      expect(result).toBe(2);
    });

    it('should unwrap single item to field', async () => {
      const rules: MappingRule[] = [{ sourcePath: '$.meta.total', targetField: 'count' }];

      const result = await mapper.map(sampleData, rules);

      expect(result).toEqual({ count: 2 });
    });

    it('should handle empty extraction result', async () => {
      const rules: MappingRule[] = [{ sourcePath: '$.nonexistent', targetField: 'missing' }];

      const result = await mapper.map(sampleData, rules);

      expect(result).toEqual({ missing: [] });
    });

    it('should throw error if JSON string is invalid', async () => {
      const rules: MappingRule[] = [{ sourcePath: '$.data', targetField: 'items' }];

      await expect(mapper.map('invalid json', rules)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith('Data mapping failed', expect.any(Error));
    });

    it('should throw error if mapping rule fails', async () => {
      const rules: MappingRule[] = [{ sourcePath: 'invalid path', targetField: 'items' }];

      await expect(mapper.map(sampleData, rules)).rejects.toThrow(
        'Failed to map data with rule "invalid path" -> "items"'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to apply mapping rule: invalid path -> items',
        expect.any(Error)
      );
    });

    it('should process JSON string input', async () => {
      const jsonString = JSON.stringify(sampleData);
      const rules: MappingRule[] = [{ sourcePath: '$.users[*]', targetField: 'items' }];

      const result = await mapper.map(jsonString, rules);

      expect(result).toEqual({
        items: [
          { id: 1, name: 'Alice', email: 'alice@example.com' },
          { id: 2, name: 'Bob', email: 'bob@example.com' },
        ],
      });
    });

    it('should handle empty rules array', async () => {
      const rules: MappingRule[] = [];

      const result = await mapper.map(sampleData, rules);

      expect(result).toEqual({});
      expect(mockLogger.debug).toHaveBeenCalledWith('Applying 0 mapping rules');
    });
  });

  describe('isValidPath', () => {
    it('should return true for valid JSONPath expressions', () => {
      expect(mapper.isValidPath('$.data')).toBe(true);
      expect(mapper.isValidPath('$.users[*]')).toBe(true);
      expect(mapper.isValidPath('$.users[0].name')).toBe(true);
      expect(mapper.isValidPath('$.users[?(@.active==true)]')).toBe(true);
      expect(mapper.isValidPath('$..name')).toBe(true);
    });

    it('should return false for invalid JSONPath expressions', () => {
      expect(mapper.isValidPath('invalid path')).toBe(false);
      expect(mapper.isValidPath('$[')).toBe(false);
      expect(mapper.isValidPath('')).toBe(false);
    });

    it('should log debug message for invalid path', () => {
      mapper.isValidPath('$[');

      expect(mockLogger.debug).toHaveBeenCalledWith('Invalid JSONPath: $[');
    });
  });

  describe('edge cases', () => {
    it('should handle deeply nested data', async () => {
      const deepData = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep',
              },
            },
          },
        },
      };

      const result = await mapper.extract(deepData, '$.level1.level2.level3.level4.value');

      expect(result).toEqual(['deep']);
    });

    it('should handle arrays at different levels', async () => {
      const data = {
        items: [{ tags: ['tag1', 'tag2'] }, { tags: ['tag3', 'tag4'] }],
      };

      const result = await mapper.extract(data, '$.items[*].tags[*]');

      expect(result).toEqual(['tag1', 'tag2', 'tag3', 'tag4']);
    });

    it('should handle special characters in field names', async () => {
      const data = {
        'user-name': 'Alice',
        'user.email': 'alice@example.com',
      };

      const result = await mapper.extract(data, "$['user-name']");

      expect(result).toEqual(['Alice']);
    });

    it('should handle numeric array indices', async () => {
      const data = {
        items: ['first', 'second', 'third'],
      };

      const result = await mapper.extract(data, '$.items[1]');

      expect(result).toEqual(['second']);
    });
  });
});
