/**
 * Domain Service: Variable Substitution Service
 * Centralizes variable substitution business logic
 */

import { VariableCollection } from '@domain/entities/Variable';
import { XPathData } from '@domain/entities/XPathCollection';
import { ValidationResult } from '@domain/values/validation-result.value';

/**
 * Service for handling variable substitution in text and XPath data
 * Consolidates variable replacement logic from VariableCollection and ChromeAutoFillAdapter
 */
export class VariableSubstitutionService {
  /**
   * Variable reference pattern: {{variable_name}}
   */
  private static readonly VARIABLE_PATTERN = /\{\{([a-zA-Z0-9_-]+)\}\}/g;

  /**
   * Replace all variable references in text with their values
   * Variables are in the format {{variable_name}}
   *
   * @param text Text containing variable references
   * @param variables Variable collection containing values
   * @returns Text with all variable references replaced
   *
   * @example
   * ```typescript
   * const variables = new VariableCollection();
   * variables.add({ name: 'username', value: 'john' });
   * const result = service.replaceVariables('Hello {{username}}!', variables);
   * // result: 'Hello john!'
   * ```
   */
  replaceVariables(text: string, variables: VariableCollection): string {
    let result = text;
    const allVariables = variables.getAll();

    for (const variable of allVariables) {
      const pattern = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
      result = result.replace(pattern, variable.value);
    }

    return result;
  }

  /**
   * Extract all variable references from text
   * Returns an array of variable names (without the {{}} delimiters)
   *
   * @param text Text containing variable references
   * @returns Array of unique variable names
   *
   * @example
   * ```typescript
   * const refs = service.extractVariableReferences('{{user}} and {{user}} and {{pass}}');
   * // refs: ['user', 'pass']
   * ```
   */
  extractVariableReferences(text: string): string[] {
    const matches = text.matchAll(VariableSubstitutionService.VARIABLE_PATTERN);
    const variableNames = new Set<string>();

    for (const match of matches) {
      if (match[1]) {
        variableNames.add(match[1]);
      }
    }

    return Array.from(variableNames);
  }

  /**
   * Validate that all variable references in text exist in the variable collection
   *
   * @param text Text containing variable references
   * @param variables Variable collection to validate against
   * @returns ValidationResult indicating success or failure with error message
   *
   * @example
   * ```typescript
   * const variables = new VariableCollection();
   * variables.add({ name: 'username', value: 'john' });
   * const result = service.validateVariableReferences('Hello {{username}} {{missing}}!', variables);
   * // result.isValid() === false
   * // result.getError() === 'Undefined variables: missing'
   * ```
   */
  validateVariableReferences(text: string, variables: VariableCollection): ValidationResult<void> {
    const references = this.extractVariableReferences(text);
    const undefinedVariables: string[] = [];

    for (const varName of references) {
      const variable = variables.get(varName);
      if (!variable) {
        undefinedVariables.push(varName);
      }
    }

    if (undefinedVariables.length > 0) {
      return ValidationResult.failure<void>(
        `Undefined variables: ${undefinedVariables.join(', ')}`
      );
    }

    return ValidationResult.success<void>(undefined as void);
  }

  /**
   * Replace all variable references in XPathData fields
   * Applies variable substitution to: value, pathShort, pathAbsolute, pathSmart, url
   *
   * @param xpath XPathData to process
   * @param variables Variable collection containing values
   * @returns New XPathData with variables replaced
   *
   * @example
   * ```typescript
   * const variables = new VariableCollection();
   * variables.add({ name: 'userId', value: '123' });
   * const xpath = {
   *   value: '{{userId}}',
   *   pathShort: '//input[@id="user-{{userId}}"]',
   *   // ...other fields
   * };
   * const result = service.replaceInXPathData(xpath, variables);
   * // result.value: '123'
   * // result.pathShort: '//input[@id="user-123"]'
   * ```
   */
  replaceInXPathData(xpath: XPathData, variables: VariableCollection): XPathData {
    return {
      ...xpath,
      value: this.replaceVariables(xpath.value, variables),
      pathShort: this.replaceVariables(xpath.pathShort, variables),
      pathAbsolute: this.replaceVariables(xpath.pathAbsolute, variables),
      pathSmart: this.replaceVariables(xpath.pathSmart, variables),
      url: this.replaceVariables(xpath.url, variables),
    };
  }

  /**
   * Check if text contains any variable references
   *
   * @param text Text to check
   * @returns true if text contains at least one variable reference
   */
  hasVariableReferences(text: string): boolean {
    return VariableSubstitutionService.VARIABLE_PATTERN.test(text);
  }

  /**
   * Count the number of variable references in text
   *
   * @param text Text to analyze
   * @returns Number of variable references found
   */
  countVariableReferences(text: string): number {
    const matches = text.matchAll(VariableSubstitutionService.VARIABLE_PATTERN);
    return Array.from(matches).length;
  }
}
