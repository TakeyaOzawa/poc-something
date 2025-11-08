/**
 * Use Case: Start Tab Recording
 * Starts recording a tab during auto-fill execution
 */

import { TabCaptureAdapter, TabCaptureConfig } from '@domain/types/tab-capture-port.types';
import { RecordingStorageRepository } from '@domain/repositories/RecordingStorageRepository';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { TabRecording } from '@domain/entities/TabRecording';
import { Logger } from '@domain/types/logger.types';
import { TabRecordingOutputDto } from '@application/dtos/TabRecordingOutputDto';
import { TabRecordingMapper } from '@application/mappers/TabRecordingMapper';

export interface StartTabRecordingInput {
  tabId: number;
  automationResultId: string;
}

export class StartTabRecordingUseCase {
  constructor(
    private tabCaptureAdapter: TabCaptureAdapter,
    private recordingRepository: RecordingStorageRepository,
    private systemSettingsRepository: SystemSettingsRepository,
    private logger: Logger
  ) {}

  // eslint-disable-next-line max-lines-per-function -- Recording start requires separate try-catch blocks for captureTab and startRecording to provide specific error context for debugging. Detailed logging at each step is essential for troubleshooting recording failures in production.
  async execute(input: StartTabRecordingInput): Promise<TabRecordingOutputDto | null> {
    this.logger.info('Starting tab recording use case', {
      automationResultId: input.automationResultId,
      tabId: input.tabId,
    });

    // 1. Check system settings - is recording enabled?
    const settingsResult = await this.systemSettingsRepository.load();
    if (settingsResult.isFailure) {
      throw new Error(`Failed to load system settings: ${settingsResult.error?.message}`);
    }
    const settings = settingsResult.value!;
    if (!settings.getEnableTabRecording()) {
      this.logger.info('Tab recording is disabled in system settings', {
        automationResultId: input.automationResultId,
        tabId: input.tabId,
      });
      return null;
    }

    // 2. Create TabRecording entity
    const recording = TabRecording.create({
      automationResultId: input.automationResultId,
      tabId: input.tabId,
      bitrate: settings.getRecordingBitrate(),
    });

    this.logger.info('TabRecording entity created', {
      recordingId: recording.getId(),
      automationResultId: input.automationResultId,
      tabId: input.tabId,
      bitrate: settings.getRecordingBitrate(),
    });

    // 3. Start Chrome Tab Capture
    // Note: For OffscreenTabCaptureAdapter, we pass tabId in config
    // and stream is not used (passed as null)
    const config: TabCaptureConfig & { tabId?: number } = {
      audio: settings.getEnableAudioRecording(),
      video: true,
      videoBitsPerSecond: settings.getRecordingBitrate(),
      tabId: input.tabId, // Add tabId for offscreen adapter
    };

    // Start recording
    // Note: For OffscreenTabCaptureAdapter, captureTab is not called
    // Recording is handled entirely within the offscreen document
    try {
      const chunks: Blob[] = [];
      // Start recording and get recorderId
      // Pass null for stream as it's not used in offscreen approach
      const recorderId = await this.tabCaptureAdapter.startRecording(null as any, config, (chunk) =>
        chunks.push(chunk)
      );

      // 4. Save recording entity with recorderId (status: RECORDING)
      const startedRecording = recording.start(recorderId);
      await this.recordingRepository.save(startedRecording);

      this.logger.info('Tab recording started successfully', {
        recordingId: recording.getId(),
        mediaRecorderId: recorderId,
        automationResultId: input.automationResultId,
        tabId: input.tabId,
        bitrate: settings.getRecordingBitrate(),
        audioEnabled: config.audio,
      });

      // DTOパターン: エンティティをOutputDTOに変換
      return TabRecordingMapper.toOutputDto(startedRecording);
    } catch (error) {
      // Check if error is due to activeTab permission restrictions (Manifest V3)
      if (
        error instanceof Error &&
        error.message.includes('Recording skipped: activeTab permission')
      ) {
        this.logger.warn('Recording skipped due to activeTab permission restrictions', {
          recordingId: recording.getId(),
          automationResultId: input.automationResultId,
          tabId: input.tabId,
          message:
            'This is expected behavior in Manifest V3 when extension is not invoked directly by user gesture',
        });
        // Return null to indicate recording was skipped (not an error)
        return null;
      }

      // For other errors, log and save error recording
      this.logger.error('Failed to start recording', {
        recordingId: recording.getId(),
        automationResultId: input.automationResultId,
        tabId: input.tabId,
        config,
        error,
      });
      const errorRecording = recording.markError('Failed to start recording');
      await this.recordingRepository.save(errorRecording);
      throw error;
    }
  }
}
