/**
 * Application Layer: AutomationVariables Mapper
 * Maps domain entities to DTOs
 */

import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationResult } from '@domain/entities/AutomationResult';
import { AutomationVariablesOutputDto } from '../dtos/AutomationVariablesOutputDto';
import { AutomationResultOutputDto } from '../dtos/AutomationResultOutputDto';

export class AutomationVariablesMapper {
  static toOutputDto(entity: AutomationVariables): AutomationVariablesOutputDto {
    return {
      id: entity.getId(),
      websiteId: entity.getWebsiteId(),
      variables: entity.getVariables(),
      status: entity.getStatus() || 'enabled',
      createdAt: entity.getUpdatedAt(), // createdAtがない場合はupdatedAtを使用
      updatedAt: entity.getUpdatedAt(),
    };
  }

  static toOutputDtoArray(entities: AutomationVariables[]): AutomationVariablesOutputDto[] {
    return entities.map((entity) => this.toOutputDto(entity));
  }
}

export class AutomationResultMapper {
  static toOutputDto(entity: AutomationResult): AutomationResultOutputDto {
    return {
      id: entity.getId(),
      automationVariablesId: entity.getAutomationVariablesId(),
      websiteId: entity.getAutomationVariablesId(), // websiteIdがない場合はautomationVariablesIdを使用
      status: entity.getExecutionStatus(),
      startedAt: entity.getStartFrom(),
      completedAt: entity.getEndTo() || undefined,
      errorMessage: entity.getResultDetail() || undefined,
      currentStepIndex: entity.getCurrentStepIndex(),
      totalSteps: entity.getTotalSteps(),
      lastExecutedUrl: entity.getLastExecutedUrl() || undefined,
    };
  }

  static toOutputDtoArray(entities: AutomationResult[]): AutomationResultOutputDto[] {
    return entities.map((entity) => this.toOutputDto(entity));
  }
}
