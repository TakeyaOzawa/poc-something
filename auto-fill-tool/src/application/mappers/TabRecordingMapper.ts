/**
 * Application Layer: TabRecording Mapper
 * Maps TabRecording domain entity to DTO
 */

import { TabRecording } from '@domain/entities/TabRecording';
import { TabRecordingOutputDto } from '../dtos/TabRecordingOutputDto';

export class TabRecordingMapper {
  static toOutputDto(entity: TabRecording): TabRecordingOutputDto {
    return {
      id: entity.getId(),
      automationResultId: entity.getAutomationResultId(),
      tabId: entity.getTabId(),
      bitrate: entity.getBitrate(),
      state: entity.getStatus(),
      recordingData: undefined, // Blobデータは別途処理が必要
      startedAt: entity.getStartedAt(),
      stoppedAt: entity.getEndedAt() ?? undefined,
      errorMessage: entity.getErrorMessage() ?? undefined,
      duration: entity.getDurationMs() ?? undefined,
      fileSize: entity.getSizeBytes(),
    };
  }
}
