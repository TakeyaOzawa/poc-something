/**
 * Type definitions for Offscreen Document (Tab Recording)
 * MVP pattern interfaces
 */

// Message types
export const OFFSCREEN_MESSAGES = {
  START_RECORDING: 'offscreen:startRecording',
  STOP_RECORDING: 'offscreen:stopRecording',
  RECORDING_STARTED: 'offscreen:recordingStarted',
  RECORDING_STOPPED: 'offscreen:recordingStopped',
  RECORDING_ERROR: 'offscreen:recordingError',
} as const;

// Request/Response types
export interface StartRecordingRequest {
  action: typeof OFFSCREEN_MESSAGES.START_RECORDING;
  recorderId: string;
  tabId: number;
  streamId: string;
  config: {
    audio: boolean;
    video: boolean;
    videoBitsPerSecond?: number;
  };
}

export interface StopRecordingRequest {
  action: typeof OFFSCREEN_MESSAGES.STOP_RECORDING;
  recorderId: string;
}

export interface RecordingConfig {
  audio: boolean;
  video: boolean;
  videoBitsPerSecond?: number;
}

export interface RecordingResult {
  success: boolean;
  blob?: Blob;
  error?: string;
}

/**
 * View interface for Offscreen Document
 * Handles MediaRecorder API and MediaStream operations
 */
export interface OffscreenView {
  /**
   * Create and start a MediaRecorder for tab capture
   * @param streamId - Media stream ID from chrome.tabCapture
   * @param config - Recording configuration
   * @param onDataAvailable - Callback when recording chunk is available
   * @param onError - Callback when MediaRecorder error occurs
   * @returns Object containing recorder and stream
   */
  createMediaRecorder(
    streamId: string,
    config: RecordingConfig,
    onDataAvailable: (chunk: Blob) => void,
    onError: (error: string) => void
  ): Promise<{
    recorder: MediaRecorder;
    stream: MediaStream;
  }>;

  /**
   * Start the MediaRecorder
   * @param recorder - MediaRecorder instance
   * @param timeslice - Generate chunks every N milliseconds
   */
  startRecording(recorder: MediaRecorder, timeslice?: number): void;

  /**
   * Stop the MediaRecorder
   * @param recorder - MediaRecorder instance
   * @param onStopped - Callback when recorder has stopped
   */
  stopRecording(recorder: MediaRecorder, onStopped: () => void): void;

  /**
   * Stop all tracks in a MediaStream
   * @param stream - MediaStream to stop
   */
  stopStream(stream: MediaStream): void;

  /**
   * Create a Blob from recording chunks
   * @param chunks - Array of Blob chunks
   * @returns Combined Blob
   */
  createBlob(chunks: Blob[]): Blob;

  /**
   * Convert Blob to ArrayBuffer for message passing
   * @param blob - Blob to convert
   * @returns ArrayBuffer
   */
  blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer>;
}

/**
 * Presenter interface for Offscreen Document
 * Orchestrates recording state and message handling
 */
export interface OffscreenPresenter {
  /**
   * Initialize the presenter
   */
  init(): void;

  /**
   * Handle start recording request
   * @param request - Start recording request
   * @returns Success result
   */
  handleStartRecording(
    request: StartRecordingRequest
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Handle stop recording request
   * @param request - Stop recording request
   * @returns Result with blob data
   */
  handleStopRecording(request: StopRecordingRequest): Promise<RecordingResult>;
}

/**
 * Recording state tracked by Presenter
 */
export interface RecordingState {
  recorderId: string;
  recorder: MediaRecorder;
  chunks: Blob[];
  stream: MediaStream;
  tabId: number;
}

/**
 * Dependencies for OffscreenPresenter
 */
export interface OffscreenDependencies {
  view: OffscreenView;
}
