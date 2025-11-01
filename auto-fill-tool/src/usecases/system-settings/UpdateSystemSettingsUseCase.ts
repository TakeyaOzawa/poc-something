/**
 * UpdateSystemSettingsUseCase
 * システム設定を更新するユースケース
 */

import { SystemSettings } from '@domain/entities/SystemSettings';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';

export class UpdateSystemSettingsUseCase {
  constructor(private repository: SystemSettingsRepository) {}

  async execute(settings: SystemSettings): Promise<void> {
    await this.repository.save(settings);
  }
}
