/**
 * Utility: Date Formatter
 * Provides consistent date formatting across the application
 */

/**
 * Format date to YYYYMMDDHHmm format
 * @param date - Date to format (defaults to current date)
 * @returns Formatted date string
 * @example
 * formatDateForFilename(new Date('2025-10-15T14:30:00'))
 * // Returns: '202510151430'
 */
export function formatDateForFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}`;
}
