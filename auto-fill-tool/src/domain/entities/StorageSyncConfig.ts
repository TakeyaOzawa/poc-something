// src/domain/entities/StorageSyncConfig.ts

import { v4 as uuidv4 } from 'uuid';
import { RetryPolicy, RetryPolicyData } from './RetryPolicy';
import { DataTransformerData } from './DataTransformer';
import { BatchConfigData } from './BatchConfig';

// 同期方法
export type SyncMethod = 'notion' | 'spread-sheet';

// 同期タイミング
export type SyncTiming = 'manual' | 'periodic';

// 同期種別
export type SyncDirection = 'bidirectional' | 'receive_only' | 'send_only';

// Input設定
export interface SyncInput {
  key: string;
  value: unknown;
}

// Output設定
export interface SyncOutput {
  key: string;
  defaultValue: unknown;
}

// 同期設定データ
export interface StorageSyncConfigData {
  id: string; // UUID v4
  storageKey: string; // localStorage のキー (例: "automationVariables")
  enabled: boolean; // 有効/無効

  // 1. 同期方法
  syncMethod: SyncMethod;

  // 2. 同期タイミング
  syncTiming: SyncTiming;
  syncIntervalSeconds?: number; // 定期同期の場合の間隔（秒）

  // 3. 同期種別
  syncDirection: SyncDirection;

  // 4. Input/Output設定
  inputs: SyncInput[];
  outputs: SyncOutput[];

  // 競合解決ポリシー
  conflictResolution: 'latest_timestamp' | 'local_priority' | 'remote_priority' | 'user_confirm';

  // リトライポリシー
  retryPolicy?: RetryPolicyData;

  // データ変換設定
  transformerConfig?: DataTransformerData;

  // バッチ処理設定
  batchConfig?: BatchConfigData;

  // 同期状態
  lastSyncDate?: string; // ISO 8601
  lastSyncStatus?: 'success' | 'failed';
  lastSyncError?: string;

  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export class StorageSyncConfig {
  private data: StorageSyncConfigData;

  constructor(data: StorageSyncConfigData) {
    this.validate(data);
    this.data = { ...data };
  }

  private validate(data: StorageSyncConfigData): void {
    this.validateBasicFields(data);
    this.validateSyncTiming(data);
    this.validateInputsOutputs(data);
  }

  private validateBasicFields(data: StorageSyncConfigData): void {
    if (!data.id) throw new Error('ID is required');
    if (!data.storageKey) throw new Error('Storage key is required');
    if (!data.syncMethod) throw new Error('Sync method is required');
    if (!data.syncTiming) throw new Error('Sync timing is required');
    if (!data.syncDirection) throw new Error('Sync direction is required');
  }

  private validateSyncTiming(data: StorageSyncConfigData): void {
    // 定期同期の場合、間隔が必須
    if (data.syncTiming === 'periodic') {
      if (!data.syncIntervalSeconds || data.syncIntervalSeconds < 1) {
        throw new Error('Sync interval must be at least 1 second for periodic sync');
      }
    }
  }

  // eslint-disable-next-line complexity -- Validates inputs and outputs arrays with multiple required checks (existence, type, array validation, and structure validation for each item). Splitting would reduce code cohesion as all validations are closely related to inputs/outputs validation.
  private validateInputsOutputs(data: StorageSyncConfigData): void {
    if (!data.inputs) {
      throw new Error('Inputs are required');
    }
    if (!Array.isArray(data.inputs)) {
      throw new Error('Inputs must be an array');
    }

    if (!data.outputs) {
      throw new Error('Outputs are required');
    }
    if (!Array.isArray(data.outputs)) {
      throw new Error('Outputs must be an array');
    }

    // Validate input structure
    for (const input of data.inputs) {
      if (!input.key || typeof input.key !== 'string') {
        throw new Error('Each input must have a valid key');
      }
    }

    // Validate output structure
    for (const output of data.outputs) {
      if (!output.key || typeof output.key !== 'string') {
        throw new Error('Each output must have a valid key');
      }
    }
  }

  // Getters
  getId(): string {
    return this.data.id;
  }

  getStorageKey(): string {
    return this.data.storageKey;
  }

  isEnabled(): boolean {
    return this.data.enabled;
  }

  getEnabled(): boolean {
    return this.data.enabled;
  }

  getSyncMethod(): SyncMethod {
    return this.data.syncMethod;
  }

  getSyncTiming(): SyncTiming {
    return this.data.syncTiming;
  }

  getSyncIntervalSeconds(): number | undefined {
    return this.data.syncIntervalSeconds;
  }

  getSyncDirection(): SyncDirection {
    return this.data.syncDirection;
  }

  getInputs(): SyncInput[] {
    return this.data.inputs;
  }

  getOutputs(): SyncOutput[] {
    return this.data.outputs;
  }

  getConflictResolution(): string {
    return this.data.conflictResolution;
  }

  getRetryPolicy(): RetryPolicy | undefined {
    return this.data.retryPolicy ? RetryPolicy.fromData(this.data.retryPolicy) : undefined;
  }

  getTransformerConfig(): DataTransformerData | undefined {
    return this.data.transformerConfig;
  }

  getBatchConfig(): BatchConfigData | undefined {
    return this.data.batchConfig;
  }

  getLastSyncDate(): string | undefined {
    return this.data.lastSyncDate;
  }

  getLastSyncStatus(): 'success' | 'failed' | undefined {
    return this.data.lastSyncStatus;
  }

  getLastSyncError(): string | undefined {
    return this.data.lastSyncError;
  }

  getCreatedAt(): string {
    return this.data.createdAt;
  }

  getUpdatedAt(): string {
    return this.data.updatedAt;
  }

  // Immutable setters
  setEnabled(enabled: boolean): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      enabled,
      updatedAt: new Date().toISOString(),
    });
  }

  setSyncTiming(timing: SyncTiming, intervalSeconds?: number): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      syncTiming: timing,
      syncIntervalSeconds: intervalSeconds || 3600, // Default 1 hour
      updatedAt: new Date().toISOString(),
    });
  }

  setSyncDirection(direction: SyncDirection): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      syncDirection: direction,
      updatedAt: new Date().toISOString(),
    });
  }

  setInputs(inputs: SyncInput[]): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      inputs,
      updatedAt: new Date().toISOString(),
    });
  }

  setOutputs(outputs: SyncOutput[]): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      outputs,
      updatedAt: new Date().toISOString(),
    });
  }

  setRetryPolicy(retryPolicy: RetryPolicy): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      retryPolicy: retryPolicy.toData(),
      updatedAt: new Date().toISOString(),
    });
  }

  setTransformerConfig(transformerConfig: DataTransformerData): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      transformerConfig,
      updatedAt: new Date().toISOString(),
    });
  }

  setBatchConfig(batchConfig: BatchConfigData): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      batchConfig,
      updatedAt: new Date().toISOString(),
    });
  }

  setSyncResult(status: 'success' | 'failed', error?: string): StorageSyncConfig {
    return new StorageSyncConfig({
      ...this.data,
      lastSyncDate: new Date().toISOString(),
      lastSyncStatus: status,
      lastSyncError: error || '',
      updatedAt: new Date().toISOString(),
    });
  }

  // Export
  toData(): StorageSyncConfigData {
    return { ...this.data };
  }

  // Clone
  clone(): StorageSyncConfig {
    return new StorageSyncConfig({ ...this.data });
  }

  // Static factory
  static create(params: {
    storageKey: string;
    syncMethod: SyncMethod;
    syncTiming: SyncTiming;
    syncDirection: SyncDirection;
    inputs: SyncInput[];
    outputs: SyncOutput[];
    syncIntervalSeconds?: number;
    conflictResolution?: 'latest_timestamp' | 'local_priority' | 'remote_priority' | 'user_confirm';
    retryPolicy?: RetryPolicy;
    transformerConfig?: DataTransformerData;
    batchConfig?: BatchConfigData;
  }): StorageSyncConfig {
    return new StorageSyncConfig({
      id: uuidv4(),
      storageKey: params.storageKey,
      enabled: true,
      syncMethod: params.syncMethod,
      syncTiming: params.syncTiming,
      syncDirection: params.syncDirection,
      inputs: params.inputs,
      outputs: params.outputs,
      syncIntervalSeconds: params.syncIntervalSeconds || 3600, // Default 1 hour
      conflictResolution: params.conflictResolution || 'latest_timestamp',
      ...(params.retryPolicy && { retryPolicy: params.retryPolicy.toData() }),
      ...(params.transformerConfig && { transformerConfig: params.transformerConfig }),
      ...(params.batchConfig && { batchConfig: params.batchConfig }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
