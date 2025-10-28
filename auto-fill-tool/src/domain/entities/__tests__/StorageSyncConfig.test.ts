/**
 * Unit Tests: StorageSyncConfig
 */

import { StorageSyncConfig } from '../StorageSyncConfig';
import { RetryPolicy } from '../RetryPolicy';

describe('StorageSyncConfig', () => {
  describe('create()', () => {
    it('should create with Notion sync method', () => {
      const config = StorageSyncConfig.create({
        storageKey: 'automationVariables',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [{ key: 'apiKey', value: 'test-key' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      expect(config.getId()).toBeTruthy();
      expect(config.getStorageKey()).toBe('automationVariables');
      expect(config.getSyncMethod()).toBe('notion');
      expect(config.getSyncTiming()).toBe('manual');
      expect(config.getSyncDirection()).toBe('bidirectional');
      expect(config.getInputs()).toEqual([{ key: 'apiKey', value: 'test-key' }]);
      expect(config.getOutputs()).toEqual([{ key: 'data', defaultValue: [] }]);
      expect(config.isEnabled()).toBe(true);
    });

    it('should create with Spreadsheet sync method', () => {
      const config = StorageSyncConfig.create({
        storageKey: 'websiteConfigs',
        syncMethod: 'spread-sheet',
        syncTiming: 'periodic',
        syncDirection: 'receive_only',
        syncIntervalSeconds: 3600,
        inputs: [
          { key: 'spreadsheetId', value: 'sheet-123' },
          { key: 'range', value: 'Sheet1!A1:D10' },
        ],
        outputs: [{ key: 'result', defaultValue: null }],
      });

      expect(config.getSyncMethod()).toBe('spread-sheet');
      expect(config.getSyncTiming()).toBe('periodic');
      expect(config.getSyncDirection()).toBe('receive_only');
      expect(config.getSyncIntervalSeconds()).toBe(3600);
      expect(config.getInputs()).toHaveLength(2);
      expect(config.getOutputs()).toHaveLength(1);
    });

    it('should create with default conflict resolution', () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'send_only',
        inputs: [],
        outputs: [],
      });

      expect(config.getConflictResolution()).toBe('latest_timestamp');
    });

    it('should create with custom conflict resolution', () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [],
        conflictResolution: 'local_priority',
      });

      expect(config.getConflictResolution()).toBe('local_priority');
    });

    it('should create with retry policy', () => {
      const retryPolicy = new RetryPolicy({
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
        retryableErrors: [],
      });

      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [],
        retryPolicy,
      });

      const loadedPolicy = config.getRetryPolicy();
      expect(loadedPolicy).toBeDefined();
      expect(loadedPolicy?.getMaxAttempts()).toBe(3);
    });
  });

  describe('validation', () => {
    it('should throw error when ID is missing', () => {
      expect(() => {
        new StorageSyncConfig({
          id: '',
          storageKey: 'test',
          enabled: true,
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }).toThrow('ID is required');
    });

    it('should throw error when storage key is missing', () => {
      expect(() => {
        new StorageSyncConfig({
          id: 'test-id',
          storageKey: '',
          enabled: true,
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }).toThrow('Storage key is required');
    });

    it('should throw error when sync method is missing', () => {
      expect(() => {
        new StorageSyncConfig({
          id: 'test-id',
          storageKey: 'test',
          enabled: true,
          syncMethod: '' as any,
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }).toThrow('Sync method is required');
    });

    it('should throw error when sync timing is missing', () => {
      expect(() => {
        new StorageSyncConfig({
          id: 'test-id',
          storageKey: 'test',
          enabled: true,
          syncMethod: 'notion',
          syncTiming: '' as any,
          syncDirection: 'bidirectional',
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }).toThrow('Sync timing is required');
    });

    it('should throw error when sync direction is missing', () => {
      expect(() => {
        new StorageSyncConfig({
          id: 'test-id',
          storageKey: 'test',
          enabled: true,
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: '' as any,
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }).toThrow('Sync direction is required');
    });

    it('should throw error when periodic sync has no interval', () => {
      expect(() => {
        new StorageSyncConfig({
          id: 'test-id',
          storageKey: 'test',
          enabled: true,
          syncMethod: 'notion',
          syncTiming: 'periodic',
          syncDirection: 'bidirectional',
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }).toThrow('Sync interval must be at least 1 second for periodic sync');
    });

    it('should throw error when periodic sync has invalid interval', () => {
      expect(() => {
        new StorageSyncConfig({
          id: 'test-id',
          storageKey: 'test',
          enabled: true,
          syncMethod: 'notion',
          syncTiming: 'periodic',
          syncDirection: 'bidirectional',
          syncIntervalSeconds: 0,
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }).toThrow('Sync interval must be at least 1 second for periodic sync');
    });

    it('should throw error when inputs is missing', () => {
      expect(() => {
        new StorageSyncConfig({
          id: 'test-id',
          storageKey: 'test',
          enabled: true,
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: undefined as any,
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }).toThrow('Inputs are required');
    });

    it('should throw error when inputs is not an array', () => {
      expect(() => {
        new StorageSyncConfig({
          id: 'test-id',
          storageKey: 'test',
          enabled: true,
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: {} as any,
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }).toThrow('Inputs must be an array');
    });

    it('should throw error when outputs is missing', () => {
      expect(() => {
        new StorageSyncConfig({
          id: 'test-id',
          storageKey: 'test',
          enabled: true,
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [],
          outputs: undefined as any,
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }).toThrow('Outputs are required');
    });

    it('should throw error when outputs is not an array', () => {
      expect(() => {
        new StorageSyncConfig({
          id: 'test-id',
          storageKey: 'test',
          enabled: true,
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [],
          outputs: {} as any,
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }).toThrow('Outputs must be an array');
    });

    it('should throw error when input has no key', () => {
      expect(() => {
        new StorageSyncConfig({
          id: 'test-id',
          storageKey: 'test',
          enabled: true,
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [{ key: '', value: 'test' }],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }).toThrow('Each input must have a valid key');
    });

    it('should throw error when output has no key', () => {
      expect(() => {
        new StorageSyncConfig({
          id: 'test-id',
          storageKey: 'test',
          enabled: true,
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          inputs: [],
          outputs: [{ key: '', defaultValue: null }],
          conflictResolution: 'latest_timestamp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }).toThrow('Each output must have a valid key');
    });
  });

  describe('setters', () => {
    it('should set enabled status', () => {
      const config = StorageSyncConfig.create({
        storageKey: 'test',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [],
      });

      const updated = config.setEnabled(false);

      expect(config.isEnabled()).toBe(true);
      expect(updated.isEnabled()).toBe(false);
    });

    it('should set sync timing', () => {
      const config = StorageSyncConfig.create({
        storageKey: 'test',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [],
      });

      const updated = config.setSyncTiming('periodic', 3600);

      expect(config.getSyncTiming()).toBe('manual');
      expect(updated.getSyncTiming()).toBe('periodic');
      expect(updated.getSyncIntervalSeconds()).toBe(3600);
    });

    it('should set sync direction', () => {
      const config = StorageSyncConfig.create({
        storageKey: 'test',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [],
      });

      const updated = config.setSyncDirection('send_only');

      expect(config.getSyncDirection()).toBe('bidirectional');
      expect(updated.getSyncDirection()).toBe('send_only');
    });

    it('should set inputs', () => {
      const config = StorageSyncConfig.create({
        storageKey: 'test',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [],
      });

      const newInputs = [
        { key: 'apiKey', value: 'key-123' },
        { key: 'database', value: 'db-456' },
      ];
      const updated = config.setInputs(newInputs);

      expect(config.getInputs()).toEqual([]);
      expect(updated.getInputs()).toEqual(newInputs);
    });

    it('should set outputs', () => {
      const config = StorageSyncConfig.create({
        storageKey: 'test',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [],
      });

      const newOutputs = [
        { key: 'result', defaultValue: null },
        { key: 'status', defaultValue: 'pending' },
      ];
      const updated = config.setOutputs(newOutputs);

      expect(config.getOutputs()).toEqual([]);
      expect(updated.getOutputs()).toEqual(newOutputs);
    });

    it('should set sync result', () => {
      const config = StorageSyncConfig.create({
        storageKey: 'test',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [],
      });

      const updated = config.setSyncResult('success');

      expect(config.getLastSyncStatus()).toBeUndefined();
      expect(updated.getLastSyncStatus()).toBe('success');
      expect(updated.getLastSyncDate()).toBeTruthy();
    });

    it('should set sync result with error', () => {
      const config = StorageSyncConfig.create({
        storageKey: 'test',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [],
      });

      const updated = config.setSyncResult('failed', 'Connection timeout');

      expect(updated.getLastSyncStatus()).toBe('failed');
      expect(updated.getLastSyncError()).toBe('Connection timeout');
    });
  });

  describe('toData() and clone()', () => {
    it('should export to data object', () => {
      const config = StorageSyncConfig.create({
        storageKey: 'test',
        syncMethod: 'spread-sheet',
        syncTiming: 'manual',
        syncDirection: 'receive_only',
        inputs: [{ key: 'sheetId', value: 'sheet-1' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      const data = config.toData();

      expect(data.id).toBe(config.getId());
      expect(data.storageKey).toBe('test');
      expect(data.syncMethod).toBe('spread-sheet');
      expect(data.inputs).toEqual([{ key: 'sheetId', value: 'sheet-1' }]);
      expect(data.outputs).toEqual([{ key: 'data', defaultValue: [] }]);
    });

    it('should clone config', () => {
      const config = StorageSyncConfig.create({
        storageKey: 'test',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [],
      });

      const cloned = config.clone();

      expect(cloned.getId()).toBe(config.getId());
      expect(cloned.getStorageKey()).toBe(config.getStorageKey());
      expect(cloned).not.toBe(config);
    });
  });
});
