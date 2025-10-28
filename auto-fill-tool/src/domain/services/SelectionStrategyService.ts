/**
 * Domain Service: Selection Strategy Service
 * Handles option selection logic for select elements with various strategies
 * This is business logic and belongs in the domain layer.
 */

import { SelectionStrategy, SELECTION_STRATEGY } from '@domain/constants/SelectionStrategy';

/**
 * Generic option type (not tied to DOM)
 */
export interface SelectOption {
  value: string;
  text: string;
}

export class SelectionStrategyService {
  /**
   * Find the index of an option based on the selection strategy
   * @param options Array of options to search
   * @param searchValue The value to search for
   * @param strategy The selection strategy to use
   * @returns The index of the matching option, or -1 if not found
   */
  findOptionIndex(
    options: SelectOption[],
    searchValue: string,
    strategy: SelectionStrategy
  ): number {
    switch (strategy) {
      case SELECTION_STRATEGY.BY_VALUE:
        return this.findByValue(options, searchValue);
      case SELECTION_STRATEGY.BY_INDEX:
        return this.findByIndex(options, searchValue);
      case SELECTION_STRATEGY.BY_TEXT:
        return this.findByTextPartial(options, searchValue);
      case SELECTION_STRATEGY.BY_TEXT_EXACT:
        return this.findByTextExact(options, searchValue);
      default:
        return -1;
    }
  }

  /**
   * Find option by value attribute
   * Business rule: Exact match on value property
   */
  private findByValue(options: SelectOption[], value: string): number {
    return options.findIndex((opt) => opt.value === value);
  }

  /**
   * Find option by index
   * Business rule: Parse as integer and validate bounds
   */
  private findByIndex(options: SelectOption[], indexStr: string): number {
    const index = parseInt(indexStr, 10);

    // Business rule: Index must be valid integer within bounds
    if (isNaN(index) || index < 0 || index >= options.length) {
      return -1;
    }

    return index;
  }

  /**
   * Find option by partial text match
   * Business rule: Case-sensitive substring match
   */
  private findByTextPartial(options: SelectOption[], text: string): number {
    return options.findIndex((opt) => opt.text.includes(text));
  }

  /**
   * Find option by exact text match
   * Business rule: Exact case-sensitive match on text property
   */
  private findByTextExact(options: SelectOption[], text: string): number {
    return options.findIndex((opt) => opt.text === text);
  }
}
