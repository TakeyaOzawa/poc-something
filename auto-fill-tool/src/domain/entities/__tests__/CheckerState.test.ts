/**
 * CheckerState Entity Tests
 */

import { CheckerState, CheckerStateData, CheckerStatus } from '../CheckerState';

describe('CheckerState', () => {
  let sampleData: CheckerStateData;

  beforeEach(() => {
    sampleData = {
      id: 'cs-1',
      websiteId: 'website-1',
      status: 'IDLE',
      lastCheckedAt: '2023-01-01T00:00:00.000Z',
      nextCheckAt: '2023-01-01T00:05:00.000Z',
      checkInterval: 300000,
      successCount: 5,
      failureCount: 2,
      errorMessage: undefined
    };
  });

  describe('create', () => {
    test('新しいチェッカー状態が作成されること', () => {
      const state = CheckerState.create('website-1', 600000);
      
      expect(state.getWebsiteId()).toBe('website-1');
      expect(state.getStatus()).toBe('IDLE');
      expect(state.getCheckInterval()).toBe(600000);
      expect(state.getSuccessCount()).toBe(0);
      expect(state.getFailureCount()).toBe(0);
      expect(state.getId()).toMatch(/^cs_\d+_[a-z0-9]+$/);
      expect(state.isIdle()).toBe(true);
      expect(state.isChecking()).toBe(false);
    });

    test('デフォルトの間隔で作成されること', () => {
      const state = CheckerState.create('website-1');
      expect(state.getCheckInterval()).toBe(300000); // 5分
    });
  });

  describe('fromData', () => {
    test('データからチェッカー状態が作成されること', () => {
      const state = CheckerState.fromData(sampleData);
      
      expect(state.getId()).toBe('cs-1');
      expect(state.getWebsiteId()).toBe('website-1');
      expect(state.getStatus()).toBe('IDLE');
      expect(state.getLastCheckedAt()).toBe('2023-01-01T00:00:00.000Z');
      expect(state.getNextCheckAt()).toBe('2023-01-01T00:05:00.000Z');
      expect(state.getCheckInterval()).toBe(300000);
      expect(state.getSuccessCount()).toBe(5);
      expect(state.getFailureCount()).toBe(2);
    });
  });

  describe('startCheck', () => {
    test('チェックが正常に開始されること', () => {
      const state = CheckerState.fromData(sampleData);
      
      state.startCheck();
      
      expect(state.getStatus()).toBe('CHECKING');
      expect(state.isChecking()).toBe(true);
      expect(state.isIdle()).toBe(false);
      expect(state.getLastCheckedAt()).toBeDefined();
      expect(state.getErrorMessage()).toBeUndefined();
    });

    test('既にチェック中の場合、エラーが発生すること', () => {
      const data = { ...sampleData, status: 'CHECKING' as CheckerStatus };
      const state = CheckerState.fromData(data);
      
      expect(() => {
        state.startCheck();
      }).toThrow('チェックは既に実行中です');
    });
  });

  describe('markSuccess', () => {
    test('成功状態に更新されること', () => {
      const data = { ...sampleData, status: 'CHECKING' as CheckerStatus };
      const state = CheckerState.fromData(data);
      
      state.markSuccess();
      
      expect(state.getStatus()).toBe('SUCCESS');
      expect(state.getSuccessCount()).toBe(6); // 5 + 1
      expect(state.getErrorMessage()).toBeUndefined();
      expect(state.getNextCheckAt()).toBeDefined();
    });
  });

  describe('markFailure', () => {
    test('失敗状態に更新されること', () => {
      const data = { ...sampleData, status: 'CHECKING' as CheckerStatus };
      const state = CheckerState.fromData(data);
      
      state.markFailure('テストエラー');
      
      expect(state.getStatus()).toBe('FAILED');
      expect(state.getFailureCount()).toBe(3); // 2 + 1
      expect(state.getErrorMessage()).toBe('テストエラー');
      expect(state.getNextCheckAt()).toBeDefined();
    });
  });

  describe('updateInterval', () => {
    test('チェック間隔が正常に更新されること', () => {
      const state = CheckerState.fromData(sampleData);
      
      state.updateInterval(600000);
      
      expect(state.getCheckInterval()).toBe(600000);
      expect(state.getNextCheckAt()).toBeDefined();
    });

    test('無効な間隔が設定された場合、エラーが発生すること', () => {
      const state = CheckerState.fromData(sampleData);
      
      expect(() => {
        state.updateInterval(30000); // 30秒（1分未満）
      }).toThrow('チェック間隔は1分以上である必要があります');
    });
  });

  describe('status checks', () => {
    test('IDLE状態の判定が正しいこと', () => {
      const state = CheckerState.fromData(sampleData);
      expect(state.isIdle()).toBe(true);
      expect(state.isChecking()).toBe(false);
    });

    test('CHECKING状態の判定が正しいこと', () => {
      const data = { ...sampleData, status: 'CHECKING' as CheckerStatus };
      const state = CheckerState.fromData(data);
      expect(state.isIdle()).toBe(false);
      expect(state.isChecking()).toBe(true);
    });
  });

  describe('toData', () => {
    test('データ形式で取得できること', () => {
      const state = CheckerState.fromData(sampleData);
      const data = state.toData();
      
      expect(data).toEqual(sampleData);
    });
  });
});
