/**
 * Domain Service: CSV Format Detector
 * Detects the type of CSV file based on its header
 */

/**
 * CSV Format Constants
 */
export const CSV_FORMAT = {
  XPATHS: 'xpaths',
  WEBSITES: 'websites',
  AUTOMATION_VARIABLES: 'automation_variables',
  UNKNOWN: 'unknown',
} as const;

export type CSVFormat = (typeof CSV_FORMAT)[keyof typeof CSV_FORMAT];

export class CSVFormatDetectorService {
  /**
   * Detect CSV format from content
   */
  static detectFormat(csvText: string): CSVFormat {
    const firstLine = csvText.split('\n')[0]?.trim();

    if (!firstLine) {
      return CSV_FORMAT.UNKNOWN;
    }

    // Check for Websites CSV
    if (firstLine.includes('id,name,status,start_url,variables,updated_at,editable')) {
      return CSV_FORMAT.WEBSITES;
    }

    // Check for XPaths CSV
    if (firstLine.includes('id,value,action_type,url,execution_order,selected_path_pattern')) {
      return CSV_FORMAT.XPATHS;
    }

    // Check for Automation Variables CSV
    if (firstLine.includes('"status","updatedAt","variables","websiteId"')) {
      return CSV_FORMAT.AUTOMATION_VARIABLES;
    }

    return CSV_FORMAT.UNKNOWN;
  }

  /**
   * Validate if CSV format is known
   */
  static isValidFormat(format: CSVFormat): boolean {
    return format !== CSV_FORMAT.UNKNOWN;
  }

  /**
   * Get human-readable format name
   */
  static getFormatName(format: CSVFormat): string {
    switch (format) {
      case CSV_FORMAT.XPATHS:
        return 'XPaths';
      case CSV_FORMAT.WEBSITES:
        return 'Websites';
      case CSV_FORMAT.AUTOMATION_VARIABLES:
        return 'Automation Variables';
      default:
        return 'Unknown';
    }
  }
}
