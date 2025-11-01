/**
 * UpdateAutomationVariablesUseCase
 * 自動化変数を更新するユースケース
 */

import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';

export class UpdateAutomationVariablesUseCase {
  constructor(private repository: AutomationVariablesRepository) {}

  async execute(variables: AutomationVariables): Promise<void> {
    await this.repository.update(variables);
  }
}
