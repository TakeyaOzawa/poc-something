/**
 * Domain Layer: Tab Capture Adapter Interface
 * Defines contract for capturing and recording browser tabs
 */

export interface TabCaptureConfig {
  audio: boolean;
  video: boolean;
  videoBitsPerSecond?: number; // Recording bitrate
  videoConstraints?: {
    mandatory?: {
      minWidth?: number;
      minHeight?: number;
      maxWidth?: number;
      maxHeight?: number;
    };
  };
}

export interface TabCaptureAdapter {
  /**
   * Capture a tab's media stream
   * @param tabId Tab ID to capture
   * @param config Capture configuration
   * @returns Media stream from the tab
   */
  captureTab(tabId: number, config: TabCaptureConfig): Promise<MediaStream>;

  /**
   * Start recording a media stream
   * @param stream Media stream to record
   * @param config Recording configuration
   * @param onDataAvailable Callback for when data chunks are available
   * @returns Recorder ID for managing the recording
   */
  startRecording(
    stream: MediaStream | null,
    config: TabCaptureConfig,
    onDataAvailable: (chunk: Blob) => void
  ): Promise<string>;

  /**
   * Stop recording and get final blob
   * @param recorderId ID of the recorder to stop
   * @returns Final recorded blob
   */
  stopRecording(recorderId: string): Promise<Blob>;

  /**
   * Check if a recorder is currently recording
   * @param recorderId ID of the recorder to check
   */
  isRecording(recorderId: string): boolean;
}
