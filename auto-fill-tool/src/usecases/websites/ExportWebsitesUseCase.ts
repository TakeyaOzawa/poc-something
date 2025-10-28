/**
 * Use Case: Export Websites to CSV
 * Returns CSV string for download
 * Following Clean Architecture: depends on domain interface, not infrastructure
 */

import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { WebsiteCSVConverter } from '@domain/types/csv-converter.types';

/**
 * Output DTO for ExportWebsites UseCase
 */
export interface ExportWebsitesOutput {
  success: boolean;
  csvText?: string;
  error?: string;
}

/**
 * Use Case: Export Websites to CSV
 * Converts all websites to CSV format for export
 */
export class ExportWebsitesUseCase {
  constructor(
    private websiteRepository: WebsiteRepository,
    private csvConverter: WebsiteCSVConverter
  ) {}

  async execute(): Promise<ExportWebsitesOutput> {
    const loadResult = await this.websiteRepository.load();
    if (loadResult.isFailure) {
      return {
        success: false,
        error: loadResult.error?.message || 'Failed to load websites',
      };
    }

    const collection = loadResult.value!;
    const websites = collection.getAll().map((w) => w.toData());

    return {
      success: true,
      csvText: this.csvConverter.toCSV(websites),
    };
  }
}
