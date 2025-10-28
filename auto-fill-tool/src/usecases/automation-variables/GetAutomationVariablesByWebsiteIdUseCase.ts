/**
 * Use Case: Get Automation Variables by Website ID
 * Returns automation variables for a specific website
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';

export interface GetAutomationVariablesByWebsiteIdInput {
  websiteId: string;
}

export interface GetAutomationVariablesByWebsiteIdOutput {
  automationVariables: AutomationVariables | null;
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
    return { automationVariables: result.value ?? null };
  }
}
