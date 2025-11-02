/**
 * AutomationVariables Output DTO
 * プレゼンテーション層への出力用データ転送オブジェクト
 */
export interface AutomationVariablesOutputDto {
  id: string;
  websiteId: string;
  variables: Record<string, string>;
  status?: string;
  createdAt: string;
  updatedAt: string;
}
