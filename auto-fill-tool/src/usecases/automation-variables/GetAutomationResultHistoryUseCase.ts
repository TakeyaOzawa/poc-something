/**
 * Use Case: Get Automation Result History
 * Returns all automation results for a specific AutomationVariables, sorted by date (newest first)
 */

import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { AutomationResult } from '@domain/entities/AutomationResult';

export interface GetAutomationResultHistoryInput {
  automationVariablesId: string;
}

export interface GetAutomationResultHistoryOutput {
  results: AutomationResult[];
}

export class GetAutomationResultHistoryUseCase {
  constructor(private automationResultRepository: AutomationResultRepository) {}

  async execute(input: GetAutomationResultHistoryInput): Promise<GetAutomationResultHistoryOutput> {
    const { automationVariablesId } = input;
    const resultsResult =
      await this.automationResultRepository.loadByAutomationVariablesId(automationVariablesId);
    if (resultsResult.isFailure) {
      throw new Error(
        `Failed to load automation results: ${resultsResult.error?.message || 'Unknown error'}`
      );
    }
    return { results: resultsResult.value! };
  }
}
