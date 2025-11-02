/**
 * SystemSettings Mapper
 * ドメインエンティティ → OutputDTO の変換
 */
import { SystemSettings } from '@domain/entities/SystemSettings';
import { SystemSettingsOutputDto } from '../dtos/SystemSettingsOutputDto';

export class SystemSettingsMapper {
  static toOutputDto(data: SystemSettings): SystemSettingsOutputDto {
    return {
      retryWaitSecondsMin: data.retryWaitSecondsMin,
      retryWaitSecondsMax: data.retryWaitSecondsMax,
      retryCount: data.retryCount,
      recordingEnabled: data.enableTabRecording,
      recordingBitrate: data.recordingBitrate,
      recordingRetentionDays: data.recordingRetentionDays,
      autoLockTimeoutMinutes: 15, // デフォルト値（SystemSettingsに存在しない場合）
      enabledLogSources: data.enabledLogSources,
      securityEventsOnly: data.securityEventsOnly,
      maxStoredLogs: data.maxStoredLogs,
      logRetentionDays: data.logRetentionDays,
    };
  }
}
