/**
 * AutomationVariables Mapper
 * ドメインエンティティ → OutputDTO の変換
 */
import { AutomationVariablesData } from '@domain/entities/AutomationVariables';
import { AutomationResultData } from '@domain/entities/AutomationResult';
import {
  AutomationVariablesOutputDto,
  AutomationResultOutputDto,
} from '../dtos/AutomationVariablesOutputDto';

export class AutomationVariablesMapper {
  static toOutputDto(data: AutomationVariablesData): AutomationVariablesOutputDto {
    return {
      id: data.id,
      websiteId: data.websiteId,
      variables: data.variables,
      createdAt: data.updatedAt, // createdAtがない場合はupdatedAtを使用
      updatedAt: data.updatedAt,
    };
  }

  static toOutputDtoArray(dataArray: AutomationVariablesData[]): AutomationVariablesOutputDto[] {
    return dataArray.map((data) => this.toOutputDto(data));
  }
}

export class AutomationResultMapper {
  static toOutputDto(data: AutomationResultData): AutomationResultOutputDto {
    return {
      id: data.id,
      automationVariablesId: data.automationVariablesId,
      websiteId: '', // AutomationResultDataにはwebsiteIdがないため空文字
      status: data.executionStatus,
      startedAt: data.startFrom,
      completedAt: data.endTo || undefined,
      errorMessage: data.resultDetail || undefined,
      currentStepIndex: data.currentStepIndex,
      totalSteps: data.totalSteps,
      lastExecutedUrl: data.lastExecutedUrl,
    };
  }

  static toOutputDtoArray(dataArray: AutomationResultData[]): AutomationResultOutputDto[] {
    return dataArray.map((data) => this.toOutputDto(data));
  }
}
