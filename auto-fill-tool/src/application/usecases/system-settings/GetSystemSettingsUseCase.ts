/**
 * Use Case Layer: Get System Settings
 * Retrieves system settings from the repository
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { Result } from '@domain/values/result.value';
import { NoInputCommand } from '@domain/commands/Command';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Empty input interface for consistency with other UseCases
export interface GetSystemSettingsInput {}

export class GetSystemSettingsUseCase implements NoInputCommand<Result<SystemSettingsCollection>> {
  constructor(private repository: SystemSettingsRepository) {}

  async execute(): Promise<Result<SystemSettingsCollection, Error>> {
    const result = await this.repository.load();
    if (result.isFailure) {
      return Result.failure(result.error || new Error('Failed to load system settings'));
    }
    return Result.success(result.value!);
  }
}
