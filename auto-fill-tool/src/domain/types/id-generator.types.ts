/**
 * Domain Port: ID Generator
 * Provides unique identifier generation functionality
 */

export interface IdGenerator {
  /**
   * Generate a unique identifier
   * @returns A unique string identifier
   */
  generate(): string;
}
