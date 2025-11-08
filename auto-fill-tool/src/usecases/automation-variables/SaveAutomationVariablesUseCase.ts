/**
 * Use Case: Save Automation Variables
 * Saves automation variables to storage
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationVariablesOutputDto } from '@application/dtos/AutomationVariablesOutputDto';
import { AutomationVariablesMapper } from '@application/mappers/AutomationVariablesMapper';

export interface SaveAutomationVariablesInput {
  automationVariables: AutomationVariables;
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
}
