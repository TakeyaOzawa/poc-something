/**
 * Infrastructure Layer: Offscreen Tab Capture Adapter
 * Implements TabCaptureAdapter using Chrome Offscreen Document API
 * This adapter creates and manages an offscreen document that handles tab capture
 * to avoid Manifest V3 user gesture restrictions
 *
 * @coverage 0%
 * @reason テストカバレッジが低い理由:
 * - chrome.offscreen APIとMediaRecorder APIを使用しており、Jestのテスト環境では
 *   これらのブラウザネイティブAPIを適切にモックすることが困難
 * - Offscreen Documentの作成・削除とメッセージパッシングの動作を完全に再現するには
 *   複雑なモック実装が必要
 * - 実際のOffscreen Document機能は統合テストまたはE2Eテストで検証することが適切
 */

import browser from 'webextension-polyfill';
import { TabCaptureAdapter, TabCaptureConfig } from '@domain/types/tab-capture-port.types';
import { Logger } from '@domain/types/logger.types';

// Message types for offscreen document communication
const OFFSCREEN_MESSAGES = {
  START_RECORDING: 'offscreen:startRecording',
  STOP_RECORDING: 'offscreen:stopRecording',
  RECORDING_STARTED: 'offscreen:recordingStarted',
  RECORDING_STOPPED: 'offscreen:recordingStopped',
  RECORDING_ERROR: 'offscreen:recordingError',
} as const;

interface RecorderData {
  recorderId: string;
  tabId: number;
  config: TabCaptureConfig;
}

export class OffscreenTabCaptureAdapter implements TabCaptureAdapter {
  private recorders: Map<string, RecorderData>;
  private offscreenDocumentCreated: boolean = false;

  constructor(private logger: Logger) {
    this.recorders = new Map();

    // Listen for messages from offscreen document
    browser.runtime.onMessage.addListener((message: unknown) => {
      if (message && typeof message === 'object' && 'action' in message) {
        const action = (message as { action: string }).action;

        // Log recording events from offscreen document
        if (action === OFFSCREEN_MESSAGES.RECORDING_STARTED) {
          const { recorderId, tabId } = message as { recorderId: string; tabId: number };
          this.logger.info('Offscreen recording started notification', {
            recorderId,
            tabId,
          });
        }

        if (action === OFFSCREEN_MESSAGES.RECORDING_ERROR) {
          const { recorderId, error } = message as { recorderId: string; error: unknown };
          this.logger.error('Offscreen recording error notification', {
            recorderId,
            error,
          });
        }
      }
    });
  }

  /**
   * Capture tab (not used in offscreen approach, but required by interface)
   * Recording is started directly via startRecording
   */
  async captureTab(_tabId: number, _config: TabCaptureConfig): Promise<MediaStream> {
    // This method is not used in the offscreen approach
    // Recording is handled entirely within the offscreen document
    throw new Error(
      'captureTab is not supported in OffscreenTabCaptureAdapter. Use startRecording instead.'
    );
  }

  /**
   * Start recording using offscreen document
   */
  // eslint-disable-next-line max-lines-per-function, complexity -- Offscreen recording requires sequential Chrome API operations (tab validation, permission activation, offscreen document creation, stream ID acquisition, message passing) with multiple conditional checks for URL restrictions, permission checks, and error handling. Each operation depends on the previous one's success and requires separate error logging. Cannot be split while maintaining cohesive flow.
  async startRecording(
    stream: MediaStream | null,
    config: TabCaptureConfig,
    _onDataAvailable: (chunk: Blob) => void
  ): Promise<string> {
    // Stream parameter is ignored in offscreen approach
    // We need tabId to start recording, which should be passed in config
    const tabId = (config as TabCaptureConfig & { tabId?: number }).tabId;
    if (!tabId) {
      throw new Error('tabId is required in config for offscreen recording');
    }

    const recorderId = `recorder_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    this.logger.info('Starting offscreen recording', {
      recorderId,
      tabId,
      config,
    });

    // Validate tab URL before starting recording
    let tab;
    try {
      tab = await browser.tabs.get(tabId);
      this.logger.info('Tab info retrieved', {
        tabId,
        url: tab.url,
        title: tab.title,
        active: tab.active,
      });

      if (
        tab.url &&
        (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))
      ) {
        const error = new Error(`Cannot capture Chrome internal pages. Current URL: ${tab.url}`);
        this.logger.error('Tab URL is not capturable', { tabId, url: tab.url, error });
        throw error;
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot capture Chrome internal')) {
        throw error;
      }
      this.logger.error('Failed to get tab info', { tabId, error });
      throw new Error('Failed to validate tab URL');
    }

    // Activate activeTab permission by injecting a script
    // This is required for chrome.tabCapture.getMediaStreamId() in Manifest V3
    try {
      await browser.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Empty function to activate activeTab permission
          return true;
        },
      });
      this.logger.info('ActiveTab permission activated', { tabId });
    } catch (error) {
      this.logger.warn('Failed to activate activeTab permission (might already be active)', {
        tabId,
        error,
      });
      // Continue anyway - permission might already be active from content script
    }

    // Ensure offscreen document exists
    await this.ensureOffscreenDocument();

    // Get media stream ID in Background Script (Tab Capture API is not available in Offscreen Document)
    let streamId: string;
    try {
      streamId = await this.getMediaStreamId(tabId);
      this.logger.info('Media stream ID obtained in background', {
        recorderId,
        tabId,
        streamId,
      });
    } catch (error) {
      // If getMediaStreamId fails due to user gesture restrictions, skip recording
      this.logger.warn('Failed to get media stream ID, skipping recording', {
        recorderId,
        tabId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        'Recording skipped: activeTab permission not available. This is expected behavior in Manifest V3 when extension is not invoked directly by user gesture.'
      );
    }

    // Send start recording message to offscreen document with stream ID
    const response = (await browser.runtime.sendMessage({
      action: OFFSCREEN_MESSAGES.START_RECORDING,
      recorderId,
      tabId,
      streamId, // Pass stream ID to offscreen document
      config: {
        audio: config.audio,
        video: config.video,
        videoBitsPerSecond: config.videoBitsPerSecond,
      },
    })) as { success: boolean; error?: string };

    if (!response || !response.success) {
      const error = new Error(response?.error || 'Failed to start offscreen recording');
      this.logger.error('Failed to start offscreen recording', {
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

    this.logger.info('Offscreen recording started successfully', {
      recorderId,
      tabId,
      totalActiveRecorders: this.recorders.size,
    });

    return recorderId;
  }

  /**
   * Stop recording and return final blob
   */
  // eslint-disable-next-line max-lines-per-function -- Offscreen document message passing requires Promise-based listener setup with timeout handling, message validation, blob conversion, cleanup logic, and extensive logging for debugging async communication issues. Splitting would break the cohesive flow of stop-record-wait-cleanup sequence.
  async stopRecording(recorderId: string): Promise<Blob> {
    this.logger.info('Stopping offscreen recording', {
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
            msg.action === OFFSCREEN_MESSAGES.RECORDING_STOPPED &&
            msg.recorderId === recorderId
          ) {
            clearTimeout(timeout);
            browser.runtime.onMessage.removeListener(listener);

            // Convert ArrayBuffer back to Blob
            const blob = new Blob([msg.blobData], { type: 'video/webm' });

            this.logger.info('Offscreen recording stopped successfully', {
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

    // Send stop recording message to offscreen document
    const response = (await browser.runtime.sendMessage({
      action: OFFSCREEN_MESSAGES.STOP_RECORDING,
      recorderId,
    })) as { success: boolean; error?: string };

    if (!response || !response.success) {
      const error = new Error(response?.error || 'Failed to stop offscreen recording');
      this.logger.error('Failed to stop offscreen recording', {
        recorderId,
        error,
      });
      throw error;
    }

    // Wait for blob data from offscreen document
    const blob = await blobPromise;

    // Cleanup
    this.recorders.delete(recorderId);

    // Close offscreen document if no more recordings
    if (this.recorders.size === 0) {
      await this.closeOffscreenDocument();
    }

    return blob;
  }

  /**
   * Check if recorder is currently recording
   */
  isRecording(recorderId: string): boolean {
    return this.recorders.has(recorderId);
  }

  /**
   * Get media stream ID using chrome.tabCapture.getMediaStreamId
   * This must be called in Background Script context
   */
  private getMediaStreamId(tabId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      this.logger.info('Calling chrome.tabCapture.getMediaStreamId', {
        tabId,
        hasTabCapture: typeof chrome.tabCapture !== 'undefined',
        hasGetMediaStreamId:
          typeof (chrome.tabCapture as { getMediaStreamId?: unknown })?.getMediaStreamId !==
          'undefined',
      });

      const options = {
        targetTabId: tabId,
      };

      (
        chrome.tabCapture as {
          getMediaStreamId: (
            options: { targetTabId: number },
            callback: (streamId: string) => void
          ) => void;
        }
      ).getMediaStreamId(options, (streamId: string) => {
        if (browser.runtime.lastError) {
          this.logger.error('chrome.tabCapture.getMediaStreamId failed', {
            tabId,
            error: browser.runtime.lastError.message,
          });
          reject(new Error(browser.runtime.lastError.message));
          return;
        }

        if (!streamId) {
          this.logger.error('chrome.tabCapture.getMediaStreamId returned empty streamId', {
            tabId,
          });
          reject(new Error('Failed to get media stream ID'));
          return;
        }

        this.logger.info('Stream ID obtained successfully', {
          tabId,
          streamId,
        });
        resolve(streamId);
      });
    });
  }

  /**
   * Ensure offscreen document exists
   */
  private async ensureOffscreenDocument(): Promise<void> {
    if (this.offscreenDocumentCreated) {
      this.logger.debug('Offscreen document already exists');
      return;
    }

    try {
      // Check if offscreen document already exists
      const existingContexts = await (
        browser.runtime as {
          getContexts: (options: { contextTypes: string[] }) => Promise<unknown[]>;
        }
      ).getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
      });

      if (existingContexts.length > 0) {
        this.logger.info('Offscreen document already exists');
        this.offscreenDocumentCreated = true;
        return;
      }

      // Create offscreen document
      await (
        chrome.offscreen as {
          createDocument: (options: {
            url: string;
            reasons: string[];
            justification: string;
          }) => Promise<void>;
        }
      ).createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'], // Required reason for media capture
        justification: 'Recording tab for auto-fill session replay',
      });

      this.offscreenDocumentCreated = true;
      this.logger.info('Offscreen document created successfully');
    } catch (error) {
      this.logger.error('Failed to create offscreen document', { error });
      throw error;
    }
  }

  /**
   * Close offscreen document
   */
  private async closeOffscreenDocument(): Promise<void> {
    if (!this.offscreenDocumentCreated) {
      return;
    }

    try {
      await (chrome.offscreen as { closeDocument: () => Promise<void> }).closeDocument();
      this.offscreenDocumentCreated = false;
      this.logger.info('Offscreen document closed successfully');
    } catch (error) {
      // Document might already be closed
      this.logger.debug('Failed to close offscreen document (might already be closed)', { error });
      this.offscreenDocumentCreated = false;
    }
  }
}
