/**
 * Use Case Layer: Get System Settings
 * Retrieves system settings from the repository
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsOutputDto } from '@application/dtos/SystemSettingsOutputDto';
import { SystemSettingsMapper } from '@application/mappers/SystemSettingsMapper';
import { Result } from '@domain/values/result.value';
import { NoInputCommand } from '@domain/commands/Command';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Empty input interface for consistency with other UseCases
export interface GetSystemSettingsInput {}

export class GetSystemSettingsUseCase implements NoInputCommand<Result<SystemSettingsOutputDto>> {
  constructor(private repository: SystemSettingsRepository) {}

  async execute(): Promise<Result<SystemSettingsOutputDto, Error>> {
    const result = await this.repository.load();
    if (result.isFailure) {
      return Result.failure(result.error || new Error('Failed to load system settings'));
    }

    // Convert entity to DTO at the UseCase boundary
    const settingsDto = SystemSettingsMapper.toOutputDto(result.value!);
    return Result.success(settingsDto);
  }
}
