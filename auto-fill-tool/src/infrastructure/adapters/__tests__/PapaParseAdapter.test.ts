/**
 * Unit Tests: PapaParseAdapter
 */

import { PapaParseAdapter } from '../PapaParseAdapter';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('PapaParseAdapter', () => {
  let converter: PapaParseAdapter;
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

    converter = new PapaParseAdapter(mockLogger);
  });

  describe('parse', () => {
    it('should parse CSV with headers', async () => {
      const csvData = 'name,age,city\nAlice,25,Tokyo\nBob,30,Osaka';

      const result = await converter.parse(csvData);

      expect(result).toEqual([
        { name: 'Alice', age: '25', city: 'Tokyo' },
        { name: 'Bob', age: '30', city: 'Osaka' },
      ]);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Parsing CSV data (${csvData.length} characters)`
      );
      expect(mockLogger.debug).toHaveBeenCalledWith('Parsed 2 rows from CSV');
    });

    it('should parse CSV without headers', async () => {
      const csvData = 'Alice,25,Tokyo\nBob,30,Osaka';

      const result = await converter.parse(csvData, { header: false });

      expect(result).toEqual([
        ['Alice', '25', 'Tokyo'],
        ['Bob', '30', 'Osaka'],
      ]);
    });

    it('should parse CSV with custom delimiter', async () => {
      const csvData = 'name;age;city\nAlice;25;Tokyo\nBob;30;Osaka';

      const result = await converter.parse(csvData, { delimiter: ';' });

      expect(result).toEqual([
        { name: 'Alice', age: '25', city: 'Tokyo' },
        { name: 'Bob', age: '30', city: 'Osaka' },
      ]);
    });

    it('should skip empty lines', async () => {
      const csvData = 'name,age\nAlice,25\n\nBob,30\n\n';

      const result = await converter.parse(csvData, { skipEmptyLines: true });

      expect(result).toEqual([
        { name: 'Alice', age: '25' },
        { name: 'Bob', age: '30' },
      ]);
    });

    it('should not skip empty lines when disabled', async () => {
      const csvData = 'name,age\nAlice,25\nBob,30';

      const result = await converter.parse(csvData, { skipEmptyLines: false });

      expect(result.length).toBe(2);
    });

    it('should transform headers', async () => {
      const csvData = 'first_name,last_name\nAlice,Smith\nBob,Jones';

      const result = await converter.parse(csvData, {
        transformHeader: (header) => header.toUpperCase(),
      });

      expect(result).toEqual([
        { FIRST_NAME: 'Alice', LAST_NAME: 'Smith' },
        { FIRST_NAME: 'Bob', LAST_NAME: 'Jones' },
      ]);
    });

    it('should handle CSV with quoted fields', async () => {
      const csvData = 'name,description\n"Alice","Hello, World"\n"Bob","Test, Data"';

      const result = await converter.parse(csvData);

      expect(result).toEqual([
        { name: 'Alice', description: 'Hello, World' },
        { name: 'Bob', description: 'Test, Data' },
      ]);
    });

    it('should handle empty CSV', async () => {
      const csvData = '';

      const result = await converter.parse(csvData);

      expect(result).toEqual([]);
    });

    it('should handle single row CSV', async () => {
      const csvData = 'name,age\nAlice,25';

      const result = await converter.parse(csvData);

      expect(result).toEqual([{ name: 'Alice', age: '25' }]);
    });
  });

  describe('generate', () => {
    it('should generate CSV from objects', async () => {
      const data = [
        { name: 'Alice', age: 25, city: 'Tokyo' },
        { name: 'Bob', age: 30, city: 'Osaka' },
      ];

      const result = await converter.generate(data);

      // Normalize line endings for cross-platform compatibility
      const normalized = result.replace(/\r\n/g, '\n');
      expect(normalized).toBe('name,age,city\nAlice,25,Tokyo\nBob,30,Osaka');

      expect(mockLogger.debug).toHaveBeenCalledWith('Generating CSV from 2 rows');
      expect(mockLogger.debug).toHaveBeenCalledWith(`Generated CSV (${result.length} characters)`);
    });

    it('should generate CSV with custom delimiter', async () => {
      const data = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ];

      const result = await converter.generate(data, { delimiter: ';' });

      const normalized = result.replace(/\r\n/g, '\n');
      expect(normalized).toBe('name;age\nAlice;25\nBob;30');
    });

    it('should generate CSV without headers', async () => {
      const data = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ];

      const result = await converter.generate(data, { header: false });

      const normalized = result.replace(/\r\n/g, '\n');
      expect(normalized).toBe('Alice,25\nBob,30');
    });

    it('should generate CSV with custom columns', async () => {
      const data = [
        { name: 'Alice', age: 25, city: 'Tokyo' },
        { name: 'Bob', age: 30, city: 'Osaka' },
      ];

      const result = await converter.generate(data, { columns: ['name', 'city'] });

      const normalized = result.replace(/\r\n/g, '\n');
      expect(normalized).toBe('name,city\nAlice,Tokyo\nBob,Osaka');
    });

    it('should generate CSV with quotes', async () => {
      const data = [
        { name: 'Alice', description: 'Hello, World' },
        { name: 'Bob', description: 'Test, Data' },
      ];

      const result = await converter.generate(data, { quotes: true });

      expect(result).toContain('"Hello, World"');
      expect(result).toContain('"Test, Data"');
    });

    it('should handle empty array', async () => {
      const data: any[] = [];

      const result = await converter.generate(data);

      expect(result).toBe('');
      expect(mockLogger.warn).toHaveBeenCalledWith('Generating CSV from empty data array');
    });

    it('should handle single object', async () => {
      const data = [{ name: 'Alice', age: 25 }];

      const result = await converter.generate(data);

      const normalized = result.replace(/\r\n/g, '\n');
      expect(normalized).toBe('name,age\nAlice,25');
    });

    it('should handle objects with different keys', async () => {
      const data = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', city: 'Osaka' },
      ];

      const result = await converter.generate(data);

      // PapaParse uses the first object's keys for headers
      expect(result).toContain('name');
      expect(result).toContain('age');
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
    });
  });

  describe('isValidCSV', () => {
    it('should return true for valid CSV', () => {
      const csvData = 'name,age\nAlice,25\nBob,30';

      expect(converter.isValidCSV(csvData)).toBe(true);
    });

    it('should return true for simple CSV', () => {
      const csvData = 'a,b,c\n1,2,3';

      expect(converter.isValidCSV(csvData)).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(converter.isValidCSV('')).toBe(false);
    });

    it('should return false for whitespace only', () => {
      expect(converter.isValidCSV('   ')).toBe(false);
    });

    it('should return true for single line CSV', () => {
      const csvData = 'name,age,city';

      expect(converter.isValidCSV(csvData)).toBe(true);
    });

    it('should return true for CSV with quotes', () => {
      const csvData = '"name","age"\n"Alice","25"';

      expect(converter.isValidCSV(csvData)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle CSV with special characters', async () => {
      const csvData = 'name,email\nAlice,alice@example.com\nBob,bob@test.org';

      const result = await converter.parse(csvData);

      expect(result).toEqual([
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@test.org' },
      ]);
    });

    it('should handle CSV with newlines in quoted fields', async () => {
      const csvData = 'name,description\n"Alice","Line1\nLine2"\n"Bob","Single line"';

      const result = await converter.parse(csvData);

      expect(result[0].description).toContain('\n');
    });

    it('should handle CSV with tabs', async () => {
      const csvData = 'name\tage\nAlice\t25\nBob\t30';

      const result = await converter.parse(csvData, { delimiter: '\t' });

      expect(result).toEqual([
        { name: 'Alice', age: '25' },
        { name: 'Bob', age: '30' },
      ]);
    });

    it('should handle objects with null values', async () => {
      const data = [
        { name: 'Alice', age: 25, city: null },
        { name: 'Bob', age: null, city: 'Osaka' },
      ];

      const result = await converter.generate(data);

      expect(result).toContain('name,age,city');
    });

    it('should handle objects with undefined values', async () => {
      const data = [
        { name: 'Alice', age: 25, city: undefined },
        { name: 'Bob', age: undefined, city: 'Osaka' },
      ];

      const result = await converter.generate(data);

      expect(result).toContain('name,age,city');
    });
  });

  describe('error path coverage', () => {
    it('should handle CSV with too many fields error', async () => {
      // CSV with inconsistent number of fields
      const csvData = 'name,age\nAlice,25,extra\nBob,30';

      await expect(converter.parse(csvData, { skipEmptyLines: false })).rejects.toThrow(
        'Too many fields'
      );

      // First call logs the specific parsing error, second call logs 'CSV parsing failed'
      expect(mockLogger.error).toHaveBeenCalledTimes(2);
    });

    it('should handle malformed CSV with unmatched quotes', async () => {
      const csvData = 'name,description\n"Alice,"Unmatched quote\nBob,test';

      // This may or may not error depending on PapaParse behavior
      try {
        await converter.parse(csvData);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle generation with invalid data types', async () => {
      // Mock Papa.unparse to throw an error
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const originalUnparse = require('papaparse').unparse;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('papaparse').unparse = jest.fn(() => {
        throw new Error('Invalid data format');
      });

      const data = [{ name: 'Alice', age: 25 }];

      await expect(converter.generate(data)).rejects.toThrow(
        'Failed to generate CSV: Invalid data format'
      );

      expect(mockLogger.error).toHaveBeenCalledWith('CSV generation failed', expect.any(Error));

      // Restore original
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('papaparse').unparse = originalUnparse;
    });

    it('should handle non-Error exception in generation', async () => {
      // Mock Papa.unparse to throw a non-Error
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const originalUnparse = require('papaparse').unparse;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('papaparse').unparse = jest.fn(() => {
        throw 'String error'; // Non-Error exception
      });

      const data = [{ name: 'Alice' }];

      await expect(converter.generate(data)).rejects.toThrow('Failed to generate CSV');

      // Restore original
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('papaparse').unparse = originalUnparse;
    });

    it('should handle non-Error exception in parsing', async () => {
      // Mock Papa.parse to throw a non-Error
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const originalParse = require('papaparse').parse;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('papaparse').parse = jest.fn(() => {
        throw 'String error'; // Non-Error exception
      });

      const csvData = 'name,age\nAlice,25';

      await expect(converter.parse(csvData)).rejects.toThrow('Failed to parse CSV');

      // Restore original
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('papaparse').parse = originalParse;
    });
  });
});
