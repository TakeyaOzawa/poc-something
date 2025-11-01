/**
 * GetAutomationVariablesByIdUseCase
 * IDで自動化変数を取得するユースケース
 */

import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';

export class GetAutomationVariablesByIdUseCase {
  constructor(private repository: AutomationVariablesRepository) {}

  async execute(id: string): Promise<AutomationVariables | undefined> {
    return await this.repository.getById(id);
  }
}
