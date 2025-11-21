/**
 * Infrastructure Layer: Chrome Tab Capture Adapter
 * Implements TabCaptureAdapter using Chrome Tab Capture API and MediaRecorder API
 *
 * @coverage 0%
 * @reason テストカバレッジが低い理由:
 * - chrome.tabCapture APIとMediaRecorder APIを使用しており、Jestのテスト環境では
 *   これらのブラウザネイティブAPIを適切にモックすることが困難
 * - MediaStreamやMediaRecorderのイベントベースの動作を完全に再現するには
 *   複雑なモック実装が必要
 * - 実際のタブキャプチャ機能は統合テストまたはE2Eテストで検証することが適切
 */

import browser from 'webextension-polyfill';
import { TabCaptureAdapter, TabCaptureConfig } from '@domain/types/tab-capture-port.types';
import { Logger } from '@domain/types/logger.types';

interface RecorderData {
  recorder: MediaRecorder;
  chunks: Blob[];
  stream: MediaStream;
}

export class ChromeTabCaptureAdapter implements TabCaptureAdapter {
  private mediaRecorders: Map<string, RecorderData>;

  constructor(private logger: Logger) {
    this.mediaRecorders = new Map();
  }

  /**
   * Capture tab using Chrome Tab Capture API
   */
  async captureTab(tabId: number, config: TabCaptureConfig): Promise<MediaStream> {
    this.logger.info('Starting tab capture', { tabId, config });

    // Check if tabCapture API is available
    if (typeof chrome === 'undefined' || !chrome.tabCapture) {
      const error = new Error('chrome.tabCapture API is not available');
      this.logger.error('Tab capture API not available', { tabId, config, error });
      throw error;
    }

    // Try using getMediaStreamId (Manifest V3 recommended approach)
    if (
      typeof (chrome.tabCapture as { getMediaStreamId?: unknown }).getMediaStreamId === 'function'
    ) {
      this.logger.info('Using chrome.tabCapture.getMediaStreamId() approach', { tabId });
      return this.captureTabWithStreamId(tabId, config);
    }

    // Fallback to legacy capture() method (Manifest V2)
    if (typeof chrome.tabCapture.capture === 'function') {
      this.logger.info('Using legacy chrome.tabCapture.capture() approach', { tabId });
      return this.captureTabLegacy(tabId, config);
    }

    const error = new Error(
      'Neither chrome.tabCapture.getMediaStreamId() nor chrome.tabCapture.capture() is available. ' +
        'This may be due to Chrome version or API restrictions.'
    );
    this.logger.error('No tab capture method available', { tabId, config, error });
    throw error;
  }

  /**
   * Capture tab using getMediaStreamId (Manifest V3 recommended)
   */
  // eslint-disable-next-line max-lines-per-function -- Chrome Tab Capture API requires callback-based Promise handling with multiple error scenarios, stream ID validation, getUserMedia constraints configuration, and extensive logging for debugging tab capture issues. Splitting this function would reduce code clarity as all steps need access to the same tabId, config, and logging context.
  private async captureTabWithStreamId(
    tabId: number,
    config: TabCaptureConfig
  ): Promise<MediaStream> {
    // First check if the tab URL is capturable (not chrome:// pages)
    try {
      const tab = await browser.tabs.get(tabId);
      if (
        tab.url &&
        (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))
      ) {
        const error = new Error(`Cannot capture Chrome internal pages. Current URL: ${tab.url}`);
        this.logger.error('Tab URL is not capturable', { tabId, url: tab.url, error });
        throw error;
      }
    } catch (error) {
      this.logger.error('Failed to get tab info', { tabId, error });
      throw error instanceof Error ? error : new Error(String(error));
    }

    // eslint-disable-next-line max-lines-per-function -- Promise callback must handle complete Chrome Tab Capture API flow including getMediaStreamId callback with stream validation, getUserMedia constraints configuration, error handling, and extensive logging. All steps require access to the same tabId, config, resolve, and reject closure variables.
    return new Promise((resolve, reject) => {
      // Use targetTabId instead of consumerTabId (Chrome 116+)
      const options: { targetTabId: number } = {
        targetTabId: tabId,
      };

      (
        chrome.tabCapture as {
          getMediaStreamId: (
            options: { targetTabId: number },
            callback: (streamId: string) => void
          ) => void;
        }
      ).getMediaStreamId(options, async (streamId: string) => {
        if (browser.runtime.lastError) {
          const error = new Error(browser.runtime.lastError.message);
          this.logger.error('getMediaStreamId failed', {
            tabId,
            errorMessage: browser.runtime.lastError.message,
            error,
          });
          reject(error);
          return;
        }

        if (!streamId) {
          const error = new Error('Failed to get media stream ID');
          this.logger.error('getMediaStreamId returned null', { tabId, error });
          reject(error);
          return;
        }

        this.logger.info('Media stream ID obtained', { tabId, streamId });

        try {
          // Use getUserMedia with the stream ID
          const constraints: MediaStreamConstraints = {
            audio: config.audio
              ? ({
                  mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: streamId,
                  },
                } as unknown as boolean | MediaTrackConstraints)
              : false,
            video: config.video
              ? ({
                  mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: streamId,
                  },
                } as unknown as boolean | MediaTrackConstraints)
              : false,
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);

          this.logger.info('Tab capture successful via getUserMedia', {
            tabId,
            streamId,
            audioTracks: stream.getAudioTracks().length,
            videoTracks: stream.getVideoTracks().length,
          });

          resolve(stream);
        } catch (error) {
          this.logger.error('getUserMedia failed', { tabId, streamId, error });
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
    });
  }

  /**
   * Legacy capture method (Manifest V2)
   */
  private captureTabLegacy(tabId: number, config: TabCaptureConfig): Promise<MediaStream> {
    return new Promise((resolve, reject) => {
      chrome.tabCapture.capture(
        {
          audio: config.audio,
          video: config.video,
        },
        (stream) => {
          if (browser.runtime.lastError) {
            const error = new Error(browser.runtime.lastError.message);
            this.logger.error('Tab capture (legacy) failed with runtime error', {
              tabId,
              config,
              errorMessage: browser.runtime.lastError.message,
              error,
            });
            reject(error);
            return;
          }

          if (!stream) {
            const error = new Error('Failed to capture tab (legacy)');
            this.logger.error('Tab capture (legacy) returned null stream', {
              tabId,
              config,
              error,
            });
            reject(error);
            return;
          }

          this.logger.info('Tab capture (legacy) successful', {
            tabId,
            audioTracks: stream.getAudioTracks().length,
            videoTracks: stream.getVideoTracks().length,
          });
          resolve(stream);
        }
      );
    });
  }

  /**
   * Start recording using MediaRecorder API
   */
  // eslint-disable-next-line max-lines-per-function -- MediaRecorder setup requires detailed event handler definitions and extensive logging for debugging recording issues. Splitting this function would reduce code clarity as all event handlers need access to the same recorder instance and chunks array.
  async startRecording(
    stream: MediaStream,
    config: TabCaptureConfig,
    onDataAvailable: (chunk: Blob) => void
  ): Promise<string> {
    const recorderId = `recorder_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const options: MediaRecorderOptions = {
      mimeType: 'video/webm;codecs=vp9',
    };

    // Set bitrate if specified
    if (config.videoBitsPerSecond) {
      options.videoBitsPerSecond = config.videoBitsPerSecond;
    }

    this.logger.info('Creating MediaRecorder', {
      recorderId,
      mimeType: options.mimeType,
      videoBitsPerSecond: options.videoBitsPerSecond,
      config,
    });

    const mediaRecorder = new MediaRecorder(stream, options);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
        onDataAvailable(event.data);
        this.logger.info('Recording chunk available', {
          recorderId,
          chunkSize: event.data.size,
          totalChunks: chunks.length,
        });
      }
    };

    mediaRecorder.onerror = (event) => {
      this.logger.error('MediaRecorder error occurred', {
        recorderId,
        event,
        recorderState: mediaRecorder.state,
        mimeType: mediaRecorder.mimeType,
        videoBitsPerSecond: mediaRecorder.videoBitsPerSecond,
      });
    };

    this.mediaRecorders.set(recorderId, {
      recorder: mediaRecorder,
      chunks,
      stream,
    });

    // Generate chunks every 1 second
    mediaRecorder.start(1000);

    this.logger.info('MediaRecorder started successfully', {
      recorderId,
      state: mediaRecorder.state,
      timeslice: 1000,
      totalActiveRecorders: this.mediaRecorders.size,
    });

    return recorderId;
  }

  /**
   * Stop recording and return final blob
   */
  async stopRecording(recorderId: string): Promise<Blob> {
    this.logger.info('Attempting to stop recording', {
      recorderId,
      activeRecorders: Array.from(this.mediaRecorders.keys()),
    });

    const recorderData = this.mediaRecorders.get(recorderId);

    if (!recorderData) {
      const error = new Error('MediaRecorder not found');
      this.logger.error('Failed to stop recording: recorder not found', {
        recorderId,
        activeRecorders: Array.from(this.mediaRecorders.keys()),
        totalActiveRecorders: this.mediaRecorders.size,
        error,
      });
      throw error;
    }

    const { recorder, chunks, stream } = recorderData;

    this.logger.info('Stopping MediaRecorder', {
      recorderId,
      currentState: recorder.state,
      chunksCount: chunks.length,
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
    });

    return new Promise((resolve) => {
      recorder.onstop = () => {
        // Stop all tracks in the stream
        stream.getTracks().forEach((track) => track.stop());

        // Combine chunks into final blob
        const blob = new Blob(chunks, { type: 'video/webm' });

        // Cleanup
        this.mediaRecorders.delete(recorderId);

        this.logger.info('Recording stopped successfully', {
          recorderId,
          blobSize: blob.size,
          chunksCount: chunks.length,
          remainingActiveRecorders: this.mediaRecorders.size,
        });

        resolve(blob);
      };

      if (recorder.state === 'recording') {
        recorder.stop();
      } else {
        // Already stopped - just return the blob
        const blob = new Blob(chunks, { type: 'video/webm' });
        this.mediaRecorders.delete(recorderId);

        this.logger.info('Recording already stopped, returning existing blob', {
          recorderId,
          state: recorder.state,
          blobSize: blob.size,
        });

        resolve(blob);
      }
    });
  }

  /**
   * Check if recorder is currently recording
   */
  isRecording(recorderId: string): boolean {
    const recorderData = this.mediaRecorders.get(recorderId);
    return recorderData?.recorder.state === 'recording';
  }
}
