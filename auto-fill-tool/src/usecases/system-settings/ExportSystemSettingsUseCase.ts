/**
 * ExportSystemSettingsUseCase
 * システム設定をエクスポートするユースケース
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { CSVConverter } from '@domain/services/CSVConverter';

export class ExportSystemSettingsUseCase {
  constructor(
    private repository: SystemSettingsRepository,
    private csvConverter: CSVConverter
  ) {}

  async execute(): Promise<string> {
    const settings = await this.repository.get();
    return await this.csvConverter.convertSystemSettingsToCSV(settings);
  }
}
