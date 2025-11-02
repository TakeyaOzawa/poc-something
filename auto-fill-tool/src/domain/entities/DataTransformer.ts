/**
 * Domain Entity: Data Transformer
 * Defines data transformation rules and logic for sync operations
 */

export type TransformationType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'object'
  | 'custom';

export type TransformationFunction = (value: any, context?: any) => any;

export interface FieldTransformationRule {
  sourceField: string;
  targetField: string;
  type?: TransformationType;
  required?: boolean;
  defaultValue?: any;
  transformFunction?: string; // Serializable function name
  validationRules?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  errorMessage?: string;
}

export interface DataTransformerData {
  id: string;
  name: string;
  description?: string;
  transformationRules: FieldTransformationRule[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * DataTransformer Entity
 * Manages transformation rules for converting data between formats
 */
export class DataTransformer {
  private constructor(private data: DataTransformerData) {}

  /**
   * Create a new DataTransformer
   */
  static create(params: {
    name: string;
    description?: string;
    transformationRules?: FieldTransformationRule[];
    enabled?: boolean;
  }): DataTransformer {
    const now = new Date().toISOString();

    return new DataTransformer({
      id: `transformer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: params.name,
      description: params.description || '',
      transformationRules: params.transformationRules || [],
      enabled: params.enabled !== undefined ? params.enabled : true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Restore from data
   */
  static fromData(data: DataTransformerData): DataTransformer {
    return new DataTransformer({ ...data });
  }

  /**
   * Convert to plain data
   */
  toData(): DataTransformerData {
    return { ...this.data };
  }

  // Getters
  getId(): string {
    return this.data.id;
  }

  getName(): string {
    return this.data.name;
  }

  getDescription(): string | undefined {
    return this.data.description;
  }

  getTransformationRules(): FieldTransformationRule[] {
    return [...this.data.transformationRules];
  }

  isEnabled(): boolean {
    return this.data.enabled;
  }

  getCreatedAt(): string {
    return this.data.createdAt;
  }

  getUpdatedAt(): string {
    return this.data.updatedAt;
  }

  // Setters (return new instance for immutability)
  setName(name: string): DataTransformer {
    return new DataTransformer({
      ...this.data,
      name,
      updatedAt: new Date().toISOString(),
    });
  }

  setDescription(description: string): DataTransformer {
    return new DataTransformer({
      ...this.data,
      description,
      updatedAt: new Date().toISOString(),
    });
  }

  setTransformationRules(rules: FieldTransformationRule[]): DataTransformer {
    return new DataTransformer({
      ...this.data,
      transformationRules: rules,
      updatedAt: new Date().toISOString(),
    });
  }

  addTransformationRule(rule: FieldTransformationRule): DataTransformer {
    return new DataTransformer({
      ...this.data,
      transformationRules: [...this.data.transformationRules, rule],
      updatedAt: new Date().toISOString(),
    });
  }

  removeTransformationRule(sourceField: string): DataTransformer {
    return new DataTransformer({
      ...this.data,
      transformationRules: this.data.transformationRules.filter(
        (rule) => rule.sourceField !== sourceField
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  setEnabled(enabled: boolean): DataTransformer {
    return new DataTransformer({
      ...this.data,
      enabled,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Transform data based on configured rules
   */
  transform(sourceData: Record<string, any>): Record<string, any> {
    if (!this.data.enabled) {
      return sourceData;
    }

    const result: Record<string, any> = {};

    for (const rule of this.data.transformationRules) {
      const sourceValue = this.getNestedValue(sourceData, rule.sourceField);

      // Handle required fields
      if (rule.required && (sourceValue === undefined || sourceValue === null)) {
        if (rule.defaultValue !== undefined) {
          this.setNestedValue(result, rule.targetField, rule.defaultValue);
        } else {
          throw new Error(`Required field '${rule.sourceField}' is missing`);
        }
        continue;
      }

      // Skip if source value is undefined and not required
      if (sourceValue === undefined) {
        if (rule.defaultValue !== undefined) {
          this.setNestedValue(result, rule.targetField, rule.defaultValue);
        }
        continue;
      }

      // Apply type transformation
      let transformedValue = sourceValue;
      if (rule.type) {
        transformedValue = this.applyTypeTransformation(sourceValue, rule.type);
      }

      // Set the transformed value
      this.setNestedValue(result, rule.targetField, transformedValue);
    }

    return result;
  }

  /**
   * Transform array of data
   */
  transformArray(sourceDataArray: Record<string, any>[]): Record<string, any>[] {
    return sourceDataArray.map((item) => this.transform(item));
  }

  /**
   * Validate data against transformation rules
   */
  validate(data: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of this.data.transformationRules) {
      const value = this.getNestedValue(data, rule.sourceField);

      // Check required
      if (rule.required && (value === undefined || value === null)) {
        errors.push(`Field '${rule.sourceField}' is required`);
        continue;
      }

      // Skip validation if value is not present and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Apply validation rules
      if (rule.validationRules) {
        for (const validationRule of rule.validationRules) {
          const error = this.applyValidationRule(value, rule.sourceField, validationRule);
          if (error) {
            errors.push(error);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (key === undefined) continue;
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey !== undefined) {
      current[lastKey] = value;
    }
  }

  /**
   * Apply type transformation
   */
  // eslint-disable-next-line complexity -- Handles 6 type transformations (string, number, boolean, date, array, object) with straightforward switch-case. Already well-structured and cannot be simplified further.
  private applyTypeTransformation(value: any, type: TransformationType): any {
    try {
      switch (type) {
        case 'string':
          return String(value);

        case 'number': {
          const num = Number(value);
          return isNaN(num) ? 0 : num;
        }

        case 'boolean':
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1';
          }
          return Boolean(value);

        case 'date':
          if (value instanceof Date) return value.toISOString();
          return new Date(value).toISOString();

        case 'array':
          return Array.isArray(value) ? value : [value];

        case 'object':
          return typeof value === 'object' ? value : { value };

        default:
          return value;
      }
    } catch (error) {
      throw new Error(`Failed to transform value to ${type}: ${error}`);
    }
  }

  /**
   * Apply validation rule
   */
  // eslint-disable-next-line complexity -- Handles 6 validation rule types (required, minLength, maxLength, min, max, pattern) with straightforward switch-case. The conditional checks for different value types are necessary and cannot be simplified.
  private applyValidationRule(value: any, fieldName: string, rule: ValidationRule): string | null {
    try {
      switch (rule.type) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            return rule.errorMessage || `Field '${fieldName}' is required`;
          }
          break;

        case 'minLength':
          if (typeof value === 'string' && value.length < (rule.value as number)) {
            return (
              rule.errorMessage ||
              `Field '${fieldName}' must be at least ${rule.value} characters long`
            );
          }
          break;

        case 'maxLength':
          if (typeof value === 'string' && value.length > (rule.value as number)) {
            return (
              rule.errorMessage ||
              `Field '${fieldName}' must be at most ${rule.value} characters long`
            );
          }
          break;

        case 'min':
          if (typeof value === 'number' && value < (rule.value as number)) {
            return rule.errorMessage || `Field '${fieldName}' must be at least ${rule.value}`;
          }
          break;

        case 'max':
          if (typeof value === 'number' && value > (rule.value as number)) {
            return rule.errorMessage || `Field '${fieldName}' must be at most ${rule.value}`;
          }
          break;

        case 'pattern':
          if (typeof value === 'string') {
            const regex = new RegExp(rule.value as string);
            if (!regex.test(value)) {
              return (
                rule.errorMessage || `Field '${fieldName}' does not match the required pattern`
              );
            }
          }
          break;
      }

      return null;
    } catch (error) {
      return `Validation error for field '${fieldName}': ${error}`;
    }
  }
}
