/**
 * Use Case: Save Automation Result
 * Saves automation result to storage
 */

import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { AutomationResult } from '@domain/entities/AutomationResult';

export interface SaveAutomationResultInput {
  result: AutomationResult;
}

export interface SaveAutomationResultOutput {
  result: AutomationResult;
}

export class SaveAutomationResultUseCase {
  constructor(private automationResultRepository: AutomationResultRepository) {}

  async execute(input: SaveAutomationResultInput): Promise<SaveAutomationResultOutput> {
    const { result } = input;
    const saveResult = await this.automationResultRepository.save(result);
    if (saveResult.isFailure) {
      throw new Error(
        `Failed to save automation result: ${saveResult.error?.message || 'Unknown error'}`
      );
    }
    return { result };
  }
}
