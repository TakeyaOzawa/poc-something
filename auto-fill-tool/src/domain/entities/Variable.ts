/**
 * Domain Layer: Variable Entity
 * Represents a variable that can be used in auto-fill steps
 */

import { Logger } from '@domain/types/logger.types';
import { NoOpLogger } from '@domain/services/NoOpLogger';

export interface Variable {
  name: string;
  value: string;
}

export class VariableCollection {
  private variables: Map<string, Variable>;

  constructor() {
    this.variables = new Map();
  }

  add(variable: Variable): void {
    this.validateVariable(variable);
    this.variables.set(variable.name, variable);
  }

  /**
   * Validate a variable
   * @throws Error if variable is invalid
   */
  private validateVariable(variable: Variable): void {
    // Validate name
    if (!variable.name || variable.name.trim() === '') {
      throw new Error('Variable name must not be empty');
    }

    // Variable name must start with letter or underscore, followed by letters, digits, or underscores
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable.name)) {
      throw new Error(
        'Variable name must start with a letter or underscore, and contain only letters, digits, and underscores'
      );
    }

    // Validate value type
    if (typeof variable.value !== 'string') {
      throw new Error('Variable value must be a string');
    }
  }

  get(name: string): Variable | undefined {
    return this.variables.get(name);
  }

  getAll(): Variable[] {
    return Array.from(this.variables.values());
  }

  delete(name: string): boolean {
    return this.variables.delete(name);
  }

  clear(): void {
    this.variables.clear();
  }

  /**
   * Clone this collection
   */
  clone(): VariableCollection {
    const cloned = new VariableCollection();
    this.variables.forEach((variable) => {
      cloned.add({ ...variable });
    });
    return cloned;
  }

  /**
   * Replace variables in a string
   * Variables are in the format {{variable_name}}
   */
  replaceVariables(text: string): string {
    let result = text;
    this.variables.forEach((variable) => {
      const pattern = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
      result = result.replace(pattern, variable.value);
    });
    return result;
  }

  /**
   * Export to JSON
   */
  toJSON(): string {
    const variables = this.getAll();
    return JSON.stringify(variables, null, 2);
  }

  /**
   * Import from JSON
   * Invalid variables are skipped and logged
   */
  static fromJSON(json: string, logger: Logger = new NoOpLogger()): VariableCollection {
    const collection = new VariableCollection();
    try {
      const variables = JSON.parse(json) as Variable[];
      variables.forEach((variable) => {
        try {
          collection.add(variable);
        } catch (error) {
          // Skip invalid variable and continue with the rest
          logger.error('Skipped invalid variable during JSON import', { variable, error });
        }
      });
    } catch (error) {
      logger.error('Failed to parse variables JSON', error);
    }
    return collection;
  }
}
