/**
 * DeleteAutomationVariablesUseCase
 * 自動化変数を削除するユースケース
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';

export class DeleteAutomationVariablesUseCase {
  constructor(private repository: AutomationVariablesRepository) {}

  async execute(id: string): Promise<boolean> {
    return await this.repository.delete(id);
  }
}
