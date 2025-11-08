/**
 * Use Case: Import System Settings from CSV
 * Validates and saves imported settings
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsMapper } from '@application/mappers/SystemSettingsMapper';
import { Result } from '@domain/values/result.value';

export interface ImportSystemSettingsInput {
  csvText: string;
}

export class ImportSystemSettingsUseCase {
  constructor(private systemSettingsRepository: SystemSettingsRepository) {}

  async execute(input: ImportSystemSettingsInput): Promise<Result<void, Error>> {
    try {
      // Parse CSV to DTO
      const dto = this.parseCSVToDto(input.csvText);

      // Convert DTO to Entity
      const settings = SystemSettingsMapper.toEntity(dto);

      // Save to repository
      const result = await this.systemSettingsRepository.save(settings);

      if (result.isFailure) {
        return Result.failure(
          new Error(`Failed to import system settings: ${result.error?.message || 'Unknown error'}`)
        );
      }

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(
        new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      );
    }
  }

  private parseCSVToDto(csvText: string): any {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Invalid CSV format');
    }

    const headers = lines[0]?.split(',') || [];
    const values = lines[1]?.split(',').map((v) => v.replace(/^"|"$/g, '')) || [];

    const dto: any = {};
    headers.forEach((header, index) => {
      const value = values[index];
      if (value === undefined || header === undefined) return; // Skip undefined values

      // Try to parse as number or boolean
      if (value === 'true') dto[header] = true;
      else if (value === 'false') dto[header] = false;
      else if (!isNaN(Number(value))) dto[header] = Number(value);
      else dto[header] = value;
    });

    return dto;
  }
}
