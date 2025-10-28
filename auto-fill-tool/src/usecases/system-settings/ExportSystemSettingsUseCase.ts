/**
 * Use Case: Export System Settings to CSV
 * Returns CSV string for download
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsMapper } from '@infrastructure/mappers/SystemSettingsMapper';
import { Result } from '@domain/values/result.value';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Empty input interface for consistency with other UseCases
export interface ExportSystemSettingsInput {}

export class ExportSystemSettingsUseCase {
  constructor(private systemSettingsRepository: SystemSettingsRepository) {}

  async execute(_input: ExportSystemSettingsInput = {}): Promise<Result<string, Error>> {
    const result = await this.systemSettingsRepository.load();

    if (result.isFailure) {
      return Result.failure(
        new Error(`Failed to export system settings: ${result.error?.message}`)
      );
    }

    const settings = result.value!;
    const csv = SystemSettingsMapper.toCSV(settings);
    return Result.success(csv);
  }
}
