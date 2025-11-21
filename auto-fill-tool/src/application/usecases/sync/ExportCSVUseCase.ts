/**
 * Use Case: Export CSV
 * Exports data from Chrome storage as CSV
 */

import { CSVConverter, CSVGenerateOptions } from '@domain/types/csv-converter.types';
import { Logger } from '@domain/types/logger.types';

export interface ExportCSVInput {
  /**
   * Storage key to export data from
   */
  storageKey: string;

  /**
   * Optional CSV generation options
   */
  generateOptions?: CSVGenerateOptions;
}

export interface ExportCSVOutput {
  success: boolean;
  csvData?: string;
  exportedCount?: number;
  error?: string;
}

export class ExportCSVUseCase {
  constructor(
    private csvConverter: CSVConverter,
    private logger: Logger
  ) {}

  async execute(input: ExportCSVInput): Promise<ExportCSVOutput> {
    try {
      this.logger.info(`Exporting data from storage key: ${input.storageKey}`);

      // Get data from Chrome storage
      const data = await this.getStorageData(input.storageKey);

      if (!data) {
        this.logger.warn(`No data found for storage key: ${input.storageKey}`);
        return {
          success: false,
          error: `No data found for storage key: ${input.storageKey}`,
        };
      }

      // Validate data is an array
      if (!Array.isArray(data)) {
        this.logger.warn('Data is not an array, wrapping in array');
        return {
          success: false,
          error: 'Data must be an array to export as CSV',
        };
      }

      if (data.length === 0) {
        this.logger.warn('Data array is empty');
        return {
          success: false,
          error: 'No data to export',
        };
      }

      this.logger.debug(`Found ${data.length} rows to export`);

      // Generate CSV
      const csvData = await this.csvConverter.generate(data, input.generateOptions);

      this.logger.info(
        `Successfully exported ${data.length} rows from storage key: ${input.storageKey}`
      );

      return {
        success: true,
        csvData,
        exportedCount: data.length,
      };
    } catch (error) {
      this.logger.error('Failed to export CSV', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export CSV data',
      };
    }
  }

  /**
   * Gets data from Chrome storage
   */
  private async getStorageData(key: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result[key]);
        }
      });
    });
  }
}
