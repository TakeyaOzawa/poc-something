/**
 * GetSystemSettingsUseCase
 * システム設定を取得するユースケース
 */

import { SystemSettings } from '@domain/entities/SystemSettings';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';

export class GetSystemSettingsUseCase {
  constructor(private repository: SystemSettingsRepository) {}

  async execute(): Promise<SystemSettings> {
    return await this.repository.get();
  }
}
