/**
 * Unit Tests: Variable Entity
 */

import { VariableCollection, Variable } from '../Variable';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('VariableCollection', () => {
  // Suppress console.error during tests for invalid JSON test cases
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('add', () => {
    it('should add a variable to the collection', () => {
      const collection = new VariableCollection();
      const variable: Variable = { name: 'test', value: 'testValue' };

      collection.add(variable);

      expect(collection.get('test')).toEqual(variable);
    });

    it('should overwrite existing variable with same name', () => {
      const collection = new VariableCollection();
      collection.add({ name: 'test', value: 'value1' });
      collection.add({ name: 'test', value: 'value2' });

      expect(collection.get('test')?.value).toBe('value2');
    });

    // Validation tests
    it('should throw error for empty variable name', () => {
      const collection = new VariableCollection();
      const variable: Variable = { name: '', value: 'testValue' };

      expect(() => collection.add(variable)).toThrow('Variable name must not be empty');
    });

    it('should throw error for whitespace-only variable name', () => {
      const collection = new VariableCollection();
      const variable: Variable = { name: '   ', value: 'testValue' };

      expect(() => collection.add(variable)).toThrow('Variable name must not be empty');
    });

    it('should throw error for variable name starting with digit', () => {
      const collection = new VariableCollection();
      const variable: Variable = { name: '1test', value: 'testValue' };

      expect(() => collection.add(variable)).toThrow(
        'Variable name must start with a letter or underscore'
      );
    });

    it('should throw error for variable name with special characters', () => {
      const collection = new VariableCollection();
      const variable: Variable = { name: 'test-var', value: 'testValue' };

      expect(() => collection.add(variable)).toThrow(
        'Variable name must start with a letter or underscore'
      );
    });

    it('should throw error for variable name with spaces', () => {
      const collection = new VariableCollection();
      const variable: Variable = { name: 'test var', value: 'testValue' };

      expect(() => collection.add(variable)).toThrow(
        'Variable name must start with a letter or underscore'
      );
    });

    it('should throw error for non-string variable value', () => {
      const collection = new VariableCollection();
      const variable: any = { name: 'test', value: 123 };

      expect(() => collection.add(variable)).toThrow('Variable value must be a string');
    });

    it('should accept variable name starting with underscore', () => {
      const collection = new VariableCollection();
      const variable: Variable = { name: '_privateVar', value: 'testValue' };

      expect(() => collection.add(variable)).not.toThrow();
      expect(collection.get('_privateVar')).toEqual(variable);
    });

    it('should accept variable name with uppercase letters', () => {
      const collection = new VariableCollection();
      const variable: Variable = { name: 'TestVariable', value: 'testValue' };

      expect(() => collection.add(variable)).not.toThrow();
      expect(collection.get('TestVariable')).toEqual(variable);
    });

    it('should accept variable name with numbers after first character', () => {
      const collection = new VariableCollection();
      const variable: Variable = { name: 'test123', value: 'testValue' };

      expect(() => collection.add(variable)).not.toThrow();
      expect(collection.get('test123')).toEqual(variable);
    });

    it('should accept empty string as variable value', () => {
      const collection = new VariableCollection();
      const variable: Variable = { name: 'emptyVar', value: '' };

      expect(() => collection.add(variable)).not.toThrow();
      expect(collection.get('emptyVar')?.value).toBe('');
    });
  });

  describe('get', () => {
    it('should return variable by name', () => {
      const collection = new VariableCollection();
      const variable: Variable = { name: 'myVar', value: 'myValue' };
      collection.add(variable);

      expect(collection.get('myVar')).toEqual(variable);
    });

    it('should return undefined for non-existent variable', () => {
      const collection = new VariableCollection();
      expect(collection.get('nonExistent')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all variables', () => {
      const collection = new VariableCollection();
      collection.add({ name: 'var1', value: 'value1' });
      collection.add({ name: 'var2', value: 'value2' });

      const all = collection.getAll();
      expect(all).toHaveLength(2);
      expect(all.find((v) => v.name === 'var1')).toBeDefined();
      expect(all.find((v) => v.name === 'var2')).toBeDefined();
    });

    it('should return empty array for empty collection', () => {
      const collection = new VariableCollection();
      expect(collection.getAll()).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete variable by name and return true', () => {
      const collection = new VariableCollection();
      collection.add({ name: 'test', value: 'testValue' });

      const result = collection.delete('test');

      expect(result).toBe(true);
      expect(collection.get('test')).toBeUndefined();
    });

    it('should return false when deleting non-existent variable', () => {
      const collection = new VariableCollection();
      const result = collection.delete('nonExistent');
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all variables', () => {
      const collection = new VariableCollection();
      collection.add({ name: 'var1', value: 'value1' });
      collection.add({ name: 'var2', value: 'value2' });

      collection.clear();

      expect(collection.getAll()).toHaveLength(0);
    });
  });

  describe('clone', () => {
    it('should create independent copy of collection', () => {
      const collection = new VariableCollection();
      collection.add({ name: 'test', value: 'original' });

      const cloned = collection.clone();
      cloned.add({ name: 'test', value: 'modified' });

      expect(collection.get('test')?.value).toBe('original');
      expect(cloned.get('test')?.value).toBe('modified');
    });
  });

  describe('replaceVariables', () => {
    it('should replace variables in text', () => {
      const collection = new VariableCollection();
      collection.add({ name: 'name', value: 'John' });
      collection.add({ name: 'age', value: '25' });

      const result = collection.replaceVariables('Hello {{name}}, you are {{age}} years old');

      expect(result).toBe('Hello John, you are 25 years old');
    });

    it('should replace multiple occurrences of same variable', () => {
      const collection = new VariableCollection();
      collection.add({ name: 'word', value: 'test' });

      const result = collection.replaceVariables('{{word}} {{word}} {{word}}');

      expect(result).toBe('test test test');
    });

    it('should return original text when no variables match', () => {
      const collection = new VariableCollection();
      const text = 'No variables here';

      expect(collection.replaceVariables(text)).toBe(text);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON string', () => {
      const collection = new VariableCollection();
      collection.add({ name: 'var1', value: 'value1' });

      const json = collection.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual({ name: 'var1', value: 'value1' });
    });
  });

  describe('fromJSON', () => {
    it('should deserialize from JSON string', () => {
      const json = '[{"name":"var1","value":"value1"},{"name":"var2","value":"value2"}]';

      const collection = VariableCollection.fromJSON(json);

      expect(collection.getAll()).toHaveLength(2);
      expect(collection.get('var1')?.value).toBe('value1');
      expect(collection.get('var2')?.value).toBe('value2');
    });

    it('should return empty collection for invalid JSON', () => {
      const collection = VariableCollection.fromJSON('invalid json');
      expect(collection.getAll()).toHaveLength(0);
    });

    it('should skip invalid variables when deserializing', () => {
      const json =
        '[{"name":"valid","value":"value1"},{"name":"1invalid","value":"value2"},{"name":"valid2","value":"value3"}]';

      const collection = VariableCollection.fromJSON(json);

      // Should only add valid variables and skip invalid ones
      expect(collection.getAll()).toHaveLength(2);
      expect(collection.get('valid')?.value).toBe('value1');
      expect(collection.get('valid2')?.value).toBe('value3');
      expect(collection.get('1invalid')).toBeUndefined();
    });

    it('should skip variables with non-string values when deserializing', () => {
      const json = '[{"name":"valid","value":"value1"},{"name":"invalid","value":123}]';

      const collection = VariableCollection.fromJSON(json);

      expect(collection.getAll()).toHaveLength(1);
      expect(collection.get('valid')?.value).toBe('value1');
      expect(collection.get('invalid')).toBeUndefined();
    });
  });
});
