/**
 * Presentation Layer: View Model Mapper
 * Maps DTOs to presentation view models
 * 完全にDTO依存から分離されたMapper
 */

import { WebsiteOutputDto } from '@application/dtos/WebsiteOutputDto';
import { AutomationVariablesOutputDto } from '@application/dtos/AutomationVariablesOutputDto';
import { XPathOutputDto } from '@application/dtos/XPathOutputDto';
import { SystemSettingsOutputDto } from '@application/dtos/SystemSettingsOutputDto';
import { StorageSyncConfigOutputDto } from '@application/dtos/StorageSyncConfigOutputDto';
import { SyncHistoryOutputDto } from '@application/dtos/SyncHistoryOutputDto';
import { TabRecordingOutputDto } from '@application/dtos/TabRecordingOutputDto';
import { AutomationResultOutputDto } from '@application/dtos/AutomationResultOutputDto';
import { CreateSyncConfigInput } from '@application/usecases/sync/CreateSyncConfigUseCase';
import { UpdateSyncConfigInput } from '@application/usecases/sync/UpdateSyncConfigUseCase';
import { StorageSyncConfig, StorageSyncConfigData, SyncMethod, SyncTiming, SyncDirection } from '@domain/entities/StorageSyncConfig';

import { WebsiteViewModel } from '../types/WebsiteViewModel';
import {
  AutomationVariablesViewModel,
  AutomationResultViewModel,
} from '../types/AutomationVariablesViewModel';
import { XPathViewModel } from '../types/XPathViewModel';
import { SystemSettingsViewModel } from '../types/SystemSettingsViewModel';
import {
  StorageSyncConfigViewModel,
  SyncHistoryViewModel,
} from '../types/StorageSyncConfigViewModel';
import { TabRecordingViewModel } from '../types/TabRecordingViewModel';

export class ViewModelMapper {
  static toWebsiteViewModel(dto: WebsiteOutputDto): WebsiteViewModel {
    return {
      id: dto.id,
      name: dto.name,
      startUrl: dto.startUrl,
      status: dto.status,
      editable: dto.editable,
      updatedAt: dto.updatedAt,
      displayName: dto.name || '未設定',
      statusText:
        dto.status === 'enabled' ? '有効' : dto.status === 'disabled' ? '無効' : '1回のみ',
      lastUpdatedFormatted: new Date(dto.updatedAt).toLocaleString(),
      canDelete: dto.editable,
      canEdit: dto.editable,
      canExecute: dto.status === 'enabled' || dto.status === 'once',
    };
  }

  static toAutomationVariablesViewModel(
    dto: AutomationVariablesOutputDto
  ): AutomationVariablesViewModel {
    return {
      id: dto.id,
      websiteId: dto.websiteId,
      name: `変数セット ${dto.id.slice(0, 8)}`, // DTOにnameがないため生成
      status: dto.status || 'active',
      variables: dto.variables,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      displayName: `変数セット ${dto.id.slice(0, 8)}`,
      variableCount: Object.keys(dto.variables).length,
      lastUpdatedFormatted: new Date(dto.updatedAt).toLocaleString(),
      canEdit: true,
      canDelete: true,
      canDuplicate: true,
      canExecute: true,
    };
  }

  static toAutomationResultViewModel(dto: AutomationResultOutputDto): AutomationResultViewModel {
    const startedAt = new Date(dto.startedAt);
    const completedAt = dto.completedAt ? new Date(dto.completedAt) : null;
    const duration = completedAt ? completedAt.getTime() - startedAt.getTime() : null;

    return {
      id: dto.id,
      automationVariablesId: dto.automationVariablesId,
      status: dto.status,
      startedAt: dto.startedAt,
      completedAt: dto.completedAt || '',
      errorMessage: dto.errorMessage || '',
      currentStepIndex: dto.currentStepIndex,
      totalSteps: dto.totalSteps,
      lastExecutedUrl: dto.lastExecutedUrl || '',
      statusText: this.getStatusText(dto.status),
      durationText: duration ? `${Math.round(duration / 1000)}秒` : '',
      progressText: dto.totalSteps ? `${dto.currentStepIndex || 0}/${dto.totalSteps}` : '',
      startedAtFormatted: startedAt.toLocaleString(),
      completedAtFormatted: completedAt?.toLocaleString() || '',
      canRetry: dto.status === 'FAILED',
      canViewRecording: dto.status === 'SUCCESS' || dto.status === 'FAILED',
    };
  }

  static toXPathViewModel(dto: XPathOutputDto): XPathViewModel {
    return {
      id: dto.id,
      websiteId: dto.websiteId,
      url: dto.url,
      actionType: dto.actionType,
      value: dto.value,
      xpath: dto.pathSmart || dto.pathShort || dto.pathAbsolute || '',
      executionOrder: dto.executionOrder,
      afterWaitSeconds: dto.afterWaitSeconds,
      executionTimeoutSeconds: dto.executionTimeoutSeconds,
      retryType: dto.retryType,
      actionPattern: dto.actionPattern || '',

      // XPath関連フィールド
      pathShort: dto.pathShort || '',
      pathAbsolute: dto.pathAbsolute || '',
      pathSmart: dto.pathSmart || '',
      selectedPathPattern: dto.selectedPathPattern,

      // UI状態
      isLoading: false,
      hasErrors: false,
      isEditing: false,

      displayValue: dto.value || '',
      actionTypeText: dto.actionType || '',
      executionOrderText: String(dto.executionOrder || 0),
      retryTypeText: String(dto.retryType || 0),
      canEdit: true,
      canDelete: true,
      canDuplicate: true,
    };
  }

  static toSystemSettingsViewModel(dto: SystemSettingsOutputDto): SystemSettingsViewModel {
    const viewModel: SystemSettingsViewModel = {
      retryWaitSecondsMin: dto.retryWaitSecondsMin,
      retryWaitSecondsMax: dto.retryWaitSecondsMax,
      retryCount: dto.retryCount,
      recordingEnabled: dto.recordingEnabled,
      recordingBitrate: dto.recordingBitrate,
      recordingRetentionDays: dto.recordingRetentionDays,
      enabledLogSources: dto.enabledLogSources,
      securityEventsOnly: dto.securityEventsOnly,
      maxStoredLogs: dto.maxStoredLogs,
      logRetentionDays: dto.logRetentionDays,
      gradientStartColor: '#4F46E5',
      gradientEndColor: '#7C3AED',
      gradientAngle: 135,
      retryWaitRangeText: `${dto.retryWaitSecondsMin}〜${dto.retryWaitSecondsMax}秒`,
      retryCountText: dto.retryCount === -1 ? '無限' : `${dto.retryCount}回`,
      recordingStatusText: dto.recordingEnabled ? '有効' : '無効',
      logSettingsText: `${dto.maxStoredLogs}件、${dto.logRetentionDays}日間保持`,
      canSave: true,
      canReset: true,
      canExport: true,
      canImport: true,
      getGradientStartColor: () => '#4F46E5',
      getGradientEndColor: () => '#7C3AED',
      getGradientAngle: () => 135,
    };
    return viewModel;
  }

  static toStorageSyncConfigViewModel(dto: StorageSyncConfigOutputDto): StorageSyncConfigViewModel {
    return {
      id: dto.id,
      storageKey: dto.storageKey,
      syncMethod: dto.syncMethod,
      syncTiming: dto.syncTiming,
      syncDirection: dto.syncDirection,
      conflictResolution: dto.conflictResolution,
      enabled: dto.enabled,
      syncIntervalSeconds: dto.syncIntervalSeconds || 0,
      inputs: dto.inputs,
      outputs: dto.outputs,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      displayName: `${dto.storageKey} (${dto.syncMethod})`,
      syncMethodText: dto.syncMethod === 'notion' ? 'Notion' : 'スプレッドシート',
      syncTimingText: dto.syncTiming === 'manual' ? '手動' : '定期',
      syncDirectionText: this.getSyncDirectionText(dto.syncDirection),
      statusText: dto.enabled ? '有効' : '無効',
      canEdit: true,
      canDelete: true,
      canTest: dto.enabled,
      canSync: dto.enabled,
      canViewHistory: true,
    };
  }

  static toSyncHistoryViewModel(dto: SyncHistoryOutputDto): SyncHistoryViewModel {
    const success = dto.status === 'success';
    const errorMessage =
      dto.error || dto.receiveResult?.error || dto.sendResult?.error || undefined;
    const receivedCount = dto.receiveResult?.receivedCount || 0;
    const sentCount = dto.sendResult?.sentCount || 0;
    const executedAt = new Date(dto.startTime).toISOString();

    return {
      id: dto.id,
      configId: dto.configId,
      syncDirection: dto.syncDirection,
      success: success,
      errorMessage: errorMessage || '',
      receivedCount: receivedCount,
      sentCount: sentCount,
      executedAt: executedAt,
      statusText: success ? '成功' : '失敗',
      directionText: this.getSyncDirectionText(dto.syncDirection),
      resultText: success
        ? `受信: ${receivedCount}件、送信: ${sentCount}件`
        : errorMessage || 'エラーが発生しました',
      executedAtFormatted: new Date(dto.startTime).toLocaleString(),
      canRetry: !success,
      canViewDetails: true,
    };
  }

  static toTabRecordingViewModel(dto: TabRecordingOutputDto): TabRecordingViewModel {
    const startedAt = new Date(dto.startedAt);
    const stoppedAt = dto.stoppedAt ? new Date(dto.stoppedAt) : null;
    const duration = dto.duration || (stoppedAt ? stoppedAt.getTime() - startedAt.getTime() : 0);

    return {
      id: dto.id,
      automationResultId: dto.automationResultId,
      startedAt: dto.startedAt,
      stoppedAt: dto.stoppedAt || '',
      duration: dto.duration || 0,
      size: dto.size,
      mimeType: dto.mimeType,
      durationText: `${Math.round(duration / 1000)}秒`,
      sizeText: dto.size ? this.formatFileSize(dto.size) : '不明',
      startedAtFormatted: startedAt.toLocaleString(),
      stoppedAtFormatted: stoppedAt?.toLocaleString() || '',
      statusText: stoppedAt ? '完了' : '録画中',
      canPlay: !!stoppedAt,
      canDownload: !!stoppedAt,
      canDelete: true,
    };
  }

  // 配列変換メソッド
  static toWebsiteViewModels(dtos: WebsiteOutputDto[]): WebsiteViewModel[] {
    return dtos.map((dto) => this.toWebsiteViewModel(dto));
  }

  static toAutomationVariablesViewModels(
    dtos: AutomationVariablesOutputDto[]
  ): AutomationVariablesViewModel[] {
    return dtos.map((dto) => this.toAutomationVariablesViewModel(dto));
  }

  static toXPathViewModels(dtos: XPathOutputDto[]): XPathViewModel[] {
    return dtos.map((dto) => this.toXPathViewModel(dto));
  }

  static toStorageSyncConfigViewModels(
    dtos: StorageSyncConfigOutputDto[]
  ): StorageSyncConfigViewModel[] {
    return dtos.map((dto) => this.toStorageSyncConfigViewModel(dto));
  }

  static toSyncHistoryViewModels(dtos: SyncHistoryOutputDto[]): SyncHistoryViewModel[] {
    return dtos.map((dto) => this.toSyncHistoryViewModel(dto));
  }

  // ViewModel to DTO conversion methods
  static toCreateSyncConfigInput(viewModel: StorageSyncConfigViewModel): CreateSyncConfigInput {
    return {
      storageKey: viewModel.storageKey,
      enabled: viewModel.enabled,
      syncMethod: viewModel.syncMethod as 'notion' | 'spread-sheet',
      syncTiming: viewModel.syncTiming as 'manual' | 'periodic',
      syncDirection: viewModel.syncDirection as 'bidirectional' | 'receive_only' | 'send_only',
      syncIntervalSeconds: viewModel.syncIntervalSeconds,
      inputs: viewModel.inputs,
      outputs: viewModel.outputs,
    };
  }

  static toUpdateSyncConfigInput(id: string, viewModel: Partial<StorageSyncConfigViewModel>): UpdateSyncConfigInput {
    const input: UpdateSyncConfigInput = { id };

    if (viewModel.enabled !== undefined) input.enabled = viewModel.enabled;
    if (viewModel.syncMethod !== undefined) input.syncMethod = viewModel.syncMethod as 'notion' | 'spread-sheet';
    if (viewModel.syncTiming !== undefined) input.syncTiming = viewModel.syncTiming as 'manual' | 'periodic';
    if (viewModel.syncDirection !== undefined) input.syncDirection = viewModel.syncDirection as 'bidirectional' | 'receive_only' | 'send_only';
    if (viewModel.syncIntervalSeconds !== undefined) input.syncIntervalSeconds = viewModel.syncIntervalSeconds;
    if (viewModel.inputs !== undefined) input.inputs = viewModel.inputs;
    if (viewModel.outputs !== undefined) input.outputs = viewModel.outputs;

    return input;
  }

  static viewModelToStorageSyncConfig(viewModel: StorageSyncConfigViewModel): StorageSyncConfig {
    // Convert ViewModel to entity for UseCase operations that require entities
    const configData: StorageSyncConfigData = {
      id: viewModel.id,
      storageKey: viewModel.storageKey,
      enabled: viewModel.enabled,
      syncMethod: viewModel.syncMethod as SyncMethod,
      syncTiming: viewModel.syncTiming as SyncTiming,
      syncDirection: viewModel.syncDirection as SyncDirection,
      conflictResolution: viewModel.conflictResolution as 'latest_timestamp' | 'local_priority' | 'remote_priority' | 'user_confirm',
      syncIntervalSeconds: viewModel.syncIntervalSeconds,
      inputs: viewModel.inputs,
      outputs: viewModel.outputs,
      retryPolicy: viewModel.retryPolicy,
      createdAt: viewModel.createdAt,
      updatedAt: viewModel.updatedAt,
    };

    return new StorageSyncConfig(configData);
  }

  // ヘルパーメソッド
  private static getStatusText(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return '成功';
      case 'FAILED':
        return '失敗';
      case 'DOING':
        return '実行中';
      case 'CANCELLED':
        return 'キャンセル';
      default:
        return status;
    }
  }

  private static getSyncDirectionText(direction: string): string {
    switch (direction) {
      case 'bidirectional':
        return '双方向';
      case 'receive_only':
        return '受信のみ';
      case 'send_only':
        return '送信のみ';
      default:
        return direction;
    }
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
