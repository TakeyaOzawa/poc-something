/**
 * Use Case: Import CSV
 * Imports CSV data and stores it in Chrome storage
 */

import { CSVConverter, CSVParseOptions } from '@domain/types/csv-converter.types';
import { Logger } from '@domain/types/logger.types';

export interface ImportCSVInput {
  /**
   * CSV data as string
   */
  csvData: string;

  /**
   * Storage key where the parsed data will be stored
   */
  storageKey: string;

  /**
   * Optional CSV parsing options
   */
  parseOptions?: CSVParseOptions;

  /**
   * If true, merge with existing data instead of replacing
   */
  mergeWithExisting?: boolean;
}

export interface ImportCSVOutput {
  success: boolean;
  importedCount?: number;
  mergedCount?: number;
  error?: string;
}

export class ImportCSVUseCase {
  constructor(
    private csvConverter: CSVConverter,
    private logger: Logger
  ) {}

  async execute(input: ImportCSVInput): Promise<ImportCSVOutput> {
    try {
      this.logger.info(`Importing CSV data to storage key: ${input.storageKey}`);

      // Validate CSV data
      const validationError = this.validateCSVData(input.csvData);
      if (validationError) {
        return validationError;
      }

      // Parse CSV data
      const parseResult = await this.parseCSVData(input.csvData, input.parseOptions);
      if (!parseResult.success || !parseResult.data) {
        return parseResult.output!;
      }

      // Merge with existing data if requested
      const mergeResult = await this.mergeWithExistingData(
        parseResult.data,
        input.storageKey,
        input.mergeWithExisting
      );

      // Store data in Chrome storage
      await this.setStorageData(input.storageKey, mergeResult.dataToStore);

      this.logger.info(
        `Successfully imported ${parseResult.data.length} rows to storage key: ${input.storageKey}`
      );

      return {
        success: true,
        importedCount: parseResult.data.length,
        mergedCount: mergeResult.mergedCount || 0,
      };
    } catch (error) {
      this.logger.error('Failed to import CSV', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import CSV data',
      };
    }
  }

  private validateCSVData(csvData: string): ImportCSVOutput | null {
    if (!csvData || csvData.trim().length === 0) {
      this.logger.warn('Empty CSV data provided');
      return {
        success: false,
        error: 'CSV data is empty',
      };
    }

    if (!this.csvConverter.isValidCSV(csvData)) {
      this.logger.warn('Invalid CSV format');
      return {
        success: false,
        error: 'Invalid CSV format',
      };
    }

    return null;
  }

  private async parseCSVData(
    csvData: string,
    parseOptions?: CSVParseOptions
  ): Promise<{ success: boolean; data?: unknown[]; output?: ImportCSVOutput }> {
    this.logger.debug('Parsing CSV data');
    const parsedData = await this.csvConverter.parse(csvData, parseOptions);

    if (!parsedData || parsedData.length === 0) {
      this.logger.warn('No data parsed from CSV');
      return {
        success: false,
        output: {
          success: false,
          error: 'No data found in CSV',
        },
      };
    }

    this.logger.debug(`Parsed ${parsedData.length} rows from CSV`);

    return {
      success: true,
      data: parsedData,
    };
  }

  private async mergeWithExistingData(
    parsedData: unknown[],
    storageKey: string,
    shouldMerge?: boolean
  ): Promise<{ dataToStore: unknown[]; mergedCount: number }> {
    if (!shouldMerge) {
      return {
        dataToStore: parsedData,
        mergedCount: 0,
      };
    }

    this.logger.debug('Merging with existing data');
    const existingData = await this.getStorageData(storageKey);

    if (existingData && Array.isArray(existingData)) {
      this.logger.debug(
        `Merged ${parsedData.length} new rows with ${existingData.length} existing rows`
      );
      return {
        dataToStore: [...existingData, ...parsedData],
        mergedCount: existingData.length,
      };
    }

    return {
      dataToStore: parsedData,
      mergedCount: 0,
    };
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

  /**
   * Sets data in Chrome storage
   */
  private async setStorageData(key: string, data: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: data }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
}
