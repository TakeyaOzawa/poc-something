/**
 * ResetSystemSettingsUseCase
 * システム設定をリセットするユースケース
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';

export class ResetSystemSettingsUseCase {
  constructor(private repository: SystemSettingsRepository) {}

  async execute(): Promise<void> {
    await this.repository.reset();
  }
}
