/**
 * DeleteOldRecordingsUseCase
 * 古い録画を削除するユースケース
 */

import { TabRecordingRepository } from '@domain/repositories/TabRecordingRepository';

export class DeleteOldRecordingsUseCase {
  constructor(private repository: TabRecordingRepository) {}

  async execute(olderThanDays: number): Promise<number> {
    if (olderThanDays < 1) {
      throw new Error('保持期間は1日以上である必要があります');
    }

    return await this.repository.deleteOldRecordings(olderThanDays);
  }
}
