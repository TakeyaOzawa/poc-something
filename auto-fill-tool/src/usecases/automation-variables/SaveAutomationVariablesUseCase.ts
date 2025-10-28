/**
 * Use Case: Save Automation Variables
 * Saves automation variables to storage
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';

export interface SaveAutomationVariablesInput {
  automationVariables: AutomationVariables;
}

export interface SaveAutomationVariablesOutput {
  automationVariables: AutomationVariables;
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
    return { automationVariables };
  }
}
