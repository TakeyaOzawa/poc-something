/**
 * Use Case: Get Automation Variables by Website ID
 * Returns automation variables for a specific website
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariablesOutputDto } from '@application/dtos/AutomationVariablesOutputDto';
import { AutomationVariablesMapper } from '@application/mappers/AutomationVariablesMapper';

export interface GetAutomationVariablesByWebsiteIdInput {
  websiteId: string;
}

export interface GetAutomationVariablesByWebsiteIdOutput {
  automationVariables: AutomationVariablesOutputDto | null;
}

export class GetAutomationVariablesByWebsiteIdUseCase {
  constructor(private automationVariablesRepository: AutomationVariablesRepository) {}

  async execute(
    input: GetAutomationVariablesByWebsiteIdInput
  ): Promise<GetAutomationVariablesByWebsiteIdOutput> {
    const { websiteId } = input;
    const result = await this.automationVariablesRepository.load(websiteId);
    if (result.isFailure) {
      throw new Error(
        `Failed to load automation variables: ${result.error?.message || 'Unknown error'}`
      );
    }

    const automationVariables = result.value;
    if (!automationVariables) {
      return { automationVariables: null };
    }

    const automationVariablesDto = AutomationVariablesMapper.toOutputDto(
      automationVariables.toData()
    );
    return { automationVariables: automationVariablesDto };
  }
}
