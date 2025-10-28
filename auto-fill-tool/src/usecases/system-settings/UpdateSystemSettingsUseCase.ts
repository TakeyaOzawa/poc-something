/**
 * Use Case Layer: Update System Settings
 * Updates system settings in the repository
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { Result } from '@domain/values/result.value';

export interface UpdateSystemSettingsInput {
  settings: SystemSettingsCollection;
}

export class UpdateSystemSettingsUseCase {
  constructor(private repository: SystemSettingsRepository) {}

  async execute(input: UpdateSystemSettingsInput): Promise<Result<void, Error>> {
    const result = await this.repository.save(input.settings);

    if (result.isFailure) {
      return Result.failure(
        new Error(`Failed to update system settings: ${result.error?.message}`)
      );
    }

    return Result.success(undefined);
  }
}
