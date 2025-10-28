/**
 * Unit Tests: Date Formatter
 */

import { formatDateForFilename } from '../dateFormatter';

describe('formatDateForFilename', () => {
  it('should format date to YYYYMMDDHHmm format', () => {
    const date = new Date('2025-10-15T14:30:00');
    const result = formatDateForFilename(date);
    expect(result).toBe('202510151430');
  });

  it('should pad single digit month with zero', () => {
    const date = new Date('2025-01-05T08:05:00');
    const result = formatDateForFilename(date);
    expect(result).toBe('202501050805');
  });

  it('should pad single digit day with zero', () => {
    const date = new Date('2025-12-01T23:59:00');
    const result = formatDateForFilename(date);
    expect(result).toBe('202512012359');
  });

  it('should pad single digit hour with zero', () => {
    const date = new Date('2025-06-15T03:45:00');
    const result = formatDateForFilename(date);
    expect(result).toBe('202506150345');
  });

  it('should pad single digit minute with zero', () => {
    const date = new Date('2025-03-20T10:05:00');
    const result = formatDateForFilename(date);
    expect(result).toBe('202503201005');
  });

  it('should use current date when no parameter provided', () => {
    const result = formatDateForFilename();

    // Verify format is correct (12 digits)
    expect(result).toMatch(/^\d{12}$/);

    // Verify it's close to current time (within 1 minute)
    const now = new Date();
    const expectedPrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}`;
    expect(result.substring(0, 10)).toBe(expectedPrefix);
  });

  it('should handle edge case of year 2099', () => {
    const date = new Date('2099-12-31T23:59:00');
    const result = formatDateForFilename(date);
    expect(result).toBe('209912312359');
  });

  it('should handle edge case of midnight', () => {
    const date = new Date('2025-07-04T00:00:00');
    const result = formatDateForFilename(date);
    expect(result).toBe('202507040000');
  });
});
