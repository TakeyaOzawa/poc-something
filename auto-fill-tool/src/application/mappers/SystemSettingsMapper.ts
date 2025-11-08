/**
 * SystemSettings Mapper
 * ドメインエンティティ ↔ OutputDTO の変換
 */
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { SystemSettingsOutputDto } from '../dtos/SystemSettingsOutputDto';

export class SystemSettingsMapper {
  static toOutputDto(entity: SystemSettingsCollection): SystemSettingsOutputDto {
    return {
      retryWaitSecondsMin: entity.getRetryWaitSecondsMin(),
      retryWaitSecondsMax: entity.getRetryWaitSecondsMax(),
      retryCount: entity.getRetryCount(),
      recordingEnabled: entity.getEnableTabRecording(),
      recordingBitrate: entity.getRecordingBitrate(),
      recordingRetentionDays: entity.getRecordingRetentionDays(),
      enabledLogSources: entity.getEnabledLogSources(),
      securityEventsOnly: entity.getSecurityEventsOnly(),
      maxStoredLogs: entity.getMaxStoredLogs(),
      logRetentionDays: entity.getLogRetentionDays(),
    };
  }

  /**
   * Convert SystemSettingsOutputDto back to SystemSettingsCollection entity
   * Note: This is needed for cases where DTO is used in place of entity
   */
  static fromOutputDto(dto: SystemSettingsOutputDto): SystemSettingsCollection {
    return new SystemSettingsCollection({
      retryWaitSecondsMin: dto.retryWaitSecondsMin,
      retryWaitSecondsMax: dto.retryWaitSecondsMax,
      retryCount: dto.retryCount,
      enableTabRecording: dto.recordingEnabled,
      recordingBitrate: dto.recordingBitrate,
      recordingRetentionDays: dto.recordingRetentionDays,
      enabledLogSources: dto.enabledLogSources,
      securityEventsOnly: dto.securityEventsOnly,
      maxStoredLogs: dto.maxStoredLogs,
      logRetentionDays: dto.logRetentionDays,
    });
  }
}
