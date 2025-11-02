/**
 * Unit Tests: DataTransformationService
 */

import { DataTransformationService } from '../DataTransformationService';
import { DataTransformer } from '@domain/entities/DataTransformer';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('DataTransformationService', () => {
  let service: DataTransformationService;
  let mockLogger: jest.Mocked<Logger>;
  let mockTransformer: jest.Mocked<DataTransformer>;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    service = new DataTransformationService(mockLogger);

    // Mock DataTransformer
    mockTransformer = {
      getId: jest.fn().mockReturnValue('test-transformer-id'),
      getName: jest.fn().mockReturnValue('Test Transformer'),
      getTransformationRules: jest.fn().mockReturnValue([]),
      validate: jest.fn().mockReturnValue({ valid: true, errors: [] }),
      transform: jest.fn((data) => ({ ...data, transformed: true })),
    } as any;
  });

  describe('constructor', () => {
    it('should register built-in functions on initialization', () => {
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Registered built-in transformation functions',
        expect.objectContaining({ count: 10 })
      );
    });

    it('should register 10 built-in functions', () => {
      expect(service.getFunction('trim')).toBeDefined();
      expect(service.getFunction('uppercase')).toBeDefined();
      expect(service.getFunction('lowercase')).toBeDefined();
      expect(service.getFunction('addTimestamp')).toBeDefined();
      expect(service.getFunction('parseJson')).toBeDefined();
      expect(service.getFunction('stringifyJson')).toBeDefined();
      expect(service.getFunction('split')).toBeDefined();
      expect(service.getFunction('join')).toBeDefined();
      expect(service.getFunction('formatDate')).toBeDefined();
      expect(service.getFunction('removeNullish')).toBeDefined();
    });
  });

  describe('registerFunction', () => {
    it('should register a custom function', () => {
      const customFn = (value: any) => value.toUpperCase();
      service.registerFunction('myCustom', customFn);

      expect(service.getFunction('myCustom')).toBe(customFn);
      expect(mockLogger.debug).toHaveBeenCalledWith('Registered custom transformation function', {
        name: 'myCustom',
      });
    });
  });

  describe('unregisterFunction', () => {
    it('should unregister a custom function', () => {
      const customFn = (value: any) => value;
      service.registerFunction('toRemove', customFn);
      expect(service.getFunction('toRemove')).toBe(customFn);

      service.unregisterFunction('toRemove');
      expect(service.getFunction('toRemove')).toBeUndefined();
      expect(mockLogger.debug).toHaveBeenCalledWith('Unregistered custom transformation function', {
        name: 'toRemove',
      });
    });
  });

  describe('getFunction', () => {
    it('should return registered function', () => {
      const fn = service.getFunction('trim');
      expect(fn).toBeDefined();
    });

    it('should return undefined for non-existent function', () => {
      const fn = service.getFunction('nonExistent');
      expect(fn).toBeUndefined();
    });
  });

  describe('transform', () => {
    it('should successfully transform data', () => {
      const data = { name: 'Test', value: 123 };
      const result = service.transform(data, mockTransformer);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'Test', value: 123, transformed: true });
      expect(mockTransformer.validate).toHaveBeenCalledWith(data);
      expect(mockTransformer.transform).toHaveBeenCalledWith(data);
    });

    it('should fail when validation fails', () => {
      mockTransformer.validate.mockReturnValue({
        valid: false,
        errors: ['Field "name" is required'],
      });

      const data = { value: 123 };
      const result = service.transform(data, mockTransformer);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Field "name" is required']);
      expect(mockTransformer.transform).not.toHaveBeenCalled();
    });

    it('should apply custom functions', () => {
      mockTransformer.getTransformationRules.mockReturnValue([
        {
          sourceField: 'name',
          targetField: 'name',
          transformFunction: 'uppercase',
        },
      ]);
      mockTransformer.transform.mockReturnValue({ name: 'test' });

      const data = { name: 'test' };
      const result = service.transform(data, mockTransformer);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('TEST');
    });

    it('should handle errors during transformation', () => {
      mockTransformer.transform.mockImplementation(() => {
        throw new Error('Transform error');
      });

      const data = { name: 'Test' };
      const result = service.transform(data, mockTransformer);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Transform error']);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Data transformation failed',
        expect.any(Error)
      );
    });

    it('should handle nested field paths in custom functions', () => {
      mockTransformer.getTransformationRules.mockReturnValue([
        {
          sourceField: 'user.name',
          targetField: 'user.name',
          transformFunction: 'uppercase',
        },
      ]);
      mockTransformer.transform.mockReturnValue({ user: { name: 'john' } });

      const data = { user: { name: 'john' } };
      const result = service.transform(data, mockTransformer);

      expect(result.success).toBe(true);
      expect(result.data?.user.name).toBe('JOHN');
    });

    it('should warn when custom function is not found', () => {
      mockTransformer.getTransformationRules.mockReturnValue([
        {
          sourceField: 'name',
          targetField: 'name',
          transformFunction: 'nonExistent',
        },
      ]);
      mockTransformer.transform.mockReturnValue({ name: 'test' });

      const data = { name: 'test' };
      const result = service.transform(data, mockTransformer);

      expect(result.success).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith('Custom function not found', {
        function: 'nonExistent',
        field: 'name',
      });
    });

    it('should handle errors in custom function execution', () => {
      const errorFn = () => {
        throw new Error('Custom function error');
      };
      service.registerFunction('errorFn', errorFn);

      mockTransformer.getTransformationRules.mockReturnValue([
        {
          sourceField: 'name',
          targetField: 'name',
          transformFunction: 'errorFn',
        },
      ]);
      mockTransformer.transform.mockReturnValue({ name: 'test' });

      const data = { name: 'test' };
      const result = service.transform(data, mockTransformer);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Custom function error']);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle deeply nested paths', () => {
      mockTransformer.getTransformationRules.mockReturnValue([
        {
          sourceField: 'a.b.c.d',
          targetField: 'a.b.c.d',
          transformFunction: 'uppercase',
        },
      ]);
      mockTransformer.transform.mockReturnValue({ a: { b: { c: { d: 'value' } } } });

      const data = { a: { b: { c: { d: 'value' } } } };
      const result = service.transform(data, mockTransformer);

      expect(result.success).toBe(true);
      expect(result.data?.a.b.c.d).toBe('VALUE');
    });

    it('should handle null/undefined in nested paths gracefully', () => {
      mockTransformer.getTransformationRules.mockReturnValue([
        {
          sourceField: 'user.profile.name',
          targetField: 'user.profile.name',
          transformFunction: 'uppercase',
        },
      ]);
      mockTransformer.transform.mockReturnValue({ user: null });

      const data = { user: null };
      const result = service.transform(data, mockTransformer);

      expect(result.success).toBe(true);
      // Should not crash, undefined is handled
    });

    it('should create missing intermediate objects when setting nested values', () => {
      mockTransformer.getTransformationRules.mockReturnValue([
        {
          sourceField: 'name',
          targetField: 'user.profile.displayName',
          transformFunction: 'uppercase',
        },
      ]);
      // Mock transformer should map sourceField to targetField
      mockTransformer.transform.mockReturnValue({
        user: { profile: { displayName: 'john' } },
      });

      const data = { name: 'john' };
      const result = service.transform(data, mockTransformer);

      expect(result.success).toBe(true);
      expect(result.data?.user?.profile?.displayName).toBe('JOHN');
    });
  });

  describe('transformArray', () => {
    it('should transform array of data successfully', () => {
      const dataArray = [
        { name: 'Item1', value: 1 },
        { name: 'Item2', value: 2 },
      ];

      const result = service.transformArray(dataArray, mockTransformer);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toEqual({ name: 'Item1', value: 1, transformed: true });
      expect(result.data?.[1]).toEqual({ name: 'Item2', value: 2, transformed: true });
    });

    it('should collect errors from failed items', () => {
      mockTransformer.validate
        .mockReturnValueOnce({ valid: true, errors: [] })
        .mockReturnValueOnce({ valid: false, errors: ['Error in item'] });

      const dataArray = [{ name: 'Item1' }, { name: 'Item2' }];
      const result = service.transformArray(dataArray, mockTransformer);

      expect(result.success).toBe(false);
      expect(result.data).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]).toContain('Item 1');
    });

    it('should handle empty array', () => {
      const result = service.transformArray([], mockTransformer);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle errors during array transformation', () => {
      mockTransformer.transform.mockImplementation(() => {
        throw new Error('Array transform error');
      });

      const dataArray = [{ name: 'Item1' }];
      const result = service.transformArray(dataArray, mockTransformer);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toBe('Item 0: Array transform error');
    });

    it('should warn when some items fail', () => {
      mockTransformer.validate
        .mockReturnValueOnce({ valid: true, errors: [] })
        .mockReturnValueOnce({ valid: false, errors: ['Validation error'] });

      const dataArray = [{ name: 'Item1' }, { name: 'Item2' }];
      service.transformArray(dataArray, mockTransformer);

      expect(mockLogger.warn).toHaveBeenCalledWith('Some items failed transformation', {
        successCount: 1,
        errorCount: 1,
      });
    });

    it('should handle exception during array transformation', () => {
      const dataArray = [{ name: 'Item1' }];

      // Simulate an exception in the transform method itself
      jest.spyOn(service, 'transform').mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = service.transformArray(dataArray, mockTransformer);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Unexpected error']);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Array transformation failed',
        expect.any(Error)
      );
    });
  });

  describe('validate', () => {
    it('should validate data successfully', () => {
      const data = { name: 'Test', value: 123 };
      const result = service.validate(data, mockTransformer);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(mockTransformer.validate).toHaveBeenCalledWith(data);
    });

    it('should return errors when validation fails', () => {
      mockTransformer.validate.mockReturnValue({
        valid: false,
        errors: ['Field "name" is required', 'Field "value" must be a number'],
      });

      const data = { value: 'invalid' };
      const result = service.validate(data, mockTransformer);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toEqual(['Field "name" is required', 'Field "value" must be a number']);
    });

    it('should handle errors during validation', () => {
      mockTransformer.validate.mockImplementation(() => {
        throw new Error('Validation error');
      });

      const data = { name: 'Test' };
      const result = service.validate(data, mockTransformer);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Validation error']);
      expect(mockLogger.error).toHaveBeenCalledWith('Data validation failed', expect.any(Error));
    });

    it('should handle non-Error exceptions', () => {
      mockTransformer.validate.mockImplementation(() => {
        throw 'String error';
      });

      const data = { name: 'Test' };
      const result = service.validate(data, mockTransformer);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Unknown validation error']);
    });
  });

  describe('Built-in transformation functions', () => {
    describe('trim', () => {
      it('should trim whitespace from strings', () => {
        const trimFn = service.getFunction('trim')!;
        expect(trimFn('  hello  ')).toBe('hello');
        expect(trimFn('no spaces')).toBe('no spaces');
      });

      it('should return non-string values unchanged', () => {
        const trimFn = service.getFunction('trim')!;
        expect(trimFn(123)).toBe(123);
        expect(trimFn(null)).toBe(null);
        expect(trimFn(undefined)).toBe(undefined);
      });
    });

    describe('uppercase', () => {
      it('should convert strings to uppercase', () => {
        const upperFn = service.getFunction('uppercase')!;
        expect(upperFn('hello')).toBe('HELLO');
        expect(upperFn('HELLO')).toBe('HELLO');
      });

      it('should return non-string values unchanged', () => {
        const upperFn = service.getFunction('uppercase')!;
        expect(upperFn(123)).toBe(123);
      });
    });

    describe('lowercase', () => {
      it('should convert strings to lowercase', () => {
        const lowerFn = service.getFunction('lowercase')!;
        expect(lowerFn('HELLO')).toBe('hello');
        expect(lowerFn('hello')).toBe('hello');
      });

      it('should return non-string values unchanged', () => {
        const lowerFn = service.getFunction('lowercase')!;
        expect(lowerFn(123)).toBe(123);
      });
    });

    describe('addTimestamp', () => {
      it('should add timestamp to objects', () => {
        const addTimestampFn = service.getFunction('addTimestamp')!;
        const obj = { name: 'test' };
        const context = { timestamp: 1234567890, sourceData: {} };

        const result = addTimestampFn(obj, context);

        expect(result.timestamp).toBe(1234567890);
        expect(result.name).toBe('test');
      });

      it('should use Date.now() if no context timestamp', () => {
        const addTimestampFn = service.getFunction('addTimestamp')!;
        const obj = { name: 'test' };

        const result = addTimestampFn(obj);

        expect(result.timestamp).toBeDefined();
        expect(typeof result.timestamp).toBe('number');
      });

      it('should return non-object values unchanged', () => {
        const addTimestampFn = service.getFunction('addTimestamp')!;
        expect(addTimestampFn('string')).toBe('string');
        expect(addTimestampFn(123)).toBe(123);
        expect(addTimestampFn(null)).toBe(null);
      });
    });

    describe('parseJson', () => {
      it('should parse JSON strings', () => {
        const parseJsonFn = service.getFunction('parseJson')!;
        expect(parseJsonFn('{"name":"test"}')).toEqual({ name: 'test' });
        expect(parseJsonFn('[1,2,3]')).toEqual([1, 2, 3]);
      });

      it('should return original value if parsing fails', () => {
        const parseJsonFn = service.getFunction('parseJson')!;
        expect(parseJsonFn('invalid json')).toBe('invalid json');
      });

      it('should return non-string values unchanged', () => {
        const parseJsonFn = service.getFunction('parseJson')!;
        expect(parseJsonFn(123)).toBe(123);
        expect(parseJsonFn({ name: 'test' })).toEqual({ name: 'test' });
      });
    });

    describe('stringifyJson', () => {
      it('should stringify objects to JSON', () => {
        const stringifyJsonFn = service.getFunction('stringifyJson')!;
        expect(stringifyJsonFn({ name: 'test' })).toBe('{"name":"test"}');
        expect(stringifyJsonFn([1, 2, 3])).toBe('[1,2,3]');
      });

      it('should return original value if stringification fails', () => {
        const stringifyJsonFn = service.getFunction('stringifyJson')!;
        const circular: any = {};
        circular.self = circular;
        expect(stringifyJsonFn(circular)).toBe(circular);
      });

      it('should return non-object values unchanged', () => {
        const stringifyJsonFn = service.getFunction('stringifyJson')!;
        expect(stringifyJsonFn('string')).toBe('string');
        expect(stringifyJsonFn(123)).toBe(123);
        expect(stringifyJsonFn(null)).toBe(null);
      });
    });

    describe('split', () => {
      it('should split strings by comma', () => {
        const splitFn = service.getFunction('split')!;
        expect(splitFn('a,b,c')).toEqual(['a', 'b', 'c']);
        expect(splitFn('a, b, c')).toEqual(['a', 'b', 'c']); // Trims spaces
      });

      it('should return non-string values unchanged', () => {
        const splitFn = service.getFunction('split')!;
        expect(splitFn(123)).toBe(123);
        expect(splitFn(['a', 'b'])).toEqual(['a', 'b']);
      });
    });

    describe('join', () => {
      it('should join arrays to strings', () => {
        const joinFn = service.getFunction('join')!;
        expect(joinFn(['a', 'b', 'c'])).toBe('a, b, c');
        expect(joinFn([1, 2, 3])).toBe('1, 2, 3');
      });

      it('should return non-array values unchanged', () => {
        const joinFn = service.getFunction('join')!;
        expect(joinFn('string')).toBe('string');
        expect(joinFn(123)).toBe(123);
      });
    });

    describe('formatDate', () => {
      it('should format Date objects to ISO string', () => {
        const formatDateFn = service.getFunction('formatDate')!;
        const date = new Date('2024-01-15T10:30:00Z');
        expect(formatDateFn(date)).toBe('2024-01-15T10:30:00.000Z');
      });

      it('should format date strings to ISO string', () => {
        const formatDateFn = service.getFunction('formatDate')!;
        expect(formatDateFn('2024-01-15')).toMatch(/2024-01-15T/);
      });

      it('should format timestamps to ISO string', () => {
        const formatDateFn = service.getFunction('formatDate')!;
        const timestamp = new Date('2024-01-15T10:30:00Z').getTime();
        expect(formatDateFn(timestamp)).toBe('2024-01-15T10:30:00.000Z');
      });

      it('should return original value if formatting fails', () => {
        const formatDateFn = service.getFunction('formatDate')!;
        expect(formatDateFn('invalid date')).toBe('invalid date');
      });

      it('should return non-date values unchanged', () => {
        const formatDateFn = service.getFunction('formatDate')!;
        expect(formatDateFn({ name: 'test' })).toEqual({ name: 'test' });
      });
    });

    describe('removeNullish', () => {
      it('should remove null and undefined values from objects', () => {
        const removeNullishFn = service.getFunction('removeNullish')!;
        const obj = { a: 1, b: null, c: undefined, d: 'test', e: 0 };
        expect(removeNullishFn(obj)).toEqual({ a: 1, d: 'test', e: 0 });
      });

      it('should return non-object values unchanged', () => {
        const removeNullishFn = service.getFunction('removeNullish')!;
        expect(removeNullishFn('string')).toBe('string');
        expect(removeNullishFn(123)).toBe(123);
        expect(removeNullishFn(null)).toBe(null);
      });

      it('should return arrays unchanged', () => {
        const removeNullishFn = service.getFunction('removeNullish')!;
        const arr = [1, null, 3];
        expect(removeNullishFn(arr)).toEqual(arr);
      });
    });
  });
});
