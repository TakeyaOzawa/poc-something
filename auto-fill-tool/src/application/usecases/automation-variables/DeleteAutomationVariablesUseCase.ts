/**
 * Use Case: Delete Automation Variables
 * Deletes automation variables and associated results
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';

export interface DeleteAutomationVariablesInput {
  id: string;
}

export interface DeleteAutomationVariablesOutput {
  deleted: boolean;
}

export class DeleteAutomationVariablesUseCase {
  constructor(
    private automationVariablesRepository: AutomationVariablesRepository,
    private automationResultRepository: AutomationResultRepository
  ) {}

  async execute(input: DeleteAutomationVariablesInput): Promise<DeleteAutomationVariablesOutput> {
    const { id } = input;

    // Delete automation variables
    const deleteResult = await this.automationVariablesRepository.delete(id);
    if (deleteResult.isFailure) {
      throw new Error(
        `Failed to delete automation variables: ${deleteResult.error?.message || 'Unknown error'}`
      );
    }

    // Delete associated automation results
    const deleteResultsResult =
      await this.automationResultRepository.deleteByAutomationVariablesId(id);
    if (deleteResultsResult.isFailure) {
      throw new Error(
        `Failed to delete automation results: ${deleteResultsResult.error?.message || 'Unknown error'}`
      );
    }

    return { deleted: true };
  }
}
