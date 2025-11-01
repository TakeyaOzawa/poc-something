/**
 * SystemSettings Entity Tests
 */

import { SystemSettings, SystemSettingsData } from '../SystemSettings';

describe('SystemSettings', () => {
  describe('create', () => {
    test('デフォルト値でシステム設定が作成されること', () => {
      const settings = SystemSettings.create();
      
      expect(settings.getRetryWaitSecondsMin()).toBe(30);
      expect(settings.getRetryWaitSecondsMax()).toBe(60);
      expect(settings.getRetryCount()).toBe(3);
      expect(settings.isRecordingEnabled()).toBe(true);
      expect(settings.getRecordingBitrate()).toBe(2500000);
      expect(settings.getRecordingRetentionDays()).toBe(10);
      
      const logSettings = settings.getAggregatedLogSettings();
      expect(logSettings.enabledLogSources).toEqual([
        'background', 'popup', 'content-script', 'xpath-manager', 'automation-variables-manager'
      ]);
      expect(logSettings.securityEventsOnly).toBe(false);
      expect(logSettings.maxStoredLogs).toBe(100);
      expect(logSettings.logRetentionDays).toBe(7);
    });
  });

  describe('fromData', () => {
    test('データからシステム設定が作成されること', () => {
      const data: SystemSettingsData = {
        retryWaitSecondsMin: 10,
        retryWaitSecondsMax: 20,
        retryCount: 5,
        recordingEnabled: false,
        recordingBitrate: 1000000,
        recordingRetentionDays: 5,
        aggregatedLogSettings: {
          enabledLogSources: ['background'],
          securityEventsOnly: true,
          maxStoredLogs: 50,
          logRetentionDays: 3
        }
      };
      
      const settings = SystemSettings.fromData(data);
      
      expect(settings.getRetryWaitSecondsMin()).toBe(10);
      expect(settings.getRetryWaitSecondsMax()).toBe(20);
      expect(settings.getRetryCount()).toBe(5);
      expect(settings.isRecordingEnabled()).toBe(false);
      expect(settings.getRecordingBitrate()).toBe(1000000);
      expect(settings.getRecordingRetentionDays()).toBe(5);
      
      const logSettings = settings.getAggregatedLogSettings();
      expect(logSettings.enabledLogSources).toEqual(['background']);
      expect(logSettings.securityEventsOnly).toBe(true);
      expect(logSettings.maxStoredLogs).toBe(50);
      expect(logSettings.logRetentionDays).toBe(3);
    });
  });

  describe('updateRetrySettings', () => {
    let settings: SystemSettings;

    beforeEach(() => {
      settings = SystemSettings.create();
    });

    test('リトライ設定が正常に更新されること', () => {
      settings.updateRetrySettings(15, 45, 10);
      
      expect(settings.getRetryWaitSecondsMin()).toBe(15);
      expect(settings.getRetryWaitSecondsMax()).toBe(45);
      expect(settings.getRetryCount()).toBe(10);
    });

    test('無限リトライ(-1)が設定できること', () => {
      settings.updateRetrySettings(30, 60, -1);
      expect(settings.getRetryCount()).toBe(-1);
    });

    test('最小値が最大値より大きい場合、エラーが発生すること', () => {
      expect(() => {
        settings.updateRetrySettings(60, 30, 3);
      }).toThrow('最小値は最大値以下である必要があります');
    });

    test('負の待機時間が設定された場合、エラーが発生すること', () => {
      expect(() => {
        settings.updateRetrySettings(-1, 60, 3);
      }).toThrow('待機時間は0以上である必要があります');
      
      expect(() => {
        settings.updateRetrySettings(30, -1, 3);
      }).toThrow('待機時間は0以上である必要があります');
    });

    test('無効なリトライ回数が設定された場合、エラーが発生すること', () => {
      expect(() => {
        settings.updateRetrySettings(30, 60, -2);
      }).toThrow('リトライ回数は-1以上である必要があります');
    });
  });

  describe('updateRecordingSettings', () => {
    let settings: SystemSettings;

    beforeEach(() => {
      settings = SystemSettings.create();
    });

    test('録画設定が正常に更新されること', () => {
      settings.updateRecordingSettings(false, 1500000, 7);
      
      expect(settings.isRecordingEnabled()).toBe(false);
      expect(settings.getRecordingBitrate()).toBe(1500000);
      expect(settings.getRecordingRetentionDays()).toBe(7);
    });

    test('低すぎるビットレートが設定された場合、エラーが発生すること', () => {
      expect(() => {
        settings.updateRecordingSettings(true, 50000, 10);
      }).toThrow('ビットレートは100kbps以上である必要があります');
    });

    test('無効な保持期間が設定された場合、エラーが発生すること', () => {
      expect(() => {
        settings.updateRecordingSettings(true, 2500000, 0);
      }).toThrow('保持期間は1日以上である必要があります');
    });
  });

  describe('updateAggregatedLogSettings', () => {
    let settings: SystemSettings;

    beforeEach(() => {
      settings = SystemSettings.create();
    });

    test('ログ設定が正常に更新されること', () => {
      settings.updateAggregatedLogSettings({
        enabledLogSources: ['background', 'popup'],
        securityEventsOnly: true,
        maxStoredLogs: 200,
        logRetentionDays: 14
      });
      
      const logSettings = settings.getAggregatedLogSettings();
      expect(logSettings.enabledLogSources).toEqual(['background', 'popup']);
      expect(logSettings.securityEventsOnly).toBe(true);
      expect(logSettings.maxStoredLogs).toBe(200);
      expect(logSettings.logRetentionDays).toBe(14);
    });

    test('部分的な更新ができること', () => {
      settings.updateAggregatedLogSettings({
        securityEventsOnly: true
      });
      
      const logSettings = settings.getAggregatedLogSettings();
      expect(logSettings.securityEventsOnly).toBe(true);
      // 他の設定はデフォルト値のまま
      expect(logSettings.maxStoredLogs).toBe(100);
      expect(logSettings.logRetentionDays).toBe(7);
    });

    test('無効な最大保存ログ数が設定された場合、エラーが発生すること', () => {
      expect(() => {
        settings.updateAggregatedLogSettings({ maxStoredLogs: 5 });
      }).toThrow('最大保存ログ数は10～10000の範囲で設定してください');
      
      expect(() => {
        settings.updateAggregatedLogSettings({ maxStoredLogs: 15000 });
      }).toThrow('最大保存ログ数は10～10000の範囲で設定してください');
    });

    test('無効なログ保持期間が設定された場合、エラーが発生すること', () => {
      expect(() => {
        settings.updateAggregatedLogSettings({ logRetentionDays: 0 });
      }).toThrow('ログ保持期間は1～365日の範囲で設定してください');
      
      expect(() => {
        settings.updateAggregatedLogSettings({ logRetentionDays: 400 });
      }).toThrow('ログ保持期間は1～365日の範囲で設定してください');
    });
  });

  describe('reset', () => {
    test('設定がデフォルト値にリセットされること', () => {
      const settings = SystemSettings.create();
      
      // 設定を変更
      settings.updateRetrySettings(10, 20, 5);
      settings.updateRecordingSettings(false, 1000000, 5);
      
      // リセット
      settings.reset();
      
      // デフォルト値に戻っていることを確認
      expect(settings.getRetryWaitSecondsMin()).toBe(30);
      expect(settings.getRetryWaitSecondsMax()).toBe(60);
      expect(settings.getRetryCount()).toBe(3);
      expect(settings.isRecordingEnabled()).toBe(true);
      expect(settings.getRecordingBitrate()).toBe(2500000);
      expect(settings.getRecordingRetentionDays()).toBe(10);
    });
  });

  describe('toData', () => {
    test('データ形式で取得できること', () => {
      const settings = SystemSettings.create();
      settings.updateRetrySettings(15, 45, 10);
      
      const data = settings.toData();
      
      expect(data.retryWaitSecondsMin).toBe(15);
      expect(data.retryWaitSecondsMax).toBe(45);
      expect(data.retryCount).toBe(10);
      expect(data.recordingEnabled).toBe(true);
      expect(data.recordingBitrate).toBe(2500000);
      expect(data.recordingRetentionDays).toBe(10);
      expect(data.aggregatedLogSettings).toBeDefined();
    });
  });
});
