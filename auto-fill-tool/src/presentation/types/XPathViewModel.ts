/**
 * XPath ViewModel
 * プレゼンテーション層専用のデータ構造
 * DTOから完全に分離されたViewModel
 */

export interface XPathViewModel {
  // 基本データ
  id: string;
  websiteId: string;
  url: string;
  actionType: string;
  value?: string;
  xpath: string;
  executionOrder: number;
  afterWaitSeconds?: number;
  executionTimeoutSeconds?: number;
  retryType: number;
  actionPattern?: string;

  // XPath関連フィールド
  pathShort?: string;
  pathAbsolute?: string;
  pathSmart?: string;
  selectedPathPattern?: string;

  // UI状態
  isLoading?: boolean;
  hasErrors?: boolean;
  isEditing?: boolean;

  // 表示用プロパティ
  displayValue: string;
  actionTypeText: string;
  executionOrderText: string;
  retryTypeText: string;

  // UI操作
  canEdit: boolean;
  canDelete: boolean;
  canDuplicate: boolean;
}
