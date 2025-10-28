/**
 * Domain Service: Input Pattern Service
 * Handles input pattern determination (business rules)
 *
 * Business Rules:
 * 1. Pattern 10: Basic input pattern - uses standard DOM manipulation
 * 2. Other patterns: Framework-agnostic pattern - handles React, Vue, Angular, etc.
 *
 * This service encapsulates the business logic for determining which input strategy to use
 * based on the pattern value.
 */

import { InputPattern } from '@domain/constants/InputPattern';

export class InputPatternService {
  /**
   * Determine if the pattern is a basic input pattern
   * Business rule: Pattern 10 is considered a basic pattern
   *
   * @param pattern - The input pattern number
   * @returns true if the pattern is basic (pattern 10)
   */
  isBasicPattern(pattern: number): boolean {
    return pattern === InputPattern.BASIC;
  }

  /**
   * Determine if the pattern is a framework-agnostic pattern
   * Business rule: Any pattern other than 10 is framework-agnostic
   *
   * @param pattern - The input pattern number
   * @returns true if the pattern is framework-agnostic (not pattern 10)
   */
  isFrameworkAgnosticPattern(pattern: number): boolean {
    return !this.isBasicPattern(pattern);
  }

  /**
   * Get a human-readable description of the input pattern
   * Business rule: Each pattern has a specific meaning and description
   *
   * @param pattern - The input pattern number
   * @returns A description of the input pattern
   */
  getPatternDescription(pattern: number): string {
    if (this.isBasicPattern(pattern)) {
      return 'Basic input pattern - standard DOM manipulation';
    }
    return 'Framework-agnostic pattern - handles React, Vue, Angular, etc.';
  }

  /**
   * Validate if a pattern is a valid input pattern
   * Business rule: Pattern must be a positive number
   *
   * @param pattern - The input pattern number
   * @returns true if the pattern is valid
   */
  isValidPattern(pattern: number): boolean {
    return Number.isInteger(pattern) && pattern > 0;
  }
}
