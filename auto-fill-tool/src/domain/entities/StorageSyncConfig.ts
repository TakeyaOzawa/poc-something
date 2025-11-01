/**
 * StorageSyncConfig Entity
 * ストレージ同期設定を管理するドメインエンティティ
 */

export type SyncMethod = 'notion' | 'spread-sheet';
export type SyncTiming = 'manual' | 'periodic';
export type SyncDirection = 'bidirectional' | 'receive_only' | 'send_only';
export type ConflictResolution = 'latest_timestamp' | 'local_priority' | 'remote_priority' | 'user_confirm';

export interface SyncInput {
  key: string;
  value: string;
}

export interface SyncOutput {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue: any;
}

export interface StorageSyncConfigData {
  id: string;
  storageKey: string;
  syncMethod: SyncMethod;
  syncTiming: SyncTiming;
  syncDirection: SyncDirection;
  conflictResolution: ConflictResolution;
  inputs: SyncInput[];
  outputs: SyncOutput[];
  syncIntervalSeconds: number | undefined;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export class StorageSyncConfig {
  private data: StorageSyncConfigData;

  constructor(data: StorageSyncConfigData) {
    this.data = { ...data };
  }

  static create(
    storageKey: string,
    syncMethod: SyncMethod,
    syncTiming: SyncTiming,
    syncDirection: SyncDirection,
    conflictResolution: ConflictResolution
  ): StorageSyncConfig {
    const now = new Date().toISOString();
    return new StorageSyncConfig({
      id: 'ssc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11),
      storageKey,
      syncMethod,
      syncTiming,
      syncDirection,
      conflictResolution,
      inputs: [],
      outputs: [],
      syncIntervalSeconds: undefined,
      enabled: true,
      createdAt: now,
      updatedAt: now
    });
  }

  static fromData(data: StorageSyncConfigData): StorageSyncConfig {
    return new StorageSyncConfig(data);
  }

  getId(): string {
    return this.data.id;
  }

  getStorageKey(): string {
    return this.data.storageKey;
  }

  getSyncMethod(): SyncMethod {
    return this.data.syncMethod;
  }

  getSyncTiming(): SyncTiming {
    return this.data.syncTiming;
  }

  getSyncDirection(): SyncDirection {
    return this.data.syncDirection;
  }

  getConflictResolution(): ConflictResolution {
    return this.data.conflictResolution;
  }

  getInputs(): SyncInput[] {
    return [...this.data.inputs];
  }

  getOutputs(): SyncOutput[] {
    return [...this.data.outputs];
  }

  getSyncIntervalSeconds(): number | undefined {
    return this.data.syncIntervalSeconds;
  }

  isEnabled(): boolean {
    return this.data.enabled;
  }

  getCreatedAt(): string {
    return this.data.createdAt;
  }

  getUpdatedAt(): string {
    return this.data.updatedAt;
  }

  isPeriodic(): boolean {
    return this.data.syncTiming === 'periodic';
  }

  isBidirectional(): boolean {
    return this.data.syncDirection === 'bidirectional';
  }

  canReceive(): boolean {
    return this.data.syncDirection === 'bidirectional' || this.data.syncDirection === 'receive_only';
  }

  canSend(): boolean {
    return this.data.syncDirection === 'bidirectional' || this.data.syncDirection === 'send_only';
  }

  updateSyncMethod(method: SyncMethod): void {
    this.data.syncMethod = method;
    this.updateTimestamp();
  }

  updateSyncTiming(timing: SyncTiming, intervalSeconds?: number): void {
    this.data.syncTiming = timing;
    if (timing === 'periodic') {
      if (!intervalSeconds || intervalSeconds < 60) {
        throw new Error('定期同期の間隔は60秒以上である必要があります');
      }
      this.data.syncIntervalSeconds = intervalSeconds;
    } else {
      this.data.syncIntervalSeconds = undefined;
    }
    this.updateTimestamp();
  }

  updateSyncDirection(direction: SyncDirection): void {
    this.data.syncDirection = direction;
    this.updateTimestamp();
  }

  updateConflictResolution(resolution: ConflictResolution): void {
    this.data.conflictResolution = resolution;
    this.updateTimestamp();
  }

  setInputs(inputs: SyncInput[]): void {
    this.data.inputs = [...inputs];
    this.updateTimestamp();
  }

  addInput(key: string, value: string): void {
    const existing = this.data.inputs.find(input => input.key === key);
    if (existing) {
      existing.value = value;
    } else {
      this.data.inputs.push({ key, value });
    }
    this.updateTimestamp();
  }

  removeInput(key: string): boolean {
    const index = this.data.inputs.findIndex(input => input.key === key);
    if (index === -1) return false;
    
    this.data.inputs.splice(index, 1);
    this.updateTimestamp();
    return true;
  }

  setOutputs(outputs: SyncOutput[]): void {
    this.data.outputs = [...outputs];
    this.updateTimestamp();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addOutput(key: string, defaultValue: any): void {
    const existing = this.data.outputs.find(output => output.key === key);
    if (existing) {
      existing.defaultValue = defaultValue;
    } else {
      this.data.outputs.push({ key, defaultValue });
    }
    this.updateTimestamp();
  }

  removeOutput(key: string): boolean {
    const index = this.data.outputs.findIndex(output => output.key === key);
    if (index === -1) return false;
    
    this.data.outputs.splice(index, 1);
    this.updateTimestamp();
    return true;
  }

  enable(): void {
    this.data.enabled = true;
    this.updateTimestamp();
  }

  disable(): void {
    this.data.enabled = false;
    this.updateTimestamp();
  }

  toData(): StorageSyncConfigData {
    return { ...this.data };
  }

  private updateTimestamp(): void {
    this.data.updatedAt = new Date().toISOString();
  }
}
