/**
 * Use Case: Stop Tab Recording
 * Stops recording a tab and saves the final blob
 *
 * @coverage 86.2%
 * @reason テストカバレッジが低い理由:
 * - TabCaptureAdapter.stopRecording()が例外をスローする特定のエラーケース
 *   （lines 63-68）をテストするには、アダプターの失敗シナリオを
 *   正確にモックする必要がある
 * - 複数のバリデーション分岐（録画が見つからない、録画中でない、
 *   recorderIdが存在しない）の全ての組み合わせをテストするには
 *   追加のテストケースが必要
 * - 現在のテストでは主要な正常系と基本的なエラーケースをカバーしており、
 *   より詳細なエッジケースには追加実装が必要
 */

import { TabCaptureAdapter } from '@domain/types/tab-capture-port.types';
import { RecordingStorageRepository } from '@domain/repositories/RecordingStorageRepository';
import { TabRecording } from '@domain/entities/TabRecording';
import { Logger } from '@domain/types/logger.types';

export interface StopTabRecordingInput {
  automationResultId: string;
}

export class StopTabRecordingUseCase {
  constructor(
    private tabCaptureAdapter: TabCaptureAdapter,
    private recordingRepository: RecordingStorageRepository,
    private logger: Logger
  ) {}

  // eslint-disable-next-line max-lines-per-function -- Recording stop requires extensive validation (recording exists, is recording, has recorderId) and detailed logging at each step for debugging. Splitting would separate validation logic from business logic, reducing code cohesion.
  async execute(input: StopTabRecordingInput): Promise<TabRecording | null> {
    this.logger.info('Starting stop tab recording use case', {
      automationResultId: input.automationResultId,
    });

    // 1. Load recording entity by automation result ID
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
      this.logger.warn('Recording not found when attempting to stop', {
        automationResultId: input.automationResultId,
      });
      return null;
    }

    this.logger.info('Recording entity loaded', {
      recordingId: recording.getId(),
      automationResultId: input.automationResultId,
      tabId: recording.getTabId(),
      currentStatus: recording.getStatus(),
      recorderId: recording.getRecorderId(),
    });

    if (!recording.isRecording()) {
      this.logger.warn('Recording is not in progress, cannot stop', {
        recordingId: recording.getId(),
        automationResultId: input.automationResultId,
        currentStatus: recording.getStatus(),
        tabId: recording.getTabId(),
      });
      return recording;
    }

    // Ensure we have a recorderId
    const recorderId = recording.getRecorderId();
    if (!recorderId) {
      this.logger.error('Recording has no recorderId when attempting to stop', {
        recordingId: recording.getId(),
        automationResultId: input.automationResultId,
        tabId: recording.getTabId(),
        currentStatus: recording.getStatus(),
      });
      const errorRecording = recording.markError('No recorderId found');
      await this.recordingRepository.save(errorRecording);
      throw new Error('Recording has no recorderId');
    }

    try {
      // 2. Stop recording using the correct recorderId
      this.logger.info('Attempting to stop MediaRecorder', {
        recordingId: recording.getId(),
        mediaRecorderId: recorderId,
        automationResultId: input.automationResultId,
      });

      const blob = await this.tabCaptureAdapter.stopRecording(recorderId);

      this.logger.info('[StopRecording] Blob received from adapter', {
        recordingId: recording.getId(),
        mediaRecorderId: recorderId,
        blobSize: blob.size,
        blobType: blob.type,
      });

      // 3. Update entity and save
      const stoppedRecording = recording.stop().save(blob);

      this.logger.info('[StopRecording] Entity updated, calling repository.save()', {
        recordingId: stoppedRecording.getId(),
        automationResultId: stoppedRecording.getAutomationResultId(),
        status: stoppedRecording.getStatus(),
        sizeBytes: stoppedRecording.getSizeBytes(),
        sizeMB: stoppedRecording.getSizeMB().toFixed(2),
      });

      await this.recordingRepository.save(stoppedRecording);

      this.logger.info('Tab recording stopped successfully', {
        recordingId: recording.getId(),
        mediaRecorderId: recorderId,
        automationResultId: input.automationResultId,
        tabId: recording.getTabId(),
        sizeBytes: blob.size,
        sizeMB: stoppedRecording.getSizeMB().toFixed(2),
        durationMs: stoppedRecording.getDurationMs(),
        durationSeconds: stoppedRecording.getDurationSeconds(),
      });

      return stoppedRecording;
    } catch (error) {
      this.logger.error('Failed to stop tab recording', {
        recordingId: recording.getId(),
        mediaRecorderId: recorderId,
        automationResultId: input.automationResultId,
        tabId: recording.getTabId(),
        error,
      });
      const errorRecording = recording.markError('Failed to stop recording');
      await this.recordingRepository.save(errorRecording);
      throw error;
    }
  }
}
