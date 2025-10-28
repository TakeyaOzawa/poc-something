/**
 * Use Case: Import Websites from CSV
 * Accepts CSV string and converts to entities
 * Following Clean Architecture: depends on domain interface, not infrastructure
 */

import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { WebsiteCSVConverter } from '@domain/types/csv-converter.types';
import { Website } from '@domain/entities/Website';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';

/**
 * Input DTO for ImportWebsites UseCase
 */
export interface ImportWebsitesInput {
  csvText: string;
}

/**
 * Output DTO for ImportWebsites UseCase
 */
export interface ImportWebsitesOutput {
  success: boolean;
  error?: string;
}

/**
 * Use Case: Import Websites from CSV
 * Parses CSV text and saves websites to repository
 */
export class ImportWebsitesUseCase {
  constructor(
    private websiteRepository: WebsiteRepository,
    private csvConverter: WebsiteCSVConverter
  ) {}

  async execute(input: ImportWebsitesInput): Promise<ImportWebsitesOutput> {
    try {
      const websiteDataList = this.csvConverter.fromCSV(input.csvText);
      const websites = websiteDataList.map((data) => new Website(data));
      const websiteCollection = new WebsiteCollection(websites);

      const saveResult = await this.websiteRepository.save(websiteCollection);
      if (saveResult.isFailure) {
        return {
          success: false,
          error: saveResult.error?.message || 'Failed to save websites',
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to import websites: ${error instanceof Error ? error.message : 'Invalid data'}`,
      };
    }
  }
}
