// src/domain/entities/SyncResult.ts

import { v4 as uuidv4 } from 'uuid';

export interface SyncResultData {
  id: string;
  syncConfigId: string;
  storageKey: string;
  direction: 'receive' | 'send';
  status: 'success' | 'failed';
  itemsReceived?: number;
  itemsSent?: number;
  itemsUpdated?: number;
  itemsDeleted?: number;
  errorMessage?: string;
  syncedAt: string; // ISO 8601
}

export class SyncResult {
  private data: SyncResultData;

  constructor(data: SyncResultData) {
    this.validate(data);
    this.data = { ...data };
  }

  private validate(data: SyncResultData): void {
    if (!data.id) throw new Error('ID is required');
    if (!data.syncConfigId) throw new Error('Sync config ID is required');
    if (!data.storageKey) throw new Error('Storage key is required');
    if (!data.direction) throw new Error('Direction is required');
    if (!data.status) throw new Error('Status is required');
    if (!data.syncedAt) throw new Error('Synced date is required');
  }

  // Getters
  getId(): string {
    return this.data.id;
  }

  getSyncConfigId(): string {
    return this.data.syncConfigId;
  }

  getStorageKey(): string {
    return this.data.storageKey;
  }

  getDirection(): 'receive' | 'send' {
    return this.data.direction;
  }

  getStatus(): 'success' | 'failed' {
    return this.data.status;
  }

  getItemsReceived(): number | undefined {
    return this.data.itemsReceived;
  }

  getItemsSent(): number | undefined {
    return this.data.itemsSent;
  }

  getItemsUpdated(): number | undefined {
    return this.data.itemsUpdated;
  }

  getItemsDeleted(): number | undefined {
    return this.data.itemsDeleted;
  }

  getErrorMessage(): string | undefined {
    return this.data.errorMessage;
  }

  getSyncedAt(): string {
    return this.data.syncedAt;
  }

  // Export
  toData(): SyncResultData {
    return { ...this.data };
  }

  // Static factory
  static create(params: {
    syncConfigId: string;
    storageKey: string;
    direction: 'receive' | 'send';
    status: 'success' | 'failed';
    itemsReceived?: number;
    itemsSent?: number;
    itemsUpdated?: number;
    itemsDeleted?: number;
    errorMessage?: string;
  }): SyncResult {
    return new SyncResult({
      id: uuidv4(),
      syncConfigId: params.syncConfigId,
      storageKey: params.storageKey,
      direction: params.direction,
      status: params.status,
      itemsReceived: params.itemsReceived,
      itemsSent: params.itemsSent,
      itemsUpdated: params.itemsUpdated,
      itemsDeleted: params.itemsDeleted,
      errorMessage: params.errorMessage,
      syncedAt: new Date().toISOString(),
    });
  }
}
