/**
 * Use Case: Export System Settings to CSV
 * Returns CSV string for download
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsMapper } from '@application/mappers/SystemSettingsMapper';
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
    const dto = SystemSettingsMapper.toOutputDto(settings);

    // Convert DTO to CSV format
    const csv = this.convertToCSV(dto);
    return Result.success(csv);
  }

  private convertToCSV(dto: unknown): string {
    const headers = Object.keys(dto);
    const values = Object.values(dto);

    return [
      headers.join(','),
      values.map((v) => (typeof v === 'string' ? `"${v}"` : v)).join(','),
    ].join('\n');
  }
}
