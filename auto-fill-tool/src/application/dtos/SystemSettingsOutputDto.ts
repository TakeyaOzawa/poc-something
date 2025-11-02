/**
 * SystemSettings Output DTO
 * プレゼンテーション層への出力用データ転送オブジェクト
 */
export interface SystemSettingsOutputDto {
  retryWaitSecondsMin: number;
  retryWaitSecondsMax: number;
  retryCount: number;
  recordingEnabled: boolean;
  recordingBitrate: number;
  recordingRetentionDays: number;
  autoLockTimeoutMinutes: number;
  enabledLogSources: string[];
  securityEventsOnly: boolean;
  maxStoredLogs: number;
  logRetentionDays: number;
}
