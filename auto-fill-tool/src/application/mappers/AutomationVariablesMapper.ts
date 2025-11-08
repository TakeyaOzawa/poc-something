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
      status: entity.getStatus(),
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
      executionStatus: entity.getExecutionStatus(),
      resultDetail: entity.getResultDetail(),
      startFrom: entity.getStartFrom(),
      endTo: entity.getEndTo(),
      currentStepIndex: entity.getCurrentStepIndex(),
      totalSteps: entity.getTotalSteps(),
      lastExecutedUrl: entity.getLastExecutedUrl(),
    };
  }

  static toOutputDtoArray(entities: AutomationResult[]): AutomationResultOutputDto[] {
    return entities.map((entity) => this.toOutputDto(entity));
  }
}
