/**
 * Use Case: Get Automation Variables by ID
 * Returns automation variables for a specific ID
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';

export interface GetAutomationVariablesByIdInput {
  id: string;
}

export interface GetAutomationVariablesByIdOutput {
  automationVariables: AutomationVariables | null;
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
    return { automationVariables: result.value ?? null };
  }
}
