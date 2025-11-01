/**
 * GetLatestRecordingByVariablesIdUseCase
 * 自動化変数IDで最新の録画を取得するユースケース
 */

import { TabRecording } from '@domain/entities/TabRecording';
import { TabRecordingRepository } from '@domain/repositories/TabRecordingRepository';

export class GetLatestRecordingByVariablesIdUseCase {
  constructor(private repository: TabRecordingRepository) {}

  async execute(variablesId: string): Promise<TabRecording | undefined> {
    return await this.repository.getLatestByVariablesId(variablesId);
  }
}
