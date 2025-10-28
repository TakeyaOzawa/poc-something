/**
 * Use Case: Export Automation Variables to CSV
 * Returns CSV string for download
 * Following Clean Architecture: depends on domain interface, not infrastructure
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariablesCSVConverter } from '@domain/types/csv-converter.types';

export interface ExportAutomationVariablesOutput {
  csvText: string;
}

export class ExportAutomationVariablesUseCase {
  constructor(
    private automationVariablesRepository: AutomationVariablesRepository,
    private csvConverter: AutomationVariablesCSVConverter
  ) {}

  async execute(): Promise<ExportAutomationVariablesOutput> {
    const result = await this.automationVariablesRepository.loadAll();
    if (result.isFailure) {
      throw new Error(
        `Failed to load automation variables: ${result.error?.message || 'Unknown error'}`
      );
    }
    const automationVariablesList = result.value!;
    const automationVariablesData = automationVariablesList.map((av) => av.toData());
    const csvText = this.csvConverter.toCSV(automationVariablesData);
    return { csvText };
  }
}
