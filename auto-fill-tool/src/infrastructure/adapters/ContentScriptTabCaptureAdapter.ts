/**
 * Infrastructure Layer: Content Script Tab Capture Adapter
 * Implements TabCaptureAdapter using getDisplayMedia() in content script
 * This adapter sends messages to content script to handle tab capture
 *
 * @coverage 0%
 * @reason テストカバレッジが低い理由:
 * - Content Scriptとのメッセージパッシングに依存しており、Jestのテスト環境では
 *   適切にモックすることが困難
 * - getDisplayMedia() APIはユーザージェスチャーが必要で、自動テストでは実行不可
 * - 実際の機能は統合テストまたはE2Eテストで検証することが適切
 */

import browser from 'webextension-polyfill';
import { TabCaptureAdapter, TabCaptureConfig } from '@domain/types/tab-capture-port.types';
import { Logger } from '@domain/types/logger.types';

// Message types for content script recording communication
const RECORDING_MESSAGES = {
  START_RECORDING: 'contentScript:startRecording',
  STOP_RECORDING: 'contentScript:stopRecording',
  RECORDING_STARTED: 'contentScript:recordingStarted',
  RECORDING_STOPPED: 'contentScript:recordingStopped',
  RECORDING_ERROR: 'contentScript:recordingError',
} as const;

interface RecorderData {
  recorderId: string;
  tabId: number;
  config: TabCaptureConfig;
}

export class ContentScriptTabCaptureAdapter implements TabCaptureAdapter {
  private recorders: Map<string, RecorderData>;

  constructor(private logger: Logger) {
    this.recorders = new Map();

    // Listen for messages from content script
    browser.runtime.onMessage.addListener((message: unknown) => {
      if (message && typeof message === 'object' && 'action' in message) {
        const action = (message as { action: string }).action;

        // Log recording events from content script
        if (action === RECORDING_MESSAGES.RECORDING_STARTED) {
          const { recorderId } = message as { recorderId: string };
          this.logger.info('Content script recording started notification', {
            recorderId,
          });
        }

        if (action === RECORDING_MESSAGES.RECORDING_ERROR) {
          const { recorderId, error } = message as { recorderId: string; error: unknown };
          this.logger.error('Content script recording error notification', {
            recorderId,
            error,
          });
        }
      }
    });
  }

  /**
   * Capture tab (not used in content script approach, but required by interface)
   * Recording is started directly via startRecording
   */
  async captureTab(_tabId: number, _config: TabCaptureConfig): Promise<MediaStream> {
    // This method is not used in the content script approach
    // Recording is handled entirely within the content script
    throw new Error(
      'captureTab is not supported in ContentScriptTabCaptureAdapter. Use startRecording instead.'
    );
  }

  /**
   * Start recording using content script getDisplayMedia
   */
  async startRecording(
    stream: MediaStream | null,
    config: TabCaptureConfig,
    _onDataAvailable: (chunk: Blob) => void
  ): Promise<string> {
    // Stream parameter is ignored in content script approach
    // We need tabId to send message to content script
    const tabId = (config as TabCaptureConfig & { tabId?: number }).tabId;
    if (!tabId) {
      throw new Error('tabId is required in config for content script recording');
    }

    const recorderId = `recorder_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    this.logger.info('Starting content script recording', {
      recorderId,
      tabId,
      config,
    });

    // Send start recording message to content script
    const response = (await browser.tabs.sendMessage(tabId, {
      action: RECORDING_MESSAGES.START_RECORDING,
      recorderId,
      config: {
        audio: config.audio,
        video: config.video,
        videoBitsPerSecond: config.videoBitsPerSecond,
      },
    })) as { success: boolean; error?: string };

    if (!response || !response.success) {
      const error = new Error(response?.error || 'Failed to start content script recording');
      this.logger.error('Failed to start content script recording', {
        recorderId,
        tabId,
        error,
      });
      throw error;
    }

    // Store recorder data
    this.recorders.set(recorderId, {
      recorderId,
      tabId,
      config,
    });

    this.logger.info('Content script recording started successfully', {
      recorderId,
      tabId,
      totalActiveRecorders: this.recorders.size,
    });

    return recorderId;
  }

  /**
   * Stop recording and return final blob
   */
  // eslint-disable-next-line max-lines-per-function -- Content script message passing requires Promise-based listener setup with timeout handling, message validation, blob conversion, cleanup logic, and extensive logging for debugging async communication issues. Splitting would break the cohesive flow of stop-record-wait-cleanup sequence.
  async stopRecording(recorderId: string): Promise<Blob> {
    this.logger.info('Stopping content script recording', {
      recorderId,
      activeRecorders: Array.from(this.recorders.keys()),
    });

    const recorderData = this.recorders.get(recorderId);
    if (!recorderData) {
      const error = new Error('Recorder not found');
      this.logger.error('Failed to stop recording: recorder not found', {
        recorderId,
        activeRecorders: Array.from(this.recorders.keys()),
        totalActiveRecorders: this.recorders.size,
        error,
      });
      throw error;
    }

    // Listen for recording stopped message with blob data
    const blobPromise = new Promise<Blob>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for recording to stop'));
      }, 30000); // 30 second timeout

      const listener = (message: unknown) => {
        if (message && typeof message === 'object' && 'action' in message) {
          const msg = message as { action: string; recorderId?: string; blob?: Blob };

          if (
            msg.action === RECORDING_MESSAGES.RECORDING_STOPPED &&
            msg.recorderId === recorderId
          ) {
            clearTimeout(timeout);
            browser.runtime.onMessage.removeListener(listener);

            // Convert ArrayBuffer back to Blob
            const blob = new Blob([msg.blobData], { type: 'video/webm' });

            this.logger.info('Content script recording stopped successfully', {
              recorderId,
              blobSize: blob.size,
              remainingActiveRecorders: this.recorders.size - 1,
            });

            resolve(blob);
          }
        }
      };

      browser.runtime.onMessage.addListener(listener);
    });

    // Send stop recording message to content script
    const response = (await browser.tabs.sendMessage(recorderData.tabId, {
      action: RECORDING_MESSAGES.STOP_RECORDING,
      recorderId,
    })) as { success: boolean; error?: string };

    if (!response || !response.success) {
      const error = new Error(response?.error || 'Failed to stop content script recording');
      this.logger.error('Failed to stop content script recording', {
        recorderId,
        error,
      });
      throw error;
    }

    // Wait for blob data from content script
    const blob = await blobPromise;

    // Cleanup
    this.recorders.delete(recorderId);

    return blob;
  }

  /**
   * Check if recorder is currently recording
   */
  isRecording(recorderId: string): boolean {
    return this.recorders.has(recorderId);
  }
}
