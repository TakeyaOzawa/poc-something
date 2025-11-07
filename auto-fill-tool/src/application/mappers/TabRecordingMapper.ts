/**
 * Application Layer: TabRecording Mapper
 * Maps TabRecording domain entity to DTO
 */

import { TabRecording } from '@domain/entities/TabRecording';
import { TabRecordingOutputDto } from '../dtos/TabRecordingOutputDto';

export class TabRecordingMapper {
  static toOutputDto(tabRecording: TabRecording): TabRecordingOutputDto {
    const data = tabRecording.toData();
    return {
      id: data.id,
      automationResultId: data.automationResultId,
      recordingData: data.blobData || new Blob(),
      startTime: data.startedAt,
      endTime: data.endedAt || undefined,
      fileSize: data.sizeBytes,
      mimeType: data.mimeType,
      createdAt: data.startedAt, // Use startedAt as createdAt
    };
  }
}
