/**
 * ImportSystemSettingsUseCase
 * システム設定をインポートするユースケース
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { CSVConverter } from '@domain/services/CSVConverter';

export class ImportSystemSettingsUseCase {
  constructor(
    private repository: SystemSettingsRepository,
    private csvConverter: CSVConverter
  ) {}

  async execute(csvContent: string): Promise<void> {
    try {
      const settings = await this.csvConverter.parseSystemSettings(csvContent);
      await this.repository.save(settings);
    } catch (error) {
      throw new Error(`システム設定のインポートに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
