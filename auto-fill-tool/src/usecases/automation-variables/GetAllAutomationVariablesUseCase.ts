/**
 * GetAllAutomationVariablesUseCase
 * 全自動化変数を取得するユースケース
 */

import { AutomationVariables } from '@domain/entities/AutomationVariables';

export interface AutomationVariablesRepository {
  getAll(): Promise<AutomationVariables[]>;
}

export class GetAllAutomationVariablesUseCase {
  constructor(private repository: AutomationVariablesRepository) {}

  async execute(): Promise<AutomationVariables[]> {
    return await this.repository.getAll();
  }
}
