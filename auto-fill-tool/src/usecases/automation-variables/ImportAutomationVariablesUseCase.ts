/**
 * ImportAutomationVariablesUseCase
 * 自動化変数をインポートするユースケース
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { CSVConverter } from '@domain/services/CSVConverter';

export class ImportAutomationVariablesUseCase {
  constructor(
    private repository: AutomationVariablesRepository,
    private csvConverter: CSVConverter
  ) {}

  async execute(csvContent: string, replaceAll: boolean = false): Promise<{ imported: number; errors: string[] }> {
    try {
      const importedVariables = await this.csvConverter.parseAutomationVariables(csvContent);
      
      if (replaceAll) {
        await this.repository.clear();
      }
      
      const errors: string[] = [];
      let imported = 0;

      for (const variables of importedVariables) {
        try {
          await this.repository.save(variables);
          imported++;
        } catch (error) {
          errors.push(`Variables ${variables.getId()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { imported, errors };
    } catch (error) {
      throw new Error(`インポートに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
