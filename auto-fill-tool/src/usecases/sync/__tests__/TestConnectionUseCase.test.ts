/**
 * Unit Tests: TestConnectionUseCase
 *
 * Tests the connection testing functionality using actual sync adapters.
 */

import { TestConnectionUseCase } from '../TestConnectionUseCase';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { IdGenerator } from '@domain/types/id-generator.types';
// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-sync-id'),
};
import { NotionSyncPort } from '@domain/types/notion-sync-port.types';
import { SpreadsheetSyncPort } from '@domain/types/spreadsheet-sync-port.types';
import { Logger } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';

describe('TestConnectionUseCase', () => {
  let useCase: TestConnectionUseCase;
  let mockNotionAdapter: jest.Mocked<NotionSyncPort>;
  let mockSpreadsheetAdapter: jest.Mocked<SpreadsheetSyncPort>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockNotionAdapter = {
      connect: jest.fn(),
      testConnection: jest.fn(),
      isConnected: jest.fn(),
      queryDatabase: jest.fn(),
      createPage: jest.fn(),
      updatePage: jest.fn(),
      getSchema: jest.fn(),
    } as any;

    mockSpreadsheetAdapter = {
      connect: jest.fn(),
      testConnection: jest.fn(),
      isConnected: jest.fn(),
      getSheetData: jest.fn(),
      writeSheetData: jest.fn(),
      appendSheetData: jest.fn(),
      getSpreadsheetMetadata: jest.fn(),
      addSheet: jest.fn(),
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

    useCase = new TestConnectionUseCase(mockNotionAdapter, mockSpreadsheetAdapter, mockLogger);
  });

  describe('execute - Notion connection tests', () => {
    it('should test Notion connection successfully', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [
            { key: 'apiKey', value: 'test-notion-key' },
            { key: 'databaseId', value: 'db-123' },
          ],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      mockNotionAdapter.connect.mockResolvedValue(undefined);
      mockNotionAdapter.testConnection.mockResolvedValue(Result.success(true));

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isConnectable).toBe(true);
      expect(result.responseTime).toBeDefined();
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(mockNotionAdapter.connect).toHaveBeenCalledWith([
        { key: 'apiKey', value: 'test-notion-key' },
        { key: 'databaseId', value: 'db-123' },
      ]);
      expect(mockNotionAdapter.testConnection).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Testing Notion connection')
      );
    });

    it('should handle Notion connection failure', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [{ key: 'apiKey', value: 'invalid-key' }],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      mockNotionAdapter.connect.mockResolvedValue(undefined);
      mockNotionAdapter.testConnection.mockResolvedValue(Result.success(false));

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isConnectable).toBe(false);
      expect(result.responseTime).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle Notion connection error during connect', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [{ key: 'apiKey', value: 'invalid-key' }],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      mockNotionAdapter.connect.mockRejectedValue(new Error('Invalid API key'));

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isConnectable).toBe(false);
      expect(result.error).toBe('Invalid API key');
      expect(result.responseTime).toBeDefined();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Notion connection test failed'),
        expect.any(Error)
      );
    });

    it('should handle Notion connection error during testConnection', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [{ key: 'apiKey', value: 'test-key' }],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      mockNotionAdapter.connect.mockResolvedValue(undefined);
      mockNotionAdapter.testConnection.mockRejectedValue(new Error('Network error'));

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isConnectable).toBe(false);
      expect(result.error).toBe('Network error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions for Notion', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [{ key: 'apiKey', value: 'test-key' }],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      mockNotionAdapter.connect.mockRejectedValue('String error');

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isConnectable).toBe(false);
      expect(result.error).toBe('Notion connection test failed');
    });
  });

  describe('execute - Google Sheets connection tests', () => {
    it('should test Google Sheets connection successfully with accessToken', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'spread-sheet',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [
            { key: 'spreadsheetId', value: 'sheet-123' },
            { key: 'accessToken', value: 'test-access-token' },
            { key: 'clientId', value: 'test-client-id' },
            { key: 'clientSecret', value: 'test-client-secret' },
          ],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      mockSpreadsheetAdapter.connect.mockResolvedValue(undefined);
      mockSpreadsheetAdapter.testConnection.mockResolvedValue(Result.success(true));

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isConnectable).toBe(true);
      expect(result.responseTime).toBeDefined();
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(mockSpreadsheetAdapter.connect).toHaveBeenCalledWith([
        { key: 'spreadsheetId', value: 'sheet-123' },
        { key: 'accessToken', value: 'test-access-token' },
        { key: 'clientId', value: 'test-client-id' },
        { key: 'clientSecret', value: 'test-client-secret' },
      ]);
      expect(mockSpreadsheetAdapter.testConnection).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Testing Google Sheets connection')
      );
    });

    it('should test Google Sheets connection successfully with refreshToken', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'spread-sheet',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [
            { key: 'spreadsheetId', value: 'sheet-123' },
            { key: 'refreshToken', value: 'test-refresh-token' },
            { key: 'clientId', value: 'test-client-id' },
            { key: 'clientSecret', value: 'test-client-secret' },
          ],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      mockSpreadsheetAdapter.connect.mockResolvedValue(undefined);
      mockSpreadsheetAdapter.testConnection.mockResolvedValue(Result.success(true));

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isConnectable).toBe(true);
      expect(mockSpreadsheetAdapter.connect).toHaveBeenCalled();
      expect(mockSpreadsheetAdapter.testConnection).toHaveBeenCalled();
    });

    it('should handle Google Sheets connection failure', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'spread-sheet',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [
            { key: 'spreadsheetId', value: 'sheet-123' },
            { key: 'accessToken', value: 'invalid-token' },
          ],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      mockSpreadsheetAdapter.connect.mockResolvedValue(undefined);
      mockSpreadsheetAdapter.testConnection.mockResolvedValue(Result.success(false));

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isConnectable).toBe(false);
      expect(result.responseTime).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle Google Sheets connection error during connect', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'spread-sheet',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [
            { key: 'spreadsheetId', value: 'sheet-123' },
            { key: 'accessToken', value: 'invalid-token' },
          ],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      mockSpreadsheetAdapter.connect.mockRejectedValue(new Error('Invalid access token'));

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isConnectable).toBe(false);
      expect(result.error).toBe('Invalid access token');
      expect(result.responseTime).toBeDefined();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Google Sheets connection test failed'),
        expect.any(Error)
      );
    });

    it('should handle Google Sheets connection error during testConnection', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'spread-sheet',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [
            { key: 'spreadsheetId', value: 'sheet-123' },
            { key: 'accessToken', value: 'test-token' },
          ],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      mockSpreadsheetAdapter.connect.mockResolvedValue(undefined);
      mockSpreadsheetAdapter.testConnection.mockRejectedValue(new Error('Rate limit exceeded'));

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isConnectable).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions for Google Sheets', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'spread-sheet',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [{ key: 'accessToken', value: 'test-token' }],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      mockSpreadsheetAdapter.connect.mockRejectedValue('String error');

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isConnectable).toBe(false);
      expect(result.error).toBe('Google Sheets connection test failed');
    });
  });

  describe('execute - unsupported sync methods', () => {
    it('should return error for unsupported sync method', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'unsupported' as any,
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [{ key: 'test', value: 'value' }],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isConnectable).toBe(false);
      expect(result.error).toBe('Unsupported sync method: unsupported');
      expect(mockLogger.warn).toHaveBeenCalledWith('Unsupported sync method: unsupported');
    });
  });

  describe('execute - edge cases', () => {
    it('should record accurate response time for Notion', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [{ key: 'apiKey', value: 'test-key' }],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      mockNotionAdapter.connect.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(undefined), 100);
          })
      );
      mockNotionAdapter.testConnection.mockResolvedValue(Result.success(true));

      const result = await useCase.execute({ config });

      expect(result.responseTime).toBeGreaterThanOrEqual(100);
      expect(result.responseTime).toBeLessThan(200);
    });

    it('should record accurate response time for Google Sheets', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'spread-sheet',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [{ key: 'accessToken', value: 'test-token' }],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      mockSpreadsheetAdapter.connect.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(undefined), 100);
          })
      );
      mockSpreadsheetAdapter.testConnection.mockResolvedValue(Result.success(true));

      const result = await useCase.execute({ config });

      expect(result.responseTime).toBeGreaterThanOrEqual(100);
      expect(result.responseTime).toBeLessThan(200);
    });

    it('should handle configs with multiple inputs', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [
            { key: 'apiKey', value: 'key-1' },
            { key: 'databaseId', value: 'db-1' },
            { key: 'pageId', value: 'page-1' },
          ],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      mockNotionAdapter.connect.mockResolvedValue(undefined);
      mockNotionAdapter.testConnection.mockResolvedValue(Result.success(true));

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isConnectable).toBe(true);
    });
  });

  describe('execute - general error handling', () => {
    it('should handle unexpected errors during execution', async () => {
      const config = StorageSyncConfig.create(
        {
          storageKey: 'testData',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [{ key: 'apiKey', value: 'test-key' }],
          outputs: [{ key: 'data', defaultValue: [] }],
        },
        mockIdGenerator
      );

      // Simulate unexpected error by making config.getSyncMethod() throw
      jest.spyOn(config, 'getSyncMethod').mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isConnectable).toBe(false);
      expect(result.error).toBe('Unexpected error');
      expect(mockLogger.error).toHaveBeenCalledWith('Connection test failed', expect.any(Error));
    });
  });
});
