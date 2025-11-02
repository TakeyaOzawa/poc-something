/**
 * AutomationResult Output DTO
 * プレゼンテーション層への出力用データ転送オブジェクト
 */
export interface AutomationResultOutputDto {
  id: string;
  automationVariablesId: string;
  websiteId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  currentStepIndex: number;
  totalSteps: number;
  lastExecutedUrl?: string;
}
