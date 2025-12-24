/**
 * Use Case: Save Automation Variables
 * Saves automation variables to storage
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationVariablesOutputDto } from '@application/dtos/AutomationVariablesOutputDto';
import { SaveAutomationVariablesInputDto } from '@application/dtos/SaveAutomationVariablesInputDto';
import { AutomationVariablesMapper } from '@application/mappers/AutomationVariablesMapper';

export interface SaveAutomationVariablesInput {
  automationVariables: AutomationVariables;
}

export interface SaveAutomationVariablesInputFromDto {
  automationVariablesDto: SaveAutomationVariablesInputDto;
}

export interface SaveAutomationVariablesOutput {
  automationVariables: AutomationVariablesOutputDto;
}

export class SaveAutomationVariablesUseCase {
  constructor(private automationVariablesRepository: AutomationVariablesRepository) {}

  async execute(input: SaveAutomationVariablesInput): Promise<SaveAutomationVariablesOutput> {
    const { automationVariables } = input;
    const result = await this.automationVariablesRepository.save(automationVariables);
    if (result.isFailure) {
      throw new Error(
        `Failed to save automation variables: ${result.error?.message || 'Unknown error'}`
      );
    }

    // DTOパターン: エンティティをOutputDTOに変換
    const automationVariablesDto = AutomationVariablesMapper.toOutputDto(automationVariables);
    return { automationVariables: automationVariablesDto };
  }

  async executeFromDto(input: SaveAutomationVariablesInputFromDto): Promise<SaveAutomationVariablesOutput> {
    const { automationVariablesDto } = input;

    // DTOからエンティティを作成
    const automationVariables = new AutomationVariables({
      id: automationVariablesDto.id,
      websiteId: automationVariablesDto.websiteId,
      variables: automationVariablesDto.variables,
      status: automationVariablesDto.status,
      updatedAt: automationVariablesDto.updatedAt,
    });

    const result = await this.automationVariablesRepository.save(automationVariables);
    if (result.isFailure) {
      throw new Error(
        `Failed to save automation variables: ${result.error?.message || 'Unknown error'}`
      );
    }

    // DTOパターン: エンティティをOutputDTOに変換
    const outputDto = AutomationVariablesMapper.toOutputDto(automationVariables);
    return { automationVariables: outputDto };
  }
}
