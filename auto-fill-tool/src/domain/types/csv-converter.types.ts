/**
 * Domain Service Interface: CSV Converter
 * Converts between CSV and JSON formats
 */

export interface CSVParseOptions {
  /**
   * Delimiter character (default: ',')
   */
  delimiter?: string;

  /**
   * Whether the first row contains headers (default: true)
   */
  header?: boolean;

  /**
   * Skip empty lines (default: true)
   */
  skipEmptyLines?: boolean;

  /**
   * Transform function to apply to each row
   */
  transformHeader?: (header: string) => string;
}

export interface CSVGenerateOptions {
  /**
   * Delimiter character (default: ',')
   */
  delimiter?: string;

  /**
   * Whether to include headers (default: true)
   */
  header?: boolean;

  /**
   * Custom header names (overrides object keys)
   */
  columns?: string[];

  /**
   * Quote character (default: '"')
   */
  quotes?: boolean;
}

export interface CSVConverter {
  /**
   * Parse CSV string to array of objects
   *
   * @param csvData CSV string to parse
   * @param options Parsing options
   * @returns Array of parsed objects
   * @throws Error if parsing fails
   *
   * @example
   * const csv = 'name,age\nAlice,25\nBob,30';
   * const result = await converter.parse(csv);
   * // Returns: [{name: 'Alice', age: '25'}, {name: 'Bob', age: '30'}]
   */
  parse<T = unknown>(csvData: string, options?: CSVParseOptions): Promise<T[]>;

  /**
   * Generate CSV string from array of objects
   *
   * @param data Array of objects to convert
   * @param options Generation options
   * @returns CSV string
   * @throws Error if generation fails
   *
   * @example
   * const data = [{name: 'Alice', age: 25}, {name: 'Bob', age: 30}];
   * const csv = await converter.generate(data);
   * // Returns: 'name,age\nAlice,25\nBob,30'
   */
  generate(data: unknown[], options?: CSVGenerateOptions): Promise<string>;

  /**
   * Validate if a string is valid CSV
   *
   * @param csvData CSV string to validate
   * @returns True if valid, false otherwise
   */
  isValidCSV(csvData: string): boolean;
}

/**
 * Specialized CSV Converters for domain entities
 */

import { AutomationVariablesData } from '@domain/entities/AutomationVariables';
import { WebsiteData } from '@domain/entities/Website';
import { XPathData } from '@domain/entities/XPathCollection';

export interface AutomationVariablesCSVConverter {
  toCSV(variables: AutomationVariablesData[]): string;
  fromCSV(csv: string): AutomationVariablesData[];
}

export interface WebsiteCSVConverter {
  toCSV(websites: WebsiteData[]): string;
  fromCSV(csv: string): WebsiteData[];
}

export interface XPathCSVConverter {
  toCSV(xpaths: XPathData[]): string;
  fromCSV(csv: string): XPathData[];
}
