/**
 * Domain Entity: Sync History
 * Represents a record of sync execution
 */

export interface SyncHistoryData {
  id: string;
  configId: string;
  storageKey: string;
  syncDirection: 'bidirectional' | 'receive_only' | 'send_only';
  startTime: number;
  endTime: number;
  status: 'success' | 'failed' | 'partial';
  receiveResult?: {
    success: boolean;
    receivedCount?: number;
    error?: string;
  };
  sendResult?: {
    success: boolean;
    sentCount?: number;
    error?: string;
  };
  error?: string;
  retryCount: number;
  createdAt: number;
}

export class SyncHistory {
  private constructor(private data: SyncHistoryData) {
    this.validate();
  }

  /**
   * Validate the SyncHistory data
   * @throws Error if data is invalid
   */
  // eslint-disable-next-line complexity -- This method validates 7 different fields (configId, storageKey, startTime, endTime, retryCount, receivedCount, sentCount) with multiple conditions each. The validation logic is essential for data integrity and cannot be reasonably simplified without losing clarity. Each validation check represents a distinct business rule that must be enforced at construction time.
  private validate(): void {
    // Validate configId
    if (!this.data.configId || this.data.configId.trim() === '') {
      throw new Error('Config ID must not be empty');
    }

    // Validate storageKey
    if (!this.data.storageKey || this.data.storageKey.trim() === '') {
      throw new Error('Storage key must not be empty');
    }

    // Validate startTime
    if (this.data.startTime <= 0) {
      throw new Error('Start time must be positive');
    }

    // Validate endTime
    if (this.data.endTime < 0) {
      throw new Error('End time must be non-negative');
    }

    if (this.data.endTime > 0 && this.data.endTime < this.data.startTime) {
      throw new Error('End time must be greater than or equal to start time');
    }

    // Validate retryCount
    if (this.data.retryCount < 0) {
      throw new Error('Retry count must be non-negative');
    }

    // Validate receivedCount
    if (this.data.receiveResult?.receivedCount !== undefined) {
      if (this.data.receiveResult.receivedCount < 0) {
        throw new Error('Received count must be non-negative');
      }
    }

    // Validate sentCount
    if (this.data.sendResult?.sentCount !== undefined) {
      if (this.data.sendResult.sentCount < 0) {
        throw new Error('Sent count must be non-negative');
      }
    }
  }

  /**
   * Create a new sync history record
   */
  static create(params: {
    configId: string;
    storageKey: string;
    syncDirection: 'bidirectional' | 'receive_only' | 'send_only';
    startTime: number;
    retryCount?: number;
  }): SyncHistory {
    const now = Date.now();
    return new SyncHistory({
      id: `sync-${now}-${Math.random().toString(36).substring(2, 9)}`,
      configId: params.configId,
      storageKey: params.storageKey,
      syncDirection: params.syncDirection,
      startTime: params.startTime,
      endTime: 0,
      status: 'success',
      retryCount: params.retryCount || 0,
      createdAt: now,
    });
  }

  /**
   * Restore from data
   */
  static fromData(data: SyncHistoryData): SyncHistory {
    return new SyncHistory(data);
  }

  /**
   * Complete the sync with results
   */
  complete(params: {
    status: 'success' | 'failed' | 'partial';
    receiveResult?: {
      success: boolean;
      receivedCount?: number;
      error?: string;
    };
    sendResult?: {
      success: boolean;
      sentCount?: number;
      error?: string;
    };
    error?: string;
  }): void {
    this.data.endTime = Date.now();
    this.data.status = params.status;
    this.data.receiveResult = params.receiveResult;
    this.data.sendResult = params.sendResult;
    this.data.error = params.error;
  }

  /**
   * Get duration in milliseconds
   */
  getDuration(): number {
    if (this.data.endTime === 0) {
      return Date.now() - this.data.startTime;
    }
    return this.data.endTime - this.data.startTime;
  }

  /**
   * Check if sync was successful
   */
  isSuccessful(): boolean {
    return this.data.status === 'success';
  }

  /**
   * Get total items processed
   */
  getTotalItems(): number {
    let total = 0;
    if (this.data.receiveResult?.receivedCount) {
      total += this.data.receiveResult.receivedCount;
    }
    if (this.data.sendResult?.sentCount) {
      total += this.data.sendResult.sentCount;
    }
    return total;
  }

  // Getters
  getId(): string {
    return this.data.id;
  }

  getConfigId(): string {
    return this.data.configId;
  }

  getStorageKey(): string {
    return this.data.storageKey;
  }

  getSyncDirection(): 'bidirectional' | 'receive_only' | 'send_only' {
    return this.data.syncDirection;
  }

  getStartTime(): number {
    return this.data.startTime;
  }

  getEndTime(): number {
    return this.data.endTime;
  }

  getStatus(): 'success' | 'failed' | 'partial' {
    return this.data.status;
  }

  getReceiveResult() {
    return this.data.receiveResult;
  }

  getSendResult() {
    return this.data.sendResult;
  }

  getError(): string | undefined {
    return this.data.error;
  }

  getRetryCount(): number {
    return this.data.retryCount;
  }

  setRetryCount(count: number): void {
    if (count < 0) {
      throw new Error('Retry count must be non-negative');
    }
    this.data.retryCount = count;
  }

  getCreatedAt(): number {
    return this.data.createdAt;
  }

  /**
   * Convert to plain data object
   */
  toData(): SyncHistoryData {
    return { ...this.data };
  }
}
