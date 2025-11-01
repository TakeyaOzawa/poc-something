/**
 * StartTabRecordingUseCase
 * タブ録画を開始するユースケース
 */

import { TabRecording } from '@domain/entities/TabRecording';
import { TabRecordingRepository } from '@domain/repositories/TabRecordingRepository';

export interface TabCaptureAdapter {
  startRecording(tabId: number): Promise<Blob>;
}

export class StartTabRecordingUseCase {
  constructor(
    private repository: TabRecordingRepository,
    private tabCaptureAdapter: TabCaptureAdapter
  ) {}

  async execute(automationResultId: string, tabId: number): Promise<TabRecording> {
    try {
      const recordingBlob = await this.tabCaptureAdapter.startRecording(tabId);
      const recording = TabRecording.create(automationResultId, recordingBlob);
      
      await this.repository.save(recording);
      return recording;
    } catch (error) {
      throw new Error(`録画の開始に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
