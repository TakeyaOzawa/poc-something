/**
 * Use Case: Get All Automation Variables
 * Returns all automation variables
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';

export interface GetAllAutomationVariablesOutput {
  automationVariables: AutomationVariables[];
}

export class GetAllAutomationVariablesUseCase {
  constructor(private automationVariablesRepository: AutomationVariablesRepository) {}

  async execute(): Promise<GetAllAutomationVariablesOutput> {
    const result = await this.automationVariablesRepository.loadAll();
    if (result.isFailure) {
      throw new Error(
        `Failed to load automation variables: ${result.error?.message || 'Unknown error'}`
      );
    }
    return { automationVariables: result.value! };
  }
}
