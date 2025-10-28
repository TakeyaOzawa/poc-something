/**
 * Use Case: Get Recording By Result ID
 * Retrieves a tab recording by automation result ID
 */

import { RecordingStorageRepository } from '@domain/repositories/RecordingStorageRepository';
import { TabRecording } from '@domain/entities/TabRecording';
import { Logger } from '@domain/types/logger.types';

export interface GetRecordingByResultIdInput {
  automationResultId: string;
}

export class GetRecordingByResultIdUseCase {
  constructor(
    private recordingRepository: RecordingStorageRepository,
    private logger: Logger
  ) {}

  async execute(input: GetRecordingByResultIdInput): Promise<TabRecording | null> {
    const recordingResult = await this.recordingRepository.loadByAutomationResultId(
      input.automationResultId
    );

    if (recordingResult.isFailure) {
      this.logger.error('Failed to load recording', {
        automationResultId: input.automationResultId,
        error: recordingResult.error,
      });
      throw recordingResult.error!;
    }

    const recording = recordingResult.value;

    if (!recording) {
      this.logger.info('Recording not found', { automationResultId: input.automationResultId });
      return null;
    }

    return recording;
  }
}
