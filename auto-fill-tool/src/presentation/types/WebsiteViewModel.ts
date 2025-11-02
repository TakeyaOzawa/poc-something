/**
 * Website ViewModel
 * プレゼンテーション層専用のデータ構造
 */
import { WebsiteOutputDto } from '@application/dtos/WebsiteOutputDto';

export interface WebsiteViewModel extends WebsiteOutputDto {
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
