/**
 * AutomationVariables ViewModel
 * プレゼンテーション層専用のデータ構造
 */
import {
  AutomationVariablesOutputDto,
  AutomationResultOutputDto,
} from '@application/dtos/AutomationVariablesOutputDto';

export interface AutomationVariablesViewModel extends AutomationVariablesOutputDto {
  // UI状態
  isLoading?: boolean;
  hasErrors?: boolean;
  isEditing?: boolean;

  // 表示用プロパティ
  displayName: string;
  websiteName?: string;
  variableCount: number;
  lastUpdatedFormatted: string;

  // 関連データ
  latestResult?: AutomationResultOutputDto | null;

  // UI操作
  canEdit: boolean;
  canDelete: boolean;
  canDuplicate: boolean;
  canExecute: boolean;
}

export interface AutomationResultViewModel extends AutomationResultOutputDto {
  // UI状態
  isLoading?: boolean;

  // 表示用プロパティ
  statusText: string;
  durationText?: string;
  progressText?: string;
  startedAtFormatted: string;
  completedAtFormatted?: string;

  // UI操作
  canRetry: boolean;
  canViewRecording: boolean;
}
