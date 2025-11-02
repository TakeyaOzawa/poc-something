/**
 * Domain Layer: Sync Config Utilities
 * Utility functions for working with Inputs/Outputs arrays
 *
 * @coverage >=90%
 * @reason Core utilities for extracting and validating sync config data
 */

import { SyncInput, SyncOutput } from '@domain/entities/StorageSyncConfig';

/**
 * Extract value from inputs array by key
 * @param inputs - Array of input configurations
 * @param key - Key to search for
 * @returns The value associated with the key, or undefined if not found
 */
export function getInputValue<T = unknown>(inputs: SyncInput[], key: string): T | undefined {
  const input = inputs.find((input) => input.key === key);
  return input?.value as T | undefined;
}

/**
 * Extract multiple values from inputs array
 * @param inputs - Array of input configurations
 * @param keys - Array of keys to search for
 * @returns Object with key-value pairs for found inputs
 */
export function getInputValues(inputs: SyncInput[], keys: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of keys) {
    const value = getInputValue(inputs, key);
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Extract required value from inputs array (throws if not found)
 * @param inputs - Array of input configurations
 * @param key - Key to search for
 * @returns The value associated with the key
 * @throws Error if key not found or value is null/undefined
 */
export function getRequiredInputValue<T = unknown>(inputs: SyncInput[], key: string): T {
  const value = getInputValue<T>(inputs, key);

  if (value === undefined || value === null) {
    throw new Error(`Required input "${key}" not found or has no value`);
  }

  return value;
}

/**
 * Check if input key exists
 * @param inputs - Array of input configurations
 * @param key - Key to search for
 * @returns True if key exists, false otherwise
 */
export function hasInputKey(inputs: SyncInput[], key: string): boolean {
  return inputs.some((input) => input.key === key);
}

/**
 * Extract value from outputs array by key
 * @param outputs - Array of output configurations
 * @param key - Key to search for
 * @returns The default value associated with the key, or undefined if not found
 */
export function getOutputValue<T = unknown>(outputs: SyncOutput[], key: string): T | undefined {
  const output = outputs.find((output) => output.key === key);
  return output?.defaultValue as T | undefined;
}

/**
 * Extract multiple values from outputs array
 * @param outputs - Array of output configurations
 * @param keys - Array of keys to search for
 * @returns Object with key-value pairs for found outputs
 */
export function getOutputValues(outputs: SyncOutput[], keys: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of keys) {
    const value = getOutputValue(outputs, key);
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Check if output key exists
 * @param outputs - Array of output configurations
 * @param key - Key to search for
 * @returns True if key exists, false otherwise
 */
export function hasOutputKey(outputs: SyncOutput[], key: string): boolean {
  return outputs.some((output) => output.key === key);
}

/**
 * Validation error for Inputs/Outputs structure
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate inputs array structure
 * @param inputs - Array of input configurations to validate
 * @returns Array of validation errors (empty if valid)
 */
// eslint-disable-next-line max-lines-per-function -- Comprehensive validation function requires multiple sequential checks (array type, object structure, key existence, key type, key uniqueness, value existence) for each input element. Splitting into smaller functions would reduce readability and increase complexity due to error accumulation logic. The 56 lines include necessary error message formatting and detailed validation rules that ensure data integrity.
export function validateInputsArray(inputs: SyncInput[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(inputs)) {
    errors.push({
      field: 'inputs',
      message: 'Inputs must be an array',
    });
    return errors;
  }

  const keysSeen = new Set<string>();

  inputs.forEach((input, index) => {
    // Check structure
    if (!input || typeof input !== 'object') {
      errors.push({
        field: `inputs[${index}]`,
        message: 'Input must be an object',
      });
      return;
    }

    // Check key exists
    if (!('key' in input)) {
      errors.push({
        field: `inputs[${index}]`,
        message: 'Input must have a "key" property',
      });
      return;
    }

    // Check key is string
    if (typeof input.key !== 'string') {
      errors.push({
        field: `inputs[${index}].key`,
        message: 'Input key must be a string',
      });
      return;
    }

    // Check key is not empty
    if (input.key.trim() === '') {
      errors.push({
        field: `inputs[${index}].key`,
        message: 'Input key cannot be empty',
      });
      return;
    }

    // Check key is unique
    if (keysSeen.has(input.key)) {
      errors.push({
        field: `inputs[${index}].key`,
        message: `Duplicate input key: "${input.key}"`,
      });
    } else {
      keysSeen.add(input.key);
    }

    // Check value exists
    if (!('value' in input)) {
      errors.push({
        field: `inputs[${index}]`,
        message: 'Input must have a "value" property',
      });
    }
  });

  return errors;
}

/**
 * Validate outputs array structure
 * @param outputs - Array of output configurations to validate
 * @returns Array of validation errors (empty if valid)
 */
// eslint-disable-next-line max-lines-per-function -- Comprehensive validation function requires multiple sequential checks (array type, object structure, key existence, key type, key uniqueness, defaultValue existence) for each output element. Splitting into smaller functions would reduce readability and increase complexity due to error accumulation logic. The 56 lines include necessary error message formatting and detailed validation rules that ensure data integrity.
export function validateOutputsArray(outputs: SyncOutput[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(outputs)) {
    errors.push({
      field: 'outputs',
      message: 'Outputs must be an array',
    });
    return errors;
  }

  const keysSeen = new Set<string>();

  outputs.forEach((output, index) => {
    // Check structure
    if (!output || typeof output !== 'object') {
      errors.push({
        field: `outputs[${index}]`,
        message: 'Output must be an object',
      });
      return;
    }

    // Check key exists
    if (!('key' in output)) {
      errors.push({
        field: `outputs[${index}]`,
        message: 'Output must have a "key" property',
      });
      return;
    }

    // Check key is string
    if (typeof output.key !== 'string') {
      errors.push({
        field: `outputs[${index}].key`,
        message: 'Output key must be a string',
      });
      return;
    }

    // Check key is not empty
    if (output.key.trim() === '') {
      errors.push({
        field: `outputs[${index}].key`,
        message: 'Output key cannot be empty',
      });
      return;
    }

    // Check key is unique
    if (keysSeen.has(output.key)) {
      errors.push({
        field: `outputs[${index}].key`,
        message: `Duplicate output key: "${output.key}"`,
      });
    } else {
      keysSeen.add(output.key);
    }

    // Check defaultValue exists
    if (!('defaultValue' in output)) {
      errors.push({
        field: `outputs[${index}]`,
        message: 'Output must have a "defaultValue" property',
      });
    }
  });

  return errors;
}

/**
 * Check if inputs array is valid
 * @param inputs - Array of input configurations to validate
 * @returns True if valid, false otherwise
 */
export function isValidInputsArray(inputs: SyncInput[]): boolean {
  return validateInputsArray(inputs).length === 0;
}

/**
 * Check if outputs array is valid
 * @param outputs - Array of output configurations to validate
 * @returns True if valid, false otherwise
 */
export function isValidOutputsArray(outputs: SyncOutput[]): boolean {
  return validateOutputsArray(outputs).length === 0;
}
