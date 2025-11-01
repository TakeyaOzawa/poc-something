/**
 * SaveAutomationResultUseCase
 * 自動化実行結果を保存するユースケース
 */

import { AutomationResult } from '@domain/entities/AutomationResult';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';

export class SaveAutomationResultUseCase {
  constructor(private repository: AutomationResultRepository) {}

  async execute(result: AutomationResult): Promise<void> {
    await this.repository.save(result);
  }
}
