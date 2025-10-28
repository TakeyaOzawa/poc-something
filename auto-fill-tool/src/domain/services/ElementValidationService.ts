/**
 * Domain Layer: Element Validation Service
 * Handles DOM element validation logic
 * Note: This service defines validation rules in the domain layer,
 * but actual DOM type checking must be done in infrastructure layer
 * where HTMLElement types are available.
 *
 * Business Rules:
 * - Select elements must be HTMLSelectElement instances
 * - Custom select components (pattern type 2) are not yet supported
 * - jQuery select components (pattern type 3) are not yet supported
 */

import { ValidationResult } from '@domain/values/validation-result.value';

/**
 * Result of element validation
 */
export interface ElementValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Element Validation Service
 * Centralizes element validation logic that was scattered across executors
 */
export class ElementValidationService {
  /**
   * Validate that element exists
   * Business Rule: Element must be non-null to proceed with action execution
   * @param element Element to validate (unknown type for infrastructure independence)
   * @returns ValidationResult containing element or error message
   */
  validateElementExists<T>(element: T | null | undefined): ValidationResult<T> {
    if (!element) {
      return ValidationResult.failure('Element not found');
    }

    return ValidationResult.success(element);
  }

  /**
   * Determine select element type from pattern
   * Business Rule: Pattern encoding determines select component type
   * - Pattern % 100 / 10 = 1: Native select (HTMLSelectElement)
   * - Pattern % 100 / 10 = 2: Custom select component
   * - Pattern % 100 / 10 = 3: jQuery select component
   * @param pattern Action pattern number
   * @returns Select type code (1, 2, or 3)
   */
  getSelectTypeFromPattern(pattern: number): number {
    return Math.floor((pattern % 100) / 10);
  }

  /**
   * Validate select element type based on pattern
   * Business Rule: Only native select elements (type 1) are fully supported
   * @param isHTMLSelectElement Whether element is HTMLSelectElement (from infrastructure)
   * @param pattern Action pattern number
   * @returns ElementValidationResult
   */
  validateSelectElement(isHTMLSelectElement: boolean, pattern: number): ElementValidationResult {
    if (isHTMLSelectElement) {
      return { isValid: true, message: '' };
    }

    const customType = this.getSelectTypeFromPattern(pattern);

    if (customType === 2) {
      return {
        isValid: false,
        message: 'Custom select component support not yet implemented',
      };
    }

    if (customType === 3) {
      return { isValid: false, message: 'jQuery select component support not yet implemented' };
    }

    return { isValid: false, message: 'Element is not a select element' };
  }

  /**
   * Extract value from element based on element type
   * Business Rule: Value extraction depends on element type
   * - Input checkbox/radio: '1' if checked, '0' if unchecked
   * - Input (other types): element.value
   * - Textarea/Select: element.value
   * - Other elements: textContent (trimmed)
   *
   * Note: This method defines the extraction rule, but actual extraction
   * must be implemented in infrastructure layer with real DOM types
   *
   * @param params Object containing element properties
   * @returns Processed value according to business rules
   */
  processExtractedValue(params: {
    elementType: 'input' | 'textarea' | 'select' | 'other';
    inputType?: string;
    value?: string;
    checked?: boolean;
    textContent?: string;
  }): string {
    const { elementType, inputType, value, checked, textContent } = params;
    if (elementType === 'input') {
      if (inputType === 'checkbox' || inputType === 'radio') {
        return checked ? '1' : '0';
      }
      return value || '';
    }

    if (elementType === 'textarea' || elementType === 'select') {
      return value || '';
    }

    return textContent?.trim() || '';
  }
}
