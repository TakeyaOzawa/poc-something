/**
 * Use Case: Get Automation Variables by ID
 * Returns automation variables for a specific ID
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariablesOutputDto } from '@application/dtos/AutomationVariablesOutputDto';
import { AutomationVariablesMapper } from '@application/mappers/AutomationVariablesMapper';

export interface GetAutomationVariablesByIdInput {
  id: string;
}

export interface GetAutomationVariablesByIdOutput {
  automationVariables: AutomationVariablesOutputDto | null;
}

export class GetAutomationVariablesByIdUseCase {
  constructor(private automationVariablesRepository: AutomationVariablesRepository) {}

  async execute(input: GetAutomationVariablesByIdInput): Promise<GetAutomationVariablesByIdOutput> {
    const { id } = input;
    const result = await this.automationVariablesRepository.load(id);
    if (result.isFailure) {
      throw new Error(
        `Failed to load automation variables: ${result.error?.message || 'Unknown error'}`
      );
    }

    const automationVariables = result.value;
    if (!automationVariables) {
      return { automationVariables: null };
    }

    const automationVariablesDto = AutomationVariablesMapper.toOutputDto(automationVariables);
    return { automationVariables: automationVariablesDto };
  }
}
