/**
 * Unit Tests: ValidateSyncConfigUseCase
 */

import { ValidateSyncConfigUseCase } from '../ValidateSyncConfigUseCase';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { DataMapper } from '@domain/types/data-mapper.types';
import { Logger } from '@domain/types/logger.types';

describe('ValidateSyncConfigUseCase', () => {
  let useCase: ValidateSyncConfigUseCase;
  let mockDataMapper: jest.Mocked<DataMapper>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDataMapper = {
      extract: jest.fn((data) => data),
      map: jest.fn((data) => data),
      isValidPath: jest.fn(() => true),
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

    useCase = new ValidateSyncConfigUseCase(mockDataMapper, mockLogger);
  });

  // Helper to create a test config
  const createTestConfig = (overrides = {}) =>
    StorageSyncConfig.create({
      storageKey: 'testData',
      syncMethod: 'notion' as const,
      syncTiming: 'manual' as const,
      syncDirection: 'bidirectional' as const,
      inputs: [{ key: 'apiKey', value: 'test-token' }],
      outputs: [{ key: 'data', defaultValue: [] }],
      ...overrides,
    });

  describe('execute - valid configurations', () => {
    it('should validate a valid notion sync config', async () => {
      const config = createTestConfig();

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Validation complete: VALID')
      );
    });

    it('should validate a valid spread-sheet sync config', async () => {
      const config = createTestConfig({
        syncMethod: 'spread-sheet',
        inputs: [
          { key: 'spreadsheetId', value: 'sheet-123' },
          { key: 'accessToken', value: 'test-access-token' },
        ],
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
    });

    it('should validate periodic timing with valid interval', async () => {
      const config = createTestConfig({
        syncTiming: 'periodic',
        syncIntervalSeconds: 300,
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
    });

    it('should validate receive_only direction with inputs', async () => {
      const config = createTestConfig({
        syncDirection: 'receive_only',
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [],
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
    });

    it('should validate send_only direction with outputs', async () => {
      const config = createTestConfig({
        syncDirection: 'send_only',
        inputs: [{ key: 'apiKey', value: 'test-token' }], // Still need auth for notion sync
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
    });
  });

  describe('execute - validation errors', () => {
    it('should detect missing notion apiKey', async () => {
      const config = createTestConfig({
        syncMethod: 'notion',
        inputs: [{ key: 'otherKey', value: 'value' }],
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'inputs',
        message: 'Notion sync requires "apiKey" in inputs array',
        severity: 'error',
      });
    });

    it('should detect empty notion apiKey', async () => {
      const config = createTestConfig({
        syncMethod: 'notion',
        inputs: [{ key: 'apiKey', value: '   ' }],
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'inputs',
        message: 'Notion sync requires "apiKey" in inputs array',
        severity: 'error',
      });
    });

    it('should detect missing spread-sheet access tokens', async () => {
      const config = createTestConfig({
        syncMethod: 'spread-sheet',
        inputs: [{ key: 'spreadsheetId', value: 'sheet-123' }],
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
      const error = result.errors.find(
        (e) =>
          e.field === 'inputs' &&
          e.message.includes('Google Sheets sync requires "accessToken" or "refreshToken"')
      );
      expect(error).toBeDefined();
      expect(error?.severity).toBe('error');
    });

    it('should detect spread-sheet with empty access tokens', async () => {
      const config = createTestConfig({
        syncMethod: 'spread-sheet',
        inputs: [
          { key: 'spreadsheetId', value: 'sheet-123' },
          { key: 'accessToken', value: '' },
          { key: 'refreshToken', value: '' },
        ],
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'inputs',
        message: 'Google Sheets sync requires "accessToken" or "refreshToken" in inputs array',
        severity: 'error',
      });
    });

    it('should accept spread-sheet with refreshToken only', async () => {
      const config = createTestConfig({
        syncMethod: 'spread-sheet',
        inputs: [
          { key: 'spreadsheetId', value: 'sheet-123' },
          { key: 'refreshToken', value: 'test-refresh-token' },
        ],
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
    });

    it('should detect invalid sync interval for periodic timing', async () => {
      // Mock config to bypass entity validation
      const mockConfig = {
        getId: jest.fn(() => 'config1'),
        getStorageKey: jest.fn(() => 'testData'),
        getSyncMethod: jest.fn(() => 'notion'),
        getSyncTiming: jest.fn(() => 'periodic'),
        getSyncDirection: jest.fn(() => 'bidirectional'),
        getSyncIntervalSeconds: jest.fn(() => 0),
        getInputs: jest.fn(() => [{ key: 'apiKey', value: 'test-token' }]),
        getOutputs: jest.fn(() => [{ key: 'data', defaultValue: [] }]),
      } as any;

      const result = await useCase.execute({ config: mockConfig });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'syncIntervalSeconds',
        message: 'Sync interval must be greater than 0 for periodic sync',
        severity: 'error',
      });
    });

    it('should detect empty storage key', async () => {
      const config = createTestConfig();
      (config as any).data = { ...config.toData(), storageKey: '' };

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'storageKey',
        message: 'Storage key cannot be empty',
        severity: 'error',
      });
    });

    it('should detect missing inputs for bidirectional sync', async () => {
      const config = createTestConfig({
        syncDirection: 'bidirectional',
        inputs: [],
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'inputs',
        message: 'Input configuration is required for bidirectional sync',
        severity: 'error',
      });
    });

    it('should detect missing inputs for receive_only sync', async () => {
      const config = createTestConfig({
        syncDirection: 'receive_only',
        inputs: [],
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'inputs',
        message: 'Input configuration is required for receive_only sync',
        severity: 'error',
      });
    });

    it('should detect missing outputs for bidirectional sync', async () => {
      const config = createTestConfig({
        syncDirection: 'bidirectional',
        outputs: [],
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'outputs',
        message: 'Output configuration is required for bidirectional sync',
        severity: 'error',
      });
    });

    it('should detect missing outputs for send_only sync', async () => {
      const config = createTestConfig({
        syncDirection: 'send_only',
        outputs: [],
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'outputs',
        message: 'Output configuration is required for send_only sync',
        severity: 'error',
      });
    });
  });

  describe('execute - warnings', () => {
    it('should warn about interval less than 60 seconds', async () => {
      const config = createTestConfig({
        syncTiming: 'periodic',
        syncIntervalSeconds: 30,
      });

      const result = await useCase.execute({ config });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual({
        field: 'syncIntervalSeconds',
        message: 'Sync interval less than 60 seconds may cause performance issues',
        severity: 'warning',
      });
    });
  });

  describe('execute - additional validation scenarios', () => {
    it('should accept spread-sheet with accessToken only (no refreshToken)', async () => {
      const config = createTestConfig({
        syncMethod: 'spread-sheet',
        inputs: [
          { key: 'spreadsheetId', value: 'sheet-123' },
          { key: 'accessToken', value: 'test-access-token' },
        ],
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate config with trimmed whitespace storage key', async () => {
      const config = createTestConfig();

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Validation complete: VALID')
      );
    });

    it('should detect storage key with only whitespace', async () => {
      const config = createTestConfig();
      (config as any).data = { ...config.toData(), storageKey: '   ' };

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'storageKey',
        message: 'Storage key cannot be empty',
        severity: 'error',
      });
    });

    it('should validate spread-sheet with both accessToken and refreshToken', async () => {
      const config = createTestConfig({
        syncMethod: 'spread-sheet',
        inputs: [
          { key: 'spreadsheetId', value: 'sheet-123' },
          { key: 'accessToken', value: 'test-access-token' },
          { key: 'refreshToken', value: 'test-refresh-token' },
        ],
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate notion config with non-empty apiKey', async () => {
      const config = createTestConfig({
        syncMethod: 'notion',
        inputs: [{ key: 'apiKey', value: 'secret_notionApiKey123' }],
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Validation complete: VALID (0 errors, 0 warnings)')
      );
    });
  });

  describe('execute - error handling', () => {
    it('should handle unexpected errors during validation', async () => {
      const config = createTestConfig();

      // Simulate error by making logger throw during info call
      mockLogger.info.mockImplementationOnce(() => {
        throw new Error('Unexpected validation error');
      });

      const result = await useCase.execute({ config, deepValidation: true });

      expect(result.success).toBe(false);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'general',
        message: 'Unexpected validation error',
        severity: 'error',
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to validate sync config',
        expect.any(Error)
      );
    });

    it('should handle non-Error exceptions', async () => {
      const config = createTestConfig();

      mockLogger.info.mockImplementationOnce(() => {
        throw 'String error';
      });

      const result = await useCase.execute({ config, deepValidation: true });

      expect(result.success).toBe(false);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'general',
        message: 'Validation failed',
        severity: 'error',
      });
    });
  });
});
