/**
 * Use Case: Get All Automation Variables
 * Returns all automation variables
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariablesOutputDto } from '@application/dtos/AutomationVariablesOutputDto';
import { AutomationVariablesMapper } from '@application/mappers/AutomationVariablesMapper';

export interface GetAllAutomationVariablesOutput {
  automationVariables: AutomationVariablesOutputDto[];
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

    const automationVariablesArray = result.value!;
    const automationVariablesDataArray = automationVariablesArray.map((av) => av.toData());
    const automationVariablesDtos = AutomationVariablesMapper.toOutputDtoArray(
      automationVariablesDataArray
    );

    return { automationVariables: automationVariablesDtos };
  }
}
