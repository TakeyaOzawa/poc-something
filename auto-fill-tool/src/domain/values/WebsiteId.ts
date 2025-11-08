/**
 * Domain Value Object: Website ID
 * Represents a validated website identifier with business rules
 */

/**
 * Website ID value object
 * Encapsulates website ID validation and utility methods
 */
export class WebsiteId {
  private readonly value: string;

  // Business constants
  public static readonly MIN_LENGTH = 1;
  public static readonly MAX_LENGTH = 100;
  private static readonly VALID_PATTERN = /^[a-zA-Z0-9_-]+$/;

  constructor(id: string) {
    this.value = this.validate(id);
  }

  /**
   * Validate website ID
   */
  private validate(id: string): string {
    if (!id || typeof id !== 'string') {
      throw new Error('Website ID must be a non-empty string');
    }

    const trimmed = id.trim();

    if (trimmed.length < WebsiteId.MIN_LENGTH) {
      throw new Error(`Website ID must be at least ${WebsiteId.MIN_LENGTH} character long`);
    }

    if (trimmed.length > WebsiteId.MAX_LENGTH) {
      throw new Error(`Website ID must be at most ${WebsiteId.MAX_LENGTH} characters long`);
    }

    if (!WebsiteId.VALID_PATTERN.test(trimmed)) {
      throw new Error('Website ID can only contain letters, numbers, underscores, and hyphens');
    }

    return trimmed;
  }

  /**
   * Get the ID value
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Check if ID is numeric
   */
  public isNumeric(): boolean {
    return /^\d+$/.test(this.value);
  }

  /**
   * Check if ID contains only letters
   */
  public isAlphabetic(): boolean {
    return /^[a-zA-Z]+$/.test(this.value);
  }

  /**
   * Check if ID is alphanumeric
   */
  public isAlphanumeric(): boolean {
    return /^[a-zA-Z0-9]+$/.test(this.value);
  }

  /**
   * Get ID length
   */
  public getLength(): number {
    return this.value.length;
  }

  /**
   * Check if ID starts with prefix
   */
  public startsWith(prefix: string): boolean {
    return this.value.startsWith(prefix);
  }

  /**
   * Check if ID ends with suffix
   */
  public endsWith(suffix: string): boolean {
    return this.value.endsWith(suffix);
  }

  /**
   * Check if ID contains substring
   */
  public contains(substring: string): boolean {
    return this.value.includes(substring);
  }

  /**
   * Get ID in uppercase
   */
  public toUpperCase(): string {
    return this.value.toUpperCase();
  }

  /**
   * Get ID in lowercase
   */
  public toLowerCase(): string {
    return this.value.toLowerCase();
  }

  /**
   * Equality comparison
   */
  public equals(other: WebsiteId): boolean {
    return this.value === other.value;
  }

  /**
   * Case-insensitive equality comparison
   */
  public equalsIgnoreCase(other: WebsiteId): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
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
  public static from(id: string): WebsiteId {
    return new WebsiteId(id);
  }

  /**
   * Generate a new unique ID
   */
  public static generate(): WebsiteId {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return new WebsiteId(`${timestamp}_${random}`);
  }

  /**
   * Create from name (sanitize and convert)
   */
  public static fromName(name: string): WebsiteId {
    if (!name || typeof name !== 'string') {
      throw new Error('Name must be a non-empty string');
    }

    // Sanitize name to create valid ID
    let sanitized = name
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

    if (sanitized.length === 0) {
      // If sanitization results in empty string, generate ID
      return WebsiteId.generate();
    }

    // Truncate if too long
    if (sanitized.length > WebsiteId.MAX_LENGTH) {
      sanitized = sanitized.substring(0, WebsiteId.MAX_LENGTH);
    }

    return new WebsiteId(sanitized);
  }

  /**
   * Validate ID string without creating instance
   */
  public static isValid(id: string): boolean {
    try {
      new WebsiteId(id);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get validation error message for invalid ID
   */
  public static getValidationError(id: string): string | null {
    try {
      new WebsiteId(id);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Invalid website ID';
    }
  }
}
