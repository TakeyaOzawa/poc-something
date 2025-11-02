/**
 * Tests for SyncConfigUtils
 */

import {
  getInputValue,
  getInputValues,
  getRequiredInputValue,
  hasInputKey,
  getOutputValue,
  getOutputValues,
  hasOutputKey,
  validateInputsArray,
  validateOutputsArray,
  isValidInputsArray,
  isValidOutputsArray,
} from '../SyncConfigUtils';
import { SyncInput, SyncOutput } from '@domain/entities/StorageSyncConfig';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('SyncConfigUtils', () => {
  describe('getInputValue', () => {
    it('should extract value by key', () => {
      const inputs: SyncInput[] = [
        { key: 'apiKey', value: 'secret_key' },
        { key: 'databaseId', value: 'db123' },
      ];

      expect(getInputValue(inputs, 'apiKey')).toBe('secret_key');
      expect(getInputValue(inputs, 'databaseId')).toBe('db123');
    });

    it('should return undefined for non-existent key', () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_key' }];

      expect(getInputValue(inputs, 'nonexistent')).toBeUndefined();
    });

    it('should handle empty inputs array', () => {
      const inputs: SyncInput[] = [];

      expect(getInputValue(inputs, 'apiKey')).toBeUndefined();
    });

    it('should support generic type parameter', () => {
      const inputs: SyncInput[] = [
        { key: 'count', value: 42 },
        { key: 'enabled', value: true },
      ];

      const count = getInputValue<number>(inputs, 'count');
      const enabled = getInputValue<boolean>(inputs, 'enabled');

      expect(count).toBe(42);
      expect(enabled).toBe(true);
    });

    it('should return undefined value if explicitly set', () => {
      const inputs: SyncInput[] = [{ key: 'optional', value: undefined }];

      expect(getInputValue(inputs, 'optional')).toBeUndefined();
    });

    it('should return null value if explicitly set', () => {
      const inputs: SyncInput[] = [{ key: 'nullable', value: null }];

      expect(getInputValue(inputs, 'nullable')).toBeNull();
    });
  });

  describe('getInputValues', () => {
    it('should extract multiple values', () => {
      const inputs: SyncInput[] = [
        { key: 'apiKey', value: 'secret_key' },
        { key: 'databaseId', value: 'db123' },
        { key: 'pageSize', value: 100 },
      ];

      const result = getInputValues(inputs, ['apiKey', 'databaseId']);

      expect(result).toEqual({
        apiKey: 'secret_key',
        databaseId: 'db123',
      });
    });

    it('should skip non-existent keys', () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_key' }];

      const result = getInputValues(inputs, ['apiKey', 'nonexistent']);

      expect(result).toEqual({ apiKey: 'secret_key' });
    });

    it('should handle empty keys array', () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_key' }];

      const result = getInputValues(inputs, []);

      expect(result).toEqual({});
    });
  });

  describe('getRequiredInputValue', () => {
    it('should extract required value', () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_key' }];

      expect(getRequiredInputValue(inputs, 'apiKey')).toBe('secret_key');
    });

    it('should throw error for non-existent key', () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_key' }];

      expect(() => getRequiredInputValue(inputs, 'missing')).toThrow(
        'Required input "missing" not found or has no value'
      );
    });

    it('should throw error for undefined value', () => {
      const inputs: SyncInput[] = [{ key: 'optional', value: undefined }];

      expect(() => getRequiredInputValue(inputs, 'optional')).toThrow(
        'Required input "optional" not found or has no value'
      );
    });

    it('should throw error for null value', () => {
      const inputs: SyncInput[] = [{ key: 'nullable', value: null }];

      expect(() => getRequiredInputValue(inputs, 'nullable')).toThrow(
        'Required input "nullable" not found or has no value'
      );
    });
  });

  describe('hasInputKey', () => {
    it('should return true for existing key', () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_key' }];

      expect(hasInputKey(inputs, 'apiKey')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_key' }];

      expect(hasInputKey(inputs, 'nonexistent')).toBe(false);
    });

    it('should handle empty inputs array', () => {
      const inputs: SyncInput[] = [];

      expect(hasInputKey(inputs, 'apiKey')).toBe(false);
    });
  });

  describe('getOutputValue', () => {
    it('should extract default value by key', () => {
      const outputs: SyncOutput[] = [
        { key: 'id', defaultValue: '{{uuid}}' },
        { key: 'timestamp', defaultValue: '{{now}}' },
      ];

      expect(getOutputValue(outputs, 'id')).toBe('{{uuid}}');
      expect(getOutputValue(outputs, 'timestamp')).toBe('{{now}}');
    });

    it('should return undefined for non-existent key', () => {
      const outputs: SyncOutput[] = [{ key: 'id', defaultValue: '{{uuid}}' }];

      expect(getOutputValue(outputs, 'nonexistent')).toBeUndefined();
    });

    it('should handle empty outputs array', () => {
      const outputs: SyncOutput[] = [];

      expect(getOutputValue(outputs, 'id')).toBeUndefined();
    });

    it('should support generic type parameter', () => {
      const outputs: SyncOutput[] = [
        { key: 'count', defaultValue: 0 },
        { key: 'active', defaultValue: true },
      ];

      const count = getOutputValue<number>(outputs, 'count');
      const active = getOutputValue<boolean>(outputs, 'active');

      expect(count).toBe(0);
      expect(active).toBe(true);
    });
  });

  describe('getOutputValues', () => {
    it('should extract multiple default values', () => {
      const outputs: SyncOutput[] = [
        { key: 'id', defaultValue: '{{uuid}}' },
        { key: 'timestamp', defaultValue: '{{now}}' },
        { key: 'status', defaultValue: 'pending' },
      ];

      const result = getOutputValues(outputs, ['id', 'timestamp']);

      expect(result).toEqual({
        id: '{{uuid}}',
        timestamp: '{{now}}',
      });
    });

    it('should skip non-existent keys', () => {
      const outputs: SyncOutput[] = [{ key: 'id', defaultValue: '{{uuid}}' }];

      const result = getOutputValues(outputs, ['id', 'nonexistent']);

      expect(result).toEqual({ id: '{{uuid}}' });
    });

    it('should handle empty keys array', () => {
      const outputs: SyncOutput[] = [{ key: 'id', defaultValue: '{{uuid}}' }];

      const result = getOutputValues(outputs, []);

      expect(result).toEqual({});
    });
  });

  describe('hasOutputKey', () => {
    it('should return true for existing key', () => {
      const outputs: SyncOutput[] = [{ key: 'id', defaultValue: '{{uuid}}' }];

      expect(hasOutputKey(outputs, 'id')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      const outputs: SyncOutput[] = [{ key: 'id', defaultValue: '{{uuid}}' }];

      expect(hasOutputKey(outputs, 'nonexistent')).toBe(false);
    });

    it('should handle empty outputs array', () => {
      const outputs: SyncOutput[] = [];

      expect(hasOutputKey(outputs, 'id')).toBe(false);
    });
  });

  describe('validateInputsArray', () => {
    it('should validate correct inputs array', () => {
      const inputs: SyncInput[] = [
        { key: 'apiKey', value: 'secret_key' },
        { key: 'databaseId', value: 'db123' },
      ];

      const errors = validateInputsArray(inputs);

      expect(errors).toEqual([]);
    });

    it('should reject non-array inputs', () => {
      const inputs = 'not an array' as any;

      const errors = validateInputsArray(inputs);

      expect(errors).toEqual([
        {
          field: 'inputs',
          message: 'Inputs must be an array',
        },
      ]);
    });

    it('should reject non-object input elements', () => {
      const inputs = ['string'] as any;

      const errors = validateInputsArray(inputs);

      expect(errors).toContainEqual({
        field: 'inputs[0]',
        message: 'Input must be an object',
      });
    });

    it('should reject input without key property', () => {
      const inputs = [{ value: 'test' }] as any;

      const errors = validateInputsArray(inputs);

      expect(errors).toContainEqual({
        field: 'inputs[0]',
        message: 'Input must have a "key" property',
      });
    });

    it('should reject input with non-string key', () => {
      const inputs = [{ key: 123, value: 'test' }] as any;

      const errors = validateInputsArray(inputs);

      expect(errors).toContainEqual({
        field: 'inputs[0].key',
        message: 'Input key must be a string',
      });
    });

    it('should reject input with empty key', () => {
      const inputs: SyncInput[] = [{ key: '  ', value: 'test' }];

      const errors = validateInputsArray(inputs);

      expect(errors).toContainEqual({
        field: 'inputs[0].key',
        message: 'Input key cannot be empty',
      });
    });

    it('should reject duplicate keys', () => {
      const inputs: SyncInput[] = [
        { key: 'apiKey', value: 'key1' },
        { key: 'apiKey', value: 'key2' },
      ];

      const errors = validateInputsArray(inputs);

      expect(errors).toContainEqual({
        field: 'inputs[1].key',
        message: 'Duplicate input key: "apiKey"',
      });
    });

    it('should reject input without value property', () => {
      const inputs = [{ key: 'apiKey' }] as any;

      const errors = validateInputsArray(inputs);

      expect(errors).toContainEqual({
        field: 'inputs[0]',
        message: 'Input must have a "value" property',
      });
    });

    it('should allow value to be any type', () => {
      const inputs: SyncInput[] = [
        { key: 'string', value: 'test' },
        { key: 'number', value: 42 },
        { key: 'boolean', value: true },
        { key: 'null', value: null },
        { key: 'undefined', value: undefined },
        { key: 'object', value: { nested: 'value' } },
        { key: 'array', value: [1, 2, 3] },
      ];

      const errors = validateInputsArray(inputs);

      expect(errors).toEqual([]);
    });
  });

  describe('validateOutputsArray', () => {
    it('should validate correct outputs array', () => {
      const outputs: SyncOutput[] = [
        { key: 'id', defaultValue: '{{uuid}}' },
        { key: 'timestamp', defaultValue: '{{now}}' },
      ];

      const errors = validateOutputsArray(outputs);

      expect(errors).toEqual([]);
    });

    it('should reject non-array outputs', () => {
      const outputs = 'not an array' as any;

      const errors = validateOutputsArray(outputs);

      expect(errors).toEqual([
        {
          field: 'outputs',
          message: 'Outputs must be an array',
        },
      ]);
    });

    it('should reject non-object output elements', () => {
      const outputs = ['string'] as any;

      const errors = validateOutputsArray(outputs);

      expect(errors).toContainEqual({
        field: 'outputs[0]',
        message: 'Output must be an object',
      });
    });

    it('should reject output without key property', () => {
      const outputs = [{ defaultValue: 'test' }] as any;

      const errors = validateOutputsArray(outputs);

      expect(errors).toContainEqual({
        field: 'outputs[0]',
        message: 'Output must have a "key" property',
      });
    });

    it('should reject output with non-string key', () => {
      const outputs = [{ key: 123, defaultValue: 'test' }] as any;

      const errors = validateOutputsArray(outputs);

      expect(errors).toContainEqual({
        field: 'outputs[0].key',
        message: 'Output key must be a string',
      });
    });

    it('should reject output with empty key', () => {
      const outputs: SyncOutput[] = [{ key: '  ', defaultValue: 'test' }];

      const errors = validateOutputsArray(outputs);

      expect(errors).toContainEqual({
        field: 'outputs[0].key',
        message: 'Output key cannot be empty',
      });
    });

    it('should reject duplicate keys', () => {
      const outputs: SyncOutput[] = [
        { key: 'id', defaultValue: '{{uuid}}' },
        { key: 'id', defaultValue: '{{guid}}' },
      ];

      const errors = validateOutputsArray(outputs);

      expect(errors).toContainEqual({
        field: 'outputs[1].key',
        message: 'Duplicate output key: "id"',
      });
    });

    it('should reject output without defaultValue property', () => {
      const outputs = [{ key: 'id' }] as any;

      const errors = validateOutputsArray(outputs);

      expect(errors).toContainEqual({
        field: 'outputs[0]',
        message: 'Output must have a "defaultValue" property',
      });
    });

    it('should allow defaultValue to be any type', () => {
      const outputs: SyncOutput[] = [
        { key: 'string', defaultValue: 'test' },
        { key: 'number', defaultValue: 42 },
        { key: 'boolean', defaultValue: true },
        { key: 'null', defaultValue: null },
        { key: 'undefined', defaultValue: undefined },
        { key: 'object', defaultValue: { nested: 'value' } },
        { key: 'array', defaultValue: [1, 2, 3] },
      ];

      const errors = validateOutputsArray(outputs);

      expect(errors).toEqual([]);
    });
  });

  describe('isValidInputsArray', () => {
    it('should return true for valid inputs array', () => {
      const inputs: SyncInput[] = [
        { key: 'apiKey', value: 'secret_key' },
        { key: 'databaseId', value: 'db123' },
      ];

      expect(isValidInputsArray(inputs)).toBe(true);
    });

    it('should return false for invalid inputs array', () => {
      const inputs = 'not an array' as any;

      expect(isValidInputsArray(inputs)).toBe(false);
    });

    it('should return false for inputs with errors', () => {
      const inputs: SyncInput[] = [
        { key: 'apiKey', value: 'key1' },
        { key: 'apiKey', value: 'key2' }, // Duplicate key
      ];

      expect(isValidInputsArray(inputs)).toBe(false);
    });
  });

  describe('isValidOutputsArray', () => {
    it('should return true for valid outputs array', () => {
      const outputs: SyncOutput[] = [
        { key: 'id', defaultValue: '{{uuid}}' },
        { key: 'timestamp', defaultValue: '{{now}}' },
      ];

      expect(isValidOutputsArray(outputs)).toBe(true);
    });

    it('should return false for invalid outputs array', () => {
      const outputs = 'not an array' as any;

      expect(isValidOutputsArray(outputs)).toBe(false);
    });

    it('should return false for outputs with errors', () => {
      const outputs: SyncOutput[] = [
        { key: 'id', defaultValue: '{{uuid}}' },
        { key: 'id', defaultValue: '{{guid}}' }, // Duplicate key
      ];

      expect(isValidOutputsArray(outputs)).toBe(false);
    });
  });
});
