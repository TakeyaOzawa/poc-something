/**
 * Domain Service: URL Matching Service
 * Handles URL pattern matching logic (business rules)
 *
 * Business Rules:
 * 1. Supports exact match: URL must exactly equal the pattern
 * 2. Supports prefix match: URL starts with the pattern
 * 3. Supports regex match: Pattern with regex special characters
 *
 * Examples:
 * - "https://example.com" -> matches exactly or as prefix
 * - "https://example.com/.*" -> treated as regex
 * - "https://(www\.)?example\.com/page" -> treated as regex
 */

import { Logger } from '@domain/types/logger.types';
import { NoOpLogger } from '@domain/services/NoOpLogger';

export class URLMatchingService {
  constructor(private logger: Logger = new NoOpLogger()) {}

  /**
   * Match a URL against a pattern
   * Business rule: Supports exact, prefix, and regex matching
   *
   * @param url - The URL to match
   * @param pattern - The pattern to match against
   * @returns true if the URL matches the pattern
   */
  matches(url: string, pattern: string): boolean {
    if (!pattern) {
      return false;
    }

    try {
      // Business rule: If pattern looks like a regex, treat it as such
      if (this.isRegexPattern(pattern)) {
        const regex = new RegExp(pattern);
        const matched = regex.test(url);
        this.logger.debug(
          `[URL Matcher] Regex match: pattern="${pattern}", url="${url}", result=${matched}`
        );
        return matched;
      }

      // Business rule: Otherwise, do exact or prefix match
      const exactMatch = url === pattern;
      const prefixMatch = url.startsWith(pattern);
      const matched = exactMatch || prefixMatch;

      this.logger.debug(
        `[URL Matcher] String match: pattern="${pattern}", url="${url}", exact=${exactMatch}, prefix=${prefixMatch}`
      );
      return matched;
    } catch (error) {
      // If regex compilation fails, fall back to string comparison
      this.logger.error(`[URL Matcher] Error matching pattern "${pattern}"`, error);
      return url === pattern || url.startsWith(pattern);
    }
  }

  /**
   * Check if a pattern looks like a regular expression
   * Business rule: Patterns with special characters are treated as regex
   *
   * @param pattern - The pattern to check
   * @returns true if the pattern contains regex special characters
   */
  private isRegexPattern(pattern: string): boolean {
    // Business rule: Check for common regex special characters
    // Note: We exclude '/' and '?' as they are common in URLs
    const regexChars = /[.*+^${}()[\]\\|]/;
    return regexChars.test(pattern);
  }

  /**
   * Validate if a regex pattern is valid
   * Business rule: Empty patterns are valid, invalid regex patterns return error
   *
   * @param pattern - The pattern to validate
   * @returns Object with isValid flag and error message if invalid
   */
  validatePattern(pattern: string): { isValid: boolean; error?: string } {
    if (!pattern) {
      // Business rule: Empty pattern is valid (just won't match anything useful)
      return { isValid: true };
    }

    // If it doesn't look like a regex, it's a valid string pattern
    if (!this.isRegexPattern(pattern)) {
      return { isValid: true };
    }

    // Try to compile the regex
    try {
      new RegExp(pattern);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid regular expression',
      };
    }
  }
}
