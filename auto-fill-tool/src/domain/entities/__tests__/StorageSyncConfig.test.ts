/**
 * StorageSyncConfig Entity Tests
 */

import { StorageSyncConfig, StorageSyncConfigData, SyncMethod, SyncTiming, SyncDirection, ConflictResolution } from '../StorageSyncConfig';

describe('StorageSyncConfig', () => {
  let sampleData: StorageSyncConfigData;

  beforeEach(() => {
    sampleData = {
      id: 'ssc-1',
      storageKey: 'automationVariables',
      syncMethod: 'notion',
      syncTiming: 'manual',
      syncDirection: 'bidirectional',
      conflictResolution: 'latest_timestamp',
      inputs: [
        { key: 'apiKey', value: 'test-api-key' },
        { key: 'databaseId', value: 'test-db-id' }
      ],
      outputs: [
        { key: 'data', defaultValue: [] }
      ],
      enabled: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    };
  });

  describe('create', () => {
    test('新しい同期設定が作成されること', () => {
      const config = StorageSyncConfig.create(
        'automationVariables',
        'notion',
        'manual',
        'bidirectional',
        'latest_timestamp'
      );
      
      expect(config.getStorageKey()).toBe('automationVariables');
      expect(config.getSyncMethod()).toBe('notion');
      expect(config.getSyncTiming()).toBe('manual');
      expect(config.getSyncDirection()).toBe('bidirectional');
      expect(config.getConflictResolution()).toBe('latest_timestamp');
      expect(config.isEnabled()).toBe(true);
      expect(config.getId()).toMatch(/^ssc_\d+_[a-z0-9]+$/);
      expect(config.getCreatedAt()).toBeDefined();
      expect(config.getUpdatedAt()).toBeDefined();
    });
  });

  describe('fromData', () => {
    test('データから同期設定が作成されること', () => {
      const config = StorageSyncConfig.fromData(sampleData);
      
      expect(config.getId()).toBe('ssc-1');
      expect(config.getStorageKey()).toBe('automationVariables');
      expect(config.getSyncMethod()).toBe('notion');
      expect(config.getSyncTiming()).toBe('manual');
      expect(config.getSyncDirection()).toBe('bidirectional');
      expect(config.getConflictResolution()).toBe('latest_timestamp');
      expect(config.getInputs()).toHaveLength(2);
      expect(config.getOutputs()).toHaveLength(1);
      expect(config.isEnabled()).toBe(true);
    });
  });

  describe('sync direction checks', () => {
    test('双方向同期の判定が正しいこと', () => {
      const config = StorageSyncConfig.fromData(sampleData);
      
      expect(config.isBidirectional()).toBe(true);
      expect(config.canReceive()).toBe(true);
      expect(config.canSend()).toBe(true);
    });

    test('受信のみの判定が正しいこと', () => {
      const data = { ...sampleData, syncDirection: 'receive_only' as SyncDirection };
      const config = StorageSyncConfig.fromData(data);
      
      expect(config.isBidirectional()).toBe(false);
      expect(config.canReceive()).toBe(true);
      expect(config.canSend()).toBe(false);
    });

    test('送信のみの判定が正しいこと', () => {
      const data = { ...sampleData, syncDirection: 'send_only' as SyncDirection };
      const config = StorageSyncConfig.fromData(data);
      
      expect(config.isBidirectional()).toBe(false);
      expect(config.canReceive()).toBe(false);
      expect(config.canSend()).toBe(true);
    });
  });

  describe('updateSyncTiming', () => {
    test('定期同期が正常に設定されること', () => {
      const config = StorageSyncConfig.fromData(sampleData);
      
      config.updateSyncTiming('periodic', 3600);
      
      expect(config.getSyncTiming()).toBe('periodic');
      expect(config.getSyncIntervalSeconds()).toBe(3600);
      expect(config.isPeriodic()).toBe(true);
    });

    test('手動同期が正常に設定されること', () => {
      const config = StorageSyncConfig.fromData({
        ...sampleData,
        syncTiming: 'periodic',
        syncIntervalSeconds: 3600
      });
      
      config.updateSyncTiming('manual');
      
      expect(config.getSyncTiming()).toBe('manual');
      expect(config.getSyncIntervalSeconds()).toBeUndefined();
      expect(config.isPeriodic()).toBe(false);
    });

    test('定期同期で無効な間隔が設定された場合、エラーが発生すること', () => {
      const config = StorageSyncConfig.fromData(sampleData);
      
      expect(() => {
        config.updateSyncTiming('periodic', 30);
      }).toThrow('定期同期の間隔は60秒以上である必要があります');
    });
  });

  describe('input management', () => {
    test('入力が正常に追加されること', () => {
      const config = StorageSyncConfig.fromData(sampleData);
      
      config.addInput('newKey', 'newValue');
      
      const inputs = config.getInputs();
      expect(inputs).toHaveLength(3);
      expect(inputs.find(i => i.key === 'newKey')?.value).toBe('newValue');
    });

    test('既存の入力が更新されること', () => {
      const config = StorageSyncConfig.fromData(sampleData);
      
      config.addInput('apiKey', 'updated-api-key');
      
      const inputs = config.getInputs();
      expect(inputs).toHaveLength(2);
      expect(inputs.find(i => i.key === 'apiKey')?.value).toBe('updated-api-key');
    });

    test('入力が正常に削除されること', () => {
      const config = StorageSyncConfig.fromData(sampleData);
      
      const result = config.removeInput('apiKey');
      
      expect(result).toBe(true);
      expect(config.getInputs()).toHaveLength(1);
      expect(config.getInputs().find(i => i.key === 'apiKey')).toBeUndefined();
    });

    test('存在しない入力を削除した場合、falseが返されること', () => {
      const config = StorageSyncConfig.fromData(sampleData);
      
      const result = config.removeInput('nonexistent');
      
      expect(result).toBe(false);
      expect(config.getInputs()).toHaveLength(2);
    });
  });

  describe('output management', () => {
    test('出力が正常に追加されること', () => {
      const config = StorageSyncConfig.fromData(sampleData);
      
      config.addOutput('newKey', 'defaultValue');
      
      const outputs = config.getOutputs();
      expect(outputs).toHaveLength(2);
      expect(outputs.find(o => o.key === 'newKey')?.defaultValue).toBe('defaultValue');
    });

    test('既存の出力が更新されること', () => {
      const config = StorageSyncConfig.fromData(sampleData);
      
      config.addOutput('data', { updated: true });
      
      const outputs = config.getOutputs();
      expect(outputs).toHaveLength(1);
      expect(outputs.find(o => o.key === 'data')?.defaultValue).toEqual({ updated: true });
    });

    test('出力が正常に削除されること', () => {
      const config = StorageSyncConfig.fromData(sampleData);
      
      const result = config.removeOutput('data');
      
      expect(result).toBe(true);
      expect(config.getOutputs()).toHaveLength(0);
    });
  });

  describe('enable/disable', () => {
    test('設定が有効化されること', () => {
      const config = StorageSyncConfig.fromData({ ...sampleData, enabled: false });
      
      config.enable();
      
      expect(config.isEnabled()).toBe(true);
    });

    test('設定が無効化されること', () => {
      const config = StorageSyncConfig.fromData(sampleData);
      
      config.disable();
      
      expect(config.isEnabled()).toBe(false);
    });
  });

  describe('toData', () => {
    test('データ形式で取得できること', () => {
      const config = StorageSyncConfig.fromData(sampleData);
      const data = config.toData();
      
      expect(data).toEqual(sampleData);
    });
  });
});
