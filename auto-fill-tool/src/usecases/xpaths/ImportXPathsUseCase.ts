/**
 * Use Case: Import XPaths from CSV
 * Accepts CSV string and converts to entities
 * Following Clean Architecture: depends on domain interface, not infrastructure
 */

import { XPathRepository } from '@domain/repositories/XPathRepository';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { XPathCSVConverter } from '@domain/types/csv-converter.types';

/**
 * Input DTO for ImportXPathsUseCase
 */
export interface ImportXPathsInput {
  csvText: string;
}

/**
 * Output DTO for ImportXPathsUseCase
 */
export interface ImportXPathsOutput {
  success: boolean;
  error?: string;
}

export class ImportXPathsUseCase {
  constructor(
    private xpathRepository: XPathRepository,
    private csvConverter: XPathCSVConverter,
    private websiteRepository?: WebsiteRepository
  ) {}

  async execute(input: ImportXPathsInput): Promise<ImportXPathsOutput> {
    try {
      const xpaths = this.csvConverter.fromCSV(input.csvText);
      const collection = new XPathCollection(xpaths);

      // Validate websiteId references if WebsiteRepository is provided
      if (this.websiteRepository) {
        const validationResult = await this.validateWebsiteReferences(xpaths);
        if (!validationResult.success) {
          return validationResult;
        }
      }

      const saveResult = await this.xpathRepository.save(collection);
      if (saveResult.isFailure) {
        return {
          success: false,
          error: `Failed to save XPaths: ${saveResult.error!.message}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to import XPaths: ${error instanceof Error ? error.message : 'Invalid data'}`,
      };
    }
  }

  /**
   * Validate that all websiteId references exist in the system
   * @returns Result indicating success or error
   */
  private async validateWebsiteReferences(
    xpaths: Array<{ websiteId: string; [key: string]: any }>
  ): Promise<ImportXPathsOutput> {
    // Get unique websiteIds from XPaths
    const websiteIds = [...new Set(xpaths.map((x) => x.websiteId).filter(Boolean))];

    if (websiteIds.length === 0) {
      return { success: true }; // No websiteId references to validate
    }

    // Load existing websites
    const loadResult = await this.websiteRepository!.load();
    if (loadResult.isFailure) {
      return {
        success: false,
        error: loadResult.error?.message || 'Failed to load websites for validation',
      };
    }

    const websiteCollection = loadResult.value!;
    const existingWebsiteIds = new Set(websiteCollection.getAll().map((w) => w.getId()));

    // Check for missing references
    const missingWebsiteIds = websiteIds.filter((id) => !existingWebsiteIds.has(id));

    if (missingWebsiteIds.length > 0) {
      return {
        success: false,
        error:
          `Cannot import XPaths: Referenced websites not found (${missingWebsiteIds.join(', ')}). ` +
          `Please import Websites CSV first, then import XPaths.`,
      };
    }

    return { success: true };
  }
}
