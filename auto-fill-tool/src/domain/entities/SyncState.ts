/**
 * Domain Entity: Sync State
 * Represents the current state of a sync operation
 */

export type SyncStatus = 'idle' | 'starting' | 'receiving' | 'sending' | 'completed' | 'failed';

export interface SyncStateData {
  configId: string;
  storageKey: string;
  status: SyncStatus;
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  startTime: number;
  endTime?: number;
  error?: string;
  receiveProgress?: {
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    currentStep: number;
    totalSteps: number;
    error?: string;
  };
  sendProgress?: {
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    currentStep: number;
    totalSteps: number;
    error?: string;
  };
}

/**
 * SyncState Entity
 * Tracks the real-time state of a sync operation
 */
export class SyncState {
  private data: SyncStateData;

  private constructor(data: SyncStateData) {
    this.data = { ...data };
    this.validate();
  }

  /**
   * Validate the SyncState data
   * @throws Error if data is invalid
   */
  // eslint-disable-next-line complexity -- This method validates 10 different fields (configId, storageKey, progress, currentStep, totalSteps, completedSteps, startTime, endTime, receiveProgress, sendProgress) with multiple conditions each. The validation logic is essential for data integrity and cannot be reasonably simplified without losing clarity. Each validation check represents a distinct business rule that must be enforced at construction time.
  private validate(): void {
    // Validate configId
    if (!this.data.configId || this.data.configId.trim() === '') {
      throw new Error('Config ID must not be empty');
    }

    // Validate storageKey
    if (!this.data.storageKey || this.data.storageKey.trim() === '') {
      throw new Error('Storage key must not be empty');
    }

    // Validate progress (0-100)
    if (this.data.progress < 0 || this.data.progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    // Validate currentStep
    if (typeof this.data.currentStep !== 'string') {
      throw new Error('Current step must be a string');
    }

    // Validate totalSteps
    if (this.data.totalSteps < 0 || !Number.isInteger(this.data.totalSteps)) {
      throw new Error('Total steps must be a non-negative integer');
    }

    // Validate completedSteps
    if (this.data.completedSteps < 0 || !Number.isInteger(this.data.completedSteps)) {
      throw new Error('Completed steps must be a non-negative integer');
    }

    // Validate startTime
    if (this.data.startTime <= 0) {
      throw new Error('Start time must be positive');
    }

    // Validate endTime (if provided)
    if (this.data.endTime !== undefined) {
      if (this.data.endTime <= 0) {
        throw new Error('End time must be positive');
      }
      if (this.data.endTime < this.data.startTime) {
        throw new Error('End time must be greater than or equal to start time');
      }
    }

    // Validate receiveProgress (if provided)
    if (this.data.receiveProgress !== undefined) {
      if (this.data.receiveProgress.currentStep < 0) {
        throw new Error('Receive progress current step must be non-negative');
      }
      if (this.data.receiveProgress.totalSteps < 0) {
        throw new Error('Receive progress total steps must be non-negative');
      }
    }

    // Validate sendProgress (if provided)
    if (this.data.sendProgress !== undefined) {
      if (this.data.sendProgress.currentStep < 0) {
        throw new Error('Send progress current step must be non-negative');
      }
      if (this.data.sendProgress.totalSteps < 0) {
        throw new Error('Send progress total steps must be non-negative');
      }
    }
  }

  // Getters
  getConfigId(): string {
    return this.data.configId;
  }

  getStorageKey(): string {
    return this.data.storageKey;
  }

  getStatus(): SyncStatus {
    return this.data.status;
  }

  getProgress(): number {
    return this.data.progress;
  }

  getCurrentStep(): string {
    return this.data.currentStep;
  }

  getTotalSteps(): number {
    return this.data.totalSteps;
  }

  getCompletedSteps(): number {
    return this.data.completedSteps;
  }

  getStartTime(): number {
    return this.data.startTime;
  }

  getEndTime(): number | undefined {
    return this.data.endTime;
  }

  getError(): string | undefined {
    return this.data.error;
  }

  getReceiveProgress(): SyncStateData['receiveProgress'] {
    return this.data.receiveProgress;
  }

  getSendProgress(): SyncStateData['sendProgress'] {
    return this.data.sendProgress;
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsedTime(): number {
    const endTime = this.data.endTime || Date.now();
    return endTime - this.data.startTime;
  }

  /**
   * Check if sync is in progress
   */
  isInProgress(): boolean {
    return (
      this.data.status === 'starting' ||
      this.data.status === 'receiving' ||
      this.data.status === 'sending'
    );
  }

  /**
   * Check if sync is completed (success or failure)
   */
  isCompleted(): boolean {
    return this.data.status === 'completed' || this.data.status === 'failed';
  }

  /**
   * Update status
   */
  setStatus(status: SyncStatus): void {
    this.data.status = status;
    this.updateProgress();
  }

  /**
   * Update current step
   */
  setCurrentStep(step: string): void {
    this.data.currentStep = step;
  }

  /**
   * Increment completed steps
   */
  incrementCompletedSteps(): void {
    this.data.completedSteps++;
    this.updateProgress();
  }

  /**
   * Update receive progress
   */
  setReceiveProgress(progress: SyncStateData['receiveProgress']): void {
    if (progress !== undefined) {
      this.data.receiveProgress = progress;
      this.updateProgress();
    }
  }

  /**
   * Update send progress
   */
  setSendProgress(progress: SyncStateData['sendProgress']): void {
    if (progress !== undefined) {
      this.data.sendProgress = progress;
      this.updateProgress();
    }
  }

  /**
   * Mark as completed
   */
  complete(): void {
    this.data.status = 'completed';
    this.data.endTime = Date.now();
    this.data.progress = 100;
  }

  /**
   * Mark as failed
   */
  fail(error: string): void {
    this.data.status = 'failed';
    this.data.error = error;
    this.data.endTime = Date.now();
  }

  /**
   * Calculate and update overall progress
   */
  private updateProgress(): void {
    if (this.data.status === 'idle') {
      this.data.progress = 0;
      return;
    }

    if (this.data.status === 'completed') {
      this.data.progress = 100;
      return;
    }

    if (this.data.status === 'failed') {
      return; // Keep current progress on failure
    }

    // Calculate progress based on completed steps
    if (this.data.totalSteps > 0) {
      this.data.progress = Math.round((this.data.completedSteps / this.data.totalSteps) * 100);
    }

    // Cap at 99% until fully completed
    if (this.data.progress >= 100 && !this.isCompleted()) {
      this.data.progress = 99;
    }
  }

  // Export
  toData(): SyncStateData {
    return { ...this.data };
  }

  // Clone
  clone(): SyncState {
    return new SyncState({ ...this.data });
  }

  // Static factory method
  static create(params: { configId: string; storageKey: string; totalSteps: number }): SyncState {
    return new SyncState({
      configId: params.configId,
      storageKey: params.storageKey,
      status: 'starting',
      progress: 0,
      currentStep: 'Initializing',
      totalSteps: params.totalSteps,
      completedSteps: 0,
      startTime: Date.now(),
    });
  }

  static fromData(data: SyncStateData): SyncState {
    return new SyncState(data);
  }
}
