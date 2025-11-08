/**
 * AutomationVariables ViewModel
 * プレゼンテーション層専用のデータ構造
 * DTOから完全に分離されたViewModel
 */

export interface AutomationVariablesViewModel {
  // 基本データ
  id: string;
  websiteId: string;
  name: string;
  status: string;
  variables: Record<string, string>;
  createdAt: string;
  updatedAt: string;

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
  latestResult?: AutomationResultViewModel | null;

  // UI操作
  canEdit: boolean;
  canDelete: boolean;
  canDuplicate: boolean;
  canExecute: boolean;
}

export interface AutomationResultViewModel {
  // 基本データ
  id: string;
  automationVariablesId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  currentStepIndex?: number;
  totalSteps?: number;
  lastExecutedUrl?: string;

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
