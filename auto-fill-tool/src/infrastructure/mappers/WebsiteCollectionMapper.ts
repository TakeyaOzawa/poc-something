/**
 * Infrastructure Layer: Website Collection Mapper
 * Handles serialization/deserialization of Website collections
 * Implements WebsiteCSVConverter interface for dependency inversion
 */

import { WebsiteData } from '@domain/entities/Website';
import { Logger } from '@domain/types/logger.types';
import { WebsiteCSVConverter } from '@domain/types/csv-converter.types';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { CSVValidationService } from '@domain/services/CSVValidationService';

export class WebsiteCollectionMapper implements WebsiteCSVConverter {
  constructor(private logger: Logger = new NoOpLogger()) {}
  /**
   * Convert array of WebsiteData to CSV string
   */
  static toCSV(websites: WebsiteData[]): string {
    // CSV Header
    const header = ['id', 'name', 'start_url', 'updated_at', 'editable'].join(',');

    // CSV Rows
    const rows = websites.map((website) => {
      return [
        this.escapeCSV(website.id),
        this.escapeCSV(website.name),
        this.escapeCSV(website.startUrl || ''),
        this.escapeCSV(website.updatedAt),
        this.escapeCSV(website.editable ? 'true' : 'false'),
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Create array of WebsiteData from CSV string
   */
  static fromCSV(csv: string, logger: Logger = new NoOpLogger()): WebsiteData[] {
    const csvValidation = new CSVValidationService();

    // Validate CSV format using domain service
    const validationResult = csvValidation.validateCSVFormat(csv);
    if (!validationResult.isValid()) {
      throw new Error(validationResult.getError());
    }

    const lines = validationResult.getValue();

    // Skip header
    const dataLines = lines.slice(1);
    const websites: WebsiteData[] = [];

    dataLines.forEach((line, index) => {
      try {
        const values = this.parseCSVLine(line);

        // Validate column count using domain service
        const columnValidation = csvValidation.validateWebsiteCSVLine(values, index + 2);
        if (!columnValidation.isValid()) {
          logger.warn(columnValidation.getError());
          return;
        }

        const validatedValues = columnValidation.getValue();

        const website: WebsiteData = {
          id: validatedValues[0] || '',
          name: validatedValues[1] || '',
          updatedAt: validatedValues[3] || new Date().toISOString(),
          editable: validatedValues[4] === 'true',
        };

        if (validatedValues[2]) {
          website.startUrl = validatedValues[2];
        }

        websites.push(website);
      } catch (error) {
        logger.error(`Error parsing CSV line ${index + 2}`, error);
      }
    });

    return websites;
  }

  /**
   * Instance method: Convert Website array to CSV string
   * Implements WebsiteCSVConverter interface
   */
  toCSV(websites: WebsiteData[]): string {
    return WebsiteCollectionMapper.toCSV(websites);
  }

  /**
   * Instance method: Convert CSV string to Website array
   * Implements WebsiteCSVConverter interface
   */
  fromCSV(csv: string): WebsiteData[] {
    return WebsiteCollectionMapper.fromCSV(csv, this.logger);
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
