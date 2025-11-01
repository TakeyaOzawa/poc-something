/**
 * ExportAutomationVariablesUseCase
 * 自動化変数をエクスポートするユースケース
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { CSVConverter } from '@domain/services/CSVConverter';

export class ExportAutomationVariablesUseCase {
  constructor(
    private repository: AutomationVariablesRepository,
    private csvConverter: CSVConverter
  ) {}

  async execute(): Promise<string> {
    const allVariables = await this.repository.getAll();
    return await this.csvConverter.convertAutomationVariablesToCSV(allVariables);
  }
}
