/**
 * Domain Entity: TabRecording
 * Manages tab recording data and lifecycle
 */

export enum RecordingStatus {
  IDLE = 'idle',
  RECORDING = 'recording',
  STOPPED = 'stopped',
  SAVED = 'saved',
  ERROR = 'error',
}

export interface TabRecordingData {
  id: string; // Recording ID (UUID)
  automationResultId: string; // Related AutomationResult ID
  tabId: number; // Recorded tab ID
  recorderId: string | null; // MediaRecorder ID (for stopping)
  status: RecordingStatus; // Recording status
  startedAt: string; // Recording start time (ISO 8601)
  endedAt: string | null; // Recording end time (ISO 8601 or null)
  blobData: Blob | null; // Recording data (Blob format)
  mimeType: string; // MIME type (video/webm)
  sizeBytes: number; // File size (bytes)
  durationMs: number | null; // Recording duration (milliseconds)
  bitrate: number; // Recording bitrate (bps)
  errorMessage?: string; // Error message (if status is ERROR)
}

export class TabRecording {
  private data: TabRecordingData;

  constructor(data: TabRecordingData) {
    this.data = { ...data };
    this.validate();
  }

  /**
   * Validate the TabRecording data
   * @throws Error if data is invalid
   */
  // eslint-disable-next-line complexity -- This method validates 11 different fields (id, automationResultId, tabId, recorderId, startedAt, endedAt, mimeType, sizeBytes, durationMs, bitrate, errorMessage) with multiple conditions each. The validation logic is essential for data integrity and cannot be reasonably simplified without losing clarity. Each validation check represents a distinct business rule that must be enforced at construction time.
  private validate(): void {
    // Validate id
    if (!this.data.id || this.data.id.trim() === '') {
      throw new Error('Recording ID must not be empty');
    }

    // Validate automationResultId
    if (!this.data.automationResultId || this.data.automationResultId.trim() === '') {
      throw new Error('Automation result ID must not be empty');
    }

    // Validate tabId
    if (this.data.tabId <= 0 || !Number.isInteger(this.data.tabId)) {
      throw new Error('Tab ID must be a positive integer');
    }

    // Validate recorderId (if not null or undefined)
    if (this.data.recorderId != null && this.data.recorderId.trim() === '') {
      throw new Error('Recorder ID must not be empty when provided');
    }

    // Validate startedAt
    if (!this.data.startedAt || this.data.startedAt.trim() === '') {
      throw new Error('Started at must not be empty');
    }

    // Validate endedAt (if not null or undefined)
    if (this.data.endedAt != null && this.data.endedAt.trim() === '') {
      throw new Error('Ended at must not be empty when provided');
    }

    // Validate mimeType
    if (!this.data.mimeType || this.data.mimeType.trim() === '') {
      throw new Error('MIME type must not be empty');
    }

    // Validate sizeBytes
    if (this.data.sizeBytes < 0) {
      throw new Error('Size bytes must be non-negative');
    }

    // Validate durationMs (if not null)
    if (this.data.durationMs !== null && this.data.durationMs < 0) {
      throw new Error('Duration must be non-negative');
    }

    // Validate bitrate
    if (this.data.bitrate <= 0) {
      throw new Error('Bitrate must be positive');
    }

    // Validate errorMessage for ERROR status
    if (this.data.status === RecordingStatus.ERROR) {
      if (!this.data.errorMessage || this.data.errorMessage.trim() === '') {
        throw new Error('Error message is required when status is ERROR');
      }
    }
  }

  // ===== Getters =====

  getId(): string {
    return this.data.id;
  }

  getAutomationResultId(): string {
    return this.data.automationResultId;
  }

  getTabId(): number {
    return this.data.tabId;
  }

  getRecorderId(): string | null {
    return this.data.recorderId;
  }

  getStatus(): RecordingStatus {
    return this.data.status;
  }

  getStartedAt(): string {
    return this.data.startedAt;
  }

  getEndedAt(): string | null {
    return this.data.endedAt;
  }

  getBlobData(): Blob | null {
    return this.data.blobData;
  }

  getMimeType(): string {
    return this.data.mimeType;
  }

  getSizeBytes(): number {
    return this.data.sizeBytes;
  }

  getDurationMs(): number | null {
    return this.data.durationMs;
  }

  getBitrate(): number {
    return this.data.bitrate;
  }

  getErrorMessage(): string | undefined {
    return this.data.errorMessage;
  }

  // ===== State Transitions =====

  /**
   * Start recording
   */
  start(recorderId: string): TabRecording {
    if (this.data.status !== RecordingStatus.IDLE) {
      throw new Error(
        `Cannot start recording from status: ${this.data.status}. Recording ID: ${this.data.id}, Tab ID: ${this.data.tabId}, Automation Result ID: ${this.data.automationResultId}`
      );
    }

    return new TabRecording({
      ...this.data,
      recorderId,
      status: RecordingStatus.RECORDING,
      startedAt: new Date().toISOString(),
    });
  }

  /**
   * Stop recording
   */
  stop(): TabRecording {
    if (this.data.status !== RecordingStatus.RECORDING) {
      throw new Error(
        `Cannot stop recording from status: ${this.data.status}. Recording ID: ${this.data.id}, Tab ID: ${this.data.tabId}, Automation Result ID: ${this.data.automationResultId}, Recorder ID: ${this.data.recorderId}`
      );
    }

    return new TabRecording({
      ...this.data,
      status: RecordingStatus.STOPPED,
      endedAt: new Date().toISOString(),
    });
  }

  /**
   * Save recording data
   */
  save(blobData: Blob): TabRecording {
    if (this.data.status !== RecordingStatus.STOPPED) {
      throw new Error(
        `Cannot save recording from status: ${this.data.status}. Recording ID: ${this.data.id}, Tab ID: ${this.data.tabId}, Automation Result ID: ${this.data.automationResultId}`
      );
    }

    const now = new Date().toISOString();
    const durationMs = this.data.startedAt
      ? new Date(now).getTime() - new Date(this.data.startedAt).getTime()
      : null;

    return new TabRecording({
      ...this.data,
      status: RecordingStatus.SAVED,
      blobData,
      sizeBytes: blobData.size,
      durationMs,
      endedAt: this.data.endedAt || now,
    });
  }

  /**
   * Mark as error
   */
  markError(errorMessage: string): TabRecording {
    return new TabRecording({
      ...this.data,
      status: RecordingStatus.ERROR,
      errorMessage,
      endedAt: this.data.endedAt || new Date().toISOString(),
    });
  }

  // ===== Queries =====

  /**
   * Check if recording is in progress
   */
  isRecording(): boolean {
    return this.data.status === RecordingStatus.RECORDING;
  }

  /**
   * Check if recording is stopped
   */
  isStopped(): boolean {
    return this.data.status === RecordingStatus.STOPPED;
  }

  /**
   * Check if recording is saved
   */
  isSaved(): boolean {
    return this.data.status === RecordingStatus.SAVED;
  }

  /**
   * Check if recording has error
   */
  hasError(): boolean {
    return this.data.status === RecordingStatus.ERROR;
  }

  /**
   * Get duration in seconds
   */
  getDurationSeconds(): number | null {
    if (this.data.durationMs === null) {
      return null;
    }
    return Math.round(this.data.durationMs / 1000);
  }

  /**
   * Get size in MB
   */
  getSizeMB(): number {
    return this.data.sizeBytes / (1024 * 1024);
  }

  // ===== Data Access =====

  /**
   * Get data for persistence
   */
  toData(): TabRecordingData {
    return { ...this.data };
  }

  // ===== Static Factory =====

  /**
   * Create new TabRecording entity
   */
  static create(params: {
    automationResultId: string;
    tabId: number;
    bitrate: number;
  }): TabRecording {
    return new TabRecording({
      id: this.generateId(),
      automationResultId: params.automationResultId,
      tabId: params.tabId,
      recorderId: null,
      status: RecordingStatus.IDLE,
      startedAt: new Date().toISOString(),
      endedAt: null,
      blobData: null,
      mimeType: 'video/webm',
      sizeBytes: 0,
      durationMs: null,
      bitrate: params.bitrate,
    });
  }

  /**
   * Generate unique ID (UUID v4)
   */
  private static generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
