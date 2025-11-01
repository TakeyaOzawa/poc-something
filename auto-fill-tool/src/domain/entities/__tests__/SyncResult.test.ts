/**
 * SyncResult Entity Tests
 */

import { SyncResult, SyncResultData } from '../SyncResult';
import { SyncDirection } from '../StorageSyncConfig';

describe('SyncResult', () => {
  let sampleData: SyncResultData;

  beforeEach(() => {
    sampleData = {
      id: 'sr-1',
      configId: 'ssc-1',
      syncDirection: 'bidirectional',
      success: true,
      executedAt: '2023-01-01T00:00:00.000Z',
      receivedCount: 10,
      sentCount: 5,
      duration: 2500
    };
  });

  describe('create', () => {
    test('新しい同期結果が作成されること', () => {
      const result = SyncResult.create('ssc-1', 'receive_only');
      
      expect(result.getConfigId()).toBe('ssc-1');
      expect(result.getSyncDirection()).toBe('receive_only');
      expect(result.isSuccess()).toBe(false);
      expect(result.getId()).toMatch(/^sr_\d+_[a-z0-9]+$/);
      expect(result.getExecutedAt()).toBeDefined();
    });
  });

  describe('fromData', () => {
    test('データから同期結果が作成されること', () => {
      const result = SyncResult.fromData(sampleData);
      
      expect(result.getId()).toBe('sr-1');
      expect(result.getConfigId()).toBe('ssc-1');
      expect(result.getSyncDirection()).toBe('bidirectional');
      expect(result.isSuccess()).toBe(true);
      expect(result.getExecutedAt()).toBe('2023-01-01T00:00:00.000Z');
      expect(result.getReceivedCount()).toBe(10);
      expect(result.getSentCount()).toBe(5);
      expect(result.getDuration()).toBe(2500);
    });
  });

  describe('markSuccess', () => {
    test('成功状態に更新されること', () => {
      const result = SyncResult.create('ssc-1', 'bidirectional');
      
      result.markSuccess(15, 8);
      
      expect(result.isSuccess()).toBe(true);
      expect(result.getReceivedCount()).toBe(15);
      expect(result.getSentCount()).toBe(8);
      expect(result.getErrorMessage()).toBeUndefined();
      expect(result.getDuration()).toBeDefined();
      expect(result.getDuration()).toBeGreaterThanOrEqual(0);
    });

    test('カウントなしで成功状態に更新されること', () => {
      const result = SyncResult.create('ssc-1', 'manual');
      
      result.markSuccess();
      
      expect(result.isSuccess()).toBe(true);
      expect(result.getReceivedCount()).toBeUndefined();
      expect(result.getSentCount()).toBeUndefined();
    });
  });

  describe('markFailure', () => {
    test('失敗状態に更新されること', () => {
      const result = SyncResult.create('ssc-1', 'bidirectional');
      
      result.markFailure('同期エラーが発生しました');
      
      expect(result.isSuccess()).toBe(false);
      expect(result.getErrorMessage()).toBe('同期エラーが発生しました');
      expect(result.getDuration()).toBeDefined();
      expect(result.getDuration()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sync direction', () => {
    test('双方向同期の結果が正しく設定されること', () => {
      const result = SyncResult.fromData(sampleData);
      expect(result.getSyncDirection()).toBe('bidirectional');
    });

    test('受信のみ同期の結果が正しく設定されること', () => {
      const data = { ...sampleData, syncDirection: 'receive_only' as SyncDirection };
      const result = SyncResult.fromData(data);
      expect(result.getSyncDirection()).toBe('receive_only');
    });

    test('送信のみ同期の結果が正しく設定されること', () => {
      const data = { ...sampleData, syncDirection: 'send_only' as SyncDirection };
      const result = SyncResult.fromData(data);
      expect(result.getSyncDirection()).toBe('send_only');
    });
  });

  describe('toData', () => {
    test('データ形式で取得できること', () => {
      const result = SyncResult.fromData(sampleData);
      const data = result.toData();
      
      expect(data).toEqual(sampleData);
    });
  });
});
