/**
 * Unit tests for StorageSyncConfigMapper
 */

import { StorageSyncConfigMapper } from '../StorageSyncConfigMapper';
import { StorageSyncConfig, StorageSyncConfigData } from '@domain/entities/StorageSyncConfig';
import { Logger, LogLevel } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Helper to create test config data
function createTestConfigData(
  overrides: Partial<StorageSyncConfigData> = {}
): StorageSyncConfigData {
  return {
    id: 'test-id',
    storageKey: 'testKey',
    enabled: true,
    syncMethod: 'notion',
    syncTiming: 'manual',
    syncDirection: 'bidirectional',
    conflictResolution: 'latest_timestamp',
    inputs: [],
    outputs: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('StorageSyncConfigMapper', () => {
  describe('toCSV', () => {
    it('should convert empty array to CSV with header only', () => {
      const configs: StorageSyncConfig[] = [];
      const csv = StorageSyncConfigMapper.toCSV(configs);

      const expectedHeader =
        'id,storageKey,enabled,syncMethod,syncTiming,syncIntervalSeconds,' +
        'syncDirection,conflictResolution,inputs,outputs,lastSyncDate,lastSyncStatus,' +
        'createdAt,updatedAt';

      expect(csv).toBe(expectedHeader);
    });

    it('should convert single config with all required fields', () => {
      const config = new StorageSyncConfig(
        createTestConfigData({
          id: 'test-id-1',
          storageKey: 'testKey',
          enabled: true,
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          conflictResolution: 'latest_timestamp',
          inputs: [{ key: 'apiKey', value: 'test-key' }],
          outputs: [{ key: 'data', defaultValue: [] }],
        })
      );

      const csv = StorageSyncConfigMapper.toCSV([config]);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('id,storageKey,enabled');
      expect(lines[1]).toContain('test-id-1');
      expect(lines[1]).toContain('testKey');
      expect(lines[1]).toContain('true');
      expect(lines[1]).toContain('notion');
      expect(lines[1]).toContain('manual');
      expect(lines[1]).toContain('bidirectional');
      expect(lines[1]).toContain('latest_timestamp');
    });

    it('should handle optional fields when not provided', () => {
      const config = new StorageSyncConfig(
        createTestConfigData({
          id: 'test-id-2',
          syncIntervalSeconds: undefined,
          lastSyncDate: undefined,
          lastSyncStatus: undefined,
        })
      );

      const csv = StorageSyncConfigMapper.toCSV([config]);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(2);
      // Check that optional fields are represented as empty
      const values = lines[1].split(',');
      expect(values[5]).toBe(''); // syncIntervalSeconds
      expect(values[10]).toBe(''); // lastSyncDate
      expect(values[11]).toBe(''); // lastSyncStatus
    });

    it('should include optional fields when provided', () => {
      const config = new StorageSyncConfig(
        createTestConfigData({
          id: 'test-id-3',
          syncTiming: 'periodic',
          syncIntervalSeconds: 300,
          lastSyncDate: '2024-01-02T00:00:00Z',
          lastSyncStatus: 'success',
        })
      );

      const csv = StorageSyncConfigMapper.toCSV([config]);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain('300');
      expect(lines[1]).toContain('2024-01-02T00:00:00Z');
      expect(lines[1]).toContain('success');
    });

    it('should escape CSV special characters - comma', () => {
      const config = new StorageSyncConfig(
        createTestConfigData({
          id: 'test,id,4',
          storageKey: 'key,with,commas',
        })
      );

      const csv = StorageSyncConfigMapper.toCSV([config]);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('"test,id,4"');
      expect(lines[1]).toContain('"key,with,commas"');
    });

    it('should escape CSV special characters - quotes', () => {
      const config = new StorageSyncConfig(
        createTestConfigData({
          id: 'test"id"5',
          storageKey: 'key"with"quotes',
        })
      );

      const csv = StorageSyncConfigMapper.toCSV([config]);
      const lines = csv.split('\n');

      // Quotes should be escaped as double quotes and wrapped in quotes
      expect(lines[1]).toContain('"test""id""5"');
      expect(lines[1]).toContain('"key""with""quotes"');
    });

    it('should escape CSV special characters - newlines', () => {
      const config = new StorageSyncConfig(
        createTestConfigData({
          id: 'test\nid\n6',
          storageKey: 'key\nwith\nnewlines',
        })
      );

      const csv = StorageSyncConfigMapper.toCSV([config]);

      // Values with newlines should be wrapped in quotes
      expect(csv).toContain('"test\nid\n6"');
      expect(csv).toContain('"key\nwith\nnewlines"');
    });

    it('should handle multiple configs', () => {
      const config1 = new StorageSyncConfig(
        createTestConfigData({
          id: 'id-1',
          storageKey: 'key1',
        })
      );

      const config2 = new StorageSyncConfig(
        createTestConfigData({
          id: 'id-2',
          storageKey: 'key2',
          enabled: false,
          syncMethod: 'spread-sheet',
          inputs: [{ key: 'spreadsheetId', value: 'sheet-123' }],
          outputs: [{ key: 'result', defaultValue: null }],
        })
      );

      const csv = StorageSyncConfigMapper.toCSV([config1, config2]);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(3); // header + 2 data rows
      expect(lines[0]).toContain('id,storageKey');
      expect(lines[1]).toContain('id-1');
      expect(lines[1]).toContain('key1');
      expect(lines[2]).toContain('id-2');
      expect(lines[2]).toContain('key2');
    });

    it('should handle boolean enabled field correctly', () => {
      const configEnabled = new StorageSyncConfig(
        createTestConfigData({
          id: 'id-enabled',
          enabled: true,
        })
      );

      const configDisabled = new StorageSyncConfig(
        createTestConfigData({
          id: 'id-disabled',
          enabled: false,
        })
      );

      const csv = StorageSyncConfigMapper.toCSV([configEnabled, configDisabled]);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('true');
      expect(lines[2]).toContain('false');
    });

    it('should handle all sync methods', () => {
      const configNotion = new StorageSyncConfig(
        createTestConfigData({
          id: 'id-notion',
          syncMethod: 'notion',
          inputs: [{ key: 'apiKey', value: 'key-123' }],
          outputs: [{ key: 'data', defaultValue: [] }],
        })
      );

      const configSpreadsheet = new StorageSyncConfig(
        createTestConfigData({
          id: 'id-spreadsheet',
          syncMethod: 'spread-sheet',
          inputs: [{ key: 'spreadsheetId', value: 'sheet-123' }],
          outputs: [{ key: 'result', defaultValue: null }],
        })
      );

      const csv = StorageSyncConfigMapper.toCSV([configNotion, configSpreadsheet]);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('notion');
      expect(lines[2]).toContain('spread-sheet');
    });

    it('should handle all sync directions', () => {
      const configs = [
        new StorageSyncConfig(
          createTestConfigData({
            id: 'id-1',
            syncDirection: 'bidirectional',
          })
        ),
        new StorageSyncConfig(
          createTestConfigData({
            id: 'id-2',
            syncDirection: 'send_only',
          })
        ),
        new StorageSyncConfig(
          createTestConfigData({
            id: 'id-3',
            syncDirection: 'receive_only',
          })
        ),
      ];

      const csv = StorageSyncConfigMapper.toCSV(configs);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('bidirectional');
      expect(lines[2]).toContain('send_only');
      expect(lines[3]).toContain('receive_only');
    });

    it('should handle all conflict resolution strategies', () => {
      const configs = [
        new StorageSyncConfig(
          createTestConfigData({
            id: 'id-1',
            conflictResolution: 'latest_timestamp',
          })
        ),
        new StorageSyncConfig(
          createTestConfigData({
            id: 'id-2',
            conflictResolution: 'local_priority',
          })
        ),
        new StorageSyncConfig(
          createTestConfigData({
            id: 'id-3',
            conflictResolution: 'remote_priority',
          })
        ),
        new StorageSyncConfig(
          createTestConfigData({
            id: 'id-4',
            conflictResolution: 'user_confirm',
          })
        ),
      ];

      const csv = StorageSyncConfigMapper.toCSV(configs);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('latest_timestamp');
      expect(lines[2]).toContain('local_priority');
      expect(lines[3]).toContain('remote_priority');
      expect(lines[4]).toContain('user_confirm');
    });

    it('should handle lastSyncStatus values', () => {
      const configSuccess = new StorageSyncConfig(
        createTestConfigData({
          id: 'id-success',
          lastSyncStatus: 'success',
        })
      );

      const configFailed = new StorageSyncConfig(
        createTestConfigData({
          id: 'id-failed',
          lastSyncStatus: 'failed',
        })
      );

      const csv = StorageSyncConfigMapper.toCSV([configSuccess, configFailed]);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('success');
      expect(lines[2]).toContain('failed');
    });

    it('should log and throw error when conversion fails', () => {
      const mockLogger: Logger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        setLevel: jest.fn(),
        getLevel: jest.fn().mockReturnValue(LogLevel.INFO),
        createChild: jest.fn(),
      };

      // Create invalid config by mocking toData to throw
      const invalidConfig = new StorageSyncConfig(createTestConfigData());

      jest.spyOn(invalidConfig, 'toData').mockImplementation(() => {
        throw new Error('toData failed');
      });

      expect(() => {
        StorageSyncConfigMapper.toCSV([invalidConfig], mockLogger);
      }).toThrow('toData failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to convert storage sync configs to CSV',
        expect.any(Error)
      );
    });

    it('should handle empty optional string values correctly', () => {
      const config = new StorageSyncConfig(
        createTestConfigData({
          id: 'test-id',
          storageKey: 'testKey',
          lastSyncDate: undefined,
          lastSyncStatus: undefined,
        })
      );

      const csv = StorageSyncConfigMapper.toCSV([config]);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(2);
      // Empty optional fields should be represented as empty fields in CSV
      const values = lines[1].split(',');
      expect(values[10]).toBe(''); // lastSyncDate
      expect(values[11]).toBe(''); // lastSyncStatus
    });

    it('should maintain field order in CSV output', () => {
      const config = new StorageSyncConfig(
        createTestConfigData({
          id: 'test-id',
          storageKey: 'testKey',
          enabled: true,
          syncMethod: 'notion',
          syncTiming: 'periodic',
          syncIntervalSeconds: 300,
          syncDirection: 'bidirectional',
          conflictResolution: 'latest_timestamp',
          inputs: [{ key: 'apiKey', value: 'key-123' }],
          outputs: [{ key: 'data', defaultValue: [] }],
          lastSyncDate: '2024-01-02T00:00:00Z',
          lastSyncStatus: 'success',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        })
      );

      const csv = StorageSyncConfigMapper.toCSV([config]);
      const lines = csv.split('\n');

      const header = lines[0].split(',');
      expect(header[0]).toBe('id');
      expect(header[1]).toBe('storageKey');
      expect(header[2]).toBe('enabled');
      expect(header[3]).toBe('syncMethod');
      expect(header[4]).toBe('syncTiming');
      expect(header[5]).toBe('syncIntervalSeconds');
      expect(header[6]).toBe('syncDirection');
      expect(header[7]).toBe('conflictResolution');
      expect(header[8]).toBe('inputs');
      expect(header[9]).toBe('outputs');
      expect(header[10]).toBe('lastSyncDate');
      expect(header[11]).toBe('lastSyncStatus');
      expect(header[12]).toBe('createdAt');
      expect(header[13]).toBe('updatedAt');
    });

    it('should handle sync timing with intervals', () => {
      const configManual = new StorageSyncConfig(
        createTestConfigData({
          id: 'id-manual',
          syncTiming: 'manual',
          syncIntervalSeconds: undefined,
        })
      );

      const configPeriodic = new StorageSyncConfig(
        createTestConfigData({
          id: 'id-periodic',
          syncTiming: 'periodic',
          syncIntervalSeconds: 600,
        })
      );

      const csv = StorageSyncConfigMapper.toCSV([configManual, configPeriodic]);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('manual');
      expect(lines[2]).toContain('periodic');
      expect(lines[2]).toContain('600');
    });

    it('should handle complex CSV escaping scenarios', () => {
      const config = new StorageSyncConfig(
        createTestConfigData({
          id: 'test"id,with\nmultiple',
          storageKey: 'key"with,all\nspecial',
        })
      );

      const csv = StorageSyncConfigMapper.toCSV([config]);

      // Should wrap in quotes and escape internal quotes
      expect(csv).toContain('"test""id,with\nmultiple"');
      expect(csv).toContain('"key""with,all\nspecial"');
    });
  });
});
