/**
 * Website ViewModel
 * プレゼンテーション層専用のデータ構造
 * DTOから完全に分離されたViewModel
 */

export interface WebsiteViewModel {
  // 基本データ
  id: string;
  name: string;
  startUrl?: string;
  status: string;
  editable: boolean;
  updatedAt: string;

  // UI状態
  isLoading?: boolean;
  hasErrors?: boolean;

  // 表示用プロパティ
  displayName: string;
  statusText: string;
  lastUpdatedFormatted: string;

  // UI操作
  canDelete: boolean;
  canEdit: boolean;
  canExecute: boolean;
}
