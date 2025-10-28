/**
 * Use Case: Get Latest Automation Result
 * Returns the most recent automation result for a specific AutomationVariables
 */

import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { AutomationResult } from '@domain/entities/AutomationResult';

export interface GetLatestAutomationResultInput {
  automationVariablesId: string;
}

export interface GetLatestAutomationResultOutput {
  result: AutomationResult | null;
}

export class GetLatestAutomationResultUseCase {
  constructor(private automationResultRepository: AutomationResultRepository) {}

  async execute(input: GetLatestAutomationResultInput): Promise<GetLatestAutomationResultOutput> {
    const { automationVariablesId } = input;
    const resultResult =
      await this.automationResultRepository.loadLatestByAutomationVariablesId(
        automationVariablesId
      );
    if (resultResult.isFailure) {
      throw new Error(
        `Failed to load latest automation result: ${resultResult.error?.message || 'Unknown error'}`
      );
    }
    return { result: resultResult.value ?? null };
  }
}
