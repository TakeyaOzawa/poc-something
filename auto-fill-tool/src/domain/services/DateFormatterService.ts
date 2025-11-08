/**
 * Domain Service: Date Formatter
 * Provides consistent date formatting across the application
 *
 * This service encapsulates date formatting business rules and ensures
 * consistent date representation throughout the domain.
 */

/**
 * Domain service for date formatting operations
 */
export class DateFormatterService {
  /**
   * Format date to YYYYMMDDHHmm format for filename usage
   * @param date - Date to format (defaults to current date)
   * @returns Formatted date string
   * @example
   * const service = new DateFormatterService();
   * service.formatForFilename(new Date('2025-10-15T14:30:00'))
   * // Returns: '202510151430'
   */
  public formatForFilename(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}`;
  }

  /**
   * Format date to ISO string
   * @param date - Date to format
   * @returns ISO formatted date string
   */
  public formatToIso(date: Date): string {
    return date.toISOString();
  }

  /**
   * Format date for display purposes
   * @param date - Date to format
   * @returns Human-readable date string
   */
  public formatForDisplay(date: Date): string {
    return date.toLocaleString();
  }
}
