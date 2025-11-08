/**
 * Use Case: Get Latest Recording By Variables ID
 * Retrieves the most recent tab recording for a given automation variables ID
 */

import { RecordingStorageRepository } from '@domain/repositories/RecordingStorageRepository';
import { Logger } from '@domain/types/logger.types';
import { TabRecordingOutputDto } from '@application/dtos/TabRecordingOutputDto';
import { TabRecordingMapper } from '@application/mappers/TabRecordingMapper';

export interface GetLatestRecordingByVariablesIdInput {
  automationVariablesId: string;
}

export class GetLatestRecordingByVariablesIdUseCase {
  constructor(
    private recordingRepository: RecordingStorageRepository,
    private logger: Logger
  ) {}

  async execute(
    input: GetLatestRecordingByVariablesIdInput
  ): Promise<TabRecordingOutputDto | null> {
    const recordingResult = await this.recordingRepository.loadLatestByAutomationVariablesId(
      input.automationVariablesId
    );

    if (recordingResult.isFailure) {
      this.logger.error('Failed to load latest recording', {
        automationVariablesId: input.automationVariablesId,
        error: recordingResult.error,
      });
      throw recordingResult.error!;
    }

    const recording = recordingResult.value;

    if (!recording) {
      this.logger.info('No recording found for automation variables', {
        automationVariablesId: input.automationVariablesId,
      });
      return null;
    }

    // DTOパターン: エンティティをOutputDTOに変換
    return TabRecordingMapper.toOutputDto(recording);
  }
}
