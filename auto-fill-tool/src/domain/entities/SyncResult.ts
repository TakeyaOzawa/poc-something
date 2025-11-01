/**
 * SyncResult Entity
 * 同期結果を管理するドメインエンティティ
 */

import { SyncDirection } from './StorageSyncConfig';

export interface SyncResultData {
  id: string;
  configId: string;
  syncDirection: SyncDirection;
  success: boolean;
  executedAt: string;
  errorMessage: string | undefined;
  receivedCount: number | undefined;
  sentCount: number | undefined;
  duration: number | undefined;
}

export class SyncResult {
  private data: SyncResultData;

  constructor(data: SyncResultData) {
    this.data = { ...data };
  }

  static create(configId: string, syncDirection: SyncDirection): SyncResult {
    return new SyncResult({
      id: 'sr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11),
      configId,
      syncDirection,
      success: false,
      executedAt: new Date().toISOString(),
      errorMessage: undefined,
      receivedCount: undefined,
      sentCount: undefined,
      duration: undefined,
    });
  }

  static fromData(data: SyncResultData): SyncResult {
    return new SyncResult(data);
  }

  getId(): string {
    return this.data.id;
  }

  getConfigId(): string {
    return this.data.configId;
  }

  getSyncDirection(): SyncDirection {
    return this.data.syncDirection;
  }

  isSuccess(): boolean {
    return this.data.success;
  }

  getExecutedAt(): string {
    return this.data.executedAt;
  }

  getErrorMessage(): string | undefined {
    return this.data.errorMessage;
  }

  getReceivedCount(): number | undefined {
    return this.data.receivedCount;
  }

  getSentCount(): number | undefined {
    return this.data.sentCount;
  }

  getDuration(): number | undefined {
    return this.data.duration;
  }

  markSuccess(receivedCount?: number, sentCount?: number): void {
    this.data.success = true;
    this.data.errorMessage = undefined;
    if (receivedCount !== undefined) {
      this.data.receivedCount = receivedCount;
    }
    if (sentCount !== undefined) {
      this.data.sentCount = sentCount;
    }
    this.calculateDuration();
  }

  markFailure(errorMessage: string): void {
    this.data.success = false;
    this.data.errorMessage = errorMessage;
    this.calculateDuration();
  }

  private calculateDuration(): void {
    this.data.duration = Date.now() - new Date(this.data.executedAt).getTime();
  }

  toData(): SyncResultData {
    return { ...this.data };
  }
}
