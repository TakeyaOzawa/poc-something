/**
 * AutomationResult Entity Tests
 */

import { AutomationResult, AutomationResultData, AutomationStatus } from '../AutomationResult';

describe('AutomationResult', () => {
  let sampleData: AutomationResultData;

  beforeEach(() => {
    sampleData = {
      id: 'ar-1',
      automationVariablesId: 'av-1',
      websiteId: 'website-1',
      status: 'DOING',
      startedAt: '2023-01-01T00:00:00.000Z',
      executedSteps: 2,
      totalSteps: 5,
      currentStepIndex: 2,
      lastExecutedUrl: 'https://example.com/step2'
    };
  });

  describe('create', () => {
    test('新しい自動化結果が作成されること', () => {
      const result = AutomationResult.create('av-1', 'website-1', 10);
      
      expect(result.getAutomationVariablesId()).toBe('av-1');
      expect(result.getWebsiteId()).toBe('website-1');
      expect(result.getStatus()).toBe('DOING');
      expect(result.getTotalSteps()).toBe(10);
      expect(result.getExecutedSteps()).toBe(0);
      expect(result.getCurrentStepIndex()).toBe(0);
      expect(result.getId()).toMatch(/^ar_\d+_[a-z0-9]+$/);
      expect(result.getStartedAt()).toBeDefined();
      expect(result.isInProgress()).toBe(true);
      expect(result.isCompleted()).toBe(false);
    });
  });

  describe('fromData', () => {
    test('データから自動化結果が作成されること', () => {
      const result = AutomationResult.fromData(sampleData);
      
      expect(result.getId()).toBe('ar-1');
      expect(result.getAutomationVariablesId()).toBe('av-1');
      expect(result.getWebsiteId()).toBe('website-1');
      expect(result.getStatus()).toBe('DOING');
      expect(result.getStartedAt()).toBe('2023-01-01T00:00:00.000Z');
      expect(result.getExecutedSteps()).toBe(2);
      expect(result.getTotalSteps()).toBe(5);
      expect(result.getCurrentStepIndex()).toBe(2);
      expect(result.getLastExecutedUrl()).toBe('https://example.com/step2');
    });
  });

  describe('getProgressPercentage', () => {
    test('進捗率が正しく計算されること', () => {
      const result = AutomationResult.fromData(sampleData);
      expect(result.getProgressPercentage()).toBe(40); // 2/5 * 100 = 40%
    });

    test('総ステップ数が0の場合、0%が返されること', () => {
      const data = { ...sampleData, totalSteps: 0, executedSteps: 0 };
      const result = AutomationResult.fromData(data);
      expect(result.getProgressPercentage()).toBe(0);
    });

    test('完了時は100%が返されること', () => {
      const data = { ...sampleData, executedSteps: 5 };
      const result = AutomationResult.fromData(data);
      expect(result.getProgressPercentage()).toBe(100);
    });
  });

  describe('getDuration', () => {
    test('完了時間が設定されている場合、実行時間が計算されること', () => {
      const data = {
        ...sampleData,
        startedAt: '2023-01-01T00:00:00.000Z',
        completedAt: '2023-01-01T00:05:00.000Z'
      };
      const result = AutomationResult.fromData(data);
      
      expect(result.getDuration()).toBe(5 * 60 * 1000); // 5分 = 300,000ms
    });

    test('完了時間が未設定の場合、undefinedが返されること', () => {
      const result = AutomationResult.fromData(sampleData);
      expect(result.getDuration()).toBeUndefined();
    });
  });

  describe('updateProgress', () => {
    let result: AutomationResult;

    beforeEach(() => {
      result = AutomationResult.fromData(sampleData);
    });

    test('進捗が正常に更新されること', () => {
      result.updateProgress(3, 3, 'https://example.com/step3');
      
      expect(result.getExecutedSteps()).toBe(3);
      expect(result.getCurrentStepIndex()).toBe(3);
      expect(result.getLastExecutedUrl()).toBe('https://example.com/step3');
    });

    test('一部のパラメータのみ更新できること', () => {
      result.updateProgress(4);
      
      expect(result.getExecutedSteps()).toBe(4);
      expect(result.getCurrentStepIndex()).toBe(2); // 元の値のまま
      expect(result.getLastExecutedUrl()).toBe('https://example.com/step2'); // 元の値のまま
    });

    test('無効な実行ステップ数が設定された場合、エラーが発生すること', () => {
      expect(() => {
        result.updateProgress(-1);
      }).toThrow('実行ステップ数が無効です');
      
      expect(() => {
        result.updateProgress(10); // totalSteps(5)を超える
      }).toThrow('実行ステップ数が無効です');
    });
  });

  describe('markAsSuccess', () => {
    test('成功状態に更新されること', () => {
      const result = AutomationResult.fromData(sampleData);
      result.markAsSuccess();
      
      expect(result.getStatus()).toBe('SUCCESS');
      expect(result.getCompletedAt()).toBeDefined();
      expect(result.getExecutedSteps()).toBe(5); // totalStepsと同じ
      expect(result.getErrorMessage()).toBeUndefined();
      expect(result.isInProgress()).toBe(false);
      expect(result.isCompleted()).toBe(true);
    });
  });

  describe('markAsFailed', () => {
    test('失敗状態に更新されること', () => {
      const result = AutomationResult.fromData(sampleData);
      result.markAsFailed('テストエラー');
      
      expect(result.getStatus()).toBe('FAILED');
      expect(result.getCompletedAt()).toBeDefined();
      expect(result.getErrorMessage()).toBe('テストエラー');
      expect(result.isInProgress()).toBe(false);
      expect(result.isCompleted()).toBe(true);
    });
  });

  describe('status checks', () => {
    test('DOING状態の判定が正しいこと', () => {
      const result = AutomationResult.fromData(sampleData);
      expect(result.isInProgress()).toBe(true);
      expect(result.isCompleted()).toBe(false);
    });

    test('SUCCESS状態の判定が正しいこと', () => {
      const data = { ...sampleData, status: 'SUCCESS' as AutomationStatus };
      const result = AutomationResult.fromData(data);
      expect(result.isInProgress()).toBe(false);
      expect(result.isCompleted()).toBe(true);
    });

    test('FAILED状態の判定が正しいこと', () => {
      const data = { ...sampleData, status: 'FAILED' as AutomationStatus };
      const result = AutomationResult.fromData(data);
      expect(result.isInProgress()).toBe(false);
      expect(result.isCompleted()).toBe(true);
    });
  });

  describe('toData', () => {
    test('データ形式で取得できること', () => {
      const result = AutomationResult.fromData(sampleData);
      const data = result.toData();
      
      expect(data).toEqual(sampleData);
    });
  });
});
