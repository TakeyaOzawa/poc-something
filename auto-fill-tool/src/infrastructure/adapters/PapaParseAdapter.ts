/**
 * Infrastructure Adapter: PapaParse Adapter
 * Wraps PapaParse library to implement CSVConverter interface
 * Follows clean architecture by depending on domain interfaces
 */

import {
  CSVConverter,
  CSVParseOptions,
  CSVGenerateOptions,
} from '@domain/types/csv-converter.types';
import { Logger } from '@domain/types/logger.types';
import Papa from 'papaparse';

export class PapaParseAdapter implements CSVConverter {
  constructor(private logger: Logger) {}

  async parse<T = any>(csvData: string, options?: CSVParseOptions): Promise<T[]> {
    try {
      this.logger.debug(`Parsing CSV data (${csvData.length} characters)`);

      const config: Papa.ParseConfig = {
        header: options?.header !== undefined ? options.header : true,
        delimiter: options?.delimiter || ',',
        skipEmptyLines: options?.skipEmptyLines !== undefined ? options.skipEmptyLines : true,
        transformHeader: options?.transformHeader,
        dynamicTyping: false, // Keep all values as strings for consistency
      };

      const result = Papa.parse<T>(csvData, config);

      if (result.errors.length > 0) {
        const errorMessages = result.errors.map((err) => err.message).join('; ');
        this.logger.error(`CSV parsing errors: ${errorMessages}`);
        throw new Error(`CSV parsing failed: ${errorMessages}`);
      }

      this.logger.debug(`Parsed ${result.data.length} rows from CSV`);

      return result.data;
    } catch (error) {
      this.logger.error('CSV parsing failed', error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Failed to parse CSV');
    }
  }

  async generate(data: any[], options?: CSVGenerateOptions): Promise<string> {
    try {
      this.logger.debug(`Generating CSV from ${data.length} rows`);

      if (data.length === 0) {
        this.logger.warn('Generating CSV from empty data array');
        return '';
      }

      const config: Papa.UnparseConfig = {
        delimiter: options?.delimiter || ',',
        header: options?.header !== undefined ? options.header : true,
        columns: options?.columns,
        quotes: options?.quotes !== undefined ? options.quotes : false,
      };

      const csv = Papa.unparse(data, config);

      this.logger.debug(`Generated CSV (${csv.length} characters)`);

      return csv;
    } catch (error) {
      this.logger.error('CSV generation failed', error);

      if (error instanceof Error) {
        throw new Error(`Failed to generate CSV: ${error.message}`);
      }

      throw new Error('Failed to generate CSV');
    }
  }

  isValidCSV(csvData: string): boolean {
    try {
      if (!csvData || csvData.trim().length === 0) {
        return false;
      }

      const result = Papa.parse(csvData, {
        preview: 10, // Only parse first 10 rows for validation
        skipEmptyLines: true,
      });

      // Consider it valid if there are no critical errors
      const hasCriticalErrors = result.errors.some((err) => err.type === 'Delimiter');

      return !hasCriticalErrors;
    } catch (error) {
      this.logger.debug('CSV validation failed');
      return false;
    }
  }
}
