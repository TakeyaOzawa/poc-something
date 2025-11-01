/**
 * SystemSettings Entity
 * システム設定を管理するドメインエンティティ
 */

export interface SystemSettingsData {
  retryWaitSecondsMin: number;
  retryWaitSecondsMax: number;
  retryCount: number;
  recordingEnabled: boolean;
  recordingBitrate: number;
  recordingRetentionDays: number;
  aggregatedLogSettings: {
    enabledLogSources: string[];
    securityEventsOnly: boolean;
    maxStoredLogs: number;
    logRetentionDays: number;
  };
}

export class SystemSettings {
  private data: SystemSettingsData;

  constructor(data?: Partial<SystemSettingsData>) {
    this.data = {
      retryWaitSecondsMin: data?.retryWaitSecondsMin ?? 30,
      retryWaitSecondsMax: data?.retryWaitSecondsMax ?? 60,
      retryCount: data?.retryCount ?? 3,
      recordingEnabled: data?.recordingEnabled ?? true,
      recordingBitrate: data?.recordingBitrate ?? 2500000,
      recordingRetentionDays: data?.recordingRetentionDays ?? 10,
      aggregatedLogSettings: {
        enabledLogSources: data?.aggregatedLogSettings?.enabledLogSources ?? [
          'background', 'popup', 'content-script', 'xpath-manager', 'automation-variables-manager'
        ],
        securityEventsOnly: data?.aggregatedLogSettings?.securityEventsOnly ?? false,
        maxStoredLogs: data?.aggregatedLogSettings?.maxStoredLogs ?? 100,
        logRetentionDays: data?.aggregatedLogSettings?.logRetentionDays ?? 7
      }
    };
  }

  static create(data?: Partial<SystemSettingsData>): SystemSettings {
    return new SystemSettings(data);
  }

  static fromData(data: SystemSettingsData): SystemSettings {
    return new SystemSettings(data);
  }

  getRetryWaitSecondsMin(): number {
    return this.data.retryWaitSecondsMin;
  }

  getRetryWaitSecondsMax(): number {
    return this.data.retryWaitSecondsMax;
  }

  getRetryCount(): number {
    return this.data.retryCount;
  }

  isRecordingEnabled(): boolean {
    return this.data.recordingEnabled;
  }

  getRecordingBitrate(): number {
    return this.data.recordingBitrate;
  }

  getRecordingRetentionDays(): number {
    return this.data.recordingRetentionDays;
  }

  getAggregatedLogSettings() {
    return { ...this.data.aggregatedLogSettings };
  }

  updateRetrySettings(min: number, max: number, count: number): void {
    if (min < 0 || max < 0) {
      throw new Error('待機時間は0以上である必要があります');
    }
    if (min > max) {
      throw new Error('最小値は最大値以下である必要があります');
    }
    if (count < -1) {
      throw new Error('リトライ回数は-1以上である必要があります');
    }

    this.data.retryWaitSecondsMin = min;
    this.data.retryWaitSecondsMax = max;
    this.data.retryCount = count;
  }

  updateRecordingSettings(enabled: boolean, bitrate: number, retentionDays: number): void {
    if (bitrate < 100000) {
      throw new Error('ビットレートは100kbps以上である必要があります');
    }
    if (retentionDays < 1) {
      throw new Error('保持期間は1日以上である必要があります');
    }

    this.data.recordingEnabled = enabled;
    this.data.recordingBitrate = bitrate;
    this.data.recordingRetentionDays = retentionDays;
  }

  updateAggregatedLogSettings(settings: Partial<SystemSettingsData['aggregatedLogSettings']>): void {
    if (settings.maxStoredLogs !== undefined && (settings.maxStoredLogs < 10 || settings.maxStoredLogs > 10000)) {
      throw new Error('最大保存ログ数は10～10000の範囲で設定してください');
    }
    if (settings.logRetentionDays !== undefined && (settings.logRetentionDays < 1 || settings.logRetentionDays > 365)) {
      throw new Error('ログ保持期間は1～365日の範囲で設定してください');
    }

    this.data.aggregatedLogSettings = {
      ...this.data.aggregatedLogSettings,
      ...settings
    };
  }

  toData(): SystemSettingsData {
    return { ...this.data };
  }

  reset(): void {
    this.data = new SystemSettings().data;
  }
}
