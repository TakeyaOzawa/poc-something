/**
 * Use Case: Duplicate Automation Variables
 * Creates a copy of existing automation variables
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { IdGenerator } from '@domain/types/id-generator.types';

export interface DuplicateAutomationVariablesInput {
  id: string;
}

export interface DuplicateAutomationVariablesOutput {
  automationVariables: AutomationVariables | null;
}

export class DuplicateAutomationVariablesUseCase {
  constructor(
    private automationVariablesRepository: AutomationVariablesRepository,
    private idGenerator: IdGenerator
  ) {}

  async execute(
    input: DuplicateAutomationVariablesInput
  ): Promise<DuplicateAutomationVariablesOutput> {
    const { id } = input;
    const loadResult = await this.automationVariablesRepository.load(id);

    if (loadResult.isFailure) {
      return { automationVariables: null };
    }

    const original = loadResult.value;
    if (!original) {
      return { automationVariables: null };
    }

    // Create duplicate with same websiteId but new ID
    // Note: Variables are copied as-is (no suffix added to values)
    const duplicate = AutomationVariables.create(
      {
        websiteId: original.getWebsiteId(),
        variables: { ...original.getVariables() },
        status: original.getStatus() || 'enabled',
      },
      this.idGenerator
    );

    const saveResult = await this.automationVariablesRepository.save(duplicate);
    if (saveResult.isFailure) {
      return { automationVariables: null };
    }

    return { automationVariables: duplicate };
  }
}
