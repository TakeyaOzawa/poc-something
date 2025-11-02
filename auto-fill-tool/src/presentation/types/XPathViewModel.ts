/**
 * XPath ViewModel
 * プレゼンテーション層専用のデータ構造
 */
import { XPathOutputDto } from '@application/dtos/XPathOutputDto';

export interface XPathViewModel extends XPathOutputDto {
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
