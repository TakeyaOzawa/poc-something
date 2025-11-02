/**
 * Unit tests for ExecuteReceiveDataUseCase
 */

import { ExecuteReceiveDataUseCase } from '../ExecuteReceiveDataUseCase';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { NotionSyncPort, NotionPageData } from '@domain/types/notion-sync-port.types';
import { SpreadsheetSyncPort } from '@domain/types/spreadsheet-sync-port.types';
import { Logger } from '@domain/types/logger.types';
import { DataTransformationService } from '@domain/services/DataTransformationService';
import { Result } from '@domain/values/result.value';
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

describe('ExecuteReceiveDataUseCase', () => {
  let useCase: ExecuteReceiveDataUseCase;
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
      createPage: jest.fn(),
      updatePage: jest.fn(),
      getDatabaseSchema: jest.fn(),
      testConnection: jest.fn(),
      isConnected: jest.fn(),
    } as unknown as jest.Mocked<NotionSyncPort>;

    // Mock SpreadsheetSyncPort
    mockSpreadsheetAdapter = {
      connect: jest.fn().mockResolvedValue(undefined),
      getSheetData: jest.fn(),
      writeSheetData: jest.fn(),
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
      transform: jest.fn((data) => data),
    };
    (DataTransformationService as jest.Mock).mockImplementation(() => mockTransformationService);

    useCase = new ExecuteReceiveDataUseCase(mockNotionAdapter, mockSpreadsheetAdapter, mockLogger);
  });

  describe('Notion sync - success cases', () => {
    beforeEach(() => {
      mockConfig.getSyncMethod.mockReturnValue('notion');
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: 'test-database-id' },
      ]);
    });

    it('should successfully fetch from Notion and save to storage (single output)', async () => {
      const mockPages: NotionPageData[] = [
        {
          id: 'page-1',
          properties: { title: 'Page 1', status: 'Active' },
          createdTime: '2024-01-01T00:00:00Z',
          lastEditedTime: '2024-01-02T00:00:00Z',
        },
        {
          id: 'page-2',
          properties: { title: 'Page 2', status: 'Done' },
          createdTime: '2024-01-03T00:00:00Z',
          lastEditedTime: '2024-01-04T00:00:00Z',
        },
      ];

      mockNotionAdapter.queryDatabase.mockResolvedValue(Result.success(mockPages));
      mockConfig.getOutputs.mockReturnValue([{ key: 'notion-data', defaultValue: [] }]);

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(result.receivedCount).toBe(2);
      expect(mockNotionAdapter.connect).toHaveBeenCalledWith([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: 'test-database-id' },
      ]);
      expect(mockNotionAdapter.queryDatabase).toHaveBeenCalledWith('test-database-id');
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        'notion-data': [
          {
            id: 'page-1',
            title: 'Page 1',
            status: 'Active',
            createdTime: '2024-01-01T00:00:00Z',
            lastEditedTime: '2024-01-02T00:00:00Z',
          },
          {
            id: 'page-2',
            title: 'Page 2',
            status: 'Done',
            createdTime: '2024-01-03T00:00:00Z',
            lastEditedTime: '2024-01-04T00:00:00Z',
          },
        ],
      });
    });

    it('should successfully fetch from Notion with transformation', async () => {
      const mockPages: NotionPageData[] = [
        {
          id: 'page-1',
          properties: { title: 'Page 1' },
          createdTime: '2024-01-01T00:00:00Z',
          lastEditedTime: '2024-01-02T00:00:00Z',
        },
      ];

      const transformerConfig = {
        id: 'transformer-1',
        name: 'Test Transformer',
        transformationRules: [
          {
            sourceField: 'title',
            targetField: 'name',
            type: 'string' as const,
          },
        ],
        enabled: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const transformedData = { name: 'Page 1' };
      const transformationResult = { success: true, data: transformedData };

      mockNotionAdapter.queryDatabase.mockResolvedValue(Result.success(mockPages));
      mockConfig.getOutputs.mockReturnValue([{ key: 'transformed-data', defaultValue: [] }]);
      mockConfig.getTransformerConfig.mockReturnValue(transformerConfig);

      // Mock the transform method to return transformed result
      const mockTransformationService = {
        transform: jest.fn().mockReturnValue(transformationResult),
      };
      (DataTransformationService as jest.Mock).mockImplementation(() => mockTransformationService);

      useCase = new ExecuteReceiveDataUseCase(
        mockNotionAdapter,
        mockSpreadsheetAdapter,
        mockLogger
      );

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(mockTransformationService.transform).toHaveBeenCalled();
      // Verify the transformation was applied (data is stored as-is after transformation)
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        'transformed-data': transformedData,
      });
    });

    it('should handle empty Notion data', async () => {
      mockNotionAdapter.queryDatabase.mockResolvedValue(Result.success([]));
      mockConfig.getOutputs.mockReturnValue([{ key: 'empty-data', defaultValue: [] }]);

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(result.receivedCount).toBe(0);
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        'empty-data': [],
      });
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

    it('should successfully fetch from Spreadsheet and save to storage', async () => {
      const mockSheetData = [
        ['Name', 'Email', 'Status'],
        ['John Doe', 'john@example.com', 'Active'],
        ['Jane Smith', 'jane@example.com', 'Inactive'],
      ];

      mockSpreadsheetAdapter.getSheetData.mockResolvedValue(mockSheetData);
      mockConfig.getOutputs.mockReturnValue([{ key: 'sheet-data', defaultValue: [] }]);

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(result.receivedCount).toBe(1); // Non-array data counts as 1
      expect(mockSpreadsheetAdapter.connect).toHaveBeenCalledWith([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'spreadsheetId', value: 'test-spreadsheet-id' },
        { key: 'range', value: 'Sheet1!A1:C10' },
      ]);
      expect(mockSpreadsheetAdapter.getSheetData).toHaveBeenCalledWith(
        'test-spreadsheet-id',
        'Sheet1!A1:C10'
      );
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        'sheet-data': mockSheetData,
      });
    });

    it('should successfully fetch from Spreadsheet with transformation', async () => {
      const mockSheetData = [
        ['Name', 'Email'],
        ['John', 'john@example.com'],
      ];

      const transformedData = [{ name: 'John', email: 'john@example.com' }];
      const transformationResult = { success: true, data: transformedData };

      const transformerConfig = {
        id: 'transformer-2',
        name: 'Sheet Transformer',
        transformationRules: [
          {
            sourceField: 'Name',
            targetField: 'name',
            type: 'string' as const,
          },
          {
            sourceField: 'Email',
            targetField: 'email',
            type: 'string' as const,
          },
        ],
        enabled: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockSpreadsheetAdapter.getSheetData.mockResolvedValue(mockSheetData);
      mockConfig.getOutputs.mockReturnValue([{ key: 'objects-data', defaultValue: [] }]);
      mockConfig.getTransformerConfig.mockReturnValue(transformerConfig);

      // Mock the transform method to return transformed result
      const mockTransformationService = {
        transform: jest.fn().mockReturnValue(transformationResult),
      };
      (DataTransformationService as jest.Mock).mockImplementation(() => mockTransformationService);

      useCase = new ExecuteReceiveDataUseCase(
        mockNotionAdapter,
        mockSpreadsheetAdapter,
        mockLogger
      );

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(mockTransformationService.transform).toHaveBeenCalled();
      // Verify the transformation was applied (data is stored as-is after transformation)
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        'objects-data': transformedData,
      });
    });

    it('should handle empty Spreadsheet data', async () => {
      mockSpreadsheetAdapter.getSheetData.mockResolvedValue([]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'empty-sheet', defaultValue: [] }]);

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        'empty-sheet': [],
      });
    });
  });

  describe('Error cases - Notion', () => {
    beforeEach(() => {
      mockConfig.getSyncMethod.mockReturnValue('notion');
    });

    it('should return error when databaseId is missing', async () => {
      mockConfig.getInputs.mockReturnValue([{ key: 'apiKey', value: 'test-api-key' }]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: [] }]);

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('databaseId not found in inputs for Notion sync');
      expect(mockNotionAdapter.queryDatabase).not.toHaveBeenCalled();
    });

    it('should return error when databaseId value is empty', async () => {
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: '' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: [] }]);

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('databaseId not found in inputs for Notion sync');
    });

    it('should return error when adapter connection fails', async () => {
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'invalid-key' },
        { key: 'databaseId', value: 'test-db' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: [] }]);

      mockNotionAdapter.connect.mockRejectedValue(new Error('Authentication failed'));

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should return error when queryDatabase fails', async () => {
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: 'test-database-id' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: [] }]);

      mockNotionAdapter.queryDatabase.mockRejectedValue(new Error('Database not found'));

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database not found');
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

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('spreadsheetId not found in inputs for Spreadsheet sync');
      expect(mockSpreadsheetAdapter.getSheetData).not.toHaveBeenCalled();
    });

    it('should return error when range is missing', async () => {
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'spreadsheetId', value: 'test-sheet-id' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: [] }]);

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('range not found in inputs for Spreadsheet sync');
    });

    it('should return error when getSheetData fails', async () => {
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'spreadsheetId', value: 'test-sheet-id' },
        { key: 'range', value: 'A1:C10' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: [] }]);

      mockSpreadsheetAdapter.getSheetData.mockRejectedValue(
        new Error('Spreadsheet not accessible')
      );

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Spreadsheet not accessible');
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

      const mockPages: NotionPageData[] = [
        {
          id: 'page-1',
          properties: {},
          createdTime: '2024-01-01T00:00:00Z',
          lastEditedTime: '2024-01-02T00:00:00Z',
        },
      ];
      mockNotionAdapter.queryDatabase.mockResolvedValue(Result.success(mockPages));

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No outputs configured');
      expect(browser.storage.local.set).not.toHaveBeenCalled();
    });

    it('should return error for unsupported sync method', async () => {
      mockConfig.getSyncMethod.mockReturnValue('unsupported' as any);
      mockConfig.getInputs.mockReturnValue([]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: [] }]);

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported sync method');
    });

    it('should return error when storage.set fails', async () => {
      mockConfig.getSyncMethod.mockReturnValue('notion');
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: 'test-db' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: [] }]);

      const mockPages: NotionPageData[] = [
        {
          id: 'page-1',
          properties: {},
          createdTime: '2024-01-01T00:00:00Z',
          lastEditedTime: '2024-01-02T00:00:00Z',
        },
      ];
      mockNotionAdapter.queryDatabase.mockResolvedValue(Result.success(mockPages));

      (browser.storage.local.set as jest.Mock).mockRejectedValue(
        new Error('Storage quota exceeded')
      );

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage quota exceeded');
    });
  });

  describe('Logging', () => {
    it('should log info messages during successful execution', async () => {
      mockConfig.getSyncMethod.mockReturnValue('notion');
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: 'test-db' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: [] }]);

      const mockPages: NotionPageData[] = [
        {
          id: 'page-1',
          properties: {},
          createdTime: '2024-01-01T00:00:00Z',
          lastEditedTime: '2024-01-02T00:00:00Z',
        },
      ];
      mockNotionAdapter.queryDatabase.mockResolvedValue(Result.success(mockPages));

      await useCase.execute({ config: mockConfig });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Executing receive data for config',
        expect.objectContaining({
          storageKey: 'test-storage-key',
          syncMethod: 'notion',
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Data fetched successfully',
        expect.objectContaining({
          recordCount: 1,
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Saving data to Chrome Storage',
        expect.any(Object)
      );
    });

    it('should log error messages during failed execution', async () => {
      mockConfig.getSyncMethod.mockReturnValue('notion');
      mockConfig.getInputs.mockReturnValue([
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: 'test-db' },
      ]);
      mockConfig.getOutputs.mockReturnValue([{ key: 'data', defaultValue: [] }]);

      mockNotionAdapter.queryDatabase.mockRejectedValue(new Error('API error'));

      await useCase.execute({ config: mockConfig });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to execute receive data',
        expect.any(Error),
        expect.objectContaining({
          storageKey: 'test-storage-key',
          syncMethod: 'notion',
        })
      );
    });
  });
});
