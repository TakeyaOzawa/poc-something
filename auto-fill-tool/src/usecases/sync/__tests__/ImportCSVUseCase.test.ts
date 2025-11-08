/**
 * Unit Tests: ImportCSVUseCase
 */

import { ImportCSVUseCase } from '../ImportCSVUseCase';
import { CSVConverter } from '@domain/types/csv-converter.types';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock Chrome storage API
const mockChromeStorage = {
  local: {
    get: jest.fn(),
    set: jest.fn(),
  },
};

global.chrome = {
  storage: mockChromeStorage,
  runtime: {
    lastError: null as any,
  },
} as any;

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ImportCSVUseCase', () => {
  let useCase: ImportCSVUseCase;
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

    useCase = new ImportCSVUseCase(mockCSVConverter, mockLogger);
  });

  describe('execute - success cases', () => {
    it('should import CSV data successfully in replace mode', async () => {
      const csvData = 'name,age\nAlice,25\nBob,30';
      const parsedData = [
        { name: 'Alice', age: '25' },
        { name: 'Bob', age: '30' },
      ];

      mockCSVConverter.isValidCSV.mockReturnValue(true);
      mockCSVConverter.parse.mockResolvedValue(parsedData);
      mockChromeStorage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      const input = {
        csvData,
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(2);
      expect(result.mergedCount).toBe(0);
      expect(mockCSVConverter.isValidCSV).toHaveBeenCalledWith(csvData);
      expect(mockCSVConverter.parse).toHaveBeenCalledWith(csvData, undefined);
      expect(mockChromeStorage.local.set).toHaveBeenCalledWith(
        { testData: parsedData },
        expect.any(Function)
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Importing CSV data to storage key: testData');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully imported 2 rows to storage key: testData'
      );
    });

    it('should import CSV data with merge mode', async () => {
      const csvData = 'name,age\nCharlie,35';
      const parsedData = [{ name: 'Charlie', age: '35' }];
      const existingData = [
        { name: 'Alice', age: '25' },
        { name: 'Bob', age: '30' },
      ];

      mockCSVConverter.isValidCSV.mockReturnValue(true);
      mockCSVConverter.parse.mockResolvedValue(parsedData);
      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: existingData });
      });
      mockChromeStorage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      const input = {
        csvData,
        storageKey: 'testData',
        mergeWithExisting: true,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(result.mergedCount).toBe(2);
      expect(mockChromeStorage.local.get).toHaveBeenCalledWith(['testData'], expect.any(Function));
      expect(mockChromeStorage.local.set).toHaveBeenCalledWith(
        { testData: [...existingData, ...parsedData] },
        expect.any(Function)
      );
      expect(mockLogger.debug).toHaveBeenCalledWith('Merging with existing data');
      expect(mockLogger.debug).toHaveBeenCalledWith('Merged 1 new rows with 2 existing rows');
    });

    it('should import CSV with custom parse options', async () => {
      const csvData = 'name;age\nAlice;25';
      const parsedData = [{ name: 'Alice', age: '25' }];

      mockCSVConverter.isValidCSV.mockReturnValue(true);
      mockCSVConverter.parse.mockResolvedValue(parsedData);
      mockChromeStorage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      const input = {
        csvData,
        storageKey: 'testData',
        parseOptions: { delimiter: ';' },
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(mockCSVConverter.parse).toHaveBeenCalledWith(csvData, { delimiter: ';' });
    });

    it('should handle merge mode with no existing data', async () => {
      const csvData = 'name,age\nAlice,25';
      const parsedData = [{ name: 'Alice', age: '25' }];

      mockCSVConverter.isValidCSV.mockReturnValue(true);
      mockCSVConverter.parse.mockResolvedValue(parsedData);
      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: undefined });
      });
      mockChromeStorage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      const input = {
        csvData,
        storageKey: 'testData',
        mergeWithExisting: true,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(result.mergedCount).toBe(0);
    });

    it('should handle merge mode with non-array existing data', async () => {
      const csvData = 'name,age\nAlice,25';
      const parsedData = [{ name: 'Alice', age: '25' }];

      mockCSVConverter.isValidCSV.mockReturnValue(true);
      mockCSVConverter.parse.mockResolvedValue(parsedData);
      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testData: 'not an array' });
      });
      mockChromeStorage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      const input = {
        csvData,
        storageKey: 'testData',
        mergeWithExisting: true,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(result.mergedCount).toBe(0);
    });
  });

  describe('execute - validation errors', () => {
    it('should fail when CSV data is empty', async () => {
      const input = {
        csvData: '',
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('CSV data is empty');
      expect(mockLogger.warn).toHaveBeenCalledWith('Empty CSV data provided');
      expect(mockCSVConverter.parse).not.toHaveBeenCalled();
    });

    it('should fail when CSV data is only whitespace', async () => {
      const input = {
        csvData: '   \n\t  ',
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('CSV data is empty');
    });

    it('should fail when CSV format is invalid', async () => {
      const csvData = 'invalid csv data';

      mockCSVConverter.isValidCSV.mockReturnValue(false);

      const input = {
        csvData,
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid CSV format');
      expect(mockLogger.warn).toHaveBeenCalledWith('Invalid CSV format');
      expect(mockCSVConverter.parse).not.toHaveBeenCalled();
    });

    it('should fail when no data is parsed from CSV', async () => {
      const csvData = 'name,age\n';

      mockCSVConverter.isValidCSV.mockReturnValue(true);
      mockCSVConverter.parse.mockResolvedValue([]);

      const input = {
        csvData,
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No data found in CSV');
      expect(mockLogger.warn).toHaveBeenCalledWith('No data parsed from CSV');
      expect(mockChromeStorage.local.set).not.toHaveBeenCalled();
    });

    it('should fail when parsed data is null', async () => {
      const csvData = 'name,age\nAlice,25';

      mockCSVConverter.isValidCSV.mockReturnValue(true);
      mockCSVConverter.parse.mockResolvedValue(null as any);

      const input = {
        csvData,
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No data found in CSV');
    });
  });

  describe('execute - error handling', () => {
    it('should handle CSV converter parse error', async () => {
      const csvData = 'name,age\nAlice,25';

      mockCSVConverter.isValidCSV.mockReturnValue(true);
      mockCSVConverter.parse.mockRejectedValue(new Error('CSV parsing failed'));

      const input = {
        csvData,
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('CSV parsing failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to import CSV', expect.any(Error));
    });

    it('should handle Chrome storage get error', async () => {
      const csvData = 'name,age\nAlice,25';
      const parsedData = [{ name: 'Alice', age: '25' }];

      mockCSVConverter.isValidCSV.mockReturnValue(true);
      mockCSVConverter.parse.mockResolvedValue(parsedData);
      mockChromeStorage.local.get.mockImplementation((keys, callback) => {
        chrome.runtime.lastError = { message: 'Storage read failed' };
        callback({});
      });

      const input = {
        csvData,
        storageKey: 'testData',
        mergeWithExisting: true,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage read failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to import CSV', expect.any(Error));

      // Cleanup
      chrome.runtime.lastError = undefined;
    });

    it('should handle Chrome storage set error', async () => {
      const csvData = 'name,age\nAlice,25';
      const parsedData = [{ name: 'Alice', age: '25' }];

      mockCSVConverter.isValidCSV.mockReturnValue(true);
      mockCSVConverter.parse.mockResolvedValue(parsedData);
      mockChromeStorage.local.set.mockImplementation((data, callback) => {
        chrome.runtime.lastError = { message: 'Storage write failed' };
        callback();
      });

      const input = {
        csvData,
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage write failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to import CSV', expect.any(Error));

      // Cleanup
      chrome.runtime.lastError = undefined;
    });

    it('should handle non-Error exceptions', async () => {
      const csvData = 'name,age\nAlice,25';

      mockCSVConverter.isValidCSV.mockReturnValue(true);
      mockCSVConverter.parse.mockRejectedValue('String error');

      const input = {
        csvData,
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to import CSV data');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to import CSV', 'String error');
    });
  });

  describe('execute - edge cases', () => {
    it('should handle single row CSV', async () => {
      const csvData = 'name,age\nAlice,25';
      const parsedData = [{ name: 'Alice', age: '25' }];

      mockCSVConverter.isValidCSV.mockReturnValue(true);
      mockCSVConverter.parse.mockResolvedValue(parsedData);
      mockChromeStorage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      const input = {
        csvData,
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
    });

    it('should handle large CSV data', async () => {
      const csvData = 'name,age\n' + Array(1000).fill('Alice,25').join('\n');
      const parsedData = Array(1000).fill({ name: 'Alice', age: '25' });

      mockCSVConverter.isValidCSV.mockReturnValue(true);
      mockCSVConverter.parse.mockResolvedValue(parsedData);
      mockChromeStorage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      const input = {
        csvData,
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1000);
    });

    it('should handle special characters in storage key', async () => {
      const csvData = 'name,age\nAlice,25';
      const parsedData = [{ name: 'Alice', age: '25' }];

      mockCSVConverter.isValidCSV.mockReturnValue(true);
      mockCSVConverter.parse.mockResolvedValue(parsedData);
      mockChromeStorage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      const input = {
        csvData,
        storageKey: 'test-data_123!@#',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(mockChromeStorage.local.set).toHaveBeenCalledWith(
        { 'test-data_123!@#': parsedData },
        expect.any(Function)
      );
    });

    it('should handle CSV with complex nested data', async () => {
      const csvData = 'name,metadata\nAlice,"{""age"":25}"';
      const parsedData = [{ name: 'Alice', metadata: '{"age":25}' }];

      mockCSVConverter.isValidCSV.mockReturnValue(true);
      mockCSVConverter.parse.mockResolvedValue(parsedData);
      mockChromeStorage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      const input = {
        csvData,
        storageKey: 'testData',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
    });
  });
});
