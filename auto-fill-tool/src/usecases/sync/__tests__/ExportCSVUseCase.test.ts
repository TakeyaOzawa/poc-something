/**
 * Unit Tests: ExportCSVUseCase
 */

import { ExportCSVUseCase } from '../ExportCSVUseCase';
import { CSVConverter } from '@domain/types/csv-converter.types';
import { Logger } from '@domain/types/logger.types';

// Mock Chrome storage API
const mockChromeStorage = {
  local: {
    get: jest.fn(),
  },
};

global.chrome = {
  storage: mockChromeStorage,
  runtime: {
    lastError: undefined as any,
  },
} as any;

describe('ExportCSVUseCase', () => {
  let useCase: ExportCSVUseCase;
  let mockCSVConverter: jest.Mocked<CSVConverter>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    chrome.runtime.lastError = undefined;

    mockCSVConverter = {
      parse: jest.fn(),
      generate: jest.fn(),
      isValidCSV: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    useCase = new ExportCSVUseCase(mockCSVConverter, mockLogger);
  });

  describe('execute - success cases', () => {
    it('should export data successfully', async () => {
      const storageData = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ];
      const csvData = 'name,age\nAlice,25\nBob,30';

      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: storageData });
      });
      mockCSVConverter.generate.mockResolvedValue(csvData);

      const input = {
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.csvData).toBe(csvData);
      expect(result.exportedCount).toBe(2);
      expect(mockChromeStorage.local.get).toHaveBeenCalledWith(['testData'], expect.any(Function));
      expect(mockCSVConverter.generate).toHaveBeenCalledWith(storageData, undefined);
      expect(mockLogger.info).toHaveBeenCalledWith('Exporting data from storage key: testData');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully exported 2 rows from storage key: testData'
      );
    });

    it('should export with custom generate options', async () => {
      const storageData = [{ name: 'Alice', age: 25 }];
      const csvData = 'name;age\nAlice;25';

      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: storageData });
      });
      mockCSVConverter.generate.mockResolvedValue(csvData);

      const input = {
        storageKey: 'testData',
        generateOptions: { delimiter: ';' },
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(mockCSVConverter.generate).toHaveBeenCalledWith(storageData, { delimiter: ';' });
    });

    it('should export single row', async () => {
      const storageData = [{ name: 'Alice', age: 25 }];
      const csvData = 'name,age\nAlice,25';

      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: storageData });
      });
      mockCSVConverter.generate.mockResolvedValue(csvData);

      const input = {
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.exportedCount).toBe(1);
    });

    it('should export many rows', async () => {
      const storageData = Array.from({ length: 100 }, (_, i) => ({
        name: `User${i}`,
        age: 20 + i,
      }));
      const csvData = 'name,age\n' + storageData.map((row) => `${row.name},${row.age}`).join('\n');

      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: storageData });
      });
      mockCSVConverter.generate.mockResolvedValue(csvData);

      const input = {
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.exportedCount).toBe(100);
      expect(mockLogger.debug).toHaveBeenCalledWith('Found 100 rows to export');
    });

    it('should handle different storage keys', async () => {
      const storageData = [{ id: 1, value: 'test' }];
      const csvData = 'id,value\n1,test';

      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ 'custom-key-123': storageData });
      });
      mockCSVConverter.generate.mockResolvedValue(csvData);

      const input = {
        storageKey: 'custom-key-123',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(mockChromeStorage.local.get).toHaveBeenCalledWith(
        ['custom-key-123'],
        expect.any(Function)
      );
    });
  });

  describe('execute - validation errors', () => {
    it('should fail when no data found for storage key', async () => {
      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: undefined });
      });

      const input = {
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No data found for storage key: testData');
      expect(result.csvData).toBeUndefined();
      expect(result.exportedCount).toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalledWith('No data found for storage key: testData');
      expect(mockCSVConverter.generate).not.toHaveBeenCalled();
    });

    it('should fail when storage key returns null', async () => {
      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: null });
      });

      const input = {
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No data found for storage key: testData');
    });

    it('should fail when data is not an array', async () => {
      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: { name: 'Alice', age: 25 } });
      });

      const input = {
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Data must be an array to export as CSV');
      expect(mockLogger.warn).toHaveBeenCalledWith('Data is not an array, wrapping in array');
      expect(mockCSVConverter.generate).not.toHaveBeenCalled();
    });

    it('should fail when data is a string', async () => {
      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: 'some string data' });
      });

      const input = {
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Data must be an array to export as CSV');
    });

    it('should fail when data array is empty', async () => {
      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: [] });
      });

      const input = {
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No data to export');
      expect(mockLogger.warn).toHaveBeenCalledWith('Data array is empty');
      expect(mockCSVConverter.generate).not.toHaveBeenCalled();
    });
  });

  describe('execute - error handling', () => {
    it('should handle Chrome storage get error', async () => {
      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        chrome.runtime.lastError = { message: 'Storage read failed' };
        callback({});
      });

      const input = {
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage read failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to export CSV', expect.any(Error));

      // Cleanup
      chrome.runtime.lastError = undefined;
    });

    it('should handle CSV converter generate error', async () => {
      const storageData = [{ name: 'Alice', age: 25 }];

      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: storageData });
      });
      mockCSVConverter.generate.mockRejectedValue(new Error('CSV generation failed'));

      const input = {
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('CSV generation failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to export CSV', expect.any(Error));
    });

    it('should handle non-Error exceptions', async () => {
      const storageData = [{ name: 'Alice', age: 25 }];

      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: storageData });
      });
      mockCSVConverter.generate.mockRejectedValue('String error');

      const input = {
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to export CSV data');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to export CSV', 'String error');
    });

    it('should handle null exception', async () => {
      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: [{ name: 'Alice' }] });
      });
      mockCSVConverter.generate.mockRejectedValue(null);

      const input = {
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to export CSV data');
    });
  });

  describe('execute - edge cases', () => {
    it('should handle complex nested objects in data', async () => {
      const storageData = [{ id: 1, metadata: { nested: 'value' }, tags: ['tag1', 'tag2'] }];
      const csvData = 'id,metadata,tags\n1,"[object Object]","tag1,tag2"';

      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: storageData });
      });
      mockCSVConverter.generate.mockResolvedValue(csvData);

      const input = {
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.exportedCount).toBe(1);
    });

    it('should handle data with special characters', async () => {
      const storageData = [{ name: 'Alice, Bob', description: 'Line1\nLine2' }];
      const csvData = 'name,description\n"Alice, Bob","Line1\nLine2"';

      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: storageData });
      });
      mockCSVConverter.generate.mockResolvedValue(csvData);

      const input = {
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
    });

    it('should handle empty string storage key', async () => {
      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ '': undefined });
      });

      const input = {
        storageKey: '',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No data found for storage key: ');
    });

    it('should handle data with undefined values', async () => {
      const storageData = [
        { name: 'Alice', age: undefined, city: 'Tokyo' },
        { name: 'Bob', age: 30, city: undefined },
      ];
      const csvData = 'name,age,city\nAlice,,Tokyo\nBob,30,';

      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: storageData });
      });
      mockCSVConverter.generate.mockResolvedValue(csvData);

      const input = {
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.exportedCount).toBe(2);
    });
  });
});
