/**
 * Use Case: Export XPaths to CSV
 * Returns CSV string for download
 * Following Clean Architecture: depends on domain interface, not infrastructure
 */

import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathCSVConverter } from '@domain/types/csv-converter.types';

/**
 * Output DTO for ExportXPathsUseCase
 */
export interface ExportXPathsOutput {
  csv: string;
}

export class ExportXPathsUseCase {
  constructor(
    private xpathRepository: XPathRepository,
    private csvConverter: XPathCSVConverter
  ) {}

  async execute(): Promise<ExportXPathsOutput> {
    const collectionResult = await this.xpathRepository.load();
    if (collectionResult.isFailure) {
      throw collectionResult.error!;
    }
    const collection = collectionResult.value!;
    const xpaths = collection.getAll();
    return { csv: this.csvConverter.toCSV(xpaths) };
  }
}
