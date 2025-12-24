/**
 * SaveAutomationVariables Input DTO
 * プレゼンテーション層からアプリケーション層への入力用データ転送オブジェクト
 */
export interface SaveAutomationVariablesInputDto {
  id: string;
  websiteId: string;
  variables: Record<string, string>;
  status: 'enabled' | 'disabled' | 'once';
  updatedAt: string;
}
