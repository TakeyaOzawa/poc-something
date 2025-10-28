import browser from 'webextension-polyfill';
import type {
  OffscreenPresenter as OffscreenPresenterInterface,
  OffscreenView as OffscreenViewInterface,
  OffscreenDependencies,
  RecordingState,
  StartRecordingRequest,
  StopRecordingRequest,
  RecordingResult,
} from '../types/offscreen.types';
import { OFFSCREEN_MESSAGES as MESSAGES } from '../types/offscreen.types';

/**
 * Presenter for Offscreen Document
 * Orchestrates recording state and message handling
 * Coordinates View operations and communicates with background script
 */
export class OffscreenPresenter implements OffscreenPresenterInterface {
  private view: OffscreenViewInterface;
  private activeRecordings = new Map<string, RecordingState>();

  constructor(deps: OffscreenDependencies) {
    this.view = deps.view;
  }

  /**
   * Initialize message listener
   */
  public init(): void {
    console.log('[OffscreenPresenter] Initializing offscreen document');

    // Register message listener
    browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
      if (message && typeof message === 'object' && 'action' in message) {
        const action = (message as any).action;

        if (action === MESSAGES.START_RECORDING) {
          this.handleStartRecording(message as StartRecordingRequest)
            .then(sendResponse)
            .catch((error) => {
              sendResponse({ success: false, error: error.message });
            });
          return true; // Async response
        }

        if (action === MESSAGES.STOP_RECORDING) {
          this.handleStopRecording(message as StopRecordingRequest)
            .then(sendResponse)
            .catch((error) => {
              sendResponse({ success: false, error: error.message });
            });
          return true; // Async response
        }
      }
      return true; // Always return true to indicate async handling (sendResponse may not be called for unhandled messages)
    });

    console.log('[OffscreenPresenter] Message listener registered');
  }

  /**
   * Handle start recording request
   */
  // eslint-disable-next-line max-lines-per-function -- Orchestrates tab recording with validation, MediaRecorder setup, event handlers, state management, and error handling with background script communication. The sequential logic flow (validate state, create recorder, setup handlers, store state, start recording, notify background) is clear and cannot be split without harming readability and shared closure access.
  public async handleStartRecording(
    request: StartRecordingRequest
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[OffscreenPresenter] Starting recording', {
      recorderId: request.recorderId,
      tabId: request.tabId,
      config: request.config,
    });

    try {
      // Validate: Check if already recording
      if (this.activeRecordings.has(request.recorderId)) {
        throw new Error(`Recording ${request.recorderId} already exists`);
      }

      console.log('[OffscreenPresenter] Using stream ID from background', {
        recorderId: request.recorderId,
        tabId: request.tabId,
        streamId: request.streamId,
      });

      // Store chunks for this recording
      const chunks: Blob[] = [];

      // Create MediaRecorder via View
      const { recorder, stream } = await this.view.createMediaRecorder(
        request.streamId,
        request.config,
        // onDataAvailable callback
        (chunk) => {
          chunks.push(chunk);
          console.log('[OffscreenPresenter] Recording chunk available', {
            recorderId: request.recorderId,
            chunkSize: chunk.size,
            totalChunks: chunks.length,
          });
        },
        // onError callback
        (error) => {
          console.error('[OffscreenPresenter] MediaRecorder error', {
            recorderId: request.recorderId,
            error,
          });

          // Notify background script of error
          browser.runtime.sendMessage({
            action: MESSAGES.RECORDING_ERROR,
            recorderId: request.recorderId,
            error,
          });
        }
      );

      // Store recording state
      this.activeRecordings.set(request.recorderId, {
        recorderId: request.recorderId,
        recorder,
        chunks,
        stream,
        tabId: request.tabId,
      });

      // Start recording via View
      this.view.startRecording(recorder);

      console.log('[OffscreenPresenter] MediaRecorder started', {
        recorderId: request.recorderId,
        state: recorder.state,
      });

      // Notify background script
      await browser.runtime.sendMessage({
        action: MESSAGES.RECORDING_STARTED,
        recorderId: request.recorderId,
        tabId: request.tabId,
      });

      return { success: true };
    } catch (error) {
      console.error('[OffscreenPresenter] Failed to start recording', {
        recorderId: request.recorderId,
        tabId: request.tabId,
        error,
      });

      // Notify background script of error
      await browser.runtime.sendMessage({
        action: MESSAGES.RECORDING_ERROR,
        recorderId: request.recorderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Handle stop recording request
   */
  public async handleStopRecording(request: StopRecordingRequest): Promise<RecordingResult> {
    console.log('[OffscreenPresenter] Stopping recording', {
      recorderId: request.recorderId,
    });

    const recordingState = this.activeRecordings.get(request.recorderId);
    if (!recordingState) {
      throw new Error(`Recording ${request.recorderId} not found`);
    }

    const { recorder, chunks, stream } = recordingState;

    return new Promise((resolve, _reject) => {
      // Define stop handler
      const handleStop = async () => {
        console.log('[OffscreenPresenter] MediaRecorder stopped', {
          recorderId: request.recorderId,
          chunksCount: chunks.length,
        });

        // Stop stream via View
        this.view.stopStream(stream);

        // Create blob via View
        const blob = this.view.createBlob(chunks);

        console.log('[OffscreenPresenter] Recording blob created', {
          recorderId: request.recorderId,
          blobSize: blob.size,
        });

        // Clean up state
        this.activeRecordings.delete(request.recorderId);

        // Convert blob to ArrayBuffer for message passing
        const arrayBuffer = await this.view.blobToArrayBuffer(blob);

        // Notify background script with blob data
        await browser.runtime.sendMessage({
          action: MESSAGES.RECORDING_STOPPED,
          recorderId: request.recorderId,
          blobData: arrayBuffer,
          blobSize: blob.size,
        });

        resolve({ success: true, blob });
      };

      // Stop recording via View
      this.view.stopRecording(recorder, handleStop);
    });
  }
}
