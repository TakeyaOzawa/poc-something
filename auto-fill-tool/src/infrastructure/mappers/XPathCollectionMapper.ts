/**
 * Infrastructure Layer: XPath Collection Mapper
 * Handles serialization/deserialization of XPathCollection
 * Implements XPathCSVConverter interface for dependency inversion
 * Delegates default value logic to XPathDataFactory (Domain Layer)
 */

import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';
import { Logger } from '@domain/types/logger.types';
import { XPathCSVConverter } from '@domain/types/csv-converter.types';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { XPathDataFactory } from '@domain/factories/XPathDataFactory';
import { CSVValidationService } from '@domain/services/CSVValidationService';

export class XPathCollectionMapper implements XPathCSVConverter {
  /**
   * Convert XPathCollection to CSV string
   */
  static toCSV(collection: XPathCollection): string {
    const xpaths = collection.getAll();

    // CSV Header
    const header = [
      'id',
      'website_id',
      'value',
      'action_type',
      'after_wait_seconds',
      'action_pattern',
      'path_absolute',
      'path_short',
      'path_smart',
      'selected_path_pattern',
      'retry_type',
      'execution_order',
      'execution_timeout_seconds',
      'url',
    ].join(',');

    // CSV Rows
    const rows = xpaths.map((xpath) => {
      return [
        xpath.id,
        xpath.websiteId || '',
        this.escapeCSV(xpath.value),
        xpath.actionType,
        xpath.afterWaitSeconds,
        xpath.actionPattern ?? 0,
        this.escapeCSV(xpath.pathAbsolute),
        this.escapeCSV(xpath.pathShort),
        this.escapeCSV(xpath.pathSmart),
        xpath.selectedPathPattern,
        xpath.retryType,
        xpath.executionOrder,
        xpath.executionTimeoutSeconds,
        this.escapeCSV(xpath.url),
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Create XPathCollection from CSV string
   */
  static fromCSV(csv: string, logger: Logger = new NoOpLogger()): XPathCollection {
    const csvValidation = new CSVValidationService();

    // Validate CSV format using domain service
    const validationResult = csvValidation.validateCSVFormat(csv);
    if (!validationResult.isValid()) {
      throw new Error(validationResult.getError());
    }

    const lines = validationResult.getValue();

    // Skip header
    const dataLines = lines.slice(1);
    let collection = new XPathCollection();

    dataLines.forEach((line, index) => {
      collection = this.parseAndAddXPathLine(line, index, collection, logger, csvValidation);
    });

    return collection;
  }

  // eslint-disable-next-line max-params
  private static parseAndAddXPathLine(
    line: string,
    index: number,
    collection: XPathCollection,
    logger: Logger,
    csvValidation: CSVValidationService
  ): XPathCollection {
    try {
      const values = this.parseCSVLine(line);

      // Validate column count using domain service
      const validationResult = csvValidation.validateXPathCSVLine(values, index + 2);
      if (!validationResult.isValid()) {
        logger.warn(validationResult.getError());
        return collection;
      }

      const validatedValues = validationResult.getValue();
      const restoredXPath = this.buildXPathDataFromCSVValues(validatedValues);
      return collection.addWithId(restoredXPath);
    } catch (error) {
      logger.error(`Error parsing CSV line ${index + 2}`, error);
      return collection;
    }
  }

  private static buildXPathDataFromCSVValues(values: string[]): XPathData {
    // Delegate to domain factory for business rule defaults
    return XPathDataFactory.createFromCSVValues(values);
  }

  /**
   * Convert XPathCollection to JSON string
   */
  static toJSON(collection: XPathCollection): string {
    const data = collection.getAll().map((xpath) => {
      // Exclude id from export
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...exportData } = xpath;
      return exportData;
    });
    return JSON.stringify(data, null, 2);
  }

  /**
   * Create XPathCollection from JSON string
   */
  static fromJSON(json: string): XPathCollection {
    const data = JSON.parse(json) as Array<{
      websiteId?: string;
      value?: string;
      actionType?: string;
      afterWaitSeconds?: number;
      actionPattern?: number;
      pathAbsolute?: string;
      pathShort?: string;
      pathSmart?: string;
      selectedPathPattern?: string;
      retryType?: number;
      executionOrder?: number;
      executionTimeoutSeconds?: number;
      url?: string;
    }>;
    let collection = new XPathCollection();

    data.forEach((item) => {
      const xpathData = this.buildXPathDataFromJSON(item);
      collection = collection.add(xpathData);
    });

    return collection;
  }

  private static buildXPathDataFromJSON(item: any): Omit<XPathData, 'id'> {
    // Delegate to domain factory for business rule defaults
    return XPathDataFactory.createFromJSON(item);
  }

  /**
   * Convert array of XPathData to CSV string (for export use case)
   */
  static arrayToCSV(xpaths: XPathData[]): string {
    const collection = new XPathCollection(xpaths);
    return this.toCSV(collection);
  }

  /**
   * Parse CSV string to array of XPathData (for import use case)
   */
  static arrayFromCSV(csv: string, logger: Logger = new NoOpLogger()): XPathData[] {
    const collection = this.fromCSV(csv, logger);
    return collection.getAll();
  }

  /**
   * Instance method: Convert XPath array to CSV string
   * Implements XPathCSVConverter interface
   */
  toCSV(xpaths: XPathData[]): string {
    return XPathCollectionMapper.arrayToCSV(xpaths);
  }

  /**
   * Instance method: Convert CSV string to XPath array
   * Implements XPathCSVConverter interface
   */
  fromCSV(csv: string): XPathData[] {
    return XPathCollectionMapper.arrayFromCSV(csv);
  }

  // Private helper methods

  private static escapeCSV(value: string): string {
    if (!value) return '';

    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n');
    const escaped = value.replace(/"/g, '""');

    return needsQuotes ? `"${escaped}"` : escaped;
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current);

    return result;
  }
}
