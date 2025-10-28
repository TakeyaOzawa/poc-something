/**
 * Use Case: Import System Settings from CSV
 * Validates and saves imported settings
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsMapper } from '@infrastructure/mappers/SystemSettingsMapper';
import { Result } from '@domain/values/result.value';

export interface ImportSystemSettingsInput {
  csvText: string;
}

export class ImportSystemSettingsUseCase {
  constructor(private systemSettingsRepository: SystemSettingsRepository) {}

  async execute(input: ImportSystemSettingsInput): Promise<Result<void, Error>> {
    // Parse CSV and create SystemSettingsCollection
    const settings = SystemSettingsMapper.fromCSV(input.csvText);

    // Save to repository
    const result = await this.systemSettingsRepository.save(settings);

    if (result.isFailure) {
      return Result.failure(
        new Error(`Failed to import system settings: ${result.error?.message}`)
      );
    }

    return Result.success(undefined);
  }
}
