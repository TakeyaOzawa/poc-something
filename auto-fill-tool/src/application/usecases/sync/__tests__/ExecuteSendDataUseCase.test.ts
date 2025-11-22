/**
 * Unit tests for ExecuteSendDataUseCase
 */

import { ExecuteSendDataUseCase } from '../ExecuteSendDataUseCase';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { NotionSyncPort } from '@domain/ports/NotionSyncPort';
import { SpreadsheetSyncPort } from '@domain/ports/SpreadsheetSyncPort';
import { Logger } from '@domain/types/logger.types';
import { DataTransformationService } from '@domain/services/DataTransformationService';
import browser from 'webextension-polyfill';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock dependencies
jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
}));

jest.mock('@domain/services/DataTransformationService');

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ExecuteSendDataUseCase', () => {
  let useCase: ExecuteSendDataUseCase;
  let mockNotionAdapter: jest.Mocked<NotionSyncPort>;
  let mockSpreadsheetAdapter: jest.Mocked<SpreadsheetSyncPort>;
  let mockLogger: jest.Mocked<Logger>;
  let mockConfig: jest.Mocked<StorageSyncConfig>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock NotionSyncPort
    mockNotionAdapter = {
      connect: jest.fn().mockResolvedValue(undefined),
      queryDatabase: jest.fn(),
      createPage: jest.fn().mockResolvedValue('page-id-123'),
      updatePage: jest.fn(),
      getDatabaseSchema: jest.fn(),
      testConnection: jest.fn(),
      isConnected: jest.fn(),
    } as unknown as jest.Mocked<NotionSyncPort>;

    // Mock SpreadsheetSyncPort
    mockSpreadsheetAdapter = {
      connect: jest.fn().mockResolvedValue(undefined),
      getSheetData: jest.fn(),
      writeSheetData: jest.fn().mockResolvedValue(undefined),
      appendSheetData: jest.fn(),
      getSpreadsheetMetadata: jest.fn(),
      addSheet: jest.fn(),
      testConnection: jest.fn(),
      isConnected: jest.fn(),
    } as unknown as jest.Mocked<SpreadsheetSyncPort>;

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Logger>;

    // Mock StorageSyncConfig
    mockConfig = {
      getStorageKey: jest.fn().mockReturnValue('test-storage-key'),
      getSyncMethod: jest.fn(),
      getInputs: jest.fn(),
      getOutputs: jest.fn(),
      getTransformerConfig: jest.fn().mockReturnValue(null),
    } as unknown as jest.Mocked<StorageSyncConfig>;

    // Mock DataTransformationService
    const mockTransformationService = {
      transform: jest.fn((data) => ({ success: true, data })),
    };
    (DataTransformationService as jest.Mock).mockImplementation(() => mockTransformationService);

    useCase = new ExecuteSendDataUseCase(mockNotionAdapter, mockSpreadsheetAdapter, mockLogger);
  });

  describe('Notion sync - success cases', () => {
    beforeEach(() => {
      mockConfig.getSyncMethod.mockReturnValue('notion');
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: 'test-database-id' },
      ]);
    });

    it('should successfully send single object to Notion', async () => {
      const storageData = {
        title: 'Test Page',
        status: 'Active',
      };

      mockConfig.getOutputs.mockReturnValue([{ key: 'notion-data', defaultValue: {} }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        'notion-data': storageData,
      });

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(1);
      expect(mockNotionAdapter.connect).toHaveBeenCalledWith([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: 'test-database-id' },
      ]);
      expect(mockNotionAdapter.createPage).toHaveBeenCalledWith('test-database-id', storageData);
    });

    it('should successfully send multiple objects to Notion', async () => {
      const storageData = [
        { title: 'Page 1', status: 'Active' },
        { title: 'Page 2', status: 'Done' },
        { title: 'Page 3', status: 'Pending' },
      ];

      mockConfig.getOutputs.mockReturnValue([{ key: 'notion-data', defaultValue: [] }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        'notion-data': storageData,
      });

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(3);
      expect(mockNotionAdapter.createPage).toHaveBeenCalledTimes(3);
      expect(mockNotionAdapter.createPage).toHaveBeenCalledWith('test-database-id', storageData[0]);
      expect(mockNotionAdapter.createPage).toHaveBeenCalledWith('test-database-id', storageData[1]);
      expect(mockNotionAdapter.createPage).toHaveBeenCalledWith('test-database-id', storageData[2]);
    });

    it('should successfully send to Notion with transformation', async () => {
      const storageData = { name: 'Test', email: 'test@example.com' };
      const transformedData = { title: 'Test', contact: 'test@example.com' };

      const transformerConfig = {
        id: 'transformer-1',
        name: 'Test Transformer',
        transformationRules: [
          {
            sourceField: 'name',
            targetField: 'title',
            type: 'string' as const,
          },
          {
            sourceField: 'email',
            targetField: 'contact',
            type: 'string' as const,
          },
        ],
        enabled: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: {} }]);
      mockConfig.getTransformerConfig.mockReturnValue(transformerConfig);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({ data: storageData });

      const mockTransformationService = {
        transform: jest.fn().mockReturnValue({ success: true, data: transformedData }),
      };
      (DataTransformationService as jest.Mock).mockImplementation(() => mockTransformationService);

      useCase = new ExecuteSendDataUseCase(mockNotionAdapter, mockSpreadsheetAdapter, mockLogger);

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(mockTransformationService.transform).toHaveBeenCalled();
      expect(mockNotionAdapter.createPage).toHaveBeenCalledWith(
        'test-database-id',
        transformedData
      );
    });
  });

  describe('Spreadsheet sync - success cases', () => {
    beforeEach(() => {
      mockConfig.getSyncMethod.mockReturnValue('spread-sheet');
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'spreadsheetId', value: 'test-spreadsheet-id' },
        { key: 'range', value: 'Sheet1!A1:C10' },
      ]);
    });

    it('should successfully send 2D array to Spreadsheet', async () => {
      const storageData = [
        ['Name', 'Email', 'Status'],
        ['John Doe', 'john@example.com', 'Active'],
        ['Jane Smith', 'jane@example.com', 'Inactive'],
      ];

      mockConfig.getOutputs.mockReturnValue([{ key: 'sheet-data', defaultValue: [] }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        'sheet-data': storageData,
      });

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(3);
      expect(mockSpreadsheetAdapter.connect).toHaveBeenCalledWith([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'spreadsheetId', value: 'test-spreadsheet-id' },
        { key: 'range', value: 'Sheet1!A1:C10' },
      ]);
      expect(mockSpreadsheetAdapter.writeSheetData).toHaveBeenCalledWith(
        'test-spreadsheet-id',
        'Sheet1!A1:C10',
        storageData
      );
    });

    it('should convert array of objects to 2D array with header', async () => {
      const storageData = [
        { name: 'John', email: 'john@example.com', age: 30 },
        { name: 'Jane', email: 'jane@example.com', age: 25 },
      ];

      const expected2DArray = [
        ['name', 'email', 'age'],
        ['John', 'john@example.com', 30],
        ['Jane', 'jane@example.com', 25],
      ];

      mockConfig.getOutputs.mockReturnValue([{ key: 'objects-data', defaultValue: [] }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        'objects-data': storageData,
      });

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(3);
      expect(mockSpreadsheetAdapter.writeSheetData).toHaveBeenCalledWith(
        'test-spreadsheet-id',
        'Sheet1!A1:C10',
        expected2DArray
      );
    });

    it('should convert single object to 2D array', async () => {
      const storageData = { name: 'John', email: 'john@example.com' };
      const expected2DArray = [
        ['name', 'email'],
        ['John', 'john@example.com'],
      ];

      mockConfig.getOutputs.mockReturnValue([{ key: 'single-object', defaultValue: {} }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        'single-object': storageData,
      });

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(2);
      expect(mockSpreadsheetAdapter.writeSheetData).toHaveBeenCalledWith(
        'test-spreadsheet-id',
        'Sheet1!A1:C10',
        expected2DArray
      );
    });

    it('should convert array of primitives to single column', async () => {
      const storageData = ['Value1', 'Value2', 'Value3'];
      const expected2DArray = [['Value1'], ['Value2'], ['Value3']];

      mockConfig.getOutputs.mockReturnValue([{ key: 'primitive-array', defaultValue: [] }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        'primitive-array': storageData,
      });

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(mockSpreadsheetAdapter.writeSheetData).toHaveBeenCalledWith(
        'test-spreadsheet-id',
        'Sheet1!A1:C10',
        expected2DArray
      );
    });

    it('should convert primitive value to single cell', async () => {
      const storageData = 'Single Value';
      const expected2DArray = [['Single Value']];

      mockConfig.getOutputs.mockReturnValue([{ key: 'primitive-value', defaultValue: '' }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        'primitive-value': storageData,
      });

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(mockSpreadsheetAdapter.writeSheetData).toHaveBeenCalledWith(
        'test-spreadsheet-id',
        'Sheet1!A1:C10',
        expected2DArray
      );
    });
  });

  describe('Error cases - Notion', () => {
    beforeEach(() => {
      mockConfig.getSyncMethod.mockReturnValue('notion');
    });

    it('should return error when databaseId is missing', async () => {
      mockConfig.getInputs.mockReturnValue([{ key: 'apiKey', value: 'test-api-key' }]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: {} }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({ data: { title: 'Test' } });

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('databaseId not found in inputs for Notion sync');
      expect(mockNotionAdapter.createPage).not.toHaveBeenCalled();
    });

    it('should return error when databaseId value is empty', async () => {
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: '' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: {} }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({ data: { title: 'Test' } });

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('databaseId not found in inputs for Notion sync');
    });

    it('should return error when adapter connection fails', async () => {
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'invalid-key' },
        { key: 'databaseId', value: 'test-db' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: {} }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({ data: { title: 'Test' } });

      mockNotionAdapter.connect.mockRejectedValue(new Error('Authentication failed'));

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should return error when createPage fails', async () => {
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: 'test-database-id' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: {} }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({ data: { title: 'Test' } });

      mockNotionAdapter.createPage.mockRejectedValue(new Error('Permission denied'));

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('Error cases - Spreadsheet', () => {
    beforeEach(() => {
      mockConfig.getSyncMethod.mockReturnValue('spread-sheet');
    });

    it('should return error when spreadsheetId is missing', async () => {
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'range', value: 'A1:C10' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: [] }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({ data: [[1, 2, 3]] });

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('spreadsheetId not found in inputs for Spreadsheet sync');
      expect(mockSpreadsheetAdapter.writeSheetData).not.toHaveBeenCalled();
    });

    it('should return error when range is missing', async () => {
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'spreadsheetId', value: 'test-sheet-id' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: [] }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({ data: [[1, 2, 3]] });

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('range not found in inputs for Spreadsheet sync');
    });

    it('should return error when writeSheetData fails', async () => {
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'spreadsheetId', value: 'test-sheet-id' },
        { key: 'range', value: 'A1:C10' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: [] }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({ data: [[1, 2, 3]] });

      mockSpreadsheetAdapter.writeSheetData.mockRejectedValue(
        new Error('Spreadsheet not writable')
      );

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Spreadsheet not writable');
    });
  });

  describe('Error cases - General', () => {
    it('should return error when no outputs are configured', async () => {
      mockConfig.getSyncMethod.mockReturnValue('notion');
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: 'test-db' },
      ]);
      mockConfig.getOutputs.mockReturnValue([]);

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No outputs configured');
      expect(browser.storage.local.get).not.toHaveBeenCalled();
    });

    it('should return error for unsupported sync method', async () => {
      mockConfig.getSyncMethod.mockReturnValue('unsupported' as any);
      mockConfig.getInputs.mockReturnValue([]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: {} }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({ data: {} });

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported sync method');
    });

    it('should return error when storage.get fails', async () => {
      mockConfig.getSyncMethod.mockReturnValue('notion');
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: 'test-db' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: {} }]);

      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage unavailable'));

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage unavailable');
    });

    it('should use default value when storage key is undefined', async () => {
      mockConfig.getSyncMethod.mockReturnValue('notion');
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: 'test-db' },
      ]);
      mockConfig.getOutputs.mockReturnValue([
        { key: 'missing-key', defaultValue: { title: 'Default' } },
      ]);

      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(mockNotionAdapter.createPage).toHaveBeenCalledWith('test-db', { title: 'Default' });
    });
  });

  describe('Logging', () => {
    it('should log info messages during successful execution', async () => {
      mockConfig.getSyncMethod.mockReturnValue('notion');
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: 'test-db' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: {} }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({ data: { title: 'Test' } });

      await useCase.execute({ config: mockConfig });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Executing send data for config',
        expect.objectContaining({
          storageKey: 'test-storage-key',
          syncMethod: 'notion',
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Data read from Chrome Storage',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Created 1 page in Notion database');
    });

    it('should log error messages during failed execution', async () => {
      mockConfig.getSyncMethod.mockReturnValue('notion');
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: 'test-db' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: {} }]);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({ data: { title: 'Test' } });

      mockNotionAdapter.createPage.mockRejectedValue(new Error('API error'));

      await useCase.execute({ config: mockConfig });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to execute send data',
        expect.any(Error),
        expect.objectContaining({
          storageKey: 'test-storage-key',
          syncMethod: 'notion',
        })
      );
    });
  });
});
