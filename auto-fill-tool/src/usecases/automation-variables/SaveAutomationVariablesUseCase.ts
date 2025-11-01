/**
 * SaveAutomationVariablesUseCase
 * 自動化変数を保存するユースケース
 */

import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';

export class SaveAutomationVariablesUseCase {
  constructor(private repository: AutomationVariablesRepository) {}

  async execute(variables: AutomationVariables): Promise<void> {
    await this.repository.save(variables);
  }
}
