/**
 * Domain Value Object: Website URL
 * Represents a validated website URL with business rules
 */

/**
 * Website URL value object
 * Encapsulates URL validation and normalization logic
 */
export class WebsiteUrl {
  private readonly value: string;

  constructor(url: string) {
    this.value = this.validate(url);
  }

  /**
   * Validate and normalize URL
   */
  private validate(url: string): string {
    if (!url || url.trim().length === 0) {
      throw new Error('URL cannot be empty');
    }

    const trimmed = url.trim();

    // Add protocol if missing
    let normalized = trimmed;
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }

    // Validate URL format
    try {
      const urlObj = new URL(normalized);

      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Only HTTP and HTTPS protocols are allowed');
      }

      // Additional validation for hostname
      if (!urlObj.hostname || urlObj.hostname.length === 0) {
        throw new Error('Invalid URL format: missing hostname');
      }

      // Check for valid hostname format (basic check)
      if (!/^[a-zA-Z0-9.-]+$/.test(urlObj.hostname)) {
        throw new Error('Invalid URL format: invalid hostname characters');
      }

      return urlObj.toString();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith('Only HTTP and HTTPS protocols are allowed')
      ) {
        throw error;
      }
      if (error instanceof Error && error.message.startsWith('Invalid URL format:')) {
        throw error;
      }
      throw new Error(
        `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get the URL value
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Get the domain from URL
   */
  public getDomain(): string {
    try {
      return new URL(this.value).hostname;
    } catch {
      return '';
    }
  }

  /**
   * Get the protocol from URL
   */
  public getProtocol(): string {
    try {
      return new URL(this.value).protocol;
    } catch {
      return '';
    }
  }

  /**
   * Check if URL is HTTPS
   */
  public isSecure(): boolean {
    return this.getProtocol() === 'https:';
  }

  /**
   * Check if URL matches a pattern (supports wildcards)
   */
  public matches(pattern: string): boolean {
    if (!pattern) return false;

    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
      .replace(/\\\*/g, '.*'); // Convert * to .*

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(this.value);
  }

  /**
   * Equality comparison
   */
  public equals(other: WebsiteUrl): boolean {
    return this.value === other.value;
  }

  /**
   * String representation
   */
  public toString(): string {
    return this.value;
  }

  /**
   * Create from string (factory method)
   */
  public static from(url: string): WebsiteUrl {
    return new WebsiteUrl(url);
  }

  /**
   * Create from optional string (returns undefined if empty)
   */
  public static fromOptional(url?: string): WebsiteUrl | undefined {
    if (!url || url.trim().length === 0) {
      return undefined;
    }
    return new WebsiteUrl(url);
  }
}
