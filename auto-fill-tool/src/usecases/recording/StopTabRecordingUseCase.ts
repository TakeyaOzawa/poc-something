/**
 * StopTabRecordingUseCase
 * タブ録画を停止するユースケース
 */

import { TabRecordingRepository } from '@domain/repositories/TabRecordingRepository';

export interface TabCaptureAdapter {
  stopRecording(tabId: number): Promise<void>;
}

export class StopTabRecordingUseCase {
  constructor(
    private repository: TabRecordingRepository,
    private tabCaptureAdapter: TabCaptureAdapter
  ) {}

  async execute(recordingId: string, tabId: number): Promise<void> {
    try {
      const recording = await this.repository.getById(recordingId);
      if (!recording) {
        throw new Error('録画が見つかりません');
      }

      if (recording.isCompleted()) {
        throw new Error('録画は既に完了しています');
      }

      await this.tabCaptureAdapter.stopRecording(tabId);
      recording.complete();
      
      await this.repository.save(recording);
    } catch (error) {
      throw new Error(`録画の停止に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
