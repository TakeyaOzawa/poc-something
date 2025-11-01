/**
 * GetRecordingByResultIdUseCase
 * 自動化実行結果IDで録画を取得するユースケース
 */

import { TabRecording } from '@domain/entities/TabRecording';
import { TabRecordingRepository } from '@domain/repositories/TabRecordingRepository';

export class GetRecordingByResultIdUseCase {
  constructor(private repository: TabRecordingRepository) {}

  async execute(automationResultId: string): Promise<TabRecording | undefined> {
    return await this.repository.getByAutomationResultId(automationResultId);
  }
}
