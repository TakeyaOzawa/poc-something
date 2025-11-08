/**
 * Use Case Layer: Get System Settings
 * Retrieves system settings from the repository
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { Result } from '@domain/values/result.value';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Empty input interface for consistency with other UseCases
export interface GetSystemSettingsInput {}

export class GetSystemSettingsUseCase {
  constructor(private repository: SystemSettingsRepository) {}

  async execute(_input: GetSystemSettingsInput = {}): Promise<Result<SystemSettingsCollection>> {
    return await this.repository.load();
  }
}
