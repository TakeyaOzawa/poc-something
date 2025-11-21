/**
 * Content Script Media Recorder
 * Handles tab recording using getDisplayMedia() in content script context
 * This approach requires user permission via display selection dialog
 *
 * @coverage 0% - DOM-heavy UI component requiring E2E testing
 */

import browser from 'webextension-polyfill';

interface RecordingState {
  recorderId: string;
  recorder: MediaRecorder;
  chunks: Blob[];
  stream: MediaStream;
}

// Message types for recording communication
const RECORDING_MESSAGES = {
  START_RECORDING: 'contentScript:startRecording',
  STOP_RECORDING: 'contentScript:stopRecording',
  RECORDING_STARTED: 'contentScript:recordingStarted',
  RECORDING_STOPPED: 'contentScript:recordingStopped',
  RECORDING_ERROR: 'contentScript:recordingError',
} as const;

interface StartRecordingRequest {
  action: typeof RECORDING_MESSAGES.START_RECORDING;
  recorderId: string;
  config: {
    audio: boolean;
    video: boolean;
    videoBitsPerSecond?: number;
  };
}

interface StopRecordingRequest {
  action: typeof RECORDING_MESSAGES.STOP_RECORDING;
  recorderId: string;
}

export class ContentScriptMediaRecorder {
  private activeRecordings = new Map<string, RecordingState>();

  constructor() {
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    browser.runtime.onMessage.addListener(((
      message: unknown,
      _sender: unknown,
      sendResponse: unknown
    ) => {
      if (message && typeof message === 'object' && 'action' in message) {
        const action = (message as unknown).action;

        if (action === RECORDING_MESSAGES.START_RECORDING) {
          this.handleStartRecording(message as StartRecordingRequest)
            .then(sendResponse)
            .catch((error) => {
              sendResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            });
          return true; // Async response
        }

        if (action === RECORDING_MESSAGES.STOP_RECORDING) {
          this.handleStopRecording(message as StopRecordingRequest)
            .then(sendResponse)
            .catch((error) => {
              sendResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            });
          return true; // Async response
        }
      }
      // Don't return anything for non-recording messages (allows other listeners)
      return false;
    }) as unknown);
  }

  // eslint-disable-next-line max-lines-per-function -- Recording initialization requires sequential operations: permission check, getDisplayMedia() call, MediaRecorder setup with multiple event handlers (ondataavailable, onerror, track ended listener), state management, and extensive logging for debugging async media capture. Splitting would break the cohesive recording lifecycle setup.
  private async handleStartRecording(
    request: StartRecordingRequest
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[ContentScript] Starting recording with getDisplayMedia', {
      recorderId: request.recorderId,
      config: request.config,
    });

    try {
      // Check if already recording
      if (this.activeRecordings.has(request.recorderId)) {
        throw new Error(`Recording ${request.recorderId} already exists`);
      }

      // Use getDisplayMedia to capture screen/tab with user permission
      // User will see a dialog to select what to share
      const constraints: DisplayMediaStreamOptions = {
        video: request.config.video
          ? {
              displaySurface: 'browser', // Prefer browser tab
            }
          : false,
        audio: request.config.audio,
      } as unknown;

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);

      console.log('[ContentScript] Display stream captured successfully', {
        recorderId: request.recorderId,
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
      });

      // Create MediaRecorder
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp9',
      };

      if (request.config.videoBitsPerSecond) {
        options.videoBitsPerSecond = request.config.videoBitsPerSecond;
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
          console.log('[ContentScript] Recording chunk available', {
            recorderId: request.recorderId,
            chunkSize: event.data.size,
            totalChunks: chunks.length,
          });
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('[ContentScript] MediaRecorder error', {
          recorderId: request.recorderId,
          event,
        });

        // Notify background script of error
        browser.runtime.sendMessage({
          action: RECORDING_MESSAGES.RECORDING_ERROR,
          recorderId: request.recorderId,
          error: 'MediaRecorder error occurred',
        });
      };

      // Handle stream end (user stops sharing)
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        console.log('[ContentScript] User stopped sharing, stopping recording', {
          recorderId: request.recorderId,
        });
        this.handleStopRecording({
          action: RECORDING_MESSAGES.STOP_RECORDING,
          recorderId: request.recorderId,
        });
      });

      // Store recording state
      this.activeRecordings.set(request.recorderId, {
        recorderId: request.recorderId,
        recorder: mediaRecorder,
        chunks,
        stream,
      });

      // Start recording (generate chunks every 1 second)
      mediaRecorder.start(1000);

      console.log('[ContentScript] MediaRecorder started', {
        recorderId: request.recorderId,
        state: mediaRecorder.state,
        mimeType: mediaRecorder.mimeType,
        videoBitsPerSecond: mediaRecorder.videoBitsPerSecond,
      });

      // Notify background script
      await browser.runtime.sendMessage({
        action: RECORDING_MESSAGES.RECORDING_STARTED,
        recorderId: request.recorderId,
      });

      return { success: true };
    } catch (error) {
      console.error('[ContentScript] Failed to start recording', {
        recorderId: request.recorderId,
        error,
      });

      // Notify background script of error
      await browser.runtime.sendMessage({
        action: RECORDING_MESSAGES.RECORDING_ERROR,
        recorderId: request.recorderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  private async handleStopRecording(
    request: StopRecordingRequest
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[ContentScript] Stopping recording', {
      recorderId: request.recorderId,
    });

    const recordingState = this.activeRecordings.get(request.recorderId);
    if (!recordingState) {
      throw new Error(`Recording ${request.recorderId} not found`);
    }

    const { recorder, chunks, stream } = recordingState;

    return new Promise((resolve, _reject) => {
      recorder.onstop = async () => {
        console.log('[ContentScript] MediaRecorder stopped', {
          recorderId: request.recorderId,
          chunksCount: chunks.length,
        });

        // Stop all tracks in the stream
        stream.getTracks().forEach((track) => track.stop());

        // Combine chunks into final blob
        const blob = new Blob(chunks, { type: 'video/webm' });

        console.log('[ContentScript] Recording blob created', {
          recorderId: request.recorderId,
          blobSize: blob.size,
          chunksCount: chunks.length,
        });

        // Clean up
        this.activeRecordings.delete(request.recorderId);

        // Send blob data to background script
        // Note: We can't send Blob directly via sendMessage, so we convert to ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer();
        await browser.runtime.sendMessage({
          action: RECORDING_MESSAGES.RECORDING_STOPPED,
          recorderId: request.recorderId,
          blobData: arrayBuffer,
          blobSize: blob.size,
        });

        resolve({ success: true });
      };

      if (recorder.state === 'recording') {
        recorder.stop();
      } else {
        // Already stopped - just return the blob
        const blob = new Blob(chunks, { type: 'video/webm' });
        this.activeRecordings.delete(request.recorderId);

        console.log('[ContentScript] Recording already stopped', {
          recorderId: request.recorderId,
          blobSize: blob.size,
        });

        resolve({ success: true });
      }
    });
  }
}
