/**
 * AutomationResultMapper
 * Maps AutomationResult entity to AutomationResultOutputDto
 */

import { AutomationResult } from '@domain/entities/AutomationResult';
import { AutomationResultOutputDto } from '@application/dtos/AutomationResultOutputDto';

export class AutomationResultMapper {
  /**
   * Convert AutomationResult entity to AutomationResultOutputDto
   */
  static toOutputDto(entity: AutomationResult): AutomationResultOutputDto {
    return {
      id: entity.getId(),
      automationVariablesId: entity.getAutomationVariablesId(),
      websiteId: '', // AutomationResultにはwebsiteIdがないため空文字
      status: entity.getExecutionStatus(),
      startedAt: entity.getStartFrom(),
      completedAt: entity.getEndTo() || undefined,
      errorMessage: entity.getResultDetail() || undefined,
      currentStepIndex: entity.getCurrentStepIndex(),
      totalSteps: entity.getTotalSteps(),
      lastExecutedUrl: entity.getLastExecutedUrl() || undefined,
    };
  }
}
